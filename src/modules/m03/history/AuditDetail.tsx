// Cột "Chi tiết" của SCR-M03-009: tối đa 3 dòng; dài hơn thì nút "…Xem thêm" mở hộp thoại xem đủ (chỉ đọc).
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../../../shared/ui/Button';
import dialogStyles from '../../../shared/ui/Dialog.module.css';
import type { AuditRow } from '../contracts/adminDtos';
import styles from './AuditLogPage.module.css';

/** Các dòng chi tiết của một dòng nhật ký: lý do trước, rồi "Trường: trước → sau" */
export function detailLines(row: Pick<AuditRow, 'reason' | 'changeLines'>): string[] {
  return [...(row.reason ? [`Lý do: ${row.reason}`] : []), ...row.changeLines];
}

/** Khối chi tiết bị cắt ở 3 dòng; chỉ hiện nút khi nội dung thật sự dài hơn */
export function AuditDetail({ lines, onOpen }: { lines: string[]; onOpen: () => void }) {
  const clampRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = clampRef.current;
    if (!element) return;
    const measure = () => setOverflowing(element.scrollHeight > element.clientHeight + 1);
    measure();
    // Độ rộng cột đổi theo cửa sổ nên số dòng cũng đổi
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [lines]);

  if (lines.length === 0) return null;
  return (
    <>
      <div ref={clampRef} className={styles.detailClamp}>
        {lines.map((line, index) => (
          <p key={`${index}-${line}`}>{line}</p>
        ))}
      </div>
      {overflowing ? (
        <button type="button" className={styles.more} aria-haspopup="dialog" onClick={onOpen}>
          …Xem thêm
        </button>
      ) : null}
    </>
  );
}

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Hộp thoại chỉ xem, một nút "Đóng": focus trap, Esc đóng, trả focus về nút đã mở (design-system §5.2) */
export function DetailDialog({
  title,
  meta,
  lines,
  onClose,
}: {
  title: string;
  meta: ReactNode;
  lines: string[];
  onClose: () => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={dialogStyles.backdrop}>
      <div
        ref={panelRef}
        className={`${dialogStyles.panel} ${styles.detailPanel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={dialogStyles.title}>
          {title}
        </h2>
        <div className={styles.detailMeta}>{meta}</div>
        <div id={bodyId} className={`${dialogStyles.body} ${styles.detailBody}`}>
          {lines.map((line, index) => (
            <p key={`${index}-${line}`}>{line}</p>
          ))}
        </div>
        <div className={dialogStyles.actions}>
          <Button buttonRef={closeRef} onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
