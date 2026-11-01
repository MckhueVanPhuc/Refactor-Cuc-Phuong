// SCR-M03-001 Quản trị tuyến (tasks T107; Q-02, C-07): tìm/lọc, tên vi (bản nháp nếu có), trạng thái, dấu
// "có bản nháp chờ", lần sửa cuối; Hủy tuyến chưa từng xuất bản. Đóng tạm / Mở lại / Lưu trữ gắn ở US6 (T140).
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import type { RouteListRow, RouteStatus } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { CommandOutcome } from '../editor/CommandOutcome';
import layout from '../editor/EditorLayout.module.css';
import { ReasonDialog } from '../editor/ReasonDialog';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { formatDate, formatTime } from '../messages/format';
import { ADMIN_PATHS } from '../paths';
import styles from './RouteListPage.module.css';

type StatusFilter = RouteStatus | 'ALL';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  ...(Object.entries(DISPLAY_NAMES.routeStatus) as [RouteStatus, string][]).map(([value, label]) => ({ value, label })),
];

export function RouteListPage() {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [rows, setRows] = useState<RouteListRow[] | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [discarding, setDiscarding] = useState<RouteListRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<CommandResult<unknown> | null>(null);

  const handleTransport = useCallback(
    (caught: unknown) => {
      const apiError = AdminApiError.from(caught);
      if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire();
      else setError(apiError);
    },
    [expire],
  );

  const load = useCallback(async () => {
    try {
      setRows(await api.listRoutes({ search, ...(status === 'ALL' ? {} : { status }) }));
      setError(null);
    } catch (caught) {
      handleTransport(caught);
    }
  }, [api, handleTransport, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function discard(reason: string | undefined) {
    if (!discarding) return;
    setBusy(true);
    setOutcome(null);
    try {
      // Cần concurrencyRevision mới nhất của tuyến
      const editor = await api.getRouteEditor(discarding.routeId);
      const result = await api.discardUnpublished({
        subjectType: 'ROUTE',
        subjectId: discarding.routeId,
        ...(reason ? { reason } : {}),
        expected: { entity: editor.concurrencyRevision },
      });
      if (!result.ok) setOutcome(result);
      await load();
    } catch (caught) {
      handleTransport(caught);
    } finally {
      setDiscarding(null);
      setBusy(false);
    }
  }

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <h1 className={layout.title}>Quản trị tuyến</h1>
        <Button variant="primary" onClick={() => void navigate(ADMIN_PATHS.newRoute)}>
          Tạo tuyến
        </Button>
      </div>

      <div className={styles.filters} role="search">
        <TextField label="Tìm theo tên" type="search" value={search} onChange={setSearch} />
        <Select label="Trạng thái" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
      </div>

      {error ? <Banner tone="error">{formatMessage(error.messageKey)}</Banner> : null}
      <CommandOutcome result={outcome} onReload={() => void load()} />
      {rows && rows.length === 0 ? (
        <p className={layout.empty}>
          {search || status !== 'ALL' ? 'Không có tuyến nào khớp.' : 'Chưa có tuyến nào. Bấm "Tạo tuyến" để bắt đầu.'}
        </p>
      ) : null}
      {rows && rows.length > 0 ? (
        <div className={layout.tableWrap}>
          <table className={layout.table} aria-label="Tuyến">
            <thead>
              <tr>
                <th scope="col">Tên</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Sửa lần cuối</th>
                <th scope="col">
                  <span className="visually-hidden">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.routeId}>
                  <td>
                    <Link className={layout.rowLink} to={ADMIN_PATHS.route(row.routeId)}>
                      {row.name ?? 'Tuyến chưa đặt tên'}
                    </Link>
                    {row.hasPendingDraft ? <span className={styles.pending}>Có bản nháp chờ</span> : null}
                  </td>
                  <td>
                    <span className={`${layout.status} ${layout[row.status]}`}>{DISPLAY_NAMES.routeStatus[row.status]}</span>
                  </td>
                  <td>
                    {formatDate(row.lastEditedAt)} {formatTime(row.lastEditedAt)} — {row.lastEditedByEmail}
                  </td>
                  <td>
                    {row.status === 'NHAP' ? (
                      <Button onClick={() => setDiscarding(row)} disabled={busy}>
                        Hủy
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ReasonDialog
        open={discarding !== null}
        title={formatMessage('MSG-CONFIRM-DISCARD-ROUTE', { tên: discarding?.name ?? 'Tuyến chưa đặt tên' })}
        safeLabel="Không hủy"
        confirmLabel="Hủy tuyến"
        reasonRequired
        busy={busy}
        onCancel={() => setDiscarding(null)}
        onConfirm={(reason) => void discard(reason)}
      />
    </div>
  );
}

export default RouteListPage;
