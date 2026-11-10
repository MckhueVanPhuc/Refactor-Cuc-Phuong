// Panel lịch sử của tuyến, điểm dừng hoặc điểm tham quan (tasks T150; Q-10; BR-M03-F09, F07, L10, L11;
// SCR-M03-002 E-31/32, SCR-M03-003 E-26/27, SCR-M03-008 E-21/22): các bản đã xuất bản, khôi phục bản cũ, và nhật ký
// của mục. Mọi chữ qua tên hiển thị; trước/sau là các dòng "{nhãn}: {trước} → {sau}".
import { useEffect, useId, useState } from 'react';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import type { AuditRow, ItemHistory, SubjectType } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import layout from '../editor/EditorLayout.module.css';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { formatDate, formatTime } from '../messages/format';
import { AuditDetail, DetailDialog, detailLines } from './AuditDetail';
import { actionName, resultName } from './auditFormat';
import { RestoreButton } from './RestoreButton';
import styles from './ItemHistoryPanel.module.css';

export type ItemHistoryPanelProps = {
  subjectType: SubjectType;
  subjectId: string;
  /** Đổi khi mục vừa được lưu, xuất bản, khôi phục hay bỏ thay đổi: panel nạp lại */
  version: string;
  /** Khôi phục bị tắt khi form còn thay đổi chưa lưu (khôi phục sẽ thay nội dung form) hoặc mục đã lưu trữ */
  restoreDisabled: boolean;
  onRestoreResult: (result: CommandResult<unknown>) => void;
  onTransportError: (error: unknown) => void;
};

const when = (value: string) => `${formatDate(value)} ${formatTime(value)}`;

export function ItemHistoryPanel({ subjectType, subjectId, version, restoreDisabled, onRestoreResult, onTransportError }: ItemHistoryPanelProps) {
  const api = useAdminApi();
  const [history, setHistory] = useState<ItemHistory | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [opened, setOpened] = useState<AuditRow | null>(null);
  const publishedTitleId = useId();
  const auditTitleId = useId();

  useEffect(() => {
    let cancelled = false;
    api.getItemHistory({ subjectType, subjectId }).then(
      (loaded) => {
        if (!cancelled) {
          setHistory(loaded);
          setError(null);
        }
      },
      (caught: unknown) => {
        if (!cancelled) setError(AdminApiError.from(caught));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, subjectType, subjectId, version]);

  if (error) return <p className={layout.note}>{formatMessage(error.messageKey)}</p>;
  if (!history) return null;

  return (
    <>
      <section className={layout.section} aria-labelledby={publishedTitleId}>
        <h2 id={publishedTitleId} className={layout.sectionTitle}>
          Lịch sử xuất bản
        </h2>
        {history.publishedRevisions.length === 0 ? (
          <p className={layout.note}>Chưa có bản nào được xuất bản.</p>
        ) : (
          <ul className={styles.entries}>
            {history.publishedRevisions.map((rev) => (
              <li key={rev.revisionNumber} className={styles.entry}>
                <p className={styles.headline}>
                  <span className={styles.number}>Bản {rev.revisionNumber}</span>{' '}
                  <span>{DISPLAY_NAMES.revisionStatus[rev.status]}</span>
                </p>
                {rev.publishedAt ? (
                  <p className={styles.meta}>
                    {when(rev.publishedAt)}, {rev.publishedByEmail}
                    {rev.selfPublished ? <span className={styles.badge}>Tự xuất bản</span> : null}
                  </p>
                ) : null}
                {rev.status === 'LUU_TRU' ? (
                  <RestoreButton
                    subjectType={subjectType}
                    subjectId={subjectId}
                    revisionNumber={rev.revisionNumber}
                    disabled={restoreDisabled}
                    onResult={onRestoreResult}
                    onTransportError={onTransportError}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={layout.section} aria-labelledby={auditTitleId}>
        <h2 id={auditTitleId} className={layout.sectionTitle}>
          Nhật ký của mục
        </h2>
        {history.auditRows.length === 0 ? (
          <p className={layout.note}>Chưa có thao tác nào.</p>
        ) : (
          <ul className={styles.entries}>
            {history.auditRows.map((row) => (
              <li key={row.auditId} className={styles.entry}>
                <p className={styles.headline}>
                  <strong>{actionName(row.action)}</strong>{' '}
                  <span className={row.result === 'SUCCESS' ? layout.ready : styles.failure}>{resultName(row.result)}</span>
                  {row.selfPublished ? <span className={styles.badge}>Tự xuất bản</span> : null}
                </p>
                <p className={styles.meta}>
                  {when(row.occurredAt)}, {row.actorEmail}
                </p>
                <div className={styles.detail}>
                  <AuditDetail lines={detailLines(row)} onOpen={() => setOpened(row)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {opened ? (
        <DetailDialog
          title={actionName(opened.action)}
          meta={
            <>
              <span>{when(opened.occurredAt)}</span>
              <span>{opened.actorEmail}</span>
              <span className={opened.result === 'SUCCESS' ? layout.ready : styles.failure}>{resultName(opened.result)}</span>
              {opened.selfPublished ? <span className={styles.badge}>Tự xuất bản</span> : null}
            </>
          }
          lines={detailLines(opened)}
          onClose={() => setOpened(null)}
        />
      ) : null}
    </>
  );
}
