// SCR-M01-004 Quản lý tài nguyên offline (FR-M01-009; screen spec §3–§5; OQ-SCR-M01-004-002, 003). Liệt kê gói và
// thao tác gói đã có bản ghi; tải lần đầu nằm ở SCR-M01-003. Không có Cancel khi đang tải (spec-M01 §4.4).
import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import { Dialog } from '../../../shared/ui/Dialog';
import { useM01Services } from '../api/services';
import { catalogStoreFor } from '../catalog/catalogStore';
import { formatCapturedAt } from '../format';
import { useM01Messages } from '../i18n/useM01Messages';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import type { PackageEntry } from '../storage/readers';
import styles from './OfflinePage.module.css';
import type { PackageOpResult } from './packageOps';
import { activeStatusOf, candidateStatusOf, statusLabel, type ActiveStatus, type CandidateStatus } from './packageStatus';
import { packageOpsFor, usePackageEntries } from './usePackages';

const CHIP_CLASS: Record<ActiveStatus | CandidateStatus, string | undefined> = {
  readyCurrent: styles.chipReady,
  readyOutdated: styles.chipWarn,
  unreadable: styles.chipError,
  downloading: undefined,
  incomplete: styles.chipError,
};

function PackageRow({
  entry,
  lastResult,
  onDownload,
  onDelete,
}: {
  entry: PackageEntry;
  lastResult: PackageOpResult | undefined;
  onDownload: () => void;
  onDelete: (name: string) => void;
}) {
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const services = useM01Services();
  const active = activeStatusOf(entry);
  const candidate = candidateStatusOf(entry);
  const pkg = entry.active?.pkg ?? null;
  const catalog = catalogStoreFor(services.source).getSnapshot();
  const sourceName =
    catalog.status === 'ready' ? catalog.routes.find((route) => route.routeId === entry.routeId)?.name[language] : undefined;
  // OQ-SCR-M01-004-003: tên từ bản lưu, rồi từ dữ liệu tuyến; không có thì câu "không đọc được"
  const name = pkg?.routeEssentials.name[language] ?? sourceName ?? messages.offline.unreadable;
  const busy = candidate === 'downloading';
  const failure = lastResult?.kind === 'failed' ? lastResult.reason : undefined;

  return (
    <li className={styles.row}>
      <h2 className={styles.name}>{name}</h2>
      {entry.active && <p className={styles.meta}>{messages.offline.version({ n: entry.active.contentVersion })}</p>}
      <p className={styles.chips}>
        {active && (active !== 'unreadable' || name !== messages.offline.unreadable) && (
          <span className={`${styles.chip} ${CHIP_CLASS[active] ?? ''}`}>{statusLabel(active, messages)}</span>
        )}
        {candidate && (!active || candidate === 'downloading') && (
          <span className={`${styles.chip} ${CHIP_CLASS[candidate] ?? ''}`} aria-busy={busy}>
            {statusLabel(candidate, messages)}
          </span>
        )}
      </p>
      {pkg && (
        <p className={styles.meta}>
          {messages.offline.essentialsSavedAt({ time: formatCapturedAt(pkg.routeEssentials.capturedAt, language) })}
        </p>
      )}
      {pkg?.offlineRouteMap && <p className={styles.meta}>{messages.offline.hasOfflineRouteMap}</p>}
      {active === 'readyOutdated' && <p className={styles.note}>{messages.offline.outdatedWarning}</p>}
      {failure === 'storage' && (
        <p className={styles.error} role="alert">
          {messages.offline.storageError}
        </p>
      )}
      {failure && failure !== 'storage' && pkg && (
        <p className={styles.error} role="alert">
          {messages.offline.updateFailed}
        </p>
      )}
      <div className={styles.actions}>
        <Link className={styles.action} to={PATHS.routeDetail(entry.routeId)}>
          {messages.offline.view}
        </Link>
        {!busy && active === 'readyOutdated' && (
          <button type="button" className={styles.action} onClick={onDownload}>
            {messages.offline.update}
          </button>
        )}
        {!busy && (active === 'unreadable' || (!active && candidate === 'incomplete')) && (
          <button type="button" className={styles.action} onClick={onDownload}>
            {messages.offline.downloadAgain}
          </button>
        )}
        {!busy && (
          <button type="button" className={styles.action} onClick={() => onDelete(name)}>
            {messages.offline.delete}
          </button>
        )}
      </div>
    </li>
  );
}

export function OfflinePage() {
  const messages = useM01Messages();
  const services = useM01Services();
  const entries = usePackageEntries();
  const [results, setResults] = useState<Record<string, PackageOpResult>>({});
  const [pendingDelete, setPendingDelete] = useState<{ routeId: string; name: string } | null>(null);
  const ops = packageOpsFor(services);

  async function run(routeId: string, op: () => Promise<PackageOpResult>) {
    const result = await op();
    setResults((previous) => ({ ...previous, [routeId]: result }));
  }

  const anyReady = entries?.some((entry) => entry.active?.pkg) ?? false;

  return (
    <>
      <h1 className={styles.title}>{messages.screenTitle.offline}</h1>
      {anyReady && <p className={styles.hint}>{messages.routeDetail.scanHint}</p>}
      {entries?.length === 0 && <p className={styles.empty}>{messages.offline.empty}</p>}
      {entries && entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((entry) => (
            <PackageRow
              key={entry.routeId}
              entry={entry}
              lastResult={results[entry.routeId]}
              onDownload={() => void run(entry.routeId, () => ops.download(entry.routeId))}
              onDelete={(name) => setPendingDelete({ routeId: entry.routeId, name })}
            />
          ))}
        </ul>
      )}
      <Dialog
        open={pendingDelete !== null}
        title={pendingDelete ? messages.offline.deleteConfirm({ name: pendingDelete.name }) : ''}
        safeLabel={messages.offline.deleteKeepAction}
        confirmLabel={messages.offline.deleteConfirmAction}
        onSafe={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target) void run(target.routeId, () => ops.remove(target.routeId));
        }}
      />
    </>
  );
}
