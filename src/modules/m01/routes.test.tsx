// Khung route của M01 (tasks T032–T033; research R-03; visitor-ui-flow §1). Màn thật thay placeholder ở US2–US7.
import { screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { PATHS } from '../../app/paths';
import { renderM01 } from './testing/renderM01';

beforeAll(() =>
  Promise.all([
    import('./catalog/CatalogPage'),
    import('./recommendation/RecommendPage'),
    import('./route-detail/RouteDetailPage'),
    import('./offline-package/OfflinePage'),
  ]),
);

// Đã chọn tiếng Việt và dùng nguồn giả: route đi qua LanguageGate (gate kiểm riêng ở language/LanguageGate.test.tsx)
const renderAt = (path: string) => renderM01(path);

describe('route M01', () => {
  it.each([
    [PATHS.catalog, 'Danh mục tuyến'],
    [PATHS.recommend, 'Gợi ý tuyến'],
    [PATHS.routeDetail('route a/1'), 'Chi tiết tuyến & Chuẩn bị'],
    [PATHS.offline, 'Quản lý tài nguyên offline'],
  ])('%s → màn "%s" trong layout du khách', async (path, title) => {
    await renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('thanh tab có Tuyến, Quét QR, Tài nguyên; logo trên thanh app về danh mục', async () => {
    await renderAt(PATHS.recommend);
    await screen.findByRole('heading', { level: 1 });
    const tabs = within(screen.getByRole('navigation', { name: 'Điều hướng chính' }));
    expect(tabs.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Tuyến', '/'],
      ['Quét QR', '/scan'],
      ['Tài nguyên', '/offline'],
    ]);
    // Gợi ý tuyến thuộc nhóm Tuyến
    expect(tabs.getByRole('link', { name: 'Tuyến' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Danh mục tuyến' }).getAttribute('href')).toBe('/');
    // Thanh app không còn liên kết "Tài nguyên offline"
    expect(within(screen.getByRole('banner')).queryByRole('link', { name: 'Tài nguyên offline' })).toBeNull();
  });

  it('tab của màn đang mở được đánh dấu aria-current', async () => {
    await renderAt(PATHS.offline);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: 'Tài nguyên' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Tuyến' }).getAttribute('aria-current')).toBeNull();
  });

  it('thanh app có LanguageControl; bấm EN đổi ngay chữ của màn và lang của trang', async () => {
    await renderAt(PATHS.offline);
    await screen.findByRole('heading', { level: 1, name: 'Quản lý tài nguyên offline' });
    screen.getByRole('button', { name: 'EN' }).click();
    expect(await screen.findByRole('heading', { level: 1, name: 'Offline downloads' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('en');
  });

  it('chưa chọn ngôn ngữ → panel chọn thay cho layout', async () => {
    await renderM01(PATHS.catalog, { language: null });
    expect(await screen.findByRole('button', { name: 'English' })).toBeTruthy();
    expect(screen.queryByRole('banner')).toBeNull();
  });

  it('có vùng thông báo nguồn (role status) để màn đặt thông báo', async () => {
    await renderAt(PATHS.catalog);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('path id trong /routes/:routeId được mã hóa, không render id trong trang', async () => {
    await renderAt(PATHS.routeDetail('route a/1'));
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/route a/)).toBeNull();
  });
});
