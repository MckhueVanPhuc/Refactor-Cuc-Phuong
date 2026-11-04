// Gợi ý khách tự do (tasks T081; E-SCR-M02-004-03, -04; E-SCR-M02-002-16; FR-M02-019): một dòng nói lượt quét không được
// ghi vào chuyến đi, kèm liên kết "Chọn tuyến" sang danh mục (SCR-M01-001). Hiện với mọi kết quả khi không có phiên.
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './FreeVisitorHint.module.css';

export function FreeVisitorHint() {
  const messages = useM02Messages();
  return (
    <div className={styles.hint} data-free-visitor="">
      <p className={styles.text}>{messages.notice.freeVisitor}</p>
      <Link className={styles.link} to={PATHS.catalog}>
        {messages.qrLink.chooseRoute}
      </Link>
    </div>
  );
}
