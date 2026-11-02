import { describe, expect, it } from 'vitest';
import * as limits from './limits';

// Bảng chép từ spec-M01 §9.3 (provisional), §5.3 (contract) và research M01 R-06, R-17 (kỹ thuật).
// Đổi giá trị ở nguồn thì đổi cả bảng này và limits.ts.
const EXPECTED: Record<string, unknown> = {
  SOURCE_REQUEST_TIMEOUT_SECONDS: 8,
  PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS: 60,
  PACKAGE_IMAGE_CONCURRENCY: 4,
  HANDOFF_VALIDITY_MS: 86_400_000,
};

describe('giới hạn M01 (research R-05, R-06, R-11, R-17)', () => {
  it('đúng giá trị nguồn, không có hằng nào khác', () => {
    expect({ ...limits }).toEqual(EXPECTED);
  });

  it('hạn handoff đúng 24 giờ', () => {
    expect(limits.HANDOFF_VALIDITY_MS).toBe(24 * 60 * 60 * 1000);
  });
});
