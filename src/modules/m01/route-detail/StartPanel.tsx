// Nút "Bắt đầu" của SCR-M01-003 (E-SCR-M01-003-23, 24; US-M01-04; tasks T065). Tắt trong lúc chạy; lý do chặn theo
// bảng copy; chỉ điều hướng sang M02 sau khi context đã commit (startRoute).
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useM01Messages } from '../i18n/useM01Messages';
import { browserLocks, createStartRoute, type StartResult } from '../start/startRoute';
import type { RequestOfflineDecision } from './offlineDecision';
import styles from './StartPanel.module.css';

export function StartPanel({
  routeId,
  needsDecision,
  requestOfflineDecision,
}: {
  routeId: string;
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
    <div className={styles.panel}>
      <button type="button" className={styles.start} disabled={running} aria-busy={running} onClick={() => void onStart()}>
        <TintIcon name="start" />
        {messages.start}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
