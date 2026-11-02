// Thu hồi context (selected-route-context-v3-contract §2 "Thu hồi"; BR-M01-011; DAC-M01-006): một transaction; chỉ
// context hiện tại có `routeId` thuộc danh sách và đang `AUTHORIZED` thành `REVOKED`, giữ mọi trường khác.
// Không đụng gói hay dữ liệu M02 (BR-M01-010).
import { visitorDb } from '../../../shared/db/visitorDb';
import { CURRENT_SLOT } from './rows';
import { selectedRouteContextTable } from './tables';

/** Trả `true` khi đã đổi context hiện tại sang `REVOKED`. */
export async function revokeContextForRoutes(routeIds: readonly string[]): Promise<boolean> {
  if (routeIds.length === 0) return false;
  return visitorDb.transaction('rw', selectedRouteContextTable, async () => {
    const row = await selectedRouteContextTable.get(CURRENT_SLOT);
    if (!row || row.authorizationStatus !== 'AUTHORIZED' || !routeIds.includes(row.routeId)) return false;
    await selectedRouteContextTable.put({ ...row, authorizationStatus: 'REVOKED' });
    return true;
  });
}
