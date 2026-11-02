// Giới hạn của M01. Nơi DUY NHẤT giữ các giá trị này; mỗi hằng ghi rõ phân loại.

/**
 * **provisional** — spec-M01 §9.3: một lần đọc nguồn M03 (danh mục, chi tiết, Start, snapshot khi tải gói)
 * quá thời hạn này thì coi như nguồn không khả dụng. Chủ dự án kiểm chứng trên thiết bị thật trước lần phát hành
 * thật đầu tiên (research R-05).
 */
export const SOURCE_REQUEST_TIMEOUT_SECONDS = 8;

/**
 * Kỹ thuật (plan decision, research R-06) — không phải business rule hay hằng provisional của spec: một request
 * byte ảnh của gói treo quá thời hạn này thì tính là tải lỗi, để gói không kẹt ở `DANG_TAI` (MVP không có Cancel).
 */
export const PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS = 60;

/** Kỹ thuật (plan decision, research R-17): số request ảnh song song tối đa khi tải gói; có thể đổi. */
export const PACKAGE_IMAGE_CONCURRENCY = 4;

/** Contract — spec-M01 §5.3; DAC-M01-005: `expiresAt` = `authorizedAt` + 24 giờ, M01 không gia hạn (research R-11). */
export const HANDOFF_VALIDITY_MS = 86_400_000;
