-- Seed CHỈ cho stack Supabase local (`supabase db reset`) — dữ liệu synthetic, domain example.test, không bao giờ
-- chạy trên Single Supabase Cloud Project (AGENTS.md §4; tasks M03 T176; Physical §1 "One backend, no seed").
-- Tài khoản giống fixture của adapter giả (src/modules/m03/api/fake/fixtures.ts) để E2E và contract test dùng chung.
-- Không chèn tuyến, điểm dừng hay nội dung bằng SQL tay: trigger và guard sẽ chặn; nội dung dựng qua RPC (T198).

create schema if not exists test_support;
comment on schema test_support is 'Chỉ có ở stack local (seed.sql): hỗ trợ test, không thuộc schema api hay migration';
revoke all on schema test_support from public, anon, authenticated, service_role;

-- Người dùng Auth giả với mật khẩu synthetic; id cố định để test dễ đọc
create function test_support.create_auth_user(p_id uuid, p_email text, p_password text) returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token)
  values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
    '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), p_id, p_id::text, 'email',
    jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
    now(), now(), now());
end;
$$;

-- Tài khoản quản trị đi đúng vòng đời (INVITATION_PENDING → ACTIVE [→ DEACTIVATED]); trigger không cho tạo thẳng ACTIVE
create function test_support.create_admin_account(p_email text, p_user_id uuid, p_role text, p_status text) returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into app.admin_accounts (email, role) values (p_email, p_role);
  update app.admin_accounts set status = 'ACTIVE', user_id = p_user_id::text, concurrency_revision = 2 where email = p_email;
  if p_status = 'DEACTIVATED' then
    update app.admin_accounts set status = 'DEACTIVATED', concurrency_revision = 3 where email = p_email;
  end if;
end;
$$;

create function test_support.seed_m03() returns void
language plpgsql
set search_path = ''
as $$
declare
  c_password constant text := 'Matkhau-thu-123';
begin
  perform test_support.create_auth_user('00000000-0000-4000-8000-000000000001', 'reviewer@example.test', c_password);
  perform test_support.create_auth_user('00000000-0000-4000-8000-000000000002', 'staff@example.test', c_password);
  perform test_support.create_auth_user('00000000-0000-4000-8000-000000000003', 'locked@example.test', c_password);
  -- đã xác thực ở provider nhưng không có AdminAccount (SC-M03-009; quickstart Q1)
  perform test_support.create_auth_user('00000000-0000-4000-8000-000000000004', 'noaccount@example.test', c_password);

  perform test_support.create_admin_account('reviewer@example.test', '00000000-0000-4000-8000-000000000001', 'REVIEWER', 'ACTIVE');
  perform test_support.create_admin_account('staff@example.test', '00000000-0000-4000-8000-000000000002', 'CONTENT_STAFF', 'ACTIVE');
  perform test_support.create_admin_account('locked@example.test', '00000000-0000-4000-8000-000000000003', 'CONTENT_STAFF', 'DEACTIVATED');
end;
$$;

-- Xóa mọi dữ liệu M03 và người dùng Auth rồi seed lại — để contract test trên stack thật bắt đầu từ trạng thái sạch.
-- Bảng app từ chối DELETE/TRUNCATE (DEC-S6-002); `session_replication_role = replica` tắt trigger trong transaction
-- này, chỉ ở local. Gọi bằng `psql` trong container DB, không qua Data API.
create function test_support.reset_m03() returns void
language plpgsql
set search_path = ''
as $$
begin
  set local session_replication_role = replica;
  truncate app.audit_records, app.session_records, app.journey_snapshots, app.media, app.revisions,
    app.qr_codes, app.checkpoints, app.routes, app.admin_accounts;
  delete from storage.objects where bucket_id = 'quest-media';
  -- Auth rows are deleted with triggers on: their foreign keys cascade to identities, sessions and tokens
  set local session_replication_role = origin;
  delete from auth.users;
  perform test_support.seed_m03();
end;
$$;

-- Thế giới của bảng sự thật live lookup (src/shared/contracts/liveQrLookup.cases.ts; tasks T191): một điểm dừng có hai
-- điểm tham quan đã xuất bản, một tuyến liệt kê nó và một tuyến không liệt kê, với trạng thái của từng ca. Đúng id, tên,
-- chữ và sourceRef của bảng để so output với `expected`. Ngoại lệ có chủ đích của quy tắc đầu file: dựng thẳng bằng SQL
-- với `replica` vì cần cả trạng thái không đi qua lệnh được (QR không tồn tại, nội dung có âm thanh ở điểm dừng cần tải
-- trước); chỉ gọi khi test, không nằm trong seed. Mỗi lần gọi xóa và dựng lại thế giới đó.
create function test_support.lookup_world(p_qr text, p_checkpoint text, p_mode text, p_route text default 'HOAT_DONG')
returns void
language plpgsql
set search_path = ''
as $$
declare
  c_checkpoint constant text := 'Ck1m2n3p4q5r6s7t8';
  c_qr1 constant text := 'Qa1b2c3d4e5f6g7h8';
  c_qr2 constant text := 'Qz9y8x7w6v5u4t3s2';
  c_by constant text := 'seed-lookup';
  v_route text;
begin
  set local session_replication_role = replica;
  delete from app.revisions where subject_id in (c_checkpoint, c_qr1, c_qr2, 'RtListing00000001', 'RtNotListing00001');
  delete from app.media where owner_id = c_checkpoint;
  delete from app.qr_codes where checkpoint_id = c_checkpoint;
  delete from app.checkpoints where checkpoint_id = c_checkpoint;
  delete from app.routes where route_id in ('RtListing00000001', 'RtNotListing00001');

  insert into app.checkpoints (checkpoint_id, status, closure_reason, closed_at, closed_by_user_id, created_by_user_id)
  values (c_checkpoint, p_checkpoint, 'Thử', now(), c_by, c_by);
  insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
                             published_by_user_id, published_at, self_published)
  values ('CHECKPOINT', c_checkpoint, 1, 'PHAT_HANH', jsonb_build_object(
    'checkpointName', '{"vi": "Hang Con Moong", "en": "Con Moong Cave"}'::jsonb, 'connectivityMode', p_mode,
    'fieldVerificationConfirmed', true, 'fieldVerifiedByUserId', c_by, 'fieldVerifiedAt', '2026-10-01T00:00:00.000Z'),
    c_by, c_by, c_by, now(), true);

  insert into app.media (media_id, owner_type, owner_id, usage, type, spoken_language, source_ref, mime_type, file_size_bytes,
                         usage_rights_confirmed, usage_rights_confirmed_by_user_id, usage_rights_confirmed_at, created_by_user_id)
  select m.id, 'CHECKPOINT', c_checkpoint, 'QR_MEDIA', m.type, m.lang, 'checkpoints/' || c_checkpoint || '/' || m.file, m.mime, 1000,
         true, c_by, now(), c_by
  from (values
    ('00000000-0000-4000-8000-0000000000c1'::uuid, 'IMAGE', null, 'cho-1.jpg', 'image/jpeg'),
    ('00000000-0000-4000-8000-0000000000c2'::uuid, 'AUDIO', 'vi', 'cho-vi.mp3', 'audio/mpeg'),
    ('00000000-0000-4000-8000-0000000000c3'::uuid, 'VIDEO', 'NONE', 'cho.mp4', 'video/mp4'),
    ('00000000-0000-4000-8000-0000000000c4'::uuid, 'IMAGE', null, 'xuong-1.jpg', 'image/jpeg'),
    ('00000000-0000-4000-8000-0000000000c5'::uuid, 'IMAGE', null, 'xuong-2.jpg', 'image/jpeg'),
    ('00000000-0000-4000-8000-0000000000c6'::uuid, 'AUDIO', 'en', 'xuong-en.mp3', 'audio/mpeg')) as m(id, type, lang, file, mime);

  -- QR_1 takes the state of the case ('KHONG_CO' = no such row); QR_2 is always active
  insert into app.qr_codes (qr_identifier, checkpoint_id, status, created_by_user_id)
  select q.id, c_checkpoint, q.status, c_by
  from (values (c_qr1, p_qr), (c_qr2, 'HOAT_DONG')) as q(id, status) where q.status <> 'KHONG_CO';
  insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
                             published_by_user_id, published_at, self_published)
  values
    ('QRCODE', c_qr1, 1, 'PHAT_HANH', '{"objectName": {"vi": "Cây chò ngàn năm", "en": "Thousand-year chò tree"},
      "introductionText": {"vi": "Cây chò cao hơn bốn mươi mét, thân thẳng, tán rộng.", "en": "The chò tree is over forty metres tall with a straight trunk."},
      "mediaItems": [{"mediaId": "00000000-0000-4000-8000-0000000000c1"}, {"mediaId": "00000000-0000-4000-8000-0000000000c2"},
                     {"mediaId": "00000000-0000-4000-8000-0000000000c3"}]}', c_by, c_by, c_by, now(), true),
    ('QRCODE', c_qr2, 1, 'PHAT_HANH', '{"objectName": {"vi": "Bộ xương người tiền sử", "en": "Prehistoric skeleton"},
      "introductionText": {"vi": "Di cốt được tìm thấy trong lớp đất sâu của hang.", "en": "The remains were found in a deep layer of the cave floor."},
      "mediaItems": [{"mediaId": "00000000-0000-4000-8000-0000000000c4"}, {"mediaId": "00000000-0000-4000-8000-0000000000c5"},
                     {"mediaId": "00000000-0000-4000-8000-0000000000c6"}]}', c_by, c_by, c_by, now(), true);

  -- both routes take the route state of the case; one lists the checkpoint, the other does not
  foreach v_route in array array['RtListing00000001', 'RtNotListing00001'] loop
    insert into app.routes (route_id, status, active_content_version, closure_source, closure_reason, closed_at, closed_by_user_id,
                            created_by_user_id)
    values (v_route, coalesce(nullif(p_route, 'KHONG_CO'), 'HOAT_DONG'), 1, 'MANUAL', 'Thử', now(), c_by, c_by);
    insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
                               published_by_user_id, published_at, self_published)
    values ('ROUTE', v_route, 1, 'PHAT_HANH', jsonb_build_object('noSafetyWarningConfirmed', true, 'offlineRouteMapRequired', false,
      'checkpointList', case when v_route = 'RtListing00000001' then jsonb_build_array(jsonb_build_object('checkpointId', c_checkpoint))
                             else '[]'::jsonb end), c_by, c_by, c_by, now(), true);
  end loop;
  set local session_replication_role = origin;
end;
$$;

-- Snapshot của bảng intake (src/shared/contracts/sessionSyncRecord.cases.ts SESSION_INTAKE_SNAPSHOT; tasks T196, Q25):
-- tuyến Rt1a2b3c4d5e6f7g8h9 với version 1 và 2, version 2 có hai điểm dừng. Xóa phiên đã nhận của tuyến đó để chạy lại
-- bảng từ đầu; `p_route_status` đặt trạng thái tuyến (ca "tuyến đang tạm đóng vẫn nhận"). Cùng ngoại lệ như lookup_world.
create function test_support.intake_world(p_route_status text default 'HOAT_DONG') returns void
language plpgsql
set search_path = ''
as $$
declare
  c_route constant text := 'Rt1a2b3c4d5e6f7g8h9';
  c_by constant text := 'seed-intake';
begin
  set local session_replication_role = replica;
  delete from app.session_records where route_id = c_route;
  delete from app.journey_snapshots where route_id = c_route;
  delete from app.revisions where subject_id = c_route;
  delete from app.routes where route_id = c_route;
  insert into app.routes (route_id, status, active_content_version, closure_source, closure_reason, closed_at, closed_by_user_id,
                          created_by_user_id)
  values (c_route, p_route_status, 2, 'MANUAL', 'Thử', now(), c_by, c_by);
  insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
                             published_by_user_id, published_at, self_published)
  values ('ROUTE', c_route, 1, 'PHAT_HANH', '{"name": {"vi": "Đường mòn tiền sử", "en": "Prehistoric trail"},
    "noSafetyWarningConfirmed": true, "offlineRouteMapRequired": false}', c_by, c_by, c_by, now(), true);
  insert into app.journey_snapshots (route_id, content_version, previous_content_version, checkpoints) values
    (c_route, 1, null, '[{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "sequence": 1, "checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"},
       "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": ["QrIntake000000001"]}]'),
    (c_route, 2, 1, '[{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "sequence": 1, "checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"},
       "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": ["QrIntake000000001"]},
      {"checkpointId": "Cp9z8y7x6w5v4u3t2s1", "sequence": 2, "checkpointName": {"vi": "Động Người Xưa", "en": "Ancient People Cave"},
       "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": ["QrIntake000000002"]}]');
  set local session_replication_role = origin;
end;
$$;

create function test_support.intake_route_status(p_status text) returns void
language plpgsql
set search_path = ''
as $$
begin
  set local session_replication_role = replica;
  update app.routes set status = p_status where route_id = 'Rt1a2b3c4d5e6f7g8h9';
  set local session_replication_role = origin;
end;
$$;

-- Fixture hiệu năng (tasks T199; research R-24): 30 điểm dừng "Cần tải trước", mỗi điểm 20 điểm tham quan đã xuất bản
-- có một ảnh 50 KB (object có trong Storage), và 10 tuyến cùng liệt kê cả 30 điểm dừng — một thay đổi ở điểm dừng đầu
-- dựng lại 10 hành trình × 30 điểm dừng × 20 điểm tham quan. Dựng thẳng bằng SQL (như lookup_world), hành trình
-- version 1 dựng bằng chính app.build_journey / app.commit_snapshot.
create function test_support.perf_world() returns void
language plpgsql
set search_path = ''
as $$
declare
  c_by constant text := '00000000-0000-4000-8000-000000000002';
  v_checkpoint text;
  v_qr text;
  v_media uuid;
  v_route text;
  v_content jsonb;
  c integer;
  q integer;
  r integer;
begin
  set local session_replication_role = replica;
  for c in 1..30 loop
    v_checkpoint := 'PerfCheckpoint' || lpad(c::text, 3, '0');
    insert into app.checkpoints (checkpoint_id, status, created_by_user_id) values (v_checkpoint, 'HOAT_DONG', c_by);
    insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
                               published_by_user_id, published_at, self_published)
    values ('CHECKPOINT', v_checkpoint, 1, 'PHAT_HANH', jsonb_build_object(
      'checkpointName', jsonb_build_object('vi', 'Điểm hiệu năng ' || c, 'en', 'Perf checkpoint ' || c),
      'connectivityMode', 'OFFLINE_REQUIRED'), c_by, c_by, c_by, now(), true);
    for q in 1..20 loop
      v_qr := 'PerfQr' || lpad(c::text, 3, '0') || lpad(q::text, 3, '0') || 'AbCdEf';
      v_media := gen_random_uuid();
      insert into app.qr_codes (qr_identifier, checkpoint_id, status, created_by_user_id, created_at)
      values (v_qr, v_checkpoint, 'HOAT_DONG', c_by, clock_timestamp());
      insert into storage.objects (bucket_id, name, metadata)
      values ('quest-media', 'uploads/CHECKPOINT/' || v_checkpoint || '/' || q, '{"mimetype": "image/jpeg", "size": 50000}');
      insert into app.media (media_id, owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes,
                             usage_rights_confirmed, usage_rights_confirmed_by_user_id, usage_rights_confirmed_at, created_by_user_id)
      values (v_media, 'CHECKPOINT', v_checkpoint, 'QR_MEDIA', 'IMAGE', 'uploads/CHECKPOINT/' || v_checkpoint || '/' || q,
              'image/jpeg', 50000, true, c_by, now(), c_by);
      insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
                                 published_by_user_id, published_at, self_published)
      values ('QRCODE', v_qr, 1, 'PHAT_HANH', jsonb_build_object(
        'objectName', jsonb_build_object('vi', 'Vật ' || c || '-' || q, 'en', 'Object ' || c || '-' || q),
        'introductionText', jsonb_build_object('vi', rpad('Giới thiệu vật ' || c || '-' || q, 120, '.'),
                                               'en', rpad('About object ' || c || '-' || q, 120, '.')),
        'mediaItems', jsonb_build_array(jsonb_build_object('mediaId', v_media))), c_by, c_by, c_by, now(), true);
    end loop;
  end loop;
  set local session_replication_role = origin;

  for r in 1..10 loop
    v_route := 'PerfRoute' || lpad(r::text, 3, '0');
    v_content := jsonb_build_object(
      'name', jsonb_build_object('vi', 'Tuyến hiệu năng ' || r, 'en', 'Perf route ' || r),
      'noSafetyWarningConfirmed', true, 'offlineRouteMapRequired', false,
      'checkpointList', (select jsonb_agg(jsonb_build_object('checkpointId', 'PerfCheckpoint' || lpad(c2::text, 3, '0')) order by c2)
                         from generate_series(1, 30) c2));
    insert into app.routes (route_id, created_by_user_id) values (v_route, c_by);
    set local session_replication_role = replica;
    insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
                               published_by_user_id, published_at, self_published)
    values ('ROUTE', v_route, 1, 'PHAT_HANH', v_content, c_by, c_by, c_by, now(), true);
    set local session_replication_role = origin;
    perform app.commit_snapshot(v_route, app.build_journey(v_route, v_content) -> 'candidate', true);
  end loop;
  -- Thống kê như khi chạy ổn định: ngay sau khi nạp hàng loạt, autovacuum chưa kịp ANALYZE nên planner ước 1 dòng
  -- và chọn plan lồng nhau (đo nguội: validation-report D-127)
  analyze app.checkpoints, app.qr_codes, app.revisions, app.media, app.routes, app.journey_snapshots;
end;
$$;

revoke all on all functions in schema test_support from public, anon, authenticated, service_role;

select test_support.seed_m03();
