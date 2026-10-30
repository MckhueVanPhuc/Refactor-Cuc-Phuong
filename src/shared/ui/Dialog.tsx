import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './Dialog.module.css';

export type DialogProps = {
  open: boolean;
  title: ReactNode;
  /** Bỏ trống khi hộp thoại chỉ có một câu (đặt ở `title`) và hai nút */
  children?: ReactNode;
  /** Nút an toàn (hủy, ở lại): focus ban đầu và là hành động của phím Esc. */
  safeLabel: string;
  confirmLabel: string;
  onSafe: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
};

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/** Hộp thoại xác nhận: đúng hai nút, focus trap, Esc = nút an toàn (design-system §5.2). */
export function Dialog({
  open,
  title,
  children,
  safeLabel,
  confirmLabel,
  onSafe,
  onConfirm,
  confirmDisabled,
}: DialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const safeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    safeRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  if (!open) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onSafe();
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
    <div className={styles.backdrop}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children ? (
          <div id={bodyId} className={styles.body}>
            {children}
          </div>
        ) : null}
        <div className={styles.actions}>
          <Button buttonRef={safeRef} onClick={onSafe}>
            {safeLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
