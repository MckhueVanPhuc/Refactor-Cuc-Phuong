// SCR-M02-001 — Phiên trải nghiệm & Quét QR (tasks T032; screen spec §4 "Handoff rejected", "Session started",
// "Session restored"). Vào `/trip` gọi enterTrip một lần; thông báo đặt vào vùng chung của FieldLayout.
// Vùng journey và nút Quét gắn ở US2.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import type { M02Messages } from '../i18n';
import { useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout, FieldNotice } from '../layout/FieldLayout';
import type { RejectReason } from './decideEntry';
import { enterTrip, type EntryResult } from './enterTrip';
import styles from './TripPage.module.css';

const REJECT_MESSAGE: Record<RejectReason, keyof M02Messages['handoff']> = {
  INVALID: 'outdatedVersion',
  USED: 'alreadyUsed',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};

type EntryState = { status: 'entering' } | { status: 'done'; result: EntryResult };

function useTripEntry(): EntryState {
  const [state, setState] = useState<EntryState>({ status: 'entering' });
  // Một lần mỗi lần mở màn (StrictMode gọi effect hai lần ở dev)
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

/** Phiên mà màn hiển thị: phiên vừa tạo/khôi phục, hoặc phiên đang chạy khi handoff bị từ chối. */
function sessionOf(result: EntryResult) {
  if (result.kind === 'STARTED' || result.kind === 'RESTORED') return result.session;
  if (result.kind === 'REJECTED' || result.kind === 'REPLACE_FAILED') return result.running;
  return null;
}

export function TripPage() {
  const messages = useM02Messages();
  const entry = useTripEntry();
  const session = entry.status === 'done' ? sessionOf(entry.result) : null;

  return (
    <FieldLayout surface="scanner" title={messages.screenTitle.trip}>
      {entry.status === 'done' && (
        <FieldNotice>
          <EntryNotice result={entry.result} />
        </FieldNotice>
      )}
      {/* Journey của phiên (RouteJourneyMap) và nút Quét: US2 */}
      <div className={styles.journey} data-session-id={session?.sessionId} data-entry={entry.status === 'done' ? entry.result.kind : 'ENTERING'} />
    </FieldLayout>
  );
}
