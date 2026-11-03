// Adapter đọc nguồn M03 (tasks T028; research R-05; spec-M01 §5.4, §9.3; m03-publication-consumer-contract §2).
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  journeySnapshotRow,
  publicationFixture,
  publishedRouteRow,
} from '../../../shared/contracts/__fixtures__/publication';
import { registerSourceReadEffect } from './onSourceRead';
import { createSourceClient, type DataApi, type Query } from './sourceClient';

type Response = { data: unknown; error: unknown };

/** Data API giả: ghi lại view, bộ lọc, abort signal; trả response theo hàm `respond`. */
function createFakeDataApi(respond: (view: string, filters: Record<string, string>) => Promise<Response> | Response) {
  const calls: { view: string; columns: string; filters: Record<string, string>; signal?: AbortSignal; single: boolean }[] = [];
  const dataApi: DataApi = {
    from(view) {
      return {
        select(columns) {
          const call: (typeof calls)[number] = { view, columns, filters: {}, single: false };
          calls.push(call);
          const query: Query = {
            eq(column, value) {
              call.filters[column] = value;
              return query;
            },
            maybeSingle() {
              call.single = true;
              return query;
            },
            abortSignal(signal) {
              call.signal = signal;
              return query;
            },
            then(onFulfilled, onRejected) {
              return Promise.resolve(respond(view, call.filters)).then(onFulfilled, onRejected);
            },
          };
          return query;
        },
      };
    },
  };
  return { dataApi, calls };
}

const fixture = () => publicationFixture();
const routeRows = () => Object.values(fixture().routes).map(publishedRouteRow);

function client(respond: Parameters<typeof createFakeDataApi>[0], options: { online?: boolean } = {}) {
  const fake = createFakeDataApi(respond);
  const sourceClient = createSourceClient({ dataApi: () => fake.dataApi, isOnline: () => options.online ?? true });
  return { sourceClient, calls: fake.calls };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('fetchCatalog (R1)', () => {
  it('đọc mọi dòng của published_routes; dòng hỏng bị bỏ, không sửa', async () => {
    const { sourceClient, calls } = client(() => ({ data: [...routeRows(), fixture().brokenRoute], error: null }));
    const result = await sourceClient.fetchCatalog();
    expect(calls[0]).toMatchObject({ view: 'published_routes', filters: {}, single: false });
    expect(result.kind).toBe('OK');
    if (result.kind !== 'OK') return;
    expect(result.value.map((route) => route.routeId)).toEqual(['route-a', 'route-b', 'route-c', 'route-d']);
    expect(result.value[0]).toEqual(fixture().routes.A);
  });

  it('chọn đúng danh sách cột của view (publicationRowMapping)', async () => {
    const { sourceClient, calls } = client(() => ({ data: [], error: null }));
    await sourceClient.fetchCatalog();
    expect(calls[0]!.columns.split(',')).toContain('active_content_version');
    expect(calls[0]!.columns).not.toContain('*');
  });

  it('response lỗi → nguồn không khả dụng', async () => {
    const { sourceClient } = client(() => ({ data: null, error: { message: 'boom' } }));
    expect(await sourceClient.fetchCatalog()).toEqual({ kind: 'UNAVAILABLE' });
  });

  it('response không phải mảng → không khả dụng', async () => {
    const { sourceClient } = client(() => ({ data: { not: 'array' }, error: null }));
    expect(await sourceClient.fetchCatalog()).toEqual({ kind: 'UNAVAILABLE' });
  });

  it('request bị reject (lỗi mạng) → không khả dụng', async () => {
    const { sourceClient } = client(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await sourceClient.fetchCatalog()).toEqual({ kind: 'UNAVAILABLE' });
  });

  it(`quá SOURCE_REQUEST_TIMEOUT_SECONDS (8 s, provisional) → không khả dụng và abort request`, async () => {
    vi.useFakeTimers();
    const { sourceClient, calls } = client(() => new Promise<Response>(() => {}));
    const pending = sourceClient.fetchCatalog();
    await vi.advanceTimersByTimeAsync(7_999);
    expect(calls[0]!.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toEqual({ kind: 'UNAVAILABLE' });
    expect(calls[0]!.signal?.aborted).toBe(true);
  });

  it('navigator.onLine === false → bỏ qua request', async () => {
    const { sourceClient, calls } = client(() => ({ data: routeRows(), error: null }), { online: false });
    expect(await sourceClient.fetchCatalog()).toEqual({ kind: 'UNAVAILABLE' });
    expect(calls).toHaveLength(0);
  });

  it('onLine === true không đủ để coi là online: request lỗi vẫn là không khả dụng', async () => {
    const { sourceClient } = client(() => ({ data: null, error: { message: 'offline thật' } }), { online: true });
    expect(await sourceClient.fetchCatalog()).toEqual({ kind: 'UNAVAILABLE' });
  });
});

describe('fetchRoute (R2) / fetchActiveSnapshot (R3)', () => {
  it('đọc một tuyến theo route_id', async () => {
    const { sourceClient, calls } = client(() => ({ data: publishedRouteRow(fixture().routes.B), error: null }));
    expect(await sourceClient.fetchRoute('route-b')).toEqual({ kind: 'OK', value: fixture().routes.B });
    expect(calls[0]).toMatchObject({ view: 'published_routes', filters: { route_id: 'route-b' }, single: true });
  });

  it('không có dòng → OK với null (tuyến chưa từng xuất bản)', async () => {
    const { sourceClient } = client(() => ({ data: null, error: null }));
    expect(await sourceClient.fetchRoute('route-x')).toEqual({ kind: 'OK', value: null });
  });

  it('dòng không qua schema → không khả dụng', async () => {
    const { sourceClient } = client(() => ({ data: fixture().brokenRoute, error: null }));
    expect(await sourceClient.fetchRoute('route-broken')).toEqual({ kind: 'UNAVAILABLE' });
  });

  it('đọc snapshot active theo route_id', async () => {
    const { sourceClient, calls } = client(() => ({ data: journeySnapshotRow(fixture().snapshots.A), error: null }));
    expect(await sourceClient.fetchActiveSnapshot('route-a')).toEqual({ kind: 'OK', value: fixture().snapshots.A });
    expect(calls[0]).toMatchObject({ view: 'active_journey_snapshots', filters: { route_id: 'route-a' }, single: true });
  });

  it('snapshot không qua schema → không khả dụng', async () => {
    const row = { ...journeySnapshotRow(fixture().snapshots.A), status: 'NHAP' };
    const { sourceClient } = client(() => ({ data: row, error: null }));
    expect(await sourceClient.fetchActiveSnapshot('route-a')).toEqual({ kind: 'UNAVAILABLE' });
  });

  it('snapshot treo quá 8 s → không khả dụng', async () => {
    vi.useFakeTimers();
    const { sourceClient } = client(() => new Promise<Response>(() => {}));
    const pending = sourceClient.fetchActiveSnapshot('route-a');
    await vi.advanceTimersByTimeAsync(8_000);
    expect(await pending).toEqual({ kind: 'UNAVAILABLE' });
  });
});

describe('hiệu ứng sau mỗi lần đọc nguồn thành công (onSourceRead)', () => {
  it('đọc danh mục hoặc một tuyến thành công → gọi mọi hiệu ứng đã đăng ký với các dòng tuyến hợp lệ', async () => {
    const effect = vi.fn();
    const unregister = registerSourceReadEffect(effect);
    try {
      await client(() => ({ data: routeRows(), error: null })).sourceClient.fetchCatalog();
      await client(() => ({ data: publishedRouteRow(fixture().routes.C), error: null })).sourceClient.fetchRoute('route-c');
      expect(effect).toHaveBeenCalledTimes(2);
      expect(effect.mock.calls[0]![0].routes).toHaveLength(4);
      expect(effect.mock.calls[1]![0].routes).toEqual([fixture().routes.C]);
      expect(Number.isNaN(Date.parse(effect.mock.calls[0]![0].readAt))).toBe(false);
    } finally {
      unregister();
    }
  });

  it('đọc lỗi, đọc snapshot, hay tuyến không có dòng → không gọi hiệu ứng', async () => {
    const effect = vi.fn();
    const unregister = registerSourceReadEffect(effect);
    try {
      await client(() => ({ data: null, error: { message: 'x' } })).sourceClient.fetchCatalog();
      await client(() => ({ data: journeySnapshotRow(fixture().snapshots.A), error: null })).sourceClient.fetchActiveSnapshot('route-a');
      await client(() => ({ data: null, error: null })).sourceClient.fetchRoute('route-x');
      expect(effect).not.toHaveBeenCalled();
    } finally {
      unregister();
    }
  });

  it('hiệu ứng lỗi không làm hỏng lần đọc', async () => {
    const unregister = registerSourceReadEffect(() => Promise.reject(new Error('ghi lỗi')));
    try {
      const result = await client(() => ({ data: routeRows(), error: null })).sourceClient.fetchCatalog();
      expect(result.kind).toBe('OK');
    } finally {
      unregister();
    }
  });
});
