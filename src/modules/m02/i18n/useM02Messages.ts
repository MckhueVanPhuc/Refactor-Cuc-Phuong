// Ngôn ngữ hiển thị của M02: LanguagePreference đã lưu, chưa có thì theo thiết bị (research R-14). Chỉ đọc qua m01Port;
// M02 không ghi preference (BR-M02-024).
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { resolveDisplayLanguage, useLanguagePreference } from '../m01Port';
import { messagesFor, type M02Messages } from './index';

export function useM02DisplayLanguage(): LanguageCode {
  const stored = useLanguagePreference();
  return resolveDisplayLanguage(stored, typeof navigator === 'undefined' ? undefined : navigator.language);
}

export function useM02Messages(): M02Messages {
  return messagesFor(useM02DisplayLanguage());
}
