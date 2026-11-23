// Gắn host Mila vào App theo công tắc (specs/005 tasks T021, T068; research R-13; Q17).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadMascotHost } from './mascot/loadHost';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('loadMascotHost', () => {
  it('công tắc tắt → không có host, không import() chunk mascot', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    expect(loadMascotHost()).toBeNull();
  });

  it('công tắc bật → component lazy', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    expect(loadMascotHost()).not.toBeNull();
  });
});
