import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { seedRoute, type SeedRoute } from '../testing/seedRoutes';

// Nạp sẵn chunk lazy của các màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() => Promise.all([import('./PublicationReviewPage'), import('../route-admin/RouteEditorPage')]));

const SAFETY_TICK = 'Tôi xác nhận tuyến không có cảnh báo an toàn cần nêu';

async function setup(change: Partial<SeedRoute> = {}, extraClosed = false) {
  const store = new FakeStore();
  const { checkpointId } = await seedCheckpoint(store, {
    name: 'Hang Con Moong',
    mode: 'OFFLINE_REQUIRED',
    visitPoints: [{ name: 'Cây chò', ready: true }],
    publish: true,
  });
  const ids = [checkpointId];
  if (extraClosed) {
    const closed = await seedCheckpoint(store, { name: 'Cây lim', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Lim', ready: true }], publish: true });
    ids.push(closed.checkpointId);
  }
  const { routeId } = await seedRoute(store, { complete: true, checkpointIds: ids, ...change });
  // Điểm dừng đóng sau khi đã vào danh sách: giữ vị trí nhưng không vào hành trình (BR-M03-T02)
  if (extraClosed) store.state.checkpoints.get(ids[1]!)!.status = 'TAM_DONG';
  const view = renderAdmin(`/admin/review/ROUTE_FIRST_PUBLICATION/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Xem lại & Xuất bản' });
  await screen.findByRole('button', { name: 'Quay lại sửa' });
  return { ...view, store, routeId };
}

async function confirmPublish() {
  await userEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Xuất bản' }));
}

describe('SCR-M03-004 xem lại & xuất bản — tuyến (BR-M03-C09, C10, F01–F03, G07, G10; SC-M03-002)', () => {
  it('thay đổi nhạy cảm (cảnh báo an toàn, yêu cầu tham gia, sơ đồ offline) được tô sáng', async () => {
    await setup({ content: { participationRequirements: { vi: 'Có hướng dẫn viên', en: 'Guide needed' } } });
    const sensitive = within(screen.getByRole('region', { name: 'Thay đổi cần chú ý' }));
    expect(sensitive.getByText('Cảnh báo an toàn (tiếng Việt)')).toBeTruthy();
    expect(sensitive.getByText('Yêu cầu và điều kiện tham gia (tiếng Anh)')).toBeTruthy();
    const row = within(screen.getByRole('table', { name: 'Thay đổi' })).getByRole('row', { name: /Cảnh báo an toàn \(tiếng Việt\)/ });
    expect(row.getAttribute('data-sensitive')).toBe('true');
  });

  it('cảnh báo an toàn trống: phải tick xác nhận mới bấm Xuất bản được; tick được lưu', async () => {
    const { store, routeId } = await setup({ content: { safetyWarning: {} } });
    const publish = screen.getByRole('button', { name: 'Xuất bản' }) as HTMLButtonElement;
    expect(publish.disabled).toBe(true);
    await userEvent.click(screen.getByLabelText(SAFETY_TICK));
    expect(publish.disabled).toBe(false);
    await confirmPublish();
    await waitFor(() => expect(store.state.routes.get(routeId)?.status).toBe('HOAT_DONG'));
  });

  it('có cảnh báo an toàn thì không có tick', async () => {
    await setup();
    expect(screen.queryByLabelText(SAFETY_TICK)).toBeNull();
  });

  it('hiện dung lượng gói tải trước ước tính của tuyến', async () => {
    await setup();
    const affected = within(screen.getByRole('region', { name: 'Tuyến bị ảnh hưởng' }));
    expect(affected.getByText('Đường lên Mả Tổ')).toBeTruthy();
    expect(affected.getByText(/^Gói tải trước ước tính: [\d,]+ MB$/)).toBeTruthy();
  });

  it('điểm dừng đang tạm đóng bị loại khỏi hành trình: MSG-CHECKPOINT-LEFT-OUT', async () => {
    await setup({}, true);
    expect(screen.getByText(formatMessage('MSG-CHECKPOINT-LEFT-OUT', { tên: 'Cây lim' }))).toBeTruthy();
  });

  it('xuất bản xong: Đang hoạt động, về editor với MSG-PUBLISHED', async () => {
    const { store, routeId, router } = await setup();
    await confirmPublish();
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/routes/${routeId}`));
    expect(await screen.findByText(formatMessage('MSG-PUBLISHED'))).toBeTruthy();
    expect(store.state.routes.get(routeId)?.status).toBe('HOAT_DONG');
    expect(store.state.routes.get(routeId)?.activeContentVersion).toBe(1);
  });

  it('lỗi khi xuất bản → MSG-PUBLISH-FAILED; dữ liệu công khai không đổi (BR-M03-G07)', async () => {
    const { store, routeId } = await setup();
    store.failNext('PUBLISHED', 'MSG-PUBLISH-FAILED');
    await confirmPublish();
    expect((await screen.findByRole('alert')).textContent).toBe(formatMessage('MSG-PUBLISH-FAILED'));
    expect(store.state.routes.get(routeId)?.status).toBe('NHAP');
    expect(store.state.snapshots.size).toBe(0);
  });

  it('còn thiếu sót → liệt kê và không xuất bản gì (BR-M03-F01)', async () => {
    const { store, routeId } = await setup({ complete: false });
    expect(within(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' })).getByText('Còn thiếu: Ảnh đại diện.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Xuất bản' }) as HTMLButtonElement).disabled).toBe(true);
    expect(store.state.routes.get(routeId)?.status).toBe('NHAP');
  });
});
