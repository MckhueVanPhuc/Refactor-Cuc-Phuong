// Hộp thoại mở lại (tasks T131; BR-M03-H06, H07, A03, G10): chỉ Quản lý; ghi chú xác nhận an toàn bắt buộc;
// kiểm tra kỹ thuật không đạt → MSG-REOPEN-BLOCKED kèm danh sách cần sửa; vượt trần → MSG-OFFLINE-TOO-BIG;
// Nhân viên → MSG-NO-PERMISSION.
import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminServicesProvider } from '../api/AdminApiProvider';
import { createFakeServices } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { closeCheckpointAs, seedSharedCheckpoint } from '../testing/seedOperations';
import { ReopenDialog } from './ReopenDialog';

// Dựng trang và gõ phím: khi cả bộ test chạy song song, một ca có thể vượt mặc định 5 s
const PAGE_TEST_TIMEOUT = 15_000;

beforeAll(() => Promise.all([import('../checkpoint-library/CheckpointEditorPage'), import('../route-admin/RouteListPage')]));

const NOTE_LABEL = 'Ghi chú xác nhận an toàn';
const confirmButton = () => within(screen.getByRole('dialog')).getByRole('button', { name: 'Mở lại' }) as HTMLButtonElement;

async function closedScenario() {
  const store = new FakeStore();
  const seeded = await seedSharedCheckpoint(store);
  await closeCheckpointAs(store, 'CONTENT_STAFF', seeded.x.checkpointId);
  return { store, ...seeded };
}

describe('ReopenDialog (BR-M03-H06, H07, A03)', { timeout: PAGE_TEST_TIMEOUT }, () => {
  it('mở lại điểm dừng: câu nêu các tuyến, ghi chú bắt buộc; tuyến đã tự đóng vẫn đóng', async () => {
    const { store, x, routeA } = await closedScenario();
    renderAdmin(`/admin/checkpoints/${x.checkpointId}`, { store, signedInAs: 'REVIEWER' });
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    await userEvent.click(screen.getByRole('button', { name: 'Mở lại' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(
      formatMessage('MSG-CONFIRM-REOPEN-CHECKPOINT', { tên: 'Hang Con Moong', 'danh sách': 'Tuyến A, Tuyến B' }),
    );
    expect(confirmButton().disabled).toBe(true);
    fireEvent.change(dialog.getByLabelText(NOTE_LABEL), { target: { value: 'Đã kiểm tra lại đường đi' } });
    await userEvent.click(confirmButton());

    expect(await screen.findByText('Trạng thái: Đang hoạt động')).toBeTruthy();
    expect(store.state.routes.get(routeA)?.status).toBe('TAM_DONG');
  });

  it('tuyến không còn điểm dừng hoạt động: MSG-REOPEN-BLOCKED kèm danh sách cần sửa, không mở lại được', async () => {
    const { store, routeA } = await closedScenario();
    renderAdmin('/admin/routes', { store, signedInAs: 'REVIEWER' });
    const row = within(await screen.findByRole('row', { name: /Tuyến A/ }));
    await userEvent.click(row.getByRole('button', { name: 'Mở lại' }));

    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-REOPEN-ROUTE', { tên: 'Tuyến A' }));
    const blocked = await dialog.findByText(/^Chưa mở lại được\. Cần xử lý trước: /);
    expect(blocked.textContent).toContain(formatMessage('MSG-NO-ACTIVE-CHECKPOINT'));
    fireEvent.change(dialog.getByLabelText(NOTE_LABEL), { target: { value: 'Đã kiểm tra' } });
    expect(confirmButton().disabled).toBe(true);
    expect(store.state.routes.get(routeA)?.status).toBe('TAM_DONG');
  });

  it('mở lại điểm dừng làm gói tải trước vượt trần → MSG-OFFLINE-TOO-BIG, vẫn Tạm đóng', async () => {
    const { store, x } = await closedScenario();
    for (const media of store.state.media.values()) {
      if (media.ownerType === 'CHECKPOINT' && media.ownerId === x.checkpointId) media.fileSizeBytes = 60 * 1_048_576;
    }
    renderAdmin(`/admin/checkpoints/${x.checkpointId}`, { store, signedInAs: 'REVIEWER' });
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    await userEvent.click(screen.getByRole('button', { name: 'Mở lại' }));
    fireEvent.change(within(await screen.findByRole('dialog')).getByLabelText(NOTE_LABEL), { target: { value: 'Đã kiểm tra' } });
    await userEvent.click(confirmButton());

    expect((await screen.findByRole('alert')).textContent).toMatch(/^Gói tải trước của tuyến "Tuyến [AB]" sẽ nặng khoảng/);
    expect(screen.getByText('Trạng thái: Tạm đóng')).toBeTruthy();
    expect(store.state.checkpoints.get(x.checkpointId)?.status).toBe('TAM_DONG');
  });

  it('Nhân viên nội dung không thấy nút Mở lại; nếu vẫn gửi được thì nhận MSG-NO-PERMISSION', async () => {
    const { store, x } = await closedScenario();
    const page = renderAdmin(`/admin/checkpoints/${x.checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    expect(screen.queryByRole('button', { name: 'Mở lại' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Lưu trữ' })).toBeNull();
    page.unmount();

    store.signIn(FIXTURE_ACCOUNTS.CONTENT_STAFF.userId);
    render(
      <AdminServicesProvider services={createFakeServices(store)}>
        <ReopenDialog open subject={{ type: 'CHECKPOINT', id: x.checkpointId, name: 'Hang Con Moong' }} onClose={() => {}} onChanged={() => {}} />
      </AdminServicesProvider>,
    );
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(formatMessage('MSG-NO-PERMISSION')));
    expect(store.state.checkpoints.get(x.checkpointId)?.status).toBe('TAM_DONG');
  });
});
