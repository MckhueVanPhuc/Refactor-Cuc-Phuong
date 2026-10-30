import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminApiError } from '../api/errors';
import type { CommandResult } from '../contracts/commandResult';
import { CommandOutcome } from './CommandOutcome';

describe('CommandOutcome (admin-command §8)', () => {
  it('thành công: câu của messageKey, role="status"', () => {
    render(<CommandOutcome result={{ ok: true, messageKey: 'MSG-SAVED', data: null }} />);
    expect(screen.getByRole('status').textContent).toBe('Đã lưu bản nháp.');
  });

  it('STALE: email người sửa + hh:mm giờ Việt Nam, nút "Tải lại"', async () => {
    const onReload = vi.fn();
    const result: CommandResult<null> = {
      ok: false,
      reason: 'STALE',
      messageKey: 'MSG-STALE',
      stale: { editorEmail: 'staff@example.test', editedAt: '2026-10-30T02:05:00Z' },
    };
    render(<CommandOutcome result={result} onReload={onReload} />);
    expect(screen.getByRole('alert').textContent).toContain('staff@example.test vừa sửa mục này lúc 09:05.');
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('BUSY: tên mục, không có nút thử lại', () => {
    render(
      <CommandOutcome result={{ ok: false, reason: 'BUSY', messageKey: 'MSG-ROUTE-BUSY', busy: { itemName: 'Tuyến thử' } }} />,
    );
    expect(screen.getByRole('alert').textContent).toBe(
      'Đang có thao tác khác chạy trên Tuyến thử. Hãy thử lại sau ít phút.',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('BLOCKED: câu theo messageKey với values', () => {
    render(
      <CommandOutcome
        result={{ ok: false, reason: 'BLOCKED', messageKey: 'MSG-CHECKPOINT-IN-USE', values: { 'danh sách': 'Tuyến A' } }}
      />,
    );
    expect(screen.getByRole('alert').textContent).toBe(
      'Chưa thể lưu trữ điểm dừng này vì tuyến Tuyến A vẫn có trong danh sách. Hãy bỏ điểm dừng khỏi các tuyến đó trước.',
    );
  });

  it('FAILED khi đóng điểm dừng: nút "Đóng tạm các tuyến liên quan"', async () => {
    const onCloseRelatedRoutes = vi.fn();
    render(
      <CommandOutcome
        result={{ ok: false, reason: 'FAILED', messageKey: 'MSG-CLOSE-FAILED' }}
        onCloseRelatedRoutes={onCloseRelatedRoutes}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Đóng tạm các tuyến liên quan' }));
    expect(onCloseRelatedRoutes).toHaveBeenCalledTimes(1);
  });

  it('FORBIDDEN → MSG-NO-PERMISSION', () => {
    render(<CommandOutcome result={{ ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' }} />);
    expect(screen.getByRole('alert').textContent).toBe('Bạn chưa có quyền làm việc này. Hãy nhờ quản lý.');
  });

  it('VALIDATION: không banner (lỗi hiện dưới trường và ở panel)', () => {
    const { container } = render(
      <CommandOutcome result={{ ok: false, reason: 'VALIDATION', messageKey: 'MSG-LIMIT-TEXT', issues: [] }} />,
    );
    expect(container.textContent).toBe('');
  });

  it('lỗi transport → câu theo messageKey của AdminApiError', () => {
    render(<CommandOutcome result={null} transportError={new AdminApiError('MSG-NETWORK-FAILED')} />);
    expect(screen.getByRole('alert').textContent).toBe('Chưa kết nối được. Hãy kiểm tra mạng rồi thử lại.');
  });

  it('chưa có kết quả → không render gì', () => {
    const { container } = render(<CommandOutcome result={null} />);
    expect(container.textContent).toBe('');
  });
});
