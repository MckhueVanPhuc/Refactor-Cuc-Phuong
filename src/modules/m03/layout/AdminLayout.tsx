import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';
import type { AdminRole } from '../contracts/adminDtos';
import { ADMIN_PATHS } from '../paths';
import styles from './AdminLayout.module.css';

type NavItem = { to: string; label: string; reviewerOnly?: boolean };

// Nhãn điều hướng theo tên màn (screen list M03; mockup SCR-M03-001)
const NAV_ITEMS: readonly NavItem[] = [
  { to: ADMIN_PATHS.routes, label: 'Tuyến' },
  { to: ADMIN_PATHS.checkpoints, label: 'Thư viện điểm dừng' },
  { to: ADMIN_PATHS.reports, label: 'Báo cáo' },
  { to: ADMIN_PATHS.accounts, label: 'Tài khoản', reviewerOnly: true },
  { to: ADMIN_PATHS.audit, label: 'Nhật ký hệ thống', reviewerOnly: true },
];

export type AdminLayoutProps = {
  /** Role của người đăng nhập; mục chỉ Quản lý được ẩn với Nhân viên (chỉ là tiện ích — server vẫn kiểm) */
  role?: AdminRole;
  /** Email, vai trò và nút "Đăng xuất" (US1 T068 nối vào) */
  userSlot?: ReactNode;
  /** Vùng thông báo duy nhất ở đầu nội dung (design-system §5.3) */
  banner?: ReactNode;
  children?: ReactNode;
};

/** Workspace M03: sidebar điều hướng, header gọn, vùng làm việc linh hoạt (design-system §5.1). */
export function AdminLayout({ role, userSlot, banner, children }: AdminLayoutProps) {
  const items = NAV_ITEMS.filter((item) => !item.reviewerOnly || role === 'REVIEWER');

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#admin-main">
        Bỏ qua điều hướng
      </a>
      <aside className={styles.sidebar}>
        <p className={styles.brand}>Cúc Phương Quest</p>
        <nav aria-label="Quản trị">
          <ul className={styles.navList}>
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.header}>{userSlot}</header>
        <main id="admin-main" className={styles.main} tabIndex={-1}>
          {banner ? <div className={styles.banner}>{banner}</div> : null}
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
