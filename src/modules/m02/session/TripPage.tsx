// SCR-M02-001 â€” PhiÃªn tráº£i nghiá»‡m & QuÃ©t QR (tasks T032, T047; screen spec Â§4). VÃ o `/trip` gá»i enterTrip má»™t láº§n;
// sau Ä‘Ã³ journey, lÆ°á»£t ghÃ© vÃ  phiÃªn Ä‘á»c theo thá»i gian thá»±c (tab khÃ¡c Ä‘á»•i cÅ©ng tháº¥y). NÃºt QuÃ©t má»Ÿ scanner (chunk lazy
// `m02-scanner`); mÃ£ Ä‘á»c Ä‘Æ°á»£c Ä‘i qua processScannedText rá»“i sang `/trip/qr/:qrIdentifier` vá»›i káº¿t quáº£ trong router state.
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { ScanNotice, type ScanNoticeKind } from '../content/ScanNotice';
import type { M02Messages } from '../i18n';
import { useM02Messages } from '../i18n/useM02Messages';
import { RouteJourneyMap } from '../journey/RouteJourneyMap';
import { FieldLayout, FieldNotice } from '../layout/FieldLayout';
import { processScannedText, type ScanResult } from '../scan/processScan';
import { setScanHandler } from '../scan/scanBridge';
import type { CheckpointVisitRow } from '../storage/rows';
import { useRunningSession, useSessionVisits } from '../storage/readers';
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

/** ÄÆ°á»ng dáº«n ná»™i dung cá»§a má»™t mÃ£; káº¿t quáº£ quÃ©t Ä‘i kÃ¨m trong router state (data-model Â§6). */
export const contentPath = (qrIdentifier: string) => `${PATHS.m02SessionEntry}/qr/${encodeURIComponent(qrIdentifier)}`;

export type ContentRouteState = { scan?: ScanResult; review?: true };

type EntryState = { status: 'entering' } | { status: 'done'; result: EntryResult };

function useTripEntry(): EntryState {
  const [state, setState] = useState<EntryState>({ status: 'entering' });
  // Má»™t láº§n má»—i láº§n má»Ÿ mÃ n (StrictMode gá»i effect hai láº§n á»Ÿ dev)
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void enterTrip().then((result) => setState({ status: 'done', result }));
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

  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [stayNotice, setStayNotice] = useState<StayNotice | null>(null);

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
            {messages.trip.scan}
          </button>
        </div>
      )}
      {scanning && (
        <Suspense fallback={null}>
          <QrScanner onDetected={(text) => void handleText(text)} onClose={() => setScanning(false)} />
        </Suspense>
      )}
    </FieldLayout>
  );
}
