-- pgTAP — US3 routes and first publications (tasks M03 T185, T182 leftover; admin-command C-01, C-05, Q-02–Q-04,
-- Q-08; publication-public-contract §2–§4; BR-M03-C04, C09, C11, C12, C16, C17, D04, D05, E09, E13, F02–F04, G02–G09,
-- T01, T04, X02; SC-M03-001, 002, 003). Seed staff …02 publishes everything.
begin;
create extension if not exists pgtap with schema extensions;
select plan(66);

insert into auth.sessions (id, user_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-000000000002", "session_id": "10000000-0000-4000-8000-000000000002"}', true);

create function pg_temp.object(p_path text, p_mime text, p_size integer) returns text language sql as $$
  insert into storage.objects (bucket_id, name, metadata)
  values ('quest-media', p_path, jsonb_build_object('mimetype', p_mime, 'size', p_size)) returning name $$;
create function pg_temp.media(p_owner_type text, p_owner text, p_usage text, p_name text, p_size integer default 2048) returns text language sql as $$
  select api.register_media(p_owner_type, p_owner, p_usage, 'IMAGE',
    pg_temp.object('uploads/' || p_owner_type || '/' || p_owner || '/' || p_name, 'image/jpeg', p_size)) #>> '{data,mediaId}' $$;
create function pg_temp.intro(p_text text) returns text language sql as $$ select rpad(p_text, 30, '.') $$;
-- a ready visit point with one image whose rights are confirmed
create function pg_temp.visit_point(p_checkpoint text, p_name text) returns text language sql as $$
  select api.save_visit_point_draft(p_checkpoint, p_content => jsonb_build_object(
      'objectName', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'),
      'introductionText', jsonb_build_object('vi', pg_temp.intro('Giới thiệu ' || p_name), 'en', pg_temp.intro('About ' || p_name)),
      'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', m.id))),
    p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', m.id, 'usageRightsConfirmed', true))) #>> '{data,qrIdentifier}'
  from (select pg_temp.media('CHECKPOINT', p_checkpoint, 'QR_MEDIA', p_name) as id) m $$;
create function pg_temp.review(p_type text, p_id text) returns jsonb language sql as $$ select api.open_publication_review(p_type, p_id) $$;
create function pg_temp.publish(p_type text, p_id text, p_tick boolean default null) returns jsonb language sql as $$
  select api.publish_unit(p_type, p_id, (pg_temp.review(p_type, p_id) ->> 'reviewedConcurrencyRevision')::integer, p_tick) $$;

-- ---- grants -----------------------------------------------------------------------------------------------------
select ok(bool_and(has_function_privilege('authenticated', f, 'EXECUTE') and not has_function_privilege('anon', f, 'EXECUTE')),
  'US3 commands and queries are for authenticated only')
from unnest(array['api.save_route_draft(text, jsonb, jsonb, jsonb)', 'api.list_routes(text, text)', 'api.get_route_editor(text)',
  'api.list_selectable_checkpoints(text)', 'api.open_publication_review(text, text)', 'api.publish_unit(text, text, integer, boolean)']) as f;
select ok(has_table_privilege('anon', 'api.published_routes', 'SELECT') and has_table_privilege('anon', 'api.active_journey_snapshots', 'SELECT')
  and not has_table_privilege('anon', 'api.published_routes', 'INSERT'), 'anon reads the two public views, nothing more');

-- ---- CHECKPOINT_FIRST_PUBLICATION (BR-M03-D04, D05) -------------------------------------------------------------
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"}, "connectivityMode": "OFFLINE_REQUIRED"}')
  #>> '{data,checkpointId}' as c1 \gset
select pg_temp.visit_point(:'c1', 'Cây chò') as q1 \gset
select api.save_visit_point_draft(:'c1', p_content => '{"objectName": {"vi": "Chưa xong"}}') #>> '{data,qrIdentifier}' as q_draft \gset
select is(pg_temp.review('CHECKPOINT_FIRST_PUBLICATION', :'c1') -> 'blockingIssues', '[]', 'a checkpoint with one ready visit point has no blocking issue');
select is(pg_temp.review('CHECKPOINT_FIRST_PUBLICATION', :'c1') -> 'leftOutQrObjects',
  '[{"name": "Chưa xong", "missing": ["Tên đối tượng (tiếng Anh)", "Giới thiệu"]}]',
  'the review lists the visit point that stays a draft, with what it misses');
select is(pg_temp.review('CHECKPOINT_FIRST_PUBLICATION', :'c1') #>> '{leftOutQrObjects,0,name}', 'Chưa xong', '... by name');
select is(pg_temp.review('CHECKPOINT_FIRST_PUBLICATION', :'c1') -> 'affectedRoutes', '[]', 'no route is affected by a first checkpoint publication');
select is(pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', :'c1'), app.cr_ok('MSG-PUBLISHED', '{"publishedRevisionNumber": 1, "newJourneyVersions": []}'),
  'the checkpoint is published');
select is((select status from app.checkpoints where checkpoint_id = :'c1') || '/' || (select status from app.qr_codes where qr_identifier = :'q1')
  || '/' || (select status from app.qr_codes where qr_identifier = :'q_draft'), 'HOAT_DONG/HOAT_DONG/NHAP',
  'checkpoint and ready visit point active, the incomplete one stays NHAP (BR-M03-D05)');
select ok((select self_published and outcome = 'SUCCESS' from app.audit_records where action = 'PUBLISHED' and entity_id = :'c1'),
  'one person publishes alone; the audit line says self-published (BR-M03-A05)');
select is(api.publish_unit('CHECKPOINT_FIRST_PUBLICATION', :'c1', 1) ->> 'reason', 'FAILED', 'a published checkpoint has no first publication any more');

select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Rừng chò", "en": "Cho forest"}, "connectivityMode": "OFFLINE_REQUIRED"}')
  #>> '{data,checkpointId}' as c2 \gset

-- ---- C-01 save route (BR-M03-C03, C12, C16, T01) ------------------------------------------------------------------
select api.save_route_draft(p_content => '{"name": {"vi": "Đường mòn"}}') as r_first \gset
select is(:'r_first'::jsonb ->> 'messageKey', 'MSG-SAVED', 'an almost empty route saves: required fields wait for publication (BR-M03-C02, C03)');
select :'r_first'::jsonb #>> '{data,routeId}' as r1 \gset
select is(api.get_route_editor(:'r1') ->> 'status', 'NHAP', 'the first save creates a NHAP route');
select is(api.save_route_draft(:'r1', '{"entity": 1, "draft": 1}', '{"difficulty": "KHO", "groupTags": ["GROUP_GIA_DINH_CO_TRE"]}') -> 'issues' -> 0 ->> 'message',
  'Tuyến độ khó Khó không thể gắn nhãn Gia đình có trẻ nhỏ. Hãy đổi độ khó hoặc bỏ nhãn.', 'KHO + family tag → MSG-TAG-CONFLICT (BR-M03-C12)');
select is(api.save_route_draft(:'r1', '{"entity": 1, "draft": 1}', '{"distanceKm": 2.55}') -> 'issues' -> 0 ->> 'messageKey',
  'MSG-NUMBER-DECIMALS', 'distance has one decimal at most');
select is(api.save_route_draft(:'r1', '{"entity": 1, "draft": 1}', jsonb_build_object('checkpointList', jsonb_build_array(
  jsonb_build_object('checkpointId', :'c1'), jsonb_build_object('checkpointId', :'c1')))) -> 'issues' -> 0 ->> 'message',
  'Điểm dừng "Hang Con Moong" đã có trong danh sách của tuyến.', 'a checkpoint twice → MSG-CHECKPOINT-DUPLICATE (BR-M03-T09)');
select is(api.save_route_draft(:'r1', '{"entity": 1, "draft": 1}', jsonb_build_object('checkpointList', jsonb_build_array(
  jsonb_build_object('checkpointId', :'c2')))) ->> 'reason', 'FAILED', 'a checkpoint that is not active cannot be added (BR-M03-T01)');
select is(api.save_route_draft(p_content => jsonb_build_object('thumbnailMediaId', gen_random_uuid())) ->> 'reason', 'FAILED',
  'the first save carries no image: images are chosen once the route exists (D-25)');
select is((select count(*)::int from app.audit_records where action = 'ROUTE_DRAFT_SAVED' and outcome = 'FAILURE'), 5,
  'each refused save has its audit line');
select is(api.save_route_draft(:'r1', '{"entity": 1, "draft": 1}', '{"offlineRouteMapRequired": true, "routeMapCaption": {"vi": "x"}}') ->> 'ok', 'true',
  'saving the offline-map tick without a map succeeds');
select ok((select (content ->> 'offlineRouteMapRequired')::boolean = false and not content ? 'routeMapCaption'
  from app.revisions where subject_id = :'r1' and status = 'NHAP'), '... the tick and the caption are dropped (BR-M03-C16, D-81)');

-- ---- Q-04 (BR-M03-T01) ----------------------------------------------------------------------------------------
select is(jsonb_path_query_array(api.list_selectable_checkpoints(), '$[*].name'), '["Hang Con Moong"]', 'only active checkpoints are selectable');
select is((api.list_selectable_checkpoints('moong') -> 0) - 'checkpointId', '{"name": "Hang Con Moong", "connectivityMode": "OFFLINE_REQUIRED", "visitPointCount": 1, "otherRoutes": []}',
  'a selectable checkpoint shows mode, active visit points and other routes');

-- complete route with its own thumbnail
select pg_temp.media('ROUTE', :'r1', 'ROUTE_THUMBNAIL', 'thumb', 4096) as thumb \gset
select api.get_route_editor(:'r1') as ed \gset
select api.save_route_draft(:'r1',
  jsonb_build_object('entity', (:'ed'::jsonb ->> 'concurrencyRevision')::int, 'draft', (:'ed'::jsonb #>> '{draft,concurrencyRevision}')::int),
  jsonb_build_object(
    'name', '{"vi": "Đường mòn", "en": "Trail"}'::jsonb, 'shortDescription', '{"vi": "Ngắn", "en": "Short"}'::jsonb,
    'description', '{"vi": "Mô tả", "en": "Description"}'::jsonb, 'startingPoint', '{"vi": "Cổng", "en": "Gate"}'::jsonb,
    'distanceKm', 2.5, 'durationMin', 90, 'difficulty', 'NHE',
    'groupTags', '["GROUP_GIA_DINH_CO_TRE"]'::jsonb, 'experienceTags', '["INTEREST_KHAM_PHA"]'::jsonb,
    'thumbnailMediaId', :'thumb', 'noSafetyWarningConfirmed', false, 'offlineRouteMapRequired', false,
    'checkpointList', jsonb_build_array(jsonb_build_object('checkpointId', :'c1'))),
  jsonb_build_array(jsonb_build_object('mediaId', :'thumb', 'usageRightsConfirmed', true))) ->> 'ok' as saved \gset
select is(:'saved'::text, 'true', 'the complete route is saved with its image rights tick');
select is(jsonb_path_query_array(api.get_route_editor(:'r1') -> 'issues', '$[*].messageKey'), '["MSG-SAFETY-CONFIRM"]',
  'Q-03 issues: only the safety confirmation is missing');
select is(api.get_route_editor(:'r1') -> 'checkpoints', jsonb_build_array(jsonb_build_object('checkpointId', :'c1', 'name', 'Hang Con Moong',
  'status', 'HOAT_DONG', 'connectivityMode', 'OFFLINE_REQUIRED')), 'Q-03 lists the checkpoints with status and mode');
select is(jsonb_path_query_array(api.list_routes(), '$[*].name'), '["Đường mòn"]', 'Q-02 shows the draft name');

-- ---- Q-08 / C-05 ROUTE_FIRST_PUBLICATION (BR-M03-C09, C17, F04, G10) -----------------------------------------
select pg_temp.review('ROUTE_FIRST_PUBLICATION', :'r1') as rv \gset
select is(:'rv'::jsonb -> 'blockingIssues', '[]', 'nothing blocks the route');
select is((:'rv'::jsonb ->> 'noSafetyWarningConfirmationRequired')::boolean, true, 'without a safety warning the review asks for the tick');
select is((:'rv'::jsonb #>> '{affectedRoutes,0,estimatedOfflineSizeBytes}')::bigint,
  (2048 + octet_length(convert_to('Cây chòCây chò (en)' || pg_temp.intro('Giới thiệu Cây chò') || pg_temp.intro('About Cây chò'), 'UTF8')))::bigint,
  'the estimate counts distinct offline images and offline text only (BR-M03-G10)');
select is(:'rv'::jsonb -> 'changes' -> 0, '{"fieldLabel": "Ảnh đại diện", "before": "", "after": "Ảnh mới"}', 'changes are plain words');
select ok(jsonb_array_length(:'rv'::jsonb -> 'sensitiveChanges') = 0, 'no sensitive change without safety or requirement text');
select is(pg_temp.publish('ROUTE_FIRST_PUBLICATION', :'r1'), app.cr_blocked('MSG-SAFETY-CONFIRM'), 'without the tick → BLOCKED MSG-SAFETY-CONFIRM');
select is((select status from app.routes where route_id = :'r1'), 'NHAP', '... and nothing changed');
select is(api.publish_unit('ROUTE_FIRST_PUBLICATION', :'r1', 1, true) ->> 'reason', 'STALE', 'an old reviewed revision → STALE (BR-M03-F02)');
select is(pg_temp.publish('ROUTE_FIRST_PUBLICATION', :'r1', true),
  app.cr_ok('MSG-PUBLISHED', jsonb_build_object('publishedRevisionNumber', 1, 'newJourneyVersions',
    jsonb_build_array(jsonb_build_object('routeId', :'r1', 'contentVersion', 1)))), 'with the tick the route is published with version 1');
select ok((select r.status = 'HOAT_DONG' and r.active_content_version = 1 from app.routes r where route_id = :'r1'),
  'HOAT_DONG with active version 1, atomically (BR-M03-F04)');
select is((app.published_of('ROUTE', :'r1')).content -> 'noSafetyWarningConfirmed', 'true', 'the tick is stored in the content (BR-M03-C09)');
select is((select concurrency_revision from app.checkpoints where checkpoint_id = :'c1'), 2,
  'publishing a route never publishes or touches its checkpoints (BR-M03-C17)');

-- ---- public views (publication-public §2, §3) -----------------------------------------------------------------
select is((select array_agg(column_name::text order by ordinal_position) from information_schema.columns
           where table_schema = 'api' and table_name = 'published_routes'),
  array['route_id', 'status', 'name', 'short_description', 'description', 'starting_point', 'thumbnail', 'gallery', 'route_map',
        'participation_requirements', 'preparation', 'best_time', 'safety_warning', 'highlights', 'distance_km', 'duration_min',
        'difficulty', 'time_tags', 'group_tags', 'experience_tags', 'checkpoint_count', 'has_offline_required_checkpoint',
        'has_offline_route_map', 'checkpoint_summaries', 'active_content_version'],
  'published_routes: the snake_case of every top-level contract key, nothing else (no closure, user id or draft)');
select is((select array_agg(column_name::text order by ordinal_position) from information_schema.columns
           where table_schema = 'api' and table_name = 'active_journey_snapshots'),
  array['route_id', 'content_version', 'status', 'published_at', 'previous_content_version', 'estimated_offline_size_bytes',
        'offline_route_map', 'checkpoints'], 'active_journey_snapshots: the JourneySnapshot keys');
select is((select to_jsonb(p) - 'route_id' from api.published_routes p where route_id = :'r1'),
  jsonb_build_object('status', 'HOAT_DONG', 'name', '{"vi": "Đường mòn", "en": "Trail"}'::jsonb,
    'short_description', '{"vi": "Ngắn", "en": "Short"}'::jsonb, 'description', '{"vi": "Mô tả", "en": "Description"}'::jsonb,
    'starting_point', '{"vi": "Cổng", "en": "Gate"}'::jsonb,
    'thumbnail', jsonb_build_object('sourceRef', 'uploads/ROUTE/' || :'r1' || '/thumb'), 'gallery', '[]'::jsonb, 'route_map', null,
    'participation_requirements', null, 'preparation', null, 'best_time', null, 'safety_warning', null, 'highlights', '[]'::jsonb,
    'distance_km', 2.5, 'duration_min', 90, 'difficulty', 'NHE', 'time_tags', '["TIME_NGAN"]'::jsonb,
    'group_tags', '["GROUP_GIA_DINH_CO_TRE"]'::jsonb, 'experience_tags', '["INTEREST_KHAM_PHA"]'::jsonb,
    'checkpoint_count', 1, 'has_offline_required_checkpoint', true, 'has_offline_route_map', false,
    'checkpoint_summaries', jsonb_build_array(jsonb_build_object('checkpointId', :'c1', 'sequence', 1,
      'checkpointName', '{"vi": "Hang Con Moong", "en": "Con Moong Cave"}'::jsonb)),
    'active_content_version', 1),
  'the Published Route row, with derived timeTags and snapshot values (BR-M03-C11, T08)');
select is((select checkpoints -> 0 -> 'offlineResources' -> 0 -> 'staticImages' from api.active_journey_snapshots where route_id = :'r1'),
  jsonb_build_array('uploads/CHECKPOINT/' || :'c1' || '/Cây chò'), 'the snapshot carries the offline images of the visit point');
select is((select checkpoints -> 0 -> 'qrIdentifiers' from api.active_journey_snapshots where route_id = :'r1'), jsonb_build_array(:'q1'),
  'only active identifiers: the draft visit point is not in the journey (BR-M03-X01)');

select api.save_route_draft(p_content => '{"name": {"vi": "Chưa xuất bản"}}') #>> '{data,routeId}' as r2 \gset
set local role anon;
select is((select count(*)::int from api.published_routes), 1, 'anon sees published routes only; a draft route is absent (SC-M03-001)');
select is((select count(*)::int from api.active_journey_snapshots), 1, 'anon sees the active snapshot');
select throws_ok($$select count(*) from app.journey_snapshots$$, '42501', null, 'anon cannot read the snapshot table itself');
reset role;
select is(pg_temp.publish('ROUTE_FIRST_PUBLICATION', :'r2', true) ->> 'reason', 'VALIDATION', 'missing content → nothing published (BR-M03-C04, T04)');
select is((select status from app.routes where route_id = :'r2') || '/' || (select count(*) from app.journey_snapshots where route_id = :'r2'), 'NHAP/0',
  '... the route stays NHAP without a snapshot');
select is(jsonb_path_query_array(api.list_selectable_checkpoints() -> 0 -> 'otherRoutes', '$[*].routeName'), '["Đường mòn"]',
  'Q-04 now names the routes using the checkpoint');

-- ---- QR_OBJECT at an active checkpoint: a new journey version (BR-M03-E13, G04, X02) -----------------------------
select pg_temp.visit_point(:'c1', 'Cây lim') as q2 \gset
select pg_temp.review('QR_OBJECT', :'q2') as qrv \gset
select is((:'qrv'::jsonb #> '{affectedRoutes,0}') - 'estimatedOfflineSizeBytes', jsonb_build_object('routeId', :'r1', 'routeName', 'Đường mòn',
  'routeStatus', 'HOAT_DONG', 'createsNewJourneyVersion', true, 'closesAutomatically', false), 'the review names the affected route');
select is(:'qrv'::jsonb #>> '{impactNotes,0}', 'Thay đổi này ảnh hưởng 1 tuyến: Đường mòn. Gói tải trước của du khách ở các tuyến đó cần cập nhật.',
  'the impact note uses plain words, never "snapshot"');
select is((select count(*)::int from app.journey_snapshots where route_id = :'r1'), 1, 'opening the review writes nothing (BR-M03-G09)');
select is((select status from app.qr_codes where qr_identifier = :'q2'), 'NHAP', '... not even the visit point status');
select is(pg_temp.publish('QR_OBJECT', :'q2') -> 'data', jsonb_build_object('publishedRevisionNumber', 1, 'newJourneyVersions',
  jsonb_build_array(jsonb_build_object('routeId', :'r1', 'contentVersion', 2))), 'publishing the visit point gives the route version 2');
select ok((select previous_content_version = 1 and jsonb_array_length(checkpoints -> 0 -> 'qrIdentifiers') = 2
  from app.journey_snapshots where route_id = :'r1' and content_version = 2), 'version 2 follows 1 and has both identifiers');
select is((select jsonb_array_length(checkpoints -> 0 -> 'qrIdentifiers') from app.journey_snapshots where route_id = :'r1' and content_version = 1), 1,
  'version 1 is kept unchanged (BR-M03-G08)');
select is((select active_content_version from api.published_routes where route_id = :'r1'), 2, 'the view follows the active version');

-- revoking rebuilds the journey (D-94)
select is(api.revoke_visit_point(:'q2', 'Cây đã đổ', jsonb_build_object('entity', (select concurrency_revision from app.qr_codes where qr_identifier = :'q2')))
  #>> '{data,status}', 'THU_HOI', 'the visit point is revoked');
select is((select active_content_version || ':' || jsonb_array_length(s.checkpoints -> 0 -> 'qrIdentifiers')
  from app.routes r join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version where r.route_id = :'r1'),
  '3:1', 'the route moved to version 3 without the revoked identifier, in the same transaction (BR-M03-E09, X02)');

-- ---- STALE and unreadable image (BR-M03-F02, D04 condition 4) -------------------------------------------------
select pg_temp.visit_point(:'c1', 'Thạch nhũ') as q3 \gset
select pg_temp.review('QR_OBJECT', :'q3') ->> 'reviewedConcurrencyRevision' as q3_rev \gset
select api.save_visit_point_draft(:'c1', :'q3', jsonb_build_object('entity', 1, 'draft', 1), (app.draft_of('QRCODE', :'q3')).content
  || '{"objectName": {"vi": "Thạch nhũ đá", "en": "Stalactite"}}',
  p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', (app.draft_of('QRCODE', :'q3')).content #>> '{mediaItems,0,mediaId}',
    'usageRightsConfirmed', true))) ->> 'ok' as resaved \gset
select is(api.publish_unit('QR_OBJECT', :'q3', :'q3_rev'::int) ->> 'reason', 'STALE', 'content changed after the review → STALE');
set local session_replication_role = replica;
delete from storage.objects where name = 'uploads/CHECKPOINT/' || :'c1' || '/Thạch nhũ';
set local session_replication_role = origin;
select is(pg_temp.review('QR_OBJECT', :'q3') #>> '{blockingIssues,0,message}',
  'Chưa đọc được ảnh "Thạch nhũ đá – ảnh 1" đã tải lên. Hãy tải lại ảnh này.', 'an image no longer in Storage → MSG-IMAGE-NOT-READABLE');
select is(pg_temp.publish('QR_OBJECT', :'q3') ->> 'reason', 'VALIDATION', '... and the visit point is not published (BR-M03-D04)');

-- ---- a failing snapshot rolls everything back (BR-M03-F03, G07; SC-M03-002) -----------------------------------
select pg_temp.visit_point(:'c1', 'Măng đá') as q4 \gset
set local session_replication_role = replica;
update app.revisions set content = jsonb_set(content, '{introductionText,en}', '""') where subject_id = :'q1' and status = 'PHAT_HANH';
set local session_replication_role = origin;
select (select count(*) from app.audit_records where outcome = 'FAILURE')::int as failures_before \gset
select is(pg_temp.publish('QR_OBJECT', :'q4'), app.cr_failed('MSG-PUBLISH-FAILED'), 'a snapshot that cannot be built → FAILED MSG-PUBLISH-FAILED');
select ok((select status = 'NHAP' from app.qr_codes where qr_identifier = :'q4')
  and (select status = 'NHAP' from app.revisions where subject_id = :'q4'), '... the visit point and its revision did not change');
select is((select active_content_version from app.routes where route_id = :'r1'), 3, '... the route keeps its version, no candidate stored');
select is((select count(*)::int from app.audit_records where outcome = 'FAILURE'), :failures_before + 1, '... with one FAILURE audit line');

select * from finish();
rollback;
