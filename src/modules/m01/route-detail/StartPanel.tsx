// Nút "Bắt đầu" của SCR-M01-003 (E-SCR-M01-003-23, 24; US-M01-04; tasks T065). Tắt trong lúc chạy; lý do chặn theo
// bảng copy; chỉ điều hướng sang M02 sau khi context đã commit (startRoute).
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
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

  async function onStart() {
    setResult(null);
    if (needsDecision && (await requestOfflineDecision()) === 'cancel') return;
    setRunning(true);
    try {
      setResult(await startRoute(routeId, (path) => navigate(path)));
    } finally {
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
