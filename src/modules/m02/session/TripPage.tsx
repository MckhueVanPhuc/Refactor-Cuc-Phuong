// SCR-M02-001 — Phiên trải nghiệm & Quét QR (tasks T032, T047, T075; screen spec §4). Vào `/trip` gọi enterTrip một
// lần; sau đó journey, lượt ghé và phiên đọc theo thời gian thực (tab khác đổi cũng thấy). Nút Quét mở scanner (chunk
// lazy `m02-scanner`); mã đọc được đi qua processScannedText rồi sang `/trip/qr/:qrIdentifier` với kết quả trong router
// state. spec-M02 v3.4: nút "Kết thúc chuyến" có ở mọi lúc trong chuyến, qua hộp thoại xác nhận (FR-M02-015); câu hỏi
// kết thúc chuyến tự mở một lần khi du khách về màn này sau lượt quét đầu tiên ở điểm cuối (BR-M02-021).
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { emitMascotEvent, MascotFigure, MascotSlot, type BilingualName } from '../../../shared/mascot/index';
import { ScanNotice, type ScanNoticeKind } from '../content/ScanNotice';
import { FinalPrompt } from '../end/FinalPrompt';
import { takeFinalPrompt } from '../end/finalPromptSignal';
import { useEndTrip } from '../end/useEndTrip';
import type { M02Messages } from '../i18n';
import { useM02Messages } from '../i18n/useM02Messages';
import type { ManifestCheckpoint } from '../../../shared/contracts/journeyManifest';
import { TintIcon } from '../../../shared/ui/Icon';
import { nextCheckpoint, RouteJourneyMap } from '../journey/RouteJourneyMap';
import { takeUnlock } from '../journey/unlockSignal';
import { FieldLayout, FieldNotice } from '../layout/FieldLayout';
import { useBusyWhile } from '../pwa/registerBusy';
import { processScannedText, type ScanResult } from '../scan/processScan';
import type { ScannerTarget } from '../scanner/QrScanner';
import { setScanHandler } from '../scan/scanBridge';
import type { CheckpointVisitRow } from '../storage/rows';
import { useRunningSession, useSessionVisits } from '../storage/readers';
import { finalCheckpointId } from '../sync/buildSyncRecord';
import { usePreviousTripSyncError } from '../sync/useSyncStatus';
import type { RejectReason } from './decideEntry';
import { enterTrip, type EntryResult } from './enterTrip';
import styles from './TripPage.module.css';
import { useRouteName } from './useRouteName';

const QrScanner = lazy(async () => ({ default: (await import('../scanner/QrScanner')).QrScanner }));

const REJECT_MESSAGE: Record<RejectReason, keyof M02Messages['handoff']> = {
  INVALID: 'outdatedVersion',
  USED: 'alreadyUsed',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};

/** Đường dẫn nội dung của một mã; kết quả quét đi kèm trong router state (data-model §6). */
export const contentPath = (qrIdentifier: string) => `${PATHS.m02SessionEntry}/qr/${encodeURIComponent(qrIdentifier)}`;

/** `returnTo`: màn Quét QR (SCR-M02-005) mở từ thanh tab M01 — khách tự do quay lại đúng màn đó. */
export type ContentRouteState = { scan?: ScanResult; review?: true; returnTo?: string };

type EntryState = { status: 'entering' } | { status: 'done'; result: EntryResult };

/** Điểm gợi ý kế tiếp với số hiển thị (đếm liên tục theo `sequence`, BR-M02-006); quét hết → `null`. */
function scannerTarget(checkpoints: readonly ManifestCheckpoint[], visits: readonly CheckpointVisitRow[]): ScannerTarget | null {
  const ordered = [...checkpoints].sort((a, b) => a.sequence - b.sequence);
  const next = nextCheckpoint(ordered, new Set(visits.map((v) => v.checkpointId)));
  return next ? { number: ordered.indexOf(next) + 1, name: next.checkpointName } : null;
}

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
          <MascotFigure pose="confused" size="sm" />
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
/** `text`: nội dung mã vừa đọc, để "Thử lại" tra lại đúng mã đó (CHG-MASCOT-2026-11-27-09) */
type StayNotice = { kind: ScanNoticeKind; freeVisitor: boolean; text: string };

export function TripPage() {
  const messages = useM02Messages();
  const navigate = useNavigate();
  const entry = useTripEntry();
  const running = useRunningSession();
  const session = entry.status === 'done' && running.status === 'ready' ? running.value : null;
  const visits = useSessionVisits(session?.sessionId);
  // Tên tuyến cho thẻ "Tuyến đang đi" từ gói sẵn sàng của cùng tuyến (spec-M02 v3.5; E-SCR-M02-001-26)
  const routeName = useRouteName(session?.routeId);
  // Mở khóa checkpoint vừa ghé khi quay về (specs/006 R-05): đọc một lần lúc mở màn; tải lại trang thì không còn
  const [unlock] = useState(takeUnlock);
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
  const visitCount = visits.status === 'ready' ? visits.value.length : null;
  // Điểm gợi ý kế tiếp (MSG-MAS-030, 056 v1.7; nhãn "Đang tìm điểm…" của scanner); quét hết → null
  const target = session && visits.status === 'ready' ? scannerTarget(session.journeyCheckpoints, visits.value) : null;
  const next = target?.name ?? null;
  // Quét đủ mọi điểm (k = n): "Kết thúc chuyến" thành nút chính (E-SCR-M02-001-27)
  const allScanned = Boolean(session) && visitCount !== null && visitCount > 0 && target === null;
  useTripMascotSignals(entry, session?.journeyCheckpoints.length ?? null, visitCount, finalVisited, next);
  useScannerMascotSignals(scanning, session !== null, visitCount ?? 0);
  // Câu hỏi kết thúc chuyến đang chờ từ lượt quét điểm cuối (BR-M02-021 v3.4): hỏi một lần khi màn có phiên và lượt ghé
  const sessionId = session?.sessionId;
  useEffect(() => {
    if (sessionId && finalVisited && takeFinalPrompt(sessionId)) setConfirmingFinish(true);
  }, [sessionId, finalVisited]);

  const handleText = useCallback(
    async (text: string) => {
      // Mila kiểm tra mã cùng du khách (MAS-B-043); phát trước khi scanner đóng
      emitMascotEvent({ type: 'm02.scanner.detected' });
      setScanning(false);
      setStayNotice(null);
      setLookingUp(true);
      try {
        const result = await processScannedText(text);
        if (result.display.kind === 'LIVE' || result.display.kind === 'PACKAGE') {
          navigate(contentPath(result.qrIdentifier), { state: { scan: result } satisfies ContentRouteState });
          return;
        }
        // Kết quả ở lại màn (MAS-B-045…048); kết quả có nội dung do trang nội dung phát
        emitMascotEvent({
          type: 'm02.scan.resolved',
          display: result.display.kind,
          hasSession: result.session !== null,
          freeVisitor: result.freeVisitor,
          visitCreated: result.visitCreated,
          inJourney: result.visit !== null,
          finalPromptNeeded: result.finalPromptNeeded,
        });
        setStayNotice({ kind: result.display.kind, freeVisitor: result.freeVisitor, text });
        // Lượt quét điểm cuối ghi ngay tại màn này (kết quả không có nội dung để mở): hỏi luôn
        if (result.finalPromptNeeded) setConfirmingFinish(true);
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
          {stayNotice ? (
            <ScanNotice
              kind={stayNotice.kind}
              freeVisitor={stayNotice.freeVisitor}
              notCounted={stayNotice.freeVisitor ? null : 'journey'}
              onRetry={() => void handleText(stayNotice.text)}
              onDismiss={() => setStayNotice(null)}
            />
          ) : (
            <EntryNotice result={entry.result} />
          )}
          {previousTripSyncError && (
            <p className={`${styles.notice} ${styles.error}`} data-previous-sync-error="">
              {messages.trip.previousTripSyncError}
            </p>
          )}
          {lookingUp && (
            <p className={`${styles.notice} ${styles.info} ${styles.lookingUp}`} role="status">
              {/* Lá xoay trong lúc kiểm tra mã (E-SCR-M02-001-12); giảm chuyển động: đứng yên */}
              <TintIcon name="leaf" className={styles.leaf} />
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
          <RouteJourneyMap
            checkpoints={session.journeyCheckpoints}
            visits={visits.value}
            onOpen={openVisit}
            unlock={unlock}
            routeName={routeName}
          />
        )}
      </div>
      {entry.status === 'done' && (
        <div className={styles.actions}>
          {/* Mila đứng trên nút Quét, tư thế theo tiến độ (MAS-B-033; specs/005 T042). Hộp thoại kết thúc chuyến có hình Mila
              riêng: lúc hộp thoại mở, ô này không đăng ký — một Mila trên màn (spec-Mascot §5.1) */}
          <div className={styles.dock}>
            {!confirmingFinish && <MascotSlot id="trip-dock" modes={['DOCK']} size="trip" />}
          </div>
          {allScanned && session ? (
            // Quét đủ: việc chính là kết thúc chuyến; Quét QR thành nút phụ (CHG-MASCOT-2026-11-27-08 D1). Trượt lên khi
            // điểm vừa quét làm đủ (dấu mở khóa của lần quay về này)
            <div className={styles.doneCard} data-all-scanned="" data-enter={unlock ? '' : undefined}>
              <p className={styles.doneText}>{messages.trip.allScanned({ n: session.journeyCheckpoints.length })}</p>
              <button type="button" className={styles.scan} onClick={() => setConfirmingFinish(true)}>
                {messages.trip.finish}
              </button>
              <button type="button" className={styles.finish} onClick={() => setScanning(true)} disabled={lookingUp}>
                <span className={styles.scanIcon} aria-hidden="true" />
                {messages.trip.scan}
              </button>
            </div>
          ) : (
            <>
              <button type="button" className={styles.scan} onClick={() => setScanning(true)} disabled={lookingUp}>
                <span className={styles.scanIcon} aria-hidden="true" />
                {messages.trip.scan}
              </button>
              {session && (
                <button type="button" className={styles.finish} onClick={() => setConfirmingFinish(true)}>
                  {messages.trip.finish}
                </button>
              )}
            </>
          )}
        </div>
      )}
      {scanning && (
        <Suspense fallback={null}>
          <QrScanner onDetected={(text) => void handleText(text)} onClose={() => setScanning(false)} mascot target={target} />
        </Suspense>
      )}
      {session && confirmingFinish && visitCount !== null && (
        <FinalPrompt
          k={visitCount}
          n={session.journeyCheckpoints.length}
          onEnd={() => void endTrip(session.sessionId)}
          onContinue={() => setConfirmingFinish(false)}
          busy={ending}
        />
      )}
    </FieldLayout>
  );
}

/** Mở/đóng scanner cho Mila (contract `m02.scanner.opened` / `closed`; T051). Không phát lúc màn vừa mở. */
function useScannerMascotSignals(scanning: boolean, hasSession: boolean, k: number) {
  const previous = useRef(scanning);
  useEffect(() => {
    if (previous.current === scanning) return;
    previous.current = scanning;
    emitMascotEvent(scanning ? { type: 'm02.scanner.opened', hasSession, k } : { type: 'm02.scanner.closed' });
  }, [scanning, hasSession, k]);
}

/**
 * Tín hiệu cho Mila (specs/005 contracts/mascot-event-contract.md §3; T042): kết quả vào chuyến (một lần mỗi lần mở
 * màn) và tiến độ hành trình mỗi khi đổi. `journeyLength` null = không có phiên; `visitCount` null = đang đọc.
 */
function useTripMascotSignals(
  entry: EntryState,
  journeyLength: number | null,
  visitCount: number | null,
  finalVisited: boolean,
  next: BilingualName | null,
) {
  const hasSession = journeyLength !== null;
  const ready = entry.status === 'done' && (!hasSession || visitCount !== null);
  const entered = useRef(false);
  useEffect(() => {
    if (!ready || entered.current || entry.status !== 'done') return;
    entered.current = true;
    emitMascotEvent({ type: 'm02.trip.entered', kind: entry.result.kind, hasSession, k: visitCount ?? 0, n: journeyLength ?? 0, next });
  }, [ready, entry, hasSession, visitCount, journeyLength, next]);
  // Tên điểm kế tiếp đổi theo `vi`/`en` gộp thành khóa chuỗi để effect không chạy lại vì object mới mỗi lần render
  const nextVi = next?.vi ?? null;
  const nextEn = next?.en ?? null;
  useEffect(() => {
    if (!ready) return;
    const nextName = nextVi !== null && nextEn !== null ? { vi: nextVi, en: nextEn } : null;
    emitMascotEvent({ type: 'm02.trip.shown', hasSession, k: visitCount ?? 0, n: journeyLength ?? 0, finalVisited, next: nextName });
  }, [ready, hasSession, visitCount, journeyLength, finalVisited, nextVi, nextEn]);
}
