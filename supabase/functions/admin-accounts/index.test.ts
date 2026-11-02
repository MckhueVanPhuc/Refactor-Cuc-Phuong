// Test Deno cho Edge `admin-accounts` (tasks M03 T178; auth-account-contract §3). Chạy: `deno test supabase/functions`.
// Dependency giả, không gọi mạng; kiểm HTTP status, `result` và việc không lộ user id/token.
import assert from 'node:assert/strict';
import { type CurrentAdmin, type Deps, handle } from './handler.ts';

type Calls = { events: string[]; invited: string[] };

function fakeDeps(overrides: Partial<Deps> = {}, admin: CurrentAdmin | 'UNAUTHORIZED' = { email: 'r@example.test', role: 'REVIEWER', status: 'ACTIVE' }) {
  const calls: Calls = { events: [], invited: [] };
  const deps: Deps = {
    getUser: async (token) => (token === 'good' ? { id: 'user-123', email: 'r@example.test' } : null),
    currentAdmin: async () => admin,
    prepareInvitation: async (_actor, email) => ({ result: 'CREATED', email: email.trim().toLowerCase() }),
    recordAccountEvent: async (_actor, action, _email, outcome) => {
      calls.events.push(`${action}:${outcome}`);
    },
    linkInvitation: async () => 'LINKED',
    inviteUserByEmail: async (email) => {
      calls.invited.push(email);
      return true;
    },
    ...overrides,
  };
  return { deps, calls };
}

function post(body: unknown, token: string | null = 'good'): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json', origin: 'http://localhost:5173' };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request('http://localhost/functions/v1/admin-accounts', { method: 'POST', headers, body: JSON.stringify(body) });
}

async function read(response: Response) {
  const text = await response.text();
  assert.ok(!text.includes('user-123'), 'body never carries a user id');
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

Deno.test('OPTIONS preflight → 204 with CORS headers, before any check', async () => {
  const { deps } = fakeDeps();
  const response = await handle(new Request('http://localhost', { method: 'OPTIONS' }), deps);
  assert.equal(response.status, 204);
  assert.match(response.headers.get('access-control-allow-headers') ?? '', /authorization, x-client-info, apikey, content-type/);
});

Deno.test('missing JWT → 401', async () => {
  const { deps } = fakeDeps();
  assert.equal((await read(await handle(post({ action: 'invite' }, null), deps))).status, 401);
});

Deno.test('invalid or expired JWT → 401', async () => {
  const { deps } = fakeDeps();
  assert.equal((await read(await handle(post({ action: 'invite' }, 'expired'), deps))).status, 401);
});

Deno.test('a caller who is not a Reviewer → 403 FORBIDDEN, one FAILURE audit, no invitation', async () => {
  const { deps, calls } = fakeDeps({}, { email: 's@example.test', role: 'CONTENT_STAFF', status: 'ACTIVE' });
  const { status, body } = await read(await handle(post({ action: 'invite', email: 'n@example.test', role: 'CONTENT_STAFF' }), deps));
  assert.deepEqual([status, body], [403, { result: 'FORBIDDEN' }]);
  assert.deepEqual(calls.events, ['ACCOUNT_INVITED:FAILURE']);
  assert.deepEqual(calls.invited, []);
});

Deno.test('a signed-out session rejected by PostgREST → 401', async () => {
  const { deps } = fakeDeps({}, 'UNAUTHORIZED');
  assert.equal((await read(await handle(post({ action: 'invite', email: 'n@example.test', role: 'CONTENT_STAFF' }), deps))).status, 401);
});

Deno.test('invite → 200 SENT; one SUCCESS audit; normalized email sent to the provider', async () => {
  const { deps, calls } = fakeDeps();
  const { status, body } = await read(await handle(post({ action: 'invite', email: ' N@Example.test ', role: 'CONTENT_STAFF' }), deps));
  assert.deepEqual([status, body], [200, { result: 'SENT' }]);
  assert.deepEqual(calls.invited, ['n@example.test']);
  assert.deepEqual(calls.events, ['ACCOUNT_INVITED:SUCCESS']);
});

Deno.test('inviting a pending account → 200 RESENT', async () => {
  const { deps, calls } = fakeDeps({ prepareInvitation: async () => ({ result: 'PENDING', email: 'n@example.test' }) });
  const { body } = await read(await handle(post({ action: 'invite', email: 'n@example.test', role: 'CONTENT_STAFF' }), deps));
  assert.deepEqual(body, { result: 'RESENT' });
  assert.deepEqual(calls.events, ['ACCOUNT_INVITE_RESENT:SUCCESS']);
});

for (const [result, status] of [['INVALID_EMAIL', 400], ['EMAIL_TAKEN', 409], ['FAILED', 400]] as const) {
  Deno.test(`prepare ${result} → ${status}, FAILURE audit, no invitation`, async () => {
    const { deps, calls } = fakeDeps({ prepareInvitation: async () => ({ result }) });
    const response = await read(await handle(post({ action: 'resend', email: 'x' }), deps));
    assert.deepEqual([response.status, response.body], [status, { result }]);
    assert.deepEqual(calls.events, ['ACCOUNT_INVITE_RESENT:FAILURE']);
    assert.deepEqual(calls.invited, []);
  });
}

Deno.test('provider refuses the invitation → 502 INVITE_FAILED with a FAILURE audit', async () => {
  const { deps, calls } = fakeDeps({ inviteUserByEmail: async () => false });
  const { status, body } = await read(await handle(post({ action: 'invite', email: 'n@example.test', role: 'CONTENT_STAFF' }), deps));
  assert.deepEqual([status, body], [502, { result: 'INVITE_FAILED' }]);
  assert.deepEqual(calls.events, ['ACCOUNT_INVITED:FAILURE']);
});

Deno.test('link with an email that matches no pending account → 422 LINK_REJECTED', async () => {
  const { deps } = fakeDeps({ linkInvitation: async () => 'LINK_REJECTED' });
  const { status, body } = await read(await handle(post({ action: 'link' }), deps));
  assert.deepEqual([status, body], [422, { result: 'LINK_REJECTED' }]);
});

Deno.test('link → 200 LINKED', async () => {
  const { deps } = fakeDeps();
  assert.deepEqual((await read(await handle(post({ action: 'link' }), deps))).body, { result: 'LINKED' });
});

Deno.test('an unexpected error → 500 FAILED, nothing raw in the body', async () => {
  const { deps } = fakeDeps({ linkInvitation: async () => { throw new Error('db password=secret'); } });
  const response = await handle(post({ action: 'link' }), deps);
  const text = await response.text();
  assert.equal(response.status, 500);
  assert.ok(!text.includes('secret'));
});
