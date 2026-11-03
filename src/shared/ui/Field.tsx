import { useId, type ReactNode } from 'react';
import styles from './Field.module.css';

export type FieldIds = {
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
};

export type FieldShellProps = {
  label: ReactNode;
  hint?: ReactNode | undefined;
  error?: ReactNode | undefined;
  /** Hiện "n/max" khi có; số ký tự tính theo code point. */
  counter?: { length: number; max: number } | undefined;
  /** Id của phần tử mô tả thêm nằm ngoài khung (ví dụ dòng trạng thái dịch), nối vào `aria-describedby` */
  extraDescribedBy?: string | undefined;
  children: (ids: FieldIds) => ReactNode;
};

/** Khung chung của một trường: nhãn phía trên, gợi ý, ô nhập, rồi dòng lỗi + bộ đếm (design-system §5.3). */
export function FieldShell({ label, hint, error, counter, extraDescribedBy, children }: FieldShellProps) {
  const controlId = useId();
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const counterId = `${controlId}-counter`;
  const invalid = error !== undefined && error !== null && error !== '';
  const describedBy =
    [hint ? hintId : null, invalid ? errorId : null, counter ? counterId : null, extraDescribedBy ?? null]
      .filter(Boolean)
      .join(' ') ||
    undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
      </label>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {children({ controlId, describedBy, invalid })}
      {invalid || counter ? (
        <div className={styles.footer}>
          {invalid ? (
            <p id={errorId} className={styles.error}>
              Lỗi: {error}
            </p>
          ) : null}
          {counter ? (
            <p
              id={counterId}
              className={counter.length > counter.max ? `${styles.counter} ${styles.counterOver}` : styles.counter}
            >
              {counter.length}/{counter.max}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Số ký tự theo code point, để chữ có dấu tổ hợp hay emoji không bị đếm lệch. */
export function countChars(value: string): number {
  return Array.from(value).length;
}
