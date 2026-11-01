-- pgTAP — US1 accounts (tasks M03 T180; admin-command C-18, C-19, Q-01, Q-14 and §7; auth-account §2.2–2.5, §2.8;
-- BR-M03-A01, A03, K01, K03, K04; SC-M03-008, 010, 011). Seed accounts: reviewer …01, staff …02, locked …03,
-- noaccount …04 (supabase/seed.sql). Concurrent requests are serialized by the table lock; two real sessions are
-- exercised by the contract tests on the local stack (T197).
begin;
create extension if not exists pgtap with schema extensions;
select plan(59);

insert into auth.sessions (id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004');

-- sign in as seed user n (claims as PostgREST sets them)
create function pg_temp.as_user(n integer) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', '00000000-0000-4000-8000-00000000000' || n, 'session_id', '10000000-0000-4000-8000-00000000000' || n)::text, true);
$$;
create function pg_temp.audits() returns integer language sql as $$ select count(*)::int from app.audit_records $$;
create function pg_temp.account(p_email text) returns app.admin_accounts language sql as $$
  select * from app.admin_accounts where email = p_email $$;

-- ---- grants (admin-command §7; R-16) -----------------------------------------------------------------------------
select ok(has_function_privilege('authenticated', f, 'EXECUTE'), 'authenticated executes ' || f)
from unnest(array['api.get_current_admin()', 'api.list_accounts()', 'api.change_account_role(text, text, jsonb)',
  'api.set_account_status(text, text, jsonb)']) as f;
select ok(not has_function_privilege('anon', f, 'EXECUTE') and not has_function_privilege('authenticated', f, 'EXECUTE')
  and has_function_privilege('service_role', f, 'EXECUTE'), f || ' is service_role only')
from unnest(array['api.prepare_invitation(text, text, text)', 'api.record_account_event(text, text, text, text)',
  'api.link_invitation(text, text)', 'app.provision_initial_reviewer(text)']) as f;
select ok(not has_function_privilege('anon', 'api.get_current_admin()', 'EXECUTE')
  and not has_function_privilege('anon', 'api.list_accounts()', 'EXECUTE'), 'anon calls no account function');

-- ---- Q-01 (BR-M03-A04, K05) ----------------------------------------------------------------------------------------
select pg_temp.as_user(2);
select is(api.get_current_admin(), '{"email": "staff@example.test", "role": "CONTENT_STAFF", "status": "ACTIVE"}',
  'Q-01 returns the caller''s own account');
select pg_temp.as_user(4);
select is(api.get_current_admin(), null, 'Q-01 is empty for an identity without an account (SC-M03-009)');

-- ---- Q-14, C-18, C-19 refused to Content Staff (BR-M03-A03) -------------------------------------------------------
select pg_temp.as_user(2);
select throws_ok($$select api.list_accounts()$$, '42501', null, 'Content Staff cannot list accounts');
select is(api.change_account_role('locked@example.test', 'REVIEWER', '{"entity": 3}'), app.cr_forbidden(),
  'Content Staff changing a role is FORBIDDEN');
select is(api.set_account_status('locked@example.test', 'ACTIVE', '{"entity": 3}'), app.cr_forbidden(),
  'Content Staff unlocking an account is FORBIDDEN');
select is((select count(*)::int from app.audit_records where outcome = 'FAILURE'
  and actor_user_id = '00000000-0000-4000-8000-000000000002'), 2, 'each refused call still writes its audit line');
select is((pg_temp.account('locked@example.test')).status, 'DEACTIVATED', '... and changes nothing');

-- ---- Reviewer: Q-14 ------------------------------------------------------------------------------------------------
select pg_temp.as_user(1);
select is(jsonb_path_query_array(api.list_accounts(), '$[*].email'),
  '["locked@example.test", "reviewer@example.test", "staff@example.test"]', 'Q-14 lists every account by email');
select is(api.list_accounts() -> 0, '{"email": "locked@example.test", "role": "CONTENT_STAFF", "status": "DEACTIVATED", "concurrencyRevision": 3}',
  'a row carries email, role, status and concurrencyRevision');

-- ---- last active Reviewer (BR-M03-K03; SC-M03-008) -------------------------------------------------------------
select is(api.change_account_role('reviewer@example.test', 'CONTENT_STAFF', '{"entity": 2}'),
  app.cr_blocked('MSG-LAST-REVIEWER'), 'demoting the last active Reviewer is BLOCKED');
select is(api.set_account_status(' Reviewer@Example.test ', 'DEACTIVATED', '{"entity": 2}'),
  app.cr_blocked('MSG-LAST-REVIEWER'), 'locking the last active Reviewer is BLOCKED (email normalized)');
select is((select count(*)::int from app.admin_accounts where role = 'REVIEWER' and status = 'ACTIVE'), 1,
  'one active Reviewer remains');

-- ---- STALE (BR-M03-F06; R-09) --------------------------------------------------------------------------------------
select is(api.change_account_role('staff@example.test', 'REVIEWER', '{"entity": 1}') ->> 'reason', 'STALE',
  'an old concurrencyRevision is STALE');
select is(api.change_account_role('staff@example.test', 'REVIEWER', '{}') ->> 'reason', 'STALE',
  'a missing expected revision is STALE');

-- ---- successful changes, one audit line each (BR-M03-F08) -----------------------------------------------------------
select pg_temp.audits() as before_promote \gset
select is(api.change_account_role('staff@example.test', 'REVIEWER', '{"entity": 2}'),
  app.cr_ok('MSG-SAVED', '{"status": "ACTIVE", "concurrencyRevision": 3}'), 'C-18 promotes Content Staff to Reviewer');
select is(pg_temp.audits(), :before_promote + 1, 'exactly one audit line');
select ok((select actor_user_id = '00000000-0000-4000-8000-000000000001' and outcome = 'SUCCESS'
    and before_state = '{"role": "CONTENT_STAFF"}' and after_state = '{"role": "REVIEWER"}' and entity_id = 'staff@example.test'
  from app.audit_records where action = 'ACCOUNT_ROLE_CHANGED' and outcome = 'SUCCESS'),
  'the line has the actor, the account and role before → after');
select is(api.set_account_status('reviewer@example.test', 'DEACTIVATED', '{"entity": 2}') ->> 'ok', 'true',
  'with another active Reviewer, a Reviewer can be locked');
select ok((select before_state = '{"status": "ACTIVE"}' and after_state = '{"status": "DEACTIVATED"}'
  from app.audit_records where action = 'ACCOUNT_STATUS_CHANGED' and outcome = 'SUCCESS'), 'status before → after');
select is((app.current_admin()).email, null, 'the locked Reviewer is refused from its next request');
select pg_temp.as_user(2);
select is(api.set_account_status('reviewer@example.test', 'ACTIVE', '{"entity": 3}') -> 'data',
  '{"status": "ACTIVE", "concurrencyRevision": 4}', 'the other Reviewer unlocks it');
select is(api.set_account_status('staff@example.test', 'ACTIVE', '{"entity": 3}') ->> 'ok', 'true',
  'setting the current status again is accepted');
select is(api.set_account_status('reviewer@example.test', 'DEACTIVATED', '{"entity": 3}') ->> 'reason', 'STALE',
  'STALE after another Reviewer''s change');
select is(app.cr_stale('00000000-0000-4000-8000-000000000002', now()) -> 'stale' ->> 'editorEmail', 'staff@example.test',
  'STALE names the account of the last editor');
select is(api.change_account_role('locked@example.test', 'OWNER', '{"entity": 3}'), app.cr_failed(),
  'only the two fixed roles exist (BR-M03-A01)');
select is(api.change_account_role('nobody@example.test', 'REVIEWER', '{"entity": 1}'), app.cr_failed(),
  'an unknown account is FAILED');

-- ---- Edge invite / resend (auth-account §2.2; BR-M03-K01, SC-M03-011) ---------------------------------------------
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000003', 'new1@example.test', 'CONTENT_STAFF') ->> 'result',
  'FORBIDDEN', 'a locked account cannot invite');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', 'khong-phai-email', 'CONTENT_STAFF') ->> 'result',
  'INVALID_EMAIL', 'invalid email');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', repeat('a', 250) || '@example.test', 'CONTENT_STAFF') ->> 'result',
  'INVALID_EMAIL', 'email above EMAIL_MAX_CHARS');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', 'x@example.test', 'ADMIN') ->> 'result',
  'FAILED', 'no other role can be invited');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', '  New1@Example.TEST ', 'CONTENT_STAFF'),
  '{"result": "CREATED", "email": "new1@example.test"}', 'invite creates one INVITATION_PENDING account');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', 'new1@example.test', 'REVIEWER') ->> 'result',
  'PENDING', 'inviting a pending account again is a resend');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', 'new1@example.test') ->> 'result',
  'PENDING', 'resend of a pending account');
select ok((select count(*) = 1 and bool_and(role = 'CONTENT_STAFF' and status = 'INVITATION_PENDING' and user_id is null)
  from app.admin_accounts where email = 'new1@example.test'), 'still one account, role unchanged');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', 'locked@example.test', 'CONTENT_STAFF') ->> 'result',
  'EMAIL_TAKEN', 'inviting an existing account is EMAIL_TAKEN');
select is(api.prepare_invitation('00000000-0000-4000-8000-000000000002', 'locked@example.test') ->> 'result',
  'FAILED', 'resend only for a pending account');
select pg_temp.audits() as before_event \gset
select api.record_account_event('00000000-0000-4000-8000-000000000002', 'ACCOUNT_INVITED', 'new1@example.test', 'SUCCESS');
select is(pg_temp.audits(), :before_event + 1, 'the Edge call records one audit line');
select throws_ok($$select api.record_account_event('u', 'ACCOUNT_ROLE_CHANGED', 'x@example.test', 'SUCCESS')$$, '23514', null,
  'record_account_event only records invite and resend');

-- ---- Edge link (auth-account §2.3) ----------------------------------------------------------------------------------
select is(api.link_invitation('00000000-0000-4000-8000-000000000004', 'noaccount@example.test') ->> 'result', 'LINK_REJECTED',
  'no pending account for that email → rejected');
select ok((select actor_user_id is null and outcome = 'FAILURE' from app.audit_records
  where action = 'ACCOUNT_LINKED' and entity_id = 'noaccount@example.test'), '... with a FAILURE audit line');
select is(api.link_invitation('00000000-0000-4000-8000-000000000004', 'NEW1@example.test ') ->> 'result', 'LINKED',
  'the matching provider user is linked');
select ok((select status = 'ACTIVE' and role = 'CONTENT_STAFF' and user_id = '00000000-0000-4000-8000-000000000004'
  from app.admin_accounts where email = 'new1@example.test'), 'the account is ACTIVE with that identity, role as invited');
select is(api.link_invitation('00000000-0000-4000-8000-000000000004', 'new1@example.test') ->> 'result', 'LINK_REJECTED',
  'a link is used once');

-- ---- first Reviewer (R-16; BR-M03-K04; SC-M03-010) ---------------------------------------------------------------
select is(app.provision_initial_reviewer('first@example.test'), 'NOT_EMPTY', 'refused when any account exists');
set local session_replication_role = replica;
truncate app.audit_records, app.admin_accounts;
set local session_replication_role = origin;
select is(app.provision_initial_reviewer('  First@Example.test'), 'CREATED', 'an empty environment gets its first Reviewer');
select ok((select role = 'REVIEWER' and status = 'INVITATION_PENDING' from app.admin_accounts where email = 'first@example.test'),
  'as a pending Reviewer invitation');
select ok((select actor_user_id is null and outcome = 'SUCCESS' from app.audit_records where action = 'INITIAL_REVIEWER_PROVISIONED'),
  'audited with an empty actor');
select is(app.provision_initial_reviewer('first@example.test'), 'ALREADY_PROVISIONED', 'the same email again is a no-op');
select is(pg_temp.audits(), 1, '... that writes nothing');
select is(app.provision_initial_reviewer('second@example.test'), 'NOT_EMPTY', 'another email is refused');

select * from finish();
rollback;
