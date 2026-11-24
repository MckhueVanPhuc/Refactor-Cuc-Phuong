// specs/006 T022: dấu mở khóa chỉ đọc được một lần.
import { describe, expect, it } from 'vitest';
import { markUnlock, takeUnlock } from './unlockSignal';

describe('unlockSignal', () => {
  it('takeUnlock trả checkpoint một lần rồi null', () => {
    expect(takeUnlock()).toBeNull();
    markUnlock('C2');
    expect(takeUnlock()).toBe('C2');
    expect(takeUnlock()).toBeNull();
  });
});
