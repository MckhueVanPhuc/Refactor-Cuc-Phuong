// Adapter đọc nguồn M03 qua Data API (research R-05; m03-publication-consumer-contract §2).
// Nguồn khả dụng = request trả thành công trong SOURCE_REQUEST_TIMEOUT_SECONDS (provisional) và dữ liệu qua schema.
// `navigator.onLine === false` cho phép bỏ qua request; `true` không bao giờ đủ để coi là online (spec-M01 §9.3).
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';
import {
  ACTIVE_JOURNEY_SNAPSHOT_COLUMNS,
  parseJourneySnapshotRow,
  parsePublishedRouteRow,
  PUBLISHED_ROUTE_COLUMNS,
} from '../../../shared/contracts/publicationRowMapping';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import { SOURCE_REQUEST_TIMEOUT_SECONDS } from '../config/limits';
import { notifySourceRead } from './onSourceRead';
import { visitorSupabase } from './visitorSupabase';

export type SourceResult<T> = { kind: 'OK'; value: T } | { kind: 'UNAVAILABLE' };

type QueryResponse = { data: unknown; error: unknown };

/** Phần của PostgREST builder (schema `api`) mà adapter dùng; test dùng bản giả. */
export type Query = PromiseLike<QueryResponse> & {
  eq(column: string, value: string): Query;
  maybeSingle(): Query;
  abortSignal(signal: AbortSignal): Query;
};

export type DataApi = { from(view: string): { select(columns: string): Query } };

export type SourceClient = ReturnType<typeof createSourceClient>;

const UNAVAILABLE = { kind: 'UNAVAILABLE' } as const;

export function createSourceClient({
  dataApi,
  isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false,
  timeoutSeconds = SOURCE_REQUEST_TIMEOUT_SECONDS,
}: {
  dataApi: () => DataApi;
  isOnline?: () => boolean;
  timeoutSeconds?: number;
}) {
  /** Một request có timeout; lỗi, timeout, reject → `null` (nguồn không khả dụng). */
  async function request(build: (api: DataApi) => Query): Promise<{ data: unknown } | null> {
    if (!isOnline()) return null;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        resolve(null);
      }, timeoutSeconds * 1000);
    });
    try {
      const query = build(dataApi()).abortSignal(controller.signal);
      const response = await Promise.race([Promise.resolve(query).then((r) => r, () => null), timeout]);
      if (!response || response.error) return null;
      return { data: response.data };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const readAt = () => new Date().toISOString();

  return {
    /** R1: mọi dòng của `api.published_routes`; dòng không qua schema bị bỏ, không sửa (spec-M01 §11.2). */
    async fetchCatalog(): Promise<SourceResult<PublishedRoute[]>> {
      const response = await request((api) => api.from('published_routes').select(PUBLISHED_ROUTE_COLUMNS.join(',')));
      if (!response || !Array.isArray(response.data)) return UNAVAILABLE;
      const routes = response.data.map(parsePublishedRouteRow).filter((route) => route !== null);
      await notifySourceRead({ routes, readAt: readAt() });
      return { kind: 'OK', value: routes };
    },

    /** R2: dòng của một tuyến; không có dòng → `null`; dòng không qua schema → không khả dụng. */
    async fetchRoute(routeId: string): Promise<SourceResult<PublishedRoute | null>> {
      const response = await request((api) =>
        api.from('published_routes').select(PUBLISHED_ROUTE_COLUMNS.join(',')).eq('route_id', routeId).maybeSingle(),
      );
      if (!response) return UNAVAILABLE;
      if (response.data === null) return { kind: 'OK', value: null };
      const route = parsePublishedRouteRow(response.data);
      if (!route) return UNAVAILABLE;
      await notifySourceRead({ routes: [route], readAt: readAt() });
      return { kind: 'OK', value: route };
    },

    /** R3: snapshot active của một tuyến; không có → `null`; không qua schema → không khả dụng. */
    async fetchActiveSnapshot(routeId: string): Promise<SourceResult<JourneySnapshot | null>> {
      const response = await request((api) =>
        api
          .from('active_journey_snapshots')
          .select(ACTIVE_JOURNEY_SNAPSHOT_COLUMNS.join(','))
          .eq('route_id', routeId)
          .maybeSingle(),
      );
      if (!response) return UNAVAILABLE;
      if (response.data === null) return { kind: 'OK', value: null };
      const snapshot = parseJourneySnapshotRow(response.data);
      return snapshot ? { kind: 'OK', value: snapshot } : UNAVAILABLE;
    },
  };
}

/** Adapter dùng trong app: Data API của client du khách, schema `api` (Physical §7.1). */
export const sourceClient = createSourceClient({
  dataApi: () => visitorSupabase().schema('api') as unknown as DataApi,
});
