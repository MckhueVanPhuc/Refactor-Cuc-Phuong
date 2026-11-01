-- pgTAP — US6 close, reopen, archive (tasks M03 T189; admin-command C-09–C-15, Q-09; BR-M03-A03, D10, G02, G10,
-- H01–H09, T05, T07, X02, X06; SC-M03-006, 009, 019, 031). Staff …02 builds and closes, Reviewer …01 reopens and archives.
begin;
create extension if not exists pgtap with schema extensions;
select plan(52);

insert into auth.sessions (id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');
create function pg_temp.as_user(n integer) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', '00000000-0000-4000-8000-00000000000' || n, 'session_id', '10000000-0000-4000-8000-00000000000' || n)::text, true) $$;
create function pg_temp.media(p_owner_type text, p_owner text, p_usage text, p_name text) returns text language sql as $$
  with o as (insert into storage.objects (bucket_id, name, metadata)
             values ('quest-media', 'uploads/' || p_owner_type || '/' || p_owner || '/' || p_name, '{"mimetype": "image/jpeg", "size": 2048}') returning name)
  select api.register_media(p_owner_type, p_owner, p_usage, 'IMAGE', (select name from o)) #>> '{data,mediaId}' $$;
create function pg_temp.review(p_type text, p_id text) returns jsonb language sql as $$ select api.open_publication_review(p_type, p_id) $$;
create function pg_temp.publish(p_type text, p_id text) returns jsonb language sql as $$
  select api.publish_unit(p_type, p_id, (pg_temp.review(p_type, p_id) ->> 'reviewedConcurrencyRevision')::integer, true) $$;
create function pg_temp.rev(p_table text, p_id text) returns jsonb language sql as $$
  select jsonb_build_object('entity', case p_table when 'route' then (select concurrency_revision from app.routes where route_id = p_id)
    else (select concurrency_revision from app.checkpoints where checkpoint_id = p_id) end) $$;
create function pg_temp.checkpoint(p_name text) returns text language plpgsql as $$
declare v_id text; v_media text;
begin
  v_id := api.save_checkpoint_draft(p_content => jsonb_build_object('checkpointName', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'),
    'connectivityMode', 'OFFLINE_REQUIRED')) #>> '{data,checkpointId}';
  v_media := pg_temp.media('CHECKPOINT', v_id, 'QR_MEDIA', 'img');
  perform api.save_visit_point_draft(v_id, p_content => jsonb_build_object('objectName', jsonb_build_object('vi', 'Vật ' || p_name, 'en', 'Thing'),
      'introductionText', jsonb_build_object('vi', rpad('Giới thiệu', 30, '.'), 'en', rpad('About', 30, '.')),
      'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', v_media))),
    p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', v_media, 'usageRightsConfirmed', true)));
  perform pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', v_id);
  return v_id;
end $$;
create function pg_temp.route(p_name text, p_checkpoints text[]) returns text language plpgsql as $$
declare v_id text; v_thumb text;
begin
  v_id := api.save_route_draft(p_content => jsonb_build_object('name', jsonb_build_object('vi', p_name))) #>> '{data,routeId}';
  v_thumb := pg_temp.media('ROUTE', v_id, 'ROUTE_THUMBNAIL', 'thumb');
  perform api.save_route_draft(v_id, jsonb_build_object('entity', 1, 'draft', 1), jsonb_build_object(
      'name', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'), 'shortDescription', '{"vi": "Ngắn", "en": "Short"}'::jsonb,
      'description', '{"vi": "Dài", "en": "Long"}'::jsonb, 'startingPoint', '{"vi": "Cổng", "en": "Gate"}'::jsonb,
      'distanceKm', 2, 'durationMin', 60, 'difficulty', 'NHE', 'groupTags', '["GROUP_CA_NHAN_NGUOI_LON"]'::jsonb,
      'experienceTags', '["INTEREST_KHAM_PHA"]'::jsonb, 'thumbnailMediaId', v_thumb, 'noSafetyWarningConfirmed', true,
      'offlineRouteMapRequired', false,
      'checkpointList', (select jsonb_agg(jsonb_build_object('checkpointId', c) order by n) from unnest(p_checkpoints) with ordinality u(c, n))),
    jsonb_build_array(jsonb_build_object('mediaId', v_thumb, 'usageRightsConfirmed', true)));
  perform pg_temp.publish('ROUTE_FIRST_PUBLICATION', v_id);
  return v_id;
end $$;
create function pg_temp.state(p_route text) returns text language sql as $$
  select status || ':' || coalesce(closure_source, '-') || ':v' || active_content_version from app.routes where route_id = p_route $$;
create function pg_temp.journey(p_route text) returns jsonb language sql as $$
  select jsonb_path_query_array(s.checkpoints, '$[*].sequence') from app.routes r
  join app.journey_snapshots s on s.route_id = r.route_id and s.content_version = r.active_content_version where r.route_id = p_route $$;

select pg_temp.as_user(2);
select pg_temp.checkpoint('Hang Con Moong') as c1 \gset
select pg_temp.checkpoint('Rừng chò') as c2 \gset
select pg_temp.route('Đường A', array[:'c1']) as ra \gset
select pg_temp.route('Đường B', array[:'c1', :'c2']) as rb \gset

-- ---- grants -------------------------------------------------------------------------------------------------------
select ok(bool_and(has_function_privilege('authenticated', f, 'EXECUTE') and not has_function_privilege('anon', f, 'EXECUTE')),
  'US6 commands and Q-09 are for authenticated only')
from unnest(array['api.close_route(text, text, jsonb)', 'api.reopen_route(text, text, jsonb)', 'api.archive_route(text, text, jsonb)',
  'api.close_checkpoint(text, text, jsonb)', 'api.close_routes_listing_checkpoint(text, text)', 'api.reopen_checkpoint(text, text, jsonb)',
  'api.archive_checkpoint(text, text, jsonb)', 'api.get_operation_impact(text, text)']) as f;

-- ---- close a checkpoint (BR-M03-H01, H02, T05, X02, X03, X06; SC-M03-006) ---------------------------------------
select is(api.get_operation_impact('CLOSE_CHECKPOINT', :'c1') - 'reopenBlockers', jsonb_build_object(
  'affectedRoutes', jsonb_build_array(jsonb_build_object('routeId', least(:'ra', :'rb'), 'routeName', case when :'ra' < :'rb' then 'Đường A' else 'Đường B' end),
                                      jsonb_build_object('routeId', greatest(:'ra', :'rb'), 'routeName', case when :'ra' < :'rb' then 'Đường B' else 'Đường A' end)),
  'autoClosingRoutes', jsonb_build_array(jsonb_build_object('routeId', :'ra', 'routeName', 'Đường A'))),
  'Q-09 names every listing route and the one that will close by itself');
select is(api.close_checkpoint(:'c1', '  ', pg_temp.rev('checkpoint', :'c1')), app.cr_blocked('MSG-MISSING-FIELD', '{"tên ô": "Lý do"}'), 'a reason is required');
select is(api.close_checkpoint(:'c1', 'Sạt lở', '{"entity": 1}') ->> 'reason', 'STALE', 'an old revision is STALE');
select is(api.close_checkpoint(:'c1', 'Sạt lở', pg_temp.rev('checkpoint', :'c1')),
  app.cr_ok('MSG-SAVED', jsonb_build_object('autoClosedRoutes', jsonb_build_array(jsonb_build_object('routeId', :'ra', 'routeName', 'Đường A')))),
  'the checkpoint closes; route A loses its only active checkpoint and closes by itself');
select ok((select status = 'TAM_DONG' and closure_reason = 'Sạt lở' and closed_by_user_id = '00000000-0000-4000-8000-000000000002'
  from app.checkpoints where checkpoint_id = :'c1'), 'the checkpoint is TAM_DONG with reason, who and when');
select is(pg_temp.state(:'ra'), 'TAM_DONG:AUTO_NO_ACTIVE_CHECKPOINT:v2', 'route A: closed automatically, with a journey without the checkpoint');
select is(pg_temp.state(:'rb'), 'HOAT_DONG:-:v2', 'route B stays active and gets version 2 in the same transaction');
select is(pg_temp.journey(:'rb'), '[2]', 'the remaining checkpoint keeps its list position: sequence may have gaps (BR-M03-G02)');
select is((select jsonb_agg(action order by occurred_at, audit_id) from app.audit_records where outcome = 'SUCCESS'
  and action in ('CHECKPOINT_CLOSED', 'ROUTE_AUTO_CLOSED')), '["CHECKPOINT_CLOSED", "ROUTE_AUTO_CLOSED"]',
  'one line for the checkpoint and its own line for the automatic route closure');
select is((select after_state -> 'affectedRoutes' from app.audit_records where action = 'CHECKPOINT_CLOSED' and outcome = 'SUCCESS'),
  (select jsonb_agg(app.route_name(r) order by r) from unnest(array[:'ra', :'rb']) r), 'the checkpoint line names the affected routes (BR-M03-X06)');
select is(api.close_checkpoint(:'c1', 'Lần nữa', pg_temp.rev('checkpoint', :'c1')) ->> 'reason', 'FAILED', 'only an active checkpoint closes');

-- ---- roles (BR-M03-A03; SC-M03-009) --------------------------------------------------------------------------------
select is(api.reopen_checkpoint(:'c1', 'An toàn', pg_temp.rev('checkpoint', :'c1')), app.cr_forbidden(), 'Content Staff cannot reopen a checkpoint');
select is(api.reopen_route(:'ra', 'An toàn', pg_temp.rev('route', :'ra')), app.cr_forbidden(), 'Content Staff cannot reopen a route');
select is(api.archive_checkpoint(:'c1', 'Bỏ', pg_temp.rev('checkpoint', :'c1')), app.cr_forbidden(), 'Content Staff cannot archive');
select throws_ok(format('select api.get_operation_impact(%L, %L)', 'REOPEN_CHECKPOINT', :'c1'), '42501', null,
  'Content Staff cannot read the reopen impact');

-- ---- reopen a checkpoint (BR-M03-H06, H07; SC-M03-019) -----------------------------------------------------------
select pg_temp.as_user(1);
select is(api.get_operation_impact('REOPEN_CHECKPOINT', :'c1') -> 'reopenBlockers', '[]', 'nothing blocks reopening');
select is(api.reopen_checkpoint(:'c1', '', pg_temp.rev('checkpoint', :'c1')),
  app.cr_blocked('MSG-MISSING-FIELD', '{"tên ô": "Ghi chú xác nhận an toàn"}'), 'a safety note is required');
select is(api.reopen_checkpoint(:'c1', 'Đã kiểm tra an toàn', pg_temp.rev('checkpoint', :'c1')) #>> '{data,status}', 'HOAT_DONG',
  'the Reviewer reopens the checkpoint');
select is(pg_temp.state(:'rb') || ' ' || pg_temp.journey(:'rb'), 'HOAT_DONG:-:v3 [1, 2]', 'route B gets version 3 with the checkpoint back');
select is(pg_temp.state(:'ra'), 'TAM_DONG:AUTO_NO_ACTIVE_CHECKPOINT:v3', 'route A has the checkpoint back in its journey but never reopens by itself');
select ok((select closure_reason is null and closed_at is null from app.checkpoints where checkpoint_id = :'c1'), 'the closure fields are cleared');

-- ---- route: reopen, close, archive (BR-M03-H01, H03, H07, H09, T07) ---------------------------------------------
select is(api.reopen_route(:'ra', 'Đường đã dọn', pg_temp.rev('route', :'ra')) #>> '{data,status}', 'HOAT_DONG', 'the Reviewer reopens route A');
select is(pg_temp.state(:'ra'), 'HOAT_DONG:-:v3', '... same journey version, closure source cleared');
select pg_temp.as_user(2);
select is(api.close_route(:'ra', null, pg_temp.rev('route', :'ra')) ->> 'messageKey', 'MSG-MISSING-FIELD', 'closing a route needs a reason');
select is(api.close_route(:'ra', 'Bảo trì', pg_temp.rev('route', :'ra')) #>> '{data,status}', 'TAM_DONG', 'staff closes route A');
select is(pg_temp.state(:'ra'), 'TAM_DONG:MANUAL:v3', 'manual closure, no new version (BR-M03-H03)');
select is((select status from api.published_routes where route_id = :'ra'), 'TAM_DONG', 'M01 sees the route closed');
select is(api.close_route(:'ra', 'Lần nữa', pg_temp.rev('route', :'ra')) ->> 'reason', 'FAILED', 'only an active route closes');

-- a closed route whose journey has no active checkpoint cannot reopen (BR-M03-H07)
select is(api.close_checkpoint(:'c1', 'Sạt lở lần hai', pg_temp.rev('checkpoint', :'c1')) -> 'data', '{"autoClosedRoutes": []}',
  'closing the checkpoint again: route A is already closed, nothing closes by itself');
select pg_temp.as_user(1);
select is(api.get_operation_impact('REOPEN_ROUTE', :'ra') -> 'reopenBlockers',
  jsonb_build_array(app.render_message('MSG-NO-ACTIVE-CHECKPOINT')), 'Q-09 says what blocks reopening the route');
select is(api.reopen_route(:'ra', 'An toàn', pg_temp.rev('route', :'ra')), app.cr_blocked('MSG-NO-ACTIVE-CHECKPOINT'),
  'reopening a route without an active checkpoint → BLOCKED MSG-NO-ACTIVE-CHECKPOINT');
select is(api.archive_route(:'rb', 'Bỏ', pg_temp.rev('route', :'rb')) ->> 'reason', 'FAILED', 'only a closed route is archived');
select is(api.archive_route(:'ra', 'Không dùng nữa', pg_temp.rev('route', :'ra')) #>> '{data,status}', 'LUU_TRU', 'a closed route is archived');
select is((select status from app.checkpoints where checkpoint_id = :'c1'), 'TAM_DONG', '... its checkpoints do not change (BR-M03-T07)');

-- ---- archive a checkpoint (BR-M03-D10; SC-M03-031) ---------------------------------------------------------------
select is(api.archive_checkpoint(:'c1', 'Không dùng nữa', pg_temp.rev('checkpoint', :'c1')),
  app.cr_blocked('MSG-CHECKPOINT-IN-USE', '{"danh sách": "Đường B"}'), 'a checkpoint still listed by a route → MSG-CHECKPOINT-IN-USE naming it');
select is(api.archive_checkpoint(:'c2', 'Không dùng nữa', pg_temp.rev('checkpoint', :'c2')) ->> 'reason', 'FAILED', 'an active checkpoint is not archived');

-- ---- close the related routes when closing the checkpoint fails (BR-M03-H04, X06) ------------------------------
select pg_temp.as_user(2);
select is(api.close_routes_listing_checkpoint(:'c2', 'Đóng khẩn'), app.cr_ok('MSG-SAVED', jsonb_build_object('closedRoutes',
  jsonb_build_array(jsonb_build_object('routeId', :'rb', 'routeName', 'Đường B')))), 'every active route listing the checkpoint closes');
select is(pg_temp.state(:'rb') || ' / ' || (select status from app.checkpoints where checkpoint_id = :'c2'), 'TAM_DONG:MANUAL:v4 / HOAT_DONG',
  'route B closed manually, the checkpoint stays active');
select is((select after_state from app.audit_records where action = 'RELATED_ROUTES_CLOSED' and outcome = 'SUCCESS'),
  '{"affectedRoutes": ["Đường B"]}', 'one line on the checkpoint naming the closed routes');
select pg_temp.as_user(1);
select is(api.archive_route(:'rb', 'Không dùng nữa', pg_temp.rev('route', :'rb')) #>> '{data,status}', 'LUU_TRU', 'route B is archived');
select (select count(*) from app.journey_snapshots)::int as snapshots \gset
select is(api.archive_checkpoint(:'c1', 'Không dùng nữa', pg_temp.rev('checkpoint', :'c1')) #>> '{data,status}', 'LUU_TRU',
  'with no route left, the closed checkpoint is archived');
select is((select status from app.qr_codes where checkpoint_id = :'c1'), 'THU_HOI', '... its visit points are revoked');
select is((select count(*)::int from app.journey_snapshots), :snapshots, '... and no journey version is created');

-- ---- reopen blocked by unreadable images (BR-M03-H06) -------------------------------------------------------------
select pg_temp.as_user(2);
select pg_temp.checkpoint('Động Người Xưa') as c3 \gset
select is(api.close_checkpoint(:'c3', 'Kiểm tra', pg_temp.rev('checkpoint', :'c3')) ->> 'ok', 'true', 'a checkpoint with no route closes');
set local session_replication_role = replica;
delete from storage.objects where name = 'uploads/CHECKPOINT/' || :'c3' || '/img';
set local session_replication_role = origin;
select pg_temp.as_user(1);
select is(api.get_operation_impact('REOPEN_CHECKPOINT', :'c3') -> 'reopenBlockers',
  '["Chưa đọc được ảnh \"Vật Động Người Xưa – ảnh 1\" đã tải lên. Hãy tải lại ảnh này."]', 'Q-09 lists what to fix');
select is(api.reopen_checkpoint(:'c3', 'An toàn', pg_temp.rev('checkpoint', :'c3')) ->> 'messageKey', 'MSG-REOPEN-BLOCKED',
  'reopening with an unreadable image → BLOCKED MSG-REOPEN-BLOCKED');
select is((select status from app.checkpoints where checkpoint_id = :'c3'), 'TAM_DONG', '... and it stays closed');

-- ---- closing fails → MSG-CLOSE-FAILED, nothing changes (BR-M03-H04, F03) ----------------------------------------
select pg_temp.as_user(2);
select pg_temp.checkpoint('Cây chò ngàn năm') as c4 \gset
select pg_temp.checkpoint('Thung lũng') as c5 \gset
select pg_temp.route('Đường C', array[:'c4', :'c5']) as rc \gset
set local session_replication_role = replica;
update app.revisions set content = jsonb_set(content, '{introductionText,en}', '""')
where status = 'PHAT_HANH' and subject_id = (select qr_identifier from app.qr_codes where checkpoint_id = :'c5');
set local session_replication_role = origin;
select is(api.close_checkpoint(:'c4', 'Cây đổ', pg_temp.rev('checkpoint', :'c4')), app.cr_failed('MSG-CLOSE-FAILED'),
  'a journey that cannot be rebuilt → FAILED MSG-CLOSE-FAILED');
select is((select status from app.checkpoints where checkpoint_id = :'c4') || ' ' || pg_temp.state(:'rc'), 'HOAT_DONG HOAT_DONG:-:v1',
  '... the checkpoint and the route did not change');
select ok((select outcome = 'FAILURE' from app.audit_records where action = 'CHECKPOINT_CLOSED' and entity_id = :'c4'), '... with a FAILURE audit line');
select is(api.close_routes_listing_checkpoint(:'c4', 'Cây đổ') #>> '{data,closedRoutes,0,routeName}', 'Đường C',
  'the fallback "close the related routes" closes route C');

select * from finish();
rollback;
