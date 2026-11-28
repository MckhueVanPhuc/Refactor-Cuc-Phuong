// Vùng trạng thái gói của SCR-M01-003 (E-SCR-M01-003-16, 18, 21, 22; tasks T086): bản đang dùng tách khỏi candidate;
// Tải về / Tải lại / Cập nhật; không có Hủy khi đang tải; khi gói sẵn sàng hiện dòng hướng dẫn quét (US-M01-03 mục 5).
// Phương án B1 (chủ dự án 2026-11-29): chưa có gói thì giải thích tuyến đi qua nơi không có sóng và nêu các điểm đó,
// không còn chip "Chưa tải"; nút tải căn giữa, rộng hết ô, kèm dung lượng ước tính khi có.
import { useId } from 'react';
import { useM01Messages } from '../i18n/useM01Messages';
import { PackageProgress } from '../offline-package/PackageProgress';
import type { PackageOpResult } from '../offline-package/packageOps';
import { activeStatusOf, candidateStatusOf, statusLabel } from '../offline-package/packageStatus';
import { MascotFigure, MascotSlot } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import styles from './PackagePanel.module.css';
import type { PackageEntry } from '../storage/readers';

/** Điểm không có sóng và dung lượng ước tính, đọc từ JourneySnapshot đang hoạt động; vắng khi chưa đọc được (mất mạng). */
export type OfflineHint = { names: readonly string[]; sizeMb: string | undefined };

export function PackagePanel({
  entry,
  lastResult,
  onDownload,
  offlineHint,
}: {
  entry: PackageEntry | undefined;
  lastResult: PackageOpResult | undefined;
  onDownload: () => void;
  offlineHint?: OfflineHint | undefined;
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
          ? offlineHint?.sizeMb
            ? messages.routeDetail.downloadWithSize({ n: offlineHint.sizeMb })
            : messages.routeDetail.download
          : undefined;
  // Chưa có bản dùng được và không đang tải: nói rõ vì sao cần tải (B1)
  const explain = !active && !busy;
  const noSignal = messages.routeDetail.noSignal;
  const names = offlineHint?.names ?? [];

  return (
    <section className={styles.row} aria-labelledby={titleId}>
      <h2 className={styles.name} id={titleId}>
        <TintIcon name="map-download" className={styles.titleIcon} />
        {messages.offline.panelTitle}
      </h2>
      <p className={styles.chips}>
        {active && <span className={styles.chip}>{statusLabel(active, messages)}</span>}
        {candidate && (!active || busy) && (
          <span className={styles.chip} aria-busy={busy}>
            {statusLabel(candidate, messages)}
          </span>
        )}
      </p>
      {explain && (
        <div className={styles.explain}>
          <p className={styles.explainText}>
            {noSignal.before}
            <strong className={styles.strong}>{noSignal.strong}</strong>
            {names.length > 0 ? noSignal.afterList : noSignal.afterNoList}
          </p>
          {names.length > 0 && (
            <ul className={styles.places}>
              {names.map((name) => (
                <li className={styles.place} key={name}>
                  <TintIcon name="no-signal" className={styles.placeIcon} />
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <PackageProgress busy={busy} ready={ready} label={messages.offline.status.downloading} />
      {/* Mila nói về lần tải (MAS-B-020, 021, 026) trong panel gói (spec-Mascot §5.1) */}
      <MascotSlot id="package-panel" modes={['AVATAR']} />
      {active === 'readyOutdated' && <p className={styles.note}>{messages.routeDetail.outdated}</p>}
      {/* Lỗi gói: Mila minh họa cạnh câu cố định (MAS-B-022, 024, 025; chỉ hình từ v1.2) */}
      {!active && candidate === 'incomplete' && failure !== 'storage' && (
        <div className={styles.withMila}>
          <MascotFigure pose="confused" size="sm" />
          <p className={styles.error} role="alert">
            {messages.routeDetail.incomplete}
          </p>
        </div>
      )}
      {failure === 'storage' && (
        <div className={styles.withMila}>
          <MascotFigure pose="confused" size="sm" />
          <p className={styles.error} role="alert">
            {messages.offline.storageError}
          </p>
        </div>
      )}
      {failure && failure !== 'storage' && ready && (
        <div className={styles.withMila}>
          <MascotFigure pose="confused" size="sm" />
          <p className={styles.error} role="alert">
            {messages.offline.updateFailed}
          </p>
        </div>
      )}
      {ready && <p className={styles.meta}>{messages.routeDetail.scanHint}</p>}
      {action && (
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={onDownload}>
            <TintIcon name="download" />
            {action}
          </button>
        </div>
      )}
    </section>
  );
}
