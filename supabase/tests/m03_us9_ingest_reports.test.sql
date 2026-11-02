-- pgTAP — US9 session intake and reports (tasks M03 T196; session-intake-contract §1–§4; admin-command Q-12, Q-13;
-- BR-M03-J01–J07, X05; SC-M03-007, 035, 038). The snapshot is that of SESSION_INTAKE_SNAPSHOT (seed.sql
-- test_support.intake_world); the E2E e2e/m03/intake.local.spec.ts sends the TypeScript table through the Edge Function.
begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

select test_support.intake_world();
create function pg_temp.record(p_session text, p_change jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('sessionId', p_session, 'routeId', 'Rt1a2b3c4d5e6f7g8h9', 'contentVersion', 2,
    'startedAt', '2026-10-20T01:00:00.000Z', 'endedAt', '2026-10-20T03:00:00.000Z', 'status', 'HOAN_TAT',
    'visitedCheckpoints', '[{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang Con Moong", "sequence": 1, "checkedInAt": "2026-10-20T01:30:00.000Z"},
                            {"checkpointId": "Cp9z8y7x6w5v4u3t2s1", "checkpointName": "Động Người Xưa", "sequence": 2, "checkedInAt": "2026-10-20T02:30:00.000Z"}]'::jsonb)
    || p_change $$;
create function pg_temp.ingest(p_record jsonb) returns text language plpgsql as $$
begin
  return api.ingest_session(p_record) ->> 'result';
exception when invalid_parameter_value then
  return 'INVALID';
end $$;
create function pg_temp.sessions() returns integer language sql as $$ select count(*)::int from app.session_records $$;

-- ---- access (constitution V; Physical §7.2) ----------------------------------------------------------------------
select ok(has_function_privilege('service_role', 'api.ingest_session(jsonb)', 'EXECUTE')
  and not has_function_privilege('anon', 'api.ingest_session(jsonb)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'api.ingest_session(jsonb)', 'EXECUTE'), 'only service_role (the Edge Function) ingests');
set local role anon;
select throws_ok($$select api.ingest_session('{}')$$, '42501', null, 'anon calling api.ingest_session directly is refused');
reset role;
select ok(has_function_privilege('authenticated', 'api.report_rpt01(text, date, date)', 'EXECUTE')
  and not has_function_privilege('anon', 'api.report_rpt01(text, date, date)', 'EXECUTE')
  and has_function_privilege('authenticated', 'api.report_rpt02(text, date, date)', 'EXECUTE'), 'reports are for administrators');

-- ---- idempotent intake (BR-M03-J03; SC-M03-007) ---------------------------------------------------------------
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601')), 'ACCEPTED', 'a first record is accepted');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601')), 'IDENTICAL', 'the identical retry → IDENTICAL');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601', jsonb_build_object(
  'startedAt', '2026-10-20T08:00:00+07:00', 'visitedCheckpoints', (pg_temp.record('x') -> 'visitedCheckpoints') -> 1
    || jsonb_build_array((pg_temp.record('x') -> 'visitedCheckpoints') -> 0)))), 'INVALID',
  'a timestamp with a non-UTC offset is invalid (contract: UTC only)');
select is(pg_temp.ingest(jsonb_build_object('visitedCheckpoints', jsonb_build_array((pg_temp.record('x') -> 'visitedCheckpoints') -> 1,
  (pg_temp.record('x') -> 'visitedCheckpoints') -> 0)) || (pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601') - 'visitedCheckpoints')),
  'IDENTICAL', 'visits in another order and keys in another order → still IDENTICAL');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601', '{"endedAt": "2026-10-20T03:00:00Z"}')), 'IDENTICAL',
  'the same instant written differently → IDENTICAL');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601', '{"status": "BO_DO"}')), 'CONFLICT',
  'same sessionId, different content → CONFLICT');
select is((select count(*)::int || '/' || max(status) from app.session_records where session_id = '6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601'), '1/HOAN_TAT',
  'one row, the first record kept intact');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f602', '{"status": "BO_DO", "visitedCheckpoints": []}')), 'ACCEPTED',
  'an abandoned session without visits is accepted');

-- ---- a closed or archived route still receives: closing never interrupts a running session (BR-M03-J04, H05) --------
select test_support.intake_route_status('TAM_DONG');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f603')), 'ACCEPTED', 'a closed route still receives');
select test_support.intake_route_status('LUU_TRU');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f604')), 'ACCEPTED', 'an archived route still receives');
select test_support.intake_route_status('HOAT_DONG');
select is(pg_temp.ingest(pg_temp.record('6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f605', '{"contentVersion": 1, "visitedCheckpoints": []}')), 'ACCEPTED',
  'a session of an older version is checked against that version (CHK024)');

-- ---- invalid records store nothing (BR-M03-J01, J02; SC-M03-038) -------------------------------------------------
select pg_temp.sessions() as before_invalid \gset
create temp table invalid_cases (name text, record jsonb);
insert into invalid_cases values
  ('sequence differs from the snapshot', pg_temp.record('7a000000-0000-4000-8000-000000000001', '{"visitedCheckpoints": [{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang Con Moong", "sequence": 2, "checkedInAt": "2026-10-20T01:30:00.000Z"}]}')),
  ('name differs from the snapshot', pg_temp.record('7a000000-0000-4000-8000-000000000002', '{"visitedCheckpoints": [{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang khác", "sequence": 1, "checkedInAt": "2026-10-20T01:30:00.000Z"}]}')),
  ('checkpoint not in the snapshot', pg_temp.record('7a000000-0000-4000-8000-000000000003', '{"visitedCheckpoints": [{"checkpointId": "CpKhongCo0000000000", "checkpointName": "Hang Con Moong", "sequence": 1, "checkedInAt": "2026-10-20T01:30:00.000Z"}]}')),
  ('unknown route', pg_temp.record('7a000000-0000-4000-8000-000000000004', '{"routeId": "RtKhongCo0000000000"}')),
  ('version that does not exist', pg_temp.record('7a000000-0000-4000-8000-000000000005', '{"contentVersion": 9}')),
  ('a deviceId key', pg_temp.record('7b000000-0000-4000-8000-000000000001', '{"deviceId": "may-1"}')),
  ('a gps key in a visit', pg_temp.record('7b000000-0000-4000-8000-000000000002', '{"visitedCheckpoints": [{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang Con Moong", "sequence": 1, "checkedInAt": "2026-10-20T01:30:00.000Z", "gps": "20.3,105.6"}]}')),
  ('status DANG_DIEN_RA', pg_temp.record('7b000000-0000-4000-8000-000000000003', '{"status": "DANG_DIEN_RA"}')),
  ('endedAt before startedAt', pg_temp.record('7b000000-0000-4000-8000-000000000004', '{"endedAt": "2026-10-20T00:30:00.000Z", "visitedCheckpoints": []}')),
  ('the same checkpoint twice', pg_temp.record('7b000000-0000-4000-8000-000000000005', '{"visitedCheckpoints": [{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang Con Moong", "sequence": 1, "checkedInAt": "2026-10-20T01:30:00.000Z"}, {"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang Con Moong", "sequence": 1, "checkedInAt": "2026-10-20T01:30:00.000Z"}]}')),
  ('check-in outside the session', pg_temp.record('7b000000-0000-4000-8000-000000000006', '{"visitedCheckpoints": [{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang Con Moong", "sequence": 1, "checkedInAt": "2026-10-20T05:00:00.000Z"}]}')),
  ('sessionId is not a UUID', pg_temp.record('phien-1')),
  ('contentVersion is not an integer', pg_temp.record('7b000000-0000-4000-8000-000000000007', '{"contentVersion": 1.5}')),
  ('not an object', '[]'::jsonb);
select is(pg_temp.ingest(record), 'INVALID', name || ' → INVALID') from invalid_cases order by name;
select is(pg_temp.sessions(), :before_invalid, 'no invalid record was stored');

-- ---- reports (BR-M03-J05–J07; SC-M03-035) ------------------------------------------------------------------------
-- a second route listing the same checkpoint, to count it per route (BR-M03-X05)
set local session_replication_role = replica;
insert into app.routes (route_id, status, active_content_version, created_by_user_id) values ('RtSecond000000000', 'HOAT_DONG', 1, 'x');
insert into app.revisions (subject_type, subject_id, revision_number, status, content, created_by_user_id, last_edited_by_user_id,
  published_by_user_id, published_at, self_published)
values ('ROUTE', 'RtSecond000000000', 1, 'PHAT_HANH', '{"name": {"vi": "Đường thứ hai", "en": "Second"}, "noSafetyWarningConfirmed": true, "offlineRouteMapRequired": false}',
  'x', 'x', 'x', now(), true);
insert into app.journey_snapshots (route_id, content_version, checkpoints) values ('RtSecond000000000', 1,
  '[{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "sequence": 3, "checkpointName": {"vi": "Hang Con Moong", "en": "Con Moong Cave"}, "connectivityMode": "ONLINE_AVAILABLE", "qrIdentifiers": ["QrIntake000000001"]}]');
set local session_replication_role = origin;
-- 17:30 UTC on 31/10 is 00:30 on 01/11 in Viet Nam
select pg_temp.ingest(jsonb_build_object('sessionId', '8c000000-0000-4000-8000-000000000001', 'routeId', 'RtSecond000000000', 'contentVersion', 1,
  'startedAt', '2026-10-31T16:00:00.000Z', 'endedAt', '2026-10-31T17:30:00.000Z', 'status', 'HOAN_TAT',
  'visitedCheckpoints', '[{"checkpointId": "Cp1a2b3c4d5e6f7g8h9", "checkpointName": "Hang Con Moong", "sequence": 3, "checkedInAt": "2026-10-31T17:00:00.000Z"}]'::jsonb)) as late \gset

insert into auth.sessions (id, user_id) values ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-000000000002", "session_id": "10000000-0000-4000-8000-000000000002"}', true);
select is(api.report_rpt01(null, '2026-10-20', '2026-10-20') - 'lastSuccessfulIngestionAt',
  '{"totalSessionCount": 5, "completedCount": 4, "completedRate": 0.8, "abandonedCount": 1, "abandonedRate": 0.2}',
  'RPT-01 counts sessions ended in the period with rates over the total (the older-version one ended the same day)');
select ok(api.report_rpt01(null, '2026-10-20', '2026-10-20') ->> 'lastSuccessfulIngestionAt' ~ 'Z$', 'lastSuccessfulIngestionAt is the latest intake time, UTC');
select is((api.report_rpt01(null, '2026-11-01', '2026-11-01') ->> 'totalSessionCount')::int, 1, 'a session ended 17:30 UTC on 31/10 counts on 01/11 (Asia/Ho_Chi_Minh)');
select is((api.report_rpt01(null, '2026-10-31', '2026-10-31') ->> 'totalSessionCount')::int, 0, '... not on 31/10');
select is((api.report_rpt01('RtSecond000000000', '2026-10-01', '2026-11-30') ->> 'totalSessionCount')::int, 1, 'filter by route');
select is(api.report_rpt02(null, '2026-10-01', '2026-11-30') -> 'items', jsonb_build_array(
    jsonb_build_object('routeId', 'Rt1a2b3c4d5e6f7g8h9', 'routeName', 'Đường mòn tiền sử', 'checkpointId', 'Cp1a2b3c4d5e6f7g8h9',
      'checkpointName', 'Hang Con Moong', 'sequence', 1, 'uniqueSessionCount', 3),
    jsonb_build_object('routeId', 'Rt1a2b3c4d5e6f7g8h9', 'routeName', 'Đường mòn tiền sử', 'checkpointId', 'Cp9z8y7x6w5v4u3t2s1',
      'checkpointName', 'Động Người Xưa', 'sequence', 2, 'uniqueSessionCount', 3),
    jsonb_build_object('routeId', 'RtSecond000000000', 'routeName', 'Đường thứ hai', 'checkpointId', 'Cp1a2b3c4d5e6f7g8h9',
      'checkpointName', 'Hang Con Moong', 'sequence', 3, 'uniqueSessionCount', 1)),
  'RPT-02: distinct sessions per (route, checkpoint); the shared checkpoint is counted per route');
select throws_ok($$select api.report_rpt01(null, '2026-01-01', '2027-01-02')$$, '22023', 'MSG-REPORT-SPAN', '367 days is refused');
select is((api.report_rpt01(null, '2026-01-01', '2027-01-01') ->> 'totalSessionCount')::int, 6, '366 days is accepted');
select throws_ok($$select api.report_rpt01(null, '2026-10-20', null)$$, '22023', 'MSG-REPORT-DATES-INVALID', 'one date alone is refused');
select throws_ok($$select api.report_rpt02(null, '2026-10-21', '2026-10-20')$$, '22023', 'MSG-REPORT-DATES-INVALID', 'from after to is refused');
select ok((api.report_rpt01() ->> 'totalSessionCount')::int >= 0, 'without dates the last 30 days are used');
select is((select count(*)::int from app.audit_records), 0, 'intake and reports write no audit line');

select * from finish();
rollback;
