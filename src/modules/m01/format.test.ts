// Định dạng hiển thị (research R-18; bảng copy SCR-M01-003).
import { describe, expect, it } from 'vitest';
import { formatCapturedAt, formatEstimatedSize } from './format';

const MB = 1_048_576;

describe('formatEstimatedSize', () => {
  it.each([
    [MB, 'vi', 'Dung lượng ước tính: khoảng 1 MB.'],
    [1.5 * MB, 'vi', 'Dung lượng ước tính: khoảng 1,5 MB.'],
    [1.5 * MB, 'en', 'Estimated size: about 1.5 MB.'],
    // làm tròn lên một chữ số thập phân
    [1.51 * MB, 'en', 'Estimated size: about 1.6 MB.'],
    [MB + 1, 'en', 'Estimated size: about 1.1 MB.'],
    [38 * MB, 'vi', 'Dung lượng ước tính: khoảng 38 MB.'],
    // tối thiểu 0.1
    [1, 'en', 'Estimated size: about 0.1 MB.'],
    [0, 'vi', 'Dung lượng ước tính: khoảng 0,1 MB.'],
  ] as const)('%d byte (%s)', (bytes, lang, expected) => {
    expect(formatEstimatedSize(bytes, lang)).toBe(expected);
  });

  it.each([
    ['vi', 'Chưa có thông tin dung lượng.'],
    ['en', 'Size not available.'],
  ] as const)('vắng ước tính (%s)', (lang, expected) => {
    expect(formatEstimatedSize(undefined, lang)).toBe(expected);
  });
});

describe('formatCapturedAt', () => {
  it.each(['vi', 'en'] as const)('dùng Intl.DateTimeFormat short/short theo múi giờ thiết bị (%s)', (lang) => {
    const iso = '2026-11-02T01:05:00.000Z';
    const expected = new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
    expect(formatCapturedAt(iso, lang)).toBe(expected);
  });
});
