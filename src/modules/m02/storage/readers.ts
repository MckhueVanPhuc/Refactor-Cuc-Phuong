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
export async function getSession(sessionId: string): Promise<PlaySessionRow | null> {
  return (await playSessionsTable.get(sessionId)) ?? null;
}

/** Mục hàng đợi đồng bộ của một phiên terminal; chưa có → `null`. */
export async function getSyncItem(sessionId: string): Promise<PendingSyncItemRow | null> {
  return (await pendingSyncItemsTable.get(sessionId)) ?? null;
}

export async function hasRunningSession(): Promise<boolean> {
  return (await playSessionsTable.where('status').equals('DANG_DIEN_RA').count()) > 0;
}

/** Lượt ghé của một checkpoint trong phiên; chưa có → `null` (xem lại, scan-resolution §4). */
export async function getVisit(sessionId: string, checkpointId: string): Promise<CheckpointVisitRow | null> {
  return (await checkpointVisitsTable.get([sessionId, checkpointId])) ?? null;
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

/**
 * Giá trị đọc theo thời gian thực. Đổi `deps` thì coi như đang tải cho tới khi có giá trị của chính `deps` mới — không
 * bao giờ trả giá trị của lần đọc trước (ví dụ danh sách lượt ghé rỗng của lúc chưa có phiên). Lỗi IndexedDB giữ `loading`.
 */
function useLiveValue<T>(query: () => Promise<T>, deps: readonly unknown[]): LiveValue<T> {
  const key = JSON.stringify(deps);
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  useEffect(() => {
    const subscription = liveQuery(query).subscribe({ next: (value) => setState({ key, value }) });
    return () => subscription.unsubscribe();
    // `query` đóng gói đúng các giá trị trong `deps` (`key` là bản chuỗi của chúng)
  }, [key]);
  return state && state.key === key ? { status: 'ready', value: state.value } : { status: 'loading' };
}

export function useRunningSession(): LiveValue<PlaySessionRow | null> {
  return useLiveValue(getRunningSession, []);
}

export function useSessionVisits(sessionId: string | undefined): LiveValue<CheckpointVisitRow[]> {
  return useLiveValue(() => (sessionId ? getSessionVisits(sessionId) : Promise.resolve([])), [sessionId]);
}

export function useSession(sessionId: string | undefined): LiveValue<PlaySessionRow | null> {
  return useLiveValue(() => (sessionId ? getSession(sessionId) : Promise.resolve(null)), [sessionId]);
}

export function useSyncItem(sessionId: string | undefined): LiveValue<PendingSyncItemRow | null> {
  return useLiveValue(() => (sessionId ? getSyncItem(sessionId) : Promise.resolve(null)), [sessionId]);
}

export function useLatestTerminalSyncItem(): LiveValue<PendingSyncItemRow | null> {
  return useLiveValue(getLatestTerminalSyncItem, []);
}
