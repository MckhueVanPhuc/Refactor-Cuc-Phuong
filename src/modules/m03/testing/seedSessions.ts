// SessionRecord synthetic cho test báo cáo (US9). Intake thật ở giai đoạn B; ở đây ghi thẳng vào store giả.
// Chỉ test import file này.
import type { SessionSyncRecord } from '../../../shared/contracts/sessionSyncRecord';
import type { FakeStore } from '../api/fake/store';

let counter = 0;

/** Một chuyến đi kết thúc `daysAgo` ngày trước, đã gửi về ngay khi kết thúc */
export function syntheticSession(
  routeId: string,
  daysAgo: number,
  status: SessionSyncRecord['status'],
  visits: { checkpointId: string; checkpointName: string; sequence: number }[] = [],
): SessionSyncRecord & { ingestedAt: string } {
  const endedAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  const startedAt = new Date(Date.parse(endedAt) - 3_600_000).toISOString();
  counter += 1;
  return {
    sessionId: `00000000-0000-4000-9000-${String(counter).padStart(12, '0')}`,
    routeId,
    contentVersion: 1,
    startedAt,
    endedAt,
    status,
    visitedCheckpoints: visits.map((visit) => ({ ...visit, checkedInAt: startedAt })),
    ingestedAt: endedAt,
  };
}

export function seedSessionRecords(store: FakeStore, records: (SessionSyncRecord & { ingestedAt: string })[]): void {
  for (const record of records) store.state.sessionRecords.set(record.sessionId, structuredClone(record));
}
