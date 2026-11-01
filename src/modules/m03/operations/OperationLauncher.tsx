// Gắn Đóng tạm / Mở lại (Quản lý) / Lưu trữ (Quản lý) vào danh sách tuyến, thư viện và editor điểm dừng (tasks T140;
// SCR-M03-001 E-11…E-13, SCR-M03-008 E-15, E-18, E-19). Ẩn nút theo role chỉ là tiện ích; server vẫn kiểm quyền
// (BR-M03-A03). Hộp thoại vẫn gắn sau khi đóng để banner lỗi (ví dụ MSG-CLOSE-FAILED) còn hiện.
import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { useCurrentAdmin } from '../auth/CurrentAdminContext';
import type { RouteStatus } from '../contracts/adminDtos';
import { ArchiveDialog } from './ArchiveDialog';
import { CloseDialog } from './CloseDialog';
import type { OperationSubject } from './OperationDialog';
import { ReopenDialog } from './ReopenDialog';

export type OperationKind = 'close' | 'reopen' | 'archive';

export function useOperationLauncher() {
  const [operation, setOperation] = useState<{ kind: OperationKind; subject: OperationSubject } | null>(null);
  const [open, setOpen] = useState(false);
  return {
    operation,
    open,
    start: (kind: OperationKind, subject: OperationSubject) => {
      setOperation({ kind, subject });
      setOpen(true);
    },
    close: () => setOpen(false),
  };
}

export type OperationLauncher = ReturnType<typeof useOperationLauncher>;

export function useIsReviewer(): boolean {
  const { state } = useCurrentAdmin();
  return state.status === 'signedIn' && state.admin.role === 'REVIEWER';
}

/** Nút thao tác theo trạng thái: Đang hoạt động → Đóng tạm; Tạm đóng → Mở lại, Lưu trữ (chỉ Quản lý) */
export function OperationActions({
  status,
  subject,
  launcher,
  disabled,
}: {
  status: RouteStatus;
  subject: OperationSubject;
  launcher: OperationLauncher;
  disabled?: boolean;
}) {
  const isReviewer = useIsReviewer();
  if (status === 'HOAT_DONG') {
    return (
      <Button onClick={() => launcher.start('close', subject)} disabled={disabled}>
        Đóng tạm
      </Button>
    );
  }
  if (status === 'TAM_DONG' && isReviewer) {
    return (
      <>
        <Button onClick={() => launcher.start('reopen', subject)} disabled={disabled}>
          Mở lại
        </Button>
        <Button onClick={() => launcher.start('archive', subject)} disabled={disabled}>
          Lưu trữ
        </Button>
      </>
    );
  }
  return null;
}

/** Hộp thoại của thao tác đang chọn; đặt ở chỗ banner của màn */
export function OperationDialogs({ launcher, onChanged }: { launcher: OperationLauncher; onChanged: () => void }) {
  const { operation, open, close } = launcher;
  if (!operation) return null;
  const key = `${operation.kind}:${operation.subject.id}`;
  const props = { open, subject: operation.subject, onClose: close, onChanged };
  if (operation.kind === 'close') return <CloseDialog key={key} {...props} />;
  if (operation.kind === 'reopen') return <ReopenDialog key={key} {...props} />;
  return <ArchiveDialog key={key} {...props} />;
}
