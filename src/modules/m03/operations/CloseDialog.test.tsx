// Hộp thoại đóng tạm (tasks T130; BR-M03-H01, H04): lý do bắt buộc ≤ NOTE_MAX_CHARS; với điểm dừng nêu các tuyến
// liệt kê nó và các tuyến sẽ tự đóng (Q-09); đóng lỗi → MSG-CLOSE-FAILED + "Đóng tạm các tuyến liên quan" (C-11);
// không bao giờ báo thành công giả.
import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import { NOTE_MAX_CHARS } from '../config/limits';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { closeRouteAs, seedSharedCheckpoint } from '../testing/seedOperations';

// Dựng trang và gõ phím: khi cả bộ test chạy song song, một ca có thể vượt mặc định 5 s
const PAGE_TEST_TIMEOUT = 15_000;

beforeAll(() => Promise.all([import('../checkpoint-library/CheckpointEditorPage'), import('../route-admin/RouteListPage')]));

async function openCheckpoint(store: FakeStore, checkpointId: string) {
  renderAdmin(`/admin/checkpoints/${checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
}

const confirmButton = (name: string) => within(screen.getByRole('dialog')).getByRole('button', { name }) as HTMLButtonElement;

describe('CloseDialog (BR-M03-H01, H04)', { timeout: PAGE_TEST_TIMEOUT }, () => {
  it('đóng điểm dừng: nêu mọi tuyến liệt kê nó và tuyến sẽ tự đóng; lý do bắt buộc và ≤ giới hạn', async () => {
    const store = new FakeStore();
    const { x } = await seedSharedCheckpoint(store);
    await openCheckpoint(store, x.checkpointId);
    await userEvent.click(screen.getByRole('button', { name: 'Đóng tạm' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CLOSE-AFFECTS-ROUTES', { số: 2, 'danh sách': 'Tuyến A, Tuyến B' }));
    expect(dialog.getByText(formatMessage('MSG-CLOSE-ROUTE-AUTO', { 'danh sách': 'Tuyến A' }))).toBeTruthy();
    expect(dialog.getAllByRole('button')).toHaveLength(2);
    expect(confirmButton('Đóng tạm').disabled).toBe(true);

    fireEvent.change(dialog.getByLabelText('Lý do'), { target: { value: 'a'.repeat(NOTE_MAX_CHARS + 1) } });
    expect(confirmButton('Đóng tạm').disabled).toBe(true);
    fireEvent.change(dialog.getByLabelText('Lý do'), { target: { value: 'Sạt lở sau mưa' } });
    await userEvent.click(confirmButton('Đóng tạm'));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await screen.findByText('Trạng thái: Tạm đóng')).toBeTruthy();
    expect(store.state.checkpoints.get(x.checkpointId)?.status).toBe('TAM_DONG');
  });

  it('đóng lỗi → MSG-CLOSE-FAILED, không báo thành công; "Đóng tạm các tuyến liên quan" đóng các tuyến, điểm dừng vẫn hoạt động', async () => {
    const store = new FakeStore();
    const { x, routeA, routeB } = await seedSharedCheckpoint(store);
    await openCheckpoint(store, x.checkpointId);
    store.failNext('CHECKPOINT_CLOSED', 'MSG-CLOSE-FAILED');
    await userEvent.click(screen.getByRole('button', { name: 'Đóng tạm' }));
    fireEvent.change(within(await screen.findByRole('dialog')).getByLabelText('Lý do'), { target: { value: 'Sạt lở' } });
    await userEvent.click(confirmButton('Đóng tạm'));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(formatMessage('MSG-CLOSE-FAILED'));
    expect(screen.getByText('Trạng thái: Đang hoạt động')).toBeTruthy();
    expect(store.state.checkpoints.get(x.checkpointId)?.status).toBe('HOAT_DONG');

    await userEvent.click(within(alert).getByRole('button', { name: 'Đóng tạm các tuyến liên quan' }));
    await waitFor(() => expect(store.state.routes.get(routeA)?.status).toBe('TAM_DONG'));
    expect(store.state.routes.get(routeB)?.status).toBe('TAM_DONG');
    expect(store.state.checkpoints.get(x.checkpointId)?.status).toBe('HOAT_DONG');
    await waitFor(() => expect(screen.queryByText(formatMessage('MSG-CLOSE-FAILED'))).toBeNull());
  });

  it('điểm dừng chưa có trong tuyến nào: câu MSG-CLOSE-NO-ROUTES, không có câu tuyến tự đóng (spec-M03 3.7 clarification 9)', async () => {
    const store = new FakeStore();
    const { checkpointId } = await seedCheckpoint(store, { name: 'Cây Chò Ngàn Năm', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
    renderAdmin(`/admin/checkpoints/${checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Cây Chò Ngàn Năm' });
    await userEvent.click(screen.getByRole('button', { name: 'Đóng tạm' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CLOSE-NO-ROUTES'));
    expect(dialog.queryByText(/tự đóng tạm/)).toBeNull();
    fireEvent.change(dialog.getByLabelText('Lý do'), { target: { value: 'Cây đổ' } });
    await userEvent.click(confirmButton('Đóng tạm'));
    expect(await screen.findByText('Trạng thái: Tạm đóng')).toBeTruthy();
  });

  it('người khác đóng tuyến trong lúc hộp thoại đang mở → MSG-STALE kèm "Tải lại", không đổi gì thêm (BR-M03-F06, L05; validation-report D-51)', async () => {
    const store = new FakeStore();
    const { routeB } = await seedSharedCheckpoint(store);
    renderAdmin('/admin/routes', { store, signedInAs: 'CONTENT_STAFF' });
    const row = within(await screen.findByRole('row', { name: /Tuyến B/ }));
    await userEvent.click(row.getByRole('button', { name: 'Đóng tạm' }));
    const dialog = within(await screen.findByRole('dialog'));
    fireEvent.change(dialog.getByLabelText('Lý do'), { target: { value: 'Cây đổ chắn lối' } });
    // Đợi hộp thoại đọc xong phiên bản đang thấy rồi mới để phiên khác đóng tuyến
    await waitFor(() => expect(confirmButton('Đóng tạm').disabled).toBe(false));
    await closeRouteAs(store, 'REVIEWER', routeB);
    await userEvent.click(confirmButton('Đóng tạm'));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/^reviewer@example\.test vừa sửa mục này lúc \d{2}:\d{2}\./);
    await userEvent.click(within(alert).getByRole('button', { name: 'Tải lại' }));
    await waitFor(() => expect(within(screen.getByRole('row', { name: /Tuyến B/ })).getByText('Tạm đóng')).toBeTruthy());
    expect(store.audit.filter((row) => row.action === 'ROUTE_CLOSED').map((row) => row.result)).toEqual(['SUCCESS', 'FAILURE']);
  });

  it('đóng tuyến từ danh sách: câu MSG-CONFIRM-CLOSE-ROUTE, lý do, xong thì dòng hiện "Tạm đóng"', async () => {
    const store = new FakeStore();
    const { routeB } = await seedSharedCheckpoint(store);
    renderAdmin('/admin/routes', { store, signedInAs: 'CONTENT_STAFF' });
    const row = within(await screen.findByRole('row', { name: /Tuyến B/ }));
    await userEvent.click(row.getByRole('button', { name: 'Đóng tạm' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-CLOSE-ROUTE', { tên: 'Tuyến B' }));
    fireEvent.change(dialog.getByLabelText('Lý do'), { target: { value: 'Cây đổ chắn lối' } });
    await userEvent.click(confirmButton('Đóng tạm'));

    await waitFor(() => expect(within(screen.getByRole('row', { name: /Tuyến B/ })).getByText('Tạm đóng')).toBeTruthy());
    expect(store.state.routes.get(routeB)).toMatchObject({ status: 'TAM_DONG', closureSource: 'MANUAL' });
  });
});
