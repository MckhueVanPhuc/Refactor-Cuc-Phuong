-- M03 migration 3c — checkpoints, visit points, media (tasks M03 T181; admin-command C-02, C-03, C-04, C-07, C-16,
-- C-17, Q-05, Q-06, Q-07; media-storage-contract §1; research R-07, R-08, R-09, R-19, R-26; Physical §8, §14 O-1;
-- BR-M03-B01–B03, D01–D04, D09, D11, E02–E05, E09–E17, F06, F11).
-- Issues use the same rules, keys and sentences as src/modules/m03/validation/{common,checkpoint,visitPoint}.ts:
-- save-time issues reject the save (BLOCKS_SAVE); publication gaps (BLOCKS_PUBLISH) feed readiness on stored data.

-- DAC-M03-059 / Physical §8: a missing spoken language makes the visit point not ready (MSG-AV-LANGUAGE-MISSING);
-- it does not block the upload. Only an image must never carry one (validation-report D-95).
alter table app.media drop constraint media_spoken_language;
alter table app.media add constraint media_spoken_language check (spoken_language is null or type in ('AUDIO', 'VIDEO'));

-- ---------------------------------------------------------------------------
-- Small helpers
-- ---------------------------------------------------------------------------

create function app.iso(p_at timestamptz) returns text
language sql immutable
set search_path = ''
as $$ select to_char(p_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') $$;

create function app.user_email(p_user_id text) returns text
language sql stable
set search_path = ''
as $$ select coalesce((select a.email from app.admin_accounts a where a.user_id = p_user_id), '') $$;

-- {key: value}, or {} when the value is absent — an absent field has no key (DTO optional fields)
create function app.jsonb_opt(p_key text, p_value jsonb) returns jsonb
language sql immutable
set search_path = ''
as $$ select case when p_value is null or p_value = 'null'::jsonb then '{}'::jsonb else jsonb_build_object(p_key, p_value) end $$;

-- No SET clause: a pure invoker helper with qualified names only, so the planner can inline it (a SET blocks inlining;
-- validation-report D-127). Fixed search_path stays mandatory for SECURITY DEFINER functions (plan §V).
create function app.trim_text(p_value text) returns text
language sql immutable
as $$ select btrim(p_value, E' \t\r\n') $$;

-- Present and not blank: a non-empty string after trim, a non-empty array, any other value
-- No SET clause, so it can be inlined (see app.trim_text)
create function app.is_blank(p_value jsonb) returns boolean
language sql immutable
as $$
  select p_value is null or p_value = 'null'::jsonb
    or (jsonb_typeof(p_value) = 'string' and app.trim_text(p_value #>> '{}') = '')
    or (jsonb_typeof(p_value) = 'array' and jsonb_array_length(p_value) = 0)
$$;

-- Who changed an entity last, for STALE (R-09): actor of its latest successful audit line
create function app.entity_last_editor(p_entity_type text, p_entity_id text) returns text
language sql stable
set search_path = ''
as $$
  select r.actor_user_id from app.audit_records r
  where r.entity_type = p_entity_type and r.entity_id = p_entity_id and r.outcome = 'SUCCESS'
  order by r.occurred_at desc, r.audit_id desc
  limit 1
$$;

-- Reason / note of a command (admin-command §1): BLOCKED result, or null when acceptable
create function app.reason_problem(p_reason text, p_required boolean, p_label text default 'Lý do') returns jsonb
language sql immutable
set search_path = ''
as $$
  select case
    when p_required and app.text_len(coalesce(p_reason, '')) = 0
      then app.cr_blocked('MSG-MISSING-FIELD', jsonb_build_object('tên ô', p_label))
    when app.text_len(coalesce(p_reason, '')) > app.limit('NOTE_MAX_CHARS')
      then app.cr_blocked('MSG-LIMIT-TEXT', jsonb_build_object(
        'Tên ô', p_label, 'tối đa', app.limit('NOTE_MAX_CHARS'), 'số', app.text_len(p_reason)))
  end
$$;

-- Read callers of queries: an active administrator, else a permission error (adapter → MSG-NO-PERMISSION)
create function app.require_reader() returns app.admin_accounts
language plpgsql stable
set search_path = ''
as $$
declare
  v_admin app.admin_accounts := app.current_admin();
begin
  if v_admin.email is null then
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;
  return v_admin;
end;
$$;

-- ---------------------------------------------------------------------------
-- Revisions (spec-M03 §6.3): one pending draft, one published revision
-- ---------------------------------------------------------------------------

create function app.draft_of(p_type text, p_id text) returns app.revisions
language sql stable
set search_path = ''
as $$ select * from app.revisions r where r.subject_type = p_type and r.subject_id = p_id and r.status = 'NHAP' $$;

create function app.published_of(p_type text, p_id text) returns app.revisions
language sql stable
set search_path = ''
as $$ select * from app.revisions r where r.subject_type = p_type and r.subject_id = p_id and r.status = 'PHAT_HANH' $$;

-- The content being edited: the draft, else the published revision
create function app.current_content(p_type text, p_id text) returns jsonb
language sql stable
set search_path = ''
as $$ select coalesce((app.draft_of(p_type, p_id)).content, (app.published_of(p_type, p_id)).content, '{}'::jsonb) $$;

create function app.ever_published(p_type text, p_id text) returns boolean
language sql stable
set search_path = ''
as $$
  select exists (select 1 from app.revisions r
                 where r.subject_type = p_type and r.subject_id = p_id and r.status in ('PHAT_HANH', 'LUU_TRU'))
$$;

-- Write the pending draft: update it, or start one based on the published revision
create function app.write_draft(p_type text, p_id text, p_content jsonb, p_actor text) returns app.revisions
language plpgsql
set search_path = ''
as $$
declare
  v_revision app.revisions;
begin
  update app.revisions
  set content = p_content, last_edited_by_user_id = p_actor, last_edited_at = now(),
      concurrency_revision = concurrency_revision + 1
  where subject_type = p_type and subject_id = p_id and status = 'NHAP'
  returning * into v_revision;
  if found then
    return v_revision;
  end if;
  insert into app.revisions (subject_type, subject_id, revision_number, content, based_on_revision_number,
                             created_by_user_id, last_edited_by_user_id)
  values (p_type, p_id,
          coalesce((select max(r.revision_number) from app.revisions r where r.subject_type = p_type and r.subject_id = p_id), 0) + 1,
          p_content, (app.published_of(p_type, p_id)).revision_number, p_actor, p_actor)
  returning * into v_revision;
  return v_revision;
end;
$$;

-- STALE check of an entity row and its pending draft (BR-M03-F06): an existing draft the caller did not submit
-- means someone else just created it
create function app.expect_entity(
  p_expected jsonb, p_entity_type text, p_entity_id text, p_current integer, p_updated_at timestamptz, p_draft app.revisions
) returns void
language plpgsql stable
set search_path = ''
as $$
begin
  perform app.expect_revision((p_expected ->> 'entity')::integer, p_current,
    app.entity_last_editor(p_entity_type, p_entity_id), p_updated_at);
  if p_draft.revision_id is not null then
    perform app.expect_revision((p_expected ->> 'draft')::integer, p_draft.concurrency_revision,
      p_draft.last_edited_by_user_id, p_draft.last_edited_at);
  end if;
end;
$$;

create function app.editor_revision(p_revision app.revisions) returns jsonb
language sql stable
set search_path = ''
as $$
  select case when p_revision.revision_id is null then null else
    jsonb_build_object(
      'revisionNumber', p_revision.revision_number,
      'status', p_revision.status,
      'lastEditedByEmail', app.user_email(p_revision.last_edited_by_user_id),
      'lastEditedAt', app.iso(p_revision.last_edited_at),
      'concurrencyRevision', p_revision.concurrency_revision,
      'content', p_revision.content)
    || app.jsonb_opt('basedOnRevisionNumber', to_jsonb(p_revision.based_on_revision_number))
    || case when p_revision.published_by_user_id is null then '{}'::jsonb else jsonb_build_object(
         'publishedByEmail', app.user_email(p_revision.published_by_user_id),
         'publishedAt', app.iso(p_revision.published_at),
         'selfPublished', p_revision.self_published) end
  end
$$;

-- ---------------------------------------------------------------------------
-- Issue builders (validation/common.ts)
-- ---------------------------------------------------------------------------

-- Text above its limit (BLOCKS_SAVE, MSG-LIMIT-TEXT); blank is not reported here
create function app.check_text(p_type text, p_id text, p_key text, p_value text, p_max integer) returns jsonb
language sql stable
set search_path = ''
as $$
  select case when app.text_len(coalesce(p_value, '')) > p_max then jsonb_build_array(app.issue(
    'BLOCKS_SAVE', p_type, p_id, p_key, 'MSG-LIMIT-TEXT',
    jsonb_build_object('Tên ô', app.field_label(p_type, p_key), 'tối đa', p_max, 'số', app.text_len(p_value))))
  else '[]'::jsonb end
$$;

-- Required at publication (BLOCKS_PUBLISH, MSG-MISSING-FIELD)
create function app.check_required(p_type text, p_id text, p_key text, p_value jsonb) returns jsonb
language sql stable
set search_path = ''
as $$
  select case when app.is_blank(p_value) then jsonb_build_array(app.issue(
    'BLOCKS_PUBLISH', p_type, p_id, p_key, 'MSG-MISSING-FIELD', jsonb_build_object('tên ô', app.field_label(p_type, p_key))))
  else '[]'::jsonb end
$$;

-- Required bilingual: both missing → MSG-MISSING-FIELD on the Vietnamese box with the base label;
-- one missing → MSG-MISSING-LANGUAGE on the missing box
create function app.check_required_bilingual(p_type text, p_id text, p_key text, p_value jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_has_vi boolean := not app.is_blank(p_value -> 'vi');
  v_has_en boolean := not app.is_blank(p_value -> 'en');
  v_base text := app.field_label(p_type, p_key);
  v_missing text;
begin
  if not v_has_vi and not v_has_en then
    return jsonb_build_array(app.issue('BLOCKS_PUBLISH', p_type, p_id, p_key || '.vi', 'MSG-MISSING-FIELD',
      jsonb_build_object('tên ô', v_base), v_base));
  end if;
  if v_has_vi = v_has_en then
    return '[]';
  end if;
  v_missing := case when v_has_vi then 'en' else 'vi' end;
  return jsonb_build_array(app.issue('BLOCKS_PUBLISH', p_type, p_id, p_key || '.' || v_missing, 'MSG-MISSING-LANGUAGE',
    jsonb_build_object('Tên ô', v_base, 'tiếng Việt / tiếng Anh', case v_missing when 'vi' then 'tiếng Việt' else 'tiếng Anh' end)));
end;
$$;

-- Readiness from issues: distinct field labels in order (§5.4 "Chưa đủ: …")
create function app.readiness(p_issues jsonb) returns jsonb
language sql immutable
set search_path = ''
as $$
  select jsonb_build_object('ready', jsonb_array_length(coalesce(p_issues, '[]')) = 0,
    'missing', coalesce((
      select jsonb_agg(label order by first_at)
      from (select i ->> 'fieldLabel' as label, min(n) as first_at
            from jsonb_array_elements(coalesce(p_issues, '[]')) with ordinality as e(i, n)
            group by i ->> 'fieldLabel') labels), '[]'))
$$;

-- ---------------------------------------------------------------------------
-- Checkpoints (validation/checkpoint.ts)
-- ---------------------------------------------------------------------------

-- Same comparison as the UI: trim, case-insensitive (BR-M03-D03)
create function app.normalize_name(p_name text) returns text
language sql immutable
set search_path = ''
as $$ select lower(app.trim_text(coalesce(p_name, ''))) $$;

create function app.checkpoint_name(p_checkpoint_id text) returns text
language sql stable
set search_path = ''
as $$ select coalesce(app.trim_text(app.current_content('CHECKPOINT', p_checkpoint_id) #>> '{checkpointName,vi}'), '') $$;

create function app.route_name(p_route_id text) returns text
language sql stable
set search_path = ''
as $$ select coalesce(app.trim_text(app.current_content('ROUTE', p_route_id) #>> '{name,vi}'), '') $$;

create function app.checkpoint_save_issues(p_id text, p_content jsonb, p_location_note text) returns jsonb
language sql stable
set search_path = ''
as $$
  select app.check_text('CHECKPOINT', p_id, 'checkpointName.vi', p_content #>> '{checkpointName,vi}', app.limit('NAME_MAX_CHARS'))
    || app.check_text('CHECKPOINT', p_id, 'checkpointName.en', p_content #>> '{checkpointName,en}', app.limit('NAME_MAX_CHARS'))
    || app.check_text('CHECKPOINT', p_id, 'locationNote', p_location_note, app.limit('NOTE_MAX_CHARS'))
    -- "Dùng được khi có mạng" only after the field-verification tick (BR-M03-D02)
    || case when p_content ->> 'connectivityMode' = 'ONLINE_AVAILABLE'
              and p_content -> 'fieldVerificationConfirmed' is distinct from 'true'::jsonb
         then jsonb_build_array(app.issue('BLOCKS_SAVE', 'CHECKPOINT', p_id, 'fieldVerificationConfirmed', 'MSG-ONLINE-NOT-VERIFIED',
           jsonb_build_object('tên', coalesce(app.trim_text(p_content #>> '{checkpointName,vi}'), ''))))
         else '[]'::jsonb end
$$;

-- Vietnamese name used by another non-archived checkpoint (draft or published). The caller holds the name lock.
create function app.checkpoint_name_taken(p_id text, p_name text) returns jsonb
language sql stable
set search_path = ''
as $$
  select case when app.normalize_name(p_name) <> '' and exists (
    select 1 from app.checkpoints c
    join app.revisions r on r.subject_type = 'CHECKPOINT' and r.subject_id = c.checkpoint_id and r.status in ('NHAP', 'PHAT_HANH')
    where c.checkpoint_id <> p_id and c.status <> 'LUU_TRU'
      and app.normalize_name(r.content #>> '{checkpointName,vi}') = app.normalize_name(p_name))
  then jsonb_build_array(app.issue('BLOCKS_SAVE', 'CHECKPOINT', p_id, 'checkpointName.vi', 'MSG-CHECKPOINT-NAME-TAKEN',
    jsonb_build_object('tên', app.trim_text(p_name))))
  else '[]'::jsonb end
$$;

-- ---------------------------------------------------------------------------
-- Visit points (validation/visitPoint.ts)
-- ---------------------------------------------------------------------------

-- Order of creation within the checkpoint, revoked ones included ("chưa đặt tên {số}", BR-M03-E16)
create function app.qr_creation_order(p_qr_identifier text) returns integer
language sql stable
set search_path = ''
as $$
  select o.n::integer from (
    select q.qr_identifier, row_number() over (order by q.created_at, q.qr_identifier) as n
    from app.qr_codes q
    where q.checkpoint_id = (select x.checkpoint_id from app.qr_codes x where x.qr_identifier = p_qr_identifier)) o
  where o.qr_identifier = p_qr_identifier
$$;

-- No SET clause, so it can be inlined (see app.trim_text)
create function app.visit_point_name(p_name text, p_order integer) returns text
language sql immutable
as $$ select coalesce(nullif(app.trim_text(p_name), ''), 'Điểm tham quan chưa đặt tên ' || p_order) $$;

create function app.qr_display_name(p_qr_identifier text) returns text
language sql stable
set search_path = ''
as $$
  select app.visit_point_name(app.current_content('QRCODE', p_qr_identifier) #>> '{objectName,vi}',
                              app.qr_creation_order(p_qr_identifier))
$$;

-- Media of a QR content in `mediaItems` order: [{mediaId, type, usageRightsConfirmed, spokenLanguage?}].
-- With p_settings (a save), rights and spoken language come from the form; otherwise from the stored rows.
create function app.qr_media_list(p_content jsonb, p_settings jsonb default null) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object('mediaId', m.media_id, 'type', m.type,
      'usageRightsConfirmed', case when p_settings is null then m.usage_rights_confirmed
                                   else coalesce((s.setting ->> 'usageRightsConfirmed')::boolean, false) end)
    || app.jsonb_opt('spokenLanguage', case
         when m.type = 'IMAGE' then null
         when p_settings is null then to_jsonb(m.spoken_language)
         else s.setting -> 'spokenLanguage' end)
    order by i.n), '[]')
  from jsonb_array_elements(coalesce(p_content -> 'mediaItems', '[]')) with ordinality as i(item, n)
  join app.media m on m.media_id::text = i.item ->> 'mediaId'
  left join lateral (
    select e as setting from jsonb_array_elements(coalesce(p_settings, '[]')) e
    where e ->> 'mediaId' = m.media_id::text limit 1) s on true
$$;

create function app.visit_point_save_issues(
  p_qr text, p_display_name text, p_checkpoint_name text, p_mode text, p_content jsonb, p_installation_label text, p_media jsonb
) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_images integer := (select count(*) from jsonb_array_elements(p_media) e where e ->> 'type' = 'IMAGE');
  v_av integer := (select count(*) from jsonb_array_elements(p_media) e where e ->> 'type' <> 'IMAGE');
  v_issues jsonb;
begin
  v_issues := app.check_text('QRCODE', p_qr, 'objectName.vi', p_content #>> '{objectName,vi}', app.limit('NAME_MAX_CHARS'))
    || app.check_text('QRCODE', p_qr, 'objectName.en', p_content #>> '{objectName,en}', app.limit('NAME_MAX_CHARS'))
    || app.check_text('QRCODE', p_qr, 'introductionText.vi', p_content #>> '{introductionText,vi}', app.limit('QR_INTRO_MAX_CHARS'))
    || app.check_text('QRCODE', p_qr, 'introductionText.en', p_content #>> '{introductionText,en}', app.limit('QR_INTRO_MAX_CHARS'))
    || app.check_text('QRCODE', p_qr, 'installationLabel', p_installation_label, app.limit('NOTE_MAX_CHARS'));
  if v_images > app.limit('QR_MAX_IMAGES') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'QRCODE', p_qr, 'images', 'MSG-COUNT-IMAGES',
      jsonb_build_object('Tên điểm tham quan hoặc tên tuyến', p_display_name, 'tối đa', app.limit('QR_MAX_IMAGES'))));
  end if;
  if v_av > 0 and p_mode = 'OFFLINE_REQUIRED' then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'QRCODE', p_qr, 'avFiles', 'MSG-AV-OFFLINE',
      jsonb_build_object('tên', p_checkpoint_name)));
  elsif v_av > app.limit('QR_MAX_AV_FILES') then
    v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_SAVE', 'QRCODE', p_qr, 'avFiles', 'MSG-COUNT-AV',
      jsonb_build_object('Tên điểm tham quan', p_display_name, 'tối đa', app.limit('QR_MAX_AV_FILES'))));
  end if;
  return v_issues;
end;
$$;

-- Publication gaps (BR-M03-E05, E17; DAC-M03-052): bilingual texts, introduction length, rights, spoken language
create function app.visit_point_publish_issues(p_qr text, p_display_name text, p_content jsonb, p_media jsonb) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_issues jsonb := app.check_required_bilingual('QRCODE', p_qr, 'objectName', p_content -> 'objectName')
    || app.check_required_bilingual('QRCODE', p_qr, 'introductionText', p_content -> 'introductionText');
  v_language text;
  v_length integer;
  v_item record;
  v_label text;
begin
  foreach v_language in array array['vi', 'en'] loop
    v_length := app.text_len(coalesce(p_content -> 'introductionText' ->> v_language, ''));
    if v_length > 0 and v_length < app.limit('QR_INTRO_MIN_CHARS') then
      v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'QRCODE', p_qr, 'introductionText.' || v_language,
        'MSG-MISSING-FIELD', jsonb_build_object('tên ô',
          app.field_label('QRCODE', 'introductionText.' || v_language) || ' (ít nhất ' || app.limit('QR_INTRO_MIN_CHARS') || ' ký tự)')));
    end if;
  end loop;
  for v_item in
    select e.item, (e.n - 1)::integer as idx,
      (row_number() over (partition by e.item ->> 'type' = 'IMAGE' order by e.n))::integer as type_n
    from jsonb_array_elements(p_media) with ordinality as e(item, n)
    order by e.n
  loop
    v_label := p_display_name || ' – ' || case when v_item.item ->> 'type' = 'IMAGE' then 'ảnh' else 'âm thanh/video' end
      || ' ' || v_item.type_n;
    if (v_item.item ->> 'usageRightsConfirmed')::boolean is not true then
      v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'QRCODE', p_qr, 'usageRights.' || v_item.idx,
        'MSG-RIGHTS-NOT-CONFIRMED', jsonb_build_object('tên tệp', v_label)));
    end if;
    if v_item.item ->> 'type' <> 'IMAGE' and app.is_blank(v_item.item -> 'spokenLanguage') then
      v_issues := v_issues || jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'QRCODE', p_qr, 'spokenLanguage.' || v_item.idx,
        'MSG-AV-LANGUAGE-MISSING', jsonb_build_object('tên tệp', v_label)));
    end if;
  end loop;
  return v_issues;
end;
$$;

-- Every issue of a visit point on stored data: the current content (draft, else published)
create function app.qr_issues(p_qr_identifier text) returns jsonb
language plpgsql stable
set search_path = ''
as $$
declare
  v_qr app.qr_codes;
  v_content jsonb := app.current_content('QRCODE', p_qr_identifier);
  v_media jsonb := app.qr_media_list(v_content);
  v_name text := app.qr_display_name(p_qr_identifier);
begin
  select * into v_qr from app.qr_codes where qr_identifier = p_qr_identifier;
  return app.visit_point_save_issues(p_qr_identifier, v_name, app.checkpoint_name(v_qr.checkpoint_id),
           app.checkpoint_saved_mode(v_qr.checkpoint_id), v_content, v_qr.installation_label, v_media)
    || app.visit_point_publish_issues(p_qr_identifier, v_name, v_content, v_media);
end;
$$;

-- Publication gaps of a checkpoint, BR-M03-D04 conditions 1–3 (condition 4, readable images, is a publish guard)
create function app.checkpoint_issues(p_checkpoint_id text) returns jsonb
language sql stable
set search_path = ''
as $$
  select app.check_required_bilingual('CHECKPOINT', p_checkpoint_id, 'checkpointName',
           app.current_content('CHECKPOINT', p_checkpoint_id) -> 'checkpointName')
    || app.check_required('CHECKPOINT', p_checkpoint_id, 'connectivityMode',
           app.current_content('CHECKPOINT', p_checkpoint_id) -> 'connectivityMode')
    || case when not exists (
         select 1 from app.qr_codes q
         where q.checkpoint_id = p_checkpoint_id and q.status <> 'THU_HOI'
           and jsonb_array_length(app.qr_issues(q.qr_identifier)) = 0)
       then jsonb_build_array(app.issue('BLOCKS_PUBLISH', 'CHECKPOINT', p_checkpoint_id, 'visitPoints', 'MSG-MISSING-FIELD',
         jsonb_build_object('tên ô', 'ít nhất một điểm tham quan sẵn sàng')))
       else '[]'::jsonb end
$$;

-- Display names of open visit points with audio/video in their draft or published content (MSG-MODE-HAS-AV)
create function app.visit_points_with_av(p_checkpoint_id text) returns text[]
language sql stable
set search_path = ''
as $$
  select coalesce(array_agg(app.qr_display_name(q.qr_identifier) order by q.created_at, q.qr_identifier), '{}')
  from app.qr_codes q
  where q.checkpoint_id = p_checkpoint_id and q.status <> 'THU_HOI'
    and exists (
      select 1 from app.revisions r
      cross join lateral jsonb_array_elements(coalesce(r.content -> 'mediaItems', '[]')) i
      join app.media m on m.media_id::text = i ->> 'mediaId'
      where r.subject_type = 'QRCODE' and r.subject_id = q.qr_identifier and r.status in ('NHAP', 'PHAT_HANH')
        and m.type <> 'IMAGE')
$$;

-- Non-archived routes listing a checkpoint in their draft or published list (BR-M03-F05, X03)
create function app.routes_using(p_checkpoint_id text, p_with_status boolean default false) returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object('routeId', r.route_id, 'routeName', app.route_name(r.route_id))
    || case when p_with_status then jsonb_build_object('routeStatus', r.status) else '{}'::jsonb end
    order by app.route_name(r.route_id), r.route_id), '[]')
  from app.routes r
  where r.route_id in (select app.routes_listing(p_checkpoint_id))
$$;

-- Random identifier ≥ 16 [A-Za-z0-9] from a secure source; a collision is regenerated, never reported (BR-M03-B01–B03)
create function app.new_qr_identifier() returns text
language plpgsql volatile
set search_path = ''
as $$
declare
  c_alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_bytes bytea;
  v_id text;
begin
  loop
    v_bytes := extensions.gen_random_bytes(20);
    select string_agg(substr(c_alphabet, get_byte(v_bytes, i) % 62 + 1, 1), '' order by i) into v_id
    from generate_series(0, 19) as i;
    exit when not exists (select 1 from app.qr_codes where qr_identifier = v_id);
  end loop;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-02 save checkpoint draft (BR-M03-D01–D03, D11, F06, F11)
-- ---------------------------------------------------------------------------

create function api.save_checkpoint_draft(
  p_checkpoint_id text default null, p_expected jsonb default '{}', p_content jsonb default '{}', p_location_note text default null
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_checkpoint app.checkpoints;
  v_draft app.revisions;
  v_published app.revisions;
  v_revision app.revisions;
  v_previous jsonb;
  v_stored jsonb;
  v_id text;
  v_issues jsonb;
  v_note text := nullif(app.trim_text(p_location_note), '');
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    if p_checkpoint_id is not null then
      select * into v_checkpoint from app.checkpoints where checkpoint_id = p_checkpoint_id for update;
      if v_checkpoint.checkpoint_id is null then
        perform app.reject(app.cr_failed());
      end if;
      v_draft := app.draft_of('CHECKPOINT', p_checkpoint_id);
      perform app.expect_entity(p_expected, 'CHECKPOINT', p_checkpoint_id, v_checkpoint.concurrency_revision,
        v_checkpoint.updated_at, v_draft);
      if v_checkpoint.status = 'LUU_TRU' then
        perform app.reject(app.cr_failed());
      end if;
    end if;
    v_id := coalesce(v_checkpoint.checkpoint_id, app.new_id());

    -- serialize saves of the same normalized name (Physical §14 O-1)
    perform pg_advisory_xact_lock(hashtextextended('checkpoint-name:' || app.normalize_name(p_content #>> '{checkpointName,vi}'), 0));
    v_issues := app.checkpoint_save_issues(v_id, p_content, p_location_note)
      || app.checkpoint_name_taken(v_id, p_content #>> '{checkpointName,vi}')
      || case when v_checkpoint.checkpoint_id is not null and p_content ->> 'connectivityMode' = 'OFFLINE_REQUIRED'
                and cardinality(app.visit_points_with_av(v_id)) > 0
           then jsonb_build_array(app.issue('BLOCKS_SAVE', 'CHECKPOINT', v_id, 'connectivityMode', 'MSG-MODE-HAS-AV',
             jsonb_build_object('danh sách', array_to_string(app.visit_points_with_av(v_id), ', '))))
           else '[]'::jsonb end;
    if jsonb_array_length(v_issues) > 0 then
      perform app.reject(app.cr_validation(v_issues));
    end if;

    -- who confirmed the field verification and when is set by M03; leaving ONLINE clears it (BR-M03-D02)
    v_previous := case when v_checkpoint.checkpoint_id is null then '{}'::jsonb else app.current_content('CHECKPOINT', v_id) end;
    v_stored := p_content - 'fieldVerifiedByUserId' - 'fieldVerifiedAt';
    if p_content ->> 'connectivityMode' = 'ONLINE_AVAILABLE' and (p_content ->> 'fieldVerificationConfirmed')::boolean then
      if v_previous ->> 'connectivityMode' = 'ONLINE_AVAILABLE' and (v_previous ->> 'fieldVerificationConfirmed')::boolean then
        v_stored := v_stored || jsonb_build_object('fieldVerifiedByUserId', v_previous -> 'fieldVerifiedByUserId',
                                                   'fieldVerifiedAt', v_previous -> 'fieldVerifiedAt');
      else
        v_stored := v_stored || jsonb_build_object('fieldVerifiedByUserId', v_actor.user_id, 'fieldVerifiedAt', app.iso(now()));
      end if;
    else
      v_stored := v_stored - 'fieldVerificationConfirmed';
    end if;

    if v_checkpoint.checkpoint_id is null then
      insert into app.checkpoints (checkpoint_id, location_note, created_by_user_id) values (v_id, v_note, v_actor.user_id);
    else
      update app.checkpoints set location_note = v_note, concurrency_revision = concurrency_revision + 1
      where checkpoint_id = v_id;
    end if;

    -- only the location note of a published checkpoint changed: notes are not published, so no pending draft (D11)
    v_published := app.published_of('CHECKPOINT', v_id);
    if v_checkpoint.checkpoint_id is not null and v_draft.revision_id is null and v_published.revision_id is not null
       and v_published.content = v_stored then
      v_revision := v_published;
    else
      v_revision := app.write_draft('CHECKPOINT', v_id, v_stored, v_actor.user_id);
    end if;

    perform app.audit(v_actor.user_id, 'CHECKPOINT_DRAFT_SAVED', 'CHECKPOINT', v_id, 'SUCCESS', null, v_revision.revision_number);
    return app.cr_ok('MSG-SAVED', jsonb_build_object('checkpointId', v_id, 'revisionNumber', v_revision.revision_number,
      'concurrencyRevision', v_revision.concurrency_revision));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'CHECKPOINT_DRAFT_SAVED', 'CHECKPOINT', coalesce(p_checkpoint_id, ''), 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-03 save visit point draft (BR-M03-B01–B03, E02–E04, E14–E17, F11): QR, revision and per-file settings at once
-- ---------------------------------------------------------------------------

create function api.save_visit_point_draft(
  p_checkpoint_id text, p_qr_identifier text default null, p_expected jsonb default '{}', p_content jsonb default '{}',
  p_installation_label text default null, p_media_settings jsonb default '[]'
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_checkpoint app.checkpoints;
  v_qr app.qr_codes;
  v_mode text;
  v_id text;
  v_order integer;
  v_media jsonb;
  v_issues jsonb;
  v_revision app.revisions;
  v_label text := nullif(app.trim_text(p_installation_label), '');
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    select * into v_checkpoint from app.checkpoints where checkpoint_id = p_checkpoint_id for update;
    if v_checkpoint.checkpoint_id is null then
      perform app.reject(app.cr_failed());
    end if;
    if p_qr_identifier is not null then
      select * into v_qr from app.qr_codes where qr_identifier = p_qr_identifier for update;
      if v_qr.qr_identifier is null then
        perform app.reject(app.cr_failed());
      end if;
      perform app.expect_entity(p_expected, 'QRCODE', p_qr_identifier, v_qr.concurrency_revision, v_qr.updated_at,
        app.draft_of('QRCODE', p_qr_identifier));
      -- a visit point never moves to another checkpoint (BR-M03-E12)
      if v_qr.checkpoint_id <> p_checkpoint_id or v_qr.status = 'THU_HOI' then
        perform app.reject(app.cr_failed());
      end if;
    end if;
    if v_checkpoint.status = 'LUU_TRU' then
      perform app.reject(app.cr_failed());
    end if;

    v_mode := app.checkpoint_saved_mode(p_checkpoint_id);
    if v_mode is null then
      perform app.reject(app.cr_blocked('MSG-MODE-REQUIRED-FIRST'));
    end if;
    if v_qr.qr_identifier is null and (select count(*) from app.qr_codes q
        where q.checkpoint_id = p_checkpoint_id and q.status <> 'THU_HOI') >= app.limit('CHECKPOINT_QR_MAX_ITEMS') then
      perform app.reject(app.cr_blocked('MSG-LIMIT-QR', jsonb_build_object(
        'tên', app.checkpoint_name(p_checkpoint_id), 'tối đa', app.limit('CHECKPOINT_QR_MAX_ITEMS'))));
    end if;

    -- media must be QR_MEDIA of this checkpoint (DAC-M03-053)
    if exists (
      select 1 from jsonb_array_elements(coalesce(p_content -> 'mediaItems', '[]')) i
      where not exists (select 1 from app.media m
                        where m.media_id::text = i ->> 'mediaId' and m.usage = 'QR_MEDIA'
                          and m.owner_type = 'CHECKPOINT' and m.owner_id = p_checkpoint_id)) then
      perform app.reject(app.cr_failed());
    end if;

    v_id := coalesce(v_qr.qr_identifier, app.new_qr_identifier());
    v_order := coalesce(app.qr_creation_order(v_qr.qr_identifier),
                        (select count(*) from app.qr_codes q where q.checkpoint_id = p_checkpoint_id)::integer + 1);
    v_media := app.qr_media_list(p_content, coalesce(p_media_settings, '[]'));
    v_issues := app.visit_point_save_issues(v_id, app.visit_point_name(p_content #>> '{objectName,vi}', v_order),
      app.checkpoint_name(p_checkpoint_id), v_mode, p_content, p_installation_label, v_media);
    if jsonb_array_length(v_issues) > 0 then
      perform app.reject(app.cr_validation(v_issues));
    end if;

    -- rights tick and spoken language are stored per file, in the same save (BR-M03-F11, E17)
    update app.media m
    set usage_rights_confirmed = s.confirmed,
        usage_rights_confirmed_by_user_id = case when not s.confirmed then null
          when m.usage_rights_confirmed then m.usage_rights_confirmed_by_user_id else v_actor.user_id end,
        usage_rights_confirmed_at = case when not s.confirmed then null
          when m.usage_rights_confirmed then m.usage_rights_confirmed_at else now() end,
        spoken_language = s.language,
        concurrency_revision = m.concurrency_revision + 1
    from (select (e ->> 'mediaId')::uuid as media_id, (e ->> 'usageRightsConfirmed')::boolean as confirmed,
                 e ->> 'spokenLanguage' as language
          from jsonb_array_elements(v_media) e) s
    where m.media_id = s.media_id
      and (m.usage_rights_confirmed, m.spoken_language) is distinct from (s.confirmed, s.language);

    if v_qr.qr_identifier is null then
      -- clock_timestamp keeps the creation order even for two visit points created in one transaction
      insert into app.qr_codes (qr_identifier, checkpoint_id, installation_label, created_by_user_id, created_at)
      values (v_id, p_checkpoint_id, v_label, v_actor.user_id, clock_timestamp());
    else
      update app.qr_codes set installation_label = v_label, concurrency_revision = concurrency_revision + 1
      where qr_identifier = v_id;
    end if;
    v_revision := app.write_draft('QRCODE', v_id, p_content, v_actor.user_id);

    perform app.audit(v_actor.user_id, 'VISIT_POINT_DRAFT_SAVED', 'QRCODE', v_id, 'SUCCESS', null, v_revision.revision_number);
    return app.cr_ok(case when v_qr.qr_identifier is null then 'MSG-QR-CREATED' else 'MSG-SAVED' end,
      jsonb_build_object('qrIdentifier', v_id, 'revisionNumber', v_revision.revision_number,
        'concurrencyRevision', v_revision.concurrency_revision, 'created', v_qr.qr_identifier is null));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'VISIT_POINT_DRAFT_SAVED', 'QRCODE', coalesce(p_qr_identifier, ''), 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-04 register an uploaded object (media-storage §1 steps 2–4; DAC-M03-055–058)
-- ---------------------------------------------------------------------------

-- Megabytes as the UI shows them: at most one decimal, comma separator ("1,5")
create function app.format_megabytes(p_bytes bigint) returns text
language sql immutable
set search_path = ''
as $$
  select replace(rtrim(rtrim(to_char(round(p_bytes::numeric / app.limit('BYTES_PER_MB'), 1), 'FM999999990.0'), '0'), '.'), '.', ',')
$$;

create function api.register_media(
  p_owner_type text, p_owner_id text, p_usage text, p_type text, p_object_path text, p_spoken_language text default null
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_object storage.objects;
  v_mime text;
  v_size bigint;
  v_max bigint;
  v_route_usage boolean := p_usage in ('ROUTE_THUMBNAIL', 'ROUTE_GALLERY', 'ROUTE_MAP');
  v_field_key text;
  v_field_label text;
  v_media_id uuid;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    if not coalesce(app.subject_exists(p_owner_type, p_owner_id) and p_owner_type in ('ROUTE', 'CHECKPOINT'), false)
       or p_usage is null or p_usage not in ('ROUTE_THUMBNAIL', 'ROUTE_GALLERY', 'ROUTE_MAP', 'QR_MEDIA')
       or v_route_usage <> (p_owner_type = 'ROUTE')
       or p_type is null or p_type not in ('IMAGE', 'AUDIO', 'VIDEO')
       or (p_spoken_language is not null and (p_type = 'IMAGE' or p_spoken_language not in ('vi', 'en', 'NONE'))) then
      perform app.reject(app.cr_failed());
    end if;
    -- the object exists under uploads/{ownerType}/{ownerId}/ and is not registered yet
    select * into v_object from storage.objects o where o.bucket_id = 'quest-media' and o.name = p_object_path;
    if v_object.id is null or p_object_path not like 'uploads/' || p_owner_type || '/' || p_owner_id || '/%'
       or exists (select 1 from app.media m where m.source_ref = p_object_path) then
      perform app.reject(app.cr_failed());
    end if;
    v_mime := v_object.metadata ->> 'mimetype';
    v_size := coalesce((v_object.metadata ->> 'size')::bigint, 0);

    v_field_key := case p_usage when 'ROUTE_THUMBNAIL' then 'thumbnailMediaId' when 'ROUTE_GALLERY' then 'galleryItems'
      when 'ROUTE_MAP' then 'routeMapMediaId' else case when p_type = 'IMAGE' then 'images' else 'avFiles' end end;
    v_field_label := app.field_label(case when v_route_usage then 'ROUTE' else 'QRCODE' end, v_field_key);
    -- the system keeps no original file name, so the server sentence says "tệp vừa tải lên" (validation-report D-3)
    if (v_route_usage and p_type <> 'IMAGE') or not coalesce(v_mime = any(case p_type
          when 'IMAGE' then array['image/jpeg', 'image/png', 'image/webp']
          when 'AUDIO' then array['audio/mpeg', 'audio/mp4'] else array['video/mp4'] end), false) then
      perform app.reject(app.cr_validation(jsonb_build_array(app.issue('BLOCKS_SAVE', p_owner_type, p_owner_id, v_field_key,
        'MSG-FILE-TYPE', jsonb_build_object('tên tệp', 'tệp vừa tải lên', 'danh sách định dạng',
          case when v_route_usage or p_type = 'IMAGE' then 'JPEG, PNG, WebP' when p_type = 'AUDIO' then 'MP3, M4A' else 'MP4' end),
        v_field_label))));
    end if;
    v_max := app.limit('BYTES_PER_MB')::bigint * app.limit(p_type || '_MAX_MB');
    if v_size <= 0 or v_size > v_max then
      perform app.reject(app.cr_validation(jsonb_build_array(app.issue('BLOCKS_SAVE', p_owner_type, p_owner_id, v_field_key,
        'MSG-FILE-TOO-BIG', jsonb_build_object(
          'Loại tệp', case p_type when 'IMAGE' then 'Ảnh' when 'AUDIO' then 'Âm thanh' else 'Video' end,
          'tên tệp', 'tệp vừa tải lên', 'số', app.format_megabytes(v_size), 'tối đa', app.format_megabytes(v_max)),
        v_field_label))));
    end if;

    insert into app.media (owner_type, owner_id, usage, type, spoken_language, source_ref, mime_type, file_size_bytes,
                           created_by_user_id)
    values (p_owner_type, p_owner_id, p_usage, p_type, p_spoken_language, p_object_path, v_mime, v_size, v_actor.user_id)
    returning media_id into v_media_id;
    perform app.audit(v_actor.user_id, 'MEDIA_REGISTERED', 'MEDIA', v_media_id::text, 'SUCCESS');
    return app.cr_ok('MSG-UPLOADED-NOT-SAVED', jsonb_build_object('mediaId', v_media_id, 'sourceRef', p_object_path));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'MEDIA_REGISTERED', 'MEDIA', '', 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-07 discard an item never published (BR-M03-C01, D09, E10)
-- ---------------------------------------------------------------------------

create function api.discard_unpublished(
  p_subject_type text, p_subject_id text, p_reason text default null, p_expected jsonb default '{}'
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_status text;
  v_revision integer;
  v_updated_at timestamptz;
  v_reason text := nullif(app.trim_text(p_reason), '');
  v_problem jsonb;
  v_new_status text := case p_subject_type when 'QRCODE' then 'THU_HOI' else 'LUU_TRU' end;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    if p_subject_type = 'ROUTE' then
      select status, concurrency_revision, updated_at into v_status, v_revision, v_updated_at
      from app.routes where route_id = p_subject_id for update;
    elsif p_subject_type = 'CHECKPOINT' then
      select status, concurrency_revision, updated_at into v_status, v_revision, v_updated_at
      from app.checkpoints where checkpoint_id = p_subject_id for update;
    elsif p_subject_type = 'QRCODE' then
      select status, concurrency_revision, updated_at into v_status, v_revision, v_updated_at
      from app.qr_codes where qr_identifier = p_subject_id for update;
    end if;
    if v_revision is null then
      perform app.reject(app.cr_failed());
    end if;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_revision,
      app.entity_last_editor(p_subject_type, p_subject_id), v_updated_at);
    if v_status <> 'NHAP' or app.ever_published(p_subject_type, p_subject_id) then
      perform app.reject(app.cr_failed());
    end if;
    -- the reason is required for routes and checkpoints, optional for a visit point (BR-M03-E10)
    v_problem := app.reason_problem(p_reason, p_subject_type <> 'QRCODE');
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;

    if p_subject_type = 'ROUTE' then
      update app.routes set status = 'LUU_TRU', concurrency_revision = concurrency_revision + 1 where route_id = p_subject_id;
    elsif p_subject_type = 'CHECKPOINT' then
      -- its draft visit points can no longer be used (BR-M03-D09); revoked before the checkpoint is archived
      update app.qr_codes set status = 'THU_HOI', concurrency_revision = concurrency_revision + 1
      where checkpoint_id = p_subject_id and status = 'NHAP';
      update app.checkpoints set status = 'LUU_TRU', concurrency_revision = concurrency_revision + 1
      where checkpoint_id = p_subject_id;
    else
      update app.qr_codes set status = 'THU_HOI', status_reason = v_reason, concurrency_revision = concurrency_revision + 1
      where qr_identifier = p_subject_id;
    end if;

    perform app.audit(v_actor.user_id, 'ITEM_DISCARDED', p_subject_type, p_subject_id, 'SUCCESS', v_reason, null, null,
      jsonb_build_object('status', 'NHAP'), jsonb_build_object('status', v_new_status));
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', v_new_status, 'concurrencyRevision', v_revision + 1));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'ITEM_DISCARDED', coalesce(p_subject_type, ''), coalesce(p_subject_id, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- C-16 revoke a visit point (BR-M03-E09, E11, X02, G10) and C-17 record a reprint (BR-M03-E07)
-- ---------------------------------------------------------------------------

-- Routes listing the checkpoint receive a new journey version in the same transaction (BR-M03-X02). Snapshots
-- are built by the publication migration (3d/3e), which replaces this function; until then no route can have
-- been published, so the list of active routes is empty.
create function app.rebuild_after_visit_point_change(p_checkpoint_id text) returns void
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from app.routes r where r.route_id in (select app.routes_listing(p_checkpoint_id))
             and r.active_content_version is not null) then
    raise exception 'journey rebuild not available yet' using errcode = 'feature_not_supported';
  end if;
end;
$$;

create function api.revoke_visit_point(p_qr_identifier text, p_reason text default null, p_expected jsonb default '{}')
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_qr app.qr_codes;
  v_checkpoint app.checkpoints;
  v_problem jsonb;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    select * into v_qr from app.qr_codes where qr_identifier = p_qr_identifier;
    if v_qr.qr_identifier is null then
      perform app.reject(app.cr_failed());
    end if;
    -- the checkpoint and every route listing it form the connected set (R-08)
    perform app.lock_connected_set(
      jsonb_build_array(jsonb_build_object('key', 'checkpoint:' || v_qr.checkpoint_id, 'name', app.checkpoint_name(v_qr.checkpoint_id)))
      || coalesce((select jsonb_agg(jsonb_build_object('key', 'route:' || r, 'name', app.route_name(r)))
                   from app.routes_listing(v_qr.checkpoint_id) as r), '[]'));
    select * into v_qr from app.qr_codes where qr_identifier = p_qr_identifier for update;
    select * into v_checkpoint from app.checkpoints where checkpoint_id = v_qr.checkpoint_id for update;
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_qr.concurrency_revision,
      app.entity_last_editor('QRCODE', p_qr_identifier), v_qr.updated_at);
    if v_qr.status <> 'HOAT_DONG' then
      perform app.reject(app.cr_failed());
    end if;
    v_problem := app.reason_problem(p_reason, true);
    if v_problem is not null then
      perform app.reject(v_problem);
    end if;
    -- an active checkpoint always keeps one active visit point (BR-M03-E11)
    if v_checkpoint.status = 'HOAT_DONG' and (select count(*) from app.qr_codes q
        where q.checkpoint_id = v_checkpoint.checkpoint_id and q.status = 'HOAT_DONG') <= 1 then
      perform app.reject(app.cr_blocked('MSG-LAST-QR'));
    end if;

    update app.qr_codes set status = 'THU_HOI', status_reason = app.trim_text(p_reason),
      concurrency_revision = concurrency_revision + 1
    where qr_identifier = p_qr_identifier
    returning * into v_qr;
    perform app.rebuild_after_visit_point_change(v_checkpoint.checkpoint_id);

    perform app.audit(v_actor.user_id, 'QR_REVOKED', 'QRCODE', p_qr_identifier, 'SUCCESS', p_reason, null, null,
      jsonb_build_object('status', 'HOAT_DONG'), jsonb_build_object('status', 'THU_HOI'));
    return app.cr_ok('MSG-SAVED', jsonb_build_object('status', v_qr.status, 'concurrencyRevision', v_qr.concurrency_revision));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'QR_REVOKED', 'QRCODE', coalesce(p_qr_identifier, ''), 'FAILURE', p_reason);
  return v_result;
end;
$$;

create function api.record_reprint(p_qr_identifier text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor app.admin_accounts;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('B');
    if not exists (select 1 from app.qr_codes q where q.qr_identifier = p_qr_identifier and q.status <> 'THU_HOI') then
      perform app.reject(app.cr_failed());
    end if;
    perform app.audit(v_actor.user_id, 'QR_REPRINTED', 'QRCODE', p_qr_identifier, 'SUCCESS');
    return app.cr_ok('MSG-SAVED');
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, 'QR_REPRINTED', 'QRCODE', coalesce(p_qr_identifier, ''), 'FAILURE');
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Q-05, Q-06, Q-07
-- ---------------------------------------------------------------------------

create function api.list_checkpoints(p_search text default null, p_status text default null) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  perform app.require_reader();
  return coalesce((
    select jsonb_agg(item order by item ->> 'name' nulls last, item ->> 'checkpointId')
    from (
      select jsonb_build_object(
          'checkpointId', c.checkpoint_id,
          'status', c.status,
          'visitPointCount', (select count(*) from app.qr_codes q where q.checkpoint_id = c.checkpoint_id and q.status <> 'THU_HOI'),
          'routesUsing', app.routes_using(c.checkpoint_id),
          'readiness', app.readiness(app.checkpoint_issues(c.checkpoint_id)),
          'hasPendingDraft', c.status <> 'NHAP' and (app.draft_of('CHECKPOINT', c.checkpoint_id)).revision_id is not null)
        || app.jsonb_opt('name', to_jsonb(nullif(app.checkpoint_name(c.checkpoint_id), '')))
        || app.jsonb_opt('connectivityMode', app.current_content('CHECKPOINT', c.checkpoint_id) -> 'connectivityMode') as item
      from app.checkpoints c
      where (p_status is null or c.status = p_status)
        and (app.normalize_name(p_search) = ''
             or position(app.normalize_name(p_search) in app.normalize_name(app.checkpoint_name(c.checkpoint_id))) > 0)
    ) rows), '[]');
end;
$$;

create function api.get_checkpoint_editor(p_checkpoint_id text) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_checkpoint app.checkpoints;
begin
  perform app.require_reader();
  select * into v_checkpoint from app.checkpoints where checkpoint_id = p_checkpoint_id;
  if v_checkpoint.checkpoint_id is null then
    raise exception 'not found' using errcode = 'no_data_found';
  end if;
  return jsonb_build_object(
      'checkpointId', v_checkpoint.checkpoint_id,
      'status', v_checkpoint.status,
      'concurrencyRevision', v_checkpoint.concurrency_revision,
      'visitPoints', coalesce((
        select jsonb_agg(
          jsonb_build_object('qrIdentifier', q.qr_identifier, 'creationOrder', app.qr_creation_order(q.qr_identifier),
            'status', q.status, 'readiness', app.readiness(app.qr_issues(q.qr_identifier)))
          || app.jsonb_opt('name', to_jsonb(nullif(app.trim_text(app.current_content('QRCODE', q.qr_identifier) #>> '{objectName,vi}'), '')))
          order by q.created_at, q.qr_identifier)
        from app.qr_codes q where q.checkpoint_id = p_checkpoint_id), '[]'),
      'routesUsing', app.routes_using(p_checkpoint_id, true),
      'issues', app.checkpoint_issues(p_checkpoint_id))
    || app.jsonb_opt('draft', app.editor_revision(app.draft_of('CHECKPOINT', p_checkpoint_id)))
    || app.jsonb_opt('published', app.editor_revision(app.published_of('CHECKPOINT', p_checkpoint_id)))
    || app.jsonb_opt('locationNote', to_jsonb(v_checkpoint.location_note))
    || app.jsonb_opt('closureReason', to_jsonb(v_checkpoint.closure_reason));
end;
$$;

create function api.get_visit_point_editor(p_qr_identifier text) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_qr app.qr_codes;
  v_issues jsonb;
begin
  perform app.require_reader();
  select * into v_qr from app.qr_codes where qr_identifier = p_qr_identifier;
  if v_qr.qr_identifier is null then
    raise exception 'not found' using errcode = 'no_data_found';
  end if;
  v_issues := app.qr_issues(p_qr_identifier);
  return jsonb_build_object(
      'qrIdentifier', v_qr.qr_identifier,
      'checkpointId', v_qr.checkpoint_id,
      'checkpointStatus', (select c.status from app.checkpoints c where c.checkpoint_id = v_qr.checkpoint_id),
      'status', v_qr.status,
      'creationOrder', app.qr_creation_order(p_qr_identifier),
      'concurrencyRevision', v_qr.concurrency_revision,
      -- media of the draft and the published revision, each once
      'media', coalesce((
        select jsonb_agg(
          jsonb_build_object('mediaId', m.media_id, 'type', m.type, 'usage', m.usage, 'sourceRef', m.source_ref,
            'mimeType', m.mime_type, 'fileSizeBytes', m.file_size_bytes, 'usageRightsConfirmed', m.usage_rights_confirmed)
          || app.jsonb_opt('spokenLanguage', to_jsonb(m.spoken_language))
          order by m.created_at, m.media_id)
        from app.media m
        where m.media_id::text in (
          select i ->> 'mediaId' from app.revisions r
          cross join lateral jsonb_array_elements(coalesce(r.content -> 'mediaItems', '[]')) i
          where r.subject_type = 'QRCODE' and r.subject_id = p_qr_identifier and r.status in ('NHAP', 'PHAT_HANH'))), '[]'),
      'readiness', app.readiness(v_issues),
      'issues', v_issues)
    || app.jsonb_opt('checkpointName', to_jsonb(nullif(app.checkpoint_name(v_qr.checkpoint_id), '')))
    || app.jsonb_opt('checkpointMode', to_jsonb(app.checkpoint_saved_mode(v_qr.checkpoint_id)))
    || app.jsonb_opt('installationLabel', to_jsonb(v_qr.installation_label))
    || app.jsonb_opt('draft', app.editor_revision(app.draft_of('QRCODE', p_qr_identifier)))
    || app.jsonb_opt('published', app.editor_revision(app.published_of('QRCODE', p_qr_identifier)));
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (admin-command §7: both roles)
-- ---------------------------------------------------------------------------
grant execute on function api.save_checkpoint_draft(text, jsonb, jsonb, text) to authenticated;
grant execute on function api.save_visit_point_draft(text, text, jsonb, jsonb, text, jsonb) to authenticated;
grant execute on function api.register_media(text, text, text, text, text, text) to authenticated;
grant execute on function api.discard_unpublished(text, text, text, jsonb) to authenticated;
grant execute on function api.revoke_visit_point(text, text, jsonb) to authenticated;
grant execute on function api.record_reprint(text) to authenticated;
grant execute on function api.list_checkpoints(text, text) to authenticated;
grant execute on function api.get_checkpoint_editor(text) to authenticated;
grant execute on function api.get_visit_point_editor(text) to authenticated;
