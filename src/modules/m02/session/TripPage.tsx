// SCR-M02-001 — Phiên trải nghiệm & Quét QR (tasks T032, T047, T075; screen spec §4). Vào `/trip` gọi enterTrip một
// lần; sau đó journey, lượt ghé và phiên đọc theo thời gian thực (tab khác đổi cũng thấy). Nút Quét mở scanner (chunk
// lazy `m02-scanner`); mã đọc được đi qua processScannedText rồi sang `/trip/qr/:qrIdentifier` với kết quả trong router
// state. Finish chỉ có sau khi điểm cuối đã quét (FR-M02-015); không có nút "Dừng chuyến đi".
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { ScanNotice, type ScanNoticeKind } from '../content/ScanNotice';
import { FinalPrompt } from '../end/FinalPrompt';
import { useEndTrip } from '../end/useEndTrip';
import type { M02Messages } from '../i18n';
import { useM02Messages } from '../i18n/useM02Messages';
import { RouteJourneyMap } from '../journey/RouteJourneyMap';
import { FieldLayout, FieldNotice } from '../layout/FieldLayout';
import { useBusyWhile } from '../pwa/registerBusy';
import { processScannedText, type ScanResult } from '../scan/processScan';
import { setScanHandler } from '../scan/scanBridge';
import type { CheckpointVisitRow } from '../storage/rows';
import { useRunningSession, useSessionVisits } from '../storage/readers';
import { finalCheckpointId } from '../sync/buildSyncRecord';
import { usePreviousTripSyncError } from '../sync/useSyncStatus';
import type { RejectReason } from './decideEntry';
import { enterTrip, type EntryResult } from './enterTrip';
import styles from './TripPage.module.css';

const QrScanner = lazy(async () => ({ default: (await import('../scanner/QrScanner')).QrScanner }));

const REJECT_MESSAGE: Record<RejectReason, keyof M02Messages['handoff']> = {
  INVALID: 'outdatedVersion',
  USED: 'alreadyUsed',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};

/** Đường dẫn nội dung của một mã; kết quả quét đi kèm trong router state (data-model §6). */
export const contentPath = (qrIdentifier: string) => `${PATHS.m02SessionEntry}/qr/${encodeURIComponent(qrIdentifier)}`;

export type ContentRouteState = { scan?: ScanResult; review?: true };

type EntryState = { status: 'entering' } | { status: 'done'; result: EntryResult };

function useTripEntry(): EntryState {
  const [state, setState] = useState<EntryState>({ status: 'entering' });
  // Vào phiên một lần mỗi lần mở màn: StrictMode chạy effect hai lần ở dev, các lần chạy dùng chung một promise
  const entry = useRef<Promise<EntryResult> | null>(null);
  useEffect(() => {
    entry.current ??= enterTrip()
      // Không đọc/ghi được IndexedDB khi không có phiên: hiện như chưa có chuyến đi, du khách bắt đầu lại từ M01
      .catch((): EntryResult => ({ kind: 'FREE' }));
    // Rời màn trước khi xong: bỏ kết quả, không cập nhật state sau khi unmount
    let cancelled = false;
    void entry.current.then((result) => {
      if (!cancelled) setState({ status: 'done', result });
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return state;
}

function EntryNotice({ result }: { result: EntryResult }) {
  const messages = useM02Messages();
  switch (result.kind) {
    case 'STARTED':
      return <p className={`${styles.notice} ${styles.info}`}>{messages.notice.sessionStartHint}</p>;
    case 'REJECTED':
    case 'FREE':
      return (
        <div className={`${styles.notice} ${styles.warning}`} role="alert">
          <p className={styles.noticeText}>
            {result.kind === 'FREE' ? messages.handoff.none : messages.handoff[REJECT_MESSAGE[result.reason]]}
          </p>
          <Link className={styles.noticeLink} to={PATHS.catalog}>
            {messages.qrLink.chooseRoute}
          </Link>
        </div>
      );
    case 'REPLACE_FAILED':
      return (
        <p className={`${styles.notice} ${styles.error}`} role="alert">
          {messages.trip.replaceFailed}
        </p>
      );
    case 'RESTORED':
      return null;
  }
}

/** Kết quả quét ở lại SCR-M02-001: tạm đóng, mã không hợp lệ, cần kết nối (screen spec §4; tasks T062). */
type StayNotice = { kind: ScanNoticeKind; freeVisitor: boolean };

export function TripPage() {
  const messages = useM02Messages();
  const navigate = useNavigate();
  const entry = useTripEntry();
  const running = useRunningSession();
  const session = entry.status === 'done' && running.status === 'ready' ? running.value : null;
  const visits = useSessionVisits(session?.sessionId);
  const { endTrip, ending } = useEndTrip();
  // E-SCR-M02-001-22: chuyến trước không gửi được và chưa có chuyến mới; chỉ hiển thị, không có thao tác (BR-M02-011)
  const previousTripSyncError = usePreviousTripSyncError();

  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [stayNotice, setStayNotice] = useState<StayNotice | null>(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  // Không áp bản build mới giữa phiên hay giữa một lần quét (research R-15)
  useBusyWhile(Boolean(session), 'm02:session');
  useBusyWhile(lookingUp, 'm02:scan');

  const finalId = session ? finalCheckpointId(session) : undefined;
  const finalVisited = visits.status === 'ready' && visits.value.some((visit) => visit.checkpointId === finalId);

  const handleText = useCallback(
    async (text: string) => {
      setScanning(false);
      setStayNotice(null);
      setLookingUp(true);
      try {
        const result = await processScannedText(text);
        if (result.display.kind === 'LIVE' || result.display.kind === 'PACKAGE') {
          navigate(contentPath(result.qrIdentifier), { state: { scan: result } satisfies ContentRouteState });
          return;
        }
        setStayNotice({ kind: result.display.kind, freeVisitor: result.freeVisitor });
      } finally {
        setLookingUp(false);
      }
    },
    [navigate],
  );

  useEffect(() => setScanHandler(handleText), [handleText]);

  const openVisit = (visit: CheckpointVisitRow) =>
    navigate(contentPath(visit.qrIdentifier), { state: { review: true } satisfies ContentRouteState });

  return (
    <FieldLayout surface="scanner" title={messages.screenTitle.trip}>
      {entry.status === 'done' && (
        <FieldNotice>
          {stayNotice ? <ScanNotice kind={stayNotice.kind} freeVisitor={stayNotice.freeVisitor} /> : <EntryNotice result={entry.result} />}
          {previousTripSyncError && (
            <p className={`${styles.notice} ${styles.error}`} data-previous-sync-error="">
              {messages.trip.previousTripSyncError}
            </p>
          )}
          {lookingUp && (
            <p className={`${styles.notice} ${styles.info}`} role="status">
              {messages.trip.lookingUp}
            </p>
          )}
        </FieldNotice>
      )}
      <div
        className={styles.journey}
        data-session-id={session?.sessionId}
        data-entry={entry.status === 'done' ? entry.result.kind : 'ENTERING'}
      >
        {session && visits.status === 'ready' && (
          <RouteJourneyMap checkpoints={session.journeyCheckpoints} visits={visits.value} onOpen={openVisit} />
        )}
      </div>
      {entry.status === 'done' && (
        <div className={styles.actions}>
          <button type="button" className={styles.scan} onClick={() => setScanning(true)} disabled={lookingUp}>
            <span className={styles.scanIcon} aria-hidden="true" />
            {messages.trip.scan}
          </button>
          {session && finalVisited && (
            <button type="button" className={styles.finish} onClick={() => setConfirmingFinish(true)}>
              {messages.trip.finish}
            </button>
          )}
        </div>
      )}
      {scanning && (
        <Suspense fallback={null}>
          <QrScanner onDetected={(text) => void handleText(text)} onClose={() => setScanning(false)} />
        </Suspense>
      )}
      {session && confirmingFinish && (
        <FinalPrompt onEnd={() => void endTrip(session.sessionId)} onContinue={() => setConfirmingFinish(false)} busy={ending} />
      )}
    </FieldLayout>
  );
}
