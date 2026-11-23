// SCR-M02-003 — Kết thúc phiên, màn kết quả (tasks T074; screen spec §3–§6). Phiên lấy từ router state; không có (tải
// lại trang) thì dùng chuyến kết thúc gần nhất. Danh sách điểm đã quét từ PlaySession và CheckpointVisit local, nhãn
// "Đã tham quan" kèm giờ quét (SC-M02-013, spec-M02 3.3 clarification 3). Trạng thái đồng bộ đọc từ PendingSyncItem;
// việc gửi gắn ở US7. Không có thao tác thử lại, sửa hay xóa của du khách (BR-M02-011); không có nút "Dừng chuyến đi".
// Bố cục theo ảnh mẫu người dùng duyệt 2026-11-11: lời chào trên ảnh rừng, thẻ hẹn gặp lại, thẻ danh sách, nút về danh mục.
import { useEffect, useId, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { PATHS } from '../../../app/paths';
import { emitMascotEvent, MascotFigure, MascotSlot } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout } from '../layout/FieldLayout';
import { useLatestTerminalSyncItem, useSession, useSessionVisits } from '../storage/readers';
import { useSyncStatus } from '../sync/useSyncStatus';
import styles from './EndPage.module.css';
import { takeEndedHere, type EndRouteState } from './useEndTrip';

const END_MODES = ['CELEBRATE', 'DOCK'] as const;

function clockTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type SyncStatus = ReturnType<typeof useSyncStatus>;

/**
 * Tín hiệu cho Mila (specs/005 mascot-event-contract): chuyến đã kết thúc (một lần mỗi phiên, khi danh sách đã đọc xong)
 * và trạng thái gửi. Chỉ phát, không đổi gì của màn.
 */
function useEndMascotSignals(
  ended: { sessionId: string; status: string; journeyCheckpoints: readonly unknown[] } | null,
  k: number | null,
  sync: SyncStatus,
) {
  const sent = useRef<string | null>(null);
  const sessionId = ended?.sessionId;
  const status = ended?.status;
  const n = ended?.journeyCheckpoints.length ?? 0;
  useEffect(() => {
    if (!sessionId || k === null || sent.current === sessionId) return;
    if (status !== 'HOAN_TAT' && status !== 'BO_DO') return;
    sent.current = sessionId;
    emitMascotEvent({ type: 'm02.trip.ended', status, k, n, justEnded: takeEndedHere(sessionId) });
  }, [sessionId, status, k, n]);
  useEffect(() => {
    if (sync) emitMascotEvent({ type: 'm02.sync.statusChanged', status: sync, online: navigator.onLine !== false });
  }, [sync]);
}

export function EndPage() {
  const messages = useM02Messages();
  const language = useM02DisplayLanguage();
  const listTitleId = useId();
  const state = (useLocation().state ?? {}) as Partial<EndRouteState>;
  const latest = useLatestTerminalSyncItem();
  const sessionId = state.sessionId ?? (latest.status === 'ready' ? latest.value?.sessionId : undefined);
  const session = useSession(sessionId);
  const visits = useSessionVisits(sessionId);
  const sync = useSyncStatus(sessionId);

  const ended = session.status === 'ready' && session.value && session.value.status !== 'DANG_DIEN_RA' ? session.value : null;
  const order = new Map(ended?.journeyCheckpoints.map((c) => [c.checkpointId, c]) ?? []);
  const scanned =
    visits.status === 'ready'
      ? [...visits.value]
          .filter((v) => order.has(v.checkpointId))
          .sort((a, b) => order.get(a.checkpointId)!.sequence - order.get(b.checkpointId)!.sequence)
      : [];
  useEndMascotSignals(ended, visits.status === 'ready' ? scanned.length : null, sync);

  return (
    <FieldLayout surface="finish">
      {ended && (
        <section className={styles.result} data-session-id={ended.sessionId} data-status={ended.status}>
          <div className={styles.hero}>
            {/* Mila đứng cạnh huy hiệu (spec-Mascot OD-MAS-10); không bật Mila thì slot không render, huy hiệu đứng một mình */}
            <div className={styles.badgeRow}>
              <span className={styles.badge} aria-hidden="true">
                <TintIcon name="check" className={styles.check} />
                <TintIcon name="leaf" className={styles.sprig} />
              </span>
              <MascotSlot id="end-hero" modes={END_MODES} size="end" />
            </div>
            <h1 className={styles.title}>{messages.end.title}</h1>
            <p className={styles.thanks}>{messages.end.thanks}</p>
            <span className={styles.divider} aria-hidden="true">
              <TintIcon name="leaf" />
            </span>
            <p className={styles.wish}>{messages.end.wish}</p>
          </div>

          <p className={styles.farewell}>
            <TintIcon name="heart" className={styles.heart} />
            <span className={styles.farewellText}>{messages.end.farewell}</span>
          </p>

          {/* Mila chỉ là hình cạnh thông báo: không câu, không nút (BR-M02-011; MAS-B-072) */}
          {sync === 'CONFLICT' && (
            <div className={styles.conflict} data-end-conflict="">
              <MascotFigure pose="confused" size="sm" />
              <p className={styles.conflictText} role="alert">
                {messages.end.syncConflict}
              </p>
            </div>
          )}

          <section className={styles.visits} aria-labelledby={listTitleId}>
            <div className={styles.visitsHead}>
              <h2 className={styles.listTitle} id={listTitleId}>
                <TintIcon name="map-pin" className={styles.pin} />
                {messages.end.listTitle}
              </h2>
              {sync && sync !== 'CONFLICT' && (
                <p className={styles.sync} role="status" data-sync={sync}>
                  {sync === 'SYNCED' ? messages.end.syncSynced : messages.end.syncPending}
                </p>
              )}
            </div>
            <ol className={styles.list}>
              {scanned.map((visit) => (
                <li className={styles.item} key={visit.checkpointId}>
                  <span className={styles.name}>{order.get(visit.checkpointId)!.checkpointName[language]}</span>
                  <span className={styles.meta}>
                    <span className={styles.visited}>{messages.end.visited}</span>
                    <time dateTime={visit.checkedInAt}>{clockTime(visit.checkedInAt)}</time>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </section>
      )}
      <Link className={styles.back} to={PATHS.catalog}>
        <TintIcon name="home" className={styles.home} />
        {messages.end.backToRoutes}
      </Link>
    </FieldLayout>
  );
}
