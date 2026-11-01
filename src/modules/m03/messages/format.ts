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
