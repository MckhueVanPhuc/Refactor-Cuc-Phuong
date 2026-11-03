// Giới hạn của M02. Nơi DUY NHẤT giữ các giá trị này; mỗi hằng ghi rõ phân loại (research R-16).

/**
 * **provisional** — spec-M02 §9, BR-M02-005: một lần tra cứu QR không có phản hồi trong thời hạn này thì coi là
 * lỗi nguồn (không bao giờ là `INVALID`). Chủ dự án kiểm chứng trên thiết bị thật trước lần phát hành thật đầu tiên.
 */
export const LOOKUP_TIMEOUT_SECONDS = 8;

/** Kỹ thuật (plan decision, research R-11) — không phải business rule: một lần gửi `session-intake` quá hạn = giữ `PENDING`. */
export const SYNC_REQUEST_TIMEOUT_SECONDS = 30;

/** Kỹ thuật (plan decision, research R-11) — không phải business rule: giãn cách thử lại 30 s → 1 → 2 → 5 phút, giữ 5 phút. */
export const SYNC_RETRY_DELAYS_MS = [30_000, 60_000, 120_000, 300_000] as const;

/** Kỹ thuật (plan decision, research R-13) — không phải business rule: bỏ qua decode lặp của scanner trong khoảng này. */
export const SCANNER_DUPLICATE_IGNORE_MS = 1_500;

/** Business rule — BR-M02-022, FR-M02-024: phiên `DANG_DIEN_RA` có `now − startedAt` lớn hơn hẳn 24 giờ thì tự đóng. */
export const AUTO_END_AFTER_MS = 86_400_000;
