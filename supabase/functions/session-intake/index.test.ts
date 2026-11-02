// Test Deno cho Edge `session-intake` (tasks M03 T195; session-intake-contract §1–§3). Chạy: `deno test supabase/functions`.
// RPC giả; kiểm HTTP status và `result` theo từng bước của handler. Bảng đầy đủ chạy qua Edge thật ở e2e/m03/intake.local.spec.ts.
import assert from 'node:assert/strict';
import { type Deps, handle, MAX_BODY_BYTES } from './handler.ts';

const record = {
  sessionId: '6f1c2a3b-4d5e-4f60-8a71-b2c3d4e5f601',
  routeId: 'Rt1a2b3c4d5e6f7g8h9',
  contentVersion: 2,
  startedAt: '2026-10-20T01:00:00.000Z',
  endedAt: '2026-10-20T03:00:00.000Z',
  status: 'HOAN_TAT',
  visitedCheckpoints: [{ checkpointId: 'Cp1a2b3c4d5e6f7g8h9', checkpointName: 'Hang Con Moong', sequence: 1, checkedInAt: '2026-10-20T01:30:00.000Z' }],
};

function deps(result: Awaited<ReturnType<Deps['ingest']>> | Error = 'ACCEPTED') {
  const calls: unknown[] = [];
  return {
    calls,
    deps: {
      ingest: async (value: unknown) => {
        calls.push(value);
        if (result instanceof Error) throw result;
        return result;
      },
    } as Deps,
  };
}

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost/functions/v1/session-intake', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });

async function call(req: Request, d: Deps) {
  const response = await handle(req, d);
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

Deno.test('OPTIONS preflight → 204', async () => {
  const response = await handle(new Request('http://localhost', { method: 'OPTIONS' }), deps().deps);
  assert.equal(response.status, 204);
});

Deno.test('GET → 405 INVALID', async () => {
  assert.deepEqual(await call(new Request('http://localhost', { method: 'GET' }), deps().deps), { status: 405, body: { result: 'INVALID' } });
});

Deno.test('a body above 64 KiB → 413 INVALID without calling the database', async () => {
  const { deps: d, calls } = deps();
  const big = JSON.stringify({ ...record, padding: 'x'.repeat(MAX_BODY_BYTES) });
  assert.deepEqual(await call(post(big), d), { status: 413, body: { result: 'INVALID' } });
  assert.equal(calls.length, 0);
});

Deno.test('not JSON → 422 INVALID', async () => {
  assert.deepEqual(await call(post('{oops'), deps().deps), { status: 422, body: { result: 'INVALID' } });
});

Deno.test('a key outside the allowlist → 422 INVALID without calling the database (BR-M03-J01)', async () => {
  const { deps: d, calls } = deps();
  assert.deepEqual(await call(post(JSON.stringify({ ...record, deviceId: 'may-1' })), d), { status: 422, body: { result: 'INVALID' } });
  assert.equal(calls.length, 0);
});

for (const [result, status] of [['ACCEPTED', 200], ['IDENTICAL', 200], ['CONFLICT', 409], ['INVALID', 422]] as const) {
  Deno.test(`database says ${result} → ${status}`, async () => {
    assert.deepEqual(await call(post(JSON.stringify(record)), deps(result).deps), { status, body: { result } });
  });
}

Deno.test('a database failure → 500 without detail: M02 keeps the record PENDING', async () => {
  assert.deepEqual(await call(post(JSON.stringify(record)), deps(new Error('db password=secret')).deps), { status: 500, body: {} });
});
