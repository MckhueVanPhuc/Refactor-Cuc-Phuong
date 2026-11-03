// Layout chung của bốn màn M02 (tasks T025; design-system §5 "M02 — Field Experience"; mockup SCR-M02-001, -004).
// Hai bề mặt: `scanner` tối cho phiên và scanner (SCR-M02-001), `reader` sáng cho văn bản dài (SCR-M02-002…004).
// Header có tiêu đề màn và nút VI/EN của M01 (M01 là writer duy nhất của LanguagePreference); dưới header là vùng
// thông báo một lần mà màn đặt vào bằng <FieldNotice>.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useM02DisplayLanguage } from '../i18n/useM02Messages';
import { LanguageControl } from '../m01Port';
import styles from './FieldLayout.module.css';

export type FieldSurface = 'scanner' | 'reader';

const NoticeSlotContext = createContext<HTMLElement | null>(null);

/** Đặt thông báo (tạm đóng, mã không hợp lệ, tự kết thúc chuyến…) vào vùng chung dưới header. */
export function FieldNotice({ children }: { children: ReactNode }) {
  const slot = useContext(NoticeSlotContext);
  return slot ? createPortal(children, slot) : null;
}

export function FieldLayout({ surface, title, children }: { surface: FieldSurface; title?: string; children?: ReactNode }) {
  const language = useM02DisplayLanguage();
  const [noticeSlot, setNoticeSlot] = useState<HTMLElement | null>(null);

  // Trình đọc màn hình đọc đúng ngôn ngữ đang hiển thị
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className={`${styles.shell} ${surface === 'scanner' ? styles.scanner : styles.reader}`} data-surface={surface}>
      <header className={styles.appBar}>
        {title ? <h1 className={styles.title}>{title}</h1> : <span />}
        <LanguageControl tone={surface === 'scanner' ? 'onDark' : 'onLight'} />
      </header>
      <div className={styles.notices} role="status" ref={setNoticeSlot} />
      <main className={styles.main} id="m02-main" tabIndex={-1}>
        <NoticeSlotContext.Provider value={noticeSlot}>{children}</NoticeSlotContext.Provider>
      </main>
    </div>
  );
}
