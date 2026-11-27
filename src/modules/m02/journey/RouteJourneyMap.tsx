// RouteJourneyMap (tasks T045; FR-M02-008, 009; BR-M02-006; SC-M02-013): journey đóng băng của phiên, sắp theo
// `sequence` và đánh số liên tục 1, 2, 3… dù `sequence` có khoảng trống. Điểm đã quét ghi "Đã quét QR" và giờ quét đầu
// tiên — nghĩa là mã đã được quét, không phải xác nhận có mặt. Chạm điểm đã quét → xem lại nội dung của mã đó.
// CHG-MASCOT-2026-11-27-07 (spec-M02 v3.5 §7): thẻ tuyến ở đầu (E-SCR-M02-001-26) với thanh chia đoạn (E-25); điểm đã
// quét có vòng ✓ và mũi tên ›; điểm chưa quét đầu tiên theo thứ tự hiển thị là "Tiếp theo" — chỉ gợi ý, không khóa điểm.
import type { ManifestCheckpoint } from '../../../shared/contracts/journeyManifest';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import type { RouteName } from '../session/useRouteName';
import type { CheckpointVisitRow } from '../storage/rows';
import styles from './RouteJourneyMap.module.css';

/** Giờ thiết bị dạng hh:mm (E-SCR-M02-001-08). */
function clockTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Điểm gợi ý kế tiếp: điểm chưa quét đầu tiên theo thứ tự hiển thị; quét hết → `undefined` (BR-M02-006: chỉ gợi ý). */
export function nextCheckpoint(
  checkpoints: readonly ManifestCheckpoint[],
  visitedIds: ReadonlySet<string>,
): ManifestCheckpoint | undefined {
  return [...checkpoints].sort((a, b) => a.sequence - b.sequence).find((c) => !visitedIds.has(c.checkpointId));
}

type SegmentState = 'scanned' | 'next' | 'pending';

export function RouteJourneyMap({
  checkpoints,
  visits,
  onOpen,
  unlock = null,
  routeName = null,
}: {
  checkpoints: readonly ManifestCheckpoint[];
  visits: readonly CheckpointVisitRow[];
  onOpen: (visit: CheckpointVisitRow) => void;
  /** Checkpoint vừa có lượt ghé mới khi quay về màn (specs/006 R-05): nảy một lần, đoạn của nó trên thanh sáng lên */
  unlock?: string | null;
  /** Tên tuyến từ gói sẵn sàng (spec-M02 v3.5); `null` = không có gói, thẻ không có dòng tên */
  routeName?: RouteName | null;
}) {
  const messages = useM02Messages();
  const language = useM02DisplayLanguage();
  const ordered = [...checkpoints].sort((a, b) => a.sequence - b.sequence);
  const visitOf = new Map(visits.map((visit) => [visit.checkpointId, visit]));
  const scanned = ordered.filter((c) => visitOf.has(c.checkpointId)).length;
  const remaining = ordered.length - scanned;
  const nextId = nextCheckpoint(ordered, new Set(visitOf.keys()))?.checkpointId;
  const unlocked = unlock !== null && visitOf.has(unlock) ? unlock : null;
  const progressLabel = messages.journey.progress({ scanned, total: ordered.length });
  const stateOf = (checkpointId: string): SegmentState =>
    visitOf.has(checkpointId) ? 'scanned' : checkpointId === nextId ? 'next' : 'pending';

  return (
    <section className={styles.journey} aria-labelledby="m02-journey-heading">
      {/* Thẻ tuyến (E-SCR-M02-001-26): giữ ngữ cảnh tuyến/phiên phía trên hành trình (design-system §5 "M02") */}
      <div className={styles.summary} data-route-summary="">
        <p className={styles.eyebrow}>{messages.journey.currentRoute}</p>
        {routeName && <p className={styles.routeName}>{routeName[language]}</p>}
        {/* Thanh k/n chia đoạn (E-25, design-system §5.3): mỗi điểm một đoạn; câu tiến độ dưới là thông tin chính */}
        <div
          className={styles.segments}
          role="progressbar"
          aria-label={progressLabel}
          aria-valuemin={0}
          aria-valuemax={ordered.length}
          aria-valuenow={scanned}
        >
          {ordered.map((checkpoint) => (
            <span
              className={styles.segment}
              key={checkpoint.checkpointId}
              data-state={stateOf(checkpoint.checkpointId)}
              data-unlock={checkpoint.checkpointId === unlocked ? '' : undefined}
            />
          ))}
        </div>
        <div className={styles.counts}>
          <p className={styles.progress}>{progressLabel}</p>
          <p className={styles.remaining}>{remaining > 0 ? messages.journey.remaining({ r: remaining }) : messages.journey.allScanned}</p>
        </div>
      </div>
      <h2 className={styles.heading} id="m02-journey-heading">
        {messages.journey.heading}
      </h2>
      <ol className={styles.list}>
        {ordered.map((checkpoint, index) => {
          const visit = visitOf.get(checkpoint.checkpointId);
          const isNext = checkpoint.checkpointId === nextId;
          const name = <span className={styles.name}>{checkpoint.checkpointName[language]}</span>;
          return (
            <li
              className={styles.item}
              key={checkpoint.checkpointId}
              data-checkpoint={checkpoint.checkpointId}
              data-state={stateOf(checkpoint.checkpointId)}
              data-unlock={checkpoint.checkpointId === unlocked ? '' : undefined}
            >
              {/* Số thứ tự hiển thị; đã quét thì vòng ✓ (danh sách có thứ tự vẫn đọc số cho trình đọc màn hình) */}
              <span className={styles.number} aria-hidden="true">
                {visit ? <TintIcon name="check" className={styles.check} /> : index + 1}
              </span>
              {visit ? (
                <button type="button" className={styles.open} onClick={() => onOpen(visit)}>
                  <span className={styles.body}>
                    {name}
                    <span className={styles.status}>
                      <span className={styles.scanned}>{messages.trip.scanned}</span>
                      <span className={styles.time}>{clockTime(visit.checkedInAt)}</span>
                    </span>
                  </span>
                  {/* Mũi tên báo hàng chạm được để đọc lại (E-SCR-M02-001-20) */}
                  <TintIcon name="chevron-right" className={styles.chevron} />
                </button>
              ) : (
                <div className={styles.pending}>
                  <span className={styles.body}>
                    {name}
                    <span className={styles.notScanned}>{messages.journey.notScanned}</span>
                  </span>
                  {isNext && <span className={styles.nextBadge}>{messages.journey.next}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
