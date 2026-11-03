// Adapter giả in-memory của M01 cho Vitest (tasks T031; research R-01, R-16). Dữ liệu là fixture publication
// synthetic; trả dòng như view PostgREST rồi đi qua chính adapter thật, nên ánh xạ cột, schema và timeout đều được
// kiểm. E2E không dùng file này: Playwright giả Data API và Storage bằng page.route() (DV-10).
import { Blob as NodeBlob } from 'node:buffer';
import {
  journeySnapshotRow,
  nextVersion,
  publicationFixture,
  publishedRouteRow,
} from '../../../../shared/contracts/__fixtures__/publication';
import type { JourneySnapshot } from '../../../../shared/contracts/journeySnapshot';
import type { PublishedRoute } from '../../../../shared/contracts/publishedRoute';
import { pngBytes } from '../../testing/pngBytes';
import { createMediaClient, type StorageApi } from '../mediaClient';
import { createSourceClient, type DataApi, type Query } from '../sourceClient';

type Response = { data: unknown; error: unknown };

const SIGN_PREFIX = 'fake://quest-media/';

export function createFakeSource() {
  const fixture = publicationFixture();
  const routes = new Map<string, PublishedRoute>(Object.values(fixture.routes).map((route) => [route.routeId, route]));
  const snapshots = new Map<string, JourneySnapshot>(
    Object.values(fixture.snapshots).map((snapshot) => [snapshot.routeId, snapshot]),
  );
  const extraRows: unknown[] = [fixture.brokenRoute];
  const imageFailures = new Map<string, number>();
  let delayMs = 0;
  let unavailable = false;

  function respond(build: () => unknown): Promise<Response> {
    const response = (): Response =>
      unavailable ? { data: null, error: { message: 'nguồn giả không khả dụng' } } : { data: build(), error: null };
    if (delayMs === 0) return Promise.resolve(response());
    return new Promise((resolve) => setTimeout(() => resolve(response()), delayMs));
  }

  const dataApi: DataApi = {
    from(view) {
      return {
        select() {
          const filters: Record<string, string> = {};
          let single = false;
          const query: Query = {
            eq(column, value) {
              filters[column] = value;
              return query;
            },
            maybeSingle() {
              single = true;
              return query;
            },
            abortSignal() {
              return query;
            },
            then(onFulfilled, onRejected) {
              return respond(() => {
                const rows =
                  view === 'published_routes'
                    ? [...[...routes.values()].map(publishedRouteRow), ...extraRows]
                    : [...snapshots.values()].map(journeySnapshotRow);
                const routeId = filters.route_id;
                const matching =
                  routeId === undefined ? rows : rows.filter((row) => (row as { route_id?: unknown }).route_id === routeId);
                return single ? (matching[0] ?? null) : matching;
              }).then(onFulfilled, onRejected);
            },
          };
          return query;
        },
      };
    },
  };

  const storage: StorageApi = {
    from() {
      return {
        createSignedUrls: async (paths) => ({
          data: paths.map((path) => ({ path, signedUrl: `${SIGN_PREFIX}${path}`, error: null })),
          error: null,
        }),
      };
    },
  };

  // Byte ảnh là Blob của Node: fake-indexeddb trong jsdom không clone được Blob của jsdom (validation-report DV-14)
  async function fakeFetch(url: string): Promise<globalThis.Response> {
    const sourceRef = url.slice(SIGN_PREFIX.length);
    const status = imageFailures.get(sourceRef);
    if (status !== undefined) return { ok: false, status, blob: async () => new NodeBlob([]) } as unknown as globalThis.Response;
    const blob = new NodeBlob([pngBytes()], { type: 'image/png' }) as unknown as Blob;
    return { ok: true, status: 200, blob: async () => blob } as unknown as globalThis.Response;
  }

  return {
    source: createSourceClient({ dataApi: () => dataApi, isOnline: () => true }),
    media: createMediaClient({ storage: () => storage, fetch: fakeFetch }),
    controls: {
      /** US-M01-05: tuyến chuyển sang `TAM_DONG`/`LUU_TRU` (hoặc mở lại) */
      setRouteStatus(routeId: string, status: PublishedRoute['status']) {
        const route = routes.get(routeId);
        if (route) routes.set(routeId, { ...route, status });
      },
      /** Xuất bản version kế tiếp (A v1 → v2) */
      publishNextVersion(routeId: string) {
        const route = routes.get(routeId);
        const snapshot = snapshots.get(routeId);
        if (!route || !snapshot) return;
        const next = nextVersion(route, snapshot);
        routes.set(routeId, next.route);
        snapshots.set(routeId, next.snapshot);
      },
      dropEstimatedSize(routeId: string) {
        const snapshot = snapshots.get(routeId);
        if (!snapshot) return;
        const { estimatedOfflineSizeBytes: _dropped, ...rest } = snapshot;
        snapshots.set(routeId, rest);
      },
      /** Trễ mọi response (> 8 s → nguồn không khả dụng) */
      setDelayMs(ms: number) {
        delayMs = ms;
      },
      setUnavailable(value: boolean) {
        unavailable = value;
      },
      /** Ảnh trả HTTP lỗi (404, 500…) */
      failImage(sourceRef: string, status: number) {
        imageFailures.set(sourceRef, status);
      },
    },
  };
}
