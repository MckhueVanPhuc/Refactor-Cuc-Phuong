// Từ điển theo ngôn ngữ hiển thị của du khách. Khung Phase 2 chưa có LanguagePreference nên tạm dùng `vi`;
// US1 (tasks T040–T042) thay bằng ngôn ngữ đã chọn qua useLanguagePreference + resolveDisplayLanguage.
import { messagesFor, type M01Messages } from './index';

export function useM01Messages(): M01Messages {
  return messagesFor('vi');
}
