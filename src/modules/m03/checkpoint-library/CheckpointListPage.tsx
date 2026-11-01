// SCR-M03-008 Thư viện điểm dừng — danh sách (tasks T087, T140; Q-05; SF-M03-002-11).
// Đóng tạm (C-10), Mở lại (C-13, Quản lý), Lưu trữ (C-15, Quản lý) trên từng dòng.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import type { CheckpointListRow, CheckpointStatus } from '../contracts/adminDtos';
import layout from '../editor/EditorLayout.module.css';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES, readinessLabel } from '../messages/displayNames';
import { OperationActions, OperationDialogs, useOperationLauncher } from '../operations/OperationLauncher';
import { ADMIN_PATHS } from '../paths';
import styles from './CheckpointListPage.module.css';

type StatusFilter = CheckpointStatus | 'ALL';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  ...(Object.entries(DISPLAY_NAMES.checkpointStatus) as [CheckpointStatus, string][]).map(([value, label]) => ({ value, label })),
];

export function CheckpointListPage() {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [rows, setRows] = useState<CheckpointListRow[] | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const operations = useOperationLauncher();

  const load = useCallback(async () => {
    try {
      setRows(await api.listCheckpoints({ search, ...(status === 'ALL' ? {} : { status }) }));
      setError(null);
    } catch (caught) {
      const apiError = AdminApiError.from(caught);
      if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire();
      else setError(apiError);
    }
  }, [api, expire, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <h1 className={layout.title}>Thư viện điểm dừng</h1>
        <Button variant="primary" onClick={() => void navigate(ADMIN_PATHS.newCheckpoint)}>
          Tạo điểm dừng
        </Button>
      </div>

      <div className={styles.filters} role="search">
        <TextField label="Tìm theo tên" type="search" value={search} onChange={setSearch} />
        <Select label="Trạng thái" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
      </div>

      {error ? <Banner tone="error">{formatMessage(error.messageKey)}</Banner> : null}
      <OperationDialogs launcher={operations} onChanged={() => void load()} />
      {rows && rows.length === 0 ? (
        <p className={layout.empty}>
          {search || status !== 'ALL' ? 'Không có điểm dừng nào khớp.' : 'Chưa có điểm dừng nào. Bấm "Tạo điểm dừng" để bắt đầu.'}
        </p>
      ) : null}
      {rows && rows.length > 0 ? (
        <div className={layout.tableWrap}>
          <table className={layout.table} aria-label="Điểm dừng">
            <thead>
              <tr>
                <th scope="col">Tên</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Loại kết nối</th>
                <th scope="col">Điểm tham quan</th>
                <th scope="col">Tuyến đang dùng</th>
                <th scope="col">Sẵn sàng</th>
                <th scope="col">
                  <span className="visually-hidden">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.checkpointId}>
                  <td>
                    <Link className={layout.rowLink} to={ADMIN_PATHS.checkpoint(row.checkpointId)}>
                      {row.name ?? 'Điểm dừng chưa đặt tên'}
                    </Link>
                    {row.hasPendingDraft ? <span className={styles.pending}>Có bản nháp chờ</span> : null}
                  </td>
                  <td>
                    <span className={`${layout.status} ${layout[row.status]}`}>{DISPLAY_NAMES.checkpointStatus[row.status]}</span>
                  </td>
                  <td>{row.connectivityMode ? DISPLAY_NAMES.connectivityMode[row.connectivityMode] : 'Chưa chọn'}</td>
                  <td>{row.visitPointCount}</td>
                  <td>{row.routesUsing.length > 0 ? row.routesUsing.map((route) => route.routeName).join(', ') : 'Chưa có'}</td>
                  <td className={row.readiness.ready ? layout.ready : layout.notReady}>{readinessLabel(row.readiness.missing)}</td>
                  <td>
                    <div className={layout.rowActions}>
                      <OperationActions
                        status={row.status}
                        subject={{ type: 'CHECKPOINT', id: row.checkpointId, name: row.name ?? 'Điểm dừng chưa đặt tên' }}
                        launcher={operations}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default CheckpointListPage;
