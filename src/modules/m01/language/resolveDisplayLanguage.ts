// Ngôn ngữ hiển thị (research R-12; language-preference-contract §3): giá trị đã lưu; chưa có thì ngôn ngữ thiết bị
// (bắt đầu bằng `vi` → `vi`, ngược lại `en`). Hàm thuần, không ghi gì (BR-M02-024).
import type { LanguageCode, LanguagePreference } from '../../../shared/contracts/languagePreference';

export function resolveDisplayLanguage(
  stored: LanguagePreference | null | undefined,
  deviceLanguage: string | undefined,
): LanguageCode {
  if (stored) return stored.languageCode;
  return deviceLanguage?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}

/** Ngôn ngữ của thiết bị (`navigator.language`). */
export function deviceLanguage(): string | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.language;
}
