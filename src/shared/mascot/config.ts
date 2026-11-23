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
/** Bong bóng xác nhận lượt ghé chưa hiện sau chừng này → màn hiện toast dự phòng (BR-MAS-24, v1.2). */
export const MASCOT_CONFIRM_FALLBACK_MS = 1_000;
/** Chữ trong bong bóng hiện dần, ký tự mỗi giây (spec-Mascot v1.1 §5.4; research R-20). */
export const MASCOT_TYPE_CPS = 30;
/** Cử chỉ tự động ở màn Mila đứng chờ: khoảng cách ngẫu nhiên giữa hai cử chỉ (BR-MAS-21). */
export const MASCOT_AMBIENT_MIN_MS = 8_000;
export const MASCOT_AMBIENT_MAX_MS = 15_000;
/** Một cử chỉ tự động dài nhất (Asset spec AN-AMBIENT). */
export const MASCOT_AMBIENT_GESTURE_MS = 1_500;
/** Chớp mắt: ảnh mắt nhắm hiện chừng này (Asset spec AN-BLINK; `--duration-mascot-blink`). */
export const MASCOT_BLINK_MS = 120;
/** Chạm nhiều lần (BR-MAS-22): chạm dồn trong khoảng này tính một lần; số lần chạm trong cửa sổ để "chóng mặt". */
export const MASCOT_TAP_DEBOUNCE_MS = 400;
export const MASCOT_DIZZY_TAPS = 5;
export const MASCOT_DIZZY_WINDOW_MS = 3_000;
/** Câu bắt đầu chuyến hiện sau khi câu gợi ý cố định của màn đã hiện (Behavior Matrix MAS-B-030). */
export const MASCOT_TRIP_START_DELAY_MS = 800;
/** Màn Mila đứng chờ: danh mục, chuyến đi (scanner đóng), màn kết quả. */
export const MASCOT_AMBIENT_PATHS: readonly string[] = ['/', '/trip', '/trip/end'];
/** Cùng mức ưu tiên: câu mới chỉ thay câu cũ đã hiện ít nhất chừng này (State Machine §5.2). */
export const MASCOT_SAME_PRIORITY_MIN_MS = 1_500;
/** Sự kiện giống hệt trong khoảng này chỉ xử lý một lần (BR-MAS-06). */
export const MASCOT_DEDUPE_MS = 500;
/** Ngữ cảnh "đang thao tác" (BR-MAS-20): ý định theo hẹn giờ và cử chỉ tự động bị bỏ trong khoảng này sau thao tác. */
export const MASCOT_INTERACTION_GRACE_MS = 2_000;
/** Câu nhắc thiên nhiên MSG-MAS-057a–e chỉ bật sau khi Ban Quản lý duyệt câu chữ (BR-MAS-13; OD-MAS-05). */
export const NATURE_REMINDERS_APPROVED = false;
