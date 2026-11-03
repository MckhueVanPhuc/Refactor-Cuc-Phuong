import { describe, expect, it } from 'vitest';
import * as limits from './limits';

// Bảng chép từ spec-M02 §9 (provisional), BR-M02-022 (business rule) và research M02 R-11, R-13 (kỹ thuật).
// Đổi giá trị ở nguồn thì đổi cả bảng này và limits.ts.
const EXPECTED: Record<string, unknown> = {
  LOOKUP_TIMEOUT_SECONDS: 8,
  SYNC_REQUEST_TIMEOUT_SECONDS: 30,
  SYNC_RETRY_DELAYS_MS: [30_000, 60_000, 120_000, 300_000],
  SCANNER_DUPLICATE_IGNORE_MS: 1_500,
  AUTO_END_AFTER_MS: 86_400_000,
};

describe('giới hạn M02 (research R-11, R-13, R-16)', () => {
  it('đúng giá trị nguồn, không có hằng nào khác', () => {
    expect({ ...limits }).toEqual(EXPECTED);
  });

  it('tự đóng sau đúng 24 giờ; thử lại giữ ở 5 phút', () => {
    expect(limits.AUTO_END_AFTER_MS).toBe(24 * 60 * 60 * 1000);
    expect(limits.SYNC_RETRY_DELAYS_MS.at(-1)).toBe(5 * 60 * 1000);
  });
});
