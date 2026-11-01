import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import type { AdminApiError } from '../api/errors';
import type { CommandResult } from '../contracts/commandResult';
import { formatMessage, formatMessageFromServer } from '../messages/catalog';
import { formatTime } from '../messages/format';

export type CommandOutcomeProps = {
  result: CommandResult<unknown> | null;
  transportError?: AdminApiError | null;
  /** Giá trị cho câu thành công có placeholder (ví dụ MSG-QR-CREATED {tên}) */
  successValues?: Record<string, string | number>;
  /** STALE: nạp bản mới nhất (chữ đang gõ vẫn giữ trên màn hình) */
  onReload?: () => void;
  /** MSG-CLOSE-FAILED: C-11 "Đóng tạm các tuyến liên quan" (BR-M03-H04) */
  onCloseRelatedRoutes?: () => void;
};

/** Kết quả một command theo admin-command §8. VALIDATION hiện dưới trường và ở panel, không ở đây. */
export function CommandOutcome({
  result,
  transportError,
  successValues,
  onReload,
  onCloseRelatedRoutes,
}: CommandOutcomeProps) {
  if (transportError) {
    return <Banner tone="error">{formatMessage(transportError.messageKey)}</Banner>;
  }
  if (!result) return null;
  if (result.ok) {
    return <Banner tone="success">{formatMessageFromServer(result.messageKey, successValues)}</Banner>;
  }

  switch (result.reason) {
    case 'VALIDATION':
      return null;
    case 'STALE':
      return (
        <Banner
          tone="error"
          actions={
            onReload ? (
              <Button variant="primary" onClick={onReload}>
                Tải lại
              </Button>
            ) : undefined
          }
        >
          {formatMessage('MSG-STALE', { 'Tên người': result.stale.editorEmail, giờ: formatTime(result.stale.editedAt) })}
        </Banner>
      );
    case 'BUSY':
      // Không tự thử lại (BR-M03-L07)
      return (
        <Banner tone="error">
          {formatMessage('MSG-ROUTE-BUSY', { 'tên tuyến hoặc điểm dừng': result.busy.itemName })}
        </Banner>
      );
    case 'BLOCKED':
      return <Banner tone="error">{formatMessageFromServer(result.messageKey, result.values)}</Banner>;
    case 'FAILED':
      return (
        <Banner
          tone="error"
          actions={
            result.messageKey === 'MSG-CLOSE-FAILED' && onCloseRelatedRoutes ? (
              <Button variant="primary" onClick={onCloseRelatedRoutes}>
                Đóng tạm các tuyến liên quan
              </Button>
            ) : undefined
          }
        >
          {formatMessage(result.messageKey)}
        </Banner>
      );
    case 'FORBIDDEN':
      return <Banner tone="error">{formatMessage('MSG-NO-PERMISSION')}</Banner>;
  }
}
