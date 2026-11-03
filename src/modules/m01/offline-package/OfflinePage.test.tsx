// SCR-M01-004 Quản lý tài nguyên offline (tasks T078; FR-M01-009; OQ-SCR-M01-004-002, 003).
import { Blob as NodeBlob } from 'node:buffer';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { publicationFixture } from '../../../shared/contracts/__fixtures__/publication';
import { formatCapturedAt } from '../format';
import { beginCandidate, failCandidate } from '../storage/packageWriter';
import { readActiveOfflinePackage } from '../storage/readers';
import { offlineResourcesTable } from '../storage/tables';
import { seedReadyPackage } from '../storage/testSeed';
import { packageFromPublication } from '../testing/packageFixture';
import { renderM01 } from '../testing/renderM01';

beforeAll(() => import('./OfflinePage'));

const CAPTURED_AT = '2026-11-01T03:00:00.000Z';
const blob = () => new NodeBlob([new Uint8Array([1])], { type: 'image/png' }) as unknown as Blob;

async function seedA(versionStatus: 'CURRENT' | 'OUTDATED' = 'CURRENT') {
  const { routes, snapshots } = publicationFixture();
  await seedReadyPackage(packageFromPublication(routes.A, snapshots.A, { versionStatus, capturedAt: CAPTURED_AT }), blob);
}

describe('OfflinePage', () => {
  it('Empty: chưa có gói', async () => {
    await renderM01('/offline');
    expect(await screen.findByText('Bạn chưa tải tuyến nào.')).toBeTruthy();
  });

  it('gói sẵn sàng: tên, version, trạng thái chữ, thời điểm lưu, có sơ đồ offline, dòng hướng dẫn quét', async () => {
    await seedA();
    await renderM01('/offline');
    const row = await screen.findByRole('listitem');
    expect(within(row).getByRole('heading', { name: 'Tuyến thử Bách Thảo' })).toBeTruthy();
    expect(within(row).getByText('Phiên bản 1')).toBeTruthy();
    expect(within(row).getByText('Sẵn sàng – mới nhất')).toBeTruthy();
    expect(within(row).getByText(`Thông tin tuyến lưu lúc ${formatCapturedAt(CAPTURED_AT, 'vi')}`)).toBeTruthy();
    expect(within(row).getByText('Có sơ đồ tuyến offline')).toBeTruthy();
    expect(within(row).getByRole('link', { name: 'Xem' }).getAttribute('href')).toBe('/routes/route-a');
    expect(screen.getByText(/hãy quét mã bằng nút Quét trong ứng dụng/)).toBeTruthy();
  });

  it('OUTDATED: trạng thái và cảnh báo cũ bằng chữ; có Cập nhật', async () => {
    await seedA('OUTDATED');
    await renderM01('/offline');
    const row = await screen.findByRole('listitem');
    expect(within(row).getByText('Sẵn sàng – có bản mới')).toBeTruthy();
    expect(within(row).getByText('Gói tải trước này đã cũ nhưng vẫn dùng được.')).toBeTruthy();
    expect(within(row).getByRole('button', { name: 'Cập nhật' })).toBeTruthy();
  });

  it('gói không đọc được → "Gói tải trước không đọc được" với Tải lại / Xóa (OQ-SCR-M01-004-003)', async () => {
    await seedA();
    await offlineResourcesTable.delete(['route-a', 1, 'qr-a1-2']);
    await renderM01('/offline');
    const row = await screen.findByRole('listitem');
    expect(within(row).getByText('Gói tải trước không đọc được')).toBeTruthy();
    expect(within(row).getByRole('button', { name: 'Tải lại' })).toBeTruthy();
    expect(within(row).getByRole('button', { name: 'Xóa' })).toBeTruthy();
  });

  it('CHUA_HOAN_TAT: "Chưa hoàn tất" và Tải lại', async () => {
    const token = await beginCandidate('route-a', 1);
    await failCandidate('route-a', token);
    await renderM01('/offline');
    const row = await screen.findByRole('listitem');
    expect(within(row).getByText('Chưa hoàn tất')).toBeTruthy();
    expect(within(row).getByRole('button', { name: 'Tải lại' })).toBeTruthy();
  });

  it('DANG_TAI: "Đang tải", không có nút Cancel hay hành động khác', async () => {
    await beginCandidate('route-a', 1);
    await renderM01('/offline');
    const row = await screen.findByRole('listitem');
    expect(within(row).getByText('Đang tải')).toBeTruthy();
    expect(within(row).queryAllByRole('button')).toEqual([]);
  });

  it('Xóa cần xác nhận: Giữ lại không đổi gì; Xóa xóa gói', async () => {
    await seedA();
    await renderM01('/offline');
    const row = await screen.findByRole('listitem');
    await userEvent.click(within(row).getByRole('button', { name: 'Xóa' }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Xóa gói tải trước của tuyến "Tuyến thử Bách Thảo"? Chuyến đi đang diễn ra không bị ảnh hưởng.'),
    ).toBeTruthy();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Giữ lại' }));
    expect(await readActiveOfflinePackage('route-a')).not.toBeNull();
    await userEvent.click(within(row).getByRole('button', { name: 'Xóa' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xóa' }));
    await vi.waitFor(async () => expect(await readActiveOfflinePackage('route-a')).toBeNull());
    expect(await screen.findByText('Bạn chưa tải tuyến nào.')).toBeTruthy();
  });
});
