// Host của Mila (specs/005 tasks T012): bus → reducer → portal vào slot; ngôn ngữ; trang ẩn; lỗi; giảm chuyển động.
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeLanguagePreference } from '../../modules/m01/storage/languageWriter';
import { emitMascotEvent, MascotSlot } from '../../shared/mascot/index';
import { setMotion } from '../../shared/mascot/motion';
import { intent, rule, say } from '../../shared/mascot/testing';
import { MascotHost } from './MascotHost';

beforeEach(() => {
  vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
});

const speak = rule('m02.scanner.opened', say({ mode: 'DOCK', message: { id: 'MSG-MAS-042' } }));
const opened = () => emitMascotEvent({ type: 'm02.scanner.opened', hasSession: true, k: 0 });

function setup(rules = [speak]) {
  const navigate = vi.fn();
  render(
    <>
      <p>Nội dung màn</p>
      <MascotSlot id="trip-dock" modes={['DOCK']} />
      <MascotHost pathname="/trip" navigate={navigate} rules={rules} />
    </>,
  );
  return { navigate };
}

describe('MascotHost', () => {
  it('màn có hai slot cùng mode → Mila vào slot ý định chỉ định, không phải slot đăng ký sau cùng (SCR-M01-003, T060/T061)', async () => {
    const toStart = rule('m02.scanner.opened', say({ mode: 'AVATAR', slot: 'start-panel', message: { id: 'MSG-MAS-042' } }));
    render(
      <>
        <MascotSlot id="start-panel" modes={['AVATAR']} />
        <MascotSlot id="package-panel" modes={['AVATAR']} />
        <MascotHost pathname="/routes/r1" navigate={vi.fn()} rules={[toStart]} />
      </>,
    );
    act(() => opened());
    const bubble = await screen.findByText('No luck yet? Move a little closer and avoid the glare.');
    expect(bubble.closest('[data-mascot-slot="start-panel"]')).not.toBeNull();
  });

  it('sự kiện → bong bóng trong đúng slot, chữ theo ngôn ngữ thiết bị khi chưa có lựa chọn', async () => {
    setup();
    act(() => opened());
    const bubble = await screen.findByText('No luck yet? Move a little closer and avoid the glare.');
    expect(bubble.closest('[data-mascot-slot="trip-dock"]')).not.toBeNull();
    expect(bubble.getAttribute('data-mascot-message')).toBe('MSG-MAS-042');
    expect(bubble.getAttribute('lang')).toBe('en');
    expect(document.activeElement).toBe(document.body);
  });

  it('đổi ngôn ngữ → bong bóng đổi chữ, cùng câu (MAS-B-080)', async () => {
    setup();
    act(() => opened());
    await screen.findByText('No luck yet? Move a little closer and avoid the glare.');
    await act(async () => writeLanguagePreference('vi'));
    const vi = await screen.findByText('Chưa quét được? Thử lại gần hơn và tránh chỗ chói nắng.');
    expect(vi.getAttribute('data-mascot-message')).toBe('MSG-MAS-042');
  });

  it('trang ẩn → bỏ bong bóng', async () => {
    setup();
    act(() => opened());
    await screen.findByText(/No luck yet/);
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(screen.queryByText(/No luck yet/)).toBeNull());
  });

  it('nút đóng chỉ đóng bong bóng; Mila (DOCK) vẫn ở slot', async () => {
    setup();
    act(() => opened());
    await screen.findByText(/No luck yet/);
    act(() => screen.getByRole('button', { name: 'Dismiss message' }).click());
    await waitFor(() => expect(screen.queryByText(/No luck yet/)).toBeNull());
    expect(document.querySelector('[data-mascot-mode="DOCK"]')).not.toBeNull();
  });

  it('lỗi trong luật → Mila ẩn, màn vẫn chạy', async () => {
    const broken = rule('m02.scanner.opened', () => {
      throw new Error('hỏng');
    });
    setup([broken]);
    act(() => opened());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.getByText('Nội dung màn')).toBeTruthy();
    expect(document.querySelector('[data-mascot-mode]')).toBeNull();
  });

  it('giảm chuyển động → không rung', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => ({ matches: query.includes('reduce'), media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) as MediaQueryList,
    );
    setup([rule('m02.scanner.opened', { intents: [intent({ priority: 4, message: { id: 'MSG-MAS-051' }, vibrate: true })] })]);
    act(() => opened());
    await screen.findByText(/First scan recorded/);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it('không giảm chuyển động → rung 30 ms', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    setup([rule('m02.scanner.opened', { intents: [intent({ priority: 4, message: { id: 'MSG-MAS-051' }, vibrate: true })] })]);
    act(() => opened());
    await screen.findByText(/First scan recorded/);
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it('công tắc "Hiệu ứng chuyển động" tắt → không rung (spec-Mascot v1.4 BR-MAS-19; specs/006 T011)', async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    setMotion(false);
    setup([rule('m02.scanner.opened', { intents: [intent({ priority: 4, message: { id: 'MSG-MAS-051' }, vibrate: true })], effects: [{ kind: 'vibrate', ms: 30 }] })]);
    act(() => opened());
    await screen.findByText(/First scan recorded/);
    expect(vibrate).not.toHaveBeenCalled();
    setMotion(true);
  });

  it('"đang thao tác" (BR-MAS-20, R-19): cuộn trong 2 s trước hẹn giờ → hướng dẫn theo hẹn giờ bị bỏ', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const timed = [
        rule('m02.scanner.opened', { timers: { help: 3_000 } }),
        rule('mascot.timer', (event) => (event.type === 'mascot.timer' && event.name === 'help' ? say({ source: 'timer', message: { id: 'MSG-MAS-042' } }) : null)),
      ];
      setup(timed);
      await act(async () => opened());
      await act(async () => {
        vi.advanceTimersByTime(1_500);
        window.dispatchEvent(new Event('scroll'));
      });
      await act(async () => {
        vi.advanceTimersByTime(1_600);
      });
      expect(screen.queryByText(/No luck yet/)).toBeNull();

      // Lần sau không có thao tác → câu hiện
      await act(async () => opened());
      await act(async () => {
        vi.advanceTimersByTime(3_100);
      });
      expect(screen.queryByText(/No luck yet/)).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
