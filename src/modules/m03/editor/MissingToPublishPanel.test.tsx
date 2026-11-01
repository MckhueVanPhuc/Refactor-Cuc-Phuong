import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ValidationIssue } from '../contracts/validationIssue';
import { MissingToPublishPanel } from './MissingToPublishPanel';

const issue = (fieldKey: string, message: string, severity: ValidationIssue['severity'] = 'BLOCKS_PUBLISH'): ValidationIssue => ({
  severity,
  fieldLabel: 'x',
  message,
  messageKey: 'MSG-MISSING-FIELD',
  targetItemType: 'ROUTE',
  targetItemId: 'r1',
  targetFieldKey: fieldKey,
});

describe('MissingToPublishPanel (BR-M03-L03)', () => {
  it('luôn hiện; liệt kê chỉ issue BLOCKS_PUBLISH', () => {
    render(
      <MissingToPublishPanel
        issues={[issue('name.en', 'Còn thiếu: Tên tuyến (tiếng Anh).'), issue('name.vi', 'Dài quá', 'BLOCKS_SAVE')]}
      />,
    );
    expect(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Còn thiếu: Tên tuyến (tiếng Anh).' })).toBeTruthy();
    expect(screen.queryByText('Dài quá')).toBeNull();
  });

  it('không còn thiếu → vẫn hiện, ghi "Sẵn sàng"', () => {
    render(<MissingToPublishPanel issues={[]} />);
    expect(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' }).textContent).toContain('Sẵn sàng');
  });

  it('bấm một dòng: chuyển bước rồi focus đúng trường', async () => {
    const onNavigate = vi.fn();
    render(
      <>
        <input data-field-key="name.en" aria-label="Tên tuyến (tiếng Anh)" />
        <MissingToPublishPanel issues={[issue('name.en', 'Còn thiếu: Tên tuyến (tiếng Anh).')]} onNavigate={onNavigate} />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Còn thiếu: Tên tuyến (tiếng Anh).' }));
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ targetFieldKey: 'name.en' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Tên tuyến (tiếng Anh)')));
  });
});
