// Công tắc "Chuyển động" (specs/005 tasks T082; spec-Mascot BR-MAS-17, 21; research R-17).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetMascotEventsForTest, subscribeMascotEvents } from './events';
import { getMotion, resetMotionForTest, setMotion } from './motion';

const reduced = (matches: boolean) =>
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: media.includes('reduce') && matches, media, addEventListener() {}, removeEventListener() {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetMotionForTest();
  resetMascotEventsForTest();
});

describe('motion store', () => {
  it('mặc định bật; thiết bị yêu cầu giảm chuyển động → khởi đầu tắt', () => {
    reduced(false);
    expect(getMotion()).toBe(true);
    resetMotionForTest();
    reduced(true);
    expect(getMotion()).toBe(false);
  });

  it('đổi trạng thái phát mascot.motion.changed; không ghi localStorage (BR-MAS-18)', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    reduced(false);
    const seen: unknown[] = [];
    const unsubscribe = subscribeMascotEvents((event) => seen.push(event));
    const before = JSON.stringify({ ...localStorage });
    setMotion(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getMotion()).toBe(false);
    expect(seen).toContainEqual(expect.objectContaining({ type: 'mascot.motion.changed', on: false }));
    expect(JSON.stringify({ ...localStorage })).toBe(before);
    unsubscribe();
  });
});
