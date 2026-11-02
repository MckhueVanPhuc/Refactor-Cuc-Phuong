-- M03 migration 3d — routes and first publications (tasks M03 T183; admin-command C-01, C-05, Q-02, Q-03, Q-04,
-- Q-08; publication-public-contract §3–§4; research R-07, R-08, R-10, R-26; Physical §5.6, §8;
-- BR-M03-C02–C17, D04, D05, E06, E13, F01–F05, G01–G07, G10, T01–T06, X01–X03).
-- Route issues use the same keys and sentences as src/modules/m03/validation/{route,publishGaps}.ts.
-- Publication units of this migration: ROUTE_FIRST_PUBLICATION, CHECKPOINT_FIRST_PUBLICATION, QR_OBJECT;
-- ROUTE_INFORMATION and CHECKPOINT_REVISION come with migration 3e (US4).

-- ---------------------------------------------------------------------------
-- Display names (spec-M03 §5.4) — copy of src/modules/m03/messages/displayNames.ts, kept equal by sqlCatalog.test.ts
-- ---------------------------------------------------------------------------

create function app.display_name(p_kind text, p_code text) returns text
language sql immutable parallel safe
set search_path = ''
as $$
  select d.name from (values
    ('difficulty', 'NHE', 'Nhẹ'),
    ('difficulty', 'TRUNG_BINH', 'Trung bình'),
    ('difficulty', 'KHO', 'Khó'),
    ('groupTag', 'GROUP_CA_NHAN_NGUOI_LON', 'Cá nhân/người lớn'),
    ('groupTag', 'GROUP_GIA_DINH_CO_TRE', 'Gia đình có trẻ nhỏ'),
    ('groupTag', 'GROUP_CAN_DE_DANG', 'Cần đi dễ dàng'),
    ('experienceTag', 'INTEREST_THIEN_NHIEN_CHUP_ANH', 'Thiên nhiên, chụp ảnh'),
    ('experienceTag', 'INTEREST_TIM_HIEU', 'Tìm hiểu'),
    ('experienceTag', 'INTEREST_KHAM_PHA', 'Khám phá'),
    ('connectivityMode', 'OFFLINE_REQUIRED', 'Cần tải trước'),
    ('connectivityMode', 'ONLINE_AVAILABLE', 'Dùng được khi có mạng')
  ) as d(kind, code, name)
  where d.kind = p_kind and d.code = p_code
$$;

-- ---------------------------------------------------------------------------
-- Small helpers
-- ---------------------------------------------------------------------------

create function app.has_text(p_value jsonb) returns boolean
language sql immutable
set search_path = ''
as $$ select not app.is_blank(p_value -> 'vi') or not app.is_blank(p_value -> 'en') $$;

-- Both languages after trim, or null (an optional bilingual value is published only when complete)
-- No SET clause, so it can be inlined (see app.trim_text)
create function app.complete_bilingual(p_value jsonb) returns jsonb
language sql immutable
as $$
  select case when app.is_blank(p_value -> 'vi') or app.is_blank(p_value -> 'en') then null
    else jsonb_build_object('vi', app.trim_text(p_value ->> 'vi'), 'en', app.trim_text(p_value ->> 'en')) end
$$;

-- Single-line fields lose CR/LF (validation/common.ts stripLineBreaks)
create function app.one_line(p_value jsonb) returns jsonb
language sql immutable
set search_path = ''
as $$
  select case when p_value is null or jsonb_typeof(p_value) <> 'object' then p_value else
    (select coalesce(jsonb_object_agg(e.key, case when jsonb_typeof(e.value) = 'string'
       then to_jsonb(regexp_replace(e.value #>> '{}', E'\r\n|\r|\n', ' ', 'g')) else e.value end), '{}'::jsonb)
     from jsonb_each(p_value) e) end
$$;

-- Distinct values in first-seen order
create function app.distinct_array(p_value jsonb) returns jsonb
language sql immutable
set search_path = ''
as $$
  select case when p_value is null or jsonb_typeof(p_value) <> 'array' then p_value else
    coalesce((select jsonb_agg(d.value order by d.n)
              from (select distinct on (e.value) e.value, e.n from jsonb_array_elements(p_value) with ordinality e(value, n)
                    order by e.value, e.n) d), '[]'::jsonb) end
$$;

create function app.media_info(p_media app.media) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object('mediaId', p_media.media_id, 'type', p_media.type, 'usage', p_media.usage,
      'sourceRef', p_media.source_ref, 'mimeType', p_media.mime_type, 'fileSizeBytes', p_media.file_size_bytes,
      'usageRightsConfirmed', p_media.usage_rights_confirmed)
    || app.jsonb_opt('spokenLanguage', to_jsonb(p_media.spoken_language))
$$;

-- Number > 0, at most p_max_decimals decimals, ≤ max (BLOCKS_SAVE); absent is not reported
create function app.check_number(
  p_type text, p_id text, p_key text, p_value jsonb, p_max numeric, p_unit text, p_max_decimals integer
) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_value numeric;
  v_label text := app.field_label(p_type, p_key);
begin
  if p_value is null or jsonb_typeof(p_value) <> 'number' then
    return '[]';
  end if;
  v_value := (p_value #>> '{}')::numeric;
  if v_value <= 0 then
    return jsonb_build_array(app.issue('BLOCKS_SAVE', p_type, p_id, p_key, 'MSG-NUMBER-POSITIVE', jsonb_build_object('Tên ô', v_label)));
  end if;
  if p_max_decimals is not null and scale(trim_scale(v_value)) > p_max_decimals then
    return jsonb_build_array(app.issue('BLOCKS_SAVE', p_type, p_id, p_key, 'MSG-NUMBER-DECIMALS', jsonb_build_object('Tên ô', v_label)));
  end if;
  if v_value > p_max then
    return jsonb_build_array(app.issue('BLOCKS_SAVE', p_type, p_id, p_key, 'MSG-NUMBER-TOO-BIG',
      jsonb_build_object('Tên ô', v_label, 'tối đa', p_max, 'đơn vị', p_unit)));
  end if;
  return '[]';
end;
$$;

-- Both-or-none bilingual (BLOCKS_PUBLISH, MSG-MISSING-LANGUAGE) on the missing box. p_target replaces the key in
-- the target field for list items ("galleryCaption.2"); the label comes from the base key.
create function app.check_bilingual(p_type text, p_id text, p_key text, p_value jsonb, p_target text default null) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_has_vi boolean := not app.is_blank(p_value -> 'vi');
  v_has_en boolean := not app.is_blank(p_value -> 'en');
  v_missing text;
begin
  if v_has_vi = v_has_en then
    return '[]';
  end if;
  v_missing := case when v_has_vi then 'en' else 'vi' end;
  return jsonb_build_array(app.issue('BLOCKS_PUBLISH', p_type, p_id, coalesce(p_target, p_key) || '.' || v_missing,
    'MSG-MISSING-LANGUAGE', jsonb_build_object('Tên ô', app.field_label(p_type, p_key),
      'tiếng Việt / tiếng Anh', case v_missing when 'vi' then 'tiếng Việt' else 'tiếng Anh' end)));
end;
$$;

-- ---------------------------------------------------------------------------
-- Route content (validation/route.ts, publishGaps.ts)
-- ---------------------------------------------------------------------------

-- Before saving: single-line fields lose line breaks, tags are distinct, no map → no offline-map tick and no map
-- caption (BR-M03-C16, D-81), a safety warning → no "no warning" tick (BR-M03-C09)
create function app.normalize_route_content(p_content jsonb) returns jsonb
language plpgsql immutable
set search_path = ''
as $$
declare
  v jsonb := coalesce(p_content, '{}');
  v_key text;
  v_has_map boolean := not app.is_blank(p_content -> 'routeMapMediaId');
begin
  foreach v_key in array array['name', 'shortDescription', 'routeMapCaption'] loop
    if v ? v_key then
      v := jsonb_set(v, array[v_key], app.one_line(v -> v_key));
    end if;
  end loop;
  if jsonb_typeof(v -> 'highlights') = 'array' then
    v := jsonb_set(v, '{highlights}', (select coalesce(jsonb_agg(app.one_line(h) order by n), '[]')
                                        from jsonb_array_elements(v -> 'highlights') with ordinality x(h, n)));
  end if;
  if jsonb_typeof(v -> 'galleryItems') = 'array' then
    v := jsonb_set(v, '{galleryItems}', (select coalesce(jsonb_agg(
           case when g ? 'caption' then g || jsonb_build_object('caption', app.one_line(g -> 'caption'))
                else jsonb_build_object('mediaId', g -> 'mediaId') end order by n), '[]')
         from jsonb_array_elements(v -> 'galleryItems') with ordinality x(g, n)));
  end if;
  foreach v_key in array array['groupTags', 'experienceTags'] loop
    if v ? v_key then
      v := jsonb_set(v, array[v_key], app.distinct_array(v -> v_key));
    end if;
  end loop;
  if not v_has_map then
    v := v - 'routeMapCaption';
  end if;
  return v || jsonb_build_object(
    'offlineRouteMapRequired', v_has_map and coalesce((v ->> 'offlineRouteMapRequired')::boolean, false),
    'noSafetyWarningConfirmed', not app.has_text(v -> 'safetyWarning') and coalesce((v ->> 'noSafetyWarningConfirmed')::boolean, false));
end;
$$;

-- Clearly wrong values — block the save (BR-M03-L01)
create function app.route_save_issues(p_id text, p_content jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_issues jsonb := '[]';
  v_field record;
  v_item record;
  v_conflict text;
begin
  for v_field in select * from (values
      ('name', 'NAME_MAX_CHARS'), ('shortDescription', 'ROUTE_SHORT_DESC_MAX_CHARS'), ('description', 'ROUTE_DESC_MAX_CHARS'),
      ('startingPoint', 'ROUTE_START_MAX_CHARS'), ('participationRequirements', 'ROUTE_PARTICIPATION_MAX_CHARS'),
      ('preparation', 'ROUTE_PREPARATION_MAX_CHARS'), ('bestTime', 'ROUTE_BEST_TIME_MAX_CHARS'),
      ('safetyWarning', 'ROUTE_SAFETY_WARNING_MAX_CHARS')) as f(key, limit_name) loop
    v_issues := v_issues
      || app.check_text('ROUTE', p_id, v_field.key || '.vi', p_content -> v_field.key ->> 'vi', app.limit(v_field.limit_name))
      || app.check_text('ROUTE', p_id, v_field.key || '.en', p_content -> v_field.key ->> 'en', app.limit(v_field.limit_name));
  end loop;
  for v_item in select g, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'galleryItems', '[]')) with ordinality x(g, n) loop
    v_issues := v_issues
      || app.check_text('ROUTE', p_id, 'galleryCaption.' || v_item.i || '.vi', v_item.g #>> '{caption,vi}', app.limit('CAPTION_MAX_CHARS'))
      || app.check_text('ROUTE', p_id, 'galleryCaption.' || v_item.i || '.en', v_item.g #>> '{caption,en}', app.limit('CAPTION_MAX_CHARS'));
  end loop;
  v_issues := v_issues
    || app.check_text('ROUTE', p_id, 'routeMapCaption.vi', p_content #>> '{routeMapCaption,vi}', app.limit('CAPTION_MAX_CHARS'))
    || app.check_text('ROUTE', p_id, 'routeMapCaption.en', p_content #>> '{routeMapCaption,en}', app.limit('CAPTION_MAX_CHARS'));
  for v_item in select g, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'highlights', '[]')) with ordinality x(g, n) loop
    v_issues := v_issues
      || app.check_text('ROUTE', p_id, 'highlights.' || v_item.i || '.vi', v_item.g ->> 'vi', app.limit('ROUTE_HIGHLIGHT_MAX_CHARS'))
      || app.check_text('ROUTE', p_id, 'highlights.' || v_item.i || '.en', v_item.g ->> 'en', app.limit('ROUTE_HIGHLIGHT_MAX_CHARS'));
  end loop;
  v_issues := v_issues
    || app.check_number('ROUTE', p_id, 'distanceKm', p_content -> 'distanceKm', app.limit('ROUTE_DISTANCE_MAX_KM'), 'km', 1)
    || app.check_number('ROUTE', p_id, 'durationMin', p_content -> 'durationMin', app.limit('ROUTE_DURATION_MAX_MIN'), 'phút', null);

  -- Khó does not go with the family or easy-access tag (BR-M03-C12)
  if p_content ->> 'difficulty' = 'KHO' then
    select t #>> '{}' into v_conflict from jsonb_array_elements(coalesce(p_content -> 'groupTags', '[]')) with ordinality x(t, n)
    where t #>> '{}' in ('GROUP_GIA_DINH_CO_TRE', 'GROUP_CAN_DE_DANG') order by n limit 1;
    if v_conflict is not null then
      v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'groupTags', 'MSG-TAG-CONFLICT',
        jsonb_build_object('độ khó', app.display_name('difficulty', 'KHO'), 'nhãn', app.display_name('groupTag', v_conflict))));
    end if;
  end if;
  if jsonb_array_length(coalesce(p_content -> 'galleryItems', '[]')) > app.limit('ROUTE_GALLERY_MAX_IMAGES') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'galleryItems', 'MSG-COUNT-IMAGES',
      jsonb_build_object('Tên điểm tham quan hoặc tên tuyến', coalesce(app.trim_text(p_content #>> '{name,vi}'), ''),
        'tối đa', app.limit('ROUTE_GALLERY_MAX_IMAGES'))));
  end if;
  -- a checkpoint appears once (MSG-CHECKPOINT-DUPLICATE, once per duplicated checkpoint)
  for v_item in
    select d.id from (
      select c ->> 'checkpointId' as id, n, row_number() over (partition by c ->> 'checkpointId' order by n) as k
      from jsonb_array_elements(coalesce(p_content -> 'checkpointList', '[]')) with ordinality x(c, n)) d
    where d.k = 2 order by d.n
  loop
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'checkpointList', 'MSG-CHECKPOINT-DUPLICATE',
      jsonb_build_object('tên', app.checkpoint_name(v_item.id))));
  end loop;
  if jsonb_array_length(coalesce(p_content -> 'checkpointList', '[]')) > app.limit('ROUTE_CHECKPOINTS_MAX_ITEMS') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'ROUTE', p_id, 'checkpointList', 'MSG-LIMIT-CHECKPOINTS',
      jsonb_build_object('tối đa', app.limit('ROUTE_CHECKPOINTS_MAX_ITEMS'))));
  end if;
  return v_issues;
end;
$$;

-- Route images in editor order with their slot usage and the label used in MSG-RIGHTS-NOT-CONFIRMED (D-16)
create function app.route_images(p_content jsonb)
returns table (media_id text, field_key text, label text, usage text, ord integer)
language sql immutable
set search_path = ''
as $$
  select p_content ->> 'thumbnailMediaId', 'thumbnailMediaId', app.field_label('ROUTE', 'thumbnailMediaId'), 'ROUTE_THUMBNAIL', 0
  where not app.is_blank(p_content -> 'thumbnailMediaId')
  union all
  select g ->> 'mediaId', 'galleryItems.' || (n - 1), app.field_label('ROUTE', 'galleryItems') || ' ' || n, 'ROUTE_GALLERY', n::integer
  from jsonb_array_elements(coalesce(p_content -> 'galleryItems', '[]')) with ordinality x(g, n)
  union all
  select p_content ->> 'routeMapMediaId', 'routeMapMediaId', app.field_label('ROUTE', 'routeMapMediaId'), 'ROUTE_MAP', 1000
  where not app.is_blank(p_content -> 'routeMapMediaId')
  order by 5
$$;

-- Publication gaps of a route, in editor step order (BR-M03-C04, C06, C09, C14, T04)
create function app.route_publish_issues(p_id text, p_content jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_issues jsonb;
  v_key text;
  v_item record;
begin
  -- step 1 "Thẻ tuyến"
  v_issues := app.check_required('ROUTE', p_id, 'thumbnailMediaId', p_content -> 'thumbnailMediaId')
    || app.check_required_bilingual('ROUTE', p_id, 'name', p_content -> 'name')
    || app.check_required_bilingual('ROUTE', p_id, 'shortDescription', p_content -> 'shortDescription')
    || app.check_required('ROUTE', p_id, 'distanceKm', p_content -> 'distanceKm')
    || app.check_required('ROUTE', p_id, 'durationMin', p_content -> 'durationMin')
    || app.check_required('ROUTE', p_id, 'difficulty', p_content -> 'difficulty')
    -- step 2 "Chi tiết"
    || app.check_required_bilingual('ROUTE', p_id, 'description', p_content -> 'description')
    || app.check_required_bilingual('ROUTE', p_id, 'startingPoint', p_content -> 'startingPoint');
  foreach v_key in array array['participationRequirements', 'preparation', 'bestTime', 'safetyWarning'] loop
    v_issues := v_issues || app.check_bilingual('ROUTE', p_id, v_key, p_content -> v_key);
  end loop;
  if not app.has_text(p_content -> 'safetyWarning') and (p_content ->> 'noSafetyWarningConfirmed')::boolean is not true then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'ROUTE', p_id, 'safetyWarning.vi', 'MSG-SAFETY-CONFIRM'));
  end if;
  for v_item in select g, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'galleryItems', '[]')) with ordinality x(g, n) loop
    v_issues := v_issues || app.check_bilingual('ROUTE', p_id, 'galleryCaption', v_item.g -> 'caption', 'galleryCaption.' || v_item.i);
  end loop;
  v_issues := v_issues || app.check_bilingual('ROUTE', p_id, 'routeMapCaption', p_content -> 'routeMapCaption');
  for v_item in select h, n - 1 as i from jsonb_array_elements(coalesce(p_content -> 'highlights', '[]')) with ordinality x(h, n) loop
    v_issues := v_issues || app.check_bilingual('ROUTE', p_id, 'highlights', v_item.h, 'highlights.' || v_item.i);
  end loop;
  for v_item in select * from app.route_images(p_content) i loop
    if not coalesce((select m.usage_rights_confirmed from app.media m where m.media_id::text = v_item.media_id), false) then
      v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'ROUTE', p_id, v_item.field_key,
        'MSG-RIGHTS-NOT-CONFIRMED', jsonb_build_object('tên tệp', v_item.label)));
    end if;
  end loop;
  -- step 3 "Nhãn"
  v_issues := v_issues
    || app.check_required('ROUTE', p_id, 'groupTags', p_content -> 'groupTags')
    || app.check_required('ROUTE', p_id, 'experienceTags', p_content -> 'experienceTags');
  -- step 4: at least one active checkpoint (BR-M03-T04)
  if not exists (select 1 from jsonb_array_elements(coalesce(p_content -> 'checkpointList', '[]')) c
                 join app.checkpoints k on k.checkpoint_id = c ->> 'checkpointId' and k.status = 'HOAT_DONG') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'ROUTE', p_id, 'checkpointList', 'MSG-NO-ACTIVE-CHECKPOINT'));
  end if;
  return v_issues;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-01 save route draft (BR-M03-C02, C03, C09, C12, C14, C16, T01, T03, F06, F11)
-- ---------------------------------------------------------------------------

create function api.save_route_draft(
  p_route_id text default null, p_expected jsonb default '{}', p_content jsonb default '{}', p_media_settings jsonb default '[]'
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_route app.routes;
  v_id text;
  v_content jsonb := app.normalize_route_content(p_content);
  v_issues jsonb;
  v_revision app.revisions;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    if p_route_id is not null then
      select * into v_route from app.routes where route_id = p_route_id for update;
      if v_route.route_id is null then
        perform app.reject(app.cr_failed());
      end if;
      perform app.expect_entity(p_expected, 'ROUTE', p_route_id, v_route.concurrency_revision, v_route.updated_at,
        app.draft_of('ROUTE', p_route_id));
      if v_route.status = 'LUU_TRU' then
        perform app.reject(app.cr_failed());
      end if;
    end if;
    v_id := coalesce(v_route.route_id, app.new_id());

    -- images are chosen after the first save, which creates the route (D-25); a newly listed checkpoint must be
    -- active (BR-M03-T01); images must be this route's media in the right slot (DAC-M03-036)
    if jsonb_array_length(coalesce(v_content -> 'highlights', '[]')) > app.limit('ROUTE_HIGHLIGHTS_MAX_ITEMS')
       or (v_route.route_id is null and exists (select 1 from app.route_images(v_content)))
       or exists (
         select 1 from jsonb_array_elements(coalesce(v_content -> 'checkpointList', '[]')) c
         where c ->> 'checkpointId' not in (
             select l ->> 'checkpointId' from app.revisions r
             cross join lateral jsonb_array_elements(coalesce(r.content -> 'checkpointList', '[]')) l
             where r.subject_type = 'ROUTE' and r.subject_id = v_id and r.status in ('NHAP', 'PHAT_HANH'))
           and not exists (select 1 from app.checkpoints k where k.checkpoint_id = c ->> 'checkpointId' and k.status = 'HOAT_DONG'))
       or exists (
         select 1 from app.route_images(v_content) i
         where not exists (select 1 from app.media m
                           where m.media_id::text = i.media_id and m.owner_type = 'ROUTE' and m.owner_id = v_id
                             and m.type = 'IMAGE' and m.usage = i.usage)) then
      perform app.reject(app.cr_failed());
    end if;
    v_issues := app.route_save_issues(v_id, v_content);
    if jsonb_array_length(v_issues) > 0 then
      perform app.reject(app.cr_validation(v_issues));
    end if;

    -- per-image rights tick, in the same save (BR-M03-F11, C14)
    update app.media m
    set usage_rights_confirmed = s.confirmed,
        usage_rights_confirmed_by_user_id = case when not s.confirmed then null
          when m.usage_rights_confirmed then m.usage_rights_confirmed_by_user_id else v_actor.user_id end,
        usage_rights_confirmed_at = case when not s.confirmed then null
          when m.usage_rights_confirmed then m.usage_rights_confirmed_at else now() end,
        concurrency_revision = m.concurrency_revision + 1
    from (select e ->> 'mediaId' as media_id, coalesce((e ->> 'usageRightsConfirmed')::boolean, false) as confirmed
          from jsonb_array_elements(coalesce(p_media_settings, '[]')) e) s
    where m.media_id::text = s.media_id and m.owner_type = 'ROUTE' and m.owner_id = v_id
      and m.usage_rights_confirmed <> s.confirmed;

    if v_route.route_id is null then
      insert into app.routes (route_id, created_by_user_id) values (v_id, v_actor.user_id);
    else
      update app.routes set concurrency_revision = concurrency_revision + 1 where route_id = v_id;
    end if;
    v_revision := app.write_draft('ROUTE', v_id, v_content, v_actor.user_id);

    perform app.audit(v_actor.user_id, 'ROUTE_DRAFT_SAVED', 'ROUTE', v_id, 'SUCCESS', null, v_revision.revision_number);
    return app.cr_ok('MSG-SAVED', jsonb_build_object('routeId', v_id, 'revisionNumber', v_revision.revision_number,
      'concurrencyRevision', v_revision.concurrency_revision));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'ROUTE_DRAFT_SAVED', 'ROUTE', coalesce(p_route_id, ''), 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Q-02, Q-03, Q-04
-- ---------------------------------------------------------------------------

create function api.list_routes(p_search text default null, p_status text default null) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_reader();
  return coalesce((
    select jsonb_agg(item order by item ->> 'lastEditedAt' desc, item ->> 'routeId')
    from (
      select jsonb_build_object(
          'routeId', r.route_id,
          'status', r.status,
          'hasPendingDraft', r.status <> 'NHAP' and (app.draft_of('ROUTE', r.route_id)).revision_id is not null,
          'lastEditedAt', app.iso(r.updated_at),
          'lastEditedByEmail', app.user_email(coalesce(app.entity_last_editor('ROUTE', r.route_id), r.created_by_user_id)))
        || app.jsonb_opt('name', to_jsonb(nullif(app.route_name(r.route_id), ''))) as item
      from app.routes r
      where (p_status is null or r.status = p_status)
        and (app.normalize_name(p_search) = ''
             or position(app.normalize_name(p_search) in app.normalize_name(app.route_name(r.route_id))) > 0)
    ) rows), '[]');
end;
$$;

create function api.get_route_editor(p_route_id text) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_route app.routes;
  v_content jsonb;
begin
  perform app.require_reader();
  select * into v_route from app.routes where route_id = p_route_id;
  if v_route.route_id is null then
    raise exception 'not found' using errcode = 'no_data_found';
  end if;
  v_content := coalesce((app.draft_of('ROUTE', p_route_id)).content, (app.published_of('ROUTE', p_route_id)).content);
  return jsonb_build_object(
      'routeId', v_route.route_id,
      'status', v_route.status,
      'concurrencyRevision', v_route.concurrency_revision,
      'media', coalesce((select jsonb_agg(app.media_info(m) order by m.created_at, m.media_id)
                         from app.media m where m.owner_type = 'ROUTE' and m.owner_id = p_route_id), '[]'),
      -- checkpoints of the draft list, then of the published list, each once
      'checkpoints', coalesce((
        select jsonb_agg(jsonb_build_object('checkpointId', k.checkpoint_id, 'name', app.checkpoint_name(k.checkpoint_id), 'status', k.status)
          || app.jsonb_opt('connectivityMode', (app.published_of('CHECKPOINT', k.checkpoint_id)).content -> 'connectivityMode')
          order by l.first_at)
        from (select c ->> 'checkpointId' as id, min(case r.status when 'NHAP' then 0 else 100000 end + n) as first_at
              from app.revisions r
              cross join lateral jsonb_array_elements(coalesce(r.content -> 'checkpointList', '[]')) with ordinality x(c, n)
              where r.subject_type = 'ROUTE' and r.subject_id = p_route_id and r.status in ('NHAP', 'PHAT_HANH')
              group by c ->> 'checkpointId') l
        join app.checkpoints k on k.checkpoint_id = l.id), '[]'),
      'issues', case when v_content is null then '[]'::jsonb else app.route_publish_issues(p_route_id, v_content) end)
    || app.jsonb_opt('draft', app.editor_revision(app.draft_of('ROUTE', p_route_id)))
    || app.jsonb_opt('published', app.editor_revision(app.published_of('ROUTE', p_route_id)))
    || app.jsonb_opt('closureReason', to_jsonb(v_route.closure_reason))
    || app.jsonb_opt('closureSource', to_jsonb(v_route.closure_source));
end;
$$;

create function api.list_selectable_checkpoints(p_search text default '') returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_reader();
  return coalesce((
    select jsonb_agg(item order by item ->> 'name', item ->> 'checkpointId')
    from (
      select jsonb_build_object(
          'checkpointId', k.checkpoint_id,
          'name', coalesce((app.published_of('CHECKPOINT', k.checkpoint_id)).content #>> '{checkpointName,vi}', ''),
          'connectivityMode', coalesce((app.published_of('CHECKPOINT', k.checkpoint_id)).content ->> 'connectivityMode', 'OFFLINE_REQUIRED'),
          'visitPointCount', (select count(*) from app.qr_codes q where q.checkpoint_id = k.checkpoint_id and q.status = 'HOAT_DONG'),
          'otherRoutes', app.routes_using(k.checkpoint_id)) as item
      from app.checkpoints k
      where k.status = 'HOAT_DONG'
    ) rows
    where app.normalize_name(p_search) = ''
       or position(app.normalize_name(p_search) in app.normalize_name(item ->> 'name')) > 0), '[]');
end;
$$;

-- ---------------------------------------------------------------------------
-- Journey (research R-10; BR-M03-X01, G02–G05, G10, C16)
-- ---------------------------------------------------------------------------

-- Journey of a route from the given route content and the *published* content of its checkpoints and visit
-- points as they are now: {candidate, leftOut, sizeBytes, heaviestImages}. The candidate has no version number.
-- Set-based (one statement, no loop, no growing jsonb): a change at a checkpoint listed by 10 routes of 30 checkpoints
-- with 20 visit points each rebuilds within the R-24 target (validation-report D-127).
create function app.build_journey(p_route_id text, p_content jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_entries jsonb;
  v_left jsonb;
  v_images jsonb;
  v_text_bytes bigint;
  v_map app.media;
  v_candidate jsonb;
  v_size bigint;
begin
  with list as (
    select c ->> 'checkpointId' as id, n::integer as seq
    from jsonb_array_elements(coalesce(p_content -> 'checkpointList', '[]')) with ordinality x(c, n)
  ),
  cp as (
    select l.id, l.seq, k.status, pub.content as pc, coalesce(pub.content ->> 'connectivityMode', 'OFFLINE_REQUIRED') as mode,
           (k.status = 'HOAT_DONG' and pub.content is not null) as in_journey
    from list l
    left join app.checkpoints k on k.checkpoint_id = l.id
    left join app.revisions pub on pub.subject_type = 'CHECKPOINT' and pub.subject_id = l.id and pub.status = 'PHAT_HANH'
  ),
  -- creation order counts every visit point of the checkpoint, revoked ones included ("chưa đặt tên {số}")
  qr as (
    select q.checkpoint_id, q.qr_identifier, q.status, q.created_at,
           row_number() over (partition by q.checkpoint_id order by q.created_at, q.qr_identifier)::integer as creation_order
    from app.qr_codes q
    where q.checkpoint_id in (select id from cp where in_journey)
  ),
  qa as (
    select qr.checkpoint_id, qr.qr_identifier, qr.created_at, qr.creation_order, coalesce(r.content, '{}'::jsonb) as qc,
           coalesce(app.complete_bilingual(r.content -> 'objectName'), '{"vi": "", "en": ""}'::jsonb) as obj,
           coalesce(app.complete_bilingual(r.content -> 'introductionText'), '{"vi": "", "en": ""}'::jsonb) as intro
    from qr
    left join app.revisions r on r.subject_type = 'QRCODE' and r.subject_id = qr.qr_identifier and r.status = 'PHAT_HANH'
    where qr.status = 'HOAT_DONG'
  ),
  -- static images of OFFLINE_REQUIRED checkpoints only; audio/video never count (BR-M03-G10)
  img as (
    select qa.qr_identifier, cp.seq, qa.created_at, i.n, m.source_ref, m.file_size_bytes,
           app.visit_point_name(qa.obj ->> 'vi', qa.creation_order) || ' – ảnh '
             || row_number() over (partition by qa.qr_identifier order by i.n) as label
    from qa
    join cp on cp.id = qa.checkpoint_id and cp.mode = 'OFFLINE_REQUIRED'
    cross join lateral jsonb_array_elements(coalesce(qa.qc -> 'mediaItems', '[]')) with ordinality i(e, n)
    join app.media m on m.media_id::text = i.e ->> 'mediaId' and m.type = 'IMAGE'
  ),
  -- aggregated once per visit point and per checkpoint (no correlated subquery over every row)
  img_by_qr as (
    select img.qr_identifier, jsonb_agg(img.source_ref order by img.n) as images from img group by img.qr_identifier
  ),
  per_checkpoint as (
    select qa.checkpoint_id,
           jsonb_agg(qa.qr_identifier order by qa.created_at, qa.qr_identifier) as qr_identifiers,
           jsonb_agg(jsonb_build_object(
               'qrIdentifier', qa.qr_identifier,
               'objectName', qa.obj,
               'localizedContent', jsonb_build_object('vi', jsonb_build_object('introductionText', qa.intro ->> 'vi'),
                                                      'en', jsonb_build_object('introductionText', qa.intro ->> 'en')),
               'staticImages', coalesce(b.images, '[]'::jsonb))
             order by qa.created_at, qa.qr_identifier) as resources
    from qa left join img_by_qr b on b.qr_identifier = qa.qr_identifier
    group by qa.checkpoint_id
  )
  select
    (select coalesce(jsonb_agg(
        jsonb_build_object(
          'checkpointId', cp.id,
          'sequence', cp.seq,
          'checkpointName', coalesce(app.complete_bilingual(cp.pc -> 'checkpointName'),
                                     jsonb_build_object('vi', app.checkpoint_name(cp.id), 'en', app.checkpoint_name(cp.id))),
          'connectivityMode', cp.mode,
          'qrIdentifiers', coalesce(pc.qr_identifiers, '[]'::jsonb))
        || case when cp.mode = 'OFFLINE_REQUIRED' then jsonb_build_object('offlineResources', coalesce(pc.resources, '[]'::jsonb))
           else '{}'::jsonb end
        order by cp.seq), '[]'::jsonb)
     from cp left join per_checkpoint pc on pc.checkpoint_id = cp.id
     where cp.in_journey),
    -- not active: left out of the journey; sequence keeps the list position, so gaps are allowed (BR-M03-G02, T02)
    (select coalesce(jsonb_agg(jsonb_build_object(
        'name', coalesce(nullif(app.trim_text(cp.pc #>> '{checkpointName,vi}'), ''), app.checkpoint_name(cp.id)),
        'reason', case coalesce(cp.status, 'LUU_TRU') when 'TAM_DONG' then 'Đang tạm đóng' when 'NHAP' then 'Chưa xuất bản'
                    when 'LUU_TRU' then 'Đã lưu trữ' else 'Đang tạm đóng' end) order by cp.seq), '[]'::jsonb)
     from cp where not coalesce(cp.in_journey, false)),
    (select coalesce(jsonb_agg(jsonb_build_object('sourceRef', img.source_ref, 'size', img.file_size_bytes, 'label', img.label)
                               order by img.seq, img.created_at, img.qr_identifier, img.n), '[]'::jsonb)
     from img),
    (select coalesce(sum(octet_length(convert_to((qa.obj ->> 'vi') || (qa.obj ->> 'en') || (qa.intro ->> 'vi') || (qa.intro ->> 'en'), 'UTF8'))), 0)
     from qa join cp on cp.id = qa.checkpoint_id and cp.mode = 'OFFLINE_REQUIRED')
  into v_entries, v_left, v_images, v_text_bytes;

  v_candidate := jsonb_build_object('checkpoints', v_entries);
  -- the route map enters the journey only when marked for offline use (BR-M03-C16)
  if (p_content ->> 'offlineRouteMapRequired')::boolean and not app.is_blank(p_content -> 'routeMapMediaId') then
    select * into v_map from app.media where media_id::text = p_content ->> 'routeMapMediaId';
    if v_map.media_id is not null then
      v_candidate := v_candidate || jsonb_build_object('offlineRouteMap',
        jsonb_build_object('sourceRef', v_map.source_ref) || app.jsonb_opt('caption', app.complete_bilingual(p_content -> 'routeMapCaption')));
      v_images := v_images || jsonb_build_array(jsonb_build_object('sourceRef', v_map.source_ref, 'size', v_map.file_size_bytes,
        'label', app.field_label('ROUTE', 'routeMapMediaId')));
    end if;
  end if;
  -- distinct images + offline text
  select coalesce(sum((d.img ->> 'size')::bigint), 0) + v_text_bytes into v_size
  from (select distinct on (i ->> 'sourceRef') i as img from jsonb_array_elements(v_images) i) d;
  v_candidate := v_candidate || jsonb_build_object('estimatedOfflineSizeBytes', v_size);
  return jsonb_build_object(
    'candidate', v_candidate,
    'leftOut', v_left,
    'sizeBytes', v_size,
    'heaviestImages', coalesce((
      select jsonb_agg((d.img ->> 'label') || ' (' || app.format_megabytes((d.img ->> 'size')::bigint) || ' MB)'
                       order by (d.img ->> 'size')::bigint desc, d.n)
      from (select * from (select distinct on (i ->> 'sourceRef') i as img, n from jsonb_array_elements(v_images) with ordinality x(i, n)
                          order by i ->> 'sourceRef', n) u
            order by (u.img ->> 'size')::bigint desc, u.n limit 3) d), '[]'));
end;
$$;

-- The active snapshot in the candidate's form: content only, no version or time (R-10)
create function app.active_journey(p_route_id text) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object('checkpoints', s.checkpoints)
    || app.jsonb_opt('offlineRouteMap', s.offline_route_map)
    || app.jsonb_opt('estimatedOfflineSizeBytes', to_jsonb(s.estimated_offline_size_bytes))
  from app.routes r
  join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version
  where r.route_id = p_route_id
$$;

-- Insert the next version and make it active (BR-M03-G03, G06). p_activate moves a first publication to HOAT_DONG
-- together with version 1 (BR-M03-C17, F04).
create function app.commit_snapshot(p_route_id text, p_candidate jsonb, p_activate boolean default false) returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_route app.routes;
  v_version integer;
begin
  select * into v_route from app.routes where route_id = p_route_id for update;
  v_version := coalesce(v_route.active_content_version, 0) + 1;
  insert into app.journey_snapshots (route_id, content_version, previous_content_version, estimated_offline_size_bytes,
                                     offline_route_map, checkpoints)
  values (p_route_id, v_version, v_route.active_content_version, (p_candidate ->> 'estimatedOfflineSizeBytes')::integer,
          p_candidate -> 'offlineRouteMap', p_candidate -> 'checkpoints');
  update app.routes
  set active_content_version = v_version,
      status = case when p_activate then 'HOAT_DONG' else status end,
      concurrency_revision = concurrency_revision + 1
  where route_id = p_route_id;
  return v_version;
end;
$$;

-- Routes affected by a change at a checkpoint: HOAT_DONG / TAM_DONG whose published list holds it (BR-M03-X02, X03)
create function app.affected_routes(p_checkpoint_id text) returns setof app.routes
language sql stable
set search_path = ''
as $$
  select r.* from app.routes r
  where r.status in ('HOAT_DONG', 'TAM_DONG')
    and exists (
      select 1 from app.revisions v
      cross join lateral jsonb_array_elements(coalesce(v.content -> 'checkpointList', '[]')) c
      where v.subject_type = 'ROUTE' and v.subject_id = r.route_id and v.status = 'PHAT_HANH'
        and c ->> 'checkpointId' = p_checkpoint_id)
  order by app.route_name(r.route_id), r.route_id
$$;

-- Rebuild every affected route from its published content and the data as it is now:
-- [{routeId, routeName, routeStatus, changed, build}]
create function app.rebuild_routes(p_checkpoint_id text) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'routeId', r.route_id,
      'routeName', coalesce(app.trim_text((app.published_of('ROUTE', r.route_id)).content #>> '{name,vi}'), ''),
      'routeStatus', r.status,
      'changed', (b.build -> 'candidate') is distinct from app.active_journey(r.route_id),
      'build', b.build) order by app.route_name(r.route_id), r.route_id), '[]')
  from app.affected_routes(p_checkpoint_id) r
  -- offset 0 keeps the subquery from being pulled up: build_journey runs once per route, not once per use of b.build
  cross join lateral (select app.build_journey(r.route_id, (app.published_of('ROUTE', r.route_id)).content) as build offset 0) b
$$;

-- Switch every changed route to its new snapshot, together (BR-M03-G06, X02): [{routeId, contentVersion}]
create function app.commit_rebuilds(p_rebuilds jsonb) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_item jsonb;
  v_versions jsonb := '[]';
begin
  for v_item in select e from jsonb_array_elements(coalesce(p_rebuilds, '[]')) e where (e ->> 'changed')::boolean loop
    v_versions := v_versions || jsonb_build_array(jsonb_build_object('routeId', v_item ->> 'routeId',
      'contentVersion', app.commit_snapshot(v_item ->> 'routeId', v_item #> '{build,candidate}')));
  end loop;
  return v_versions;
end;
$$;

-- MSG-OFFLINE-TOO-BIG as a review issue and as the BLOCKED rejection, naming the route and the heaviest images
create function app.size_block(p_route_id text, p_route_name text, p_build jsonb) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'issue', app.issue('BLOCKS_PUBLISH', 'ROUTE', p_route_id, 'checkpointList', 'MSG-OFFLINE-TOO-BIG', v.vals),
    'blocked', app.cr_blocked('MSG-OFFLINE-TOO-BIG', v.vals))
  from (select jsonb_build_object('tên tuyến', p_route_name,
          'số', app.format_megabytes((p_build ->> 'sizeBytes')::bigint),
          'tối đa', app.limit('OFFLINE_PACKAGE_MAX_MB'),
          'danh sách', coalesce((select string_agg(h #>> '{}', ', ' order by n)
                                 from jsonb_array_elements(p_build -> 'heaviestImages') with ordinality x(h, n)), '')) as vals) v
$$;

-- What a change at a checkpoint does to its routes: review lines, notes and the size ceiling (BR-M03-X03, G10)
create function app.rebuild_impact(p_rebuilds jsonb) returns jsonb
language sql stable
set search_path = ''
as $$
  select jsonb_build_object(
    'affectedRoutes', coalesce((select jsonb_agg(jsonb_build_object(
        'routeId', e ->> 'routeId', 'routeName', e ->> 'routeName', 'routeStatus', e ->> 'routeStatus',
        'createsNewJourneyVersion', (e ->> 'changed')::boolean,
        'estimatedOfflineSizeBytes', (e #>> '{build,sizeBytes}')::bigint, 'closesAutomatically', false) order by n)
      from jsonb_array_elements(p_rebuilds) with ordinality x(e, n)), '[]'),
    'notes', coalesce((select jsonb_build_array(app.render_message('MSG-AFFECTED-ROUTES', jsonb_build_object(
        'số', count(*), 'danh sách', string_agg(e ->> 'routeName', ', ' order by n))))
      from jsonb_array_elements(p_rebuilds) with ordinality x(e, n) where (e ->> 'changed')::boolean
      having count(*) > 0), '[]'),
    'size', (select app.size_block(e ->> 'routeId', e ->> 'routeName', e -> 'build')
             from jsonb_array_elements(p_rebuilds) with ordinality x(e, n)
             where (e ->> 'changed')::boolean
               and (e #>> '{build,sizeBytes}')::bigint > app.limit('OFFLINE_PACKAGE_MAX_MB')::bigint * app.limit('BYTES_PER_MB')
             order by n limit 1))
$$;

-- Revoking a visit point gives every listing route a new journey version at once; never blocked by the ceiling
-- (BR-M03-E09, X02, G10). Replaces the placeholder of migration 3c (D-94).
create or replace function app.rebuild_after_visit_point_change(p_checkpoint_id text) returns void
language plpgsql
set search_path = ''
as $$
begin
  perform app.commit_rebuilds(app.rebuild_routes(p_checkpoint_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- Publication helpers (Q-08 / C-05)
-- ---------------------------------------------------------------------------

-- Draft → PHAT_HANH, the published revision → LUU_TRU; self-published when the publisher made the last edit (A05)
create function app.promote_draft(p_type text, p_id text, p_actor text) returns app.revisions
language plpgsql
set search_path = ''
as $$
declare
  v_revision app.revisions;
begin
  update app.revisions set status = 'LUU_TRU', concurrency_revision = concurrency_revision + 1
  where subject_type = p_type and subject_id = p_id and status = 'PHAT_HANH';
  update app.revisions
  set status = 'PHAT_HANH', published_by_user_id = p_actor, published_at = now(),
      self_published = (last_edited_by_user_id = p_actor), concurrency_revision = concurrency_revision + 1
  where subject_type = p_type and subject_id = p_id and status = 'NHAP'
  returning * into v_revision;
  return v_revision;
end;
$$;

-- BR-M03-D04 condition 4: at an OFFLINE_REQUIRED checkpoint every image of the visit points to publish must still be
-- in Storage. The sentence names the visit point and the image position, never the original file name (D-3).
create function app.unreadable_image_issues(p_checkpoint_id text, p_qr_identifiers text[]) returns jsonb
language sql stable
set search_path = ''
as $$
  select case when app.checkpoint_saved_mode(p_checkpoint_id) is distinct from 'OFFLINE_REQUIRED' then '[]'::jsonb else
    coalesce((
      select jsonb_agg(app.issue('BLOCKS_PUBLISH', 'QRCODE', i.qr, 'images.' || (i.k - 1), 'MSG-IMAGE-NOT-READABLE',
        jsonb_build_object('tên tệp', app.qr_display_name(i.qr) || ' – ảnh ' || i.k)) order by i.qord, i.k)
      from (select q.qr, q.qord, m.source_ref, row_number() over (partition by q.qr order by x.n) as k
            from unnest(p_qr_identifiers) with ordinality q(qr, qord)
            cross join lateral jsonb_array_elements(coalesce(app.current_content('QRCODE', q.qr) -> 'mediaItems', '[]')) with ordinality x(e, n)
            join app.media m on m.media_id::text = x.e ->> 'mediaId' and m.type = 'IMAGE') i
      where not exists (select 1 from storage.objects o where o.bucket_id = 'quest-media' and o.name = i.source_ref)), '[]'::jsonb) end
$$;

-- MSG-AV-ONE-LANGUAGE: a warning, never a block (BR-M03-E17)
create function app.one_language_notes(p_name text, p_content jsonb) returns jsonb
language sql stable
set search_path = ''
as $$
  select case when s.has_vi = s.has_en then '[]'::jsonb else jsonb_build_array(app.render_message('MSG-AV-ONE-LANGUAGE',
    jsonb_build_object('tên', p_name,
      'ngôn ngữ', case when s.has_vi then 'tiếng Việt' else 'tiếng Anh' end,
      'ngôn ngữ còn lại', case when s.has_vi then 'tiếng Anh' else 'tiếng Việt' end))) end
  from (select coalesce(bool_or(m.spoken_language = 'vi'), false) as has_vi, coalesce(bool_or(m.spoken_language = 'en'), false) as has_en
        from jsonb_array_elements(coalesce(p_content -> 'mediaItems', '[]')) i
        join app.media m on m.media_id::text = i ->> 'mediaId' and m.type <> 'IMAGE') s
$$;

create function app.change_line(p_label text, p_before text, p_after text) returns jsonb
language sql immutable
set search_path = ''
as $$
  select case when coalesce(p_before, '') = coalesce(p_after, '') then '[]'::jsonb
    else jsonb_build_array(jsonb_build_object('fieldLabel', p_label, 'before', coalesce(p_before, ''), 'after', coalesce(p_after, ''))) end
$$;

-- Before/after per language of a bilingual field
create function app.text_changes(p_type text, p_key text, p_before jsonb, p_after jsonb) returns jsonb
language sql stable
set search_path = ''
as $$
  select app.change_line(app.field_label(p_type, p_key || '.vi'), app.trim_text(p_before ->> 'vi'), app.trim_text(p_after ->> 'vi'))
      || app.change_line(app.field_label(p_type, p_key || '.en'), app.trim_text(p_before ->> 'en'), app.trim_text(p_after ->> 'en'))
$$;

create function app.count_media(p_content jsonb, p_images boolean) returns integer
language sql stable
set search_path = ''
as $$
  select count(*)::integer from jsonb_array_elements(coalesce(p_content -> 'mediaItems', '[]')) i
  join app.media m on m.media_id::text = i ->> 'mediaId' and (m.type = 'IMAGE') = p_images
$$;

create function app.media_count_changes(p_before jsonb, p_after jsonb) returns jsonb
language sql stable
set search_path = ''
as $$
  select app.change_line(app.field_label('QRCODE', 'images'), app.count_media(p_before, true) || ' ảnh', app.count_media(p_after, true) || ' ảnh')
      || app.change_line(app.field_label('QRCODE', 'avFiles'), app.count_media(p_before, false) || ' tệp', app.count_media(p_after, false) || ' tệp')
$$;

-- Joined display names of a tag array
create function app.tag_names(p_kind text, p_tags jsonb) returns text
language sql immutable
set search_path = ''
as $$
  select coalesce(string_agg(coalesce(app.display_name(p_kind, t #>> '{}'), ''), ', ' order by n), '')
  from jsonb_array_elements(coalesce(p_tags, '[]')) with ordinality x(t, n)
$$;

-- Before/after of route content in plain words; a first publication has an empty "before"
create function app.route_changes(p_before jsonb, p_after jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_has_before boolean := p_before is not null;
  v_lines jsonb;
  v_key text;
begin
  v_lines := app.change_line(app.field_label('ROUTE', 'thumbnailMediaId'),
      case when not app.is_blank(p_before -> 'thumbnailMediaId') then 'Có' else '' end,
      case when (p_after ->> 'thumbnailMediaId') is not distinct from (p_before ->> 'thumbnailMediaId')
             then case when not app.is_blank(p_before -> 'thumbnailMediaId') then 'Có' else '' end
           when not app.is_blank(p_after -> 'thumbnailMediaId') then 'Ảnh mới' else '' end)
    || app.text_changes('ROUTE', 'name', p_before -> 'name', p_after -> 'name')
    || app.text_changes('ROUTE', 'shortDescription', p_before -> 'shortDescription', p_after -> 'shortDescription')
    || app.change_line(app.field_label('ROUTE', 'distanceKm'), replace(p_before ->> 'distanceKm', '.', ','), replace(p_after ->> 'distanceKm', '.', ','))
    || app.change_line(app.field_label('ROUTE', 'durationMin'), p_before ->> 'durationMin', p_after ->> 'durationMin')
    || app.change_line(app.field_label('ROUTE', 'difficulty'), app.display_name('difficulty', p_before ->> 'difficulty'),
         app.display_name('difficulty', p_after ->> 'difficulty'));
  foreach v_key in array array['description', 'startingPoint', 'participationRequirements', 'preparation', 'bestTime', 'safetyWarning'] loop
    v_lines := v_lines || app.text_changes('ROUTE', v_key, p_before -> v_key, p_after -> v_key);
  end loop;
  return v_lines
    || app.change_line(app.field_label('ROUTE', 'galleryItems'),
         case when v_has_before then jsonb_array_length(coalesce(p_before -> 'galleryItems', '[]')) || ' ảnh' else '' end,
         jsonb_array_length(coalesce(p_after -> 'galleryItems', '[]')) || ' ảnh')
    || app.change_line(app.field_label('ROUTE', 'offlineRouteMapRequired'),
         case when (p_before ->> 'offlineRouteMapRequired')::boolean then 'Có' when v_has_before then 'Không' else '' end,
         case when (p_after ->> 'offlineRouteMapRequired')::boolean then 'Có' when v_has_before then 'Không' else '' end)
    || app.change_line(app.field_label('ROUTE', 'groupTags'), app.tag_names('groupTag', p_before -> 'groupTags'),
         app.tag_names('groupTag', p_after -> 'groupTags'))
    || app.change_line(app.field_label('ROUTE', 'experienceTags'), app.tag_names('experienceTag', p_before -> 'experienceTags'),
         app.tag_names('experienceTag', p_after -> 'experienceTags'))
    || app.change_line(app.field_label('ROUTE', 'checkpointList'),
         (select coalesce(string_agg(app.checkpoint_name(c ->> 'checkpointId'), ', ' order by n), '')
          from jsonb_array_elements(coalesce(p_before -> 'checkpointList', '[]')) with ordinality x(c, n)),
         (select coalesce(string_agg(app.checkpoint_name(c ->> 'checkpointId'), ', ' order by n), '')
          from jsonb_array_elements(coalesce(p_after -> 'checkpointList', '[]')) with ordinality x(c, n)));
end;
$$;

-- The part of `changes` on the safety warning, participation requirements and the offline-map tick (BR-M03-C10)
create function app.sensitive_changes(p_changes jsonb) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(c order by n), '[]') from jsonb_array_elements(p_changes) with ordinality x(c, n)
  where c ->> 'fieldLabel' in (app.field_label('ROUTE', 'safetyWarning.vi'), app.field_label('ROUTE', 'safetyWarning.en'),
    app.field_label('ROUTE', 'participationRequirements.vi'), app.field_label('ROUTE', 'participationRequirements.en'),
    app.field_label('ROUTE', 'offlineRouteMapRequired'))
$$;

create function app.empty_review(p_unit_type text, p_revision integer) returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object('unitType', p_unit_type, 'blockingIssues', '[]'::jsonb, 'changes', '[]'::jsonb,
    'sensitiveChanges', '[]'::jsonb, 'affectedRoutes', '[]'::jsonb, 'leftOutCheckpoints', '[]'::jsonb,
    'leftOutQrObjects', '[]'::jsonb, 'impactNotes', '[]'::jsonb, 'noSafetyWarningConfirmationRequired', false,
    'reviewedConcurrencyRevision', p_revision)
$$;

-- STALE naming whoever changed the unit last: its draft or the entity row
create function app.stale_for(p_entity_type text, p_id text, p_updated_at timestamptz, p_draft app.revisions) returns jsonb
language sql stable
set search_path = ''
as $$
  select case when p_draft.revision_id is not null and p_draft.last_edited_at >= p_updated_at
    then app.cr_stale(p_draft.last_edited_by_user_id, p_draft.last_edited_at)
    else app.cr_stale(app.entity_last_editor(p_entity_type, p_id), p_updated_at) end
$$;

-- ---------------------------------------------------------------------------
-- One publication unit (Q-08 and C-05 share it: the guard re-runs exactly as the review showed it, BR-M03-F02).
-- p_publish = false builds the review only. It may write (to see the journey "after publication") and the caller
-- rolls that back; the candidate is never visible to anyone (BR-M03-G09). Unknown unit → no_data_found.
-- Returns {review, data, subjectType, revisionNumber, selfPublished}.
-- ---------------------------------------------------------------------------

create function app.publication_unit(
  p_unit_type text, p_subject_id text, p_actor text, p_publish boolean,
  p_reviewed integer default null, p_no_safety boolean default null
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_review jsonb;
  v_revision integer;
  v_issues jsonb;
  v_published app.revisions;
  v_draft app.revisions;
  v_checkpoint app.checkpoints;
  v_qr app.qr_codes;
  v_route app.routes;
  v_ready text[];
  v_not_ready text[];
  v_parts integer;
  v_routes text[];
  v_rebuilds jsonb;
  v_impact jsonb;
  v_journey jsonb;
  v_size jsonb;
  v_safety boolean;
  v_changes jsonb;
  v_name text;
  v_qr_id text;
  v_versions jsonb;
begin
  if p_unit_type = 'CHECKPOINT_FIRST_PUBLICATION' then
    select * into v_checkpoint from app.checkpoints where checkpoint_id = p_subject_id;
    v_draft := app.draft_of('CHECKPOINT', p_subject_id);
    if v_checkpoint.checkpoint_id is null or v_draft.revision_id is null or v_checkpoint.status <> 'NHAP' then
      raise exception 'publication unit not found' using errcode = 'no_data_found';
    end if;
    if p_publish then
      perform app.lock_connected_set(jsonb_build_array(jsonb_build_object('key', 'checkpoint:' || p_subject_id,
        'name', app.checkpoint_name(p_subject_id))));
    end if;
    -- ready visit points go live with the checkpoint; the others stay drafts (BR-M03-D05)
    select coalesce(array_agg(q.qr_identifier order by q.created_at, q.qr_identifier)
                      filter (where jsonb_array_length(app.qr_issues(q.qr_identifier)) = 0), '{}'),
           coalesce(array_agg(q.qr_identifier order by q.created_at, q.qr_identifier)
                      filter (where jsonb_array_length(app.qr_issues(q.qr_identifier)) > 0), '{}'),
           coalesce(sum(q.concurrency_revision + coalesce((app.draft_of('QRCODE', q.qr_identifier)).concurrency_revision, 0)), 0)
      into v_ready, v_not_ready, v_parts
    from app.qr_codes q where q.checkpoint_id = p_subject_id and q.status = 'NHAP';
    v_revision := v_checkpoint.concurrency_revision + v_draft.concurrency_revision + v_parts;
    v_issues := app.checkpoint_issues(p_subject_id) || app.unreadable_image_issues(p_subject_id, v_ready);
    v_review := app.empty_review(p_unit_type, v_revision) || jsonb_build_object(
      'blockingIssues', v_issues,
      'changes', app.text_changes('CHECKPOINT', 'checkpointName', null, v_draft.content -> 'checkpointName')
        || app.change_line(app.field_label('CHECKPOINT', 'connectivityMode'), '',
             app.display_name('connectivityMode', v_draft.content ->> 'connectivityMode'))
        || coalesce((select jsonb_agg(jsonb_build_object('fieldLabel', 'Điểm tham quan', 'before', '', 'after', app.qr_display_name(r)) order by o)
                     from unnest(v_ready) with ordinality u(r, o)), '[]'),
      'leftOutQrObjects', coalesce((select jsonb_agg(jsonb_build_object('name', app.qr_display_name(r),
          'missing', app.readiness(app.qr_issues(r)) -> 'missing') order by o)
        from unnest(v_not_ready) with ordinality u(r, o)), '[]'),
      'impactNotes', coalesce((select jsonb_agg(n.note order by u.o, n.k)
        from unnest(v_ready) with ordinality u(r, o)
        cross join lateral jsonb_array_elements(app.one_language_notes(app.qr_display_name(u.r), app.current_content('QRCODE', u.r)))
          with ordinality n(note, k)), '[]'));
    if not p_publish then
      return jsonb_build_object('review', v_review);
    end if;
    if p_reviewed is distinct from v_revision then
      perform app.reject(app.stale_for('CHECKPOINT', p_subject_id, v_checkpoint.updated_at, v_draft));
    end if;
    if jsonb_array_length(v_issues) > 0 then
      perform app.reject(app.cr_validation(v_issues));
    end if;
    -- no journey version: no route can list a checkpoint before its first publication (BR-M03-G05)
    v_published := app.promote_draft('CHECKPOINT', p_subject_id, p_actor);
    update app.checkpoints set status = 'HOAT_DONG', concurrency_revision = concurrency_revision + 1 where checkpoint_id = p_subject_id;
    foreach v_qr_id in array v_ready loop
      perform app.promote_draft('QRCODE', v_qr_id, p_actor);
      update app.qr_codes set status = 'HOAT_DONG', concurrency_revision = concurrency_revision + 1 where qr_identifier = v_qr_id;
    end loop;
    return jsonb_build_object('review', v_review, 'subjectType', 'CHECKPOINT',
      'revisionNumber', v_published.revision_number, 'selfPublished', v_published.self_published,
      'data', jsonb_build_object('publishedRevisionNumber', v_published.revision_number, 'newJourneyVersions', '[]'::jsonb));

  elsif p_unit_type = 'QR_OBJECT' then
    select * into v_qr from app.qr_codes where qr_identifier = p_subject_id;
    select * into v_checkpoint from app.checkpoints where checkpoint_id = v_qr.checkpoint_id;
    v_draft := app.draft_of('QRCODE', p_subject_id);
    -- a visit point of an unpublished checkpoint goes with the checkpoint's first publication (BR-M03-D05, E13)
    if v_qr.qr_identifier is null or v_draft.revision_id is null or v_qr.status = 'THU_HOI'
       or v_checkpoint.status is null or v_checkpoint.status not in ('HOAT_DONG', 'TAM_DONG') then
      raise exception 'publication unit not found' using errcode = 'no_data_found';
    end if;
    select coalesce(array_agg(r.route_id order by app.route_name(r.route_id), r.route_id), '{}'), coalesce(sum(r.concurrency_revision), 0)
      into v_routes, v_parts
    from app.affected_routes(v_checkpoint.checkpoint_id) r;
    if p_publish then
      perform app.lock_connected_set(
        jsonb_build_array(jsonb_build_object('key', 'checkpoint:' || v_checkpoint.checkpoint_id, 'name', app.checkpoint_name(v_checkpoint.checkpoint_id)))
        || coalesce((select jsonb_agg(jsonb_build_object('key', 'route:' || r,
             'name', coalesce((app.published_of('ROUTE', r)).content #>> '{name,vi}', ''))) from unnest(v_routes) r), '[]'));
    end if;
    v_revision := v_qr.concurrency_revision + v_draft.concurrency_revision + v_parts;
    v_name := app.qr_display_name(p_subject_id);
    v_issues := app.qr_issues(p_subject_id) || app.unreadable_image_issues(v_checkpoint.checkpoint_id, array[p_subject_id]);
    v_changes := app.text_changes('QRCODE', 'objectName', (app.published_of('QRCODE', p_subject_id)).content -> 'objectName', v_draft.content -> 'objectName')
      || app.text_changes('QRCODE', 'introductionText', (app.published_of('QRCODE', p_subject_id)).content -> 'introductionText',
           v_draft.content -> 'introductionText')
      || app.media_count_changes((app.published_of('QRCODE', p_subject_id)).content, v_draft.content);
    if p_publish then
      if p_reviewed is distinct from v_revision then
        perform app.reject(app.stale_for('QRCODE', p_subject_id, v_qr.updated_at, v_draft));
      end if;
      if jsonb_array_length(v_issues) > 0 then
        perform app.reject(app.cr_validation(v_issues));
      end if;
    end if;
    -- the journey after publication: the visit point active with its draft content (BR-M03-E06, E13)
    v_published := app.promote_draft('QRCODE', p_subject_id, p_actor);
    if v_qr.status = 'NHAP' then
      update app.qr_codes set status = 'HOAT_DONG', concurrency_revision = concurrency_revision + 1 where qr_identifier = p_subject_id;
    end if;
    v_rebuilds := app.rebuild_routes(v_checkpoint.checkpoint_id);
    v_impact := app.rebuild_impact(v_rebuilds);
    v_review := app.empty_review(p_unit_type, v_revision) || jsonb_build_object(
      'blockingIssues', v_issues || case when jsonb_typeof(v_impact -> 'size') = 'object' then jsonb_build_array(v_impact #> '{size,issue}') else '[]'::jsonb end,
      'changes', v_changes,
      'affectedRoutes', v_impact -> 'affectedRoutes',
      'impactNotes', (v_impact -> 'notes') || app.one_language_notes(v_name, v_draft.content));
    if not p_publish then
      return jsonb_build_object('review', v_review);
    end if;
    if jsonb_typeof(v_impact -> 'size') = 'object' then
      perform app.reject(v_impact #> '{size,blocked}');
    end if;
    v_versions := app.commit_rebuilds(v_rebuilds);
    return jsonb_build_object('review', v_review, 'subjectType', 'QRCODE',
      'revisionNumber', v_published.revision_number, 'selfPublished', v_published.self_published,
      'data', jsonb_build_object('publishedRevisionNumber', v_published.revision_number, 'newJourneyVersions', v_versions));

  elsif p_unit_type = 'ROUTE_FIRST_PUBLICATION' then
    select * into v_route from app.routes where route_id = p_subject_id;
    v_draft := app.draft_of('ROUTE', p_subject_id);
    if v_route.route_id is null or v_draft.revision_id is null or v_route.status <> 'NHAP' then
      raise exception 'publication unit not found' using errcode = 'no_data_found';
    end if;
    -- connected set: the route and every checkpoint of its list (BR-M03-F05; R-08)
    if p_publish then
      perform app.lock_connected_set(
        jsonb_build_array(jsonb_build_object('key', 'route:' || p_subject_id, 'name',
          coalesce(nullif(app.trim_text(v_draft.content #>> '{name,vi}'), ''), 'Tuyến chưa đặt tên')))
        || coalesce((select jsonb_agg(jsonb_build_object('key', 'checkpoint:' || k.checkpoint_id, 'name', app.checkpoint_name(k.checkpoint_id)))
                     from app.checkpoints k
                     where k.checkpoint_id in (select c ->> 'checkpointId' from jsonb_array_elements(coalesce(v_draft.content -> 'checkpointList', '[]')) c)), '[]'));
    end if;
    select coalesce(sum(k.concurrency_revision), 0) into v_parts from app.checkpoints k
    where k.checkpoint_id in (select c ->> 'checkpointId' from jsonb_array_elements(coalesce(v_draft.content -> 'checkpointList', '[]')) c);
    v_revision := v_route.concurrency_revision + v_draft.concurrency_revision + v_parts;
    v_name := coalesce(nullif(app.trim_text(v_draft.content #>> '{name,vi}'), ''), 'Tuyến chưa đặt tên');
    v_journey := app.build_journey(p_subject_id, v_draft.content);
    -- the "no warning" tick is on the review screen, not a gap of the draft (BR-M03-C09)
    v_issues := coalesce((select jsonb_agg(i order by n) from jsonb_array_elements(app.route_publish_issues(p_subject_id, v_draft.content))
                          with ordinality x(i, n) where i ->> 'messageKey' <> 'MSG-SAFETY-CONFIRM'), '[]');
    if (v_journey ->> 'sizeBytes')::bigint > app.limit('OFFLINE_PACKAGE_MAX_MB')::bigint * app.limit('BYTES_PER_MB') then
      v_size := app.size_block(p_subject_id, v_name, v_journey);
    end if;
    v_safety := not app.has_text(v_draft.content -> 'safetyWarning')
      and (v_draft.content ->> 'noSafetyWarningConfirmed')::boolean is not true;
    v_changes := app.route_changes(null, v_draft.content);
    v_review := app.empty_review(p_unit_type, v_revision) || jsonb_build_object(
      'blockingIssues', v_issues || case when v_size is null then '[]'::jsonb else jsonb_build_array(v_size -> 'issue') end,
      'noSafetyWarningConfirmationRequired', v_safety,
      'leftOutCheckpoints', v_journey -> 'leftOut',
      'affectedRoutes', jsonb_build_array(jsonb_build_object('routeId', p_subject_id, 'routeName', v_name, 'routeStatus', 'HOAT_DONG',
        'createsNewJourneyVersion', true, 'estimatedOfflineSizeBytes', (v_journey ->> 'sizeBytes')::bigint, 'closesAutomatically', false)),
      'changes', v_changes,
      'sensitiveChanges', app.sensitive_changes(v_changes));
    if not p_publish then
      return jsonb_build_object('review', v_review);
    end if;
    if p_reviewed is distinct from v_revision then
      perform app.reject(app.stale_for('ROUTE', p_subject_id, v_route.updated_at, v_draft));
    end if;
    if jsonb_array_length(v_issues) > 0 then
      perform app.reject(app.cr_validation(v_issues));
    end if;
    if v_size is not null then
      perform app.reject(v_size -> 'blocked');
    end if;
    if v_safety and p_no_safety is not true then
      perform app.reject(app.cr_blocked('MSG-SAFETY-CONFIRM'));
    end if;
    -- the tick confirmed on the review is stored in the content and copied to later drafts (BR-M03-C09)
    if v_safety then
      update app.revisions set content = content || '{"noSafetyWarningConfirmed": true}', concurrency_revision = concurrency_revision + 1
      where revision_id = v_draft.revision_id;
    end if;
    -- publishing a route never publishes a checkpoint or a visit point (BR-M03-C17); version 1 with HOAT_DONG (F04)
    v_published := app.promote_draft('ROUTE', p_subject_id, p_actor);
    return jsonb_build_object('review', v_review, 'subjectType', 'ROUTE',
      'revisionNumber', v_published.revision_number, 'selfPublished', v_published.self_published,
      'data', jsonb_build_object('publishedRevisionNumber', v_published.revision_number,
        'newJourneyVersions', jsonb_build_array(jsonb_build_object('routeId', p_subject_id,
          'contentVersion', app.commit_snapshot(p_subject_id, v_journey -> 'candidate', true)))));
  end if;
  raise exception 'publication unit not found' using errcode = 'no_data_found';
end;
$$;

-- Q-08: the review on stored data, never written (R-26). The unit's writes run in a block that is rolled back.
create function api.open_publication_review(p_unit_type text, p_subject_id text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_admin app.admin_accounts := app.require_reader();
  v_review jsonb;
begin
  begin
    v_review := app.publication_unit(p_unit_type, p_subject_id, v_admin.user_id, false) -> 'review';
    raise exception using errcode = 'CPQRV', message = v_review::text;
  exception when sqlstate 'CPQRV' then
    v_review := sqlerrm::jsonb;
  end;
  return v_review;
end;
$$;

-- C-05 publish one unit (BR-M03-F01–F05, G01–G07; R-07): one transaction, one audit line with the self-published flag
create function api.publish_unit(
  p_unit_type text, p_subject_id text, p_reviewed_concurrency_revision integer default null,
  p_no_safety_warning_confirmed boolean default null
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_type text := case when p_unit_type = 'QR_OBJECT' then 'QRCODE' when p_unit_type like 'ROUTE%' then 'ROUTE' else 'CHECKPOINT' end;
  v_unit jsonb;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    v_unit := app.publication_unit(p_unit_type, p_subject_id, v_actor.user_id, true,
      p_reviewed_concurrency_revision, p_no_safety_warning_confirmed);
    perform app.audit(v_actor.user_id, 'PUBLISHED', v_type, p_subject_id, 'SUCCESS', null,
      (v_unit ->> 'revisionNumber')::integer, (v_unit ->> 'selfPublished')::boolean, null,
      jsonb_build_object('changes', v_unit #> '{review,changes}',
        'affectedRoutes', jsonb_path_query_array(v_unit #> '{review,affectedRoutes}', '$[*].routeName')));
    return app.cr_ok('MSG-PUBLISHED', v_unit -> 'data');
  exception
    when no_data_found then
      v_result := app.cr_failed();
    when others then
      v_result := app.result_from_error(sqlstate, sqlerrm, 'MSG-PUBLISH-FAILED');
  end;
  perform app.audit(auth.uid()::text, 'PUBLISHED', v_type, coalesce(p_subject_id, ''), 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (admin-command §7: both roles)
-- ---------------------------------------------------------------------------
grant execute on function api.save_route_draft(text, jsonb, jsonb, jsonb) to authenticated;
grant execute on function api.list_routes(text, text) to authenticated;
grant execute on function api.get_route_editor(text) to authenticated;
grant execute on function api.list_selectable_checkpoints(text) to authenticated;
grant execute on function api.open_publication_review(text, text) to authenticated;
grant execute on function api.publish_unit(text, text, integer, boolean) to authenticated;
