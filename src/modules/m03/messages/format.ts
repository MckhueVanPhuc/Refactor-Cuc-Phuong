import { BYTES_PER_MB, QR_CODE_DISPLAY_SUFFIX_CHARS } from '../config/limits';

// Giờ hiển thị cố định Asia/Ho_Chi_Minh, không phụ thuộc múi giờ của máy (environment.md §8; research R-17)
const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateParts = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeParts = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const megabytes = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

function part(formatter: Intl.DateTimeFormat, value: Date, type: Intl.DateTimeFormatPartTypes): string {
  return formatter.formatToParts(value).find((p) => p.type === type)?.value ?? '';
}

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

/** dd/mm/yyyy theo giờ Việt Nam */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  return `${part(dateParts, date, 'day')}/${part(dateParts, date, 'month')}/${part(dateParts, date, 'year')}`;
}

/** hh:mm (24 giờ) theo giờ Việt Nam */
export function formatTime(value: string | Date): string {
  const date = toDate(value);
  return `${part(timeParts, date, 'hour')}:${part(timeParts, date, 'minute')}`;
}

/** Ngày nhân viên gõ dạng dd/mm/yyyy (như ngày hiện trên màn) → `YYYY-MM-DD`; sai dạng hoặc không có thật → null */
export function parseDisplayDate(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Việt Nam không đổi giờ theo mùa: UTC+7 quanh năm
const VIETNAM_OFFSET = '+07:00';

/** 00:00 giờ Việt Nam của ngày `YYYY-MM-DD` cộng `addDays` ngày, dạng UTC ISO 8601 (mốc lọc theo ngày lịch) */
export function vietnamDayStartUtc(isoDate: string, addDays = 0): string {
  const start = new Date(`${isoDate}T00:00:00${VIETNAM_OFFSET}`);
  start.setUTCDate(start.getUTCDate() + addDays);
  return start.toISOString();
}

/** Số MB (1 MB = 1 048 576 byte), tối đa một chữ số thập phân, không kèm đơn vị — cho placeholder "{số} MB". */
export function formatMegabytes(bytes: number): string {
  return megabytes.format(bytes / BYTES_PER_MB);
}

/** Dung lượng kèm đơn vị, ví dụ "1,5 MB" */
export function formatBytes(bytes: number): string {
  return `${formatMegabytes(bytes)} MB`;
}

/** Ký tự cuối của mã QR hiện cho nhân viên ("Mã …xxxxxx", BR-M03-E16) */
export function qrSuffix(qrIdentifier: string): string {
  return qrIdentifier.slice(-QR_CODE_DISPLAY_SUFFIX_CHARS);
}
