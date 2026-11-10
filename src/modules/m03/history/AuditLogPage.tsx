// SCR-M03-009 Nhật ký hệ thống (tasks T151; Q-11; BR-M03-F08, F09, A03, L10, L11): chỉ Quản lý (route bọc
// RequireReviewer; server cũng từ chối). Chỉ đọc. Lọc theo khoảng ngày (dd/mm/yyyy, giờ Việt Nam), người thực hiện
// và loại mục; mỗi dòng: lúc nào, ai, mục nào, thao tác, kết quả, lý do, trước/sau, dấu "tự xuất bản".
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import type { AuditLogFilter, AuditLogPage as AuditLogPageData, AuditRow, SubjectType } from '../contracts/adminDtos';
import layout from '../editor/EditorLayout.module.css';
import { formatMessage } from '../messages/catalog';
import { formatDate, formatTime, parseDisplayDate, vietnamDayStartUtc } from '../messages/format';
import { ADMIN_PATHS } from '../paths';
import { AuditDetail, DetailDialog, detailLines } from './AuditDetail';
import { actionName, resultName, subjectLabel, SUBJECT_TYPE_NAMES } from './auditFormat';
import styles from './AuditLogPage.module.css';

type SubjectFilter = SubjectType | 'ALL';

const SUBJECT_OPTIONS: { value: SubjectFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  ...(['ROUTE', 'CHECKPOINT', 'QRCODE'] as const).map((value) => ({ value, label: SUBJECT_TYPE_NAMES[value] })),
];

/** Bộ lọc Q-11 từ ô nhập; ngày chưa gõ xong (sai dạng) thì chưa lọc theo ngày đó */
function toFilter(fromText: string, toText: string, actor: string, subject: SubjectFilter, page: number): AuditLogFilter {
  const from = parseDisplayDate(fromText);
  const to = parseDisplayDate(toText);
  return {
    page,
    ...(from ? { from: vietnamDayStartUtc(from) } : {}),
    // Đến hết ngày "Đến ngày": mốc là 00:00 của ngày hôm sau
    ...(to ? { to: vietnamDayStartUtc(to, 1) } : {}),
    ...(actor.trim() ? { actorEmail: actor.trim() } : {}),
    ...(subject === 'ALL' ? {} : { subjectType: subject }),
  };
}

export function AuditLogPage() {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [actor, setActor] = useState('');
  const [subject, setSubject] = useState<SubjectFilter>('ALL');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<AuditLogPageData | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [opened, setOpened] = useState<AuditRow | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.listAuditLog(toFilter(fromText, toText, actor, subject, page)));
      setError(null);
    } catch (caught) {
      const apiError = AdminApiError.from(caught);
      if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire();
      else setError(apiError);
    }
  }, [api, expire, fromText, toText, actor, subject, page]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Đổi bộ lọc thì về trang đầu */
  const filterChange =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(0);
    };

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <h1 className={layout.title}>Nhật ký hệ thống</h1>
        <div className={layout.headingActions}>
          <Button onClick={() => void navigate(ADMIN_PATHS.routes)}>Quay lại</Button>
        </div>
      </div>

      <div className={styles.filters} role="search">
        <TextField label="Từ ngày" value={fromText} onChange={filterChange(setFromText)} placeholder="dd/mm/yyyy" />
        <TextField label="Đến ngày" value={toText} onChange={filterChange(setToText)} placeholder="dd/mm/yyyy" />
        <TextField label="Người thực hiện" type="search" value={actor} onChange={filterChange(setActor)} />
        <Select label="Loại mục" value={subject} options={SUBJECT_OPTIONS} onChange={filterChange(setSubject)} />
      </div>

      {error ? <Banner tone="error">{formatMessage(error.messageKey)}</Banner> : null}
      {data && data.rows.length === 0 ? <p className={layout.empty}>Không có dòng nhật ký nào khớp.</p> : null}
      {data && data.rows.length > 0 ? (
        <div className={layout.tableWrap}>
          <table className={`${layout.table} ${styles.auditTable}`} aria-label="Nhật ký">
            {/* Năm cột đầu rộng bằng nhau, "Chi tiết" lấy phần còn lại */}
            <colgroup>
              <col className={styles.colShort} />
              <col className={styles.colShort} />
              <col className={styles.colShort} />
              <col className={styles.colShort} />
              <col className={styles.colShort} />
              <col className={styles.colDetail} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Thời gian</th>
                <th scope="col">Người thực hiện</th>
                <th scope="col">Mục</th>
                <th scope="col">Thao tác</th>
                <th scope="col">Kết quả</th>
                <th scope="col">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.auditId}>
                  <td className={styles.nowrap}>
                    {formatDate(row.occurredAt)} {formatTime(row.occurredAt)}
                  </td>
                  <td className={styles.wrap}>{row.actorEmail}</td>
                  <td className={styles.wrap}>{subjectLabel(row)}</td>
                  <td>
                    {actionName(row.action)}
                    {row.selfPublished ? <span className={styles.badge}>Tự xuất bản</span> : null}
                  </td>
                  <td className={row.result === 'SUCCESS' ? layout.ready : styles.failure}>{resultName(row.result)}</td>
                  <td className={styles.wrap}>
                    <AuditDetail lines={detailLines(row)} onOpen={() => setOpened(row)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {opened ? (
        <DetailDialog
          title={`${actionName(opened.action)} – ${subjectLabel(opened)}`}
          meta={
            <>
              <span>
                {formatDate(opened.occurredAt)} {formatTime(opened.occurredAt)}
              </span>
              <span>{opened.actorEmail}</span>
              <span className={opened.result === 'SUCCESS' ? layout.ready : styles.failure}>{resultName(opened.result)}</span>
              {opened.selfPublished ? <span className={styles.badge}>Tự xuất bản</span> : null}
            </>
          }
          lines={detailLines(opened)}
          onClose={() => setOpened(null)}
        />
      ) : null}

      {data && (page > 0 || data.hasMore) ? (
        <div className={styles.pager}>
          <Button disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
            Trang trước
          </Button>
          <Button disabled={!data.hasMore} onClick={() => setPage((current) => current + 1)}>
            Trang sau
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default AuditLogPage;
