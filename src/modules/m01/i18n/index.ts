// Từ điển M01 đóng gói vào JS, nên app shell precache đã chứa i18n (research R-12; spec-M01 §9.3).
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { en } from './en';
import { vi, type M01Messages } from './vi';

export type { M01Messages };

export function messagesFor(language: LanguageCode): M01Messages {
  return language === 'vi' ? vi : en;
}
