// "Khôi phục bản đã xuất bản trước đó" cho một bản cũ (tasks T150; C-08; BR-M03-F07). Không có hộp xác nhận:
// BR-M03-L12 không liệt kê khôi phục. Kết quả trả về trang để trang nạp lại hoặc hiện thông báo.
import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { useAdminApi } from '../api/AdminApiProvider';
import type { SubjectType } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';

export type RestoreButtonProps = {
  subjectType: SubjectType;
  subjectId: string;
  revisionNumber: number;
  disabled?: boolean;
  onResult: (result: CommandResult<unknown>) => void;
  onTransportError: (error: unknown) => void;
};

export function RestoreButton({ subjectType, subjectId, revisionNumber, disabled, onResult, onTransportError }: RestoreButtonProps) {
  const api = useAdminApi();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      aria-label={`Khôi phục bản đã xuất bản trước đó: bản ${revisionNumber}`}
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          onResult(await api.restoreRevision({ subjectType, subjectId, revisionNumber }));
        } catch (error) {
          onTransportError(error);
        } finally {
          setBusy(false);
        }
      }}
    >
      Khôi phục bản đã xuất bản trước đó
    </Button>
  );
}
