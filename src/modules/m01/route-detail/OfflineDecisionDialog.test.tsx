// Dialog quyết định offline (tasks T077; BR-M01-007, 016; FR-M01-006; SC-M01-009; DAC-M01-016; OQ-SCR-M01-003-004).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { OfflineDecisionDialog } from './OfflineDecisionDialog';

function renderDialog(language: 'vi' | 'en' = 'vi', snapshot = publicationFixture().snapshots.A) {
  const handlers = { onDownload: vi.fn(), onContinue: vi.fn(), onBack: vi.fn() };
  render(<OfflineDecisionDialog open snapshot={snapshot} language={language} {...handlers} />);
  return handlers;
}

describe('OfflineDecisionDialog', () => {
  it('nêu tên các điểm dừng OFFLINE_REQUIRED theo ngôn ngữ; thiếu ước tính → "Chưa có thông tin dung lượng."; dòng hướng dẫn quét', () => {
    renderDialog('vi');
    expect(screen.getByRole('dialog', { name: 'Tuyến này nên tải trước' })).toBeTruthy();
    expect(
      screen.getByText('Một số điểm dừng có thể không có nội dung nếu bạn không tải trước: Điểm thử A1, Điểm thử A2.'),
    ).toBeTruthy();
    expect(screen.getByText('Chưa có thông tin dung lượng.')).toBeTruthy();
    expect(screen.getByText(/hãy quét mã bằng nút Quét trong ứng dụng/)).toBeTruthy();
  });

  it('có ước tính → "Dung lượng ước tính: khoảng … MB." (tiếng Anh)', () => {
    const snapshot = { ...publicationFixture().snapshots.A, estimatedOfflineSizeBytes: 3 * 1_048_576 };
    renderDialog('en', snapshot);
    expect(screen.getByText('Estimated size: about 3 MB.')).toBeTruthy();
    expect(screen.getByText(/Test stop A1, Test stop A2/)).toBeTruthy();
  });

  it('đúng ba nút; nút Tải luôn bật kể cả khi thiếu ước tính', () => {
    renderDialog('vi');
    const buttons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(buttons).toEqual(['Tải về', 'Tiếp tục không tải', 'Quay lại']);
    expect((screen.getByRole('button', { name: 'Tải về' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('không chọn ngầm: mỗi nút gọi đúng lựa chọn; Esc = Quay lại', async () => {
    const handlers = renderDialog('vi');
    expect(handlers.onDownload).not.toHaveBeenCalled();
    expect(handlers.onContinue).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Tiếp tục không tải' }));
    expect(handlers.onContinue).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Tải về' }));
    expect(handlers.onDownload).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    expect(handlers.onBack).toHaveBeenCalledTimes(1);
  });

  it('focus ban đầu ở nút Quay lại (lựa chọn an toàn)', () => {
    renderDialog('vi');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Quay lại' }));
  });
});
