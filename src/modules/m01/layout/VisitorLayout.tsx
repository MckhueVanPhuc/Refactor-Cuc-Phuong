// Layout chung của bốn màn M01 (tasks T033; design-system §5.1): thanh app có logo về danh mục, liên kết tới
// /offline (vào được cả khi không có nguồn, research R-13), LanguageControl (US1) và vùng thông báo nguồn.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet, useMatch } from 'react-router';
import logoUrl from '../../../../assets/icons/logo-emblem.png';
import { PATHS } from '../../../app/paths';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Messages } from '../i18n/useM01Messages';
import { LanguageControl } from '../language/LanguageControl';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import styles from './VisitorLayout.module.css';

const NoticeSlotContext = createContext<HTMLElement | null>(null);

/** Màn đặt thông báo trạng thái nguồn (dữ liệu cũ, không đọc được nguồn…) vào vùng chung dưới thanh app. */
export function SourceNotice({ children }: { children: ReactNode }) {
  const slot = useContext(NoticeSlotContext);
  return slot ? createPortal(children, slot) : null;
}

export function VisitorLayout() {
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const [noticeSlot, setNoticeSlot] = useState<HTMLElement | null>(null);
  // Chi tiết tuyến và Gợi ý tuyến đặt trên ảnh rừng: thanh app trong suốt, nội dung là lớp kính tối (mockup Route
  // details, Recommendation); mỗi màn một ảnh
  const onDetail = useMatch('/routes/:routeId') !== null;
  const onRecommend = useMatch(PATHS.recommend) !== null;
  const immersive = onDetail || onRecommend;
  const shellClass = [styles.shell, immersive && styles.immersive, onRecommend && styles.recommendPhoto]
    .filter(Boolean)
    .join(' ');

  // Trình đọc màn hình đọc đúng ngôn ngữ đang hiển thị
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className={shellClass} data-surface={immersive ? 'forest' : 'paper'}>
      <header className={styles.appBar}>
        <Link className={styles.brand} to={PATHS.catalog}>
          <img className={styles.logo} src={logoUrl} alt={messages.nav.catalog} />
        </Link>
        <nav className={styles.nav}>
          <NavLink className={styles.navLink ?? ''} to={PATHS.offline}>
            {messages.nav.offline}
            <TintIcon name="offline" />
          </NavLink>
        </nav>
        <LanguageControl tone="onDark" />
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
