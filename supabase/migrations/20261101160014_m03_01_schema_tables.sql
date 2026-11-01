-- M03 migration 1 — schema, id/limit helpers, nine tables, common update guards, indexes
-- (Physical Schema §3–§5, §10, §13 step 1; tasks M03 T168; DEC-S6-002: no hard delete).
-- Cross-row validation, lifecycle and polymorphic triggers come in migration 2.

create schema if not exists app;
create schema if not exists api;

-- Functions are never executable by PUBLIC; each grant is explicit (Physical §9, PT-07). The PUBLIC EXECUTE
-- default is global: a per-schema `alter default privileges in schema …` cannot revoke it, so this one is global
-- for the migration role (functions created later by postgres, in any schema, start without PUBLIC EXECUTE)
alter default privileges for role postgres revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- PT-01: opaque system-generated id (a random UUID rendered as text); callers never supply it
create function app.new_id() returns text
language sql volatile
set search_path = ''
as $$ select gen_random_uuid()::text $$;

-- PT-02: every DAC numeric limit in one place. Values are PROVISIONAL (spec-M03 §5.3) and must equal
-- src/modules/m03/config/limits.ts; a change is one migration plus a spec edit.
create function app.limit(p_name text) returns integer
language plpgsql immutable parallel safe
set search_path = ''
as $$
begin
  return case p_name
    when 'NAME_MAX_CHARS' then 100
    when 'ROUTE_SHORT_DESC_MAX_CHARS' then 160
    when 'ROUTE_DESC_MAX_CHARS' then 2000
    when 'ROUTE_START_MAX_CHARS' then 500
    when 'ROUTE_PARTICIPATION_MAX_CHARS' then 300
    when 'ROUTE_PREPARATION_MAX_CHARS' then 500
    when 'ROUTE_BEST_TIME_MAX_CHARS' then 200
    when 'ROUTE_SAFETY_WARNING_MAX_CHARS' then 500
    when 'ROUTE_HIGHLIGHTS_MAX_ITEMS' then 5
    when 'ROUTE_HIGHLIGHT_MAX_CHARS' then 80
    when 'CAPTION_MAX_CHARS' then 200
    when 'NOTE_MAX_CHARS' then 300
    when 'QR_INTRO_MIN_CHARS' then 30
    when 'QR_INTRO_MAX_CHARS' then 2000
    when 'ROUTE_GALLERY_MAX_IMAGES' then 8
    when 'ROUTE_DISTANCE_MAX_KM' then 100
    when 'ROUTE_DURATION_MAX_MIN' then 1440
    when 'ROUTE_CHECKPOINTS_MAX_ITEMS' then 30
    when 'CHECKPOINT_QR_MAX_ITEMS' then 20
    when 'REPORT_MAX_SPAN_DAYS' then 366
    when 'REPORT_DEFAULT_SPAN_DAYS' then 30
    when 'QR_MAX_IMAGES' then 5
    when 'QR_MAX_AV_FILES' then 3
    when 'IMAGE_MAX_MB' then 2
    when 'AUDIO_MAX_MB' then 5
    when 'VIDEO_MAX_MB' then 30
    when 'OFFLINE_PACKAGE_MAX_MB' then 50
    when 'EMAIL_MAX_CHARS' then 254
    when 'BYTES_PER_MB' then 1048576
    else null
  end;
end;
$$;

-- PT-09: characters counted after trimming leading/trailing whitespace (spec-M03 §5.3)
create function app.text_len(p_value text) returns integer
language sql immutable parallel safe
set search_path = ''
as $$ select char_length(btrim(p_value, E' \t\r\n')) $$;

-- Reason / note: non-empty after trim and at most NOTE_MAX_CHARS (DAC-M03-008, 011, 014, 073)
create function app.note_ok(p_value text, p_required boolean default false) returns boolean
language sql immutable parallel safe
set search_path = ''
as $$
  select case
    when p_value is null then not p_required
    else app.text_len(p_value) between (case when p_required then 1 else 0 end) and app.limit('NOTE_MAX_CHARS')
  end
$$;

-- Present reason must be non-empty (closure, status reason, audit reason)
create function app.reason_ok(p_value text) returns boolean
language sql immutable parallel safe
set search_path = ''
as $$ select p_value is null or app.text_len(p_value) between 1 and app.limit('NOTE_MAX_CHARS') $$;

-- ---------------------------------------------------------------------------
-- Common guards (Physical §5 common rules, §8 immutability)
-- ---------------------------------------------------------------------------

-- No hard delete or purge in the MVP (DEC-S6-002)
create function app.tg_reject_delete() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'app.%: % is not allowed (DEC-S6-002)', tg_table_name, tg_op using errcode = 'restrict_violation';
end;
$$;

-- Append-only tables reject every update (snapshots, audit, session records)
create function app.tg_reject_update() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'app.%: rows are immutable', tg_table_name using errcode = 'restrict_violation';
end;
$$;

-- BEFORE UPDATE: concurrency_revision advances by exactly one (PT-04, DAC-M03-016);
-- updated_at from the database clock where the column exists (PT-05)
create function app.tg_update_guard() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.concurrency_revision is distinct from old.concurrency_revision + 1 then
    raise exception 'app.%: concurrency_revision must advance by one (% -> %)',
      tg_table_name, old.concurrency_revision, new.concurrency_revision
      using errcode = 'check_violation';
  end if;
  if tg_argv[0] = 'updated_at' then
    new := jsonb_populate_record(new, jsonb_build_object('updated_at', now()));
  end if;
  return new;
end;
$$;

-- Identity and ownership columns never change (Physical §8); column names are trigger arguments
create function app.tg_immutable_columns() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_column text;
begin
  foreach v_column in array tg_argv loop
    if v_old -> v_column is distinct from v_new -> v_column then
      raise exception 'app.%: column % is immutable', tg_table_name, v_column using errcode = 'restrict_violation';
    end if;
  end loop;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables (Physical §5.1–§5.9)
-- ---------------------------------------------------------------------------

-- §5.1 Route — content lives in app.revisions (subject_type ROUTE)
create table app.routes (
  route_id text primary key default app.new_id(),
  status text not null default 'NHAP' check (status in ('NHAP', 'HOAT_DONG', 'TAM_DONG', 'LUU_TRU')),
  active_content_version integer,
  closure_source text check (closure_source in ('MANUAL', 'AUTO_NO_ACTIVE_CHECKPOINT')),
  closure_reason text check (app.reason_ok(closure_reason)),
  closed_at timestamptz,
  closed_by_user_id text,
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  concurrency_revision integer not null default 1,
  -- DAC-M03-006: required once published (not forced for LUU_TRU: a discarded draft never had one)
  constraint routes_active_version_required
    check (status not in ('HOAT_DONG', 'TAM_DONG') or active_content_version is not null),
  -- DAC-M03-007
  constraint routes_closure_complete check (
    status <> 'TAM_DONG'
    or (closure_source is not null and closure_reason is not null and closed_at is not null and closed_by_user_id is not null)
  )
);

-- §5.2 Checkpoint — name, mode and field verification live in app.revisions (subject_type CHECKPOINT)
create table app.checkpoints (
  checkpoint_id text primary key default app.new_id(),
  status text not null default 'NHAP' check (status in ('NHAP', 'HOAT_DONG', 'TAM_DONG', 'LUU_TRU')),
  location_note text check (app.note_ok(location_note)),
  closure_reason text check (app.reason_ok(closure_reason)),
  closed_at timestamptz,
  closed_by_user_id text,
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  concurrency_revision integer not null default 1,
  -- DAC-M03-010
  constraint checkpoints_closure_complete
    check (status <> 'TAM_DONG' or (closure_reason is not null and closed_at is not null and closed_by_user_id is not null))
);

-- §5.3 QRCode — the public link is derived and never stored
create table app.qr_codes (
  qr_identifier text primary key check (qr_identifier ~ '^[A-Za-z0-9]{16,}$'),
  checkpoint_id text not null references app.checkpoints (checkpoint_id),
  installation_label text check (app.note_ok(installation_label)),
  status text not null default 'NHAP' check (status in ('NHAP', 'HOAT_DONG', 'THU_HOI')),
  -- required on user revoke, optional on discard, absent on archive cascade: the revoke command enforces it
  status_reason text check (app.reason_ok(status_reason)),
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  concurrency_revision integer not null default 1
);

-- §5.4 Revision — content validated by trigger in migration 2 (§5.4.1), not by a table CHECK
create table app.revisions (
  revision_id text primary key default app.new_id(),
  subject_type text not null check (subject_type in ('ROUTE', 'CHECKPOINT', 'QRCODE')),
  subject_id text not null,
  revision_number integer not null check (revision_number >= 1),
  status text not null default 'NHAP' check (status in ('NHAP', 'PHAT_HANH', 'LUU_TRU', 'DA_BO')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  based_on_revision_number integer check (based_on_revision_number >= 1),
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  last_edited_by_user_id text not null,
  last_edited_at timestamptz not null default now(),
  published_by_user_id text,
  published_at timestamptz,
  self_published boolean,
  concurrency_revision integer not null default 1,
  constraint revisions_number_unique unique (subject_type, subject_id, revision_number),
  -- DAC-M03-022: publication triple required once published; self flag means publisher = last editor
  constraint revisions_published_triple check (
    status not in ('PHAT_HANH', 'LUU_TRU')
    or (published_by_user_id is not null and published_at is not null and self_published is not null)
  ),
  constraint revisions_self_published
    check (self_published is null or self_published = (published_by_user_id = last_edited_by_user_id))
);

-- DAC-M03-020: at most one pending draft and one published revision per subject
create unique index revisions_one_draft on app.revisions (subject_type, subject_id) where status = 'NHAP';
create unique index revisions_one_published on app.revisions (subject_type, subject_id) where status = 'PHAT_HANH';

-- §5.5 Media — never deleted or overwritten
create table app.media (
  media_id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('ROUTE', 'CHECKPOINT')),
  owner_id text not null,
  usage text not null check (usage in ('ROUTE_THUMBNAIL', 'ROUTE_GALLERY', 'ROUTE_MAP', 'QR_MEDIA')),
  type text not null check (type in ('IMAGE', 'AUDIO', 'VIDEO')),
  spoken_language text check (spoken_language in ('vi', 'en', 'NONE')),
  source_ref text not null check (btrim(source_ref) <> ''),
  mime_type text not null,
  file_size_bytes integer not null,
  usage_rights_confirmed boolean not null default false,
  usage_rights_confirmed_by_user_id text,
  usage_rights_confirmed_at timestamptz,
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  concurrency_revision integer not null default 1,
  -- DAC-M03-055: route usages are route images; QR media belongs to a checkpoint
  constraint media_usage_owner check (
    (usage in ('ROUTE_THUMBNAIL', 'ROUTE_GALLERY', 'ROUTE_MAP') and owner_type = 'ROUTE' and type = 'IMAGE')
    or (usage = 'QR_MEDIA' and owner_type = 'CHECKPOINT')
  ),
  -- DAC-M03-059: spoken language exactly for audio/video
  constraint media_spoken_language check ((spoken_language is not null) = (type in ('AUDIO', 'VIDEO'))),
  -- DAC-M03-056, 057
  constraint media_mime_type check (
    (type = 'IMAGE' and mime_type in ('image/jpeg', 'image/png', 'image/webp'))
    or (type = 'AUDIO' and mime_type in ('audio/mpeg', 'audio/mp4'))
    or (type = 'VIDEO' and mime_type = 'video/mp4')
  ),
  -- DAC-M03-058
  constraint media_file_size check (
    file_size_bytes > 0
    and file_size_bytes <= app.limit('BYTES_PER_MB') * case type
      when 'IMAGE' then app.limit('IMAGE_MAX_MB')
      when 'AUDIO' then app.limit('AUDIO_MAX_MB')
      else app.limit('VIDEO_MAX_MB')
    end
  ),
  constraint media_rights_confirmed_by check (
    not usage_rights_confirmed
    or (usage_rights_confirmed_by_user_id is not null and usage_rights_confirmed_at is not null)
  )
);

-- §5.6 JourneySnapshot — append-only; shape CHECKs on the jsonb columns are added in migration 2
create table app.journey_snapshots (
  route_id text not null references app.routes (route_id),
  content_version integer not null check (content_version >= 1),
  status text not null default 'DA_CONG_BO' check (status = 'DA_CONG_BO'),
  published_at timestamptz not null default now(),
  previous_content_version integer,
  estimated_offline_size_bytes integer check (estimated_offline_size_bytes >= 0),
  offline_route_map jsonb,
  checkpoints jsonb not null,
  primary key (route_id, content_version),
  -- REL-021 / DAC-M03-061: single chain, no gap
  constraint journey_snapshots_previous check (
    (content_version = 1 and previous_content_version is null)
    or (content_version > 1 and previous_content_version = content_version - 1)
  ),
  constraint journey_snapshots_previous_fk
    foreign key (route_id, previous_content_version) references app.journey_snapshots (route_id, content_version)
);

-- REL-006: the route's active version references one of its snapshots; deferred because the snapshot
-- and the route switch in the same transaction (highest-version rule: trigger in migration 2)
alter table app.routes
  add constraint routes_active_snapshot_fk
  foreign key (route_id, active_content_version) references app.journey_snapshots (route_id, content_version)
  deferrable initially deferred;

-- §5.7 AdminAccount — no FK to auth.users (removing a provider identity keeps account and history)
create table app.admin_accounts (
  email text primary key
    check (email = lower(btrim(email)) and char_length(email) between 1 and app.limit('EMAIL_MAX_CHARS')),
  user_id text unique,
  role text not null check (role in ('CONTENT_STAFF', 'REVIEWER')),
  status text not null default 'INVITATION_PENDING' check (status in ('INVITATION_PENDING', 'ACTIVE', 'DEACTIVATED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  concurrency_revision integer not null default 1,
  -- DAC-M03-070, 071
  constraint admin_accounts_user_id_by_status check ((user_id is null) = (status = 'INVITATION_PENDING'))
);

-- §5.8 AuditRecord — append-only; action is free text (admin-command §5 lists the values used)
create table app.audit_records (
  audit_id text primary key default app.new_id(),
  actor_user_id text references app.admin_accounts (user_id),
  action text not null check (btrim(action) <> ''),
  entity_type text not null,
  entity_id text not null,
  revision integer,
  reason text check (app.reason_ok(reason)),
  outcome text not null check (outcome in ('SUCCESS', 'FAILURE')),
  self_published boolean,
  before_state jsonb,
  after_state jsonb,
  occurred_at timestamptz not null default now()
);

-- §5.9 SessionRecord — append-only; visits checked by app.visits_ok (migration 2) and by intake
create table app.session_records (
  session_id uuid primary key,
  route_id text not null references app.routes (route_id),
  content_version integer not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  status text not null check (status in ('HOAN_TAT', 'BO_DO')),
  visited_checkpoints jsonb not null,
  ingested_at timestamptz not null default now(),
  constraint session_records_interval check (ended_at >= started_at),
  constraint session_records_snapshot_fk
    foreign key (route_id, content_version) references app.journey_snapshots (route_id, content_version)
);

-- ---------------------------------------------------------------------------
-- Common triggers
-- ---------------------------------------------------------------------------

-- No DELETE / TRUNCATE on any of the nine tables (DEC-S6-002)
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'routes', 'checkpoints', 'qr_codes', 'revisions', 'media',
    'journey_snapshots', 'admin_accounts', 'audit_records', 'session_records'
  ] loop
    execute format(
      'create trigger %1$s_no_delete before delete on app.%1$s for each row execute function app.tg_reject_delete()',
      v_table);
    execute format(
      'create trigger %1$s_no_truncate before truncate on app.%1$s for each statement execute function app.tg_reject_delete()',
      v_table);
  end loop;
end;
$$;

-- Append-only tables
create trigger journey_snapshots_no_update before update on app.journey_snapshots
  for each row execute function app.tg_reject_update();
create trigger audit_records_no_update before update on app.audit_records
  for each row execute function app.tg_reject_update();
create trigger session_records_no_update before update on app.session_records
  for each row execute function app.tg_reject_update();

-- concurrency_revision + updated_at
create trigger routes_update_guard before update on app.routes
  for each row execute function app.tg_update_guard('updated_at');
create trigger checkpoints_update_guard before update on app.checkpoints
  for each row execute function app.tg_update_guard('updated_at');
create trigger qr_codes_update_guard before update on app.qr_codes
  for each row execute function app.tg_update_guard('updated_at');
create trigger admin_accounts_update_guard before update on app.admin_accounts
  for each row execute function app.tg_update_guard('updated_at');
create trigger revisions_update_guard before update on app.revisions
  for each row execute function app.tg_update_guard('none');
create trigger media_update_guard before update on app.media
  for each row execute function app.tg_update_guard('none');

-- Immutable identity and ownership columns (Physical §8)
create trigger routes_immutable before update on app.routes
  for each row execute function app.tg_immutable_columns('route_id', 'created_by_user_id', 'created_at');
create trigger checkpoints_immutable before update on app.checkpoints
  for each row execute function app.tg_immutable_columns('checkpoint_id', 'created_by_user_id', 'created_at');
create trigger qr_codes_immutable before update on app.qr_codes
  for each row execute function app.tg_immutable_columns('qr_identifier', 'checkpoint_id', 'created_by_user_id', 'created_at');
create trigger revisions_immutable before update on app.revisions
  for each row execute function app.tg_immutable_columns(
    'revision_id', 'subject_type', 'subject_id', 'revision_number', 'created_by_user_id', 'created_at');
create trigger media_immutable before update on app.media
  for each row execute function app.tg_immutable_columns(
    'media_id', 'owner_type', 'owner_id', 'usage', 'type', 'source_ref', 'mime_type', 'file_size_bytes',
    'created_by_user_id', 'created_at');
create trigger admin_accounts_immutable before update on app.admin_accounts
  for each row execute function app.tg_immutable_columns('email', 'created_at');

-- ---------------------------------------------------------------------------
-- Indexes (Physical §10). Primary and unique keys above implement the declared identities.
-- ---------------------------------------------------------------------------

create index revisions_subject_status on app.revisions (subject_type, subject_id, status);
-- reverse lookup "which routes list this checkpoint" (BR-M03-D10, T01, X02)
create index revisions_route_checkpoint_list on app.revisions
  using gin ((content -> 'checkpointList') jsonb_path_ops)
  where subject_type = 'ROUTE' and status in ('NHAP', 'PHAT_HANH');
create index qr_codes_checkpoint_status on app.qr_codes (checkpoint_id, status);
create index media_owner on app.media (owner_type, owner_id);
create index session_records_ended_route on app.session_records (ended_at, route_id);
create index session_records_route_ended on app.session_records (route_id, ended_at);
create index audit_records_occurred on app.audit_records (occurred_at desc);
create index audit_records_entity on app.audit_records (entity_type, entity_id);
create index audit_records_actor on app.audit_records (actor_user_id);
-- No index on snapshot JSON (Physical §10)
