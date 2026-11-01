// Bước 4 "Điểm dừng" (tasks T112; BR-M03-T01–T03, T09; research R-21): thêm/bỏ, sắp xếp bằng kéo-thả HTML5
// và nút lên/xuống dùng được bằng bàn phím. Vị trí trong danh sách là `sequence` của điểm dừng trong tuyến.
// Điểm dừng không hoạt động giữ vị trí và được đánh dấu, nhưng không vào hành trình.
import { useState } from 'react';
import { Button } from '../../../../shared/ui/Button';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { FIELD_LABELS } from '../../messages/fieldLabels';
import type { ListedCheckpoint } from '../routeForm';
import { CheckpointPicker } from './CheckpointPicker';
import type { StepProps, UploadProps } from './shared';
import styles from './steps.module.css';

export type CheckpointsStepProps = StepProps &
  UploadProps & {
    /** Mở SCR-M03-008 để tạo điểm dừng mới; editor giữ lại state form để quay lại */
    onCreateCheckpoint: () => void;
  };

function move<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

export function CheckpointsStep({ form, update, errorFor, readOnly, api, routeId, onCreateCheckpoint }: CheckpointsStepProps) {
  const [dragging, setDragging] = useState<number | null>(null);
  const list = form.checkpoints;
  const setList = (checkpoints: ListedCheckpoint[]) => update((current) => ({ ...current, checkpoints }));
  const error = errorFor('checkpointList');

  return (
    <>
      <div className={styles.group} data-field-key="checkpointList" tabIndex={-1}>
        <p className={styles.groupLabel}>{FIELD_LABELS.ROUTE.checkpointList}</p>
        {error ? <p className={styles.error}>Lỗi: {error}</p> : null}
        {list.length === 0 ? <p className={styles.derived}>Chưa có điểm dừng nào trong tuyến.</p> : null}
        <ol className={styles.order} aria-label="Điểm dừng của tuyến">
          {list.map((checkpoint, index) => (
            <li
              key={checkpoint.checkpointId}
              className={styles.stop}
              data-name={checkpoint.name}
              data-dragging={dragging === index ? 'true' : undefined}
              draggable={!readOnly}
              onDragStart={(event) => {
                setDragging(index);
                event.dataTransfer?.setData('text/plain', checkpoint.checkpointId);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (dragging !== null && dragging !== index) setList(move(list, dragging, index));
                setDragging(null);
              }}
              onDragEnd={() => setDragging(null)}
            >
              <span className={styles.stopName}>{checkpoint.name}</span>
              {checkpoint.connectivityMode ? (
                <span className={styles.stopMeta}>{DISPLAY_NAMES.connectivityMode[checkpoint.connectivityMode]}</span>
              ) : null}
              {checkpoint.status !== 'HOAT_DONG' ? (
                <span className={styles.inactive}>{DISPLAY_NAMES.checkpointStatus[checkpoint.status]}</span>
              ) : null}
              {readOnly ? null : (
                <span className={styles.stopActions}>
                  <Button aria-label={`Đưa "${checkpoint.name}" lên`} disabled={index === 0} onClick={() => setList(move(list, index, index - 1))}>
                    Lên
                  </Button>
                  <Button
                    aria-label={`Đưa "${checkpoint.name}" xuống`}
                    disabled={index === list.length - 1}
                    onClick={() => setList(move(list, index, index + 1))}
                  >
                    Xuống
                  </Button>
                  <Button aria-label={`Bỏ "${checkpoint.name}"`} onClick={() => setList(list.filter((_, i) => i !== index))}>
                    Bỏ
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {readOnly ? null : (
        <>
          <div>
            <Button onClick={onCreateCheckpoint}>Tạo điểm dừng mới</Button>
          </div>
          <CheckpointPicker
            api={api}
            routeId={routeId}
            chosenIds={list.map((checkpoint) => checkpoint.checkpointId)}
            onAdd={(row) =>
              setList([...list, { checkpointId: row.checkpointId, name: row.name, status: 'HOAT_DONG', connectivityMode: row.connectivityMode }])
            }
          />
        </>
      )}
    </>
  );
}
