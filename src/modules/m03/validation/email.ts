// Email quản trị (BR-M03-K01; auth-account §2.2 bước 2): chuẩn hóa trước khi lưu và trước mọi so sánh.
import { EMAIL_MAX_CHARS } from '../config/limits';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** lower(trim(email)) */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Email đã chuẩn hóa: ≤ EMAIL_MAX_CHARS và đúng dạng */
export function isValidEmail(normalized: string): boolean {
  return normalized.length <= EMAIL_MAX_CHARS && EMAIL_SHAPE.test(normalized);
}
