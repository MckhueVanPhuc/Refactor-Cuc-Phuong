// Đóng tạm tuyến (C-09) hoặc điểm dừng (C-10) (tasks T137; BR-M03-H01–H04): cả hai role, lý do bắt buộc, không qua
// màn xem lại. Với điểm dừng: câu nêu mọi tuyến liệt kê nó (hoặc MSG-CLOSE-NO-ROUTES) và các tuyến sẽ tự đóng (Q-09);
// đóng lỗi thì MSG-CLOSE-FAILED kèm "Đóng tạm các tuyến liên quan" (C-11).
import { useAdminApi } from '../api/AdminApiProvider';
import { autoCloseSentence, closeCheckpointConfirmation, confirmation } from '../editor/confirmations';
import { useExpectedRevision } from './latestRevision';
import { OperationDialog, type OperationSubject } from './OperationDialog';
import { useOperationImpact } from './useOperationImpact';

export type OperationDialogBaseProps = {
  open: boolean;
  subject: OperationSubject;
  onClose: () => void;
  /** Thao tác xong: nạp lại để trạng thái mới hiện ra */
  onChanged: () => void;
};

export function CloseDialog({ open, subject, onClose, onChanged }: OperationDialogBaseProps) {
  const api = useAdminApi();
  const isCheckpoint = subject.type === 'CHECKPOINT';
  const { impact, error } = useOperationImpact(open && isCheckpoint ? { operation: 'CLOSE_CHECKPOINT', subjectId: subject.id } : null);
  const revision = useExpectedRevision(open, subject);

  const title = !isCheckpoint
    ? confirmation('CLOSE_ROUTE', { tên: subject.name })
    : impact
      ? closeCheckpointConfirmation(impact.affectedRoutes.map((route) => route.routeName))
      : null;

  return (
    <OperationDialog
      open={open}
      confirmation={title}
      lines={impact && impact.autoClosingRoutes.length > 0 ? [autoCloseSentence(impact.autoClosingRoutes.map((route) => route.routeName))] : []}
      noteLabel="Lý do"
      loadError={error ?? revision.error}
      ready={revision.expected !== null}
      run={(reason) => {
        const expected = revision.expected!;
        return isCheckpoint
          ? api.closeCheckpoint({ checkpointId: subject.id, reason, expected })
          : api.closeRoute({ routeId: subject.id, reason, expected });
      }}
      {...(isCheckpoint ? { closeRelatedRoutes: (reason: string) => api.closeRoutesListingCheckpoint({ checkpointId: subject.id, reason }) } : {})}
      onClose={onClose}
      onSucceeded={onChanged}
    />
  );
}
