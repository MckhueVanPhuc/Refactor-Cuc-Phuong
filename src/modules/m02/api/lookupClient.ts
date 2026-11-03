// Adapter tra cứu QR (tasks T021; research R-08; live-qr-lookup-consumer-contract §1, §3): RPC `api.lookup_qr` qua
// Data API với role `anon`. Lỗi mạng, lỗi RPC, quá LOOKUP_TIMEOUT_SECONDS (provisional), body không qua schema hay
// `navigator.onLine === false` đều là lỗi nguồn — không bao giờ là `INVALID` (FR-M02-013). Kết quả không bao giờ được lưu.
import { liveQrLookupResultSchema, type LiveStationContent } from '../../../shared/contracts/liveQrLookup';
import { LOOKUP_TIMEOUT_SECONDS } from '../config/limits';
import { visitorSupabase } from './visitorSupabase';

export type LookupOutcome =
  | { kind: 'VALID'; content: LiveStationContent }
  | { kind: 'TEMPORARILY_CLOSED'; closedScope: 'ROUTE' | 'CHECKPOINT' }
  | { kind: 'INVALID' }
  | { kind: 'SOURCE_ERROR' };

type RpcResponse = { data: unknown; error: unknown };

/** Phần của PostgREST RPC builder mà adapter dùng; test dùng bản giả. */
export type RpcQuery = PromiseLike<RpcResponse> & { abortSignal(signal: AbortSignal): RpcQuery };
export type RpcApi = { rpc(fn: string, args: Record<string, unknown>): RpcQuery };

export type LookupClient = { lookup(qrIdentifier: string, routeId?: string): Promise<LookupOutcome> };

const SOURCE_ERROR = { kind: 'SOURCE_ERROR' } as const;

export function createLookupClient({
  rpc,
  isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false,
  timeoutSeconds = LOOKUP_TIMEOUT_SECONDS,
}: {
  rpc: () => RpcApi;
  isOnline?: () => boolean;
  timeoutSeconds?: number;
}): LookupClient {
  return {
    async lookup(qrIdentifier, routeId) {
      if (!isOnline()) return SOURCE_ERROR;
      // `p_route_id` chỉ khi có phiên (BR-M02-019); khách tự do không gửi tuyến
      const args: Record<string, unknown> = { p_qr_identifier: qrIdentifier };
      if (routeId !== undefined) args.p_route_id = routeId;

      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          controller.abort();
          resolve(null);
        }, timeoutSeconds * 1000);
      });
      try {
        const query = rpc().rpc('lookup_qr', args).abortSignal(controller.signal);
        const response = await Promise.race([Promise.resolve(query).then((r) => r, () => null), timeout]);
        if (!response || response.error) return SOURCE_ERROR;
        const parsed = liveQrLookupResultSchema.safeParse(response.data);
        if (!parsed.success) return SOURCE_ERROR;
        const result = parsed.data;
        if (result.outcome === 'VALID') return { kind: 'VALID', content: result.content };
        if (result.outcome === 'TEMPORARILY_CLOSED') return { kind: 'TEMPORARILY_CLOSED', closedScope: result.closedScope };
        return { kind: 'INVALID' };
      } catch {
        return SOURCE_ERROR;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export const lookupClient: LookupClient = createLookupClient({ rpc: () => visitorSupabase() as unknown as RpcApi });
