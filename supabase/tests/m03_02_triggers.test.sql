-- pgTAP — M03 validation functions and triggers (tasks M03 T174; Physical §5.4.1, §5.6, §6, §8; S4 §8;
-- research R-27; DAC-M03-005, 006, 009, 012, 013, 015, 020, 023–053, 061–066, 079, 087–089; BR-M03-K03, D10).
begin;
create extension if not exists pgtap with schema extensions;
select plan(69);

-- ---- app.revision_content_problems: save-time shape and limits (DAC-M03-023–053, 087, 088) ------------------
create function pg_temp.route(p_extra jsonb) returns jsonb language sql as $$
  select '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": false}'::jsonb || p_extra $$;
create function pg_temp.problems(p_type text, p_content jsonb) returns text[] language sql as $$
  select app.revision_content_problems(p_type, p_content) $$;

select is(pg_temp.problems('ROUTE', pg_temp.route('{}')), '{}', 'an empty route draft is valid (BR-M03-C03)');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('name', jsonb_build_object('vi', repeat('a', 100))))), '{}',
  'name of exactly NAME_MAX_CHARS');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('name', jsonb_build_object('en', repeat('a', 101))))), '{name.en}',
  'name above NAME_MAX_CHARS');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('name', jsonb_build_object('vi', '  ' || repeat('a', 100) || '  ')))), '{}',
  'length counted after trimming (PT-09)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"name": {"vi": "a\nb"}}')), '{name.vi}', 'name is single-line (DAC-M03-088)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"description": {"vi": "a\nb"}}')), '{}', 'description keeps line breaks (DAC-M03-087)');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('shortDescription', jsonb_build_object('vi', repeat('a', 161))))),
  '{shortDescription.vi}', 'short description above ROUTE_SHORT_DESC_MAX_CHARS');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('safetyWarning', jsonb_build_object('en', repeat('a', 501))))),
  '{safetyWarning.en}', 'safety warning above ROUTE_SAFETY_WARNING_MAX_CHARS');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"distanceKm": 0}')), '{distanceKm}', 'distance > 0 (DAC-M03-032)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"distanceKm": 100}')), '{}', 'distance of exactly ROUTE_DISTANCE_MAX_KM');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"distanceKm": 100.1}')), '{distanceKm}', 'distance above ROUTE_DISTANCE_MAX_KM');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"distanceKm": 2.55}')), '{distanceKm}', 'distance has one decimal at most');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"durationMin": 1440}')), '{}', 'duration of exactly ROUTE_DURATION_MAX_MIN');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"durationMin": 1441}')), '{durationMin}', 'duration above the limit');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"durationMin": 90.5}')), '{durationMin}', 'duration is an integer');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"difficulty": "DE"}')), '{difficulty}', 'difficulty enum (DAC-M03-033)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"groupTags": ["GROUP_CA_NHAN_NGUOI_LON", "GROUP_CA_NHAN_NGUOI_LON"]}')), '{groupTags}',
  'tags are distinct (DAC-M03-034)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"difficulty": "KHO", "groupTags": ["GROUP_GIA_DINH_CO_TRE"]}')), '{groupTags}',
  'KHO with family tag is contradictory (DAC-M03-035)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"difficulty": "KHO", "groupTags": ["GROUP_CAN_DE_DANG"]}')), '{groupTags}',
  'KHO with easy-access tag is contradictory');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"difficulty": "TRUNG_BINH", "groupTags": ["GROUP_GIA_DINH_CO_TRE"]}')), '{}',
  'family tag with another difficulty is fine');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('galleryItems',
  (select jsonb_agg(jsonb_build_object('mediaId', gen_random_uuid())) from generate_series(1, 9))))), '{galleryItems}',
  'gallery above ROUTE_GALLERY_MAX_IMAGES (DAC-M03-037; BR-M03-C14)');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('galleryItems', jsonb_build_array(
  jsonb_build_object('mediaId', gen_random_uuid(), 'caption', jsonb_build_object('vi', E'a\nb')))))), '{galleryCaption.0.vi}',
  'gallery caption is single-line (DAC-M03-038)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"routeMapCaption": {"vi": "Sơ đồ"}}')), '{routeMapCaption}',
  'route map caption only with a route map (DAC-M03-038)');
select is(pg_temp.problems('ROUTE', '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": true}'), '{offlineRouteMapRequired}',
  'offline map tick only with a route map (DAC-M03-040)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"checkpointList": [{"checkpointId": "c"}, {"checkpointId": "c"}]}')), '{checkpointList}',
  'a checkpoint appears once in a list (DAC-M03-041; BR-M03-T09)');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('checkpointList',
  (select jsonb_agg(jsonb_build_object('checkpointId', 'c' || i)) from generate_series(1, 31) as i)))), '{checkpointList}',
  'list above ROUTE_CHECKPOINTS_MAX_ITEMS (BR-M03-T09)');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('highlights',
  (select jsonb_agg(jsonb_build_object('vi', 'x', 'en', 'y')) from generate_series(1, 6))))), '{highlights}',
  'highlights above ROUTE_HIGHLIGHTS_MAX_ITEMS (DAC-M03-043)');
select is(pg_temp.problems('ROUTE', pg_temp.route(jsonb_build_object('highlights', jsonb_build_array(jsonb_build_object('vi', repeat('x', 81)))))),
  '{highlights.0.vi}', 'highlight above ROUTE_HIGHLIGHT_MAX_CHARS');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"highlights": [{"vi": "Cây chò"}]}')), '{}',
  'a one-language highlight is a valid draft (spec-M03 BR-M03-C06)');
select is(pg_temp.problems('ROUTE', pg_temp.route('{"timeTags": ["TIME_NGAN"]}')), '{timeTags}', 'derived values are never input (BR-M03-C11)');
select is(pg_temp.problems('CHECKPOINT', '{"connectivityMode": "ONLINE_AVAILABLE"}'), '{fieldVerificationConfirmed}',
  'ONLINE_AVAILABLE needs the field-verification tick (DAC-M03-048)');
select is(pg_temp.problems('CHECKPOINT',
  '{"connectivityMode": "ONLINE_AVAILABLE", "fieldVerificationConfirmed": true, "fieldVerifiedByUserId": "u", "fieldVerifiedAt": "2026-10-31T00:00:00Z"}'),
  '{}', 'ONLINE_AVAILABLE with the tick, who and when');
select is(pg_temp.problems('CHECKPOINT', '{"checkpointName": {"vi": "a\rb"}}'), '{checkpointName.vi}', 'checkpoint name single-line');
select is(pg_temp.problems('QRCODE', jsonb_build_object('introductionText', jsonb_build_object('vi', repeat('x', 2001)))), '{introductionText.vi}',
  'introduction above QR_INTRO_MAX_CHARS (DAC-M03-052)');
select is(pg_temp.problems('QRCODE', '{"introductionText": {"vi": "ngắn"}}'), '{}',
  'a short introduction is incomplete, not invalid: it blocks only publication (DAC-M03-052)');
select is(pg_temp.problems('QRCODE', jsonb_build_object('mediaItems', jsonb_build_array(
  jsonb_build_object('mediaId', '00000000-0000-4000-8000-0000000000aa'), jsonb_build_object('mediaId', '00000000-0000-4000-8000-0000000000aa')))),
  '{mediaItems}', 'a media item appears once');

-- ---- fixtures ----------------------------------------------------------------------------------------------------
insert into app.routes (route_id, created_by_user_id) values ('r1', 'u1'), ('r2', 'u1');
insert into app.checkpoints (checkpoint_id, created_by_user_id) values ('c1', 'u1'), ('c2', 'u1'), ('c3', 'u1');
insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id) values
  ('CHECKPOINT', 'c1', 1, '{"checkpointName": {"vi": "Hang", "en": "Cave"}, "connectivityMode": "OFFLINE_REQUIRED"}', 'u1', 'u1'),
  ('CHECKPOINT', 'c2', 1, '{"checkpointName": {"vi": "Rừng", "en": "Forest"}, "connectivityMode": "OFFLINE_REQUIRED"}', 'u1', 'u1');
insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id) values
  ('Qr00000000000001', 'c1', 'u1'), ('Qr00000000000002', 'c2', 'u1');
insert into app.media (media_id, owner_type, owner_id, usage, type, spoken_language, source_ref, mime_type, file_size_bytes, created_by_user_id) values
  ('00000000-0000-4000-8000-000000000001', 'ROUTE', 'r2', 'ROUTE_THUMBNAIL', 'IMAGE', null, 'uploads/ROUTE/r2/a', 'image/jpeg', 10, 'u1'),
  ('00000000-0000-4000-8000-000000000002', 'CHECKPOINT', 'c1', 'QR_MEDIA', 'AUDIO', 'vi', 'uploads/CHECKPOINT/c1/a', 'audio/mpeg', 10, 'u1');
-- publish c1 and its QR (deferred "active checkpoint keeps an active QR" is satisfied)
update app.revisions set status = 'PHAT_HANH', published_by_user_id = 'u1', published_at = now(), self_published = true,
  concurrency_revision = 2 where subject_id = 'c1';
update app.checkpoints set status = 'HOAT_DONG', concurrency_revision = 2 where checkpoint_id = 'c1';
update app.qr_codes set status = 'HOAT_DONG', concurrency_revision = 2 where qr_identifier = 'Qr00000000000001';

-- ---- content trigger (R-27) ------------------------------------------------------------------------------------
select throws_ok($$insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('ROUTE', 'r1', 1, '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": false, "distanceKm": -1}', 'u1', 'u1')$$,
  '23514', 'REVISION_CONTENT_INVALID', 'invalid content is rejected on insert');
-- a status-only update of an older revision is not re-checked against limits changed later
set local session_replication_role = replica;
insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('ROUTE', 'r1', 1, '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": false, "distanceKm": 999}', 'u1', 'u1');
set local session_replication_role = origin;
select lives_ok($$update app.revisions set status = 'DA_BO', concurrency_revision = 2 where subject_id = 'r1'$$,
  'a status-only update skips the content check (R-27)');
select throws_ok($$update app.revisions set content = '{}', concurrency_revision = 3 where subject_id = 'c1'$$,
  '23001', null, 'published content is immutable');
select throws_ok($$update app.revisions set status = 'NHAP', concurrency_revision = 3 where subject_id = 'r1'$$,
  '23001', null, 'a discarded revision never changes again (DA_BO terminal)');

-- ---- lifecycle transitions (S4 §8; DAC-M03-005, 009, 013, 020) -----------------------------------------------
select throws_ok($$insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id)
  values ('CHECKPOINT', 'c3', 1, 'PHAT_HANH', '{}', 'u1', 'u1')$$, '23514', null, 'a revision is created as NHAP only');
select throws_ok($$update app.routes set status = 'TAM_DONG', concurrency_revision = 2 where route_id = 'r2'$$,
  '23514', null, 'route NHAP -> TAM_DONG is not a transition');
select lives_ok($$update app.routes set status = 'LUU_TRU', concurrency_revision = 2 where route_id = 'r2'$$,
  'route NHAP -> LUU_TRU (discard) is allowed');
select throws_ok($$update app.routes set concurrency_revision = 3 where route_id = 'r2'$$,
  '23001', null, 'an archived route is read-only (LUU_TRU terminal)');
select throws_ok($$update app.qr_codes set status = 'NHAP', concurrency_revision = 3 where qr_identifier = 'Qr00000000000001'$$,
  '23514', null, 'QR HOAT_DONG -> NHAP is not a transition');
select throws_ok($$insert into app.admin_accounts (email, role, status, user_id) values ('x@example.test', 'REVIEWER', 'ACTIVE', 'ux')$$,
  '23514', null, 'an account is created INVITATION_PENDING (BR-M03-K01)');

-- ---- polymorphic references (REL-004, 023–026) ------------------------------------------------------------------
select throws_ok($$insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('QRCODE', 'missing', 1, '{}', 'u1', 'u1')$$, '23503', null, 'revision subject must exist');
select throws_ok($$insert into app.media (owner_type, owner_id, usage, type, source_ref, mime_type, file_size_bytes, created_by_user_id)
  values ('ROUTE', 'missing', 'ROUTE_MAP', 'IMAGE', 'p', 'image/png', 1, 'u1')$$, '23503', null, 'media owner must exist');

-- ---- cross-row content rules (REL-022, REL-027) -----------------------------------------------------------------
insert into app.routes (route_id, created_by_user_id) values ('r3', 'u1');
select throws_ok($$insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('ROUTE', 'r3', 1, '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": false,
    "thumbnailMediaId": "00000000-0000-4000-8000-000000000001"}', 'u1', 'u1')$$,
  '23503', null, 'a route uses only its own media (DAC-M03-036)');
select throws_ok($$insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('ROUTE', 'r3', 1, '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": false,
    "checkpointList": [{"checkpointId": "c2"}]}', 'u1', 'u1')$$,
  '23503', null, 'a newly listed checkpoint must be active (BR-M03-T01)');
select lives_ok($$insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('ROUTE', 'r3', 1, '{"noSafetyWarningConfirmed": false, "offlineRouteMapRequired": false,
    "checkpointList": [{"checkpointId": "c1"}]}', 'u1', 'u1')$$, 'an active checkpoint can be listed');
select throws_ok($$insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('QRCODE', 'Qr00000000000002', 1, '{"mediaItems": [{"mediaId": "00000000-0000-4000-8000-000000000002"}]}', 'u1', 'u1')$$,
  '23503', null, 'a QR object uses only QR_MEDIA of its own checkpoint (DAC-M03-053)');
select throws_ok($$insert into app.revisions (subject_type, subject_id, revision_number, content, created_by_user_id, last_edited_by_user_id)
  values ('QRCODE', 'Qr00000000000001', 1, '{"mediaItems": [{"mediaId": "00000000-0000-4000-8000-000000000002"}]}', 'u1', 'u1')$$,
  '23514', null, 'audio/video only for ONLINE_AVAILABLE checkpoints (BR-M03-E04)');

-- ---- QR rules (DAC-M03-012, 015, 089) ----------------------------------------------------------------------------
select throws_ok($$insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id) values ('Qr00000000000003', 'c3', 'u1')$$,
  '23514', null, 'no QR before the checkpoint has a saved connectivity mode (BR-M03-E15)');
select throws_ok($$insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id)
  select 'QrMany' || lpad(i::text, 10, '0'), 'c2', 'u1' from generate_series(1, 20) as i$$,
  '23514', null, 'at most CHECKPOINT_QR_MAX_ITEMS non-revoked visit points per checkpoint');
select lives_ok($$insert into app.qr_codes (qr_identifier, checkpoint_id, created_by_user_id)
  select 'QrMany' || lpad(i::text, 10, '0'), 'c2', 'u1' from generate_series(1, 19) as i$$,
  'exactly CHECKPOINT_QR_MAX_ITEMS is accepted (one existed already)');
savepoint last_qr;
update app.qr_codes set status = 'THU_HOI', concurrency_revision = 3 where qr_identifier = 'Qr00000000000001';
select throws_ok($$set constraints all immediate$$, '23514', null,
  'an active checkpoint keeps at least one active visit point (BR-M03-E11), checked at commit');
rollback to savepoint last_qr;

-- ---- checkpoint archive (BR-M03-D10) -----------------------------------------------------------------------------
update app.checkpoints set status = 'TAM_DONG', closure_reason = 'x', closed_at = now(), closed_by_user_id = 'u1',
  concurrency_revision = 3 where checkpoint_id = 'c1';
select throws_ok($$update app.checkpoints set status = 'LUU_TRU', concurrency_revision = 4 where checkpoint_id = 'c1'$$,
  '23001', null, 'a checkpoint listed by a non-archived route (draft list included) cannot be archived');

-- ---- snapshots (DAC-M03-006, 061–066) ----------------------------------------------------------------------------
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, checkpoints)
  values ('r3', 1, '[{"checkpointId": "c1", "sequence": 1, "checkpointName": {"vi": "Hang", "en": "Cave"},
    "connectivityMode": "OFFLINE_REQUIRED", "qrIdentifiers": ["Qr00000000000001"]}]')$$,
  '23514', null, 'an OFFLINE_REQUIRED checkpoint carries one offline resource per identifier (DAC-M03-065)');
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, checkpoints)
  values ('r3', 1, '[{"checkpointId": "c1", "sequence": 1, "checkpointName": {"vi": "Hang", "en": "Cave"},
    "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": []}]')$$,
  '23514', null, 'qrIdentifiers is never empty (DAC-M03-064)');
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, checkpoints)
  values ('r3', 1, '[{"checkpointId": "a", "sequence": 1, "checkpointName": {"vi": "A", "en": "A"}, "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": ["q1"]},
                     {"checkpointId": "b", "sequence": 1, "checkpointName": {"vi": "B", "en": "B"}, "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": ["q2"]}]')$$,
  '23514', null, 'sequences are unique within a snapshot (DAC-M03-063)');
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, checkpoints)
  values ('r3', 1, '[{"checkpointId": "c1", "sequence": 1, "checkpointName": {"vi": "Hang"},
    "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": ["Qr00000000000001"]}]')$$,
  '23514', null, 'a checkpoint name missing a language is refused, not passed as null (DAC-M03-064)');
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, checkpoints)
  values ('r3', 1, '[{"checkpointId": "c1", "sequence": 1, "checkpointName": {"vi": "Hang", "en": "Cave"},
    "connectivityMode": "OFFLINE_REQUIRED", "qrIdentifiers": ["Qr00000000000001"],
    "offlineResources": [{"qrIdentifier": "Qr00000000000001", "objectName": {"vi": "Đá", "en": "Rock"},
      "localizedContent": {"vi": {"introductionText": "Giới thiệu"}}, "staticImages": []}]}]')$$,
  '23514', null, 'an offline resource missing the English introduction is refused (DAC-M03-065)');
select throws_ok($$insert into app.journey_snapshots (route_id, content_version, checkpoints, offline_route_map)
  values ('r3', 1, '[]', '{"sourceRef": "uploads/ROUTE/r3/map.jpg", "caption": {"vi": "Bản đồ"}}')$$,
  '23514', null, 'a route map caption missing a language is refused (DAC-M03-066)');
savepoint latest;
insert into app.journey_snapshots (route_id, content_version, checkpoints) values ('r3', 1, '[]');
select throws_ok($$set constraints all immediate$$, '23514', null,
  'a new snapshot that does not become the active version is refused at commit (DAC-M03-006)');
rollback to savepoint latest;

-- ---- session visits (DAC-M03-079, 080) ---------------------------------------------------------------------------
select ok(app.visits_ok('[{"checkpointId": "c1", "checkpointName": "Hang", "sequence": 1, "checkedInAt": "2026-10-31T01:00:00Z"}]'),
  'a visit with exactly the four allowlisted keys');
select ok(not app.visits_ok('[{"checkpointId": "c1", "checkpointName": "Hang", "sequence": 1, "checkedInAt": "2026-10-31T01:00:00Z", "deviceId": "x"}]'),
  'any other key (device, GPS, visitor) is refused');

-- ---- last active Reviewer (BR-M03-K03) ---------------------------------------------------------------------------
insert into app.admin_accounts (email, role) values ('rv@example.test', 'REVIEWER');
update app.admin_accounts set status = 'ACTIVE', user_id = 'u-rv', concurrency_revision = 2 where email = 'rv@example.test';
select throws_ok($$update app.admin_accounts set status = 'DEACTIVATED', concurrency_revision = concurrency_revision + 1 where role = 'REVIEWER' and status = 'ACTIVE'$$,
  '23514', null, 'the last active Reviewer cannot be locked');
select throws_ok($$update app.admin_accounts set role = 'CONTENT_STAFF', concurrency_revision = concurrency_revision + 1 where role = 'REVIEWER' and status = 'ACTIVE'$$,
  '23514', null, 'the last active Reviewer cannot be demoted');

select * from finish();
rollback;
