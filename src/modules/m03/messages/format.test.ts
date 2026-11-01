import { describe, expect, it } from 'vitest';
import { formatBytes, formatDate, formatMegabytes, formatTime, parseDisplayDate, qrSuffix, vietnamDayStartUtc } from './format';

// Kết quả không phụ thuộc múi giờ của máy: mọi hàm cố định Asia/Ho_Chi_Minh (environment.md §8; research R-17)
describe('định dạng hiển thị', () => {
  it('formatDate dd/mm/yyyy theo giờ Việt Nam', () => {
    // 17:30 UTC ngày 31/12 là 00:30 ngày 01/01 ở Việt Nam
    expect(formatDate('2026-12-31T17:30:00Z')).toBe('01/01/2027');
    expect(formatDate('2026-03-05T01:00:00Z')).toBe('05/03/2026');
  });

  it('formatTime hh:mm 24 giờ theo giờ Việt Nam', () => {
    expect(formatTime('2026-10-30T13:05:00Z')).toBe('20:05');
    expect(formatTime('2026-10-30T17:00:00Z')).toBe('00:00');
  });

  it('nhận cả Date', () => {
    expect(formatTime(new Date('2026-10-30T02:07:00Z'))).toBe('09:07');
  });

  it('formatMegabytes / formatBytes: MB = 1 048 576 byte, tối đa một chữ số thập phân', () => {
    expect(formatMegabytes(1_048_576)).toBe('1');
    expect(formatMegabytes(1_572_864)).toBe('1,5');
    expect(formatMegabytes(52_428_800 + 1)).toBe('50');
    expect(formatBytes(3_145_728)).toBe('3 MB');
  });

  it('parseDisplayDate: dd/mm/yyyy → YYYY-MM-DD; ngày không có thật hoặc sai dạng → null', () => {
    expect(parseDisplayDate('05/03/2026')).toBe('2026-03-05');
    expect(parseDisplayDate(' 1/3/2026 ')).toBe('2026-03-01');
    expect(parseDisplayDate('29/02/2028')).toBe('2028-02-29');
    expect(parseDisplayDate('29/02/2027')).toBeNull();
    expect(parseDisplayDate('31/04/2026')).toBeNull();
    expect(parseDisplayDate('2026-03-05')).toBeNull();
    expect(parseDisplayDate('')).toBeNull();
  });

  it('vietnamDayStartUtc: 00:00 giờ Việt Nam của ngày YYYY-MM-DD, dạng UTC', () => {
    expect(vietnamDayStartUtc('2026-11-01')).toBe('2026-10-31T17:00:00.000Z');
    expect(vietnamDayStartUtc('2026-11-01', 1)).toBe('2026-11-01T17:00:00.000Z');
  });

  it('qrSuffix lấy 6 ký tự cuối', () => {
    expect(qrSuffix('AbCdEf0123456789')).toBe('456789');
    expect(qrSuffix('abc')).toBe('abc');
  });
});
