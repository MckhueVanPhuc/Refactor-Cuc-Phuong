// Từ điển theo ngôn ngữ hiển thị của du khách: đã lưu, ngược lại theo thiết bị (research R-12).
import { useDisplayLanguage } from '../language/useLanguagePreference';
import { messagesFor, type M01Messages } from './index';

export function useM01Messages(): M01Messages {
  return messagesFor(useDisplayLanguage());
}
