-- pgTAP — M03 schema (tasks M03 T173): tables, keys, CHECKs, update guard, no DELETE/TRUNCATE, immutable identity
-- columns, indexes of Physical §10 (data-model §9; BR-M03-D12, E12, G08; FR-M03-010; DEC-S6-002).
-- Every row is created inside this transaction and rolled back.
begin;
create extension if not exists pgtap with schema extensions;
select plan(53);

-- ---- nine tables, RLS on every one (Physical §2, §9) ------------------------------------------------------
select tables_are('app', array[
  'routes', 'checkpoints', 'qr_codes', 'revisions', 'media', 'journey_snapshots', 'admin_accounts',
  'audit_records', 'session_records'], 'app holds exactly the nine M03 tables');
select ok(bool_and(c.relrowsecurity), 'RLS is enabled on every app table')
from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app' and c.relkind = 'r';

-- ---- keys ---------------------------------------------------------------------------------------------------
select col_is_pk('app', 'routes', 'route_id', 'routes PK');
select col_is_pk('app', 'qr_codes', 'qr_identifier', 'qr_codes PK');
select col_is_pk('app', 'journey_snapshots', array['route_id', 'content_version'], 'snapshot PK (route_id, content_version)');
select col_is_pk('app', 'admin_accounts', 'email', 'admin_accounts PK is the normalized email');
select col_is_unique('app', 'admin_accounts', 'user_id', 'user_id is unique');
select col_is_unique('app', 'revisions', array['subject_type', 'subject_id', 'revision_number'], 'revision number unique per subject');
select col_type_is('app', 'media', 'media_id', 'uuid', 'media_id is a uuid');
select col_type_is('app', 'session_records', 'session_id', 'uuid', 'session_id is a uuid');

-- ---- fixtures --------------------------------------------------------------------------------------------------
insert into app.routes (route_id, created_by_user_id) values ('r1', 'u1');
insert into app.checkpoints (checkpoint_id, created_by_user_id) values ('c1', 'u1');
insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('CHECKPOINT', 'c1', 1, '{"connectivityMode": "OFFLINE_REQUIRED"}', 'u1', 'u1');
insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id) values ('Qr00000000000001', 'c1', 'u1');
insert into app.media (owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes, created_by_user_id)
  values ('ROUTE', 'r1', 'ROUTE_THUMBNAIL', 'IMAGE', 'uploads/ROUTE/r1/a', 'image/jpeg', 1024, 'u1');
insert into app.admin_accounts (email, role) values ('a@example.test', 'REVIEWER');

-- ---- defaults and identities (DAC-M03-001, 002; PT-01, PT-04) ---------------------------------------------
select ok((select route_id <> '' and concurrency_revision = 1 and status = 'NHAP' from app.routes where route_id = 'r1'),
  'a new route starts NHAP with concurrency_revision 1');
select ok((select app.new_id() <> app.new_id()), 'app.new_id() gives a new opaque id each call');

-- ---- CHECKs ------------------------------------------------------------------------------------------------------
select throws_ok($$insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id) values ('short', 'c1', 'u1')$$,
  '23514', null, 'qrIdentifier must be at least 16 [A-Za-z0-9] (DAC-M03-003)');
select throws_ok($$insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id) values ('Has-dash-00000000', 'c1', 'u1')$$,
  '23514', null, 'qrIdentifier is URL-safe alphanumeric only');
select throws_ok($$insert into app.routes (created_by_user_id, status) values ('u1', 'CHO_DUYET')$$,
  '23514', null, 'route status enum has no CHO_DUYET (BR-M03-A05)');
select throws_ok($$update app.routes set status = 'TAM_DONG', concurrency_revision = 2 where route_id = 'r1'$$,
  '23514', null, 'TAM_DONG needs closure columns and an active version (DAC-M03-006, 007)');
select throws_ok($$insert into app.checkpoints (created_by_user_id, location_note) values ('u1', repeat('x', 301))$$,
  '23514', null, 'location note at most NOTE_MAX_CHARS (DAC-M03-011)');
select lives_ok($$insert into app.checkpoints (created_by_user_id, location_note) values ('u1', repeat('x', 300))$$,
  'location note exactly NOTE_MAX_CHARS is accepted');
select throws_ok($$insert into app.media (owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes, created_by_user_id)
  values ('ROUTE', 'r1', 'QR_MEDIA', 'IMAGE', 'p', 'image/png', 10, 'u1')$$, '23514', null, 'QR_MEDIA belongs to a checkpoint (DAC-M03-055)');
select throws_ok($$insert into app.media (owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes, created_by_user_id)
  values ('ROUTE', 'r1', 'ROUTE_MAP', 'IMAGE', 'p', 'image/gif', 10, 'u1')$$, '23514', null, 'image MIME types only (DAC-M03-056)');
select throws_ok($$insert into app.media (owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes, created_by_user_id)
  values ('ROUTE', 'r1', 'ROUTE_MAP', 'IMAGE', 'p', 'image/png', 2097153, 'u1')$$, '23514', null, 'image above IMAGE_MAX_MB (DAC-M03-058)');
select lives_ok($$insert into app.media (owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes, created_by_user_id)
  values ('ROUTE', 'r1', 'ROUTE_MAP', 'IMAGE', 'p2', 'image/png', 2097152, 'u1')$$, 'image of exactly IMAGE_MAX_MB is accepted');
select throws_ok($$insert into app.media (owner_type, owner_id, usage, type, spoken_language, source_ref, mime_type, file_size_bytes, created_by_user_id)
  values ('CHECKPOINT', 'c1', 'QR_MEDIA', 'IMAGE', 'vi', 'p', 'image/png', 10, 'u1')$$, '23514', null,
  'an image never has a spoken language; audio/video may lack one until publication (DAC-M03-059, D-95)');
select throws_ok($$update app.media set usage_rights_confirmed = true, concurrency_revision = 2 where source_ref = 'uploads/ROUTE/r1/a'$$,
  '23514', null, 'confirmed rights need who and when');
select throws_ok($$insert into app.admin_accounts (email, role) values ('  B@Example.test', 'REVIEWER')$$,
  '23514', null, 'email stored normalized (DAC-M03-068)');
select throws_ok($$insert into app.admin_accounts (email, role) values ('c@example.test', 'ADMIN')$$,
  '23514', null, 'role is one of the two fixed roles (BR-M03-A01)');
select throws_ok($$insert into app.audit_records (action, entity_type, entity_id, outcome, reason) values ('X', 'ROUTE', 'r1', 'SUCCESS', '  ')$$,
  '23514', null, 'a present audit reason is non-empty (DAC-M03-073)');
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, previous_content_version, checkpoints) values ('r1', 1, 1, '[]')$$,
  '23514', null, 'version 1 has no predecessor (DAC-M03-061)');
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, previous_content_version, checkpoints) values ('r1', 3, 1, '[]')$$,
  '23514', null, 'previous version is content_version - 1');

-- ---- update guard (PT-04, PT-05; DAC-M03-016) --------------------------------------------------------------
select throws_ok($$update app.routes set closure_reason = 'x' where route_id = 'r1'$$,
  '23514', null, 'an update must advance concurrency_revision by one');
select lives_ok($$update app.routes set closure_reason = 'x', concurrency_revision = 2 where route_id = 'r1'$$,
  'advancing by exactly one is accepted');

-- ---- immutable identity and ownership columns (Physical §8; BR-M03-E12) --------------------------------------
select throws_ok($$update app.routes set route_id = 'r2', concurrency_revision = 3 where route_id = 'r1'$$,
  '23001', null, 'route_id is immutable');
select throws_ok($$update app.qr_codes set checkpoint_id = 'c2', concurrency_revision = 2 where qr_identifier = 'Qr00000000000001'$$,
  '23001', null, 'a QR object never moves to another checkpoint (BR-M03-E12)');
select throws_ok($$update app.revisions set subject_id = 'c2', concurrency_revision = 2 where subject_id = 'c1'$$,
  '23001', null, 'revision subject is immutable');
select throws_ok($$update app.media set owner_id = 'r9', concurrency_revision = 2 where source_ref = 'uploads/ROUTE/r1/a'$$,
  '23001', null, 'media owner is immutable');
select throws_ok($$update app.media set source_ref = 'other', concurrency_revision = 2 where source_ref = 'uploads/ROUTE/r1/a'$$,
  '23001', null, 'a media object is never overwritten (source_ref immutable)');
select throws_ok($$update app.admin_accounts set email = 'z@example.test', concurrency_revision = 2 where email = 'a@example.test'$$,
  '23001', null, 'account email is immutable');

-- ---- no physical delete of any record or snapshot (DEC-S6-002; BR-M03-D12, G08) -----------------------------
select throws_ok($$delete from app.routes$$, '23001', null, 'routes: DELETE rejected');
select throws_ok($$delete from app.checkpoints$$, '23001', null, 'checkpoints: DELETE rejected');
select throws_ok($$delete from app.qr_codes$$, '23001', null, 'qr_codes: DELETE rejected');
select throws_ok($$delete from app.revisions$$, '23001', null, 'revisions: DELETE rejected');
select throws_ok($$delete from app.media$$, '23001', null, 'media: DELETE rejected');
-- the DELETE guard is row-level: give it a row (the deferred "active version is latest" check never runs — rollback)
insert into app.journey_snapshots (route_id, content_version, checkpoints) values ('r1', 1, '[]');
select throws_ok($$delete from app.journey_snapshots$$, '23001', null, 'journey_snapshots: DELETE rejected');
select throws_ok($$truncate app.audit_records$$, '23001', null, 'audit_records: TRUNCATE rejected');
select throws_ok($$truncate app.session_records$$, '23001', null, 'session_records: TRUNCATE rejected');
select throws_ok($$delete from app.admin_accounts$$, '23001', null, 'admin_accounts: DELETE rejected');

-- ---- append-only ------------------------------------------------------------------------------------------------
insert into app.audit_records (action, entity_type, entity_id, outcome) values ('X', 'ROUTE', 'r1', 'SUCCESS');
select throws_ok($$update app.audit_records set action = 'Y'$$, '23001', null, 'audit records are append-only');

-- ---- indexes (Physical §10) -------------------------------------------------------------------------------------
select has_index('app', 'revisions', 'revisions_subject_status', 'revisions (subject_type, subject_id, status)');
select has_index('app', 'revisions', 'revisions_route_checkpoint_list', 'partial GIN on route checkpointList');
select has_index('app', 'qr_codes', 'qr_codes_checkpoint_status', 'qr_codes (checkpoint_id, status)');
select has_index('app', 'media', 'media_owner', 'media (owner_type, owner_id)');
select has_index('app', 'session_records', 'session_records_ended_route', 'session_records (ended_at, route_id)');
select has_index('app', 'audit_records', 'audit_records_occurred', 'audit_records (occurred_at desc)');

select * from finish();
rollback;
