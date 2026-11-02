// Khoảng ngày của báo cáo (tasks T158; BR-M03-J05; research R-17; spec-M03 §5.1 "Report outputs"):
// ngày nhập dd/mm/yyyy → `YYYY-MM-DD`; hai ngày đi cùng nhau, fromDate ≤ toDate, tối đa REPORT_MAX_SPAN_DAYS ngày
// tính cả hai đầu; không nhập gì thì 30 ngày lịch kết thúc hôm nay tại Asia/Ho_Chi_Minh. Server kiểm lại cùng luật.
import { REPORT_DEFAULT_SPAN_DAYS, REPORT_MAX_SPAN_DAYS } from '../config/limits';
import { formatDate, parseDisplayDate } from '../messages/format';

export type ReportDateInput = { fromText: string; toText: string };
export type ResolvedReportDates =
  | { ok: true; fromDate: string; toDate: string }
  | { ok: false; messageKey: 'MSG-REPORT-DATES-INVALID' | 'MSG-REPORT-SPAN' };

const DAY_MS = 86_400_000;

/** Ngày `YYYY-MM-DD` cộng `days` ngày lịch */
function addDays(isoDate: string, days: number): string {
  return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Số ngày lịch từ `fromDate` đến `toDate`, tính cả hai đầu */
function inclusiveDays(fromDate: string, toDate: string): number {
  return Math.round((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / DAY_MS) + 1;
}

/** Hôm nay theo giờ Việt Nam, dạng `YYYY-MM-DD` */
export function vietnamToday(now: Date): string {
  return parseDisplayDate(formatDate(now))!;
}

/** Mặc định: 30 ngày lịch kết thúc hôm nay, tính cả hai đầu (BR-M03-J05) */
export function defaultReportDates(now: Date): { fromDate: string; toDate: string } {
  const toDate = vietnamToday(now);
  return { fromDate: addDays(toDate, -(REPORT_DEFAULT_SPAN_DAYS - 1)), toDate };
}

/** Ngày hiển thị dd/mm/yyyy của một ngày `YYYY-MM-DD` (để điền sẵn ô nhập) */
export function displayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export function resolveReportDates({ fromText, toText }: ReportDateInput, now: Date): ResolvedReportDates {
  const hasFrom = fromText.trim() !== '';
  const hasTo = toText.trim() !== '';
  if (!hasFrom && !hasTo) return { ok: true, ...defaultReportDates(now) };
  const fromDate = hasFrom ? parseDisplayDate(fromText) : null;
  const toDate = hasTo ? parseDisplayDate(toText) : null;
  if (!fromDate || !toDate || fromDate > toDate) return { ok: false, messageKey: 'MSG-REPORT-DATES-INVALID' };
  if (inclusiveDays(fromDate, toDate) > REPORT_MAX_SPAN_DAYS) return { ok: false, messageKey: 'MSG-REPORT-SPAN' };
  return { ok: true, fromDate, toDate };
}

/** Kiểm lại phía server (adapter giả, giai đoạn B): cùng luật trên `YYYY-MM-DD` */
export function validReportRange(fromDate: string | undefined, toDate: string | undefined, now: Date): { fromDate: string; toDate: string } | null {
  if (fromDate === undefined && toDate === undefined) return defaultReportDates(now);
  if (!fromDate || !toDate || fromDate > toDate || inclusiveDays(fromDate, toDate) > REPORT_MAX_SPAN_DAYS) return null;
  return { fromDate, toDate };
}
