// Từ điển M02 đóng gói vào JS, nên app shell precache đã chứa i18n (research R-14; spec-M02 §9).
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { en } from './en';
import { vi, type M02Messages } from './vi';

export type { M02Messages };

export function messagesFor(language: LanguageCode): M02Messages {
  return language === 'vi' ? vi : en;
}
