// Khung route của M01 (tasks T032–T033; research R-03; visitor-ui-flow §1). Màn thật thay placeholder ở US2–US7.
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { createMemoryRouter, createRoutesFromElements, RouterProvider } from 'react-router';
import { PATHS } from '../../app/paths';
import { m01Routes } from './routes';

beforeAll(() =>
  Promise.all([
    import('./catalog/CatalogPage'),
    import('./recommendation/RecommendPage'),
    import('./route-detail/RouteDetailPage'),
    import('./offline-package/OfflinePage'),
  ]),
);

function renderAt(path: string) {
  const router = createMemoryRouter(createRoutesFromElements(m01Routes), { initialEntries: [path] });
  return render(<RouterProvider router={router} />);
}

describe('route M01', () => {
  it.each([
    [PATHS.catalog, 'Danh mục tuyến'],
    [PATHS.recommend, 'Gợi ý tuyến'],
    [PATHS.routeDetail('route a/1'), 'Chi tiết tuyến & Chuẩn bị'],
    [PATHS.offline, 'Quản lý tài nguyên offline'],
  ])('%s → màn "%s" trong layout du khách', async (path, title) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('header có liên kết tới /offline và logo về danh mục', async () => {
    renderAt(PATHS.recommend);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: 'Tài nguyên offline' }).getAttribute('href')).toBe('/offline');
    expect(screen.getByRole('link', { name: 'Danh mục tuyến' }).getAttribute('href')).toBe('/');
  });

  it('liên kết của màn đang mở được đánh dấu aria-current', async () => {
    renderAt(PATHS.offline);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: 'Tài nguyên offline' }).getAttribute('aria-current')).toBe('page');
  });

  it('có vùng thông báo nguồn (role status) để màn đặt thông báo', async () => {
    renderAt(PATHS.catalog);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('path id trong /routes/:routeId được mã hóa, không render id trong trang', async () => {
    renderAt(PATHS.routeDetail('route a/1'));
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/route a/)).toBeNull();
  });
});
