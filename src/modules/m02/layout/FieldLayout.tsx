// Layout chung của bốn màn M02 (tasks T025; design-system §5 "M02 — Field Experience"; mockup SCR-M02-001, -004).
// Hai bề mặt: `scanner` tối cho phiên và scanner (SCR-M02-001), `reader` sáng cho văn bản dài (SCR-M02-002…004).
// Header có tiêu đề màn và nút VI/EN của M01 (M01 là writer duy nhất của LanguagePreference); dưới header là vùng
// thông báo một lần mà màn đặt vào bằng <FieldNotice>.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import logoUrl from '../../../../assets/icons/logo-emblem.png';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import { LanguageControl } from '../m01Port';
import { useAutoEndNotice } from '../session/autoEnd';
import styles from './FieldLayout.module.css';

/** `article`: reader cho nội dung một mã QR (SCR-M02-002, -004), nền xanh xô thơm dưới ảnh đầu trang. */
export type FieldSurface = 'scanner' | 'reader' | 'article';

const SURFACE_CLASS: Record<FieldSurface, string | undefined> = {
  scanner: styles.scanner,
  reader: styles.reader,
  article: `${styles.reader} ${styles.article}`,
};

const NoticeSlotContext = createContext<HTMLElement | null>(null);

/** Đặt thông báo (tạm đóng, mã không hợp lệ, tự kết thúc chuyến…) vào vùng chung dưới header. */
export function FieldNotice({ children }: { children: ReactNode }) {
  const slot = useContext(NoticeSlotContext);
  return slot ? createPortal(children, slot) : null;
}

export function FieldLayout({ surface, title, children }: { surface: FieldSurface; title?: string; children?: ReactNode }) {
  const language = useM02DisplayLanguage();
  const messages = useM02Messages();
  // Chuyến trước vừa tự kết thúc (BR-M02-022): thông báo một lần trên màn M02 đang mở
  const autoEnded = useAutoEndNotice();
  const [noticeSlot, setNoticeSlot] = useState<HTMLElement | null>(null);

  // Trình đọc màn hình đọc đúng ngôn ngữ đang hiển thị
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className={`${styles.shell} ${SURFACE_CLASS[surface] ?? ''}`} data-surface={surface}>
      <header className={styles.appBar}>
        <div className={styles.brand}>
          {/* Nội dung một mã QR: logo vườn trên thanh app deep như M01; chỉ trang trí, không phải liên kết */}
          {surface === 'article' && <img className={styles.logo} src={logoUrl} alt="" />}
          {title && <h1 className={styles.title}>{title}</h1>}
        </div>
        <LanguageControl tone={surface === 'reader' ? 'onLight' : 'onDark'} />
      </header>
      <div className={styles.notices} role="status" ref={setNoticeSlot}>
        {autoEnded && (
          <p className={styles.autoEnded} data-auto-ended={autoEnded}>
            {autoEnded === 'HOAN_TAT' ? messages.notice.autoEndedCompleted : messages.notice.autoEndedAbandoned}
          </p>
        )}
      </div>
      <main className={styles.main} id="m02-main" tabIndex={-1}>
        <NoticeSlotContext.Provider value={noticeSlot}>{children}</NoticeSlotContext.Provider>
      </main>
    </div>
  );
}
