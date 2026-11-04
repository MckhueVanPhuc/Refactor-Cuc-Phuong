// SCR-M02-003 — Kết thúc phiên, màn kết quả (tasks T074; screen spec §3–§6). Phiên lấy từ router state; không có (tải
// lại trang) thì dùng chuyến kết thúc gần nhất. Danh sách điểm đã quét từ PlaySession và CheckpointVisit local, nhãn
// "Đã quét QR" (SC-M02-013). Trạng thái đồng bộ đọc từ PendingSyncItem; việc gửi gắn ở US7. Không có thao tác thử lại,
// sửa hay xóa của du khách (BR-M02-011); không có nút "Dừng chuyến đi".
import { Link, useLocation } from 'react-router';
import { PATHS } from '../../../app/paths';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout } from '../layout/FieldLayout';
import { useLatestTerminalSyncItem, useSession, useSessionVisits, useSyncItem } from '../storage/readers';
import styles from './EndPage.module.css';
import type { EndRouteState } from './useEndTrip';

function clockTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EndPage() {
  const messages = useM02Messages();
  const language = useM02DisplayLanguage();
  const state = (useLocation().state ?? {}) as Partial<EndRouteState>;
  const latest = useLatestTerminalSyncItem();
  const sessionId = state.sessionId ?? (latest.status === 'ready' ? latest.value?.sessionId : undefined);
  const session = useSession(sessionId);
  const visits = useSessionVisits(sessionId);
  const syncItem = useSyncItem(sessionId);

  const ended = session.status === 'ready' && session.value && session.value.status !== 'DANG_DIEN_RA' ? session.value : null;
  const order = new Map(ended?.journeyCheckpoints.map((c) => [c.checkpointId, c]) ?? []);
  const scanned =
    visits.status === 'ready'
      ? [...visits.value]
          .filter((v) => order.has(v.checkpointId))
          .sort((a, b) => order.get(a.checkpointId)!.sequence - order.get(b.checkpointId)!.sequence)
      : [];
  const sync = syncItem.status === 'ready' ? syncItem.value?.syncStatus : undefined;

  return (
    <FieldLayout surface="reader">
      {ended && (
        <section className={styles.result} data-session-id={ended.sessionId} data-status={ended.status}>
          <h1 className={styles.title}>{messages.end.title}</h1>
          {sync === 'CONFLICT' ? (
            <p className={`${styles.sync} ${styles.conflict}`} role="alert">
              {messages.end.syncConflict}
            </p>
          ) : (
            sync && (
              <p className={styles.sync} role="status" data-sync={sync}>
                {sync === 'SYNCED' ? messages.end.syncSynced : messages.end.syncPending}
              </p>
            )
          )}
          <h2 className={styles.listTitle}>{messages.end.listTitle}</h2>
          <ol className={styles.list}>
            {scanned.map((visit) => (
              <li className={styles.item} key={visit.checkpointId}>
                <span className={styles.name}>{order.get(visit.checkpointId)!.checkpointName[language]}</span>
                <span className={styles.meta}>
                  <span className={styles.scanned}>{messages.trip.scanned}</span>
                  <span>{clockTime(visit.checkedInAt)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <Link className={styles.back} to={PATHS.catalog}>
        {messages.end.backToRoutes}
      </Link>
    </FieldLayout>
  );
}
