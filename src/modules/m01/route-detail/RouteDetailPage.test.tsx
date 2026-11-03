// SCR-M01-003 Chi tiết tuyến (tasks T052; US-M01-06; visitor-ui-flow §2; screen spec §4).
import { Blob as NodeBlob } from 'node:buffer';
import { screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { createFakeSource } from '../api/fake/fakeSource';
import { formatCapturedAt } from '../format';
import { seedReadyPackage } from '../storage/testSeed';
import { packageFromPublication } from '../testing/packageFixture';
import { renderM01 } from '../testing/renderM01';

beforeAll(() => import('./RouteDetailPage'));

const CAPTURED_AT = '2026-11-01T03:00:00.000Z';

async function seedPackageA() {
  const { routes, snapshots } = publicationFixture();
  await seedReadyPackage(
    packageFromPublication(routes.A, snapshots.A, { capturedAt: CAPTURED_AT }),
    () => new NodeBlob([new Uint8Array([1])], { type: 'image/png' }) as unknown as Blob,
  );
}

describe('RouteDetailPage', () => {
  it('online: tên, thông tin, mô tả, điểm xuất phát, điểm dừng đánh số; cảnh báo an toàn nổi bật', async () => {
    await renderM01('/routes/route-a');
    expect(await screen.findByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeTruthy();
    expect(screen.getByText('2,4 km')).toBeTruthy();
    expect(screen.getByText('150 phút')).toBeTruthy();
    expect(screen.getByText('Nhẹ')).toBeTruthy();
    expect(screen.getByText('Mô tả đầy đủ tuyến A')).toBeTruthy();
    expect(screen.getByText('Cổng thử A')).toBeTruthy();
    const safety = screen.getByRole('note', { name: 'Cảnh báo an toàn' });
    expect(within(safety).getByText('Cảnh báo an toàn tuyến A')).toBeTruthy();
    const stops = screen.getByRole('list', { name: 'Các điểm dừng' });
    expect(within(stops).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '1Điểm thử A1',
      '2Điểm thử A2',
      '3Điểm thử A3',
    ]);
    expect(screen.getByText('Cần tải trước')).toBeTruthy();
  });

  it('trường tùy chọn vắng không có mục (V8: không có Thời điểm phù hợp)', async () => {
    await renderM01('/routes/route-a');
    await screen.findByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' });
    expect(screen.queryByText('Thời điểm phù hợp')).toBeNull();
    expect(screen.queryByText('Cần chuẩn bị')).toBeNull();
  });

  it('gallery: ảnh đầu là ảnh bìa; sơ đồ tuyến online', async () => {
    await renderM01('/routes/route-a');
    await screen.findByRole('heading', { level: 1 });
    const gallery = await screen.findByTestId('gallery');
    // Ảnh không chú thích là ảnh trang trí (alt=""), nên lấy theo thẻ
    await vi.waitFor(() => expect(gallery.querySelectorAll('img').length).toBe(2));
    expect(gallery.querySelector('img')!.getAttribute('src')).toBe('fake://quest-media/fixture/a-thumb.png');
    expect(await screen.findByRole('img', { name: 'Sơ đồ tuyến' })).toBeTruthy();
  });

  it('offline có gói: chữ cốt lõi đã lưu + câu "Thông tin được lưu lúc …"; ảnh chưa lưu → placeholder', async () => {
    await seedPackageA();
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    await renderM01('/routes/route-a', { fake });
    expect(await screen.findByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeTruthy();
    expect(
      screen.getByText(`Thông tin được lưu lúc ${formatCapturedAt(CAPTURED_AT, 'vi')}, có thể không phải bản mới nhất`),
    ).toBeTruthy();
    expect(screen.getByText('Chưa tải được thông tin mới. Đang hiển thị thông tin đã lưu.')).toBeTruthy();
    expect(screen.getByText('Cổng thử A')).toBeTruthy();
    expect(screen.getByText('Yêu cầu tuyến A')).toBeTruthy();
    expect(screen.queryByText('Mô tả đầy đủ tuyến A')).toBeNull();
    expect(screen.getByTestId('cover-placeholder')).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Các điểm dừng' })).getAllByRole('listitem')).toHaveLength(3);
  });

  it('nguồn lỗi, không có gói nhưng có local view danh mục → hiện thông tin hiện có, không khẳng định mới nhất', async () => {
    const fake = createFakeSource();
    const { router } = await renderM01('/', { fake });
    await screen.findByRole('link', { name: /Tuyến thử Ao Hồ/ });
    fake.controls.setUnavailable(true);
    await router.navigate('/routes/route-b');
    expect(await screen.findByRole('heading', { level: 1, name: 'Tuyến thử Ao Hồ' })).toBeTruthy();
    expect(screen.getByText('Chưa tải được thông tin mới. Đang hiển thị thông tin đã lưu.')).toBeTruthy();
  });

  it('nguồn lỗi, không có gói, không có local view → không đọc được nguồn', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    await renderM01('/routes/route-b', { fake });
    expect(await screen.findByText('Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại.')).toBeTruthy();
  });

  it('tuyến không còn HOAT_DONG → "Tuyến này hiện không nhận chuyến mới."', async () => {
    const fake = createFakeSource();
    fake.controls.setRouteStatus('route-a', 'TAM_DONG');
    await renderM01('/routes/route-a', { fake });
    expect(await screen.findByText('Tuyến này hiện không nhận chuyến mới.')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeTruthy();
  });

  it('tiếng Anh: nhãn và giá trị theo en', async () => {
    await renderM01('/routes/route-a', { language: 'en' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Test Botanic trail' })).toBeTruthy();
    expect(screen.getByText('2.4 km')).toBeTruthy();
    expect(screen.getByText('150 min')).toBeTruthy();
    expect(screen.getByRole('note', { name: 'Safety warning' })).toBeTruthy();
  });
});

describe('RouteDetailPage — Bắt đầu (US4, T065)', () => {
  it('Start B online → ghi context v3 rồi điều hướng /trip', async () => {
    const { router } = await renderM01('/routes/route-b');
    const start = await screen.findByRole('button', { name: 'Bắt đầu' });
    start.click();
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/trip'));
    const read = await (await import('../storage/readers')).readSelectedRouteContext();
    expect(read.kind === 'OK' && read.value.routeId).toBe('route-b');
  });

  it('offline, không có gói → chặn Start với lý do, không điều hướng', async () => {
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    const { router } = await renderM01('/routes/route-a', { fake });
    (await screen.findByRole('button', { name: 'Bắt đầu' })).click();
    expect(
      await screen.findByText('Chưa bắt đầu được vì không có mạng và tuyến này chưa được tải trước.'),
    ).toBeTruthy();
    expect(router.state.location.pathname).toBe('/routes/route-a');
  });

  it('offline, gói A OUTDATED → cảnh báo gói cũ; Start dùng manifest của gói', async () => {
    const { routes, snapshots } = publicationFixture();
    await seedReadyPackage(
      packageFromPublication(routes.A, snapshots.A, { versionStatus: 'OUTDATED' }),
      () => new NodeBlob([new Uint8Array([1])], { type: 'image/png' }) as unknown as Blob,
    );
    const fake = createFakeSource();
    fake.controls.setUnavailable(true);
    const { router } = await renderM01('/routes/route-a', { fake });
    expect(await screen.findByText('Gói tải trước này đã cũ nhưng vẫn dùng được.')).toBeTruthy();
    (await screen.findByRole('button', { name: 'Bắt đầu' })).click();
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/trip'));
  });

  it('tuyến không còn khả dụng → không có nút Bắt đầu', async () => {
    const fake = createFakeSource();
    fake.controls.setRouteStatus('route-a', 'LUU_TRU');
    await renderM01('/routes/route-a', { fake });
    await screen.findByText('Tuyến này hiện không nhận chuyến mới.');
    expect(screen.queryByRole('button', { name: 'Bắt đầu' })).toBeNull();
  });
});

describe('RouteDetailPage — gói và quyết định offline (US6, T086)', () => {
  it('Bắt đầu trên A chưa có gói → dialog: tên điểm dừng OFFLINE_REQUIRED, "Chưa có thông tin dung lượng.", ba nút (V9)', async () => {
    await renderM01('/routes/route-a');
    (await screen.findByRole('button', { name: 'Bắt đầu' })).click();
    const dialog = await screen.findByRole('dialog', { name: 'Tuyến này nên tải trước' });
    expect(within(dialog).getByText(/Điểm thử A1, Điểm thử A2/)).toBeTruthy();
    expect(within(dialog).getByText('Chưa có thông tin dung lượng.')).toBeTruthy();
    expect(within(dialog).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tải về', 'Tiếp tục không tải', 'Quay lại']);
  });

  it('chọn Tải về → gói SAN_SANG, vùng gói hiện "Sẵn sàng – mới nhất" và dòng hướng dẫn quét; không tự Start', async () => {
    const { router } = await renderM01('/routes/route-a');
    (await screen.findByRole('button', { name: 'Bắt đầu' })).click();
    // Vùng gói cũng có nút "Tải về": bấm nút trong dialog
    within(await screen.findByRole('dialog')).getByRole('button', { name: 'Tải về' }).click();
    expect(await screen.findByText('Sẵn sàng – mới nhất')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText(/hãy quét mã bằng nút Quét trong ứng dụng/)).toBeTruthy();
    expect(router.state.location.pathname).toBe('/routes/route-a');
  });

  it('chọn Tiếp tục không tải → Start online; chọn Quay lại → không Start', async () => {
    const { router } = await renderM01('/routes/route-a');
    (await screen.findByRole('button', { name: 'Bắt đầu' })).click();
    (await screen.findByRole('button', { name: 'Quay lại' })).click();
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(router.state.location.pathname).toBe('/routes/route-a');
    (await screen.findByRole('button', { name: 'Bắt đầu' })).click();
    (await screen.findByRole('button', { name: 'Tiếp tục không tải' })).click();
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/trip'));
  });

  it('tuyến không cần gói (B) → Start không qua dialog', async () => {
    const { router } = await renderM01('/routes/route-b');
    (await screen.findByRole('button', { name: 'Bắt đầu' })).click();
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/trip'));
  });

  it('vùng gói: tuyến cần gói chưa tải → "Chưa tải" và Tải về; ảnh lỗi → "Tải chưa hoàn tất…" (V11)', async () => {
    const fake = createFakeSource();
    fake.controls.failImage('fixture/a2-1.png', 500);
    await renderM01('/routes/route-a', { fake });
    expect(await screen.findByText('Chưa tải')).toBeTruthy();
    within(screen.getByRole('region', { name: 'Gói tải trước' })).getByRole('button', { name: 'Tải về' }).click();
    expect(await screen.findByText('Tải chưa hoàn tất. Hãy thử tải lại.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tải lại' })).toBeTruthy();
  });

  it('có gói v1, nguồn v2: mở chi tiết online → tự dựng candidate và kích hoạt v2 (V13)', async () => {
    const fake = createFakeSource();
    const { routes, snapshots } = publicationFixture();
    await seedReadyPackage(packageFromPublication(routes.A, snapshots.A), () => new NodeBlob([new Uint8Array([1])], { type: 'image/png' }) as unknown as Blob);
    fake.controls.publishNextVersion('route-a');
    await renderM01('/routes/route-a', { fake });
    await vi.waitFor(async () => expect((await (await import('../storage/readers')).readActiveOfflinePackage('route-a'))?.contentVersion).toBe(2));
  });
});
