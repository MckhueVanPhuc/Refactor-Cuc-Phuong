import type { ValidationIssue } from '../contracts/validationIssue';
import { issueMessage } from './useFieldIssues';
import styles from './FieldError.module.css';

/**
 * Lỗi của một trường không dùng control nền (danh sách, nhóm tick…). Control nền tự hiện lỗi qua prop `error`.
 * `id` để ô liên quan trỏ `aria-describedby` tới đây.
 */
export function FieldError({ issue, id }: { issue: ValidationIssue | undefined; id: string }) {
  if (!issue) return null;
  return (
    <p id={id} className={styles.error}>
      Lỗi: {issueMessage(issue)}
    </p>
  );
}
