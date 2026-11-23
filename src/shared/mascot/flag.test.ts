import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMascotEnabled } from './flag';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isMascotEnabled (research R-13; OD-MAS-15)', () => {
  it('chỉ bật khi VITE_FEATURE_MASCOT = "on"', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    expect(isMascotEnabled()).toBe(true);
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    expect(isMascotEnabled()).toBe(false);
  });

  it('thiếu biến thì tắt', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', '');
    expect(isMascotEnabled()).toBe(false);
  });
});
