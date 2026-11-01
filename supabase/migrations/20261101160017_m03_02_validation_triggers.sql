-- M03 migration 2 — validation functions, polymorphic references, lifecycle, uniqueness, last Reviewer
-- (Physical Schema §5.4.1, §5.6, §5.9, §6, §8; S4 §8; tasks M03 T169; research R-27).
-- Rules that need a nice message for the editor (checkpoint name uniqueness, mode change while audio/video
-- exist) are enforced by the save commands under a lock (migration 3c); the triggers here are the backstop.

-- ---------------------------------------------------------------------------
-- Shape helpers (pure)
-- ---------------------------------------------------------------------------

-- A present text value: a JSON string, at most p_max characters after trim, without CR/LF on single-line
-- fields (PT-08, PT-09; DAC-M03-087, 088). Absent (SQL null or JSON null) is fine: missing content only
-- blocks publication (BR-M03-C03, L01).
create function app.text_ok(p_value jsonb, p_max integer, p_single_line boolean) returns boolean
language sql immutable parallel safe
set search_path = ''
as $$
  select p_value is null
    or jsonb_typeof(p_value) = 'null'
    or (
      jsonb_typeof(p_value) = 'string'
      and app.text_len(p_value #>> '{}') <= p_max
      and (not p_single_line or (p_value #>> '{}') !~ '[\r\n]')
    )
$$;

create function app.is_uuid_text(p_value jsonb) returns boolean
language sql immutable parallel safe
set search_path = ''
as $$
  select jsonb_typeof(p_value) = 'string'
    and (p_value #>> '{}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
$$;

create function app.non_empty_text(p_value jsonb) returns boolean
language sql immutable parallel safe
set search_path = ''
as $$ select jsonb_typeof(p_value) = 'string' and app.text_len(p_value #>> '{}') > 0 $$;

-- Field keys (targetFieldKey form) of a bilingual object that break the shape or the limit
create function app.bilingual_problems(p_object jsonb, p_key text, p_max integer, p_single_line boolean)
returns text[]
language plpgsql immutable parallel safe
set search_path = ''
as $$
declare
  v_problems text[] := '{}';
  v_key text;
begin
  if p_object is null or jsonb_typeof(p_object) = 'null' then
    return v_problems;
  end if;
  if jsonb_typeof(p_object) <> 'object' then
    return array[p_key];
  end if;
  for v_key in select jsonb_object_keys(p_object) loop
    if v_key not in ('vi', 'en') then
      v_problems := v_problems || p_key;
    end if;
  end loop;
  foreach v_key in array array['vi', 'en'] loop
    if not app.text_ok(p_object -> v_key, p_max, p_single_line) then
      v_problems := v_problems || (p_key || '.' || v_key);
    end if;
  end loop;
  return v_problems;
end;
$$;

-- Distinct enum values in a JSON array
create function app.enum_array_ok(p_value jsonb, p_allowed text[]) returns boolean
language sql immutable parallel safe
set search_path = ''
as $$
  select p_value is null
    or jsonb_typeof(p_value) = 'null'
    or (
      jsonb_typeof(p_value) = 'array'
      and not exists (
        select 1 from jsonb_array_elements(p_value) as e(item)
        where jsonb_typeof(e.item) <> 'string' or (e.item #>> '{}') <> all (p_allowed)
      )
      and (select count(distinct e.item) = count(*) from jsonb_array_elements(p_value) as e(item))
    )
$$;

-- ---------------------------------------------------------------------------
-- Revision content (§5.4.1): save-time shape and limits only; publication requirements are checked by the
-- publish command. Returns the failing field keys (empty = valid) so restore can list what no longer fits.
-- ---------------------------------------------------------------------------

create function app.revision_content_problems(p_subject_type text, p_content jsonb) returns text[]
language plpgsql immutable
set search_path = ''
as $$
declare
  v text[] := '{}';
  v_key text;
  v_item jsonb;
  v_index integer;
  v_number numeric;
  v_ids text[];
  v_allowed text[];
begin
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    return array['content'];
  end if;

  v_allowed := case p_subject_type
    when 'ROUTE' then array[
      'name', 'shortDescription', 'description', 'startingPoint', 'participationRequirements', 'preparation',
      'bestTime', 'safetyWarning', 'noSafetyWarningConfirmed', 'distanceKm', 'durationMin', 'difficulty',
      'groupTags', 'experienceTags', 'thumbnailMediaId', 'galleryItems', 'routeMapMediaId', 'routeMapCaption',
      'offlineRouteMapRequired', 'checkpointList', 'highlights']
    when 'CHECKPOINT' then array[
      'checkpointName', 'connectivityMode', 'fieldVerificationConfirmed', 'fieldVerifiedByUserId', 'fieldVerifiedAt']
    when 'QRCODE' then array['objectName', 'introductionText', 'mediaItems']
    else array[]::text[]
  end;
  for v_key in select jsonb_object_keys(p_content) loop
    if v_key <> all (v_allowed) then
      v := v || v_key;
    end if;
  end loop;

  if p_subject_type = 'ROUTE' then
    -- DAC-M03-023–030, 087, 088: text limits; names are single-line
    v := v
      || app.bilingual_problems(p_content -> 'name', 'name', app.limit('NAME_MAX_CHARS'), true)
      || app.bilingual_problems(p_content -> 'shortDescription', 'shortDescription', app.limit('ROUTE_SHORT_DESC_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'description', 'description', app.limit('ROUTE_DESC_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'startingPoint', 'startingPoint', app.limit('ROUTE_START_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'participationRequirements', 'participationRequirements', app.limit('ROUTE_PARTICIPATION_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'preparation', 'preparation', app.limit('ROUTE_PREPARATION_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'bestTime', 'bestTime', app.limit('ROUTE_BEST_TIME_MAX_CHARS'), false)
      || app.bilingual_problems(p_content -> 'safetyWarning', 'safetyWarning', app.limit('ROUTE_SAFETY_WARNING_MAX_CHARS'), false);

    -- Required booleans (S4 Route content)
    if jsonb_typeof(p_content -> 'noSafetyWarningConfirmed') is distinct from 'boolean' then
      v := v || 'noSafetyWarningConfirmed'::text;
    end if;
    if jsonb_typeof(p_content -> 'offlineRouteMapRequired') is distinct from 'boolean' then
      v := v || 'offlineRouteMapRequired'::text;
    -- DAC-M03-040: the tick only while a route map exists
    elsif (p_content -> 'offlineRouteMapRequired')::boolean and p_content -> 'routeMapMediaId' is null then
      v := v || 'offlineRouteMapRequired'::text;
    end if;

    -- DAC-M03-032: distance > 0, ≤ ROUTE_DISTANCE_MAX_KM, one decimal; duration integer > 0, ≤ ROUTE_DURATION_MAX_MIN
    if p_content ? 'distanceKm' then
      if jsonb_typeof(p_content -> 'distanceKm') <> 'number' then
        v := v || 'distanceKm'::text;
      else
        v_number := (p_content ->> 'distanceKm')::numeric;
        if v_number <= 0 or v_number > app.limit('ROUTE_DISTANCE_MAX_KM') or round(v_number, 1) <> v_number then
          v := v || 'distanceKm'::text;
        end if;
      end if;
    end if;
    if p_content ? 'durationMin' then
      if jsonb_typeof(p_content -> 'durationMin') <> 'number' then
        v := v || 'durationMin'::text;
      else
        v_number := (p_content ->> 'durationMin')::numeric;
        if v_number <= 0 or v_number > app.limit('ROUTE_DURATION_MAX_MIN') or trunc(v_number) <> v_number then
          v := v || 'durationMin'::text;
        end if;
      end if;
    end if;

    -- DAC-M03-033–035: enums, distinct tags, no contradictory combination
    if p_content ? 'difficulty' and not coalesce((p_content ->> 'difficulty') = any (array['NHE', 'TRUNG_BINH', 'KHO']), false) then
      v := v || 'difficulty'::text;
    end if;
    if not app.enum_array_ok(p_content -> 'groupTags', array['GROUP_CA_NHAN_NGUOI_LON', 'GROUP_GIA_DINH_CO_TRE', 'GROUP_CAN_DE_DANG']) then
      v := v || 'groupTags'::text;
    end if;
    if not app.enum_array_ok(p_content -> 'experienceTags', array['INTEREST_THIEN_NHIEN_CHUP_ANH', 'INTEREST_TIM_HIEU', 'INTEREST_KHAM_PHA']) then
      v := v || 'experienceTags'::text;
    end if;
    if p_content ->> 'difficulty' = 'KHO'
      and jsonb_typeof(p_content -> 'groupTags') = 'array'
      and (p_content -> 'groupTags') ?| array['GROUP_GIA_DINH_CO_TRE', 'GROUP_CAN_DE_DANG'] then
      v := v || 'groupTags'::text;
    end if;

    -- DAC-M03-036–039: image references are media ids (owner/usage checked by trigger below)
    if p_content ? 'thumbnailMediaId' and not app.is_uuid_text(p_content -> 'thumbnailMediaId') then
      v := v || 'thumbnailMediaId'::text;
    end if;
    if p_content ? 'routeMapMediaId' and not app.is_uuid_text(p_content -> 'routeMapMediaId') then
      v := v || 'routeMapMediaId'::text;
    end if;
    v := v || app.bilingual_problems(p_content -> 'routeMapCaption', 'routeMapCaption', app.limit('CAPTION_MAX_CHARS'), true);
    if p_content -> 'routeMapCaption' is not null and p_content -> 'routeMapMediaId' is null then
      v := v || 'routeMapCaption'::text;
    end if;
    if p_content ? 'galleryItems' then
      if jsonb_typeof(p_content -> 'galleryItems') <> 'array'
        or jsonb_array_length(p_content -> 'galleryItems') > app.limit('ROUTE_GALLERY_MAX_IMAGES') then
        v := v || 'galleryItems'::text;
      else
        for v_item, v_index in select e.item, e.ord - 1 from jsonb_array_elements(p_content -> 'galleryItems') with ordinality as e(item, ord) loop
          if jsonb_typeof(v_item) <> 'object' or not app.is_uuid_text(v_item -> 'mediaId')
            or exists (select 1 from jsonb_object_keys(v_item) as k(key) where k.key not in ('mediaId', 'caption')) then
            v := v || ('galleryItems.' || v_index);
          else
            v := v || app.bilingual_problems(v_item -> 'caption', 'galleryCaption.' || v_index, app.limit('CAPTION_MAX_CHARS'), true);
          end if;
        end loop;
      end if;
    end if;

    -- DAC-M03-041: list ≤ ROUTE_CHECKPOINTS_MAX_ITEMS, a checkpoint at most once
    if p_content ? 'checkpointList' then
      if jsonb_typeof(p_content -> 'checkpointList') <> 'array'
        or jsonb_array_length(p_content -> 'checkpointList') > app.limit('ROUTE_CHECKPOINTS_MAX_ITEMS') then
        v := v || 'checkpointList'::text;
      else
        select array_agg(e.item ->> 'checkpointId') into v_ids from jsonb_array_elements(p_content -> 'checkpointList') as e(item);
        if exists (
            select 1 from jsonb_array_elements(p_content -> 'checkpointList') as e(item)
            where jsonb_typeof(e.item) <> 'object' or not app.non_empty_text(e.item -> 'checkpointId')
              or exists (select 1 from jsonb_object_keys(e.item) as k(key) where k.key <> 'checkpointId'))
          or (select count(distinct x) from unnest(coalesce(v_ids, '{}')) as x) <> coalesce(array_length(v_ids, 1), 0) then
          v := v || 'checkpointList'::text;
        end if;
      end if;
    end if;

    -- DAC-M03-043: ≤ ROUTE_HIGHLIGHTS_MAX_ITEMS items of ≤ ROUTE_HIGHLIGHT_MAX_CHARS. A one-language item is a
    -- draft and blocks only publication (spec-M03 BR-M03-C06 wins over the stricter S4/Physical wording).
    if p_content ? 'highlights' then
      if jsonb_typeof(p_content -> 'highlights') <> 'array'
        or jsonb_array_length(p_content -> 'highlights') > app.limit('ROUTE_HIGHLIGHTS_MAX_ITEMS') then
        v := v || 'highlights'::text;
      else
        for v_item, v_index in select e.item, e.ord - 1 from jsonb_array_elements(p_content -> 'highlights') with ordinality as e(item, ord) loop
          v := v || app.bilingual_problems(v_item, 'highlights.' || v_index, app.limit('ROUTE_HIGHLIGHT_MAX_CHARS'), true);
        end loop;
      end if;
    end if;

  elsif p_subject_type = 'CHECKPOINT' then
    -- DAC-M03-045, 047, 048, 088
    v := v || app.bilingual_problems(p_content -> 'checkpointName', 'checkpointName', app.limit('NAME_MAX_CHARS'), true);
    if p_content ? 'connectivityMode'
      and not coalesce((p_content ->> 'connectivityMode') = any (array['ONLINE_AVAILABLE', 'OFFLINE_REQUIRED']), false) then
      v := v || 'connectivityMode'::text;
    end if;
    if p_content ? 'fieldVerificationConfirmed' and jsonb_typeof(p_content -> 'fieldVerificationConfirmed') <> 'boolean' then
      v := v || 'fieldVerificationConfirmed'::text;
    end if;
    if p_content ->> 'connectivityMode' = 'ONLINE_AVAILABLE' and (
        (p_content -> 'fieldVerificationConfirmed') is distinct from 'true'::jsonb
        or not app.non_empty_text(p_content -> 'fieldVerifiedByUserId')
        or not app.non_empty_text(p_content -> 'fieldVerifiedAt')) then
      v := v || 'fieldVerificationConfirmed'::text;
    end if;

  elsif p_subject_type = 'QRCODE' then
    -- DAC-M03-051–053, 087, 088. Below QR_INTRO_MIN_CHARS is "incomplete" and blocks only publication
    -- (DAC-M03-052); the image/audio-video split needs the media rows and is checked by trigger below.
    v := v
      || app.bilingual_problems(p_content -> 'objectName', 'objectName', app.limit('NAME_MAX_CHARS'), true)
      || app.bilingual_problems(p_content -> 'introductionText', 'introductionText', app.limit('QR_INTRO_MAX_CHARS'), false);
    if p_content ? 'mediaItems' then
      if jsonb_typeof(p_content -> 'mediaItems') <> 'array'
        or jsonb_array_length(p_content -> 'mediaItems') > app.limit('QR_MAX_IMAGES') + app.limit('QR_MAX_AV_FILES')
        or exists (
          select 1 from jsonb_array_elements(p_content -> 'mediaItems') as e(item)
          where jsonb_typeof(e.item) <> 'object' or not app.is_uuid_text(e.item -> 'mediaId')
            or exists (select 1 from jsonb_object_keys(e.item) as k(key) where k.key <> 'mediaId'))
        or (select count(distinct e.item ->> 'mediaId') <> count(*) from jsonb_array_elements(p_content -> 'mediaItems') as e(item)) then
        v := v || 'mediaItems'::text;
      end if;
    end if;
  else
    v := v || 'subjectType'::text;
  end if;

  return v;
end;
$$;

create function app.revision_content_ok(p_subject_type text, p_content jsonb) returns boolean
language sql immutable
set search_path = ''
as $$ select cardinality(app.revision_content_problems(p_subject_type, p_content)) = 0 $$;

-- BEFORE INSERT OR UPDATE OF content, not a table CHECK: a status-only update of an older revision is never
-- re-checked against limits changed later (R-27). Restore catches this error to answer MSG-RESTORE-BLOCKED.
create function app.tg_revision_content() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_problems text[] := app.revision_content_problems(new.subject_type, new.content);
begin
  if cardinality(v_problems) > 0 then
    raise exception 'REVISION_CONTENT_INVALID'
      using errcode = 'check_violation', detail = array_to_json(v_problems)::text;
  end if;
  return new;
end;
$$;

create trigger revisions_content_ok before insert or update of content on app.revisions
  for each row execute function app.tg_revision_content();

-- ---------------------------------------------------------------------------
-- Snapshot and session shapes (§5.6, §5.9)
-- ---------------------------------------------------------------------------

create function app.bilingual_complete(p_value jsonb) returns boolean
language sql immutable parallel safe
set search_path = ''
as $$
  select jsonb_typeof(p_value) = 'object'
    and app.non_empty_text(p_value -> 'vi') and app.non_empty_text(p_value -> 'en')
    and not exists (select 1 from jsonb_object_keys(p_value) as k(key) where k.key not in ('vi', 'en'))
$$;

-- DAC-M03-063–065: unique ids and sequences; non-empty names; active identifiers; one offline resource per
-- identifier exactly for OFFLINE_REQUIRED, unique within the snapshot. No audio/video key exists in the shape.
create function app.snapshot_checkpoints_ok(p_checkpoints jsonb) returns boolean
language plpgsql immutable
set search_path = ''
as $$
declare
  v_checkpoint jsonb;
  v_resource jsonb;
  v_ids text[];
  v_resource_ids text[];
  v_all_resource_ids text[] := '{}';
begin
  if jsonb_typeof(p_checkpoints) <> 'array' then
    return false;
  end if;
  if (select count(distinct e.item ->> 'checkpointId') <> count(*) or count(distinct e.item -> 'sequence') <> count(*)
      from jsonb_array_elements(p_checkpoints) as e(item)) then
    return false;
  end if;
  for v_checkpoint in select e.item from jsonb_array_elements(p_checkpoints) as e(item) loop
    if jsonb_typeof(v_checkpoint) <> 'object'
      or exists (select 1 from jsonb_object_keys(v_checkpoint) as k(key)
                 where k.key not in ('checkpointId', 'sequence', 'checkpointName', 'connectivityMode', 'qrIdentifiers', 'offlineResources'))
      or not app.non_empty_text(v_checkpoint -> 'checkpointId')
      or jsonb_typeof(v_checkpoint -> 'sequence') <> 'number'
      or (v_checkpoint ->> 'sequence')::numeric < 1
      or trunc((v_checkpoint ->> 'sequence')::numeric) <> (v_checkpoint ->> 'sequence')::numeric
      or not app.bilingual_complete(v_checkpoint -> 'checkpointName')
      or not coalesce((v_checkpoint ->> 'connectivityMode') = any (array['ONLINE_AVAILABLE', 'OFFLINE_REQUIRED']), false)
      or jsonb_typeof(v_checkpoint -> 'qrIdentifiers') <> 'array'
      or jsonb_array_length(v_checkpoint -> 'qrIdentifiers') = 0 then
      return false;
    end if;
    select array_agg(e.item #>> '{}') into v_ids from jsonb_array_elements(v_checkpoint -> 'qrIdentifiers') as e(item);
    if exists (select 1 from jsonb_array_elements(v_checkpoint -> 'qrIdentifiers') as e(item) where not app.non_empty_text(e.item))
      or (select count(distinct x) from unnest(v_ids) as x) <> array_length(v_ids, 1) then
      return false;
    end if;

    if v_checkpoint ->> 'connectivityMode' = 'ONLINE_AVAILABLE' then
      if v_checkpoint ? 'offlineResources' then
        return false;
      end if;
      continue;
    end if;
    if jsonb_typeof(v_checkpoint -> 'offlineResources') is distinct from 'array' then
      return false;
    end if;
    v_resource_ids := '{}';
    for v_resource in select e.item from jsonb_array_elements(v_checkpoint -> 'offlineResources') as e(item) loop
      if jsonb_typeof(v_resource) <> 'object'
        or exists (select 1 from jsonb_object_keys(v_resource) as k(key)
                   where k.key not in ('qrIdentifier', 'objectName', 'localizedContent', 'staticImages'))
        or not app.non_empty_text(v_resource -> 'qrIdentifier')
        or not app.bilingual_complete(v_resource -> 'objectName')
        or not app.non_empty_text(v_resource #> '{localizedContent,vi,introductionText}')
        or not app.non_empty_text(v_resource #> '{localizedContent,en,introductionText}')
        or jsonb_typeof(v_resource -> 'staticImages') <> 'array'
        or exists (select 1 from jsonb_array_elements(v_resource -> 'staticImages') as e(item) where not app.non_empty_text(e.item)) then
        return false;
      end if;
      v_resource_ids := v_resource_ids || (v_resource ->> 'qrIdentifier');
    end loop;
    -- exactly one resource per identifier of this checkpoint
    if (select count(distinct x) from unnest(v_resource_ids) as x) <> coalesce(array_length(v_resource_ids, 1), 0)
      or not (v_resource_ids <@ v_ids and v_ids <@ v_resource_ids) then
      return false;
    end if;
    v_all_resource_ids := v_all_resource_ids || v_resource_ids;
  end loop;
  -- identifiers of offline resources are unique within the snapshot
  return (select count(distinct x) from unnest(v_all_resource_ids) as x) = coalesce(array_length(v_all_resource_ids, 1), 0);
end;
$$;

-- DAC-M03-066: sourceRef required; optional caption complete in both languages, ≤ CAPTION_MAX_CHARS
create function app.offline_route_map_ok(p_map jsonb) returns boolean
language sql immutable
set search_path = ''
as $$
  select p_map is null or (
    jsonb_typeof(p_map) = 'object'
    and app.non_empty_text(p_map -> 'sourceRef')
    and not exists (select 1 from jsonb_object_keys(p_map) as k(key) where k.key not in ('sourceRef', 'caption'))
    and (
      p_map -> 'caption' is null
      or (app.bilingual_complete(p_map -> 'caption')
          and app.text_len(p_map #>> '{caption,vi}') <= app.limit('CAPTION_MAX_CHARS')
          and app.text_len(p_map #>> '{caption,en}') <= app.limit('CAPTION_MAX_CHARS'))
    )
  )
$$;

alter table app.journey_snapshots
  add constraint journey_snapshots_checkpoints_ok check (app.snapshot_checkpoints_ok(checkpoints)),
  add constraint journey_snapshots_offline_route_map_ok check (app.offline_route_map_ok(offline_route_map));

-- DAC-M03-079, 080: array (may be empty); unique checkpointId; exactly the four allowlisted keys per visit.
-- Matching visits to the snapshot and to the session interval is the intake function's job (§7.2).
create function app.visits_ok(p_visits jsonb) returns boolean
language plpgsql stable
set search_path = ''
as $$
declare
  v_visit jsonb;
  v_keys text[];
begin
  if jsonb_typeof(p_visits) <> 'array' then
    return false;
  end if;
  if (select count(distinct e.item ->> 'checkpointId') <> count(*) from jsonb_array_elements(p_visits) as e(item)) then
    return false;
  end if;
  for v_visit in select e.item from jsonb_array_elements(p_visits) as e(item) loop
    if jsonb_typeof(v_visit) <> 'object' then
      return false;
    end if;
    select array_agg(k.key order by k.key) into v_keys from jsonb_object_keys(v_visit) as k(key);
    if v_keys is distinct from array['checkedInAt', 'checkpointId', 'checkpointName', 'sequence']
      or not app.non_empty_text(v_visit -> 'checkpointId')
      or not app.non_empty_text(v_visit -> 'checkpointName')
      or jsonb_typeof(v_visit -> 'sequence') <> 'number'
      or (v_visit ->> 'sequence')::numeric < 1
      or trunc((v_visit ->> 'sequence')::numeric) <> (v_visit ->> 'sequence')::numeric
      or jsonb_typeof(v_visit -> 'checkedInAt') <> 'string' then
      return false;
    end if;
    begin
      perform (v_visit ->> 'checkedInAt')::timestamptz;
    exception when others then
      return false;
    end;
  end loop;
  return true;
end;
$$;

alter table app.session_records add constraint session_records_visits_ok check (app.visits_ok(visited_checkpoints));

-- ---------------------------------------------------------------------------
-- Lifecycle transitions (S4 §8). Arguments: 'INSERT:STATUS' initial states, 'FROM>TO' allowed changes,
-- 'FROZEN:STATUS' states in which the row may not change at all.
-- ---------------------------------------------------------------------------

create function app.tg_status_transition() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_old_status text := case when tg_op = 'UPDATE' then to_jsonb(old) ->> 'status' end;
  v_new_status text := to_jsonb(new) ->> 'status';
begin
  if tg_op = 'INSERT' then
    if ('INSERT:' || v_new_status) <> all (tg_argv) then
      raise exception 'app.%: cannot be created in status %', tg_table_name, v_new_status using errcode = 'check_violation';
    end if;
    return new;
  end if;
  if ('FROZEN:' || v_old_status) = any (tg_argv) then
    raise exception 'app.%: a row in status % cannot change', tg_table_name, v_old_status using errcode = 'restrict_violation';
  end if;
  if v_old_status is distinct from v_new_status and (v_old_status || '>' || v_new_status) <> all (tg_argv) then
    raise exception 'app.%: transition % -> % is not allowed', tg_table_name, v_old_status, v_new_status
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger routes_status before insert or update on app.routes
  for each row execute function app.tg_status_transition(
    'INSERT:NHAP', 'NHAP>HOAT_DONG', 'NHAP>LUU_TRU', 'HOAT_DONG>TAM_DONG', 'TAM_DONG>HOAT_DONG', 'TAM_DONG>LUU_TRU',
    'FROZEN:LUU_TRU');
create trigger checkpoints_status before insert or update on app.checkpoints
  for each row execute function app.tg_status_transition(
    'INSERT:NHAP', 'NHAP>HOAT_DONG', 'NHAP>LUU_TRU', 'HOAT_DONG>TAM_DONG', 'TAM_DONG>HOAT_DONG', 'TAM_DONG>LUU_TRU',
    'FROZEN:LUU_TRU');
create trigger qr_codes_status before insert or update on app.qr_codes
  for each row execute function app.tg_status_transition(
    'INSERT:NHAP', 'NHAP>HOAT_DONG', 'NHAP>THU_HOI', 'HOAT_DONG>THU_HOI', 'FROZEN:THU_HOI');
create trigger admin_accounts_status before insert or update on app.admin_accounts
  for each row execute function app.tg_status_transition(
    'INSERT:INVITATION_PENDING', 'INVITATION_PENDING>ACTIVE', 'ACTIVE>DEACTIVATED', 'DEACTIVATED>ACTIVE');
create trigger revisions_status before insert or update on app.revisions
  for each row execute function app.tg_status_transition(
    'INSERT:NHAP', 'NHAP>PHAT_HANH', 'NHAP>DA_BO', 'PHAT_HANH>LUU_TRU', 'FROZEN:LUU_TRU', 'FROZEN:DA_BO');

-- Only a pending draft's content can be edited; a published revision only moves to LUU_TRU (§5.4)
create function app.tg_revision_content_frozen() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.content is distinct from old.content and not (old.status = 'NHAP' and new.status = 'NHAP') then
    raise exception 'app.revisions: content of a % revision is immutable', old.status using errcode = 'restrict_violation';
  end if;
  return new;
end;
$$;

create trigger revisions_content_frozen before update of content on app.revisions
  for each row execute function app.tg_revision_content_frozen();

-- ---------------------------------------------------------------------------
-- Polymorphic references (Physical §6: REL-004, 023, 024–026)
-- ---------------------------------------------------------------------------

create function app.subject_exists(p_type text, p_id text) returns boolean
language sql stable
set search_path = ''
as $$
  select case p_type
    when 'ROUTE' then exists (select 1 from app.routes where route_id = p_id)
    when 'CHECKPOINT' then exists (select 1 from app.checkpoints where checkpoint_id = p_id)
    when 'QRCODE' then exists (select 1 from app.qr_codes where qr_identifier = p_id)
    else false
  end
$$;

create function app.tg_revision_subject() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not app.subject_exists(new.subject_type, new.subject_id) then
    raise exception 'app.revisions: subject %/% does not exist', new.subject_type, new.subject_id using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger revisions_subject before insert on app.revisions
  for each row execute function app.tg_revision_subject();

create function app.tg_media_owner() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not app.subject_exists(new.owner_type, new.owner_id) then
    raise exception 'app.media: owner %/% does not exist', new.owner_type, new.owner_id using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger media_owner before insert on app.media
  for each row execute function app.tg_media_owner();

-- ---------------------------------------------------------------------------
-- Cross-row content rules (§5.4.1 last paragraph; REL-022, REL-027; DAC-M03-036, 037, 039, 041, 053)
-- ---------------------------------------------------------------------------

-- Saved connectivity mode of a checkpoint: the pending draft if any, else the published revision
create function app.checkpoint_saved_mode(p_checkpoint_id text) returns text
language sql stable
set search_path = ''
as $$
  select r.content ->> 'connectivityMode'
  from app.revisions r
  where r.subject_type = 'CHECKPOINT' and r.subject_id = p_checkpoint_id and r.status in ('NHAP', 'PHAT_HANH')
  order by (r.status = 'NHAP') desc
  limit 1
$$;

create function app.tg_revision_references() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_slot record;
  v_media app.media;
  v_checkpoint_id text;
  v_listed text[];
  v_known text[];
  v_images integer := 0;
  v_av integer := 0;
  v_route_status text;
begin
  if tg_op = 'UPDATE' and new.content is not distinct from old.content then
    return null;
  end if;

  if new.subject_type = 'ROUTE' then
    -- every image is a route media of this route, in the right slot
    for v_slot in
      select new.content ->> 'thumbnailMediaId' as media_id, 'ROUTE_THUMBNAIL' as usage
      where new.content ? 'thumbnailMediaId'
      union all
      select e.item ->> 'mediaId', 'ROUTE_GALLERY' from jsonb_array_elements(coalesce(new.content -> 'galleryItems', '[]')) as e(item)
      union all
      select new.content ->> 'routeMapMediaId', 'ROUTE_MAP' where new.content ? 'routeMapMediaId'
    loop
      select * into v_media from app.media where media_id = v_slot.media_id::uuid;
      if v_media.media_id is null or v_media.owner_type <> 'ROUTE' or v_media.owner_id <> new.subject_id or v_media.usage <> v_slot.usage then
        raise exception 'app.revisions: route media % is not a % of route %', v_slot.media_id, v_slot.usage, new.subject_id
          using errcode = 'foreign_key_violation';
      end if;
    end loop;

    -- listed checkpoints exist; none archived while the route is not archived; a newly added one is active
    select coalesce(array_agg(e.item ->> 'checkpointId'), '{}') into v_listed
    from jsonb_array_elements(coalesce(new.content -> 'checkpointList', '[]')) as e(item);
    select status into v_route_status from app.routes where route_id = new.subject_id;
    select coalesce(array_agg(distinct x), '{}') into v_known
    from (
      select e.item ->> 'checkpointId' as x
      from app.revisions r, jsonb_array_elements(coalesce(r.content -> 'checkpointList', '[]')) as e(item)
      where r.subject_type = 'ROUTE' and r.subject_id = new.subject_id and r.status in ('NHAP', 'PHAT_HANH')
        and r.revision_id <> new.revision_id
      union all
      select e.item ->> 'checkpointId'
      from jsonb_array_elements(case when tg_op = 'UPDATE' then coalesce(old.content -> 'checkpointList', '[]') else '[]' end) as e(item)
    ) as known;
    if exists (
        select 1 from unnest(v_listed) as l(id)
        left join app.checkpoints c on c.checkpoint_id = l.id
        where c.checkpoint_id is null
          or (c.status = 'LUU_TRU' and v_route_status <> 'LUU_TRU')
          or (c.status <> 'HOAT_DONG' and l.id <> all (v_known))) then
      raise exception 'app.revisions: route % lists a missing, archived or not active new checkpoint', new.subject_id
        using errcode = 'foreign_key_violation';
    end if;

  elsif new.subject_type = 'QRCODE' then
    select checkpoint_id into v_checkpoint_id from app.qr_codes where qr_identifier = new.subject_id;
    for v_media in
      select m.* from jsonb_array_elements(coalesce(new.content -> 'mediaItems', '[]')) as e(item)
      left join app.media m on m.media_id = (e.item ->> 'mediaId')::uuid
    loop
      if v_media.media_id is null or v_media.owner_type <> 'CHECKPOINT' or v_media.owner_id <> v_checkpoint_id
        or v_media.usage <> 'QR_MEDIA' then
        raise exception 'app.revisions: QR media is not a QR_MEDIA of checkpoint %', v_checkpoint_id
          using errcode = 'foreign_key_violation';
      end if;
      if v_media.type = 'IMAGE' then v_images := v_images + 1; else v_av := v_av + 1; end if;
    end loop;
    if v_images > app.limit('QR_MAX_IMAGES') or v_av > app.limit('QR_MAX_AV_FILES') then
      raise exception 'app.revisions: QR media count above limits' using errcode = 'check_violation';
    end if;
    -- audio/video only for ONLINE_AVAILABLE checkpoints (BR-M03-E04, DAC-M03-053)
    if v_av > 0 and app.checkpoint_saved_mode(v_checkpoint_id) is distinct from 'ONLINE_AVAILABLE' then
      raise exception 'app.revisions: audio/video on a checkpoint that is not ONLINE_AVAILABLE' using errcode = 'check_violation';
    end if;
  end if;
  return null;
end;
$$;

create constraint trigger revisions_references after insert or update of content on app.revisions
  for each row execute function app.tg_revision_references();

-- ---------------------------------------------------------------------------
-- QR rules (DAC-M03-012, 015, 089)
-- ---------------------------------------------------------------------------

create function app.tg_qr_codes_rules() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- created only for a checkpoint with a saved connectivity mode, never for an archived one
    if app.checkpoint_saved_mode(new.checkpoint_id) is null
      or exists (select 1 from app.checkpoints where checkpoint_id = new.checkpoint_id and status = 'LUU_TRU') then
      raise exception 'app.qr_codes: checkpoint % has no saved connectivity mode or is archived', new.checkpoint_id
        using errcode = 'check_violation';
    end if;
  end if;
  if (select count(*) from app.qr_codes where checkpoint_id = new.checkpoint_id and status <> 'THU_HOI')
      > app.limit('CHECKPOINT_QR_MAX_ITEMS') then
    raise exception 'app.qr_codes: checkpoint % has more than % visit points', new.checkpoint_id, app.limit('CHECKPOINT_QR_MAX_ITEMS')
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create trigger qr_codes_rules after insert or update of status on app.qr_codes
  for each row execute function app.tg_qr_codes_rules();

-- An active checkpoint keeps at least one active QR (DAC-M03-015, BR-M03-E11), checked at commit
create function app.tg_checkpoint_keeps_active_qr() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- both app.qr_codes and app.checkpoints carry checkpoint_id
  v_checkpoint_id text := new.checkpoint_id;
begin
  if exists (select 1 from app.checkpoints where checkpoint_id = v_checkpoint_id and status = 'HOAT_DONG')
    and not exists (select 1 from app.qr_codes where checkpoint_id = v_checkpoint_id and status = 'HOAT_DONG') then
    raise exception 'app.checkpoints: active checkpoint % has no active visit point', v_checkpoint_id
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger qr_codes_keep_active after update of status on app.qr_codes
  deferrable initially deferred
  for each row execute function app.tg_checkpoint_keeps_active_qr();
create constraint trigger checkpoints_keep_active_qr after update of status on app.checkpoints
  deferrable initially deferred
  for each row execute function app.tg_checkpoint_keeps_active_qr();

-- ---------------------------------------------------------------------------
-- Checkpoint archive (BR-M03-D10): only when no non-archived route lists it (published or pending draft)
-- ---------------------------------------------------------------------------

create function app.routes_listing(p_checkpoint_id text) returns setof text
language sql stable
set search_path = ''
as $$
  select distinct r.subject_id
  from app.revisions r
  join app.routes ro on ro.route_id = r.subject_id
  where r.subject_type = 'ROUTE' and r.status in ('NHAP', 'PHAT_HANH') and ro.status <> 'LUU_TRU'
    and r.content -> 'checkpointList' @> jsonb_build_array(jsonb_build_object('checkpointId', p_checkpoint_id))
$$;

create function app.tg_checkpoint_archive() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'LUU_TRU' and old.status <> 'LUU_TRU' and exists (select 1 from app.routes_listing(new.checkpoint_id)) then
    raise exception 'app.checkpoints: checkpoint % is listed by a non-archived route', new.checkpoint_id
      using errcode = 'restrict_violation';
  end if;
  return new;
end;
$$;

create trigger checkpoints_archive before update of status on app.checkpoints
  for each row execute function app.tg_checkpoint_archive();

-- ---------------------------------------------------------------------------
-- Route active version is the highest snapshot (DAC-M03-006, REL-006), checked at commit
-- ---------------------------------------------------------------------------

create function app.tg_route_active_is_latest() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_route_id text := new.route_id;
  v_active integer;
  v_latest integer;
begin
  select active_content_version into v_active from app.routes where route_id = v_route_id;
  select max(content_version) into v_latest from app.journey_snapshots where route_id = v_route_id;
  if v_latest is not null and v_active is distinct from v_latest
    and exists (select 1 from app.routes where route_id = v_route_id and status <> 'LUU_TRU') then
    raise exception 'app.routes: active version % of route % is not the latest snapshot %', v_active, v_route_id, v_latest
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create constraint trigger routes_active_is_latest after insert or update of active_content_version on app.routes
  deferrable initially deferred
  for each row execute function app.tg_route_active_is_latest();
create constraint trigger journey_snapshots_route_active after insert on app.journey_snapshots
  deferrable initially deferred
  for each row execute function app.tg_route_active_is_latest();

-- ---------------------------------------------------------------------------
-- Last active Reviewer (BR-M03-K03, DAC-M03-068–071): a role or status change never leaves zero.
-- Commands lock the table first (Physical §8); this statement-level trigger is the backstop.
-- ---------------------------------------------------------------------------

create function app.tg_keep_one_reviewer() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
      select 1 from old_rows o join new_rows n using (email)
      where o.role = 'REVIEWER' and o.status = 'ACTIVE' and not (n.role = 'REVIEWER' and n.status = 'ACTIVE'))
    and not exists (select 1 from app.admin_accounts where role = 'REVIEWER' and status = 'ACTIVE') then
    raise exception 'app.admin_accounts: at least one active Reviewer must remain' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

create trigger admin_accounts_keep_reviewer after update on app.admin_accounts
  referencing old table as old_rows new table as new_rows
  for each statement execute function app.tg_keep_one_reviewer();
