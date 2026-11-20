// Event bus của Mila (specs/005 tasks T007; contracts/mascot-event-contract.md §1; research R-03).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emitMascotEvent, resetMascotEventsForTest, subscribeMascotEvents } from './events';

beforeEach(() => {
  resetMascotEventsForTest();
});

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

describe('sự kiện phát trước khi host đăng ký (host nạp lazy)', () => {
  it('được giữ tạm và giao cho listener đầu tiên, kèm thời điểm gốc', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    emitMascotEvent({ type: 'm01.language.selected', language: 'vi' });
    const seen: Array<{ type: string; at: number }> = [];
    const off = subscribeMascotEvents((event) => seen.push(event));
    await flush();
    expect(seen).toEqual([{ type: 'm01.language.selected', language: 'vi', at: expect.any(Number) }]);
    off();
  });

  it('chỉ giữ sự kiện trong 5 giây gần nhất, tối đa 20', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1_000);
    emitMascotEvent({ type: 'm02.scanner.closed' });
    now.mockReturnValue(10_000);
    for (let i = 0; i < 25; i += 1) emitMascotEvent({ type: 'm02.scanner.opened', hasSession: true, k: i });
    const seen: Array<{ type: string }> = [];
    const off = subscribeMascotEvents((event) => seen.push(event));
    await flush();
    expect(seen).toHaveLength(20);
    expect(seen.every((event) => event.type === 'm02.scanner.opened')).toBe(true);
    off();
    now.mockRestore();
  });

  it('cờ tắt → không giữ gì', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    emitMascotEvent({ type: 'm02.scanner.closed' });
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const seen: unknown[] = [];
    const off = subscribeMascotEvents((event) => seen.push(event));
    await flush();
    expect(seen).toEqual([]);
    off();
  });
});
