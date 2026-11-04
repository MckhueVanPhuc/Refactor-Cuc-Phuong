// Ánh xạ response của session-intake (tasks T084; session-sync-record-contract §4; BR-M02-011; DAC-M02-010; R-11, L-02).
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import { createIntakeClient, type FunctionsApi } from './intakeClient';

const record: SessionSyncRecord = {
  sessionId: '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b',
  routeId: 'A',
  contentVersion: 3,
  startedAt: '2026-11-04T02:00:00.000Z',
  endedAt: '2026-11-04T03:00:00.000Z',
  status: 'BO_DO',
  visitedCheckpoints: [],
};

const ok = (body: unknown) => async () => ({ data: body, error: null });
const http = (status: number, body: string) => async () => ({
  data: null,
  error: new FunctionsHttpError(new Response(body, { status, headers: { 'content-type': 'application/json' } })),
});

function client(invoke: FunctionsApi['invoke'], timeoutSeconds?: number) {
  const calls: { name: string; body: unknown }[] = [];
  const intake = createIntakeClient({
    functions: () => ({
      invoke: (name, options) => {
        calls.push({ name, body: options.body });
        return invoke(name, options);
      },
    }),
    ...(timeoutSeconds !== undefined && { timeoutSeconds }),
  });
  return { intake, calls };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('intakeClient', () => {
  it('gửi đúng record tới session-intake', async () => {
    const { intake, calls } = client(ok({ result: 'ACCEPTED' }));
    await intake.send(record);
    expect(calls).toEqual([{ name: 'session-intake', body: record }]);
  });

  it.each(['ACCEPTED', 'IDENTICAL'])('%s → SYNCED (SC-M02-006)', async (result) => {
    expect(await client(ok({ result })).intake.send(record)).toBe('SYNCED');
  });

  it.each([
    ['409 CONFLICT', 409, '{"result":"CONFLICT"}'],
    ['422 INVALID', 422, '{"result":"INVALID"}'],
    ['413 INVALID', 413, '{"result":"INVALID"}'],
  ])('%s → CONFLICT, dừng tự gửi (BR-M02-011)', async (_name, status, body) => {
    expect(await client(http(status, body)).intake.send(record)).toBe('CONFLICT');
  });

  it.each([
    ['503', 503, '{"result":"UNAVAILABLE"}'],
    ['500 body rỗng', 500, ''],
    ['429', 429, '{"message":"too many"}'],
    ['401', 401, '{"message":"unauthorized"}'],
    ['404', 404, '{"message":"not found"}'],
    ['409 body không có result hợp lệ', 409, '{"message":"x"}'],
    ['422 body không đọc được', 422, 'not json'],
  ])('%s → giữ PENDING (research L-02)', async (_name, status, body) => {
    expect(await client(http(status, body)).intake.send(record)).toBe('KEEP_PENDING');
  });

  it('200 nhưng body không có result đã biết → giữ PENDING', async () => {
    expect(await client(ok({ ok: true })).intake.send(record)).toBe('KEEP_PENDING');
    expect(await client(ok(null)).intake.send(record)).toBe('KEEP_PENDING');
  });

  it.each([
    ['FunctionsFetchError', new FunctionsFetchError(new TypeError('Failed to fetch'))],
    ['FunctionsRelayError', new FunctionsRelayError({})],
  ])('lỗi mạng (%s) → giữ PENDING', async (_name, error) => {
    expect(await client(async () => ({ data: null, error })).intake.send(record)).toBe('KEEP_PENDING');
  });

  it('invoke reject → giữ PENDING', async () => {
    expect(await client(() => Promise.reject(new Error('boom'))).intake.send(record)).toBe('KEEP_PENDING');
  });

  it('quá SYNC_REQUEST_TIMEOUT_SECONDS → giữ PENDING và hủy request', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const { intake } = client((_name, options) => {
      signal = options.signal;
      return new Promise(() => {});
    });
    const pending = intake.send(record);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toBe('KEEP_PENDING');
    expect(signal!.aborted).toBe(true);
  });
});
