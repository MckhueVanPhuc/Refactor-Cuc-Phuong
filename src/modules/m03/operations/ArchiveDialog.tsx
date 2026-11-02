// Lưu trữ tuyến (C-14) hoặc điểm dừng (C-15) (tasks T139; BR-M03-H09, T07, D10): chỉ Quản lý, chỉ khi Tạm đóng,
// lý do bắt buộc, không thể hoàn tác. Điểm dừng còn được tuyến dùng → MSG-CHECKPOINT-IN-USE (server trả khi gửi).
import { useAdminApi } from '../api/AdminApiProvider';
import { confirmation } from '../editor/confirmations';
import type { OperationDialogBaseProps } from './CloseDialog';
import { useExpectedRevision } from './latestRevision';
import { OperationDialog } from './OperationDialog';

export function ArchiveDialog({ open, subject, onClose, onChanged }: OperationDialogBaseProps) {
  const api = useAdminApi();
  const isCheckpoint = subject.type === 'CHECKPOINT';
  const revision = useExpectedRevision(open, subject);
  return (
    <OperationDialog
      open={open}
      confirmation={confirmation(isCheckpoint ? 'ARCHIVE_CHECKPOINT' : 'ARCHIVE_ROUTE', { tên: subject.name })}
      noteLabel="Lý do"
      loadError={revision.error}
      ready={revision.expected !== null}
      run={(reason) => {
        const expected = revision.expected!;
        return isCheckpoint
          ? api.archiveCheckpoint({ checkpointId: subject.id, reason, expected })
          : api.archiveRoute({ routeId: subject.id, reason, expected });
      }}
      onClose={onClose}
      onSucceeded={onChanged}
    />
  );
}
