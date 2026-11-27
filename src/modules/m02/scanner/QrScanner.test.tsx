// Trình quét QR (tasks T038; research R-13; BR-M02-023) với `@zxing/browser` và `getUserMedia` giả.
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '../i18n/en';
import { vi as viMessages } from '../i18n/vi';
import { fakeM01 } from '../testing/fakeM01Port';
import { isAppleMobile, QrScanner, resetScannerMemoryForTest } from './QrScanner';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));

type Callback = (result: { getText(): string } | undefined, error: unknown, controls: { stop(): void }) => void;

const zxing = vi.hoisted(() => ({
  decode: vi.fn(),
  stop: vi.fn(),
  callback: undefined as undefined | ((result: { getText(): string } | undefined, error: unknown, controls: { stop(): void }) => void),
}));

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: class {
    decodeFromConstraints(constraints: unknown, video: unknown, callback: Callback) {
      zxing.callback = callback;
      return zxing.decode(constraints, video, callback);
    }
  },
}));

const code = (text: string) => ({ getText: () => text });
const emit = (text: string) => act(() => zxing.callback!(code(text), undefined, { stop: zxing.stop }));

beforeEach(() => {
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
  resetScannerMemoryForTest();
  zxing.decode.mockReset().mockResolvedValue({ stop: zxing.stop });
  zxing.stop.mockReset();
  zxing.callback = undefined;
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia: vi.fn() } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('QrScanner', () => {
  it('mở camera sau (facingMode environment), không xin micro', async () => {
    render(<QrScanner onDetected={() => {}} onClose={() => {}} />);
    await waitFor(() => expect(zxing.decode).toHaveBeenCalledTimes(1));
    expect(zxing.decode.mock.calls[0]![0]).toEqual({ video: { facingMode: 'environment' }, audio: false });
  });

  it('mã đầu tiên → dừng stream và báo đúng một lần; mã sau đó bị bỏ qua', async () => {
    const onDetected = vi.fn();
    render(<QrScanner onDetected={onDetected} onClose={() => {}} />);
    await waitFor(() => expect(zxing.callback).toBeDefined());
    emit('http://localhost:5174/q/Q1a');
    emit('http://localhost:5174/q/Q2');
    expect(onDetected).toHaveBeenCalledTimes(1);
    expect(onDetected).toHaveBeenCalledWith('http://localhost:5174/q/Q1a');
    expect(zxing.stop).toHaveBeenCalled();
  });

  it('mở lại ngay và đọc lại cùng mã trong SCANNER_DUPLICATE_IGNORE_MS → bỏ qua; mã khác → nhận', async () => {
    const onDetected = vi.fn();
    const first = render(<QrScanner onDetected={onDetected} onClose={() => {}} />);
    await waitFor(() => expect(zxing.callback).toBeDefined());
    emit('http://localhost:5174/q/Q1a');
    first.unmount();

    zxing.callback = undefined;
    render(<QrScanner onDetected={onDetected} onClose={() => {}} />);
    await waitFor(() => expect(zxing.callback).toBeDefined());
    emit('http://localhost:5174/q/Q1a');
    expect(onDetected).toHaveBeenCalledTimes(1);
    emit('http://localhost:5174/q/Q2');
    expect(onDetected).toHaveBeenCalledTimes(2);
  });

  it('bàn phím: mở scanner → focus vào nút Đóng camera; Esc đóng (WCAG 2.1.1, 2.4.3)', async () => {
    const onClose = vi.fn();
    render(<QrScanner onDetected={() => {}} onClose={onClose} />);
    await waitFor(() => expect(document.activeElement?.textContent).toBe(viMessages.scanner.close));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('đóng → dừng stream', async () => {
    const onClose = vi.fn();
    const { unmount } = render(<QrScanner onDetected={() => {}} onClose={onClose} />);
    await waitFor(() => expect(zxing.decode).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: viMessages.scanner.close }));
    expect(onClose).toHaveBeenCalled();
    unmount();
    expect(zxing.stop).toHaveBeenCalled();
  });

  it.each(['NotAllowedError', 'NotFoundError'])('%s → thông báo camera cố định của §5.1, có Thử lại', async (name) => {
    zxing.decode.mockRejectedValueOnce(new DOMException('camera', name));
    render(<QrScanner onDetected={() => {}} onClose={() => {}} />);
    expect((await screen.findByRole('alert')).textContent).toContain(viMessages.notice.cameraUnavailable);
    fireEvent.click(screen.getByRole('button', { name: viMessages.scanner.retry }));
    await waitFor(() => expect(zxing.decode).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('không có navigator.mediaDevices → thông báo camera, không gọi zxing', async () => {
    vi.stubGlobal('navigator', { ...navigator, mediaDevices: undefined });
    render(<QrScanner onDetected={() => {}} onClose={() => {}} />);
    expect((await screen.findByRole('alert')).textContent).toContain(viMessages.notice.cameraUnavailable);
    expect(zxing.decode).not.toHaveBeenCalled();
  });

  // —— CHG-MASCOT-2026-11-27-08 (M02-16, M02-17; BUG-020) ——
  it('hàng tiêu đề có VI/EN của M01 (BUG-020); đổi ngôn ngữ thì chữ scanner đổi ngay, camera vẫn mở', async () => {
    render(<QrScanner onDetected={() => {}} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: viMessages.scanner.title });
    // Cổng M01 giả: control VI/EN là chỗ đặt; nút thật có test ở e2e
    expect(within(dialog).getByTestId('m01-language-control').getAttribute('data-tone')).toBe('onDark');
    await waitFor(() => expect(zxing.decode).toHaveBeenCalledTimes(1));
    act(() => fakeM01.setLanguage({ languageCode: 'en' }));
    expect(within(dialog).getByRole('heading', { name: en.scanner.title })).toBeTruthy();
    expect(zxing.decode).toHaveBeenCalledTimes(1);
  });

  it('có điểm tiếp theo → nhãn "Đang tìm điểm {i} · {tên}" theo ngôn ngữ; không có → không nhãn', async () => {
    const target = { number: 2, name: { vi: 'Cây chò ngàn năm', en: 'Thousand-year-old tree' } };
    const { rerender } = render(<QrScanner onDetected={() => {}} onClose={() => {}} target={target} />);
    expect(screen.getByText(viMessages.scanner.lookingFor({ number: 2, name: 'Cây chò ngàn năm' }))).toBeTruthy();
    rerender(<QrScanner onDetected={() => {}} onClose={() => {}} />);
    expect(document.querySelector('[data-scanner-target]')).toBeNull();
  });

  it('lỗi camera: icon, câu cố định, ba bước bật camera, "Thử lại" trước "Đóng camera"; không có Mila (spec-Mascot v1.8)', async () => {
    zxing.decode.mockRejectedValueOnce(new DOMException('camera', 'NotAllowedError'));
    render(<QrScanner onDetected={() => {}} onClose={() => {}} mascot />);
    await screen.findByRole('alert');
    const dialog = screen.getByRole('dialog');
    expect(dialog.hasAttribute('data-camera-failed')).toBe(true);
    expect(within(dialog).getByRole('heading', { name: viMessages.scanner.howToTitle })).toBeTruthy();
    expect(within(dialog).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...viMessages.scanner.stepsOther]);
    const buttons = within(dialog)
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(buttons.slice(-2)).toEqual([viMessages.scanner.retry, viMessages.scanner.close]);
    expect(dialog.querySelector('[data-mascot-slot], [data-mascot-figure]')).toBeNull();
  });

  it('các bước bật camera theo trình duyệt: iPhone/iPad (kể cả iPadOS báo Macintosh) → Safari; máy khác → Chrome', () => {
    expect(isAppleMobile({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', maxTouchPoints: 5 })).toBe(true);
    expect(isAppleMobile({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 5 })).toBe(true);
    expect(isAppleMobile({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', maxTouchPoints: 0 })).toBe(false);
    expect(isAppleMobile({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)', maxTouchPoints: 5 })).toBe(false);
  });
});
