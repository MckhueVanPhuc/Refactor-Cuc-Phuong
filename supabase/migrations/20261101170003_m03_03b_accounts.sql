-- M03 migration 3b — administrative accounts (tasks M03 T177; admin-command-contract C-18, C-19, Q-01, Q-14;
-- auth-account-contract §2.2–2.5, §2.8; research R-15, R-16; BR-M03-A01–A04, K01, K03, K04; SC-M03-008, 010).
-- Invite, resend and link run in the Edge Function `admin-accounts`, which reaches the service-role-only functions
-- below; the browser never holds that key. The account table is locked to serialize role/status changes (Physical §8).

-- Who changed an account last, for STALE (R-09): the actor of its latest successful audit line
create function app.account_last_editor(p_email text) returns text
language sql stable
set search_path = ''
as $$
  select r.actor_user_id from app.audit_records r
  where r.entity_type = 'ACCOUNT' and r.entity_id = p_email and r.outcome = 'SUCCESS'
  order by r.occurred_at desc, r.audit_id desc
  limit 1
$$;

-- lower(trim(email)), the only form stored and compared (BR-M03-K01); same rule as src/modules/m03/validation/email.ts
create function app.normalize_email(p_email text) returns text
language sql immutable
set search_path = ''
as $$ select lower(btrim(p_email)) $$;

create function app.email_ok(p_normalized text) returns boolean
language sql immutable
set search_path = ''
as $$
  select coalesce(
    char_length(p_normalized) <= app.limit('EMAIL_MAX_CHARS')
      and p_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$',
    false)
$$;

-- Would this change leave no active Reviewer? Checked under the table lock; the statement trigger stays as backstop
create function app.removes_last_reviewer(p_account app.admin_accounts, p_role text, p_status text) returns boolean
language sql stable
set search_path = ''
as $$
  select p_account.role = 'REVIEWER' and p_account.status = 'ACTIVE'
    and not (p_role = 'REVIEWER' and p_status = 'ACTIVE')
    and not exists (
      select 1 from app.admin_accounts a
      where a.role = 'REVIEWER' and a.status = 'ACTIVE' and a.email <> p_account.email)
$$;

-- ---------------------------------------------------------------------------
-- Q-01, Q-14
-- ---------------------------------------------------------------------------

-- The caller's own active account, or null (no account, pending, locked or signed-out session)
create function api.get_current_admin() returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object('email', a.email, 'role', a.role, 'status', a.status)
  from app.current_admin() a
  where a.email is not null
$$;

-- Reviewer only; a query is not a command, so refusal is a permission error (adapter → MSG-NO-PERMISSION)
create function api.list_accounts() returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if (app.current_admin()).role is distinct from 'REVIEWER' then
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'email', a.email, 'role', a.role, 'status', a.status, 'concurrencyRevision', a.concurrency_revision)
      order by a.email)
    from app.admin_accounts a), '[]');
end;
$$;

-- ---------------------------------------------------------------------------
-- C-18, C-19 (Reviewer; BLOCKED MSG-LAST-REVIEWER; STALE)
-- ---------------------------------------------------------------------------

-- Shared body: lock the table, check, change one of role/status, one audit line either way
create function app.change_account(p_action text, p_email text, p_role text, p_status text, p_expected jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_email text := app.normalize_email(p_email);
  v_actor app.admin_accounts;
  v_account app.admin_accounts;
  v_field text := case p_action when 'ACCOUNT_ROLE_CHANGED' then 'role' else 'status' end;
  v_before jsonb;
  v_result jsonb;
begin
  begin
    v_actor := app.require_admin('R');
    lock table app.admin_accounts in share row exclusive mode;
    select * into v_account from app.admin_accounts where email = v_email;
    if v_account.email is null then
      perform app.reject(app.cr_failed());
    end if;
    -- STALE first, then the request itself (same order as every command)
    perform app.expect_revision((p_expected ->> 'entity')::integer, v_account.concurrency_revision,
      app.account_last_editor(v_email), v_account.updated_at);
    -- only the two fixed roles exist (BR-M03-A01); a pending invitation is neither locked nor unlocked here
    if (v_field = 'role' and coalesce(p_role in ('REVIEWER', 'CONTENT_STAFF'), false) is false)
      or (v_field = 'status' and (coalesce(p_status in ('ACTIVE', 'DEACTIVATED'), false) is false
                                  or v_account.status = 'INVITATION_PENDING')) then
      perform app.reject(app.cr_failed());
    end if;
    if app.removes_last_reviewer(v_account, coalesce(p_role, v_account.role), coalesce(p_status, v_account.status)) then
      perform app.reject(app.cr_blocked('MSG-LAST-REVIEWER'));
    end if;
    v_before := jsonb_build_object('role', v_account.role, 'status', v_account.status) -> v_field;
    update app.admin_accounts
    set role = coalesce(p_role, role),
        status = coalesce(p_status, status),
        concurrency_revision = concurrency_revision + 1
    where email = v_email
    returning * into v_account;
    perform app.audit(v_actor.user_id, p_action, 'ACCOUNT', v_email, 'SUCCESS', null, null, null,
      jsonb_build_object(v_field, v_before),
      jsonb_build_object(v_field, jsonb_build_object('role', v_account.role, 'status', v_account.status) -> v_field));
    return app.cr_ok('MSG-SAVED',
      jsonb_build_object('status', v_account.status, 'concurrencyRevision', v_account.concurrency_revision));
  exception when others then
    v_result := app.result_from_error(sqlstate, sqlerrm);
  end;
  perform app.audit(auth.uid()::text, p_action, 'ACCOUNT', coalesce(v_email, ''), 'FAILURE');
  return v_result;
end;
$$;

create function api.change_account_role(p_email text, p_role text, p_expected jsonb default '{}') returns jsonb
language sql security definer
set search_path = ''
as $$ select app.change_account('ACCOUNT_ROLE_CHANGED', p_email, coalesce(p_role, ''), null, p_expected) $$;

create function api.set_account_status(p_email text, p_status text, p_expected jsonb default '{}') returns jsonb
language sql security definer
set search_path = ''
as $$ select app.change_account('ACCOUNT_STATUS_CHANGED', p_email, null, coalesce(p_status, ''), p_expected) $$;

-- ---------------------------------------------------------------------------
-- Edge `admin-accounts` (service_role only; auth-account §2.2–2.3)
-- ---------------------------------------------------------------------------

-- invite (p_role given) or resend (p_role null): keep exactly one INVITATION_PENDING account per email.
-- Writes no audit: the Edge Function records one line after the provider call (api.record_account_event).
-- result: CREATED | PENDING | INVALID_EMAIL | EMAIL_TAKEN | FORBIDDEN | FAILED
create function api.prepare_invitation(p_actor_user_id text, p_email text, p_role text default null) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_email text := app.normalize_email(p_email);
  v_account app.admin_accounts;
begin
  if not exists (select 1 from app.admin_accounts a
                 where a.user_id = p_actor_user_id and a.role = 'REVIEWER' and a.status = 'ACTIVE') then
    return jsonb_build_object('result', 'FORBIDDEN');
  end if;
  if p_role is not null and p_role not in ('REVIEWER', 'CONTENT_STAFF') then
    return jsonb_build_object('result', 'FAILED');
  end if;
  if not app.email_ok(v_email) then
    return jsonb_build_object('result', 'INVALID_EMAIL');
  end if;
  lock table app.admin_accounts in share row exclusive mode;
  select * into v_account from app.admin_accounts where email = v_email;
  if v_account.email is null then
    if p_role is null then
      return jsonb_build_object('result', 'FAILED');
    end if;
    insert into app.admin_accounts (email, role) values (v_email, p_role);
    return jsonb_build_object('result', 'CREATED', 'email', v_email);
  end if;
  if v_account.status <> 'INVITATION_PENDING' then
    return jsonb_build_object('result', case when p_role is null then 'FAILED' else 'EMAIL_TAKEN' end, 'email', v_email);
  end if;
  return jsonb_build_object('result', 'PENDING', 'email', v_email);
end;
$$;

-- The one audit line of an invite/resend call (BR-M03-F08)
create function api.record_account_event(p_actor_user_id text, p_action text, p_email text, p_outcome text) returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_action not in ('ACCOUNT_INVITED', 'ACCOUNT_INVITE_RESENT') or p_outcome not in ('SUCCESS', 'FAILURE') then
    raise exception 'unknown account event' using errcode = 'check_violation';
  end if;
  perform app.audit(p_actor_user_id, p_action, 'ACCOUNT', coalesce(app.normalize_email(p_email), ''), p_outcome);
end;
$$;

-- link: the provider user whose (normalized) email matches an INVITATION_PENDING account becomes its identity.
-- The invitee never chooses a role. result: LINKED | LINK_REJECTED; one audit line either way
create function api.link_invitation(p_user_id text, p_email text) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_email text := app.normalize_email(p_email);
  v_linked boolean;
begin
  lock table app.admin_accounts in share row exclusive mode;
  update app.admin_accounts
  set status = 'ACTIVE', user_id = p_user_id, concurrency_revision = concurrency_revision + 1
  where email = v_email and status = 'INVITATION_PENDING' and p_user_id is not null
    and not exists (select 1 from app.admin_accounts a where a.user_id = p_user_id);
  v_linked := found;
  perform app.audit(case when v_linked then p_user_id end, 'ACCOUNT_LINKED', 'ACCOUNT', coalesce(v_email, ''),
    case when v_linked then 'SUCCESS' else 'FAILURE' end);
  return jsonb_build_object('result', case when v_linked then 'LINKED' else 'LINK_REJECTED' end);
end;
$$;

-- ---------------------------------------------------------------------------
-- First Reviewer (R-16; BR-M03-K04; SC-M03-010) — operator procedure, not in schema `api`
-- ---------------------------------------------------------------------------

-- Only when no account exists; the same email again is a no-op. result: CREATED | ALREADY_PROVISIONED | NOT_EMPTY
-- | INVALID_EMAIL. Audit with an empty actor.
create function app.provision_initial_reviewer(p_email text) returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  v_email text := app.normalize_email(p_email);
begin
  if not app.email_ok(v_email) then
    return 'INVALID_EMAIL';
  end if;
  lock table app.admin_accounts in share row exclusive mode;
  if exists (select 1 from app.admin_accounts) then
    if (select count(*) from app.admin_accounts) = 1
      and exists (select 1 from app.admin_accounts where email = v_email and role = 'REVIEWER') then
      return 'ALREADY_PROVISIONED';
    end if;
    return 'NOT_EMPTY';
  end if;
  insert into app.admin_accounts (email, role) values (v_email, 'REVIEWER');
  perform app.audit(null, 'INITIAL_REVIEWER_PROVISIONED', 'ACCOUNT', v_email, 'SUCCESS');
  return 'CREATED';
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants (admin-command §7; Physical §9). Default privileges already keep PUBLIC out (D-77).
-- ---------------------------------------------------------------------------
grant execute on function api.get_current_admin() to authenticated;
grant execute on function api.list_accounts() to authenticated;
grant execute on function api.change_account_role(text, text, jsonb) to authenticated;
grant execute on function api.set_account_status(text, text, jsonb) to authenticated;
grant execute on function api.prepare_invitation(text, text, text) to service_role;
grant execute on function api.record_account_event(text, text, text, text) to service_role;
grant execute on function api.link_invitation(text, text) to service_role;
grant execute on function app.provision_initial_reviewer(text) to service_role;
