// Khung chung của hộp thoại đóng tạm / mở lại / lưu trữ (tasks T136; BR-M03-L12, H01, H04, H06): một câu hậu quả
// (confirmations.ts) làm tiêu đề, câu phụ nếu có, ô lý do hoặc ghi chú bắt buộc ≤ NOTE_MAX_CHARS, hai nút.
// Kết quả không thành công hiện ở banner ngay chỗ đặt component, kể cả sau khi hộp thoại đã đóng; thành công thì
// trạng thái mới tự nói lên kết quả (danh mục §5.6 không có câu "đã đóng"), nên chỉ báo `onSucceeded`.
import { useEffect, useState } from 'react';
import { Dialog } from '../../../shared/ui/Dialog';
import { TextArea } from '../../../shared/ui/TextArea';
import { AdminApiError } from '../api/errors';
import { NOTE_MAX_CHARS } from '../config/limits';
import type { CommandResult } from '../contracts/commandResult';
import { CommandOutcome } from '../editor/CommandOutcome';
import type { ConfirmationProps } from '../editor/confirmations';
import { trimmedLength } from '../validation/common';
import styles from './OperationDialog.module.css';

export type OperationSubject = {
  type: 'ROUTE' | 'CHECKPOINT';
  id: string;
  /** tên như trên màn hình */
  name: string;
  /** concurrencyRevision đang có trên màn; vắng thì đọc lúc mở hộp thoại (useExpectedRevision) */
  concurrencyRevision?: number;
};

export type OperationDialogProps = {
  open: boolean;
  /** null khi chưa đủ dữ liệu để viết câu hậu quả (Q-09 đang nạp): hộp thoại chưa hiện */
  confirmation: ConfirmationProps | null;
  /** Câu phụ dưới tiêu đề, ví dụ MSG-CLOSE-ROUTE-AUTO */
  lines?: readonly string[];
  /** Câu chặn (MSG-REOPEN-BLOCKED): hiện như lỗi và tắt nút xác nhận */
  blocked?: string | undefined;
  noteLabel: string;
  /** Lỗi khi nạp Q-09 hoặc phiên bản của mục */
  loadError?: AdminApiError | null;
  /** false khi còn chờ dữ liệu cần để gửi (phiên bản của mục): nút xác nhận tắt */
  ready?: boolean;
  run: (note: string) => Promise<CommandResult<unknown>>;
  /** MSG-CLOSE-FAILED: "Đóng tạm các tuyến liên quan" với cùng lý do (C-11, BR-M03-H04) */
  closeRelatedRoutes?: (note: string) => Promise<CommandResult<unknown>>;
  onClose: () => void;
  /** Thao tác xong, hoặc người dùng bấm "Tải lại" sau MSG-STALE: màn nạp lại dữ liệu */
  onSucceeded: () => void;
};

export function OperationDialog({
  open,
  confirmation,
  lines = [],
  blocked,
  noteLabel,
  loadError,
  ready = true,
  run,
  closeRelatedRoutes,
  onClose,
  onSucceeded,
}: OperationDialogProps) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<CommandResult<unknown> | null>(null);
  const [transportError, setTransportError] = useState<AdminApiError | null>(null);
  const [sentNote, setSentNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setNote('');
    setOutcome(null);
    setTransportError(null);
  }, [open]);

  async function send(action: () => Promise<CommandResult<unknown>>) {
    setBusy(true);
    setOutcome(null);
    setTransportError(null);
    try {
      const result = await action();
      if (result.ok) onSucceeded();
      else setOutcome(result);
    } catch (caught) {
      setTransportError(AdminApiError.from(caught));
    } finally {
      setBusy(false);
    }
  }

  const length = trimmedLength(note);
  const invalid = length === 0 || length > NOTE_MAX_CHARS;

  return (
    <>
      <CommandOutcome
        result={outcome}
        transportError={transportError ?? loadError ?? null}
        // MSG-STALE: "Tải lại" nạp lại màn để thấy trạng thái mới (BR-M03-L05)
        onReload={() => {
          setOutcome(null);
          onSucceeded();
        }}
        {...(closeRelatedRoutes ? { onCloseRelatedRoutes: () => void send(() => closeRelatedRoutes(sentNote)) } : {})}
      />
      {confirmation ? (
        <Dialog
          open={open}
          {...confirmation}
          confirmDisabled={invalid || busy || !ready || Boolean(blocked)}
          onSafe={onClose}
          onConfirm={() => {
            const trimmed = note.trim();
            setSentNote(trimmed);
            onClose();
            void send(() => run(trimmed));
          }}
        >
          <div className={styles.body}>
            {lines.map((line) => (
              <p key={line} className={styles.line}>
                {line}
              </p>
            ))}
            {blocked ? <p className={styles.blocked}>{blocked}</p> : null}
            <TextArea label={noteLabel} value={note} onChange={setNote} maxChars={NOTE_MAX_CHARS} rows={3} />
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
