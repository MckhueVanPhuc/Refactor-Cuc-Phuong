// RouteJourneyMap (tasks T045; FR-M02-008, 009; BR-M02-006; SC-M02-013): journey đóng băng của phiên, sắp theo
// `sequence` và đánh số liên tục 1, 2, 3… dù `sequence` có khoảng trống. Điểm đã quét ghi "Đã quét QR" và giờ quét đầu
// tiên — nghĩa là mã đã được quét, không phải xác nhận có mặt. Chạm điểm đã quét → xem lại nội dung của mã đó.
import type { ManifestCheckpoint } from '../../../shared/contracts/journeyManifest';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import type { CheckpointVisitRow } from '../storage/rows';
import styles from './RouteJourneyMap.module.css';

/** Giờ thiết bị dạng hh:mm (E-SCR-M02-001-08). */
function clockTime(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function RouteJourneyMap({
  checkpoints,
  visits,
  onOpen,
}: {
  checkpoints: readonly ManifestCheckpoint[];
  visits: readonly CheckpointVisitRow[];
  onOpen: (visit: CheckpointVisitRow) => void;
}) {
  const messages = useM02Messages();
  const language = useM02DisplayLanguage();
  const ordered = [...checkpoints].sort((a, b) => a.sequence - b.sequence);
  const visitOf = new Map(visits.map((visit) => [visit.checkpointId, visit]));
  const scanned = ordered.filter((c) => visitOf.has(c.checkpointId)).length;

  return (
    <section className={styles.journey} aria-labelledby="m02-journey-heading">
      <div className={styles.header}>
        <h2 className={styles.heading} id="m02-journey-heading">
          {messages.journey.heading}
        </h2>
        <p className={styles.progress}>{messages.journey.progress({ scanned, total: ordered.length })}</p>
      </div>
      <ol className={styles.list}>
        {ordered.map((checkpoint, index) => {
          const visit = visitOf.get(checkpoint.checkpointId);
          const name = <span className={styles.name}>{checkpoint.checkpointName[language]}</span>;
          return (
            <li className={styles.item} key={checkpoint.checkpointId} data-checkpoint={checkpoint.checkpointId}>
              <span className={styles.number} aria-hidden="true">
                {index + 1}
              </span>
              {visit ? (
                <button type="button" className={styles.open} onClick={() => onOpen(visit)}>
                  {name}
                  <span className={styles.status}>
                    <span className={styles.scanned}>{messages.trip.scanned}</span>
                    <span className={styles.time}>{clockTime(visit.checkedInAt)}</span>
                  </span>
                </button>
              ) : (
                <div className={styles.pending}>
                  {name}
                  <span className={styles.notScanned}>{messages.journey.notScanned}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
