// Registry hiệu ứng sau mỗi lần đọc nguồn M03 thành công (tasks T029). US5 đăng ký thu hồi context của tuyến
// đóng (BR-M01-011); US6 đăng ký đánh dấu `OUTDATED` và làm mới chữ cốt lõi (FR-M01-010, 014; research R-10).
// Mỗi hiệu ứng tự chạy transaction ngắn của nó; lỗi của một hiệu ứng không làm hỏng lần đọc.
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';

export type SourceRead = {
  /** Các dòng tuyến hợp lệ vừa đọc (danh mục: mọi dòng; một tuyến: dòng đó) */
  routes: PublishedRoute[];
  /** Thời điểm đọc, ISO-8601 UTC (dùng làm `routeEssentials.capturedAt`) */
  readAt: string;
};

export type SourceReadEffect = (read: SourceRead) => void | Promise<void>;

const effects = new Set<SourceReadEffect>();

export function registerSourceReadEffect(effect: SourceReadEffect): () => void {
  effects.add(effect);
  return () => effects.delete(effect);
}

export async function notifySourceRead(read: SourceRead): Promise<void> {
  await Promise.allSettled([...effects].map(async (effect) => effect(read)));
}
