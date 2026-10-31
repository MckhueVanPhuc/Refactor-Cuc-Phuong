// Hộp xác nhận có ô lý do (BR-M03-L12): một câu hậu quả (MSG-CONFIRM-*), ô "Lý do", hai nút.
// Dùng cho hủy mục chưa từng xuất bản và thu hồi; lý do bắt buộc thì nút xác nhận tắt cho tới khi có chữ.
import { useEffect, useState } from 'react';
import { Dialog } from '../../../shared/ui/Dialog';
import { TextArea } from '../../../shared/ui/TextArea';
import { NOTE_MAX_CHARS } from '../config/limits';
import { trimmedLength } from '../validation/common';

export type ReasonDialogProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  safeLabel: string;
  reasonRequired: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string | undefined) => void;
};

export function ReasonDialog({ open, title, confirmLabel, safeLabel, reasonRequired, busy, onCancel, onConfirm }: ReasonDialogProps) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const length = trimmedLength(reason);
  const invalid = (reasonRequired && length === 0) || length > NOTE_MAX_CHARS;
  return (
    <Dialog
      open={open}
      title={title}
      safeLabel={safeLabel}
      confirmLabel={confirmLabel}
      onSafe={onCancel}
      onConfirm={() => onConfirm(length > 0 ? reason.trim() : undefined)}
      confirmDisabled={invalid || Boolean(busy)}
    >
      <TextArea label="Lý do" value={reason} onChange={setReason} maxChars={NOTE_MAX_CHARS} rows={3} />
    </Dialog>
  );
}
