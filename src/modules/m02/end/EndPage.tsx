// SCR-M02-003 — Kết thúc phiên, màn kết quả (tasks T074; screen spec §3–§6). Phiên lấy từ router state; không có (tải
// lại trang) thì dùng chuyến kết thúc gần nhất. Trạng thái đồng bộ đọc từ PendingSyncItem; việc gửi gắn ở US7. Không có
// thao tác thử lại, sửa hay xóa của du khách (BR-M02-011); không có nút "Dừng chuyến đi".
// CHG-MASCOT-2026-11-28-10 (spec-M02 v3.6, spec-Mascot v1.10; M02-43, 44, 48): ảnh bìa xanh đậm với chip, một lời cảm ơn,
// phụ đề hẹn gặp lại và Mila; thẻ tóm tắt k/n với tên tuyến; "Hành trình của bạn" gồm mọi điểm của journey (đã quét: giờ
// quét đầu tiên, "Đã tham quan" theo SC-M02-013; chưa quét: "Chưa ghé · lần sau nhé!"); nhãn gửi nhỏ dưới danh sách; nút
// chính "Gợi ý tuyến tiếp theo", link phụ "Về danh sách tuyến". Chip và vòng theo số điểm đã quét, không theo trạng thái
// phiên (HOAN_TAT không đòi quét đủ, FR-M02-016).
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router';
import { PATHS } from '../../../app/paths';
import { emitMascotEvent, isMascotEnabled, MascotSlot } from '../../../shared/mascot/index';
import { LeafConfetti } from '../../../shared/motion/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { usePackageImage } from '../content/usePackageImage';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout } from '../layout/FieldLayout';
import { useLatestTerminalSyncItem, useSession, useSessionVisits } from '../storage/readers';
import { useSyncStatus } from '../sync/useSyncStatus';
import styles from './EndPage.module.css';
import { useEndPackageView, type PackageImageRef } from './useEndPackageView';
import { takeEndedHere, type EndRouteState } from './useEndTrip';

const END_MODES = ['CELEBRATE', 'DOCK'] as const;
/** Như `MASCOT_CELEBRATION_MS` / `--duration-confetti` (design-system §4.3.1) */
const END_CELEBRATION_MS = 2_400;

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
  /** Vừa bấm Kết thúc trong lần tải trang này và chuyến hoàn tất: màn chạy ăn mừng một lần (specs/006 US7) */
  onCelebrate: () => void,
) {
  const sent = useRef<string | null>(null);
  const sessionId = ended?.sessionId;
  const status = ended?.status;
  const n = ended?.journeyCheckpoints.length ?? 0;
  useEffect(() => {
    if (!sessionId || k === null || sent.current === sessionId) return;
    if (status !== 'HOAN_TAT' && status !== 'BO_DO') return;
    sent.current = sessionId;
    const justEnded = takeEndedHere(sessionId);
    emitMascotEvent({ type: 'm02.trip.ended', status, k, n, justEnded });
    if (justEnded && status === 'HOAN_TAT') onCelebrate();
  }, [sessionId, status, k, n, onCelebrate]);
  useEffect(() => {
    if (sync) emitMascotEvent({ type: 'm02.sync.statusChanged', status: sync, online: navigator.onLine !== false });
  }, [sync]);
}

/** Vòng tiến độ của thẻ tóm tắt: đủ → ✓ xanh; thiếu → vòng vàng "k/n". Chỉ trang trí: câu "k/n điểm dừng…" là thông tin. */
function ProgressRing({ k, n }: { k: number; n: number }) {
  const full = n > 0 && k >= n;
  const percent = n > 0 ? Math.min(100, (k / n) * 100) : 0;
  return (
    <span className={styles.ring} data-full={full || undefined} aria-hidden="true">
      <svg viewBox="0 0 64 64" className={styles.ringSvg}>
        <circle className={styles.ringTrack} cx="32" cy="32" r="26" />
        <circle className={styles.ringBar} cx="32" cy="32" r="26" pathLength={100} style={{ '--ring-offset': 100 - percent } as CSSProperties} />
      </svg>
      {full ? (
        <span className={styles.ringMark}>
          <TintIcon name="check" />
        </span>
      ) : (
        <span className={styles.ringFraction}>
          {k}/{n}
        </span>
      )}
    </span>
  );
}

/** Ảnh nhỏ của điểm từ gói; không có gói, không có ảnh hoặc chưa đọc xong → ô biểu tượng (spec-M02 v3.6). */
function Thumbnail({ image }: { image: PackageImageRef | undefined }) {
  return image ? <PackageThumbnail image={image} /> : <ThumbnailPlaceholder />;
}

function PackageThumbnail({ image }: { image: PackageImageRef }) {
  const url = usePackageImage(image.routeId, image.contentVersion, image.sourceRef);
  if (!url) return <ThumbnailPlaceholder />;
  return <img className={styles.thumb} src={url} alt="" data-end-thumb="" />;
}

function ThumbnailPlaceholder() {
  return (
    <span className={`${styles.thumb} ${styles.thumbEmpty}`} data-end-thumb="placeholder">
      <TintIcon name="image" />
    </span>
  );
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
  const packageView = useEndPackageView(ended?.routeId);
  const checkpoints = [...(ended?.journeyCheckpoints ?? [])].sort((a, b) => a.sequence - b.sequence);
  const visitOf = new Map(visits.status === 'ready' ? visits.value.map((v) => [v.checkpointId, v]) : []);
  const k = checkpoints.filter((c) => visitOf.has(c.checkpointId)).length;
  const n = checkpoints.length;
  const complete = n > 0 && k >= n;

  // Ăn mừng của màn (specs/006 US7, R-12; M02-48): chip, lời cảm ơn, vòng tiến độ, danh sách hiện lần lượt, confetti lá;
  // một lần, ≤ 2,4 s, chạm bất kỳ đâu thì về trạng thái cuối. Mở lại màn: tĩnh. Không thêm chữ hay số mới (FR-MOT-016)
  const [celebrating, setCelebrating] = useState(false);
  const [celebrate] = useState(() => () => setCelebrating(true));
  useEffect(() => {
    if (!celebrating) return undefined;
    const id = window.setTimeout(() => setCelebrating(false), END_CELEBRATION_MS);
    return () => window.clearTimeout(id);
  }, [celebrating]);
  useEndMascotSignals(ended, visits.status === 'ready' ? k : null, sync, celebrate);

  return (
    <FieldLayout surface="finish">
      {ended && (
        <section
          className={styles.result}
          data-session-id={ended.sessionId}
          data-status={ended.status}
          data-complete={complete || undefined}
          data-celebrate={celebrating ? '' : undefined}
          onPointerDown={celebrating ? () => setCelebrating(false) : undefined}
        >
          {/* Ảnh bìa: nền xanh đậm phủ ảnh rừng để chữ sáng luôn đọc rõ; Mila ở góc phải (spec-Mascot v1.10, OD-MAS-34) */}
          <div className={styles.hero}>
            {celebrating && <LeafConfetti count={28} />}
            <div className={styles.heroText} data-end-hero-text="">
              <p className={styles.chip}>
                <TintIcon name="check" className={styles.chipIcon} />
                {complete ? messages.end.chipComplete : messages.end.chipEnded}
              </p>
              <h1 className={styles.title}>{messages.end.title}</h1>
              <p className={styles.farewell}>{messages.end.farewell}</p>
            </div>
            {/* Một Mila trên màn: CONFLICT không có hình ở banner, Mila đứng yên ở đây (spec-Mascot v1.10 US-MAS-08.3) */}
            {isMascotEnabled() && <MascotSlot id="end-hero" modes={END_MODES} size="end" />}
          </div>

          {/* Thẻ tóm tắt đè lên mép dưới ảnh bìa; tên tuyến chỉ khi có gói sẵn sàng của tuyến (spec-M02 v3.6) */}
          <div className={styles.summary} data-end-summary="">
            <ProgressRing k={k} n={n} />
            <div className={styles.summaryText}>
              {packageView && (
                <>
                  <p className={styles.eyebrow}>{complete ? messages.end.routeComplete : messages.end.routeYours}</p>
                  <p className={styles.routeName}>{packageView.routeName[language]}</p>
                </>
              )}
              <p className={styles.count}>
                <b className={styles.countValue}>
                  {k}/{n}
                </b>{' '}
                {messages.end.visitedCount}
              </p>
            </div>
          </div>

          <section className={styles.journey} aria-labelledby={listTitleId}>
            <h2 className={styles.listTitle} id={listTitleId}>
              {messages.end.listTitle}
            </h2>
            <ol className={styles.stops}>
              {checkpoints.map((checkpoint, index) => {
                const visit = visitOf.get(checkpoint.checkpointId);
                return (
                  <li
                    className={styles.stop}
                    key={checkpoint.checkpointId}
                    data-visited={visit ? '' : undefined}
                    style={{ '--i': index } as CSSProperties}
                  >
                    <span className={styles.dot} aria-hidden="true">
                      {visit ? <TintIcon name="check" /> : index + 1}
                    </span>
                    <div className={styles.row}>
                      <Thumbnail image={packageView?.thumbnails.get(checkpoint.checkpointId)} />
                      <div className={styles.rowText}>
                        <p className={styles.number}>{String(index + 1).padStart(2, '0')}</p>
                        <p className={styles.name}>{checkpoint.checkpointName[language]}</p>
                        <p className={styles.meta}>
                          {visit ? (
                            <>
                              <span className={styles.visited}>{messages.end.visited}</span>{' '}
                              <time dateTime={visit.checkedInAt}>{clockTime(visit.checkedInAt)}</time>
                            </>
                          ) : (
                            messages.end.missed
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Nhãn gửi nhỏ dưới danh sách (M02-44): chữ là thông tin, màu và chấm chỉ bổ trợ */}
            {sync && sync !== 'CONFLICT' && (
              <p className={styles.sync} role="status" data-sync={sync}>
                {sync === 'SYNCED' ? <TintIcon name="check" className={styles.syncIcon} /> : <span className={styles.pulse} aria-hidden="true" />}
                {sync === 'SYNCED' ? messages.end.syncSynced : messages.end.syncPending}
              </p>
            )}
            {/* Không gửi được: banner chỉ có chữ, không nút thử lại (BR-M02-011; spec-Mascot v1.10) */}
            {sync === 'CONFLICT' && (
              <div className={styles.conflict} data-end-conflict="">
                <TintIcon name="alert-circle" className={styles.conflictIcon} />
                <p className={styles.conflictText} role="alert">
                  {messages.end.syncConflict}
                </p>
              </div>
            )}
          </section>
        </section>
      )}
      <div className={styles.actions}>
        <Link className={styles.primary} to={PATHS.recommend}>
          <TintIcon name="compass" className={styles.primaryIcon} />
          {messages.end.suggestNext}
        </Link>
        <Link className={styles.secondary} to={PATHS.catalog}>
          {messages.end.backToRoutes}
        </Link>
      </div>
    </FieldLayout>
  );
}
