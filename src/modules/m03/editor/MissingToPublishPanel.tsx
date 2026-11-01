import { useId } from 'react';
import type { ValidationIssue } from '../contracts/validationIssue';
import { readinessLabel } from '../messages/displayNames';
import { issueMessage } from './useFieldIssues';
import styles from './MissingToPublishPanel.module.css';

export type MissingToPublishPanelProps = {
  issues: readonly ValidationIssue[];
  /** Chuyển sang bước chứa trường (editor nhiều bước) trước khi focus */
  onNavigate?: (issue: ValidationIssue) => void;
};

function focusField(fieldKey: string) {
  const selector = `[data-field-key="${fieldKey.replace(/["\\]/g, '\\$&')}"]`;
  // Chờ bước mới render xong rồi mới focus
  requestAnimationFrame(() => {
    const element = document.querySelector<HTMLElement>(selector);
    element?.focus();
    element?.scrollIntoView?.({ block: 'center' });
  });
}

/** Panel "Còn thiếu để xuất bản": luôn hiện; bấm một dòng thì tới đúng ô (BR-M03-L03; SCR-M03-002/003/008). */
export function MissingToPublishPanel({ issues, onNavigate }: MissingToPublishPanelProps) {
  const titleId = useId();
  const missing = issues.filter((issue) => issue.severity === 'BLOCKS_PUBLISH');

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Còn thiếu để xuất bản
      </h2>
      {missing.length === 0 ? (
        <p className={styles.ready}>{readinessLabel([])}</p>
      ) : (
        <ul className={styles.list}>
          {missing.map((issue) => (
            <li key={`${issue.targetItemId}:${issue.targetFieldKey}:${issue.messageKey}`}>
              <button
                type="button"
                className={styles.item}
                onClick={() => {
                  onNavigate?.(issue);
                  focusField(issue.targetFieldKey);
                }}
              >
                {issueMessage(issue)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
