// Ngôn ngữ hiển thị (tasks T035; research R-12; BR-M02-024).
import { describe, expect, it } from 'vitest';
import { resolveDisplayLanguage } from './resolveDisplayLanguage';

describe('resolveDisplayLanguage', () => {
  it.each([
    [{ languageCode: 'en' as const }, 'vi-VN', 'en'],
    [{ languageCode: 'vi' as const }, 'en-US', 'vi'],
  ])('giá trị đã lưu thắng ngôn ngữ thiết bị', (stored, device, expected) => {
    expect(resolveDisplayLanguage(stored, device)).toBe(expected);
  });

  it.each([
    ['vi', 'vi'],
    ['vi-VN', 'vi'],
    ['VI-vn', 'vi'],
    ['en-US', 'en'],
    ['fr-FR', 'en'],
    ['', 'en'],
    [undefined, 'en'],
  ])('chưa lưu: thiết bị %s → %s', (device, expected) => {
    expect(resolveDisplayLanguage(null, device)).toBe(expected);
  });
});
