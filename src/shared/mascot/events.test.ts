// Event bus của Mila (specs/005 tasks T007; contracts/mascot-event-contract.md §1; research R-03).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitMascotEvent, subscribeMascotEvents } from './events';

afterEach(() => {
  vi.unstubAllEnvs();
});

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe('emitMascotEvent', () => {
  it('giao sự kiện ở microtask, kèm `at`, không chạy đồng bộ trong luồng nghiệp vụ', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const seen: unknown[] = [];
    const off = subscribeMascotEvents((event) => seen.push(event));
    const result = emitMascotEvent({ type: 'm02.scanner.detected' });
    expect(result).toBeUndefined();
    expect(seen).toEqual([]);
    await flush();
    expect(seen).toEqual([{ type: 'm02.scanner.detected', at: expect.any(Number) }]);
    off();
  });

  it('listener ném lỗi không ảnh hưởng listener khác và người gọi', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const seen: string[] = [];
    const offBad = subscribeMascotEvents(() => {
      throw new Error('hỏng');
    });
    const offGood = subscribeMascotEvents((event) => seen.push(event.type));
    expect(() => emitMascotEvent({ type: 'm02.scanner.closed' })).not.toThrow();
    await flush();
    expect(seen).toEqual(['m02.scanner.closed']);
    offBad();
    offGood();
  });

  it('cờ tắt → không listener nào được gọi', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    const listener = vi.fn();
    const off = subscribeMascotEvents(listener);
    emitMascotEvent({ type: 'm02.scanner.closed' });
    await flush();
    expect(listener).not.toHaveBeenCalled();
    off();
  });

  it('hủy đăng ký thì không nhận nữa', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const listener = vi.fn();
    const off = subscribeMascotEvents(listener);
    off();
    emitMascotEvent({ type: 'm02.scanner.closed' });
    await flush();
    expect(listener).not.toHaveBeenCalled();
  });
});
