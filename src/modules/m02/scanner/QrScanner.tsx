// Trình quét QR trong app (tasks T046; research R-13; BR-M02-023; E-SCR-M02-001-10, -11). Lớp toàn màn hình, nạp lazy
// trong chunk `m02-scanner` (đã precache). Camera sau (`facingMode: 'environment'`); dừng stream ngay khi đọc được mã
// đầu tiên hoặc khi đóng. Mã giống hệt mã vừa nhận trong SCANNER_DUPLICATE_IGNORE_MS bị bỏ qua. Không dùng được camera
// (bị từ chối, không có camera, không có `mediaDevices`) → thông báo cố định của §5.1; quyền do trình duyệt cấp.
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';
import { SCANNER_DUPLICATE_IGNORE_MS } from '../config/limits';
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './QrScanner.module.css';

// Mã nhận gần nhất, giữ qua các lần mở scanner liên tiếp
let lastAccepted: { text: string; at: number } | null = null;

export function QrScanner({ onDetected, onClose }: { onDetected: (text: string) => void; onClose: () => void }) {
  const messages = useM02Messages();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Giữ callback mới nhất mà không khởi động lại camera
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeButton = useRef<HTMLButtonElement>(null);

  // Bàn phím (WCAG 2.1.1, 2.4.3): focus vào lớp scanner khi mở (một lần), Esc đóng như nút Đóng camera
  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraFailed(true);
      return undefined;
    }
    let stopped = false;
    let controls: IScannerControls | undefined;
    const stop = () => {
      stopped = true;
      controls?.stop();
    };

    new BrowserQRCodeReader()
      .decodeFromConstraints({ video: { facingMode: 'environment' }, audio: false }, video, (result, _error, current) => {
        if (!result || stopped) return;
        const text = result.getText();
        const now = Date.now();
        if (lastAccepted && lastAccepted.text === text && now - lastAccepted.at < SCANNER_DUPLICATE_IGNORE_MS) return;
        lastAccepted = { text, at: now };
        stopped = true;
        current.stop();
        onDetectedRef.current(text);
      })
      .then((started) => {
        controls = started;
        if (stopped) started.stop();
      })
      .catch(() => {
        if (!stopped) setCameraFailed(true);
      });

    return stop;
  }, [attempt]);

  const retry = () => {
    setCameraFailed(false);
    setAttempt((n) => n + 1);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="m02-scanner-title">
      <div className={styles.panel}>
        <h2 className={styles.title} id="m02-scanner-title">
          {messages.scanner.title}
        </h2>
        {cameraFailed ? (
          <div className={styles.failure} role="alert">
            <p className={styles.failureText}>{messages.notice.cameraUnavailable}</p>
            <button type="button" className={styles.secondary} onClick={retry}>
              {messages.scanner.retry}
            </button>
          </div>
        ) : (
          <>
            <p className={styles.instruction}>{messages.scanner.instruction}</p>
            <div className={styles.frame}>
              <video className={styles.video} ref={videoRef} muted playsInline />
              <span className={styles.reticle} aria-hidden="true" />
            </div>
          </>
        )}
        <button type="button" className={styles.close} onClick={onClose} ref={closeButton}>
          {messages.scanner.close}
        </button>
      </div>
    </div>
  );
}

/** Chỉ cho test: xóa mã nhận gần nhất giữa các ca. */
export function resetScannerMemoryForTest(): void {
  lastAccepted = null;
}
