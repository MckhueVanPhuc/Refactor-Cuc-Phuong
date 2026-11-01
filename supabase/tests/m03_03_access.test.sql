-- pgTAP — M03 access (tasks M03 T175; Physical §3, §9; media-storage §1, §4; research R-11, R-12, R-15;
-- BR-M03-A02, K06, E14, F12; SC-M03-009, 040; constitution V). Uses the seed accounts of supabase/seed.sql.
-- JWT claims are simulated the way PostgREST sets them (request.jwt.claims), then the role is switched.
begin;
create extension if not exists pgtap with schema extensions;
select plan(44);

-- ---- privileges: no DML for any API role (Physical §9) ---------------------------------------------------------
select table_privs_are('app', t, 'anon', '{}', 'anon has no privilege on app.' || t)
from unnest(array['routes', 'checkpoints', 'qr_codes', 'revisions', 'media', 'journey_snapshots', 'admin_accounts',
  'audit_records', 'session_records']) as t;
select table_privs_are('app', t, 'authenticated', array['SELECT'], 'authenticated only reads app.' || t || ' (RLS filters)')
from unnest(array['routes', 'checkpoints', 'qr_codes', 'revisions', 'media', 'journey_snapshots', 'admin_accounts',
  'audit_records', 'session_records']) as t;
select is(
  (select count(*)::int from information_schema.role_table_grants
   where table_schema = 'app' and grantee = 'service_role'),
  0, 'service_role has no direct privilege on app tables');

-- Only the two helpers the RLS and Storage policies call are executable by API roles; commands come via `api`
select set_eq(
  $$select p.proname::text from pg_proc p where p.pronamespace = 'app'::regnamespace
      and has_function_privilege('anon', p.oid, 'EXECUTE')$$,
  array['current_admin', 'media_object_is_public'], 'anon executes only current_admin and media_object_is_public in app');
select set_eq(
  $$select p.proname::text from pg_proc p where p.pronamespace = 'app'::regnamespace
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')$$,
  array['current_admin', 'media_object_is_public'], 'authenticated executes only the same two app functions');
select is(
  (select count(*)::int from pg_proc p where p.pronamespace = 'app'::regnamespace
     and has_function_privilege('service_role', p.oid, 'EXECUTE')),
  0, 'service_role executes no app function');
select ok(not has_schema_privilege('anon', 'test_support', 'USAGE')
  and not has_schema_privilege('authenticated', 'test_support', 'USAGE'), 'test_support is closed to API roles');
select ok(
  (select bool_and(p.prosecdef and p.proconfig @> array['search_path=""'])
   from pg_proc p where p.proname in ('current_admin', 'media_object_is_public') and p.pronamespace = 'app'::regnamespace),
  'the two exposed helpers are SECURITY DEFINER with an empty search_path');

-- ---- fixtures (replica: trigger-checked lifecycle is out of scope here) ------------------------------------------
insert into auth.sessions (id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004');
set local session_replication_role = replica;
insert into app.routes (route_id, created_by_user_id) values ('r1', 'u1');
insert into app.checkpoints (checkpoint_id, created_by_user_id) values ('c1', 'u1');
insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id) values ('Qr00000000000001', 'c1', 'u1');
insert into app.media (media_id, owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes, created_by_user_id) values
  ('00000000-0000-4000-8000-0000000000d1', 'CHECKPOINT', 'c1', 'QR_MEDIA', 'IMAGE', 'uploads/CHECKPOINT/c1/draft', 'image/jpeg', 10, 'u1'),
  ('00000000-0000-4000-8000-0000000000b1', 'CHECKPOINT', 'c1', 'QR_MEDIA', 'IMAGE', 'uploads/CHECKPOINT/c1/published', 'image/jpeg', 10, 'u1');
insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
  published_by_user_id, published_at, self_published) values
  ('QRCODE', 'Qr00000000000001', 1, 'PHAT_HANH', '{"mediaItems": [{"mediaId": "00000000-0000-4000-8000-0000000000b1"}]}',
   'u1', 'u1', 'u1', now(), true);
insert into app.audit_records (action, entity_type, entity_id, outcome) values ('X', 'ROUTE', 'r1', 'SUCCESS');
set local session_replication_role = origin;
insert into storage.objects (bucket_id, name) values
  ('quest-media', 'uploads/CHECKPOINT/c1/draft'), ('quest-media', 'uploads/CHECKPOINT/c1/published');

-- claims of a signed-in user with a given Auth session (as PostgREST sets them)
create function pg_temp.claims(p_user uuid, p_session uuid) returns text language sql as $$
  select set_config('request.jwt.claims',
    jsonb_build_object('sub', p_user, 'role', 'authenticated', 'session_id', p_session)::text, true) $$;

-- ---- app.current_admin() (R-15; BR-M03-A02, K06; SC-M03-009, 040) ----------------------------------------------
select pg_temp.claims('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002');
set local role authenticated;
select is((app.current_admin()).email, 'staff@example.test', 'an ACTIVE account with a live session is the current admin');
select is((select count(*)::int from app.routes), 1, 'an active administrator reads operational data');
select is((select count(*)::int from app.audit_records), 0, 'Content Staff does not read the audit log');
select is((select count(*)::int from app.admin_accounts), 1, 'Content Staff reads only its own account row (Q-01)');
select is((select count(*)::int from storage.objects where bucket_id = 'quest-media'), 2,
  'an active administrator reads draft objects too (preview, R-12)');
select throws_ok($$insert into app.routes (route_id, created_by_user_id) values ('r9', 'x')$$, '42501', null,
  'authenticated cannot write app tables directly');
select throws_ok($$update app.admin_accounts set role = 'REVIEWER', concurrency_revision = concurrency_revision + 1$$, '42501', null,
  'authenticated cannot change its own role');
reset role;

select pg_temp.claims('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001');
set local role authenticated;
select is((app.current_admin()).role, 'REVIEWER', 'the Reviewer is resolved with its role');
select is((select count(*)::int from app.audit_records), 1, 'the Reviewer reads the audit log');
select is((select count(*)::int from app.admin_accounts), 3, 'the Reviewer reads every account');
reset role;

select pg_temp.claims('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-0000000000ff');
set local role authenticated;
select ok((app.current_admin()).email is null, 'a token whose session was signed out is refused (BR-M03-K06)');
select is((select count(*)::int from app.routes), 0, '... and reads nothing');
reset role;

select pg_temp.claims('00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003');
set local role authenticated;
select ok((app.current_admin()).email is null, 'a DEACTIVATED account is refused');
reset role;

select pg_temp.claims('00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004');
set local role authenticated;
select ok((app.current_admin()).email is null, 'an authenticated user without an AdminAccount is refused (SC-M03-009)');
select is((select count(*)::int from app.revisions), 0, '... and reads no revision');
select is((select array_agg(name)::text[] from storage.objects where bucket_id = 'quest-media'),
  array['uploads/CHECKPOINT/c1/published'], '... and sees only published objects');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('quest-media', 'uploads/ROUTE/r1/x')$$, '42501', null,
  'only an active administrator uploads');
reset role;

-- ---- anonymous visitor (BR-M03-E14, F12; media-storage §4) ------------------------------------------------------
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;
select ok((app.current_admin()).email is null, 'anon is never an administrator');
select throws_ok($$select count(*) from app.routes$$, '42501', null, 'anon cannot read app tables');
select is((select array_agg(name)::text[] from storage.objects where bucket_id = 'quest-media'),
  array['uploads/CHECKPOINT/c1/published'], 'anon reads a published object, never a draft one');
reset role;

select * from finish();
rollback;
