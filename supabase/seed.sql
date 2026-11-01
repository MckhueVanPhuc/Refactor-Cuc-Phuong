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
  delete from auth.users;
  set local session_replication_role = origin;
  perform test_support.seed_m03();
end;
$$;

revoke all on all functions in schema test_support from public, anon, authenticated, service_role;

select test_support.seed_m03();
