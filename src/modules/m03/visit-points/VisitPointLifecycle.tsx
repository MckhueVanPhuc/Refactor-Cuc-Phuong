// Vòng đời điểm tham quan (tasks T091; BR-M03-E07, E09–E11): ảnh in + In lại (C-17), Thu hồi (C-16, lý do,
// MSG-CONFIRM-REVOKE-QR), Hủy mục chưa từng xuất bản (C-07, lý do tùy chọn, MSG-CONFIRM-DISCARD-QR).
import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { useAdminApi } from '../api/AdminApiProvider';
import type { VisitPointEditor } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { confirmation } from '../editor/confirmations';
import layout from '../editor/EditorLayout.module.css';
import { ReasonDialog } from '../editor/ReasonDialog';
import { QrPrintPanel } from './qr-print/QrPrintPanel';

export type VisitPointLifecycleProps = {
  editor: VisitPointEditor;
  displayName: string;
  /** Kết quả command để trang hiện thông báo; `null` khi bắt đầu một thao tác mới */
  onOutcome: (result: CommandResult<unknown> | null) => void;
  onTransportError: (error: unknown) => void;
  /** Trạng thái đã đổi (thu hồi) — nạp lại editor */
  onChanged: () => void;
  /** Đã hủy — rời editor */
  onDiscarded: () => void;
};

export function VisitPointLifecycle({ editor, displayName, onOutcome, onTransportError, onChanged, onDiscarded }: VisitPointLifecycleProps) {
  const api = useAdminApi();
  const [dialog, setDialog] = useState<'revoke' | 'discard' | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<CommandResult<unknown>>, after?: (result: CommandResult<unknown>) => void) {
    setBusy(true);
    onOutcome(null);
    try {
      const result = await action();
      setDialog(null);
      if (after) after(result);
      else if (!result.ok) onOutcome(result);
    } catch (error) {
      setDialog(null);
      onTransportError(error);
    } finally {
      setBusy(false);
    }
  }

  const expected = { entity: editor.concurrencyRevision };
  const neverPublished = editor.status === 'NHAP' && !editor.published;

  return (
    <>
      <QrPrintPanel
        qrIdentifier={editor.qrIdentifier}
        status={editor.status}
        connectivityMode={editor.checkpointMode}
        reprintDisabled={busy}
        // In lại cùng mã: chỉ ghi nhận, mã và nội dung không đổi (BR-M03-E07)
        onReprint={() => void run(() => api.recordReprint({ qrIdentifier: editor.qrIdentifier }))}
      />
      {editor.status === 'HOAT_DONG' || neverPublished ? (
        <div className={layout.formActions}>
          {editor.status === 'HOAT_DONG' ? (
            <Button onClick={() => setDialog('revoke')} disabled={busy}>
              Thu hồi mã QR
            </Button>
          ) : null}
          {neverPublished ? (
            <Button onClick={() => setDialog('discard')} disabled={busy}>
              Hủy điểm tham quan
            </Button>
          ) : null}
        </div>
      ) : null}

      <ReasonDialog
        open={dialog === 'revoke'}
        {...confirmation('REVOKE_QR', { tên: displayName })}
        reasonRequired
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={(reason) =>
          void run(
            () => api.revokeVisitPoint({ qrIdentifier: editor.qrIdentifier, reason: reason ?? '', expected }),
            (result) => (result.ok ? onChanged() : onOutcome(result)),
          )
        }
      />
      <ReasonDialog
        open={dialog === 'discard'}
        {...confirmation('DISCARD_QR', { tên: displayName })}
        reasonRequired={false}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={(reason) =>
          void run(
            () =>
              api.discardUnpublished({
                subjectType: 'QRCODE',
                subjectId: editor.qrIdentifier,
                ...(reason ? { reason } : {}),
                expected,
              }),
            (result) => (result.ok ? onDiscarded() : onOutcome(result)),
          )
        }
      />
    </>
  );
}
