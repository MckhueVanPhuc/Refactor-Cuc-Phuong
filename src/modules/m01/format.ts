// Định dạng hiển thị của M01 (research R-18: deferred design work của spec-M01 §10.2).
import type { LanguageCode } from '../../shared/contracts/languagePreference';
import { messagesFor } from './i18n';

/** 1 MB = 1 048 576 byte (spec-M03 §5.3). */
const BYTES_PER_MB = 1_048_576;

/**
 * Câu dung lượng ước tính của dialog quyết định offline: MB làm tròn lên một chữ số thập phân, tối thiểu 0.1;
 * vắng → câu "chưa có thông tin" (không bao giờ chặn Tải, BR-M01-016).
 */
export function formatEstimatedSize(bytes: number | undefined, language: LanguageCode): string {
  const messages = messagesFor(language).routeDetail;
  if (bytes === undefined) return messages.sizeUnavailable;
  const megabytes = Math.max(0.1, Math.ceil((bytes * 10) / BYTES_PER_MB) / 10);
  const n = new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(megabytes);
  return messages.estimatedSize({ n });
}

/** Thời điểm lưu chữ cốt lõi (`routeEssentials.capturedAt`) theo múi giờ của thiết bị. */
export function formatCapturedAt(iso: string, language: LanguageCode): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

/** Quãng đường theo định dạng số của ngôn ngữ (tối đa một chữ số thập phân như contract): `2,4` / `2.4`. */
export function formatDistanceKm(distanceKm: number, language: LanguageCode): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(distanceKm);
}
