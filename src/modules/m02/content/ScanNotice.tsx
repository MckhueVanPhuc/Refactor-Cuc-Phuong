// Thông báo kết quả quét không có nội dung (tasks T061; screen spec SCR-M02-001 §4, SCR-M02-002 §4; BR-M02-015;
// FR-M02-013): tạm đóng (một câu cho cả `ROUTE` và `CHECKPOINT`), mã không hợp lệ, cần kết nối. Lỗi kết nối không bao
// giờ hiện là mã không hợp lệ. Mã ngoài hành trình (`VALID`) không có thông báo: màn hiện nội dung live, không lượt ghé
// (spec và screen spec không chốt chữ nào cho trường hợp này). Màu theo bề mặt của FieldLayout (scanner tối / reader sáng).
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './ScanNotice.module.css';

export type ScanNoticeKind = 'CLOSED' | 'INVALID' | 'CONNECTION_NEEDED';

export function ScanNotice({ kind, freeVisitor = false }: { kind: ScanNoticeKind; freeVisitor?: boolean }) {
  const messages = useM02Messages();
  const { text, tone } = {
    CLOSED: { text: messages.notice.temporarilyClosed, tone: styles.warning },
    INVALID: { text: messages.notice.invalid, tone: styles.error },
    CONNECTION_NEEDED: { text: messages.notice.connectionNeeded, tone: styles.info },
  }[kind];
  return (
    <div className={`${styles.notice} ${tone}`} role="alert" data-scan-notice={kind}>
      <p className={styles.text}>{text}</p>
      {/* Gợi ý khách tự do hiện với mọi kết quả khi không có phiên (US-M02-07) */}
      {freeVisitor && <p className={styles.text}>{messages.notice.freeVisitor}</p>}
    </div>
  );
}
