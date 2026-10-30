import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { m03Routes } from './routes';

// Chỉ kiểm cây route và layout; trang placeholder chưa gọi API nào
function renderAt(path: string) {
  const router = createMemoryRouter(createRoutesFromElements(m03Routes), { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('cây /admin/* (admin-ui-flow §1)', () => {
  it.each([
    ['/admin/routes', 'Quản trị tuyến'],
    ['/admin/routes/abc', 'Biên tập tuyến'],
    ['/admin/checkpoints/c1/visit-points/new', 'Điểm tham quan (QR) & Nội dung'],
    ['/admin/review/QR_OBJECT/q1', 'Xem lại & Xuất bản'],
    ['/admin/audit', 'Nhật ký hệ thống'],
  ])('%s → màn "%s" trong layout quản trị', async (path, title) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Quản trị' })).toBeTruthy();
  });

  it('/admin/login không có layout quản trị', async () => {
    renderAt('/admin/login');
    expect(await screen.findByRole('heading', { level: 1, name: 'Đăng nhập quản trị' })).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Quản trị' })).toBeNull();
  });

  it('/admin chuyển về danh sách tuyến', async () => {
    renderAt('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: 'Quản trị tuyến' })).toBeTruthy();
  });

  it('mục chỉ Quản lý ẩn khi chưa biết role', async () => {
    renderAt('/admin/routes');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('link', { name: 'Tài khoản' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Tuyến' }).getAttribute('aria-current')).toBe('page');
  });
});
