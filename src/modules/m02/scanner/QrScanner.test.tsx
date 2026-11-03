// Trình quét QR (tasks T038; research R-13; BR-M02-023) với `@zxing/browser` và `getUserMedia` giả.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { vi as viMessages } from '../i18n/vi';
import { fakeM01 } from '../testing/fakeM01Port';
import { QrScanner, resetScannerMemoryForTest } from './QrScanner';

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
});
