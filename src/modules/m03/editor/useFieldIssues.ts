import { useMemo } from 'react';
import type { ValidationIssue } from '../contracts/validationIssue';
import { formatMessage, isMessageKey } from '../messages/catalog';

/** Câu hiển thị của một issue; khóa ngoài danh mục → MSG-GENERIC (BR-M03-L13) */
export function issueMessage(issue: ValidationIssue): string {
  return isMessageKey(issue.messageKey) ? issue.message : formatMessage('MSG-GENERIC');
}

/**
 * Gắn issue BLOCKS_SAVE vào trường theo `targetFieldKey` để hiện ngay dưới ô (BR-M03-L02).
 * Issue BLOCKS_PUBLISH thuộc panel "Còn thiếu để xuất bản".
 */
export function useFieldIssues(issues: readonly ValidationIssue[]) {
  return useMemo(() => {
    const byField = new Map<string, ValidationIssue>();
    for (const issue of issues) {
      if (issue.severity === 'BLOCKS_SAVE' && !byField.has(issue.targetFieldKey)) {
        byField.set(issue.targetFieldKey, issue);
      }
    }
    return {
      issueFor: (fieldKey: string) => byField.get(fieldKey),
      errorFor: (fieldKey: string) => {
        const issue = byField.get(fieldKey);
        return issue ? issueMessage(issue) : undefined;
      },
    };
  }, [issues]);
}
