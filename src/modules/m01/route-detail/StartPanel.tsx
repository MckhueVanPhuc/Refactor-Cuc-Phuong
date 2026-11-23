// Nút "Bắt đầu" của SCR-M01-003 (E-SCR-M01-003-23, 24; US-M01-04; tasks T065). Tắt trong lúc chạy; lý do chặn theo
// bảng copy; chỉ điều hướng sang M02 sau khi context đã commit (startRoute).
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router';
import { emitMascotEvent, MascotFigure, MascotSlot } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useM01Messages } from '../i18n/useM01Messages';
import { browserLocks, createStartRoute, type StartResult } from '../start/startRoute';
import type { RequestOfflineDecision } from './offlineDecision';
import styles from './StartPanel.module.css';

export function StartPanel({
  routeId,
  hasSafetyWarning,
  needsDecision,
  requestOfflineDecision,
}: {
  routeId: string;
  /** Tuyến có Cảnh báo an toàn: Mila nhắc đọc khi panel hiện lần đầu (MAS-B-014) */
  hasSafetyWarning: boolean;
  /** Tuyến cần gói mà chưa có gói `SAN_SANG` (BR-M01-012) */
  needsDecision: boolean;
  requestOfflineDecision: RequestOfflineDecision;
}) {
  const { source } = useM01Services();
  const messages = useM01Messages().routeDetail;
  const navigate = useNavigate();
  const startRoute = useMemo(() => createStartRoute({ source, locks: browserLocks() }), [source]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<StartResult | null>(null);
  // Chặn bấm lặp ngay lập tức, kể cả trong lúc đọc snapshot cho dialog quyết định offline (chưa kịp render disabled)
  const inFlight = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useStartPanelVisible(panelRef, routeId, hasSafetyWarning);

  async function onStart() {
    if (inFlight.current) return;
    inFlight.current = true;
    setResult(null);
    setRunning(true);
    try {
      if (needsDecision && (await requestOfflineDecision()) === 'cancel') return;
      setResult(await startRoute(routeId, (path) => navigate(path)));
    } finally {
      inFlight.current = false;
      setRunning(false);
    }
  }

  const error =
    result?.kind === 'blocked'
      ? result.reason === 'offlineNoPackage'
        ? messages.startBlockedOffline
        : messages.routeUnavailable
      : result?.kind === 'failed'
        ? messages.startFailed
        : undefined;

  return (
    <div className={styles.panel} ref={panelRef}>
      {/* Mila phía trên nút Bắt đầu, không bao giờ trong khối Cảnh báo an toàn (spec-Mascot §5.1) */}
      <MascotSlot id="start-panel" modes={['AVATAR']} />
      <button type="button" className={styles.start} disabled={running} aria-busy={running} onClick={() => void onStart()}>
        <TintIcon name="start" />
        {messages.start}
      </button>
      {error && (
        <div className={styles.withMila}>
          {/* MAS-B-015: Mila minh họa cạnh câu lỗi Start, câu giữ nguyên */}
          <MascotFigure pose="confused" size="sm" />
          <p className={styles.error} role="alert">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Panel Bắt đầu vào màn hình lần đầu cho tuyến này → báo Mila (contract m01.routeDetail.startPanelVisible). Không có
 * IntersectionObserver (trình duyệt cũ, test) thì không báo: Mila chỉ bớt một lời nhắc, màn không đổi.
 */
function useStartPanelVisible(panelRef: RefObject<HTMLDivElement | null>, routeId: string, hasSafetyWarning: boolean) {
  const reported = useRef<string | null>(null);
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || typeof IntersectionObserver === 'undefined' || reported.current === routeId) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || reported.current === routeId) return;
      reported.current = routeId;
      observer.disconnect();
      emitMascotEvent({ type: 'm01.routeDetail.startPanelVisible', routeRef: routeId, hasSafetyWarning });
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [panelRef, routeId, hasSafetyWarning]);
}
