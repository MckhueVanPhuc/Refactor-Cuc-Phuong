-- pgTAP — US5 plain-language results (tasks M03 T187; admin-command §1–§3, §8; spec-M03 §5.6; BR-M03-L01, L08, L10, L13).
-- Every rejection branch reachable with the commands of US1–US4 is collected with the issues that editors and reviews
-- return, then checked as a whole: known message keys, known field keys, filled sentences, no id in values, no
-- PostgreSQL error text. Commands of later stories add their branches to their own pgTAP.
begin;
create extension if not exists pgtap with schema extensions;
select plan(49);

insert into auth.sessions (id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004');
create function pg_temp.as_user(n integer) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', '00000000-0000-4000-8000-00000000000' || n, 'session_id', '10000000-0000-4000-8000-00000000000' || n)::text, true) $$;
create function pg_temp.object(p_path text, p_mime text default 'image/jpeg', p_size integer default 2048) returns text language sql as $$
  insert into storage.objects (bucket_id, name, metadata) values ('quest-media', p_path, jsonb_build_object('mimetype', p_mime, 'size', p_size))
  returning name $$;
create function pg_temp.media(p_owner_type text, p_owner text, p_usage text, p_type text, p_name text, p_mime text default 'image/jpeg') returns text language sql as $$
  select api.register_media(p_owner_type, p_owner, p_usage, p_type,
    pg_temp.object('uploads/' || p_owner_type || '/' || p_owner || '/' || p_name, p_mime)) #>> '{data,mediaId}' $$;
create function pg_temp.review(p_type text, p_id text) returns jsonb language sql as $$ select api.open_publication_review(p_type, p_id) $$;
create function pg_temp.publish(p_type text, p_id text, p_tick boolean default true) returns jsonb language sql as $$
  select api.publish_unit(p_type, p_id, (pg_temp.review(p_type, p_id) ->> 'reviewedConcurrencyRevision')::integer, p_tick) $$;
create function pg_temp.entity(p_type text, p_id text) returns jsonb language sql as $$
  select jsonb_build_object('entity', e ->> 'concurrencyRevision', 'draft', e #>> '{draft,concurrencyRevision}')
  from (select case p_type when 'ROUTE' then api.get_route_editor(p_id) when 'CHECKPOINT' then api.get_checkpoint_editor(p_id)
               else api.get_visit_point_editor(p_id) end as e) x $$;
create function pg_temp.ready_visit_point(p_checkpoint text, p_name text) returns text language sql as $$
  select api.save_visit_point_draft(p_checkpoint, p_content => jsonb_build_object(
      'objectName', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'),
      'introductionText', jsonb_build_object('vi', rpad('Giới thiệu ' || p_name, 30, '.'), 'en', rpad('About ' || p_name, 30, '.')),
      'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', m.id))),
    p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', m.id, 'usageRightsConfirmed', true))) #>> '{data,qrIdentifier}'
  from (select pg_temp.media('CHECKPOINT', p_checkpoint, 'QR_MEDIA', 'IMAGE', p_name) as id) m $$;

-- results: one row per rejection branch with its expected reason and message key; issues from editors and reviews
create temp table r (label text primary key, result jsonb, want_reason text, want_key text);
create temp table iss (source text, issue jsonb);

-- ---- accounts (US1) -------------------------------------------------------------------------------------------------
select pg_temp.as_user(4);
insert into r values ('01 no account', api.save_checkpoint_draft(p_content => '{}'), 'FORBIDDEN', 'MSG-NO-PERMISSION');
select pg_temp.as_user(2);
insert into r values ('02 staff on a Reviewer command', api.change_account_role('locked@example.test', 'REVIEWER', '{"entity": 3}'), 'FORBIDDEN', 'MSG-NO-PERMISSION');
select pg_temp.as_user(1);
insert into r values ('03 account stale', api.set_account_status('locked@example.test', 'ACTIVE', '{"entity": 1}'), 'STALE', 'MSG-STALE');
insert into r values ('04 last Reviewer', api.change_account_role('reviewer@example.test', 'CONTENT_STAFF', '{"entity": 2}'), 'BLOCKED', 'MSG-LAST-REVIEWER');
insert into r values ('05 unknown account', api.change_account_role('nobody@example.test', 'REVIEWER', '{"entity": 1}'), 'FAILED', 'MSG-GENERIC');

-- ---- checkpoints, visit points, media (US2) ------------------------------------------------------------------------
select pg_temp.as_user(2);
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"}, "connectivityMode": "OFFLINE_REQUIRED"}')
  #>> '{data,checkpointId}' as c_off \gset
select pg_temp.ready_visit_point(:'c_off', 'Cây chò') as q_off \gset
select pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', :'c_off') ->> 'ok' as c_off_published \gset
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Rừng chò", "en": "Cho forest"}, "connectivityMode": "ONLINE_AVAILABLE", "fieldVerificationConfirmed": true}')
  #>> '{data,checkpointId}' as c_on \gset
select pg_temp.media('CHECKPOINT', :'c_on', 'QR_MEDIA', 'AUDIO', 'chim', 'audio/mpeg') as aud \gset
select api.save_visit_point_draft(:'c_on', p_content => jsonb_build_object('objectName', '{"vi": "Tiếng chim"}'::jsonb,
  'introductionText', '{"vi": "ngắn"}'::jsonb, 'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', :'aud')))) #>> '{data,qrIdentifier}' as q_on \gset
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Vườn"}}') #>> '{data,checkpointId}' as c_nomode \gset

insert into r values ('06 text too long', api.save_checkpoint_draft(p_content => jsonb_build_object('checkpointName', jsonb_build_object('vi', repeat('a', 101)))),
  'VALIDATION', 'MSG-LIMIT-TEXT');
insert into r values ('07 online not verified', api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Đồi"}, "connectivityMode": "ONLINE_AVAILABLE"}'),
  'VALIDATION', 'MSG-ONLINE-NOT-VERIFIED');
insert into r values ('08 name taken', api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": " HANG con moong"}}'), 'VALIDATION', 'MSG-CHECKPOINT-NAME-TAKEN');
insert into r values ('09 content of the wrong shape', api.save_checkpoint_draft(p_content => '{"connectivityMode": "XYZ"}'), 'FAILED', 'MSG-GENERIC');
insert into r values ('10 malformed expected revision', api.save_checkpoint_draft(:'c_nomode', '{"entity": "abc"}', '{}'), 'FAILED', 'MSG-GENERIC');
insert into r values ('11 mode required first', api.save_visit_point_draft(:'c_nomode', p_content => '{}'), 'BLOCKED', 'MSG-MODE-REQUIRED-FIRST');
insert into r values ('12 audio offline', api.save_visit_point_draft(:'c_off', p_content => jsonb_build_object('mediaItems',
  jsonb_build_array(jsonb_build_object('mediaId', pg_temp.media('CHECKPOINT', :'c_off', 'QR_MEDIA', 'AUDIO', 'a', 'audio/mpeg'))))), 'VALIDATION', 'MSG-AV-OFFLINE');
insert into r values ('13 mode has audio', api.save_checkpoint_draft(:'c_on', pg_temp.entity('CHECKPOINT', :'c_on'),
  '{"checkpointName": {"vi": "Rừng chò", "en": "Cho forest"}, "connectivityMode": "OFFLINE_REQUIRED"}'), 'VALIDATION', 'MSG-MODE-HAS-AV');
insert into r values ('14 file type', api.register_media('CHECKPOINT', :'c_off', 'QR_MEDIA', 'IMAGE',
  pg_temp.object('uploads/CHECKPOINT/' || :'c_off' || '/gif', 'image/gif')), 'VALIDATION', 'MSG-FILE-TYPE');
insert into r values ('15 file too big', api.register_media('CHECKPOINT', :'c_off', 'QR_MEDIA', 'IMAGE',
  pg_temp.object('uploads/CHECKPOINT/' || :'c_off' || '/big', 'image/png', 5000000)), 'VALIDATION', 'MSG-FILE-TOO-BIG');
insert into r values ('16 object missing', api.register_media('CHECKPOINT', :'c_off', 'QR_MEDIA', 'IMAGE', 'uploads/CHECKPOINT/x/none'), 'FAILED', 'MSG-GENERIC');
insert into r values ('17 reason missing', api.discard_unpublished('CHECKPOINT', :'c_nomode', null, pg_temp.entity('CHECKPOINT', :'c_nomode')),
  'BLOCKED', 'MSG-MISSING-FIELD');
insert into r values ('18 reason too long', api.revoke_visit_point(:'q_off', repeat('x', 301), pg_temp.entity('QRCODE', :'q_off')), 'BLOCKED', 'MSG-LIMIT-TEXT');
insert into r values ('19 last visit point', api.revoke_visit_point(:'q_off', 'Cây đổ', pg_temp.entity('QRCODE', :'q_off')), 'BLOCKED', 'MSG-LAST-QR');

insert into iss select 'visit point editor', i from jsonb_array_elements(api.get_visit_point_editor(:'q_on') -> 'issues') i;
insert into iss select 'checkpoint editor', i from jsonb_array_elements(api.get_checkpoint_editor(:'c_nomode') -> 'issues') i;
insert into iss select 'checkpoint review', i from jsonb_array_elements(pg_temp.review('CHECKPOINT_FIRST_PUBLICATION', :'c_nomode') -> 'blockingIssues') i;

-- ---- routes and publication (US3, US4) ----------------------------------------------------------------------------
select api.save_route_draft(p_content => '{"name": {"vi": "Đường mòn"}}') #>> '{data,routeId}' as r1 \gset
insert into r values ('20 tag conflict', api.save_route_draft(:'r1', pg_temp.entity('ROUTE', :'r1'), '{"difficulty": "KHO", "groupTags": ["GROUP_CAN_DE_DANG"]}'),
  'VALIDATION', 'MSG-TAG-CONFLICT');
insert into r values ('21 number too big', api.save_route_draft(:'r1', pg_temp.entity('ROUTE', :'r1'), '{"durationMin": 2000}'), 'VALIDATION', 'MSG-NUMBER-TOO-BIG');
insert into r values ('22 checkpoint twice', api.save_route_draft(:'r1', pg_temp.entity('ROUTE', :'r1'), jsonb_build_object('checkpointList',
  jsonb_build_array(jsonb_build_object('checkpointId', :'c_off'), jsonb_build_object('checkpointId', :'c_off')))), 'VALIDATION', 'MSG-CHECKPOINT-DUPLICATE');
-- a draft with one-language values everywhere: many issue keys for the editor, the review and the guard
select pg_temp.media('ROUTE', :'r1', 'ROUTE_GALLERY', 'IMAGE', 'g') as gal \gset
select pg_temp.media('ROUTE', :'r1', 'ROUTE_MAP', 'IMAGE', 'm') as map \gset
select api.save_route_draft(:'r1', pg_temp.entity('ROUTE', :'r1'), jsonb_build_object(
  'name', '{"vi": "Đường mòn"}'::jsonb, 'safetyWarning', '{"en": "Slippery"}'::jsonb, 'distanceKm', 3,
  'galleryItems', jsonb_build_array(jsonb_build_object('mediaId', :'gal', 'caption', '{"vi": "Ảnh"}'::jsonb)),
  'routeMapMediaId', :'map', 'routeMapCaption', '{"en": "Map"}'::jsonb, 'highlights', '[{"vi": "Nhũ đá"}]'::jsonb,
  'noSafetyWarningConfirmed', false, 'offlineRouteMapRequired', false)) ->> 'ok' as r1_saved \gset
insert into iss select 'route editor', i from jsonb_array_elements(api.get_route_editor(:'r1') -> 'issues') i;
insert into r values ('23 route not ready', pg_temp.publish('ROUTE_FIRST_PUBLICATION', :'r1'), 'VALIDATION', 'MSG-MISSING-FIELD');
insert into iss select 'route guard', i from jsonb_array_elements((select result -> 'issues' from r where label = '23 route not ready')) i;
insert into r values ('24 unknown unit', api.publish_unit('ROUTE_FIRST_PUBLICATION', 'missing', 1), 'FAILED', 'MSG-GENERIC');

-- a complete published route over c_off
select api.save_route_draft(p_content => '{"name": {"vi": "Đường B"}}') #>> '{data,routeId}' as r2 \gset
select pg_temp.media('ROUTE', :'r2', 'ROUTE_THUMBNAIL', 'IMAGE', 't') as thumb \gset
select api.save_route_draft(:'r2', pg_temp.entity('ROUTE', :'r2'), jsonb_build_object('name', '{"vi": "Đường B", "en": "Trail B"}'::jsonb,
  'shortDescription', '{"vi": "Ngắn", "en": "Short"}'::jsonb, 'description', '{"vi": "Dài", "en": "Long"}'::jsonb,
  'startingPoint', '{"vi": "Cổng", "en": "Gate"}'::jsonb, 'distanceKm', 2, 'durationMin', 60, 'difficulty', 'NHE',
  'groupTags', '["GROUP_CA_NHAN_NGUOI_LON"]'::jsonb, 'experienceTags', '["INTEREST_KHAM_PHA"]'::jsonb, 'thumbnailMediaId', :'thumb',
  'noSafetyWarningConfirmed', false, 'offlineRouteMapRequired', false, 'checkpointList', jsonb_build_array(jsonb_build_object('checkpointId', :'c_off'))),
  jsonb_build_array(jsonb_build_object('mediaId', :'thumb', 'usageRightsConfirmed', true))) ->> 'ok' as r2_saved \gset
insert into r values ('25 safety tick missing', pg_temp.publish('ROUTE_FIRST_PUBLICATION', :'r2', false), 'BLOCKED', 'MSG-SAFETY-CONFIRM');
select pg_temp.publish('ROUTE_FIRST_PUBLICATION', :'r2') ->> 'ok' as r2_published \gset
select api.save_route_draft(:'r2', pg_temp.entity('ROUTE', :'r2'), (app.published_of('ROUTE', :'r2')).content || '{"checkpointList": []}') ->> 'ok' as r2_emptied \gset
insert into r values ('26 last active checkpoint', pg_temp.publish('ROUTE_INFORMATION', :'r2'), 'BLOCKED', 'MSG-ROUTE-LAST-CHECKPOINT');
insert into r values ('27 review reopened', api.publish_unit('ROUTE_INFORMATION', :'r2', 1, true), 'STALE', 'MSG-STALE');

-- an image gone from Storage, then a journey that cannot be built
select pg_temp.ready_visit_point(:'c_off', 'Thạch nhũ') as q_gone \gset
set local session_replication_role = replica;
delete from storage.objects where name = 'uploads/CHECKPOINT/' || :'c_off' || '/Thạch nhũ';
set local session_replication_role = origin;
insert into iss select 'visit point review', i from jsonb_array_elements(pg_temp.review('QR_OBJECT', :'q_gone') -> 'blockingIssues') i;
insert into r values ('28 image not readable', pg_temp.publish('QR_OBJECT', :'q_gone'), 'VALIDATION', 'MSG-IMAGE-NOT-READABLE');
select pg_temp.ready_visit_point(:'c_off', 'Măng đá') as q_new \gset
set local session_replication_role = replica;
update app.revisions set content = jsonb_set(content, '{introductionText,en}', '""') where subject_id = :'q_off' and status = 'PHAT_HANH';
set local session_replication_role = origin;
insert into r values ('29 journey cannot be built', pg_temp.publish('QR_OBJECT', :'q_new'), 'FAILED', 'MSG-PUBLISH-FAILED');

insert into iss select 'command ' || label, i from r cross join lateral jsonb_array_elements(coalesce(result -> 'issues', '[]')) i
where label <> '23 route not ready';

-- ---- each branch returns its expected result ----------------------------------------------------------------------
select is(result ->> 'reason' || ' ' || (result ->> 'messageKey'), want_reason || ' ' || want_key, label) from r order by label;

-- ---- rules over every result ---------------------------------------------------------------------------------------
select is((select count(*)::int from r), 29, 'the battery ran every branch');
select is((select count(*)::int from r where (result ->> 'ok')::boolean is not false
  or result ->> 'reason' not in ('VALIDATION', 'STALE', 'BUSY', 'FORBIDDEN', 'BLOCKED', 'FAILED')), 0, 'every rejection has a known reason');
select is((select array_agg(result ->> 'messageKey') from r where app.message_template(result ->> 'messageKey') is null), null,
  'every message key is in the catalog §5.6');
select is((select count(*)::int from r where result ->> 'reason' = 'FAILED'
  and result ->> 'messageKey' not in ('MSG-PUBLISH-FAILED', 'MSG-CLOSE-FAILED', 'MSG-GENERIC')), 0, 'FAILED uses only PUBLISH/CLOSE/GENERIC');
select ok((select bool_and(result #>> '{stale,editorEmail}' <> '' and result #>> '{stale,editedAt}' ~ '^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$')
  from r where result ->> 'reason' = 'STALE'), 'STALE names an editor and a UTC time');
select is((select array_agg(label) from r where result ->> 'reason' = 'BLOCKED'
  and app.render_message(result ->> 'messageKey', result -> 'values') ~ '\{[^}]+\}'), null, 'every BLOCKED sentence is fully filled');
select is((select array_agg(label) from r where (result -> 'values')::text ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-'), null,
  'values never carry an internal id (BR-M03-L10)');
select is((select array_agg(label) from r
  where result::text ~* '(error|violat|constraint|relation |sqlstate|duplicate key|null value|syntax|app\.|api\.|function |column |CPQRJ|REVISION_CONTENT)'), null,
  'no PostgreSQL error text reaches a CommandResult');
select is((select array_agg(label) from r where result ->> 'reason' = 'VALIDATION' and jsonb_array_length(result -> 'issues') = 0), null,
  'every VALIDATION carries its issues');
select is((select array_agg(label) from r where result ->> 'reason' = 'VALIDATION' and result ->> 'messageKey' <> result #>> '{issues,0,messageKey}'), null,
  'a VALIDATION result takes the key of its first issue');

-- ---- rules over every ValidationIssue (BR-M03-L08) ----------------------------------------------------------------
select ok((select count(*) >= 30 from iss), 'the editors, reviews and guards returned many issues to check');
select is((select array_agg(source) from iss where not (issue ?& array['severity', 'fieldLabel', 'message', 'messageKey', 'targetItemType',
  'targetItemId', 'targetFieldKey']) or (select count(*) from jsonb_object_keys(issue)) <> 7), null, 'every issue has exactly the seven fields');
select is((select array_agg(distinct issue ->> 'severity') from iss where issue ->> 'severity' not in ('BLOCKS_SAVE', 'BLOCKS_PUBLISH')), null,
  'severity is BLOCKS_SAVE or BLOCKS_PUBLISH');
select is((select array_agg(issue ->> 'messageKey') from iss where app.message_template(issue ->> 'messageKey') is null), null,
  'every issue key is in the catalog');
-- the field key is known for its item type; the exception: register_media reports a QR_MEDIA file on the checkpoint
-- that owns it, with the visit-point field key (images/avFiles), as the fake adapter does (validation-report D-111)
select is((select array_agg(issue ->> 'targetItemType' || '.' || (issue ->> 'targetFieldKey')) from iss
  where app.field_label(issue ->> 'targetItemType', issue ->> 'targetFieldKey') is null
    and not (issue ->> 'targetItemType' = 'CHECKPOINT' and issue ->> 'targetFieldKey' in ('images', 'avFiles'))), null,
  'every targetFieldKey is known by fieldLabels for its item type');
select is((select array_agg(issue ->> 'targetFieldKey') from iss where issue ->> 'fieldLabel' = '' or issue ->> 'fieldLabel' = issue ->> 'targetFieldKey'), null,
  'every issue shows a Vietnamese label, never the internal key');
select is((select array_agg(issue ->> 'message') from iss where issue ->> 'message' ~ '\{[^}]+\}' or issue ->> 'message' = ''), null,
  'every issue sentence is fully filled');
select is((select array_agg(issue ->> 'message') from iss where issue ->> 'message' ~* '[0-9a-f]{8}-[0-9a-f]{4}-|Qr[A-Za-z0-9]{14,}'), null,
  'issue sentences never show an id or a QR identifier');
select ok((select count(distinct issue ->> 'targetFieldKey') >= 12 from iss), 'issues cover many fields, list items included');
select ok(exists (select 1 from iss where issue ->> 'targetFieldKey' ~ '^(galleryCaption|highlights)\.\d+\.(vi|en)$'),
  'list-item keys carry their index and language');

select * from finish();
rollback;
