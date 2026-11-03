// Hàm đọc ba store M02 (tasks T019; data-model §2). Hook dùng `liveQuery` của Dexie nên tab khác cùng trình duyệt
// thấy ngay khi phiên hay lượt ghé đổi (BR-M02-002). Không await gì ngoài Dexie, nên chạy được trong transaction bao ngoài.
import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';
import type { CheckpointVisitRow, PendingSyncItemRow, PlaySessionRow } from './rows';
import { checkpointVisitsTable, pendingSyncItemsTable, playSessionsTable } from './tables';

/** Phiên `DANG_DIEN_RA` (tối đa một mỗi trình duyệt, DAC-M02-002); không có → `null`. */
export async function getRunningSession(): Promise<PlaySessionRow | null> {
  return (await playSessionsTable.where('status').equals('DANG_DIEN_RA').first()) ?? null;
}

/** Có phiên đang chạy không — update coordinator gọi trước khi áp bản mới (research R-15). */
export async function hasRunningSession(): Promise<boolean> {
  return (await playSessionsTable.where('status').equals('DANG_DIEN_RA').count()) > 0;
}

export async function getSessionVisits(sessionId: string): Promise<CheckpointVisitRow[]> {
  return checkpointVisitsTable.where('sessionId').equals(sessionId).toArray();
}

/** Mục hàng đợi của chuyến kết thúc gần nhất (theo `record.endedAt`); không có → `null` (E-SCR-M02-001-22). */
export async function getLatestTerminalSyncItem(): Promise<PendingSyncItemRow | null> {
  const items = await pendingSyncItemsTable.toArray();
  return items.reduce<PendingSyncItemRow | null>(
    (latest, item) => (!latest || Date.parse(item.record.endedAt) > Date.parse(latest.record.endedAt) ? item : latest),
    null,
  );
}

export type LiveValue<T> = { status: 'loading' } | { status: 'ready'; value: T };

/** Giá trị đọc theo thời gian thực; đổi `deps` thì đọc lại từ đầu. Lỗi IndexedDB giữ trạng thái `loading`. */
function useLiveValue<T>(query: () => Promise<T>, deps: readonly unknown[]): LiveValue<T> {
  const [state, setState] = useState<LiveValue<T>>({ status: 'loading' });
  useEffect(() => {
    setState({ status: 'loading' });
    const subscription = liveQuery(query).subscribe({ next: (value) => setState({ status: 'ready', value }) });
    return () => subscription.unsubscribe();
    // `query` đóng gói đúng các giá trị trong `deps`
  }, deps);
  return state;
}

export function useRunningSession(): LiveValue<PlaySessionRow | null> {
  return useLiveValue(getRunningSession, []);
}

export function useSessionVisits(sessionId: string | undefined): LiveValue<CheckpointVisitRow[]> {
  return useLiveValue(() => (sessionId ? getSessionVisits(sessionId) : Promise.resolve([])), [sessionId]);
}
