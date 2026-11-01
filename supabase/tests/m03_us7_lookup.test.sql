-- pgTAP — US7 live QR lookup (tasks M03 T191; live-qr-lookup-contract §1–§4; BR-M03-I01–I04, E01, E04, X04;
-- SC-M03-012, 017, 023). The 23 cases are those of src/shared/contracts/liveQrLookup.cases.ts, built with
-- test_support.lookup_world (seed.sql); the E2E e2e/m03/lookup.local.spec.ts runs the TypeScript table itself.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

create function pg_temp.content(p_qr text, p_mode text default 'ONLINE_AVAILABLE') returns jsonb language sql as $$
  select case p_qr
    when 'Qa1b2c3d4e5f6g7h8' then jsonb_build_object('qrIdentifier', p_qr, 'checkpointId', 'Ck1m2n3p4q5r6s7t8',
      'checkpointName', '{"vi": "Hang Con Moong", "en": "Con Moong Cave"}'::jsonb, 'connectivityMode', p_mode,
      'objectName', '{"vi": "Cây chò ngàn năm", "en": "Thousand-year chò tree"}'::jsonb,
      'localizedContent', '{"vi": {"introductionText": "Cây chò cao hơn bốn mươi mét, thân thẳng, tán rộng."},
                            "en": {"introductionText": "The chò tree is over forty metres tall with a straight trunk."}}'::jsonb,
      'staticImages', '["checkpoints/Ck1m2n3p4q5r6s7t8/cho-1.jpg"]'::jsonb,
      'mediaResources', case when p_mode = 'OFFLINE_REQUIRED' then '[]'::jsonb else
        '[{"type": "AUDIO", "sourceRef": "checkpoints/Ck1m2n3p4q5r6s7t8/cho-vi.mp3", "spokenLanguage": "vi"},
          {"type": "VIDEO", "sourceRef": "checkpoints/Ck1m2n3p4q5r6s7t8/cho.mp4", "spokenLanguage": "NONE"}]'::jsonb end)
    else jsonb_build_object('qrIdentifier', p_qr, 'checkpointId', 'Ck1m2n3p4q5r6s7t8',
      'checkpointName', '{"vi": "Hang Con Moong", "en": "Con Moong Cave"}'::jsonb, 'connectivityMode', p_mode,
      'objectName', '{"vi": "Bộ xương người tiền sử", "en": "Prehistoric skeleton"}'::jsonb,
      'localizedContent', '{"vi": {"introductionText": "Di cốt được tìm thấy trong lớp đất sâu của hang."},
                            "en": {"introductionText": "The remains were found in a deep layer of the cave floor."}}'::jsonb,
      'staticImages', '["checkpoints/Ck1m2n3p4q5r6s7t8/xuong-1.jpg", "checkpoints/Ck1m2n3p4q5r6s7t8/xuong-2.jpg"]'::jsonb,
      'mediaResources', '[{"type": "AUDIO", "sourceRef": "checkpoints/Ck1m2n3p4q5r6s7t8/xuong-en.mp3", "spokenLanguage": "en"}]'::jsonb)
  end $$;
-- one case: build its world, then call as a visitor (anon)
create function pg_temp.lookup(p_identifier text, p_qr text, p_checkpoint text, p_mode text, p_route text, p_lists boolean default true)
returns jsonb language plpgsql as $$
declare v_result jsonb;
begin
  perform test_support.lookup_world(p_qr, p_checkpoint, p_mode, coalesce(p_route, 'HOAT_DONG'));
  set local role anon;
  v_result := api.lookup_qr(p_identifier, case when p_route is null then null when p_route = 'KHONG_CO' then 'RtMissing00000001'
                                               when p_lists then 'RtListing00000001' else 'RtNotListing00001' end);
  reset role;
  return v_result;
end $$;

create temp table cases (n integer, name text, identifier text, qr text, checkpoint text, mode text, route text, lists boolean, expected jsonb);
insert into cases values
  -- 1: visit point unknown or not active
  (1, 'QR không tồn tại', 'Qa1b2c3d4e5f6g7h8', 'KHONG_CO', 'HOAT_DONG', 'ONLINE_AVAILABLE', null, true, '{"outcome": "INVALID"}'),
  (2, 'QR còn Nháp', 'Qa1b2c3d4e5f6g7h8', 'NHAP', 'HOAT_DONG', 'ONLINE_AVAILABLE', null, true, '{"outcome": "INVALID"}'),
  (3, 'QR đã thu hồi', 'Qa1b2c3d4e5f6g7h8', 'THU_HOI', 'HOAT_DONG', 'ONLINE_AVAILABLE', 'HOAT_DONG', true, '{"outcome": "INVALID"}'),
  (4, 'QR đã thu hồi, điểm dừng và tuyến đều tạm đóng', 'Qa1b2c3d4e5f6g7h8', 'THU_HOI', 'TAM_DONG', 'ONLINE_AVAILABLE', 'TAM_DONG', true, '{"outcome": "INVALID"}'),
  (5, 'identifier rỗng sau khi trim', '   ', 'KHONG_CO', 'HOAT_DONG', 'ONLINE_AVAILABLE', null, true, '{"outcome": "INVALID"}'),
  (6, 'identifier khác hoa/thường', 'qa1b2c3d4e5f6g7h8', 'KHONG_CO', 'HOAT_DONG', 'ONLINE_AVAILABLE', null, true, '{"outcome": "INVALID"}'),
  -- 2: checkpoint NHAP or LUU_TRU
  (7, 'điểm dừng còn Nháp', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'NHAP', 'ONLINE_AVAILABLE', null, true, '{"outcome": "INVALID"}'),
  (8, 'điểm dừng đã lưu trữ', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'LUU_TRU', 'ONLINE_AVAILABLE', null, true, '{"outcome": "INVALID"}'),
  (9, 'điểm dừng đã lưu trữ, tuyến tạm đóng', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'LUU_TRU', 'ONLINE_AVAILABLE', 'TAM_DONG', true, '{"outcome": "INVALID"}'),
  -- 3: route unknown or NHAP
  (10, 'tuyến không tồn tại', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', 'KHONG_CO', true, '{"outcome": "INVALID"}'),
  (11, 'tuyến còn Nháp', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', 'NHAP', true, '{"outcome": "INVALID"}'),
  (12, 'tuyến Nháp, điểm dừng tạm đóng', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'TAM_DONG', 'ONLINE_AVAILABLE', 'NHAP', true, '{"outcome": "INVALID"}'),
  -- 4: route TAM_DONG or LUU_TRU, even with an active checkpoint
  (13, 'tuyến tạm đóng, điểm dừng hoạt động', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', 'TAM_DONG', true,
   '{"outcome": "TEMPORARILY_CLOSED", "closedScope": "ROUTE"}'),
  (14, 'tuyến đã lưu trữ', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', 'LUU_TRU', true,
   '{"outcome": "TEMPORARILY_CLOSED", "closedScope": "ROUTE"}'),
  (15, 'tuyến tạm đóng, điểm dừng cũng tạm đóng', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'TAM_DONG', 'ONLINE_AVAILABLE', 'TAM_DONG', true,
   '{"outcome": "TEMPORARILY_CLOSED", "closedScope": "ROUTE"}'),
  -- 5: checkpoint TAM_DONG
  (16, 'điểm dừng tạm đóng, không có tuyến', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'TAM_DONG', 'ONLINE_AVAILABLE', null, true,
   '{"outcome": "TEMPORARILY_CLOSED", "closedScope": "CHECKPOINT"}'),
  (17, 'điểm dừng tạm đóng, tuyến hoạt động', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'TAM_DONG', 'ONLINE_AVAILABLE', 'HOAT_DONG', true,
   '{"outcome": "TEMPORARILY_CLOSED", "closedScope": "CHECKPOINT"}'),
  -- 6: VALID with the published content of the scanned visit point
  (18, 'mọi thứ hoạt động, không có tuyến', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', null, true,
   jsonb_build_object('outcome', 'VALID', 'content', pg_temp.content('Qa1b2c3d4e5f6g7h8'))),
  (19, 'mọi thứ hoạt động, có tuyến', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', 'HOAT_DONG', true,
   jsonb_build_object('outcome', 'VALID', 'content', pg_temp.content('Qa1b2c3d4e5f6g7h8'))),
  (20, 'tuyến đang hoạt động nhưng không liệt kê điểm dừng', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', 'HOAT_DONG', false,
   jsonb_build_object('outcome', 'VALID', 'content', pg_temp.content('Qa1b2c3d4e5f6g7h8'))),
  (21, 'identifier có khoảng trắng hai đầu', E'  Qa1b2c3d4e5f6g7h8\t', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', null, true,
   jsonb_build_object('outcome', 'VALID', 'content', pg_temp.content('Qa1b2c3d4e5f6g7h8'))),
  (22, 'QR thứ hai của cùng điểm dừng', 'Qz9y8x7w6v5u4t3s2', 'HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE', null, true,
   jsonb_build_object('outcome', 'VALID', 'content', pg_temp.content('Qz9y8x7w6v5u4t3s2'))),
  (23, 'điểm dừng cần tải trước', 'Qa1b2c3d4e5f6g7h8', 'HOAT_DONG', 'HOAT_DONG', 'OFFLINE_REQUIRED', null, true,
   jsonb_build_object('outcome', 'VALID', 'content', pg_temp.content('Qa1b2c3d4e5f6g7h8', 'OFFLINE_REQUIRED')));

select is(pg_temp.lookup(identifier, qr, checkpoint, mode, route, lists), expected, n || '. ' || name) from cases order by n;

-- ---- access (Physical §7.1) --------------------------------------------------------------------------------------
select ok(has_function_privilege('anon', 'api.lookup_qr(text, text)', 'EXECUTE')
  and has_function_privilege('authenticated', 'api.lookup_qr(text, text)', 'EXECUTE'), 'visitors (anon) and signed-in users may look up');
select ok((select provolatile = 's' and prosecdef from pg_proc where oid = 'api.lookup_qr(text, text)'::regprocedure),
  'lookup is STABLE and SECURITY DEFINER: it cannot write');

-- ---- writes nothing (BR-M03-I04) ---------------------------------------------------------------------------------
select test_support.lookup_world('HOAT_DONG', 'HOAT_DONG', 'ONLINE_AVAILABLE');
create function pg_temp.row_counts() returns text language sql as $$
  select string_agg(t || '=' || n, ',' order by t) from (
    select 'audit' t, count(*) n from app.audit_records union all select 'sessions', count(*) from app.session_records
    union all select 'revisions', count(*) from app.revisions union all select 'qr', count(*) from app.qr_codes
    union all select 'snapshots', count(*) from app.journey_snapshots union all select 'media', count(*) from app.media) x $$;
select pg_temp.row_counts() as before_lookups \gset
set local role anon;
select api.lookup_qr('Qa1b2c3d4e5f6g7h8') from generate_series(1, 3);
select api.lookup_qr('missing');
reset role;
select is(pg_temp.row_counts(), :'before_lookups', 'four lookups write no row anywhere, not even an audit line');

-- ---- a draft is never exposed (BR-M03-I04) ------------------------------------------------------------------------
set local session_replication_role = replica;
insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
values ('QRCODE', 'Qa1b2c3d4e5f6g7h8', 2, '{"objectName": {"vi": "Bản nháp bí mật", "en": "Secret draft"}}', 'x', 'x');
set local session_replication_role = origin;
set local role anon;
select is(api.lookup_qr('Qa1b2c3d4e5f6g7h8') #>> '{content,objectName,vi}', 'Cây chò ngàn năm', 'the pending draft never reaches visitors');
reset role;

-- ---- a lookup that cannot be concluded is an error, never INVALID (SC-M03-017) ------------------------------------
set local session_replication_role = replica;
update app.revisions set content = content - 'introductionText' where subject_id = 'Qz9y8x7w6v5u4t3s2' and status = 'PHAT_HANH';
set local session_replication_role = origin;
set local role anon;
select throws_ok($$select api.lookup_qr('Qz9y8x7w6v5u4t3s2')$$, '22000', null,
  'published content that cannot be read raises an error: the visitor app shows "lookup failed", not "invalid code"');
reset role;

select * from finish();
rollback;
