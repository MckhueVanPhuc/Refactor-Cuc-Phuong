// Dấu "vừa có lượt ghé mới" (specs/006 data-model §3; research R-05): UI state trong bộ nhớ của lần tải trang. Ghi khi
// du khách bấm "Quay lại" từ nội dung của một lượt ghé mới (không phải điểm cuối); SCR-M02-001 đọc một lần để chạy
// hiệu ứng mở khóa. Không phải dữ liệu chuyến: không vào PlaySession, CheckpointVisit hay SessionSyncRecord.
let pending: string | null = null;

export function markUnlock(checkpointId: string): void {
  pending = checkpointId;
}

/** Trả checkpoint vừa mở khóa một lần rồi xóa. */
export function takeUnlock(): string | null {
  const value = pending;
  pending = null;
  return value;
}
