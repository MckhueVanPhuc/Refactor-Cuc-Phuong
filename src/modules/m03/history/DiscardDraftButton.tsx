// "Bỏ thay đổi" — bỏ bản nháp chờ của mục đã xuất bản (tasks T150; C-06; BR-M03-F10). Bản đang xuất bản giữ nguyên.
// Không có hộp xác nhận (BR-M03-L12). Mục chưa từng xuất bản dùng "Hủy" (C-07), không phải nút này.
import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { useAdminApi } from '../api/AdminApiProvider';
import type { ExpectedRevisions, SubjectType } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';

export type DiscardDraftButtonProps = {
  subjectType: SubjectType;
  subjectId: string;
  expected: ExpectedRevisions;
  disabled?: boolean;
  onResult: (result: CommandResult<unknown>) => void;
  onTransportError: (error: unknown) => void;
};

export function DiscardDraftButton({ subjectType, subjectId, expected, disabled, onResult, onTransportError }: DiscardDraftButtonProps) {
  const api = useAdminApi();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          onResult(await api.discardDraft({ subjectType, subjectId, expected }));
        } catch (error) {
          onTransportError(error);
        } finally {
          setBusy(false);
        }
      }}
    >
      Bỏ thay đổi
    </Button>
  );
}
