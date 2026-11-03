// Adapter tra cứu QR (tasks T020; live-qr-lookup-consumer-contract §1, §3; FR-M02-013; BR-M02-005, 019; DAC-M02-011).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LIVE_CONTENT } from './fake/fixtures';
import { createLookupClient, type RpcApi } from './lookupClient';

type Response = { data: unknown; error: unknown };

/** RPC giả: ghi lại tham số, trả response cho trước (hoặc treo tới khi bị abort khi `response` là `'HANG'`). */
function fakeRpc(response: Response | 'HANG' | 'REJECT') {
  const calls: { fn: string; args: Record<string, unknown>; signal?: AbortSignal }[] = [];
  const api: RpcApi = {
    rpc(fn, args) {
      const call: (typeof calls)[number] = { fn, args };
      calls.push(call);
      const query = {
        abortSignal(signal: AbortSignal) {
          call.signal = signal;
          return query;
        },
        then<A, B>(onFulfilled?: (value: Response) => A | PromiseLike<A>, onRejected?: (reason: unknown) => B | PromiseLike<B>) {
          const result: Promise<Response> =
            response === 'HANG'
              ? new Promise(() => {})
              : response === 'REJECT'
                ? Promise.reject(new TypeError('Failed to fetch'))
                : Promise.resolve(response);
          return result.then(onFulfilled, onRejected);
        },
      };
      return query;
    },
  };
  return { api, calls };
}

const valid = { outcome: 'VALID', content: LIVE_CONTENT.Q1a };

function client(response: Response | 'HANG' | 'REJECT', options: { online?: boolean; timeoutSeconds?: number } = {}) {
  const rpc = fakeRpc(response);
  const lookup = createLookupClient({
    rpc: () => rpc.api,
    isOnline: () => options.online ?? true,
    ...(options.timeoutSeconds !== undefined && { timeoutSeconds: options.timeoutSeconds }),
  });
  return { lookup, calls: rpc.calls };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('lookupClient', () => {
  it('có phiên → gửi p_route_id; không phiên → không gửi (BR-M02-019; DAC-M02-011)', async () => {
    const withSession = client({ data: valid, error: null });
    await withSession.lookup.lookup('Q1a', 'A');
    expect(withSession.calls).toEqual([expect.objectContaining({ fn: 'lookup_qr', args: { p_qr_identifier: 'Q1a', p_route_id: 'A' } })]);

    const free = client({ data: valid, error: null });
    await free.lookup.lookup('Q1a');
    expect(free.calls[0]!.args).toEqual({ p_qr_identifier: 'Q1a' });
  });

  it('body qua schema → VALID / TEMPORARILY_CLOSED / INVALID', async () => {
    expect(await client({ data: valid, error: null }).lookup.lookup('Q1a')).toEqual({ kind: 'VALID', content: LIVE_CONTENT.Q1a });
    for (const closedScope of ['ROUTE', 'CHECKPOINT'] as const) {
      expect(await client({ data: { outcome: 'TEMPORARILY_CLOSED', closedScope }, error: null }).lookup.lookup('Q1a')).toEqual({
        kind: 'TEMPORARILY_CLOSED',
        closedScope,
      });
    }
    expect(await client({ data: { outcome: 'INVALID' }, error: null }).lookup.lookup('Q1a')).toEqual({ kind: 'INVALID' });
  });

  it.each([
    ['lỗi RPC', { data: null, error: { message: 'boom', code: '500' } }],
    ['body không qua schema', { data: { outcome: 'VALID' }, error: null }],
    ['body có khóa lạ (routeId)', { data: { ...valid, routeId: 'A' }, error: null }],
    ['body rỗng', { data: null, error: null }],
  ] as const)('%s → SOURCE_ERROR, không bao giờ INVALID (FR-M02-013)', async (_name, response) => {
    expect(await client(response).lookup.lookup('Q1a', 'A')).toEqual({ kind: 'SOURCE_ERROR' });
  });

  it('lỗi mạng (fetch reject) → SOURCE_ERROR', async () => {
    expect(await client('REJECT').lookup.lookup('Q1a')).toEqual({ kind: 'SOURCE_ERROR' });
  });

  it('navigator.onLine === false → SOURCE_ERROR, không gửi request', async () => {
    const offline = client({ data: valid, error: null }, { online: false });
    expect(await offline.lookup.lookup('Q1a', 'A')).toEqual({ kind: 'SOURCE_ERROR' });
    expect(offline.calls).toEqual([]);
  });

  it('quá LOOKUP_TIMEOUT_SECONDS → SOURCE_ERROR và hủy request (BR-M02-005)', async () => {
    vi.useFakeTimers();
    const slow = client('HANG');
    const pending = slow.lookup.lookup('Q1a', 'A');
    await vi.advanceTimersByTimeAsync(7_999);
    expect(slow.calls[0]!.signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual({ kind: 'SOURCE_ERROR' });
    expect(slow.calls[0]!.signal!.aborted).toBe(true);
  });
});
