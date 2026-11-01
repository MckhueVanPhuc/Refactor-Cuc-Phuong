import { describe, expect, it } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import type { ValidationIssue } from '../contracts/validationIssue';
import { FieldError } from './FieldError';
import { useFieldIssues } from './useFieldIssues';

const issue = (overrides: Partial<ValidationIssue>): ValidationIssue => ({
  severity: 'BLOCKS_SAVE',
  fieldLabel: 'Tên tuyến (tiếng Việt)',
  message: 'Tên tuyến (tiếng Việt) dài quá 100 ký tự (hiện có 120). Hãy rút gọn.',
  messageKey: 'MSG-LIMIT-TEXT',
  targetItemType: 'ROUTE',
  targetItemId: 'r1',
  targetFieldKey: 'name.vi',
  ...overrides,
});

describe('useFieldIssues (BR-M03-L02)', () => {
  it('gắn issue BLOCKS_SAVE vào đúng trường theo targetFieldKey', () => {
    const issues = [issue({}), issue({ targetFieldKey: 'name.en', message: 'Khác' })];
    const { result } = renderHook(() => useFieldIssues(issues));
    expect(result.current.errorFor('name.vi')).toBe(issues[0]!.message);
    expect(result.current.errorFor('name.en')).toBe('Khác');
    expect(result.current.errorFor('description.vi')).toBeUndefined();
  });

  it('issue BLOCKS_PUBLISH thuộc panel, không hiện dưới trường', () => {
    const { result } = renderHook(() => useFieldIssues([issue({ severity: 'BLOCKS_PUBLISH' })]));
    expect(result.current.errorFor('name.vi')).toBeUndefined();
  });

  it('khóa ngoài danh mục → câu MSG-GENERIC', () => {
    const { result } = renderHook(() => useFieldIssues([issue({ messageKey: 'MSG-KHONG-CO', message: 'raw' })]));
    expect(result.current.errorFor('name.vi')).toMatch(/^Có lỗi xảy ra/);
  });
});

describe('FieldError', () => {
  it('render câu lỗi có tiền tố chữ; không có issue thì không render', () => {
    const { rerender } = render(<FieldError issue={issue({})} id="e1" />);
    expect(screen.getByText(/^Lỗi: Tên tuyến/).id).toBe('e1');
    rerender(<FieldError issue={undefined} id="e1" />);
    expect(screen.queryByText(/^Lỗi:/)).toBeNull();
  });
});
