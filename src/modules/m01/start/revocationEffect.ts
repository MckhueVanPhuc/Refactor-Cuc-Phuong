// Hiệu ứng thu hồi (research R-11 "Thu hồi"; BR-M01-011; US-M01-05): mọi lần đọc nguồn thành công (danh mục, chi
// tiết, Start) thấy tuyến `TAM_DONG`/`LUU_TRU` → context hiện tại của tuyến đó thành `REVOKED`. Gói giữ nguyên
// (Start offline vẫn có thể dùng gói, spec-M01 §5.4); phiên M02 đã tạo không bị đụng (BR-M01-010).
import type { SourceRead } from '../api/onSourceRead';
import { revokeContextForRoutes } from '../storage/revokeContext';

export async function revokeClosedRoutes(read: SourceRead): Promise<void> {
  const closed = read.routes.filter((route) => route.status !== 'HOAT_DONG').map((route) => route.routeId);
  await revokeContextForRoutes(closed);
}
