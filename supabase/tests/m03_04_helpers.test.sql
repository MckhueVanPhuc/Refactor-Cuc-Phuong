-- pgTAP — M03 command helpers (tasks M03 T170; admin-command-contract §1–§3; spec-M03 §5.6; research R-07, R-09;
-- BR-M03-F08, L04, L10, L13). The text of the catalog itself is compared with TypeScript by sqlCatalog.test.ts.
-- The BUSY path of app.lock_connected_set needs two sessions and is covered by the contract tests (T186).
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- run a statement and turn its error into a CommandResult, the way every command's exception block does
create function pg_temp.result_of(p_sql text) returns jsonb language plpgsql as $$
begin
  execute p_sql;
  return null;
exception when others then
  return app.result_from_error(sqlstate, sqlerrm, 'MSG-PUBLISH-FAILED');
end $$;

-- ---- messages and labels (spec-M03 §5.6; BR-M03-L04) -----------------------------------------------------------
select is(app.render_message('MSG-LIMIT-TEXT', '{"Tên ô": "Tên tuyến", "tối đa": 100, "số": 120}'),
  'Tên tuyến dài quá 100 ký tự (hiện có 120). Hãy rút gọn.', 'placeholders are filled from values');
select is(app.render_message('MSG-UNKNOWN', '{}'), app.render_message('MSG-GENERIC', '{}'), 'an unknown key renders MSG-GENERIC');
select is(app.field_label('ROUTE', 'name.vi'), 'Tên tuyến (tiếng Việt)', 'a language suffix is added to the base label');
select is(app.field_label('ROUTE', 'galleryCaption.2.en'), 'Chú thích ảnh (tiếng Anh)', 'list indexes are ignored');
select is(app.field_label('ROUTE', 'nope'), null, 'an unknown field has no label');
select is(app.issue('ERROR', 'ROUTE', 'r1', 'name.vi', 'MSG-REQUIRED', '{"Tên ô": "Tên tuyến (tiếng Việt)"}'),
  jsonb_build_object('severity', 'ERROR', 'fieldLabel', 'Tên tuyến (tiếng Việt)',
    'message', app.render_message('MSG-REQUIRED', '{"Tên ô": "Tên tuyến (tiếng Việt)"}'), 'messageKey', 'MSG-REQUIRED',
    'targetItemType', 'ROUTE', 'targetItemId', 'r1', 'targetFieldKey', 'name.vi'),
  'an issue carries the label, the rendered message and its target (ValidationIssue)');
select is(app.issue('ERROR', 'ROUTE', 'r1', 'name.vi', 'MSG-REQUIRED', '{}', 'Tên khác') ->> 'fieldLabel', 'Tên khác',
  'a label override wins');
select is(app.issue('ERROR', 'ROUTE', 'r1', 'nope', 'MSG-REQUIRED') ->> 'fieldLabel', 'nope',
  'without a label the field key is shown');

-- ---- CommandResult builders (admin-command §1) --------------------------------------------------------------------
select is(app.cr_ok('MSG-SAVED'), '{"ok": true, "messageKey": "MSG-SAVED", "data": null}', 'success with no data');
select is(app.cr_ok('MSG-SAVED', '{"id": "r1"}') -> 'data', '{"id": "r1"}', 'success with data');
select is(app.cr_validation(jsonb_build_array(app.issue('ERROR', 'ROUTE', 'r1', 'name.vi', 'MSG-REQUIRED'))) ->> 'messageKey',
  'MSG-REQUIRED', 'a VALIDATION result takes the key of its first issue');
select is(app.cr_validation(null), '{"ok": false, "reason": "VALIDATION", "messageKey": "MSG-GENERIC", "issues": []}',
  'a VALIDATION result without issues');
select is(app.cr_busy('Đường mòn'), '{"ok": false, "reason": "BUSY", "messageKey": "MSG-ROUTE-BUSY", "busy": {"itemName": "Đường mòn"}}',
  'BUSY names the item (R-07)');
select is(app.cr_forbidden(), '{"ok": false, "reason": "FORBIDDEN", "messageKey": "MSG-NO-PERMISSION"}', 'FORBIDDEN');
select ok(not app.cr_blocked('MSG-X', '{"a": 1}') ? 'issues', 'BLOCKED without issues has no issues key');
select is(app.cr_blocked('MSG-X', '{}', '[]') -> 'issues', '[]', 'BLOCKED may carry issues');
select is(app.cr_failed('MSG-SAVED') ->> 'messageKey', 'MSG-GENERIC', 'FAILED uses only PUBLISH/CLOSE/GENERIC');
select is(app.cr_failed('MSG-PUBLISH-FAILED') ->> 'messageKey', 'MSG-PUBLISH-FAILED', 'FAILED keeps MSG-PUBLISH-FAILED');
select is(app.cr_stale('00000000-0000-4000-8000-000000000002', '2026-10-31 08:05:00+07') -> 'stale',
  '{"editorEmail": "staff@example.test", "editedAt": "2026-10-31T01:05:00.000Z"}', 'STALE names the last editor and when (R-09; BR-M03-L05)');
select is(app.cr_stale('gone', now()) -> 'stale' ->> 'editorEmail', 'quản trị viên', 'STALE without an account names no one');

-- ---- reject / result_from_error (R-07) ---------------------------------------------------------------------------
select throws_ok($$select app.reject(app.cr_forbidden())$$, 'CPQRJ', null, 'reject raises CPQRJ');
select is(pg_temp.result_of($$select app.reject(app.cr_busy('A'))$$), app.cr_busy('A'), 'a rejection comes back unchanged');
select is(pg_temp.result_of($$select 1 / 0$$), app.cr_failed('MSG-PUBLISH-FAILED'), 'any other error becomes FAILED');
select ok(pg_temp.result_of($$select 1 / 0$$)::text !~ 'division', 'the database error text never reaches the result');

-- ---- expect_revision (PT-05) -------------------------------------------------------------------------------------
select lives_ok($$select app.expect_revision(3, 3, 'u', now())$$, 'the same revision passes');
select is(pg_temp.result_of($$select app.expect_revision(2, 3, 'u', now())$$) ->> 'reason', 'STALE', 'an older revision is STALE');

-- ---- require_admin (BR-M03-A02, A03) -----------------------------------------------------------------------------
insert into auth.sessions (id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002');
select is(pg_temp.result_of($$select app.require_admin('B')$$), app.cr_forbidden(), 'no caller is FORBIDDEN');
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-000000000002", "session_id": "10000000-0000-4000-8000-000000000002"}', true);
select is((app.require_admin('B')).email, 'staff@example.test', 'Content Staff passes a both-roles command');
select is(pg_temp.result_of($$select app.require_admin('R')$$), app.cr_forbidden(), 'Content Staff is FORBIDDEN on a Reviewer command');
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-4000-8000-000000000001", "session_id": "10000000-0000-4000-8000-000000000001"}', true);
select is((app.require_admin('R')).role, 'REVIEWER', 'the Reviewer passes a Reviewer command');

-- ---- lock_connected_set (R-07) -----------------------------------------------------------------------------------
select lives_ok($$select app.lock_connected_set('[{"key": "route:r1", "name": "A"}, {"key": "checkpoint:c1", "name": "B"}, {"key": "route:r1", "name": "A"}]')$$,
  'locks are taken once per key, sorted, re-entrant within the transaction');

-- ---- audit (BR-M03-F08; DAC-M03-073) -----------------------------------------------------------------------------
select app.audit('00000000-0000-4000-8000-000000000002', 'TEST_ACTION', 'ROUTE', 'r1', 'SUCCESS', '  lý do  ');
select app.audit('no-account', 'TEST_ACTION', 'ROUTE', null, 'FAILURE', '   ');
select is((select actor_user_id from app.audit_records where action = 'TEST_ACTION' and outcome = 'SUCCESS'),
  '00000000-0000-4000-8000-000000000002', 'an account actor is recorded');
select is((select reason from app.audit_records where action = 'TEST_ACTION' and outcome = 'SUCCESS'), 'lý do',
  'a reason is trimmed');
select ok((select actor_user_id is null and reason is null and entity_id = '' from app.audit_records
  where action = 'TEST_ACTION' and outcome = 'FAILURE'), 'a caller without an account, a blank reason and no entity id are still recorded');

select * from finish();
rollback;
