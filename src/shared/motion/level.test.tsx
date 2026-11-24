// specs/006 T004: mức chuyển động hiệu lực và thuộc tính trên <html> (data-model §2).
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readMotionLevel, useMotionAttributes } from './level';
import { resetMotionForTest, setMotion } from './store';

function stubMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

function stubNavigator(extra: Record<string, unknown>) {
  for (const [key, value] of Object.entries(extra)) Object.defineProperty(navigator, key, { value, configurable: true });
}

function Root() {
  useMotionAttributes();
  return null;
}

describe('mức chuyển động (specs/006 data-model §2)', () => {
  beforeEach(() => {
    resetMotionForTest();
    stubMedia(false);
    stubNavigator({ connection: undefined, deviceMemory: undefined });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete document.documentElement.dataset['motion'];
    delete document.documentElement.dataset['decor'];
  });

  it('mặc định: full, trang trí bật; trình duyệt không báo bộ nhớ hay tiết kiệm dữ liệu → coi là đủ mạnh', () => {
    expect(readMotionLevel()).toEqual({ level: 'full', decor: true });
  });

  it('công tắc tắt → reduced, không trang trí', () => {
    setMotion(false);
    expect(readMotionLevel()).toEqual({ level: 'reduced', decor: false });
  });

  it('thiết bị yêu cầu giảm chuyển động → reduced', () => {
    stubMedia(true);
    resetMotionForTest();
    expect(readMotionLevel()).toEqual({ level: 'reduced', decor: false });
  });

  it('tiết kiệm dữ liệu hoặc bộ nhớ ≤ 2 GB → full nhưng không trang trí', () => {
    stubNavigator({ connection: { saveData: true } });
    expect(readMotionLevel()).toEqual({ level: 'full', decor: false });
    stubNavigator({ connection: { saveData: false }, deviceMemory: 2 });
    expect(readMotionLevel()).toEqual({ level: 'full', decor: false });
    stubNavigator({ deviceMemory: 4 });
    expect(readMotionLevel()).toEqual({ level: 'full', decor: true });
  });

  it('useMotionAttributes ghi data-motion / data-decor lên <html> và cập nhật khi công tắc đổi', () => {
    render(<Root />);
    expect(document.documentElement.dataset).toMatchObject({ motion: 'full', decor: 'on' });
    act(() => setMotion(false));
    expect(document.documentElement.dataset).toMatchObject({ motion: 'reduced', decor: 'off' });
    act(() => setMotion(true));
    expect(document.documentElement.dataset).toMatchObject({ motion: 'full', decor: 'on' });
  });
});
