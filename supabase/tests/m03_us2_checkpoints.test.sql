-- pgTAP — US2 checkpoints, visit points, media (tasks M03 T182; admin-command C-02, C-03, C-04, C-07, C-16, C-17,
-- Q-05–Q-07; BR-M03-B01–B03, D02, D03, D09, D11, E02, E04, E05, E09, E11, E14, E17, F06, F08, F11).
-- Publication (CHECKPOINT_FIRST_PUBLICATION, readable images of D04 condition 4) is tested with publish_unit (T185);
-- here a published checkpoint is set up directly in SQL.
begin;
create extension if not exists pgtap with schema extensions;
select plan(78);

insert into auth.sessions (id, user_id) values
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004');
create function pg_temp.as_user(n integer) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', '00000000-0000-4000-8000-00000000000' || n, 'session_id', '10000000-0000-4000-8000-00000000000' || n)::text, true);
$$;
create function pg_temp.audits() returns integer language sql as $$ select count(*)::int from app.audit_records $$;
-- an uploaded object as Storage records it (media-storage §1 step 1)
create function pg_temp.object(p_path text, p_mime text, p_size integer) returns text language sql as $$
  insert into storage.objects (bucket_id, name, metadata)
  values ('quest-media', p_path, jsonb_build_object('mimetype', p_mime, 'size', p_size)) returning name $$;
create function pg_temp.image(p_checkpoint text, p_name text) returns text language sql as $$
  select api.register_media('CHECKPOINT', p_checkpoint, 'QR_MEDIA', 'IMAGE',
    pg_temp.object('uploads/CHECKPOINT/' || p_checkpoint || '/' || p_name, 'image/jpeg', 2048)) -> 'data' ->> 'mediaId' $$;
create function pg_temp.intro() returns text language sql as $$ select rpad('Giới thiệu cho du khách', 30, '.') $$;

-- ---- grants (admin-command §7) ------------------------------------------------------------------------------------
select ok(bool_and(has_function_privilege('authenticated', f, 'EXECUTE') and not has_function_privilege('anon', f, 'EXECUTE')),
  'every US2 function is for authenticated only')
from unnest(array['api.save_checkpoint_draft(text, jsonb, jsonb, text)', 'api.save_visit_point_draft(text, text, jsonb, jsonb, text, jsonb)',
  'api.register_media(text, text, text, text, text, text)', 'api.discard_unpublished(text, text, text, jsonb)',
  'api.revoke_visit_point(text, text, jsonb)', 'api.record_reprint(text)', 'api.list_checkpoints(text, text)',
  'api.get_checkpoint_editor(text)', 'api.get_visit_point_editor(text)']) as f;

-- ---- refused callers (SC-M03-009) -----------------------------------------------------------------------------------
select pg_temp.as_user(4);
select is(api.save_checkpoint_draft(p_content => '{}') ->> 'reason', 'FORBIDDEN', 'an identity without an account is FORBIDDEN');
select throws_ok($$select api.list_checkpoints()$$, '42501', null, '... and cannot read the library');

-- ---- C-02 (BR-M03-D01–D03) ---------------------------------------------------------------------------------------
select pg_temp.as_user(2);
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"}}') -> 'data' ->> 'checkpointId' as c1 \gset
select ok(:'c1' <> '', 'the first save creates the checkpoint');
select is(api.get_checkpoint_editor(:'c1') ->> 'status', 'NHAP', '... as a draft (NHAP)');
select is(api.get_checkpoint_editor(:'c1') #>> '{draft,revisionNumber}', '1', '... with draft revision 1');
select ok(not (api.get_checkpoint_editor(:'c1') #> '{draft,content}' ? 'connectivityMode'), 'the mode has no default');
select is((api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "  hang con MOONG "}}') -> 'issues' -> 0) - 'targetItemId',
  app.issue('BLOCKS_SAVE', 'CHECKPOINT', 'x', 'checkpointName.vi', 'MSG-CHECKPOINT-NAME-TAKEN', '{"tên": "hang con MOONG"}') - 'targetItemId',
  'a name taken ignoring case and spaces → MSG-CHECKPOINT-NAME-TAKEN on checkpointName.vi');
select is(api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Cây chò"}, "connectivityMode": "ONLINE_AVAILABLE"}') ->> 'messageKey',
  'MSG-ONLINE-NOT-VERIFIED', 'ONLINE_AVAILABLE without the field-verification tick');
select is(api.save_checkpoint_draft(p_content => jsonb_build_object('checkpointName', jsonb_build_object('vi', repeat('a', 101)))) -> 'issues' -> 0 ->> 'message',
  'Tên điểm dừng (tiếng Việt) dài quá 100 ký tự (hiện có 101). Hãy rút gọn.', 'a too long name: the catalog sentence with label and numbers');

select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Rừng chò", "en": "Cho forest"}, "connectivityMode": "ONLINE_AVAILABLE", "fieldVerificationConfirmed": true}') -> 'data' ->> 'checkpointId' as c2 \gset
select ok((select content ->> 'fieldVerifiedByUserId' = '00000000-0000-4000-8000-000000000002' and content ? 'fieldVerifiedAt'
  from app.revisions where subject_id = :'c2'), 'M03 records who confirmed the field verification and when');

-- STALE (BR-M03-F06)
select api.get_checkpoint_editor(:'c1') as ed1 \gset
select is(api.save_checkpoint_draft(:'c1', jsonb_build_object('entity', (:'ed1'::jsonb ->> 'concurrencyRevision')::int,
  'draft', (:'ed1'::jsonb #>> '{draft,concurrencyRevision}')::int),
  '{"checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"}, "connectivityMode": "OFFLINE_REQUIRED"}') ->> 'ok', 'true',
  'saving with the current revisions succeeds');
select is(api.save_checkpoint_draft(:'c1', jsonb_build_object('entity', (:'ed1'::jsonb ->> 'concurrencyRevision')::int,
  'draft', (:'ed1'::jsonb #>> '{draft,concurrencyRevision}')::int), '{"checkpointName": {"vi": "Ghi đè"}}') #>> '{stale,editorEmail}',
  'staff@example.test', 'an old revision is STALE and names the last editor');
select is(api.get_checkpoint_editor(:'c1') #>> '{draft,content,checkpointName,vi}', 'Hang Con Moong', '... and nothing was overwritten');
select is(api.save_checkpoint_draft(:'c1', jsonb_build_object('entity', (api.get_checkpoint_editor(:'c1') ->> 'concurrencyRevision')::int),
  '{"checkpointName": {"vi": "X"}}') ->> 'reason', 'STALE', 'an existing draft not submitted means someone else created it → STALE');

-- ---- C-03 (BR-M03-B01–B03, E02, E04, E15) ------------------------------------------------------------------------
select api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Vườn thực vật"}}') -> 'data' ->> 'checkpointId' as c3 \gset
select is(api.save_visit_point_draft(:'c3', p_content => '{"objectName": {"vi": "Cây chò"}}') ->> 'messageKey', 'MSG-MODE-REQUIRED-FIRST',
  'no visit point before the checkpoint has a saved mode');
select is((select count(*)::int from app.qr_codes where checkpoint_id = :'c3'), 0, '... and no QR was created');

select pg_temp.image(:'c1', 'a') as img1 \gset
select api.save_visit_point_draft(:'c1', p_content => jsonb_build_object(
  'objectName', '{"vi": "Cây chò", "en": "Cho tree"}'::jsonb,
  'introductionText', jsonb_build_object('vi', pg_temp.intro(), 'en', pg_temp.intro()),
  'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', :'img1'))),
  p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', :'img1', 'usageRightsConfirmed', true))) as vp1 \gset
select is(:'vp1'::jsonb - 'data', '{"ok": true, "messageKey": "MSG-QR-CREATED"}', 'the first save creates the visit point (MSG-QR-CREATED)');
select ok((:'vp1'::jsonb #>> '{data,qrIdentifier}') ~ '^[A-Za-z0-9]{16,}$', 'identifier ≥ 16 [A-Za-z0-9] (BR-M03-B02)');
select is((:'vp1'::jsonb -> 'data') - 'qrIdentifier', '{"created": true, "revisionNumber": 1, "concurrencyRevision": 1}',
  'QR, identifier and draft revision 1 are created together');
select :'vp1'::jsonb #>> '{data,qrIdentifier}' as q1 \gset
select ok((select usage_rights_confirmed and usage_rights_confirmed_by_user_id = '00000000-0000-4000-8000-000000000002'
  from app.media where media_id = :'img1'::uuid), 'the rights tick is stored per file in the same save, with who and when');
select is(api.get_visit_point_editor(:'q1') -> 'readiness', '{"ready": true, "missing": []}', 'a complete visit point is ready');
select is(api.get_visit_point_editor(:'q1') - '{qrIdentifier,checkpointId,concurrencyRevision,draft,media,readiness,issues}'::text[],
  jsonb_build_object('checkpointStatus', 'NHAP', 'status', 'NHAP', 'creationOrder', 1, 'checkpointName', 'Hang Con Moong',
    'checkpointMode', 'OFFLINE_REQUIRED'), 'Q-07 header fields');
select is(jsonb_array_length(api.get_visit_point_editor(:'q1') -> 'media'), 1, 'Q-07 lists the media of the draft');
select is(api.save_visit_point_draft(:'c1', :'q1', jsonb_build_object('entity', 1, 'draft', 1), jsonb_build_object(
  'objectName', '{"vi": "Cây chò", "en": "Cho tree"}'::jsonb, 'introductionText', jsonb_build_object('vi', pg_temp.intro(), 'en', pg_temp.intro()),
  'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', :'img1'))),
  p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', :'img1', 'usageRightsConfirmed', true))) -> 'data' ->> 'created',
  'false', 'saving again keeps the same visit point (created: false)');

-- audio/video only with ONLINE_AVAILABLE (BR-M03-E04)
select api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'AUDIO',
  pg_temp.object('uploads/CHECKPOINT/' || :'c1' || '/audio', 'audio/mpeg', 4096)) -> 'data' ->> 'mediaId' as aud1 \gset
select ok(:'aud1' <> '', 'audio can be registered before choosing its spoken language (DAC-M03-059, D-95)');
select is(api.save_visit_point_draft(:'c1', p_content => jsonb_build_object('mediaItems', jsonb_build_array(jsonb_build_object('mediaId', :'aud1'))))
  -> 'issues' -> 0 ->> 'messageKey', 'MSG-AV-OFFLINE', 'audio at an OFFLINE_REQUIRED checkpoint → MSG-AV-OFFLINE');

-- publication gaps on stored data (BR-M03-E05, E17; DAC-M03-052)
select api.register_media('CHECKPOINT', :'c2', 'QR_MEDIA', 'AUDIO',
  pg_temp.object('uploads/CHECKPOINT/' || :'c2' || '/audio', 'audio/mpeg', 4096)) -> 'data' ->> 'mediaId' as aud2 \gset
select api.save_visit_point_draft(:'c2', p_content => jsonb_build_object('objectName', '{"vi": "Tiếng chim"}'::jsonb,
  'introductionText', '{"vi": "ngắn", "en": "short"}'::jsonb,
  'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', :'aud2')))) -> 'data' ->> 'qrIdentifier' as q2 \gset
select is((select jsonb_agg(i ->> 'messageKey' || ' ' || (i ->> 'targetFieldKey')) from jsonb_array_elements(api.get_visit_point_editor(:'q2') -> 'issues') i),
  '["MSG-MISSING-LANGUAGE objectName.en", "MSG-MISSING-FIELD introductionText.vi", "MSG-MISSING-FIELD introductionText.en", "MSG-RIGHTS-NOT-CONFIRMED usageRights.0", "MSG-AV-LANGUAGE-MISSING spokenLanguage.0"]',
  'Q-07 issues: missing language, short introduction, rights, spoken language');
select is(api.get_visit_point_editor(:'q2') -> 'issues' -> 3 ->> 'message',
  'Hãy xác nhận quyền sử dụng cho "Tiếng chim – âm thanh/video 1" trước khi xuất bản.', 'a file is named by visit point and position (D-3)');
select is(api.get_visit_point_editor(:'q2') #> '{readiness,missing}',
  '["Tên đối tượng (tiếng Anh)", "Giới thiệu (tiếng Việt)", "Giới thiệu (tiếng Anh)", "Xác nhận quyền sử dụng", "Ngôn ngữ của tệp"]',
  'readiness lists the missing field labels once each');
select is(api.save_checkpoint_draft(:'c2', jsonb_build_object('entity', (api.get_checkpoint_editor(:'c2') ->> 'concurrencyRevision')::int,
  'draft', (api.get_checkpoint_editor(:'c2') #>> '{draft,concurrencyRevision}')::int),
  '{"checkpointName": {"vi": "Rừng chò", "en": "Cho forest"}, "connectivityMode": "OFFLINE_REQUIRED"}') -> 'issues' -> 0 ->> 'message',
  'Chưa đổi được sang "Cần tải trước" vì còn âm thanh/video ở: Tiếng chim. Hãy xóa chúng trước.', 'MSG-MODE-HAS-AV names the visit point');

-- all-or-nothing (BR-M03-F11): a save that fails leaves files, QR and revision untouched
select pg_temp.image(:'c2', 'b') as img2 \gset
select pg_temp.audits() as before_fail \gset
select is(api.save_visit_point_draft(:'c2', p_content => jsonb_build_object('mediaItems',
  jsonb_build_array(jsonb_build_object('mediaId', :'img2'), jsonb_build_object('mediaId', :'img2'))),
  p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', :'img2', 'usageRightsConfirmed', true))) ->> 'reason', 'FAILED',
  'invalid content (a file twice) fails the whole save');
select ok((select not usage_rights_confirmed from app.media where media_id = :'img2'::uuid), '... the rights tick was rolled back');
select is((select count(*)::int from app.qr_codes where checkpoint_id = :'c2'), 1, '... and no visit point was created');
select is(pg_temp.audits(), :before_fail + 1, '... with exactly one FAILURE audit line');
select is(api.save_visit_point_draft(:'c2', p_content => jsonb_build_object('mediaItems', jsonb_build_array(jsonb_build_object('mediaId', :'img1'))))
  ->> 'reason', 'FAILED', 'media of another checkpoint is refused (DAC-M03-053)');
select is(api.save_visit_point_draft(:'c2', :'q1', jsonb_build_object('entity', 2, 'draft', 2), '{}') ->> 'reason', 'FAILED',
  'a visit point never moves to another checkpoint (BR-M03-E12)');
select is((select checkpoint_id from app.qr_codes where qr_identifier = :'q1'), :'c1', '... it stays where it was');

-- ---- C-04 register_media (media-storage §1; DAC-M03-055–058) -----------------------------------------------------
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'IMAGE', 'uploads/CHECKPOINT/' || :'c1' || '/missing') ->> 'reason', 'FAILED',
  'an object that does not exist → FAILED');
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'IMAGE', pg_temp.object('uploads/CHECKPOINT/' || :'c2' || '/x', 'image/png', 10)) ->> 'reason',
  'FAILED', 'an object outside the owner''s folder → FAILED');
select is(api.register_media('CHECKPOINT', :'c1', 'ROUTE_MAP', 'IMAGE', pg_temp.object('uploads/CHECKPOINT/' || :'c1' || '/m', 'image/png', 10)) ->> 'reason',
  'FAILED', 'a route usage for a checkpoint → FAILED');
select is(api.register_media('CHECKPOINT', 'missing', 'QR_MEDIA', 'IMAGE', 'uploads/CHECKPOINT/missing/x') ->> 'reason', 'FAILED',
  'an owner that does not exist → FAILED');
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'IMAGE', 'uploads/CHECKPOINT/' || :'c1' || '/a') ->> 'reason', 'FAILED',
  'an object is registered once');
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'IMAGE', pg_temp.object('uploads/CHECKPOINT/' || :'c1' || '/g', 'image/gif', 10)) -> 'issues' -> 0,
  app.issue('BLOCKS_SAVE', 'CHECKPOINT', :'c1', 'images', 'MSG-FILE-TYPE',
    '{"tên tệp": "tệp vừa tải lên", "danh sách định dạng": "JPEG, PNG, WebP"}', 'Ảnh của điểm tham quan'),
  'an unsupported MIME type → MSG-FILE-TYPE on the editor field');
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'AUDIO', pg_temp.object('uploads/CHECKPOINT/' || :'c1' || '/mm', 'image/png', 10)) ->> 'messageKey',
  'MSG-FILE-TYPE', 'a MIME type that does not match the declared type → MSG-FILE-TYPE');
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'IMAGE', pg_temp.object('uploads/CHECKPOINT/' || :'c1' || '/big', 'image/png', 2621440)) -> 'issues' -> 0 ->> 'message',
  'Ảnh "tệp vừa tải lên" nặng 2,5 MB, tối đa 2 MB. Hãy nén nhỏ hơn rồi tải lại.', 'an image above IMAGE_MAX_MB → MSG-FILE-TOO-BIG');
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'IMAGE', pg_temp.object('uploads/CHECKPOINT/' || :'c1' || '/max', 'image/png', 2097152)) ->> 'messageKey',
  'MSG-UPLOADED-NOT-SAVED', 'an image of exactly IMAGE_MAX_MB is registered');
select is(api.register_media('CHECKPOINT', :'c1', 'QR_MEDIA', 'IMAGE', pg_temp.object('uploads/CHECKPOINT/' || :'c1' || '/lang', 'image/png', 10), 'vi') ->> 'reason',
  'FAILED', 'an image never has a spoken language');
select ok((select mime_type = 'image/png' and file_size_bytes = 2097152 and source_ref like 'uploads/CHECKPOINT/%/max'
  from app.media where source_ref like '%/max'), 'MIME type and size come from Storage, not from the caller');

-- ---- MSG-LIMIT-QR and C-07 for a visit point (BR-M03-E02, E10) ---------------------------------------------------
select api.save_checkpoint_draft(:'c3', jsonb_build_object('entity', 1, 'draft', 1),
  '{"checkpointName": {"vi": "Vườn thực vật"}, "connectivityMode": "OFFLINE_REQUIRED"}') ->> 'ok' as c3_mode \gset
select is((select count(*)::int from generate_series(1, 20) n
  where api.save_visit_point_draft(:'c3', p_content => '{}') ->> 'ok' = 'true'), 20, 'CHECKPOINT_QR_MAX_ITEMS visit points can be created');
select is(api.save_visit_point_draft(:'c3', p_content => '{}') -> 'values',
  '{"tên": "Vườn thực vật", "tối đa": 20}', 'one more → BLOCKED MSG-LIMIT-QR with the checkpoint name');
select (select qr_identifier from app.qr_codes where checkpoint_id = :'c3' order by created_at limit 1) as q3first \gset
select is(api.discard_unpublished('QRCODE', :'q3first', p_expected => '{"entity": 1}') -> 'data', '{"status": "THU_HOI", "concurrencyRevision": 2}',
  'a never-published visit point is discarded without a reason');
select is(api.save_visit_point_draft(:'c3', p_content => '{}') ->> 'ok', 'true', 'then one can be added again');
select is(api.get_checkpoint_editor(:'c3') #>> '{visitPoints,20,creationOrder}', '21', 'creation order counts the discarded one too');
select is((api.get_checkpoint_editor(:'c3') #> '{visitPoints,0}') - 'qrIdentifier' - 'readiness',
  '{"status": "THU_HOI", "creationOrder": 1}', 'an unnamed visit point has no name key; the UI shows "chưa đặt tên {số}"');

-- ---- C-07 for a checkpoint (BR-M03-D09) -------------------------------------------------------------------------
select is(api.discard_unpublished('CHECKPOINT', :'c3', p_expected => jsonb_build_object('entity', (api.get_checkpoint_editor(:'c3') ->> 'concurrencyRevision')::int)),
  app.cr_blocked('MSG-MISSING-FIELD', '{"tên ô": "Lý do"}'), 'discarding a checkpoint needs a reason');
select is(api.discard_unpublished('CHECKPOINT', :'c3', 'Tạo nhầm', jsonb_build_object('entity', (api.get_checkpoint_editor(:'c3') ->> 'concurrencyRevision')::int))
  #>> '{data,status}', 'LUU_TRU', 'with a reason the checkpoint is archived');
select is((select count(*)::int from app.qr_codes where checkpoint_id = :'c3' and status <> 'THU_HOI'), 0, '... and its draft visit points are revoked');
select is(api.save_checkpoint_draft(p_content => '{"checkpointName": {"vi": "Vườn thực vật"}}') ->> 'ok', 'true',
  'the name of an archived checkpoint can be used again');
select is(api.save_visit_point_draft(:'c3', p_content => '{}') ->> 'reason', 'FAILED', 'an archived checkpoint takes no visit point');

-- ---- published checkpoint, set up directly (publish_unit comes with US3) -----------------------------------------
select pg_temp.image(:'c1', 'second') as img3 \gset
select api.save_visit_point_draft(:'c1', p_content => jsonb_build_object(
  'objectName', '{"vi": "Cây lim", "en": "Ironwood"}'::jsonb, 'introductionText', jsonb_build_object('vi', pg_temp.intro(), 'en', pg_temp.intro()),
  'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', :'img3'))),
  p_media_settings => jsonb_build_array(jsonb_build_object('mediaId', :'img3', 'usageRightsConfirmed', true))) #>> '{data,qrIdentifier}' as q4 \gset
update app.revisions set status = 'PHAT_HANH', published_by_user_id = last_edited_by_user_id, published_at = now(), self_published = true,
  concurrency_revision = concurrency_revision + 1
where status = 'NHAP' and subject_id in (:'c1', :'q1');
update app.checkpoints set status = 'HOAT_DONG', concurrency_revision = concurrency_revision + 1 where checkpoint_id = :'c1';
update app.qr_codes set status = 'HOAT_DONG', concurrency_revision = concurrency_revision + 1 where qr_identifier = :'q1';

select is(api.discard_unpublished('CHECKPOINT', :'c1', 'Thử', jsonb_build_object('entity', (api.get_checkpoint_editor(:'c1') ->> 'concurrencyRevision')::int))
  ->> 'reason', 'FAILED', 'a published checkpoint cannot be discarded');
select is((api.list_checkpoints() -> 0) - 'checkpointId', jsonb_build_object('name', 'Hang Con Moong', 'status', 'HOAT_DONG',
  'connectivityMode', 'OFFLINE_REQUIRED', 'visitPointCount', 2, 'routesUsing', '[]'::jsonb,
  'readiness', '{"ready": true, "missing": []}'::jsonb, 'hasPendingDraft', false), 'Q-05 row: name, status, mode, count, readiness');
select is((select jsonb_agg(r ->> 'name') from jsonb_array_elements(api.list_checkpoints('  VƯỜN ')) r), '["Vườn thực vật", "Vườn thực vật"]',
  'Q-05 search ignores case and spaces');
select is(jsonb_array_length(api.list_checkpoints(p_status => 'LUU_TRU')), 1, 'Q-05 filters by status');

-- location note only: no pending draft for a published checkpoint (BR-M03-D11)
select is(api.save_checkpoint_draft(:'c1', jsonb_build_object('entity', (api.get_checkpoint_editor(:'c1') ->> 'concurrencyRevision')::int),
  api.get_checkpoint_editor(:'c1') #> '{published,content}', 'Cạnh nhà chờ số 2') ->> 'ok', 'true', 'the location note is saved');
select ok((select e ->> 'locationNote' = 'Cạnh nhà chờ số 2' and not e ? 'draft' from (select api.get_checkpoint_editor(:'c1') e) x),
  '... without creating a pending draft');

-- ---- C-16 revoke, C-17 reprint (BR-M03-E07, E09, E11) -----------------------------------------------------------
select is(api.revoke_visit_point(:'q4', 'Cây đã đổ', '{"entity": 1}') ->> 'reason', 'FAILED', 'only an active visit point is revoked');
select is(api.revoke_visit_point(:'q1', 'Cây đã đổ', jsonb_build_object('entity', (api.get_visit_point_editor(:'q1') ->> 'concurrencyRevision')::int)),
  app.cr_blocked('MSG-LAST-QR'), 'the last active visit point of an active checkpoint → MSG-LAST-QR');
update app.revisions set status = 'PHAT_HANH', published_by_user_id = last_edited_by_user_id, published_at = now(), self_published = true,
  concurrency_revision = concurrency_revision + 1 where status = 'NHAP' and subject_id = :'q4';
update app.qr_codes set status = 'HOAT_DONG', concurrency_revision = concurrency_revision + 1 where qr_identifier = :'q4';
select is(api.revoke_visit_point(:'q1', '   ', jsonb_build_object('entity', (api.get_visit_point_editor(:'q1') ->> 'concurrencyRevision')::int)) ->> 'messageKey',
  'MSG-MISSING-FIELD', 'revoking needs a reason');
select is(api.revoke_visit_point(:'q1', 'Cây đã đổ', jsonb_build_object('entity', (api.get_visit_point_editor(:'q1') ->> 'concurrencyRevision')::int)) #>> '{data,status}',
  'THU_HOI', 'with another active visit point it is revoked');
select ok((select reason = 'Cây đã đổ' and before_state = '{"status": "HOAT_DONG"}' from app.audit_records where action = 'QR_REVOKED' and outcome = 'SUCCESS'),
  'the audit line keeps the reason and the status change');
select api.get_visit_point_editor(:'q4') as before_reprint \gset
select pg_temp.audits() as before_reprint_audits \gset
select is(api.record_reprint(:'q4'), app.cr_ok('MSG-SAVED'), 'a reprint is recorded');
select is(pg_temp.audits(), :before_reprint_audits + 1, '... as one audit line');
select is(api.get_visit_point_editor(:'q4'), :'before_reprint'::jsonb, '... identifier and content unchanged');
select is(api.record_reprint(:'q1') ->> 'reason', 'FAILED', 'a revoked visit point is not reprinted');

-- ---- Q-06 -----------------------------------------------------------------------------------------------------------
select is(api.get_checkpoint_editor(:'c1') - '{checkpointId,concurrencyRevision,published,visitPoints}'::text[],
  '{"status": "HOAT_DONG", "routesUsing": [], "issues": [], "locationNote": "Cạnh nhà chờ số 2"}', 'Q-06 header, routes and issues');
select is((select jsonb_agg(v - 'qrIdentifier') from jsonb_array_elements(api.get_checkpoint_editor(:'c1') -> 'visitPoints') v),
  '[{"name": "Cây chò", "status": "THU_HOI", "creationOrder": 1, "readiness": {"ready": true, "missing": []}},
    {"name": "Cây lim", "status": "HOAT_DONG", "creationOrder": 2, "readiness": {"ready": true, "missing": []}}]',
  'Q-06 visit points in creation order with name, status, readiness');
select throws_ok($$select api.get_checkpoint_editor('missing')$$, 'P0002', null, 'an unknown checkpoint is an error, not an empty editor');

select * from finish();
rollback;
