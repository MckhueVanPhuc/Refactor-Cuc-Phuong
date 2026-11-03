// Vùng trạng thái gói của SCR-M01-003 (E-SCR-M01-003-16, 18, 21, 22; tasks T086): bản đang dùng tách khỏi candidate;
// Tải về / Tải lại / Cập nhật; không có Hủy khi đang tải; khi gói sẵn sàng hiện dòng hướng dẫn quét (US-M01-03 mục 5).
import { useId } from 'react';
import { useM01Messages } from '../i18n/useM01Messages';
import type { PackageOpResult } from '../offline-package/packageOps';
import { activeStatusOf, candidateStatusOf, statusLabel } from '../offline-package/packageStatus';
import styles from '../offline-package/OfflinePage.module.css';
import type { PackageEntry } from '../storage/readers';

export function PackagePanel({
  entry,
  lastResult,
  onDownload,
}: {
  entry: PackageEntry | undefined;
  lastResult: PackageOpResult | undefined;
  onDownload: () => void;
}) {
  const messages = useM01Messages();
  const titleId = useId();
  const active = activeStatusOf(entry);
  const candidate = candidateStatusOf(entry);
  const busy = candidate === 'downloading';
  const failure = lastResult?.kind === 'failed' ? lastResult.reason : undefined;
  const ready = active === 'readyCurrent' || active === 'readyOutdated';

  const action = busy
    ? undefined
    : active === 'readyOutdated'
      ? messages.offline.update
      : active === 'unreadable' || (!active && candidate === 'incomplete')
        ? messages.offline.downloadAgain
        : !active
          ? messages.routeDetail.download
          : undefined;

  return (
    <section className={styles.row} aria-labelledby={titleId}>
      <h2 className={styles.name} id={titleId}>
        {messages.offline.panelTitle}
      </h2>
      <p className={styles.chips}>
        {active && <span className={styles.chip}>{statusLabel(active, messages)}</span>}
        {candidate && (!active || busy) && (
          <span className={styles.chip} aria-busy={busy}>
            {statusLabel(candidate, messages)}
          </span>
        )}
        {!active && !candidate && <span className={styles.chip}>{messages.offline.status.notDownloaded}</span>}
      </p>
      {active === 'readyOutdated' && <p className={styles.note}>{messages.routeDetail.outdated}</p>}
      {!active && candidate === 'incomplete' && failure !== 'storage' && (
        <p className={styles.error} role="alert">
          {messages.routeDetail.incomplete}
        </p>
      )}
      {failure === 'storage' && (
        <p className={styles.error} role="alert">
          {messages.offline.storageError}
        </p>
      )}
      {failure && failure !== 'storage' && ready && (
        <p className={styles.error} role="alert">
          {messages.offline.updateFailed}
        </p>
      )}
      {ready && <p className={styles.meta}>{messages.routeDetail.scanHint}</p>}
      {action && (
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={onDownload}>
            {action}
          </button>
        </div>
      )}
    </section>
  );
}
