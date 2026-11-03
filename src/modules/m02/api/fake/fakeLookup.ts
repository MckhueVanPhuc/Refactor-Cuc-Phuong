// Lookup giả cho Vitest (tasks T023): trả nội dung của fixtures.ts theo mã; mã không có → `INVALID`. Từng mã có thể
// đặt kết quả `TEMPORARILY_CLOSED` / `INVALID` / lỗi nguồn hoặc trả trễ. E2E không dùng file này: E2E giả lập
// `/rest/v1/rpc/lookup_qr` bằng `page.route()` (research R-19).
import type { LookupClient, LookupOutcome } from '../lookupClient';
import { LIVE_CONTENT } from './fixtures';

type Override = { outcome: LookupOutcome; delayMs?: number };

export type FakeLookup = LookupClient & {
  /** Mọi lời gọi theo thứ tự; `routeId` vắng khi khách tự do (BR-M02-019). */
  readonly calls: { qrIdentifier: string; routeId?: string }[];
  set(qrIdentifier: string, outcome: LookupOutcome | 'SOURCE_ERROR', options?: { delayMs?: number }): void;
  reset(): void;
};

export function createFakeLookup(): FakeLookup {
  const overrides = new Map<string, Override>();
  const calls: FakeLookup['calls'] = [];

  return {
    calls,
    set(qrIdentifier, outcome, options = {}) {
      overrides.set(qrIdentifier, {
        outcome: outcome === 'SOURCE_ERROR' ? { kind: 'SOURCE_ERROR' } : outcome,
        ...(options.delayMs !== undefined && { delayMs: options.delayMs }),
      });
    },
    reset() {
      overrides.clear();
      calls.length = 0;
    },
    async lookup(qrIdentifier, routeId) {
      calls.push(routeId === undefined ? { qrIdentifier } : { qrIdentifier, routeId });
      const override = overrides.get(qrIdentifier);
      if (override?.delayMs) await new Promise((resolve) => setTimeout(resolve, override.delayMs));
      if (override) return structuredClone(override.outcome);
      const content = LIVE_CONTENT[qrIdentifier];
      return content ? { kind: 'VALID', content: structuredClone(content) } : { kind: 'INVALID' };
    },
  };
}
