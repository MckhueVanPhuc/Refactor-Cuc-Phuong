// Test Deno cho Edge `translate` (specs/004-ai-translation tasks T024; contracts/translate-contract.md §2–§6).
// Chạy: `deno test supabase/functions`. Dependency giả, không gọi mạng; kiểm HTTP status, body và việc không lộ text.
import assert from 'node:assert/strict';
import { type CurrentAdmin, type Deps, handle, MAX_SOURCE_CHARS } from './handler.ts';

const SOURCE = 'Cây chò ngàn năm';
const ACTIVE: CurrentAdmin = { email: 's@example.test', role: 'CONTENT_STAFF', status: 'ACTIVE' };

function fakeDeps(overrides: Partial<Deps> = {}, admin: CurrentAdmin | 'UNAUTHORIZED' = ACTIVE) {
  const sent: { text: string; lineBreaks: string }[] = [];
  const deps: Deps = {
    getUser: async (token) => (token === 'good' ? { id: 'user-123' } : null),
    currentAdmin: async () => admin,
    translate: async (input) => {
      sent.push(input);
      return 'The thousand-year-old Cho tree';
    },
    ...overrides,
  };
  return { deps, sent };
}

function post(body: unknown, token: string | null = 'good', raw?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request('http://localhost/functions/v1/translate', {
    method: 'POST',
    headers,
    body: raw ?? JSON.stringify(body),
  });
}

const valid = (text = SOURCE, lineBreaks = 'NOT_ALLOWED') => ({ sourceLanguage: 'vi', targetLanguage: 'en', text, lineBreaks });

async function read(response: Response) {
  const text = await response.text();
  if (response.status !== 200) assert.ok(!text.includes(SOURCE), 'body lỗi không chứa text nguồn (BR-AI-10)');
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

Deno.test('OPTIONS preflight → 204 với header CORS, trước mọi kiểm tra', async () => {
  const { deps } = fakeDeps();
  const response = await handle(new Request('http://localhost', { method: 'OPTIONS' }), deps);
  assert.equal(response.status, 204);
  assert.match(response.headers.get('access-control-allow-headers') ?? '', /authorization/);
});

Deno.test('phương thức khác POST → 405', async () => {
  const { deps } = fakeDeps();
  const response = await handle(new Request('http://localhost', { method: 'GET' }), deps);
  assert.deepEqual(await read(response), { status: 405, body: { result: 'FAILED' } });
});

Deno.test('thiếu JWT hoặc JWT sai → 401, không gọi dịch (BR-AI-08)', async () => {
  const { deps, sent } = fakeDeps();
  assert.equal((await read(await handle(post(valid(), null), deps))).status, 401);
  assert.equal((await read(await handle(post(valid(), 'expired'), deps))).status, 401);
  assert.equal(sent.length, 0);
});

Deno.test('phiên đã đăng xuất (PostgREST từ chối JWT) → 401', async () => {
  const { deps } = fakeDeps({}, 'UNAUTHORIZED');
  assert.equal((await read(await handle(post(valid()), deps))).status, 401);
});

Deno.test('không có AdminAccount ACTIVE → 403 FORBIDDEN, không gọi dịch (BR-AI-08)', async () => {
  const { deps, sent } = fakeDeps({}, null);
  assert.deepEqual(await read(await handle(post(valid()), deps)), { status: 403, body: { result: 'FORBIDDEN' } });
  assert.equal(sent.length, 0);
});

Deno.test('xác thực chạy trước kiểm body: body sai mà không JWT vẫn là 401', async () => {
  const { deps } = fakeDeps();
  assert.equal((await read(await handle(post({ rác: true }, null), deps))).status, 401);
});

Deno.test('mọi role ACTIVE đều được (BR-M03-A02)', async () => {
  const { deps } = fakeDeps({}, { email: 'r@example.test', role: 'REVIEWER', status: 'ACTIVE' });
  assert.equal((await read(await handle(post(valid()), deps))).status, 200);
});

Deno.test('request sai → 400 INVALID, không gọi dịch (contract §2)', async () => {
  const cases: [string, Request][] = [
    ['không phải JSON', post(null, 'good', '{')],
    ['mảng', post([valid()])],
    ['khóa thừa', post({ ...valid(), fieldKey: 'name' })],
    ['ngôn ngữ nguồn khác', post({ ...valid(), sourceLanguage: 'en' })],
    ['ngôn ngữ đích khác', post({ ...valid(), targetLanguage: 'fr' })],
    ['text không phải chuỗi', post({ ...valid(), text: 42 })],
    ['text rỗng sau trim', post(valid('   '))],
    ['text quá trần', post(valid('a'.repeat(MAX_SOURCE_CHARS + 1)))],
    ['lineBreaks sai', post(valid(SOURCE, 'MAYBE'))],
    ['body quá 16 KiB', post(null, 'good', JSON.stringify({ ...valid(), text: 'ạ'.repeat(6000) }))],
  ];
  for (const [name, request] of cases) {
    const { deps, sent } = fakeDeps();
    assert.deepEqual(await read(await handle(request, deps)), { status: 400, body: { result: 'INVALID' } }, name);
    assert.equal(sent.length, 0, name);
  }
});

Deno.test('đúng trần 2000 code point vẫn hợp lệ', async () => {
  const { deps } = fakeDeps();
  assert.equal((await read(await handle(post(valid('ạ'.repeat(MAX_SOURCE_CHARS))), deps))).status, 200);
});

Deno.test('thành công → 200 { translatedText }; chỉ text đã trim được đưa cho dịch vụ (BR-AI-10)', async () => {
  const { deps, sent } = fakeDeps();
  const { status, body } = await read(await handle(post(valid(`  ${SOURCE}  `)), deps));
  assert.deepEqual([status, body], [200, { translatedText: 'The thousand-year-old Cho tree' }]);
  assert.deepEqual(sent, [{ text: SOURCE, lineBreaks: 'NOT_ALLOWED' }]);
});

Deno.test('hậu xử lý: trim, bỏ ngoặc kép bao ngoài, bỏ xuống dòng khi NOT_ALLOWED, không cắt (BR-AI-06, 11)', async () => {
  const long = 'x'.repeat(150);
  const { deps } = fakeDeps({ translate: async () => `  "Line one\n  line two ${long}"  ` });
  const { body } = await read(await handle(post(valid()), deps));
  assert.equal(body.translatedText, `Line one line two ${long}`);

  const { deps: multi } = fakeDeps({ translate: async () => '“Line one\nline two”' });
  const { body: kept } = await read(await handle(post(valid(SOURCE, 'ALLOWED')), multi));
  assert.equal(kept.translatedText, 'Line one\nline two');
});

Deno.test('dịch vụ lỗi, trả rỗng hoặc throw → 502 FAILED (BR-AI-09)', async () => {
  for (const translate of [async () => null, async () => '   ', async () => '""', async () => Promise.reject(new Error(SOURCE))]) {
    const { deps } = fakeDeps({ translate });
    assert.deepEqual(await read(await handle(post(valid()), deps)), { status: 502, body: { result: 'FAILED' } });
  }
});
