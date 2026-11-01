// Mở lại tuyến (C-12) hoặc điểm dừng (C-13) (tasks T138; BR-M03-H06, H07, A03): chỉ Quản lý, ghi chú xác nhận an
// toàn bắt buộc. Kết quả kiểm tra kỹ thuật (Q-09) không đạt → MSG-REOPEN-BLOCKED kèm danh sách và không gửi được;
// vượt trần (MSG-OFFLINE-TOO-BIG) do server trả khi gửi.
import { useAdminApi } from '../api/AdminApiProvider';
import { confirmation } from '../editor/confirmations';
import { formatMessage } from '../messages/catalog';
import type { OperationDialogBaseProps } from './CloseDialog';
import { useExpectedRevision } from './latestRevision';
import { OperationDialog } from './OperationDialog';
import { useOperationImpact } from './useOperationImpact';

export function ReopenDialog({ open, subject, onClose, onChanged }: OperationDialogBaseProps) {
  const api = useAdminApi();
  const isCheckpoint = subject.type === 'CHECKPOINT';
  const revision = useExpectedRevision(open, subject);
  const { impact, error } = useOperationImpact(
    open ? { operation: isCheckpoint ? 'REOPEN_CHECKPOINT' : 'REOPEN_ROUTE', subjectId: subject.id } : null,
  );

  const title = !impact
    ? null
    : isCheckpoint
      ? confirmation('REOPEN_CHECKPOINT', {
          tên: subject.name,
          'danh sách': impact.affectedRoutes.map((route) => route.routeName).join(', '),
        })
      : confirmation('REOPEN_ROUTE', { tên: subject.name });
  const blocked =
    impact && impact.reopenBlockers.length > 0 ? formatMessage('MSG-REOPEN-BLOCKED', { 'danh sách': impact.reopenBlockers.join(' ') }) : undefined;

  return (
    <OperationDialog
      open={open}
      confirmation={title}
      blocked={blocked}
      noteLabel="Ghi chú xác nhận an toàn"
      loadError={error ?? revision.error}
      ready={revision.expected !== null}
      run={(safetyNote) => {
        const expected = revision.expected!;
        return isCheckpoint
          ? api.reopenCheckpoint({ checkpointId: subject.id, safetyNote, expected })
          : api.reopenRoute({ routeId: subject.id, safetyNote, expected });
      }}
      onClose={onClose}
      onSucceeded={onChanged}
    />
  );
}
