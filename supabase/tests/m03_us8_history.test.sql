-- pgTAP — US8 history, restore, discard, audit log (tasks M03 T193; admin-command C-06, C-08, Q-10, Q-11;
-- BR-M03-A03, A05, F06–F10, L10, L11, X06; SC-M03-014, 021). Staff …02 edits; Reviewer …01 also publishes.
begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

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
create function pg_temp.publish(p_type text, p_id text) returns jsonb language sql as $$
  select api.publish_unit(p_type, p_id, (api.open_publication_review(p_type, p_id) ->> 'reviewedConcurrencyRevision')::integer, true) $$;
create function pg_temp.expected(p_type text, p_id text) returns jsonb language sql as $$
  select jsonb_build_object('entity', e ->> 'concurrencyRevision', 'draft', e #>> '{draft,concurrencyRevision}')
  from (select case p_type when 'ROUTE' then api.get_route_editor(p_id) when 'CHECKPOINT' then api.get_checkpoint_editor(p_id)
               else api.get_visit_point_editor(p_id) end as e) x $$;
create function pg_temp.visit_point(p_checkpoint text, p_name text) returns text language sql as $$
  select api.save_visit_point_draft(p_checkpoint, p_content => jsonb_build_object(
      'objectName', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'),
      'introductionText', jsonb_build_object('vi', rpad('Giới thiệu', 30, '.'), 'en', rpad('About', 30, '.')),
      'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', m.id))),
    p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', m.id, 'usageRightsConfirmed', true))) #>> '{data,qrIdentifier}'
  from (select pg_temp.media('CHECKPOINT', p_checkpoint, 'QR_MEDIA', p_name) as id) m $$;
create function pg_temp.route(p_name text, p_checkpoint text) returns text language plpgsql as $$
declare v_id text; v_thumb text;
begin
  v_id := api.save_route_draft(p_content => jsonb_build_object('name', jsonb_build_object('vi', p_name))) #>> '{data,routeId}';
  v_thumb := pg_temp.media('ROUTE', v_id, 'ROUTE_THUMBNAIL', 'thumb');
  perform api.save_route_draft(v_id, pg_temp.expected('ROUTE', v_id), jsonb_build_object(
      'name', jsonb_build_object('vi', p_name, 'en', p_name || ' (en)'), 'shortDescription', '{"vi": "Ngắn", "en": "Short"}'::jsonb,
      'description', '{"vi": "Dài", "en": "Long"}'::jsonb, 'startingPoint', '{"vi": "Cổng", "en": "Gate"}'::jsonb,
      'distanceKm', 4.5, 'durationMin', 60, 'difficulty', 'NHE', 'groupTags', '["GROUP_CA_NHAN_NGUOI_LON"]'::jsonb,
      'experienceTags', '["INTEREST_KHAM_PHA"]'::jsonb, 'thumbnailMediaId', v_thumb, 'noSafetyWarningConfirmed', true,
      'offlineRouteMapRequired', false, 'checkpointList', jsonb_build_array(jsonb_build_object('checkpointId', p_checkpoint))),
    jsonb_build_array(jsonb_build_object('mediaId', v_thumb, 'usageRightsConfirmed', true)));
  perform pg_temp.publish('ROUTE_FIRST_PUBLICATION', v_id);
  return v_id;
end $$;
create function pg_temp.edit_route(p_route text, p_patch jsonb) returns jsonb language sql as $$
  select api.save_route_draft(p_route, pg_temp.expected('ROUTE', p_route),
    coalesce((app.draft_of('ROUTE', p_route)).content, (app.published_of('ROUTE', p_route)).content) || p_patch) $$;
create function pg_temp.audits() returns integer language sql as $$ select count(*)::int from app.audit_records $$;
-- the newest audit row of an action, as Q-10 shows it
create function pg_temp.last_row(p_type text, p_id text, p_action text) returns jsonb language sql as $$
  select r from jsonb_array_elements(api.get_item_history(p_type, p_id) -> 'auditRows') r where r ->> 'action' = p_action limit 1 $$;

select pg_temp.as_user(2);
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"}, "connectivityMode": "OFFLINE_REQUIRED"}')
  #>> '{data,checkpointId}' as c1 \gset
select pg_temp.visit_point(:'c1', 'Cây chò') as q1 \gset
select pg_temp.publish('CHECKPOINT_FIRST_PUBLICATION', :'c1') ->> 'ok' as c1_published \gset
select pg_temp.route('Đường A', :'c1') as ra \gset
select pg_temp.route('Đường B', :'c1') as rb \gset

-- ---- grants ----------------------------------------------------------------------------------------------------------
select ok(bool_and(has_function_privilege('authenticated', f, 'EXECUTE') and not has_function_privilege('anon', f, 'EXECUTE')),
  'US8 commands and queries are for authenticated only')
from unnest(array['api.discard_draft(text, text, jsonb)', 'api.restore_revision(text, text, integer)', 'api.get_item_history(text, text)',
  'api.list_audit_log(integer, timestamptz, timestamptz, text, text)']) as f;

-- ---- self-published flag and plain-word lines (BR-M03-A05, F08, L10) ---------------------------------------------
select pg_temp.edit_route(:'ra', '{"distanceKm": 6}') ->> 'ok' as edited \gset
select pg_temp.as_user(1);
select pg_temp.publish('ROUTE_INFORMATION', :'ra') ->> 'ok' as reviewer_published \gset
select is((select jsonb_agg(r ->> 'revisionNumber' || ':' || (r ->> 'selfPublished') || ':' || (r ->> 'publishedByEmail') order by r ->> 'revisionNumber' desc)
           from jsonb_array_elements(api.get_item_history('ROUTE', :'ra') -> 'publishedRevisions') r),
  '["2:false:reviewer@example.test", "1:true:staff@example.test"]',
  'Q-10 lists published revisions newest first, with publisher and the self-published flag (BR-M03-F09, A05)');
select ok(not (api.get_item_history('ROUTE', :'ra') #> '{publishedRevisions,0}') ? 'content', 'the history carries no content');
select ok(pg_temp.last_row('ROUTE', :'ra', 'PUBLISHED') -> 'changeLines' ? 'Quãng đường (km): 4,5 → 6',
  'the publication line reads "{label}: {before} → {after}"');
select is((pg_temp.last_row('ROUTE', :'ra', 'PUBLISHED') ->> 'selfPublished')::boolean, false, 'publishing someone else''s draft is not self-published');
select is(pg_temp.last_row('ROUTE', :'ra', 'PUBLISHED') ->> 'subjectName', 'Đường A', 'the row names the item');
select ok(not (pg_temp.last_row('ROUTE', :'ra', 'PUBLISHED') ? 'subjectId'), 'Q-10 rows carry no id');
select ok(pg_temp.last_row('ROUTE', :'ra', 'PUBLISHED') ->> 'actorEmail' = 'reviewer@example.test', 'the actor is shown by email');

-- ---- operations at a checkpoint name the affected routes (BR-M03-X06) --------------------------------------------
select pg_temp.as_user(2);
select api.save_checkpoint_draft(:'c1', pg_temp.expected('CHECKPOINT', :'c1'),
  '{"checkpointName": {"vi": "Hang Con Moong mới", "en": "New Con Moong Cave"}, "connectivityMode": "OFFLINE_REQUIRED"}') ->> 'ok' as renamed \gset
select pg_temp.publish('CHECKPOINT_REVISION', :'c1') ->> 'ok' as c1_revised \gset
create function pg_temp.names_both(p_row jsonb) returns boolean language sql as $$
  select (p_row -> 'changeLines')::text like '%Tuyến bị ảnh hưởng: %Đường A%' and (p_row -> 'changeLines')::text like '%Đường B%' $$;
select ok(pg_temp.names_both(pg_temp.last_row('CHECKPOINT', :'c1', 'PUBLISHED')), 'publishing a checkpoint revision names both routes');
select ok(pg_temp.last_row('CHECKPOINT', :'c1', 'PUBLISHED') -> 'changeLines'
  ? 'Tên điểm dừng (tiếng Việt): Hang Con Moong → Hang Con Moong mới', '... and the changed name');
select pg_temp.visit_point(:'c1', 'Cây lim') as q2 \gset
select pg_temp.publish('QR_OBJECT', :'q2') ->> 'ok' as q2_published \gset
select ok(pg_temp.names_both(pg_temp.last_row('QRCODE', :'q2', 'PUBLISHED')), 'publishing a visit point names both routes');
select api.revoke_visit_point(:'q1', 'Cây đổ', pg_temp.expected('QRCODE', :'q1')) ->> 'ok' as revoked \gset
select ok(pg_temp.names_both(pg_temp.last_row('QRCODE', :'q1', 'QR_REVOKED')), 'revoking a QR names both routes (D-107)');
select ok(pg_temp.last_row('QRCODE', :'q1', 'QR_REVOKED') -> 'changeLines' ? 'Trạng thái: Đang hoạt động → Đã thu hồi',
  'the status change uses display names');
select is(pg_temp.last_row('QRCODE', :'q1', 'QR_REVOKED') ->> 'reason', 'Cây đổ', 'the reason is kept');
select api.close_checkpoint(:'c1', 'Sạt lở', pg_temp.expected('CHECKPOINT', :'c1')) ->> 'ok' as closed \gset
select ok(pg_temp.names_both(pg_temp.last_row('CHECKPOINT', :'c1', 'CHECKPOINT_CLOSED')), 'closing a checkpoint names both routes');
select is(pg_temp.last_row('ROUTE', :'ra', 'ROUTE_AUTO_CLOSED') -> 'changeLines',
  '["Trạng thái: Đang hoạt động → Tạm đóng", "Tự đóng vì không còn điểm dừng hoạt động"]', 'an automatic closure says why');
select pg_temp.as_user(1);
select api.reopen_checkpoint(:'c1', 'Đã kiểm tra', pg_temp.expected('CHECKPOINT', :'c1')) ->> 'ok' as reopened \gset
select ok(pg_temp.names_both(pg_temp.last_row('CHECKPOINT', :'c1', 'CHECKPOINT_REOPENED')), 'reopening a checkpoint names both routes');
select api.reopen_route(:'ra', 'Đã kiểm tra', pg_temp.expected('ROUTE', :'ra')) ->> 'ok' as ra_reopened \gset
select api.reopen_route(:'rb', 'Đã kiểm tra', pg_temp.expected('ROUTE', :'rb')) ->> 'ok' as rb_reopened \gset

-- ---- C-06 discard a pending draft (BR-M03-F06, F10) ---------------------------------------------------------------
select pg_temp.as_user(2);
select pg_temp.edit_route(:'ra', '{"distanceKm": 8}') ->> 'ok' as edited_again \gset
select (app.draft_of('ROUTE', :'ra')).revision_number as draft_no \gset
select is(api.discard_draft('ROUTE', :'ra', '{"entity": 1}') ->> 'reason', 'STALE', 'discarding with an old revision is STALE, the draft stays');
select (select count(*) from app.revisions where subject_id = :'ra')::int as revisions_before \gset
select is(api.discard_draft('ROUTE', :'ra', pg_temp.expected('ROUTE', :'ra')), app.cr_ok('MSG-SAVED'), 'the pending draft is discarded');
select is((select status from app.revisions where subject_id = :'ra' and revision_number = :draft_no), 'DA_BO', '... it becomes DA_BO');
select is((select count(*)::int from app.revisions where subject_id = :'ra'), :revisions_before, '... nothing is deleted (BR-M03-G08 spirit)');
select is((select distance_km from api.published_routes where route_id = :'ra'), 6::numeric, 'the published route is unchanged');
select ok(not exists (select 1 from jsonb_array_elements(api.get_item_history('ROUTE', :'ra') -> 'publishedRevisions') r
  where (r ->> 'revisionNumber')::int = :draft_no), 'the history does not list a discarded draft');
select ok(pg_temp.last_row('ROUTE', :'ra', 'DRAFT_DISCARDED') -> 'changeLines' ? ('Bản ' || :draft_no || ': Bản nháp → Đã bỏ'), 'the line says which draft');
select is(api.discard_draft('ROUTE', :'ra', pg_temp.expected('ROUTE', :'ra')) ->> 'reason', 'FAILED', 'no pending draft → FAILED');

-- ---- C-08 restore (BR-M03-F07; SC-M03-021) ------------------------------------------------------------------------
select is(api.restore_revision('ROUTE', :'ra', 1) -> 'data', jsonb_build_object('revisionNumber', :draft_no + 1, 'basedOnRevisionNumber', 1),
  'restoring revision 1 creates a draft based on it');
select ok((select content = (select content from app.revisions where subject_id = :'ra' and revision_number = 1)
  from app.revisions where subject_id = :'ra' and status = 'NHAP'), '... carrying the content of revision 1');
select is((select distance_km from api.published_routes where route_id = :'ra'), 6::numeric, '... the published route is unchanged');
select is(api.restore_revision('ROUTE', :'ra', 1), app.cr_blocked('MSG-DRAFT-EXISTS'), 'a second restore → MSG-DRAFT-EXISTS');
select is(api.restore_revision('ROUTE', :'ra', 2) ->> 'reason', 'FAILED', 'the revision being published cannot be restored');
select is(api.restore_revision('ROUTE', :'ra', 99) ->> 'reason', 'FAILED', 'an unknown revision number → FAILED');
select api.discard_draft('ROUTE', :'ra', pg_temp.expected('ROUTE', :'ra')) ->> 'ok' as discarded_restore \gset
-- a limit tightened since revision 1 was published (simulated by a longer name in the old content)
set local session_replication_role = replica;
update app.revisions set content = jsonb_set(content, '{name,vi}', to_jsonb(repeat('x', 150))) where subject_id = :'ra' and revision_number = 1;
set local session_replication_role = origin;
select pg_temp.audits() as audits_before_restore \gset
select is(api.restore_revision('ROUTE', :'ra', 1), app.cr_blocked('MSG-RESTORE-BLOCKED', '{"danh sách chỗ cần sửa": "Tên tuyến (tiếng Việt)"}'),
  'old content that breaks a current limit → MSG-RESTORE-BLOCKED naming the place to fix');
select ok((app.draft_of('ROUTE', :'ra')).revision_id is null, '... and no draft is created');
select is(pg_temp.audits(), :audits_before_restore + 1, '... with exactly one audit line');
select api.save_checkpoint_draft(:'c1', pg_temp.expected('CHECKPOINT', :'c1'),
  '{"checkpointName": {"vi": "Hang tạm", "en": "Temp cave"}, "connectivityMode": "OFFLINE_REQUIRED"}') ->> 'ok' as c1_draft \gset
select api.discard_draft('CHECKPOINT', :'c1', pg_temp.expected('CHECKPOINT', :'c1')) ->> 'ok' as c1_discarded \gset
select is(api.restore_revision('CHECKPOINT', :'c1', 1) ->> 'ok', 'true', 'restoring a checkpoint revision');
select is((app.draft_of('CHECKPOINT', :'c1')).content #>> '{checkpointName,vi}', 'Hang Con Moong', '... the draft carries the old name');

-- ---- Q-11 system-wide audit log (BR-M03-A03, F09) -----------------------------------------------------------------
select throws_ok($$select api.list_audit_log()$$, '42501', null, 'Content Staff cannot read the audit log');
select pg_temp.as_user(1);
select api.list_audit_log() as log0 \gset
select ok((select bool_and(a.v >= b.v) from (select r ->> 'occurredAt' as v, n from jsonb_array_elements(:'log0'::jsonb -> 'rows') with ordinality x(r, n)) a
  join (select r ->> 'occurredAt' as v, n from jsonb_array_elements(:'log0'::jsonb -> 'rows') with ordinality x(r, n)) b on b.n = a.n + 1),
  'the Reviewer sees the newest first');
select ok((select bool_and(r ? 'subjectId') from jsonb_array_elements(:'log0'::jsonb -> 'rows') r where r ->> 'subjectType' = 'ROUTE'),
  'Q-11 rows carry the item id, to build the link only');
select is((select count(*)::int from jsonb_array_elements(api.list_audit_log(p_actor_email => 'STAFF@example.test') -> 'rows') r
           where r ->> 'actorEmail' <> 'staff@example.test'), 0, 'filter by person (case-insensitive)');
select is((select count(*)::int from jsonb_array_elements(api.list_audit_log(p_subject_type => 'QRCODE') -> 'rows') r
           where r ->> 'subjectType' <> 'QRCODE'), 0, 'filter by item type');
select is(api.list_audit_log(p_from => '2999-01-01T00:00:00Z') -> 'rows', '[]', 'filter by time');
select count(api.record_reprint(:'q2')) from generate_series(1, 60);
select ok((select (api.list_audit_log(0) ->> 'hasMore')::boolean and jsonb_array_length(api.list_audit_log(0) -> 'rows') = 50
  and (api.list_audit_log(1) ->> 'page')::int = 1), 'pages of 50 rows with hasMore');
select is((select count(distinct r ->> 'auditId')::int from (select jsonb_array_elements(api.list_audit_log(0) -> 'rows') r
           union all select jsonb_array_elements(api.list_audit_log(1) -> 'rows')) x),
  (select jsonb_array_length(api.list_audit_log(0) -> 'rows') + jsonb_array_length(api.list_audit_log(1) -> 'rows')), 'two pages never repeat a row');

-- ---- lines never show JSON, codes or ids (BR-M03-L10, L11) -------------------------------------------------------
select is((select array_agg(l) from app.audit_records a cross join lateral jsonb_array_elements_text(app.audit_change_lines(a)) l
  where l ~ '[{}\[\]]' or l ~* '[0-9a-f]{8}-[0-9a-f]{4}-' or l ~ '(HOAT_DONG|TAM_DONG|THU_HOI|PHAT_HANH|DA_BO|NHAP|REVIEWER|CONTENT_STAFF)'), null,
  'no change line shows JSON, an id or a code');
select api.change_account_role('staff@example.test', 'REVIEWER', '{"entity": 2}') ->> 'ok' as promoted \gset
select is((select app.audit_change_lines(a) from app.audit_records a where action = 'ACCOUNT_ROLE_CHANGED' and outcome = 'SUCCESS'),
  '["Vai trò: Nhân viên nội dung → Quản lý"]', 'account changes read in plain words');

select * from finish();
rollback;
