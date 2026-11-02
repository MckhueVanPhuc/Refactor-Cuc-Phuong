// Layout chung của bốn màn M01 (tasks T033; design-system §5.1): thanh app có logo về danh mục, liên kết tới
// /offline (vào được cả khi không có nguồn, research R-13), khe cho LanguageControl (US1) và vùng thông báo nguồn.
import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet } from 'react-router';
import logoUrl from '../../../../assets/icons/icon.png';
import { PATHS } from '../../../app/paths';
import { useM01Messages } from '../i18n/useM01Messages';
import styles from './VisitorLayout.module.css';

const NoticeSlotContext = createContext<HTMLElement | null>(null);

/** Màn đặt thông báo trạng thái nguồn (dữ liệu cũ, không đọc được nguồn…) vào vùng chung dưới thanh app. */
export function SourceNotice({ children }: { children: ReactNode }) {
  const slot = useContext(NoticeSlotContext);
  return slot ? createPortal(children, slot) : null;
}

export function VisitorLayout({ languageControl }: { languageControl?: ReactNode }) {
  const messages = useM01Messages();
  const [noticeSlot, setNoticeSlot] = useState<HTMLElement | null>(null);

  return (
    <div className={styles.shell}>
      <header className={styles.appBar}>
        <Link className={styles.brand} to={PATHS.catalog}>
          <img className={styles.logo} src={logoUrl} alt={messages.nav.catalog} />
        </Link>
        <nav className={styles.nav}>
          <NavLink className={styles.navLink ?? ''} to={PATHS.offline}>
            {messages.nav.offline}
          </NavLink>
        </nav>
        <div className={styles.languageSlot}>{languageControl}</div>
      </header>
      <div className={styles.notices} role="status" ref={setNoticeSlot} />
      <main className={styles.main} id="m01-main" tabIndex={-1}>
        <NoticeSlotContext.Provider value={noticeSlot}>
          <Outlet />
        </NoticeSlotContext.Provider>
      </main>
    </div>
  );
}
