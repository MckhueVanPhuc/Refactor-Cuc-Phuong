import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderAdmin } from '../testing/renderAdmin';

const NO_PERMISSION = 'Bạn chưa có quyền làm việc này. Hãy nhờ quản lý.';

describe('RequireAdmin / RequireReviewer (BR-M03-A02, A03)', () => {
  it('chưa đăng nhập → /admin/login, nhớ đích ban đầu', async () => {
    const { router } = renderAdmin('/admin/checkpoints');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'));
    expect(router.state.location.state).toMatchObject({ from: '/admin/checkpoints' });
  });

  it.each(['/admin/accounts', '/admin/audit'])('Nhân viên mở %s → MSG-NO-PERMISSION', async (path) => {
    renderAdmin(path, { signedInAs: 'CONTENT_STAFF' });
    expect((await screen.findByRole('alert')).textContent).toBe(NO_PERMISSION);
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('Quản lý mở /admin/audit → vào được', async () => {
    renderAdmin('/admin/audit', { signedInAs: 'REVIEWER' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Nhật ký hệ thống' })).toBeTruthy();
  });

  it('header hiện email, vai trò bằng tên hiển thị và nút Đăng xuất; điều hướng theo role', async () => {
    renderAdmin('/admin/routes', { signedInAs: 'REVIEWER' });
    await screen.findByRole('heading', { level: 1, name: 'Quản trị tuyến' });
    expect(screen.getByText('reviewer@example.test')).toBeTruthy();
    expect(screen.getByText('Quản lý')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Tài khoản' })).toBeTruthy();
  });
});
