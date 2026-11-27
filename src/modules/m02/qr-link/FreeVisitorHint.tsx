// Khối "Chọn tuyến" của khách tự do (tasks T081; E-SCR-M02-004-03, -04; E-SCR-M02-002-16; FR-M02-019). Từ 2026-11-27
// (CHG-MASCOT-2026-11-27-08 D9, chủ dự án chọn): câu "Bạn đang xem tự do…" là toast 4 giây ở đầu trang (ScanContent);
// khối này ở cuối bài chỉ còn Mila và nút "Chọn tuyến" sang danh mục (SCR-M01-001), không lặp lại câu.
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import { MascotFigure } from '../../../shared/mascot/index';
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './FreeVisitorHint.module.css';

/** Toast "Bạn đang xem tự do…" tự đóng sau khoảng này (chủ dự án chọn 2026-11-27); chạm/focus dừng đếm, có nút đóng */
export const FREE_VISITOR_TOAST_MS = 4_000;

export function FreeVisitorHint() {
  const messages = useM02Messages();
  return (
    <div className={styles.hint} data-free-visitor="">
      {/* Mila chỉ là hình cạnh nút, không bong bóng (OD-MAS-14; spec-Mascot §5.1) */}
      <MascotFigure pose="map" size="sm" />
      <Link className={styles.link} to={PATHS.catalog}>
        {messages.qrLink.chooseRoute}
      </Link>
    </div>
  );
}
