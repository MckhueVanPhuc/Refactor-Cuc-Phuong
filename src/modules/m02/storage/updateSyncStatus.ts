// Cập nhật trạng thái đồng bộ (tasks T089; data-model §3 "Cập nhật đồng bộ"; BR-M02-010; DAC-M02-010): một transaction
// chỉ đổi `syncStatus` của mục đang `PENDING`, không bao giờ ghi `record`. `SYNCED` và `CONFLICT` là cuối cùng.
import { visitorDb } from '../../../shared/db/visitorDb';
import type { PendingSyncItemRow, SyncStatus } from './rows';
import { pendingSyncItemsTable } from './tables';

export async function updateSyncStatus(sessionId: string, next: Exclude<SyncStatus, 'PENDING'>): Promise<boolean> {
  return visitorDb.transaction('rw', pendingSyncItemsTable, async () => {
    const item = await pendingSyncItemsTable.get(sessionId);
    if (item?.syncStatus !== 'PENDING') return false;
    await pendingSyncItemsTable.update(sessionId, { syncStatus: next });
    return true;
  });
}

/** Mục còn chờ gửi, theo thứ tự kết thúc chuyến (gửi tuần tự, research R-11). */
export async function getPendingSyncItems(): Promise<PendingSyncItemRow[]> {
  const items = await pendingSyncItemsTable.where('syncStatus').equals('PENDING').toArray();
  return items.sort((a, b) => Date.parse(a.record.endedAt) - Date.parse(b.record.endedAt));
}
