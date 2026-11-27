// Trình quét QR trong app (tasks T046; research R-13; BR-M02-023; E-SCR-M02-001-10, -11). Lớp toàn màn hình, nạp lazy
// trong chunk `m02-scanner` (đã precache). Camera sau (`facingMode: 'environment'`); dừng stream ngay khi đọc được mã
// đầu tiên hoặc khi đóng. Mã giống hệt mã vừa nhận trong SCANNER_DUPLICATE_IGNORE_MS bị bỏ qua. Không dùng được camera
// (bị từ chối, không có camera, không có `mediaDevices`) → thông báo cố định của §5.1; quyền do trình duyệt cấp.
// CHG-MASCOT-2026-11-27-08: hàng tiêu đề có VI/EN của M01 (BUG-020); nhãn điểm đang tìm; khung bốn góc với vạch quét;
// màn lỗi camera có icon, các bước bật camera theo trình duyệt, "Thử lại" là nút chính, không có Mila (spec-Mascot v1.8).
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { emitMascotEvent, MascotSlot, type CtaId } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { SCANNER_DUPLICATE_IGNORE_MS } from '../config/limits';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import { LanguageControl } from '../m01Port';
import styles from './QrScanner.module.css';

/** Điểm gợi ý kế tiếp cho nhãn "Đang tìm điểm {i} · {tên}" (E-SCR-M02-001-10): số hiển thị và tên hai ngôn ngữ. */
export type ScannerTarget = { number: number; name: { vi: string; en: string } };

/**
 * iPhone/iPad: các bước của Safari; máy khác: các bước của Chrome (E-SCR-M02-001-11). iPadOS báo là Macintosh nên
 * nhận thêm bằng màn cảm ứng.
 */
export function isAppleMobile(nav: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> = navigator): boolean {
  return /iPhone|iPad|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1);
}

// Mã nhận gần nhất, giữ qua các lần mở scanner liên tiếp
let lastAccepted: { text: string; at: number } | null = null;

/**
 * `mascot`: Mila ở dải dưới khung (spec-Mascot §5.1, chỉ SCR-M02-001). Màn Quét QR SCR-M02-005 dùng chung trình quét
 * nhưng nằm ngoài phạm vi spec-Mascot nên không bật.
 */
export function QrScanner({
  onDetected,
  onClose,
  mascot = false,
  target = null,
}: {
  onDetected: (text: string) => void;
  onClose: () => void;
  mascot?: boolean;
  /** Điểm tiếp theo của chuyến (chỉ gợi ý); `null` = khách tự do hoặc đã quét hết */
  target?: ScannerTarget | null;
}) {
  const messages = useM02Messages();
  const language = useM02DisplayLanguage();
  const steps = isAppleMobile() ? messages.scanner.stepsIos : messages.scanner.stepsOther;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Giữ callback mới nhất mà không khởi động lại camera
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeButton = useRef<HTMLButtonElement>(null);
  const mascotRef = useRef(mascot);
  mascotRef.current = mascot;
  // CTA "Đóng camera" của Mila (MAS-B-049) gọi đúng hành động đóng đang có
  const onMascotCta = useCallback((cta: CtaId) => {
    if (cta === 'closeCamera') onCloseRef.current();
  }, []);

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
    const failCamera = () => {
      setCameraFailed(true);
      if (mascotRef.current) emitMascotEvent({ type: 'm02.scanner.cameraFailed' });
    };
    if (!video || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      failCamera();
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
        // Camera đã chạy: Mila bắt đầu đếm các mốc chờ (MAS-B-040…049)
        else if (mascotRef.current) emitMascotEvent({ type: 'm02.scanner.cameraStarted' });
      })
      .catch(() => {
        if (!stopped) failCamera();
      });

    return stop;
  }, [attempt]);

  const retry = () => {
    setCameraFailed(false);
    setAttempt((n) => n + 1);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="m02-scanner-title" data-camera-failed={cameraFailed || undefined}>
      <div className={styles.panel}>
        {/* Hàng tiêu đề như thanh đầu trang M02: đổi VI/EN không cần đóng camera (BUG-020) */}
        <div className={styles.header}>
          <h2 className={styles.title} id="m02-scanner-title">
            {messages.scanner.title}
          </h2>
          <LanguageControl tone="onDark" />
        </div>
        {cameraFailed ? (
          <div className={styles.failure}>
            {/* Một hình minh họa, có cả khi Mila tắt; không Mila ở màn này (spec-Mascot v1.8 §5.1) */}
            <span className={styles.cameraOff} aria-hidden="true">
              <TintIcon name="camera-off" className={styles.cameraOffIcon} />
            </span>
            <p className={styles.failureText} role="alert">
              {messages.notice.cameraUnavailable}
            </p>
            <section className={styles.howTo} aria-labelledby="m02-camera-howto">
              <h3 className={styles.howToTitle} id="m02-camera-howto">
                {messages.scanner.howToTitle}
              </h3>
              <ol className={styles.steps}>
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          </div>
        ) : (
          <>
            {/* Điểm tiếp theo của chuyến (E-SCR-M02-001-10): chỉ gợi ý, mã của điểm nào cũng nhận */}
            {target && (
              <p className={styles.target} data-scanner-target="">
                {messages.scanner.lookingFor({ number: target.number, name: target.name[language] })}
              </p>
            )}
            <div className={styles.frame}>
              <video className={styles.video} ref={videoRef} muted playsInline />
              <span className={styles.reticle} aria-hidden="true">
                <span className={styles.corner} data-corner="tl" />
                <span className={styles.corner} data-corner="tr" />
                <span className={styles.corner} data-corner="bl" />
                <span className={styles.corner} data-corner="br" />
                <span className={styles.sweep}>
                  <span className={styles.scanLine} />
                </span>
              </span>
            </div>
            <p className={styles.instruction}>{messages.scanner.instruction}</p>
          </>
        )}
        {/* Mila ở dải dưới khung, không che khung quét (MAS-B-040…049; spec-Mascot §5.1) */}
        {mascot && !cameraFailed && <MascotSlot id="scanner-bottom" modes={['AVATAR']} onCta={onMascotCta} />}
        <div className={styles.actions}>
          {cameraFailed && (
            <button type="button" className={styles.primary} onClick={retry}>
              {messages.scanner.retry}
            </button>
          )}
          <button type="button" className={styles.close} onClick={onClose} ref={closeButton}>
            {messages.scanner.close}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Chỉ cho test: xóa mã nhận gần nhất giữa các ca. */
export function resetScannerMemoryForTest(): void {
  lastAccepted = null;
}
