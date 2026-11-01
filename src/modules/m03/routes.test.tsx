import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderAdmin } from './testing/renderAdmin';

// Nạp sẵn chunk lazy của các màn để ca đầu tiên không phụ thuộc thời gian nạp module (validation-report D-23)
beforeAll(() =>
  Promise.all([
    import('./layout/PlaceholderPage'),
    import('./auth/LoginPage'),
    import('./route-admin/RouteListPage'),
    import('./route-admin/RouteEditorPage'),
    import('./checkpoint-library/CheckpointListPage'),
    import('./checkpoint-library/CheckpointEditorPage'),
  ]),
);

describe('cây /admin/* (admin-ui-flow §1)', () => {
  it.each([
    ['/admin/routes', 'Quản trị tuyến'],
    ['/admin/routes/new', 'Tuyến mới'],
    ['/admin/checkpoints', 'Thư viện điểm dừng'],
    ['/admin/checkpoints/new', 'Điểm dừng mới'],
    ['/admin/audit', 'Nhật ký hệ thống'],
  ])('%s → màn "%s" trong layout quản trị', async (path, title) => {
    renderAdmin(path, { signedInAs: 'REVIEWER' });
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Quản trị' })).toBeTruthy();
  });

  it('/admin/login không có layout quản trị', async () => {
    renderAdmin('/admin/login');
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Quản trị' })).toBeNull();
  });

  it('/admin chuyển về danh sách tuyến', async () => {
    const { router } = renderAdmin('/admin', { signedInAs: 'CONTENT_STAFF' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Quản trị tuyến' })).toBeTruthy();
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/routes'));
  });

  it('Nhân viên không thấy mục chỉ Quản lý; mục đang chọn có aria-current', async () => {
    renderAdmin('/admin/routes', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('link', { name: 'Tài khoản' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Nhật ký hệ thống' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Tuyến' }).getAttribute('aria-current')).toBe('page');
  });
});
