// Giới hạn tạm của Mila (spec-Mascot §5.4). Chủ dự án kiểm ngoài thực địa trước khi phát hành (OD-MAS-12).
export const MASCOT_SCANNER_LOOK_MS = 15_000;
export const MASCOT_SCANNER_HELP_MS = 30_000;
export const MASCOT_SCANNER_CAMERA_OFF_MS = 90_000;
export const MASCOT_CATALOG_HINT_MS = 20_000;
export const MASCOT_LOOKUP_SLOW_MS = 3_000;
export const MASCOT_WELCOME_BACK_MS = 10 * 60_000;
export const MASCOT_PROACTIVE_LIMIT = 3;
export const MASCOT_PROACTIVE_WINDOW_MS = 10 * 60_000;
export const MASCOT_QUEUE_TTL_MS = 4_000;
export const MASCOT_CELEBRATION_MS = 2_400;
export const MASCOT_VIBRATION_MS = 30;
/** Cùng mức ưu tiên: câu mới chỉ thay câu cũ đã hiện ít nhất chừng này (State Machine §5.2). */
export const MASCOT_SAME_PRIORITY_MIN_MS = 1_500;
/** Sự kiện giống hệt trong khoảng này chỉ xử lý một lần (BR-MAS-06). */
export const MASCOT_DEDUPE_MS = 500;
/** Câu nhắc thiên nhiên MSG-MAS-057a–e chỉ bật sau khi Ban Quản lý duyệt câu chữ (BR-MAS-13; OD-MAS-05). */
export const NATURE_REMINDERS_APPROVED = false;
