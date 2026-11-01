// Q25 — nhận phiên của du khách qua Edge `session-intake` trên stack Supabase local (tasks M03 T195;
// session-intake-contract §1–§3; BR-M03-J01–J04). Chạy bảng SESSION_INTAKE_CASES **theo thứ tự** (ca sau dùng lại
// sessionId của ca trước) trên snapshot của test_support.intake_world (seed.sql, qua psql trong container DB).
// Chỉ chạy ở project m03-local-stack (PW_LOCAL_STACK=1) và cần `supabase functions serve` đang chạy.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { SESSION_INTAKE_CASES, type IntakeResult } from '../../src/shared/contracts/sessionSyncRecord.cases';

const DB_CONTAINER = process.env.M03_DB_CONTAINER ?? 'supabase_db_cuc-phuong-quest-local';

function localConfig(): { url: string; key: string } {
  const fromFile: Record<string, string> = {};
  try {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match) fromFile[match[1]!] = match[2]!;
    }
  } catch {
    // không có .env.local: chỉ dùng biến môi trường
  }
  const read = (name: string) => process.env[name] ?? fromFile[name] ?? '';
  return { url: read('VITE_SUPABASE_URL'), key: read('VITE_SUPABASE_PUBLISHABLE_KEY') };
}

function sql(statement: string): void {
  execFileSync('docker', ['exec', '-i', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAq'], {
    input: statement,
  });
}

/** Gửi như M02: publishable key, không JWT; đọc kết quả theo bảng HTTP của contract §3 */
async function send(body: string, method = 'POST'): Promise<{ status: number; result: IntakeResult | undefined }> {
  const { url, key } = localConfig();
  const response = await fetch(`${url}/functions/v1/session-intake`, {
    method,
    headers: { apikey: key, 'content-type': 'application/json' },
    ...(method === 'POST' ? { body } : {}),
  });
  const text = await response.text();
  return { status: response.status, result: text ? (JSON.parse(text) as { result?: IntakeResult }).result : undefined };
}

const STATUS: Record<IntakeResult, number> = { ACCEPTED: 200, IDENTICAL: 200, CONFLICT: 409, INVALID: 422 };

test.describe.serial('Q25 nhận phiên qua Edge session-intake trên stack local', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'm03-local-stack', 'chỉ chạy với stack Supabase local (PW_LOCAL_STACK=1)');
  });

  test.beforeAll(({}, testInfo) => {
    if (testInfo.project.name === 'm03-local-stack') sql('select test_support.intake_world();');
  });

  test.afterAll(({}, testInfo) => {
    if (testInfo.project.name === 'm03-local-stack') sql('select test_support.reset_m03();');
  });

  for (const intakeCase of SESSION_INTAKE_CASES) {
    test(`${intakeCase.name} → ${intakeCase.expected}`, async () => {
      sql(`select test_support.intake_route_status('${intakeCase.routeStatus ?? 'HOAT_DONG'}');`);
      const { status, result } = await send(JSON.stringify(intakeCase.record));
      expect(result).toBe(intakeCase.expected);
      expect(status).toBe(STATUS[intakeCase.expected]);
    });
  }

  test('body trên 64 KiB → 413 INVALID', async () => {
    const big = JSON.stringify({ ...(SESSION_INTAKE_CASES[0]!.record as object), padding: 'x'.repeat(65 * 1024) });
    expect(await send(big)).toEqual({ status: 413, result: 'INVALID' });
  });

  test('không phải POST → 405 INVALID', async () => {
    expect(await send('', 'GET')).toEqual({ status: 405, result: 'INVALID' });
  });

  test('du khách gọi thẳng api.ingest_session bị từ chối (chỉ service_role)', async () => {
    const { url, key } = localConfig();
    const response = await fetch(`${url}/rest/v1/rpc/ingest_session`, {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/json', 'content-profile': 'api' },
      body: JSON.stringify({ p_record: SESSION_INTAKE_CASES[0]!.record }),
    });
    expect([401, 403, 404]).toContain(response.status);
  });
});
