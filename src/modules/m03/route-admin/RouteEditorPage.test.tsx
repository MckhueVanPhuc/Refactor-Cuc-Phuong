import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { syntheticFile } from '../api/contract/harness';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { HINTS } from '../messages/hints';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { seedRoute } from '../testing/seedRoutes';

// Nạp sẵn chunk lazy của màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() => Promise.all([import('./RouteEditorPage'), import('./RouteListPage')]));

async function publishedCheckpoint(store: FakeStore, name: string, mode: 'OFFLINE_REQUIRED' | 'ONLINE_AVAILABLE' = 'OFFLINE_REQUIRED') {
  const { checkpointId } = await seedCheckpoint(store, { name, mode, visitPoints: [{ name: `Vật ở ${name}`, ready: true }], publish: true });
  return checkpointId;
}

async function openRoute(store: FakeStore, routeId: string) {
  const view = renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1 });
  await screen.findByRole('button', { name: 'Lưu bản nháp' });
  return view;
}

const step = (name: RegExp) => userEvent.click(screen.getByRole('button', { name }));

const listNames = () =>
  within(screen.getByRole('list', { name: 'Điểm dừng của tuyến' }))
    .getAllByRole('listitem')
    .map((item) => item.getAttribute('data-name'));

describe('SCR-M03-002 biên tập tuyến (BR-M03-B01, C01, C03, C07, C08, C16, T01, T02, L01)', () => {
  it('tuyến mới lưu được dù thiếu nội dung; panel liệt kê khoảng trống; không có ô identifier', async () => {
    const { router } = renderAdmin('/admin/routes/new', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    const panel = within(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' }));
    expect(panel.getByText('Còn thiếu: Tên tuyến.')).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Tên tuyến (tiếng Việt)'), 'Đường lên Mả Tổ');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/admin\/routes\/[A-Za-z0-9]+$/));
    expect(await screen.findByText(formatMessage('MSG-SAVED'))).toBeTruthy();
    const keys = screen.getAllByRole('textbox').map((input) => input.getAttribute('data-field-key') ?? '');
    expect(keys.some((key) => /routeId|identifier/i.test(key))).toBe(false);
  });

  it('tuyến mới: chọn ảnh trước lần lưu đầu, một lần "Lưu bản nháp" tạo tuyến kèm ảnh (validation-report D-25)', async () => {
    const { store, router } = renderAdmin('/admin/routes/new', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    await userEvent.type(screen.getByLabelText('Tên tuyến (tiếng Việt)'), 'Đường lên Mả Tổ');
    await userEvent.upload(screen.getByLabelText('Ảnh đại diện'), syntheticFile('dai-dien.jpg', 'image/jpeg', 1024));
    await userEvent.click(await screen.findByLabelText('Xác nhận quyền sử dụng — dai-dien.jpg'));
    // Chưa tải gì lên trước khi lưu
    expect(store.storage.size).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/admin\/routes\/[A-Za-z0-9]+$/));
    expect(await screen.findByText(formatMessage('MSG-SAVED'))).toBeTruthy();
    const [route] = [...store.state.routes.values()];
    const media = [...store.state.media.values()];
    expect(media).toEqual([expect.objectContaining({ ownerId: route!.routeId, usage: 'ROUTE_THUMBNAIL', usageRightsConfirmed: true })]);
    expect(within(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' })).queryByText('Còn thiếu: Ảnh đại diện.')).toBeNull();
  });

  it('tuyến mới: ảnh sai định dạng hoặc quá cỡ bị từ chối ngay khi chọn', async () => {
    renderAdmin('/admin/routes/new', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    await userEvent.upload(screen.getByLabelText('Ảnh đại diện'), syntheticFile('qua-co.jpg', 'image/jpeg', 2 * 1_048_576 + 1));
    expect(await screen.findByText(/^Ảnh "qua-co\.jpg" nặng /)).toBeTruthy();
    expect(screen.queryByLabelText('Xác nhận quyền sử dụng — qua-co.jpg')).toBeNull();
  });

  it('tuyến mới: ảnh tải lỗi lúc lưu → tuyến vẫn được tạo, MSG-UPLOAD-SUMMARY nêu tệp lỗi', async () => {
    const store = new FakeStore();
    store.failNext('MEDIA_REGISTERED');
    renderAdmin('/admin/routes/new', { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    await userEvent.upload(screen.getByLabelText('Ảnh đại diện'), syntheticFile('dai-dien.jpg', 'image/jpeg', 1024));
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(await screen.findByText(formatMessage('MSG-UPLOAD-SUMMARY', { số: 0, tổng: 1, 'danh sách': 'dai-dien.jpg' }))).toBeTruthy();
    expect(store.state.routes.size).toBe(1);
  });

  it('bốn bước; nhãn thời gian chỉ đọc, suy từ thời lượng (BR-M03-C11)', async () => {
    renderAdmin('/admin/routes/new', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    for (const name of [/Thẻ tuyến/, /Chi tiết/, /Nhãn/, /Điểm dừng/]) expect(screen.getByRole('button', { name })).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Thời lượng dự kiến (phút)'), '200');
    await step(/Nhãn/);
    expect(screen.getByText('Nhãn thời gian: Dài')).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: /Dài|Ngắn|Vừa/ })).toBeNull();
  });

  it('câu gợi ý dưới các trường theo §5.5; cảnh báo an toàn nhắc dùng Đóng tạm (BR-M03-C07, C08)', async () => {
    renderAdmin('/admin/routes/new', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    await step(/Chi tiết/);
    for (const hint of [HINTS.participationRequirements, HINTS.preparation, HINTS.bestTime, HINTS.safetyWarning]) {
      expect(screen.getByText(hint)).toBeTruthy();
    }
  });

  it('Khó + "Gia đình có trẻ nhỏ" bị chặn khi lưu với MSG-TAG-CONFLICT (BR-M03-C12)', async () => {
    renderAdmin('/admin/routes/new', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    await userEvent.selectOptions(screen.getByLabelText('Độ khó'), 'Khó');
    await step(/Nhãn/);
    await userEvent.click(screen.getByLabelText('Gia đình có trẻ nhỏ'));
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(
      (await screen.findAllByText(/Tuyến độ khó Khó không thể gắn nhãn Gia đình có trẻ nhỏ\. Hãy đổi độ khó hoặc bỏ nhãn\./)).length,
    ).toBeGreaterThan(0);
  });

  it('bước 4 chỉ hiện điểm dừng đang hoạt động kèm tên, mode, số điểm tham quan, tuyến khác (BR-M03-T01)', async () => {
    const store = new FakeStore();
    const active = await publishedCheckpoint(store, 'Hang Con Moong');
    await seedCheckpoint(store, { name: 'Vườn nháp' });
    await seedRoute(store, { checkpointIds: [active], content: { name: { vi: 'Tuyến khác' } } });
    const { routeId } = await seedRoute(store);
    await openRoute(store, routeId);
    await step(/Điểm dừng/);
    const picker = within(await screen.findByRole('table', { name: 'Điểm dừng chọn được' }));
    const row = await picker.findByRole('row', { name: /Hang Con Moong/ });
    expect(within(row).getByText('Cần tải trước')).toBeTruthy();
    expect(within(row).getByText('1')).toBeTruthy();
    expect(within(row).getByText('Tuyến khác')).toBeTruthy();
    expect(picker.queryByText('Vườn nháp')).toBeNull();
    await userEvent.click(within(row).getByRole('button', { name: 'Thêm' }));
    expect(listNames()).toEqual(['Hang Con Moong']);
    expect((within(row).getByRole('button', { name: 'Thêm' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('sắp xếp bằng nút lên/xuống và kéo-thả; vị trí là thứ tự của tuyến (BR-M03-T02)', async () => {
    const store = new FakeStore();
    const a = await publishedCheckpoint(store, 'A');
    const b = await publishedCheckpoint(store, 'B');
    const c = await publishedCheckpoint(store, 'C');
    const { routeId } = await seedRoute(store, { checkpointIds: [a, b, c] });
    await openRoute(store, routeId);
    await step(/Điểm dừng/);
    expect(listNames()).toEqual(['A', 'B', 'C']);
    await userEvent.click(screen.getByRole('button', { name: 'Đưa "C" lên' }));
    expect(listNames()).toEqual(['A', 'C', 'B']);
    await userEvent.click(screen.getByRole('button', { name: 'Đưa "A" xuống' }));
    expect(listNames()).toEqual(['C', 'A', 'B']);

    const items = within(screen.getByRole('list', { name: 'Điểm dừng của tuyến' })).getAllByRole('listitem');
    fireEvent.dragStart(items[2]!);
    fireEvent.dragOver(items[0]!);
    fireEvent.drop(items[0]!);
    expect(listNames()).toEqual(['B', 'C', 'A']);
  });

  it('điểm dừng đang tạm đóng giữ vị trí và được đánh dấu', async () => {
    const store = new FakeStore();
    const a = await publishedCheckpoint(store, 'A');
    const b = await publishedCheckpoint(store, 'B');
    const { routeId } = await seedRoute(store, { checkpointIds: [a, b] });
    store.state.checkpoints.get(a)!.status = 'TAM_DONG';
    await openRoute(store, routeId);
    await step(/Điểm dừng/);
    expect(listNames()).toEqual(['A', 'B']);
    const items = within(screen.getByRole('list', { name: 'Điểm dừng của tuyến' })).getAllByRole('listitem');
    expect(within(items[0]!).getByText('Tạm đóng')).toBeTruthy();
  });

  it('xóa sơ đồ khi tick "dùng khi không có mạng" đang bật → tick tự bỏ + MSG-MAP-TICK-CLEARED (BR-M03-C16)', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { map: 'offline' });
    await openRoute(store, routeId);
    await step(/Chi tiết/);
    const tick = screen.getByLabelText('Sơ đồ này cần để định hướng khi không có mạng') as HTMLInputElement;
    expect(tick.checked).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Bỏ ảnh sơ đồ tuyến' }));
    expect(screen.getByText(formatMessage('MSG-MAP-TICK-CLEARED'))).toBeTruthy();
    expect(screen.queryByLabelText('Sơ đồ này cần để định hướng khi không có mạng')).toBeNull();
  });

  it('bấm một dòng ở panel thì chuyển tới đúng bước', async () => {
    renderAdmin('/admin/routes/new', { signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Tuyến mới' });
    const panel = within(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' }));
    await userEvent.click(panel.getByText('Còn thiếu: Nhóm đối tượng.'));
    expect(screen.getByRole('button', { name: /Nhãn/ }).getAttribute('aria-current')).toBe('step');
  });

  it('hủy tuyến chưa từng xuất bản: lý do + MSG-CONFIRM-DISCARD-ROUTE → Đã lưu trữ; điểm dừng không đổi (BR-M03-C01)', async () => {
    const store = new FakeStore();
    const a = await publishedCheckpoint(store, 'A');
    const { routeId } = await seedRoute(store, { checkpointIds: [a], content: { name: { vi: 'Đường lên Mả Tổ' } } });
    const { router } = await openRoute(store, routeId);
    await userEvent.click(screen.getByRole('button', { name: 'Hủy tuyến' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-DISCARD-ROUTE', { tên: 'Đường lên Mả Tổ' }));
    const confirm = dialog.getByRole('button', { name: 'Hủy tuyến' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await userEvent.type(dialog.getByLabelText('Lý do'), 'Tạo nhầm');
    await userEvent.click(confirm);
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/routes'));
    expect(store.state.routes.get(routeId)?.status).toBe('LUU_TRU');
    expect(store.state.checkpoints.get(a)?.status).toBe('HOAT_DONG');
  });
});

describe('SCR-M03-001 quản trị tuyến', () => {
  it('danh sách: tên bản nháp, trạng thái bằng tên hiển thị, lần sửa cuối; Hủy ngay trên dòng', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { content: { name: { vi: 'Đường lên Mả Tổ' } } });
    renderAdmin('/admin/routes', { store, signedInAs: 'CONTENT_STAFF' });
    const row = await screen.findByRole('row', { name: /Đường lên Mả Tổ/ });
    expect(within(row).getByText('Nháp')).toBeTruthy();
    expect(within(row).getByText(/staff@example\.test/)).toBeTruthy();
    await userEvent.click(within(row).getByRole('button', { name: 'Hủy' }));
    const dialog = within(screen.getByRole('dialog'));
    await userEvent.type(dialog.getByLabelText('Lý do'), 'Tạo nhầm');
    await userEvent.click(dialog.getByRole('button', { name: 'Hủy tuyến' }));
    await waitFor(() => expect(store.state.routes.get(routeId)?.status).toBe('LUU_TRU'));
    expect(await within(await screen.findByRole('row', { name: /Đường lên Mả Tổ/ })).findByText('Đã lưu trữ')).toBeTruthy();
  });

  it('chưa có tuyến → lời mời tạo tuyến', async () => {
    renderAdmin('/admin/routes', { signedInAs: 'CONTENT_STAFF' });
    expect(await screen.findByText('Chưa có tuyến nào. Bấm "Tạo tuyến" để bắt đầu.')).toBeTruthy();
  });
});
