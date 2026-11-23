// Host của Mila (specs/005 tasks T012): bus → reducer → portal vào slot; ngôn ngữ; trang ẩn; lỗi; giảm chuyển động.
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeLanguagePreference } from '../../modules/m01/storage/languageWriter';
import { emitMascotEvent, MascotSlot } from '../../shared/mascot/index';
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

const speak = rule('m02.scanner.opened', say({ mode: 'DOCK', message: { id: 'MSG-MAS-030' } }));
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
  it('sự kiện → bong bóng trong đúng slot, chữ theo ngôn ngữ thiết bị khi chưa có lựa chọn', async () => {
    setup();
    act(() => opened());
    const bubble = await screen.findByText('At each stop, look for the QR sign and tap Scan QR.');
    expect(bubble.closest('[data-mascot-slot="trip-dock"]')).not.toBeNull();
    expect(bubble.getAttribute('data-mascot-message')).toBe('MSG-MAS-030');
    expect(bubble.getAttribute('lang')).toBe('en');
    expect(document.activeElement).toBe(document.body);
  });

  it('đổi ngôn ngữ → bong bóng đổi chữ, cùng câu (MAS-B-080)', async () => {
    setup();
    act(() => opened());
    await screen.findByText('At each stop, look for the QR sign and tap Scan QR.');
    await act(async () => writeLanguagePreference('vi'));
    const vi = await screen.findByText('Ở mỗi điểm dừng, tìm tem QR rồi bấm Quét QR nhé.');
    expect(vi.getAttribute('data-mascot-message')).toBe('MSG-MAS-030');
  });

  it('trang ẩn → bỏ bong bóng', async () => {
    setup();
    act(() => opened());
    await screen.findByText(/At each stop/);
    act(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(screen.queryByText(/At each stop/)).toBeNull());
  });

  it('nút đóng chỉ đóng bong bóng; Mila (DOCK) vẫn ở slot', async () => {
    setup();
    act(() => opened());
    await screen.findByText(/At each stop/);
    act(() => screen.getByRole('button', { name: 'Dismiss message' }).click());
    await waitFor(() => expect(screen.queryByText(/At each stop/)).toBeNull());
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
});
