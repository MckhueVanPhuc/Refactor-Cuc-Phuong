-- M03 migration 4a — Row Level Security and grants (tasks M03 T171; Physical Schema §3, §9; constitution V).
-- Only schema `api` is exposed by the Data API (config.toml [api] schemas). Authenticated users never write
-- tables directly: every write goes through a SECURITY DEFINER command. The api views, api.lookup_qr, reports
-- and api.ingest_session of step 4 come with their stories (migrations 4b–4d) and grant EXECUTE one by one.

-- RLS on every app table
alter table app.routes enable row level security;
alter table app.checkpoints enable row level security;
alter table app.qr_codes enable row level security;
alter table app.revisions enable row level security;
alter table app.media enable row level security;
alter table app.journey_snapshots enable row level security;
alter table app.admin_accounts enable row level security;
alter table app.audit_records enable row level security;
alter table app.session_records enable row level security;

-- No DML for API roles; service_role has no direct DML on app either (Physical §9)
revoke all on all tables in schema app from public, anon, authenticated, service_role;
revoke all on all sequences in schema app from public, anon, authenticated, service_role;
revoke all on all functions in schema app from public, anon, authenticated, service_role;

-- Schema usage: `api` for every Data API role; `app` only so that RLS and Storage policies can call
-- app.current_admin() and the media reference check (migration 5). `app` stays out of [api] schemas.
grant usage on schema api to anon, authenticated, service_role;
grant usage on schema app to anon, authenticated;

grant execute on function app.current_admin() to anon, authenticated;

-- Read policies (defense in depth behind the api functions): an active administrator reads operational data;
-- an account reads its own row (Q-01) and a Reviewer reads all accounts and the audit log (admin-command §7)
grant select on
  app.routes, app.checkpoints, app.qr_codes, app.revisions, app.media, app.journey_snapshots,
  app.admin_accounts, app.audit_records, app.session_records
to authenticated;

create policy routes_admin_read on app.routes for select to authenticated
  using ((app.current_admin()).email is not null);
create policy checkpoints_admin_read on app.checkpoints for select to authenticated
  using ((app.current_admin()).email is not null);
create policy qr_codes_admin_read on app.qr_codes for select to authenticated
  using ((app.current_admin()).email is not null);
create policy revisions_admin_read on app.revisions for select to authenticated
  using ((app.current_admin()).email is not null);
create policy media_admin_read on app.media for select to authenticated
  using ((app.current_admin()).email is not null);
create policy journey_snapshots_admin_read on app.journey_snapshots for select to authenticated
  using ((app.current_admin()).email is not null);
create policy session_records_admin_read on app.session_records for select to authenticated
  using ((app.current_admin()).email is not null);
create policy admin_accounts_own_or_reviewer_read on app.admin_accounts for select to authenticated
  using (user_id = auth.uid()::text or (app.current_admin()).role = 'REVIEWER');
create policy audit_records_reviewer_read on app.audit_records for select to authenticated
  using ((app.current_admin()).role = 'REVIEWER');
