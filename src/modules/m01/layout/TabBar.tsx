// Thanh tab dưới của các màn M01 (design-system §5 "Tab bar"; screen list M01 §5; quyết định người dùng 2026-11-21):
// Tuyến · Quét QR · Tài nguyên, chú thích ngắn dưới icon. Nút giữa mở màn Quét QR của M02 (SCR-M02-005) bằng đường dẫn,
// không import gì của M02. Tab đang mở có `aria-current="page"`, vạch trên và chữ đậm, không chỉ đổi màu.
import { Link, useLocation } from 'react-router';
import { PATHS } from '../../../app/paths';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Messages } from '../i18n/useM01Messages';
import styles from './TabBar.module.css';

export function TabBar() {
  const messages = useM01Messages();
  const { pathname } = useLocation();
  const onResources = pathname === PATHS.offline;

  return (
    <nav className={styles.bar} aria-label={messages.nav.tabBarLabel}>
      <Link className={styles.tab} to={PATHS.catalog} aria-current={onResources ? undefined : 'page'}>
        <TintIcon name="route-stops" className={styles.icon} />
        {messages.nav.tabRoutes}
      </Link>
      {/* Màn Quét quay về đúng màn đang mở khi đóng camera */}
      <Link className={styles.scan} to={PATHS.scan} state={{ returnTo: pathname }}>
        <span className={styles.disc}>
          <TintIcon name="qr-scan" className={styles.scanIcon} />
        </span>
        {messages.nav.tabScan}
      </Link>
      <Link className={styles.tab} to={PATHS.offline} aria-current={onResources ? 'page' : undefined}>
        <TintIcon name="offline" className={styles.icon} />
        {messages.nav.tabResources}
      </Link>
    </nav>
  );
}
