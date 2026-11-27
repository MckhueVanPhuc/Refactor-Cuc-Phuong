// Thông báo kết quả quét không có nội dung (tasks T061; screen spec SCR-M02-001 §4, SCR-M02-002 §4; BR-M02-015;
// FR-M02-013): tạm đóng (một câu cho cả `ROUTE` và `CHECKPOINT`), mã không hợp lệ, cần kết nối. Lỗi kết nối không bao
// giờ hiện là mã không hợp lệ. Mã ngoài hành trình (`VALID`) không có thông báo: màn hiện nội dung live, không lượt ghé
// (spec và screen spec không chốt chữ nào cho trường hợp này). Màu theo bề mặt của FieldLayout (scanner tối / reader sáng).
// CHG-MASCOT-2026-11-27-09: cùng một thẻ ở mọi màn (SCR-M02-001, 002, 004, 005). Chưa kiểm tra được mã: tiêu đề, câu cố
// định, "Lượt quét chưa được tính." khi có phiên, nút "Thử lại"; × đóng ở màn có hành trình. Không có hình Mila trong
// thẻ (spec-Mascot v1.9): ở SCR-M02-001 Mila đứng chờ đổi tư thế thay vào.
import { useEffect } from 'react';
import { emitMascotEvent } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './ScanNotice.module.css';

export type ScanNoticeKind = 'CLOSED' | 'INVALID' | 'CONNECTION_NEEDED';

export function ScanNotice({
  kind,
  freeVisitor = false,
  notCounted = null,
  onRetry,
  onDismiss,
}: {
  kind: ScanNoticeKind;
  freeVisitor?: boolean;
  /** Có phiên và mã chưa kiểm tra được: `journey` ở màn Chuyến đi (thêm "Hành trình bên dưới giữ nguyên."), `plain` ở màn khác */
  notCounted?: 'journey' | 'plain' | null;
  /** "Thử lại": tra lại đúng mã vừa quét (chỉ cho mã chưa kiểm tra được) */
  onRetry?: (() => void) | undefined;
  /** Nút × (màn có hành trình hoặc nút Quét bên dưới) */
  onDismiss?: (() => void) | undefined;
}) {
  const messages = useM02Messages();
  // Mila rời màn khi có thông báo tạm đóng (spec-Mascot BR-MAS-03; specs/005 T028). Chỉ phát tín hiệu.
  useEffect(() => {
    if (kind === 'CLOSED') emitMascotEvent({ type: 'm02.notice.closedShown' });
  }, [kind]);
  const { text, tone } = {
    CLOSED: { text: messages.notice.temporarilyClosed, tone: styles.warning },
    INVALID: { text: messages.notice.invalid, tone: styles.error },
    CONNECTION_NEEDED: { text: messages.notice.connectionNeeded, tone: styles.info },
  }[kind];
  const unchecked = kind === 'CONNECTION_NEEDED';
  return (
    <div className={`${styles.notice} ${tone}`} role="alert" data-scan-notice={kind}>
      {onDismiss && (
        <button type="button" className={styles.dismiss} aria-label={messages.toast.close} onClick={onDismiss}>
          <TintIcon name="close" />
        </button>
      )}
      {unchecked && <p className={styles.title}>{messages.scanNotice.uncheckedTitle}</p>}
      <p className={styles.text}>{text}</p>
      {unchecked && notCounted && (
        <p className={styles.secondary}>
          {notCounted === 'journey' ? messages.scanNotice.notCountedJourney : messages.scanNotice.notCounted}
        </p>
      )}
      {/* Gợi ý khách tự do hiện với mọi kết quả khi không có phiên (US-M02-07) */}
      {freeVisitor && <p className={styles.text}>{messages.notice.freeVisitor}</p>}
      {unchecked && onRetry && (
        <button type="button" className={styles.action} onClick={onRetry}>
          {messages.scanNotice.retry}
        </button>
      )}
    </div>
  );
}
