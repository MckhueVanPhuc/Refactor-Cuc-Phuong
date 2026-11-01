// Hộp thoại lưu trữ (tasks T132; BR-M03-H09, T07, D10; SC-M03-031): lưu trữ tuyến chỉ khi Tạm đóng, terminal,
// không đổi điểm dừng nó liệt kê; lưu trữ điểm dừng còn được tuyến dùng → MSG-CHECKPOINT-IN-USE nêu tên tuyến.
import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { closeCheckpointAs, closeRouteAs, seedSharedCheckpoint } from '../testing/seedOperations';

// Dựng trang và gõ phím: khi cả bộ test chạy song song, một ca có thể vượt mặc định 5 s
const PAGE_TEST_TIMEOUT = 15_000;

beforeAll(() => Promise.all([import('../checkpoint-library/CheckpointEditorPage'), import('../route-admin/RouteListPage')]));

const confirmButton = () => within(screen.getByRole('dialog')).getByRole('button', { name: 'Lưu trữ' }) as HTMLButtonElement;

describe('ArchiveDialog (BR-M03-H09, T07, D10)', { timeout: PAGE_TEST_TIMEOUT }, () => {
  it('lưu trữ tuyến: chỉ có khi Tạm đóng; lý do bắt buộc; xong là Đã lưu trữ, điểm dừng không đổi', async () => {
    const store = new FakeStore();
    const { x, routeA, routeB } = await seedSharedCheckpoint(store);
    await closeRouteAs(store, 'CONTENT_STAFF', routeB);
    renderAdmin('/admin/routes', { store, signedInAs: 'REVIEWER' });
    const rowA = within(await screen.findByRole('row', { name: /Tuyến A/ }));
    expect(rowA.queryByRole('button', { name: 'Lưu trữ' })).toBeNull();

    await userEvent.click(within(screen.getByRole('row', { name: /Tuyến B/ })).getByRole('button', { name: 'Lưu trữ' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-ARCHIVE-ROUTE', { tên: 'Tuyến B' }));
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(dialog.getByLabelText('Lý do'), { target: { value: 'Tuyến không còn dùng' } });
    await userEvent.click(confirmButton());

    await waitFor(() => expect(within(screen.getByRole('row', { name: /Tuyến B/ })).getByText('Đã lưu trữ')).toBeTruthy());
    expect(store.state.routes.get(routeB)?.status).toBe('LUU_TRU');
    expect(store.state.routes.get(routeA)?.status).toBe('HOAT_DONG');
    expect(store.state.checkpoints.get(x.checkpointId)?.status).toBe('HOAT_DONG');
  });

  it('lưu trữ điểm dừng còn được tuyến dùng → MSG-CHECKPOINT-IN-USE nêu tên tuyến, vẫn Tạm đóng', async () => {
    const store = new FakeStore();
    const { x } = await seedSharedCheckpoint(store);
    await closeCheckpointAs(store, 'CONTENT_STAFF', x.checkpointId);
    renderAdmin(`/admin/checkpoints/${x.checkpointId}`, { store, signedInAs: 'REVIEWER' });
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    await userEvent.click(screen.getByRole('button', { name: 'Lưu trữ' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-ARCHIVE-CHECKPOINT', { tên: 'Hang Con Moong' }));
    fireEvent.change(dialog.getByLabelText('Lý do'), { target: { value: 'Không còn dùng' } });
    await userEvent.click(confirmButton());

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/^Chưa thể lưu trữ điểm dừng này vì tuyến (Tuyến A, Tuyến B|Tuyến B, Tuyến A) vẫn có trong danh sách/);
    expect(screen.getByText('Trạng thái: Tạm đóng')).toBeTruthy();
    expect(store.state.checkpoints.get(x.checkpointId)?.status).toBe('TAM_DONG');
  });
});
