// Danh sách điểm dừng chọn được cho tuyến (Q-04; BR-M03-T01): chỉ điểm dừng đang hoạt động, kèm tên, mode,
// số điểm tham quan và các tuyến khác đang liệt kê.
import { useEffect, useState } from 'react';
import { Button } from '../../../../shared/ui/Button';
import { TextField } from '../../../../shared/ui/TextField';
import type { AdminApi } from '../../api/AdminApi';
import { ROUTE_CHECKPOINTS_MAX_ITEMS } from '../../config/limits';
import type { SelectableCheckpoint } from '../../contracts/adminDtos';
import layout from '../../editor/EditorLayout.module.css';
import { formatMessage } from '../../messages/catalog';
import { DISPLAY_NAMES } from '../../messages/displayNames';

export type CheckpointPickerProps = {
  api: AdminApi;
  routeId: string | undefined;
  chosenIds: readonly string[];
  onAdd: (checkpoint: SelectableCheckpoint) => void;
};

export function CheckpointPicker({ api, routeId, chosenIds, onAdd }: CheckpointPickerProps) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<SelectableCheckpoint[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.listSelectableCheckpoints(search).then(
      (result) => {
        if (cancelled) return;
        setRows(result);
        setFailed(false);
      },
      () => !cancelled && setFailed(true),
    );
    return () => {
      cancelled = true;
    };
  }, [api, search]);

  const full = chosenIds.length >= ROUTE_CHECKPOINTS_MAX_ITEMS;
  return (
    <div className={layout.section}>
      <TextField label="Tìm điểm dừng" type="search" value={search} onChange={setSearch} />
      {failed ? <p className={layout.note}>{formatMessage('MSG-GENERIC')}</p> : null}
      {rows && rows.length === 0 ? <p className={layout.empty}>Không có điểm dừng đang hoạt động nào khớp.</p> : null}
      {rows && rows.length > 0 ? (
        <div className={layout.tableWrap}>
          <table className={layout.table} aria-label="Điểm dừng chọn được">
            <thead>
              <tr>
                <th scope="col">Tên</th>
                <th scope="col">Loại kết nối</th>
                <th scope="col">Điểm tham quan</th>
                <th scope="col">Tuyến khác đang dùng</th>
                <th scope="col">
                  <span className="visually-hidden">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const others = row.otherRoutes.filter((route) => route.routeId !== routeId);
                return (
                  <tr key={row.checkpointId}>
                    <td>{row.name}</td>
                    <td>{DISPLAY_NAMES.connectivityMode[row.connectivityMode]}</td>
                    <td>{row.visitPointCount}</td>
                    <td>{others.length > 0 ? others.map((route) => route.routeName).join(', ') : 'Chưa có'}</td>
                    <td>
                      <Button disabled={full || chosenIds.includes(row.checkpointId)} onClick={() => onAdd(row)}>
                        Thêm
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
