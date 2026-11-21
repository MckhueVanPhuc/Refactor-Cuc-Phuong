// Event bus của Mila (specs/005 tasks T007; contracts/mascot-event-contract.md §1; research R-03).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emitMascotEvent, holdMascotSignal, subscribeMascotEvents } from './events';

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

describe('holdMascotSignal', () => {
  const start = { type: 'app.dialog.changed', open: true, kind: 'OTHER' } as const;
  const end = { type: 'app.dialog.changed', open: false, kind: 'OTHER' } as const;

  it('nhiều nguồn: chỉ phát khi nguồn đầu tiên giữ và nguồn cuối cùng nhả (BR-MAS-08)', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const seen: boolean[] = [];
    const off = subscribeMascotEvents((event) => {
      if (event.type === 'app.dialog.changed') seen.push(event.open);
    });
    const releaseA = holdMascotSignal('dialog', start, end);
    const releaseB = holdMascotSignal('dialog', start, end);
    await flush();
    expect(seen).toEqual([true]);
    releaseA();
    releaseA();
    await flush();
    expect(seen).toEqual([true]);
    releaseB();
    await flush();
    expect(seen).toEqual([true, false]);
    off();
  });
});
