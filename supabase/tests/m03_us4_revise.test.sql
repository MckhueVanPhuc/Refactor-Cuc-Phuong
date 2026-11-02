-- pgTAP — US4 revising published data (tasks M03 T186; admin-command C-05, Q-08; publication-public §4; research R-08;
-- BR-M03-B05, C05, C15, C16, E06, E09, E13, F05, F06, G03–G05, T05, T06, X02, X03; SC-M03-003, 005, 029).
-- BUSY uses a second session opened with dblink that holds an advisory lock of the connected set; the password is
-- the public default of the local stack, never a real credential.
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
select plan(33);

insert into auth.sessions (id, user_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-000000000002", "session_id": "10000000-0000-4000-8000-000000000002"}', true);

create function pg_temp.object(p_path text) returns text language sql as $$
  insert into storage.objects (bucket_id, name, metadata)
  values ('quest-media', p_path, '{"mimetype": "image/jpeg", "size": 2048}') returning name $$;
create function pg_temp.media(p_owner_type text, p_owner text, p_usage text, p_name text) returns text language sql as $$
  select api.register_media(p_owner_type, p_owner, p_usage, 'IMAGE',
    pg_temp.object('uploads/' || p_owner_type || '/' || p_owner || '/' || p_name)) #>> '{data,mediaId}' $$;
create function pg_temp.review(p_type text, p_id text) returns jsonb language sql as $$ select api.open_publication_review(p_type, p_id) $$;
create function pg_temp.publish(p_type text, p_id text) returns jsonb language sql as $$
  select api.publish_unit(p_type, p_id, (pg_temp.review(p_type, p_id) ->> 'reviewedConcurrencyRevision')::integer, true) $$;
create function pg_temp.expected(p_type text, p_id text) returns jsonb language sql as $$
  select jsonb_build_object('entity', e ->> 'concurrencyRevision', 'draft', e #>> '{draft,concurrencyRevision}')
  from (select case p_type when 'ROUTE' then api.get_route_editor(p_id) when 'CHECKPOINT' then api.get_checkpoint_editor(p_id)
               else api.get_visit_point_editor(p_id) end as e) x $$;
-- a ready visit point (one image, rights confirmed)
create function pg_temp.visit_point(p_checkpoint text, p_name text, p_qr text default null) returns text language sql as $$
  select api.save_visit_point_draft(p_checkpoint, p_qr, case when p_qr is null then '{}' else pg_temp.expected('QRCODE', p_qr) end,
    jsonb_build_object('objectName', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'),
      'introductionText', jsonb_build_object('vi', rpad('Giới thiệu ' || p_name, 30, '.'), 'en', rpad('About ' || p_name, 30, '.')),
      'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', m.id))),
    p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', m.id, 'usageRightsConfirmed', true))) #>> '{data,qrIdentifier}'
  from (select pg_temp.media('CHECKPOINT', p_checkpoint, 'QR_MEDIA', p_name || coalesce(p_qr, '')) as id) m $$;
-- a published checkpoint with one active visit point
create function pg_temp.checkpoint(p_name text, p_mode text) returns text language plpgsql as $$
declare v_id text;
begin
  v_id := api.save_checkpoint_draft(p_content => jsonb_build_object('checkpointName', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'),
    'connectivityMode', p_mode, 'fieldVerificationConfirmed', p_mode = 'ONLINE_AVAILABLE')) #>> '{data,checkpointId}';
  perform pg_temp.visit_point(v_id, 'Vật ' || p_name);
  perform pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', v_id);
  return v_id;
end $$;
create function pg_temp.route_content(p_name text, p_thumb text, p_list jsonb) returns jsonb language sql as $$
  select jsonb_build_object('name', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'), 'shortDescription', '{"vi": "Ngắn", "en": "Short"}'::jsonb,
    'description', '{"vi": "Mô tả", "en": "Description"}'::jsonb, 'startingPoint', '{"vi": "Cổng", "en": "Gate"}'::jsonb,
    'distanceKm', 3, 'durationMin', 120, 'difficulty', 'NHE', 'groupTags', '["GROUP_CA_NHAN_NGUOI_LON"]'::jsonb,
    'experienceTags', '["INTEREST_TIM_HIEU"]'::jsonb, 'thumbnailMediaId', p_thumb, 'noSafetyWarningConfirmed', true,
    'offlineRouteMapRequired', false, 'checkpointList', p_list) $$;
-- a published route listing the given checkpoints
create function pg_temp.route(p_name text, p_checkpoints text[]) returns text language plpgsql as $$
declare v_id text; v_thumb text;
begin
  v_id := api.save_route_draft(p_content => jsonb_build_object('name', jsonb_build_object('vi', p_name))) #>> '{data,routeId}';
  v_thumb := pg_temp.media('ROUTE', v_id, 'ROUTE_THUMBNAIL', 'thumb');
  perform api.save_route_draft(v_id, pg_temp.expected('ROUTE', v_id),
    pg_temp.route_content(p_name, v_thumb, (select jsonb_agg(jsonb_build_object('checkpointId', c) order by n) from unnest(p_checkpoints) with ordinality u(c, n))),
    jsonb_build_array(jsonb_build_object('mediaId', v_thumb, 'usageRightsConfirmed', true)));
  perform pg_temp.publish('ROUTE_FIRST_PUBLICATION', v_id);
  return v_id;
end $$;
create function pg_temp.version(p_route text) returns integer language sql as $$ select active_content_version from app.routes where route_id = p_route $$;
-- save the route draft with a change applied to its current content
create function pg_temp.edit_route(p_route text, p_patch jsonb) returns jsonb language sql as $$
  select api.save_route_draft(p_route, pg_temp.expected('ROUTE', p_route),
    coalesce((app.draft_of('ROUTE', p_route)).content, (app.published_of('ROUTE', p_route)).content) || p_patch) $$;

select pg_temp.checkpoint('Hang Con Moong', 'OFFLINE_REQUIRED') as c1 \gset
select pg_temp.checkpoint('Rừng chò', 'ONLINE_AVAILABLE') as c2 \gset
select pg_temp.route('Đường A', array[:'c1', :'c2']) as ra \gset
select pg_temp.route('Đường B', array[:'c1']) as rb \gset
select is(pg_temp.version(:'ra') || '/' || pg_temp.version(:'rb'), '1/1', 'two published routes share the checkpoint "Hang Con Moong"');

-- ---- one pending draft; the public version is unchanged until publication (BR-M03-C05, F06, T03) ----------------
select is(pg_temp.edit_route(:'ra', '{"description": {"vi": "Mô tả mới", "en": "New description"}}') ->> 'ok', 'true', 'a published route is edited as a draft');
select is(pg_temp.edit_route(:'ra', '{"description": {"vi": "Mô tả mới hơn", "en": "Newer description"}}') #>> '{data,revisionNumber}', '2',
  'the next edit continues the same pending draft');
select is((select description ->> 'vi' from api.published_routes where route_id = :'ra'), 'Mô tả', 'the public route still shows the published text');
select ok((select (r ->> 'hasPendingDraft')::boolean from jsonb_array_elements(api.list_routes()) r where r ->> 'routeId' = :'ra'),
  'the list marks the pending draft');
select is(api.save_route_draft(:'ra', '{"entity": 1, "draft": 1}', (app.draft_of('ROUTE', :'ra')).content) ->> 'reason', 'STALE',
  'saving with an old revision is STALE, nothing is overwritten (BR-M03-F06; SC-M03-005)');

-- ---- route information without a journey change: no version (BR-M03-C15, G05) --------------------------------
select is(pg_temp.review('ROUTE_INFORMATION', :'ra') #>> '{affectedRoutes,0,createsNewJourneyVersion}', 'false', 'the review says no new journey version');
select is(pg_temp.publish('ROUTE_INFORMATION', :'ra') -> 'data', '{"publishedRevisionNumber": 2, "newJourneyVersions": []}',
  'publishing route information creates no version');
select is((select description ->> 'vi' || '/' || active_content_version from api.published_routes where route_id = :'ra'), 'Mô tả mới hơn/1',
  'the public text changes, the active version stays 1');
select is((select status from app.revisions where subject_id = :'ra' and revision_number = 1), 'LUU_TRU', 'the previous revision becomes LUU_TRU');

-- ---- order of the list: a version for that route only (BR-M03-T06, G03) -----------------------------------------
select pg_temp.edit_route(:'ra', jsonb_build_object('checkpointList', jsonb_build_array(jsonb_build_object('checkpointId', :'c2'),
  jsonb_build_object('checkpointId', :'c1')))) ->> 'ok' as reordered \gset
select is(pg_temp.publish('ROUTE_INFORMATION', :'ra') #> '{data,newJourneyVersions}', jsonb_build_array(jsonb_build_object('routeId', :'ra', 'contentVersion', 2)),
  'a new order gives route A version 2');
select is(pg_temp.version(:'rb'), 1, 'route B is untouched');
select is((select jsonb_path_query_array(checkpoints, '$[*].checkpointId') from app.journey_snapshots where route_id = :'ra' and content_version = 2),
  jsonb_build_array(:'c2', :'c1'), 'version 2 follows the new order');

-- ---- offline map (BR-M03-C16) -----------------------------------------------------------------------------------
select pg_temp.media('ROUTE', :'ra', 'ROUTE_MAP', 'map') as map \gset
select pg_temp.edit_route(:'ra', jsonb_build_object('routeMapMediaId', :'map')) ->> 'ok' as map_saved \gset
update app.media set usage_rights_confirmed = true, usage_rights_confirmed_by_user_id = 'x', usage_rights_confirmed_at = now(),
  concurrency_revision = concurrency_revision + 1 where media_id = :'map'::uuid;
select is(pg_temp.publish('ROUTE_INFORMATION', :'ra') #> '{data,newJourneyVersions}', '[]', 'a map not marked for offline use creates no version');
select pg_temp.edit_route(:'ra', '{"offlineRouteMapRequired": true}') ->> 'ok' as tick_saved \gset
select is(pg_temp.review('ROUTE_INFORMATION', :'ra') -> 'sensitiveChanges',
  '[{"fieldLabel": "Sơ đồ này cần để định hướng khi không có mạng", "before": "Không", "after": "Có"}]', 'the offline-map tick is a sensitive change (BR-M03-C10)');
select is(pg_temp.publish('ROUTE_INFORMATION', :'ra') #>> '{data,newJourneyVersions,0,contentVersion}', '3', 'marking the map for offline use gives version 3');
select is((select offline_route_map ->> 'sourceRef' from api.active_journey_snapshots where route_id = :'ra'),
  'uploads/ROUTE/' || :'ra' || '/map', 'the map is in the snapshot');

-- ---- checkpoint revision: every listing route at once (BR-M03-D06, X02, X03, B05) -----------------------------------
select api.save_checkpoint_draft(:'c1', pg_temp.expected('CHECKPOINT', :'c1'),
  '{"checkpointName": {"vi": "Hang Con Moong mới", "en": "New Con Moong Cave"}, "connectivityMode": "OFFLINE_REQUIRED"}') ->> 'ok' as renamed \gset
select is((select jsonb_agg(r ->> 'routeName' || ':' || (r ->> 'createsNewJourneyVersion') order by r ->> 'routeName')
           from jsonb_array_elements(pg_temp.review('CHECKPOINT_REVISION', :'c1') -> 'affectedRoutes') r),
  '["Đường A:true", "Đường B:true"]',
  'the review names both routes, each with a new journey version');
select is((select count(*)::int from app.journey_snapshots where route_id in (:'ra', :'rb')), 4, '... and opening the review wrote nothing');
select is((select jsonb_agg(v ->> 'contentVersion' order by v ->> 'routeId') from jsonb_array_elements(pg_temp.publish('CHECKPOINT_REVISION', :'c1') #> '{data,newJourneyVersions}') v),
  (select jsonb_agg(v order by r) from (values (:'ra', '4'), (:'rb', '2')) x(r, v)), 'publishing gives route A version 4 and route B version 2 together');
select is((select checkpoints -> 0 #>> '{checkpointName,vi}' from app.journey_snapshots where route_id = :'rb' and content_version = 2),
  'Hang Con Moong mới', 'the new name is in the new journeys');
select is((select checkpoints -> 0 #>> '{checkpointName,vi}' from app.journey_snapshots where route_id = :'rb' and content_version = 1),
  'Hang Con Moong', 'the old version keeps the old name (BR-M03-G08)');

select api.save_checkpoint_draft(:'c2', pg_temp.expected('CHECKPOINT', :'c2'),
  '{"checkpointName": {"vi": "Rừng chò", "en": "Rừng chò (en)"}, "connectivityMode": "OFFLINE_REQUIRED"}') ->> 'ok' as mode_saved \gset
select ok(pg_temp.review('CHECKPOINT_REVISION', :'c2') -> 'impactNotes' ? 'Loại kết nối của điểm dừng "Rừng chò" sẽ đổi. Sau khi xuất bản, hãy in lại mã QR của các điểm tham quan để dòng hướng dẫn trên tem đúng với thực tế.',
  'a mode change reminds to reprint the labels (MSG-REPRINT-MODE-CHANGED)');

-- ---- visit points (BR-M03-E06, E13, G04, G05) -------------------------------------------------------------------
select (select qr_identifier from app.qr_codes where checkpoint_id = :'c2') as q2 \gset
set local session_replication_role = replica;
update app.revisions set status = 'DA_BO' where subject_id = :'c2' and status = 'NHAP';
set local session_replication_role = origin;
select pg_temp.visit_point(:'c2', 'Vật Rừng chò sửa', :'q2') as q2_saved \gset
select is(pg_temp.publish('QR_OBJECT', :'q2') #> '{data,newJourneyVersions}', '[]',
  'new content of a visit point at an ONLINE_AVAILABLE checkpoint creates no version (BR-M03-G05)');
select (select qr_identifier from app.qr_codes where checkpoint_id = :'c1') as q1 \gset
select pg_temp.visit_point(:'c1', 'Vật Hang sửa', :'q1') as q1_saved \gset
select is((select jsonb_agg(v ->> 'routeId' order by v ->> 'routeId') from jsonb_array_elements(pg_temp.publish('QR_OBJECT', :'q1') #> '{data,newJourneyVersions}') v),
  (select jsonb_agg(r order by r) from unnest(array[:'ra', :'rb']) r), 'new content at an OFFLINE_REQUIRED checkpoint: a version for every listing route (BR-M03-E06)');
select is((select checkpoints -> 0 -> 'offlineResources' -> 0 #>> '{objectName,vi}' from api.active_journey_snapshots where route_id = :'rb'),
  'Vật Hang sửa', '... carrying the new content');

-- ---- last active checkpoint (BR-M03-T05) -------------------------------------------------------------------------
select pg_temp.edit_route(:'rb', '{"checkpointList": []}') ->> 'ok' as emptied \gset
select is(pg_temp.publish('ROUTE_INFORMATION', :'rb'), app.cr_blocked('MSG-ROUTE-LAST-CHECKPOINT'),
  'removing the last active checkpoint of an active route → BLOCKED MSG-ROUTE-LAST-CHECKPOINT');
select is(jsonb_array_length((select checkpoints from api.active_journey_snapshots where route_id = :'rb')), 1, '... the public journey is unchanged');

-- ---- connected-set locks (BR-M03-F05; R-08) ----------------------------------------------------------------------
-- Advisory locks last until the end of the transaction, so the keys used here are new to this test session.
-- The second session uses pg_try_advisory_xact_lock and never waits: the test cannot hang.
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Động bận", "en": "Busy cave"}, "connectivityMode": "OFFLINE_REQUIRED"}')
  #>> '{data,checkpointId}' as c_busy \gset
select pg_temp.visit_point(:'c_busy', 'Vật bận') as q_busy \gset
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Động rảnh", "en": "Free cave"}, "connectivityMode": "OFFLINE_REQUIRED"}')
  #>> '{data,checkpointId}' as c_free \gset
select pg_temp.visit_point(:'c_free', 'Vật rảnh') as q_free \gset
select extensions.dblink_connect('other', format('host=%s port=5432 dbname=postgres user=postgres password=postgres',
  coalesce(host(inet_server_addr()), 'db'))) as connected \gset
select extensions.dblink_exec('other', 'begin') as began \gset
select is((select v from extensions.dblink('other',
  format('select pg_try_advisory_xact_lock(hashtextextended(%L, 0))::text', 'checkpoint:' || :'c_busy')) as t(v text)), 'true',
  'another session holds the lock of "Động bận"');
select is(pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', :'c_busy'), app.cr_busy('Động bận'),
  'an operation on an intersecting set → BUSY naming the item, no retry (BR-M03-L07)');
select ok((select outcome = 'FAILURE' and status = 'NHAP' from app.audit_records a, app.checkpoints c
  where a.action = 'PUBLISHED' and a.entity_id = :'c_busy' and c.checkpoint_id = :'c_busy' order by a.occurred_at desc limit 1),
  '... nothing changed, one FAILURE audit line');
select is(pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', :'c_free') ->> 'ok', 'true', 'a disjoint set publishes meanwhile');
select extensions.dblink_exec('other', 'rollback') as ended \gset
select extensions.dblink_disconnect('other') as disconnected \gset
select is(pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', :'c_busy') ->> 'ok', 'true', 'once the other operation ends it publishes');

select * from finish();
rollback;
