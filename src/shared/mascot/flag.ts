// Công tắc phát hành mascot Mila (spec-Mascot OD-MAS-15; research R-13). Đọc mỗi lần gọi để test bật/tắt được.
// Giá trị đã được kiểm ở src/shared/config/env.ts; ở đây chỉ so đúng chuỗi "on".
export function isMascotEnabled(): boolean {
  return import.meta.env.VITE_FEATURE_MASCOT === 'on';
}
