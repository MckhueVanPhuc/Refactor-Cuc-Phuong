import { afterEach, describe, expect, it } from 'vitest';
import { stashDraft, takeStashedDraft } from './useSessionExpiry';

describe('giữ bản nháp khi phiên hết hạn (auth-account §2.7)', () => {
  afterEach(() => sessionStorage.clear());

  it('stash rồi lấy lại đúng một lần', () => {
    stashDraft('route:r1', { name: { vi: 'Đang gõ' } });
    expect(takeStashedDraft('route:r1')).toEqual({ name: { vi: 'Đang gõ' } });
    expect(takeStashedDraft('route:r1')).toBeUndefined();
  });

  it('khóa khác nhau không lẫn nhau; dữ liệu hỏng bị bỏ qua', () => {
    stashDraft('a', 1);
    sessionStorage.setItem('cpq:m03:draft:b', '{hỏng');
    expect(takeStashedDraft('b')).toBeUndefined();
    expect(takeStashedDraft('a')).toBe(1);
  });
});
