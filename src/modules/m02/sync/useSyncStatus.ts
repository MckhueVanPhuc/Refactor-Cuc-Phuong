// Trạng thái đồng bộ cho giao diện (tasks T091; E-SCR-M02-003-07, -08; E-SCR-M02-001-22; BR-M02-011). Chỉ hiển thị:
// không có thao tác nào của du khách để thử lại, sửa hay xóa.
import { useLatestTerminalSyncItem, useRunningSession, useSyncItem } from '../storage/readers';
import type { SyncStatus } from '../storage/rows';

/** `undefined` = đang đọc hoặc phiên chưa có mục hàng đợi. Offline vẫn là `PENDING` ("Chờ gửi về hệ thống"). */
export function useSyncStatus(sessionId: string | undefined): SyncStatus | undefined {
  const item = useSyncItem(sessionId);
  return item.status === 'ready' ? item.value?.syncStatus : undefined;
}

/** Dòng lỗi E-SCR-M02-001-22: chuyến kết thúc gần nhất không gửi được (`CONFLICT`) và chưa có chuyến mới. */
export function usePreviousTripSyncError(): boolean {
  const latest = useLatestTerminalSyncItem();
  const running = useRunningSession();
  return latest.status === 'ready' && latest.value?.syncStatus === 'CONFLICT' && running.status === 'ready' && running.value === null;
}
