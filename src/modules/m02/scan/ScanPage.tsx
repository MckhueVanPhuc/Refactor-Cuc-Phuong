// SCR-M02-005 — Quét QR (screen spec SCR-M02-005; quyết định người dùng 2026-11-21). Mở từ nút giữa của thanh tab M01:
// camera bật ngay. Mã đọc được đi đúng đường của trình quét trong app (processScannedText; BR-M02-023): có phiên trong
// trình duyệt → lượt quét của phiên, ghi lượt ghé (BR-M02-005); không có → khách tự do, không gửi `routeId`, không ghi
// gì (US-M02-07; BR-M02-012, 019). Mở màn áp tự đóng phiên quá 24 giờ trước (BR-M02-022). Màn không bao giờ tạo phiên.
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { ScanNotice, type ScanNoticeKind } from '../content/ScanNotice';
import { useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout, FieldNotice } from '../layout/FieldLayout';
import { useBusyWhile } from '../pwa/registerBusy';
import { autoEndForgottenSession } from '../session/autoEnd';
import type { ContentRouteState } from '../session/TripPage';
import { processScannedText } from './processScan';
import { setScanHandler } from './scanBridge';
import styles from './ScanPage.module.css';

const QrScanner = lazy(async () => ({ default: (await import('../scanner/QrScanner')).QrScanner }));

/** Router state do thanh tab M01 đặt: màn đang mở để quay về khi đóng camera. */
export type ScanPageState = { returnTo?: string };

/** `text`: nội dung mã vừa đọc, để "Thử lại" tra lại đúng mã đó (CHG-MASCOT-2026-11-27-09) */
type StayNotice = { kind: ScanNoticeKind; freeVisitor: boolean; text: string };

/** Như `contentPath` của TripPage; khai báo lại để chunk màn Quét không kéo theo code màn Chuyến đi. */
const contentPath = (qrIdentifier: string) => `${PATHS.m02SessionEntry}/qr/${encodeURIComponent(qrIdentifier)}`;

export function ScanPage() {
  const messages = useM02Messages();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as ScanPageState | null)?.returnTo;
  // Tự đóng phiên quá 24 giờ một lần khi mở màn; mọi lần quét chờ việc này xong (BR-M02-022)
  const [autoEnded] = useState(() => autoEndForgottenSession(new Date()).catch(() => null));
  const [scanning, setScanning] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [stayNotice, setStayNotice] = useState<StayNotice | null>(null);
  // Không áp bản build mới giữa một lần quét (research R-15)
  useBusyWhile(lookingUp, 'm02:scan');

  // Đóng: về màn đã mở thanh tab (lùi một bước), mở thẳng `/scan` thì về danh mục
  const close = useCallback(() => {
    if (returnTo) void navigate(-1);
    else void navigate(PATHS.catalog, { replace: true });
  }, [navigate, returnTo]);

  const handleText = useCallback(
    async (text: string) => {
      setScanning(false);
      setStayNotice(null);
      setLookingUp(true);
      try {
        await autoEnded;
        const result = await processScannedText(text);
        if (result.display.kind === 'LIVE' || result.display.kind === 'PACKAGE') {
          // Thay màn Quét bằng nội dung: Back từ nội dung về màn trước đó, không mở lại camera
          const state: ContentRouteState = { scan: result, ...(returnTo && { returnTo }) };
          void navigate(contentPath(result.qrIdentifier), { replace: true, state });
          return;
        }
        setStayNotice({ kind: result.display.kind, freeVisitor: result.freeVisitor, text });
      } finally {
        setLookingUp(false);
      }
    },
    [autoEnded, navigate, returnTo],
  );

  // Hook E2E `m02.scan(text)` đi qua cùng handler (scanBridge)
  useEffect(() => setScanHandler(handleText), [handleText]);

  return (
    <FieldLayout surface="scanner" title={messages.scanner.title}>
      <FieldNotice>
        {/* Màn Quét QR (SCR-M02-005) nằm ngoài phạm vi spec-Mascot: không có Mila */}
        {stayNotice && (
          <ScanNotice
            kind={stayNotice.kind}
            freeVisitor={stayNotice.freeVisitor}
            notCounted={stayNotice.freeVisitor ? null : 'plain'}
            onRetry={() => void handleText(stayNotice.text)}
            onDismiss={() => setStayNotice(null)}
          />
        )}
        {lookingUp && (
          <p className={styles.notice} role="status">
            {messages.trip.lookingUp}
          </p>
        )}
      </FieldNotice>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.scan}
          onClick={() => {
            setStayNotice(null);
            setScanning(true);
          }}
          disabled={lookingUp}
        >
          <span className={styles.scanIcon} aria-hidden="true" />
          {messages.trip.scan}
        </button>
        <button type="button" className={styles.back} onClick={close}>
          {messages.content.back}
        </button>
      </div>
      {scanning && (
        <Suspense fallback={null}>
          <QrScanner onDetected={(text) => void handleText(text)} onClose={close} />
        </Suspense>
      )}
    </FieldLayout>
  );
}
