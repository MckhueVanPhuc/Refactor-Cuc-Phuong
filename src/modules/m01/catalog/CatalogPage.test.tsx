// SCR-M01-001 Danh mục tuyến (tasks T045; US-M01-02; visitor-ui-flow §2; screen spec §4).
import { fireEvent, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createFakeSource } from '../api/fake/fakeSource';
import { renderM01 } from '../testing/renderM01';

beforeAll(() => import('./CatalogPage'));

const cards = () => screen.getAllByRole('listitem');

describe('CatalogPage', () => {
  it('Has routes: chỉ A và B, sắp A→Z theo ngôn ngữ; thẻ đủ trường', async () => {
    await renderM01('/');
    await screen.findByRole('link', { name: /Tuyến thử Bách Thảo/ });
    expect(cards().map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'Tuyến thử Ao Hồ',
      'Tuyến thử Bách Thảo',
    ]);
    const a = cards()[1]!;
    expect(within(a).getByText('Mô tả ngắn tuyến A')).toBeTruthy();
    expect(within(a).getByText('3 điểm dừng · 2,4 km · 150 phút')).toBeTruthy();
    expect(within(a).getByText('Nhẹ')).toBeTruthy();
    expect(within(a).getByText('Cần tải trước')).toBeTruthy();
    // B không cần gói
    expect(within(cards()[0]!).queryByText('Cần tải trước')).toBeNull();
    expect(screen.queryByText(/Tuyến thử C|Tuyến thử D|Tuyến hỏng/)).toBeNull();
  });

  it('tiếng Anh: chữ và thứ tự theo en', async () => {
    await renderM01('/', { language: 'en' });
    await screen.findByRole('link', { name: /Test Botanic trail/ });
    expect(cards().map((card) => within(card).getByRole('heading').textContent)).toEqual([
      'Test Botanic trail',
      'Test Lakeside walk',
    ]);
    expect(within(cards()[0]!).getByText('3 stops · 2.4 km · 150 min')).toBeTruthy();
    expect(within(cards()[0]!).getByText('Easy')).toBeTruthy();
    expect(within(cards()[0]!).getByText('Download first')).toBeTruthy();
  });

  it('thẻ mở chi tiết tuyến; có liên kết Gợi ý tuyến', async () => {
    const { router } = await renderM01('/');
    expect((await screen.findByRole('link', { name: 'Gợi ý tuyến' })).getAttribute('href')).toBe('/recommend');
    fireEvent.click(await screen.findByRole('link', { name: /Tuyến thử Ao Hồ/ }));
    expect(router.state.location.pathname).toBe('/routes/route-b');
  });

  it('ảnh thumbnail lỗi → placeholder trung tính, thẻ vẫn bấm được (US-M01-02 mục 4)', async () => {
    await renderM01('/');
    const link = await screen.findByRole('link', { name: /Tuyến thử Bách Thảo/ });
    // Ảnh trang trí (alt="") nên không có role img; lấy theo thẻ
    await vi.waitFor(() => expect(link.querySelector('img')).not.toBeNull());
    fireEvent.error(link.querySelector('img')!);
    expect(link.querySelector('img')).toBeNull();
    expect(within(link).getByTestId('thumbnail-placeholder')).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/routes/route-a');
  });

  it('Loading: vùng danh sách báo đang tải', async () => {
    const fake = createFakeSource();
    fake.controls.setDelayMs(200);
    await renderM01('/', { fake });
    expect((await screen.findByTestId('catalog-list')).getAttribute('aria-busy')).toBe('true');
    await screen.findByRole('link', { name: /Tuyến thử Ao Hồ/ });
    expect(screen.getByTestId('catalog-list').getAttribute('aria-busy')).toBe('false');
  });

  it('Empty: nguồn trả về nhưng không có tuyến chọn được', async () => {
    const fake = createFakeSource();
    fake.controls.setRouteStatus('route-a', 'LUU_TRU');
    fake.controls.setRouteStatus('route-b', 'TAM_DONG');
    await renderM01('/', { fake });
    expect(await screen.findByText('Hiện chưa có tuyến nào để chọn.')).toBeTruthy();
  });

  it('Source unavailable: mở lạnh không có nguồn; vẫn vào được /offline', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    await renderM01('/', { fake });
    expect(
      await screen.findByText('Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.'),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Tài nguyên offline' }).getAttribute('href')).toBe('/offline');
  });

  it('Stale/offline: đã có local view, làm mới lỗi → giữ danh sách kèm nhãn dữ liệu cũ', async () => {
    const fake = createFakeSource();
    const { router } = await renderM01('/', { fake });
    await screen.findByRole('link', { name: /Tuyến thử Ao Hồ/ });
    fake.controls.setUnavailable(true);
    await router.navigate('/offline');
    await screen.findByRole('heading', { level: 1, name: 'Quản lý tài nguyên offline' });
    await router.navigate('/');
    expect(await screen.findByText('Dữ liệu đã lưu, có thể chưa phải bản mới nhất.')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeTruthy();
  });

  it('Route removed: làm mới thấy A TAM_DONG → A biến mất khỏi danh sách (US-M01-05)', async () => {
    const fake = createFakeSource();
    const { router } = await renderM01('/', { fake });
    await screen.findByRole('link', { name: /Tuyến thử Bách Thảo/ });
    fake.controls.setRouteStatus('route-a', 'TAM_DONG');
    await router.navigate('/offline');
    await screen.findByRole('heading', { level: 1, name: 'Quản lý tài nguyên offline' });
    await router.navigate('/');
    await screen.findByRole('link', { name: /Tuyến thử Ao Hồ/ });
    await vi.waitFor(() => expect(screen.queryByRole('link', { name: /Tuyến thử Bách Thảo/ })).toBeNull());
  });
});
