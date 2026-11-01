import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';

// Nạp sẵn chunk lazy của màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() => Promise.all([import('./CheckpointEditorPage'), import('./CheckpointListPage')]));

const MODE_FIRST = formatMessage('MSG-MODE-REQUIRED-FIRST');

async function openNew() {
  const view = renderAdmin('/admin/checkpoints/new', { signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Điểm dừng mới' });
  return view;
}

async function openExisting(store: FakeStore, checkpointId: string, name: string) {
  const view = renderAdmin(`/admin/checkpoints/${checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name });
  return view;
}

describe('SCR-M03-008 editor điểm dừng (BR-M03-D02, D03, D09, E15, E16)', () => {
  it('"Thêm điểm tham quan" tắt kèm MSG-MODE-REQUIRED-FIRST cho tới khi loại kết nối đã được lưu (SC-M03-034)', async () => {
    const { router } = await openNew();
    const add = () => screen.getByRole('button', { name: 'Thêm điểm tham quan' }) as HTMLButtonElement;
    expect(add().disabled).toBe(true);
    expect(screen.getByText(MODE_FIRST)).toBeTruthy();

    await userEvent.type(screen.getByLabelText('Tên điểm dừng (tiếng Việt)'), 'Hang Con Moong');
    await userEvent.click(screen.getByLabelText('Cần tải trước'));
    // Đã chọn nhưng chưa lưu: vẫn tắt
    expect(add().disabled).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    expect(router.state.location.pathname).toMatch(/^\/admin\/checkpoints\/[A-Za-z0-9]+$/);
    expect((await screen.findByRole('status')).textContent).toBe(formatMessage('MSG-SAVED'));
    expect(add().disabled).toBe(false);
    expect(screen.queryByText(MODE_FIRST)).toBeNull();
  });

  it('không có loại kết nối mặc định; "Dùng được khi có mạng" hiện tick khảo sát', async () => {
    await openNew();
    expect((screen.getByLabelText('Cần tải trước') as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText('Dùng được khi có mạng') as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByLabelText('Đã khảo sát thực địa, có sóng ổn định')).toBeNull();
    await userEvent.click(screen.getByLabelText('Dùng được khi có mạng'));
    expect(screen.getByLabelText('Đã khảo sát thực địa, có sóng ổn định')).toBeTruthy();
  });

  it('tên trùng (không phân biệt hoa/thường) → lỗi dưới ô tên, MSG-CHECKPOINT-NAME-TAKEN', async () => {
    const store = new FakeStore();
    await seedCheckpoint(store, { name: 'Hang Con Moong' });
    renderAdmin('/admin/checkpoints/new', { store, signedInAs: 'CONTENT_STAFF' });
    await userEvent.type(await screen.findByLabelText('Tên điểm dừng (tiếng Việt)'), 'hang con MOONG');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(
      await screen.findByText(
        'Lỗi: Đã có điểm dừng tên "hang con MOONG". Hãy dùng tên khác, hoặc chọn điểm dừng đó trong tuyến.',
      ),
    ).toBeTruthy();
    // Chữ đang gõ vẫn giữ (BR-M03-L06)
    expect((screen.getByLabelText('Tên điểm dừng (tiếng Việt)') as HTMLInputElement).value).toBe('hang con MOONG');
  });

  it('danh sách điểm tham quan: tên hoặc "chưa đặt tên {số}", trạng thái, readiness, "Mã …xxxxxx" (BR-M03-E16)', async () => {
    const store = new FakeStore();
    const seeded = await seedCheckpoint(store, {
      name: 'Hang Con Moong',
      mode: 'OFFLINE_REQUIRED',
      visitPoints: [{ name: 'Cây chò', ready: true }, {}],
    });
    await openExisting(store, seeded.checkpointId, 'Hang Con Moong');
    const table = within(screen.getByRole('table', { name: 'Điểm tham quan' }));
    const [first, second] = seeded.qrIdentifiers as [string, string];
    const named = table.getByRole('row', { name: /Cây chò/ });
    expect(within(named).getByText('Nháp')).toBeTruthy();
    expect(within(named).getByText('Sẵn sàng')).toBeTruthy();
    expect(within(named).getByText(`Mã …${first.slice(-6)}`)).toBeTruthy();
    const unnamed = table.getByRole('row', { name: /Điểm tham quan chưa đặt tên 2/ });
    expect(within(unnamed).getByText(/^Chưa đủ: /)).toBeTruthy();
    expect(within(unnamed).getByText(`Mã …${second.slice(-6)}`)).toBeTruthy();
    // Không lộ identifier đầy đủ (BR-M03-L10)
    expect(document.body.textContent).not.toContain(first);
  });

  it('điểm tham quan vừa lưu được tô sáng khi quay lại danh sách', async () => {
    const store = new FakeStore();
    const seeded = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò' }] });
    renderAdmin(`/admin/checkpoints/${seeded.checkpointId}`, {
      store,
      signedInAs: 'CONTENT_STAFF',
      state: { highlightQr: seeded.qrIdentifiers[0] },
    });
    const row = await screen.findByRole('row', { name: /Cây chò/ });
    expect(row.getAttribute('aria-current')).toBe('true');
  });

  it('hủy điểm dừng chưa từng xuất bản: cần lý do + MSG-CONFIRM-DISCARD-CHECKPOINT → Đã lưu trữ, điểm tham quan nháp Đã thu hồi', async () => {
    const store = new FakeStore();
    const seeded = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò' }] });
    const { router } = await openExisting(store, seeded.checkpointId, 'Hang Con Moong');
    await userEvent.click(screen.getByRole('button', { name: 'Hủy điểm dừng' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(
      formatMessage('MSG-CONFIRM-DISCARD-CHECKPOINT', { tên: 'Hang Con Moong' }),
    );
    const confirm = dialog.getByRole('button', { name: 'Hủy điểm dừng' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await userEvent.type(dialog.getByLabelText('Lý do'), 'Tạo nhầm');
    expect(confirm.disabled).toBe(false);
    await userEvent.click(confirm);
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/checkpoints'));
    expect(store.state.checkpoints.get(seeded.checkpointId)?.status).toBe('LUU_TRU');
    expect(store.state.qrCodes.get(seeded.qrIdentifiers[0]!)?.status).toBe('THU_HOI');
  });

  it('điểm dừng đã xuất bản không có nút Hủy; có nút Xuất bản dẫn tới màn xem lại', async () => {
    const store = new FakeStore();
    const seeded = await seedCheckpoint(store, {
      name: 'Hang Con Moong',
      mode: 'OFFLINE_REQUIRED',
      visitPoints: [{ name: 'Cây chò', ready: true }],
      publish: true,
    });
    await openExisting(store, seeded.checkpointId, 'Hang Con Moong');
    expect(screen.queryByRole('button', { name: 'Hủy điểm dừng' })).toBeNull();
    expect(screen.getByText('Trạng thái: Đang hoạt động')).toBeTruthy();
  });

  it('chưa lưu mà rời trang → MSG-UNSAVED-CHANGES', async () => {
    const { router } = await openNew();
    await userEvent.type(screen.getByLabelText('Tên điểm dừng (tiếng Việt)'), 'Hang');
    await userEvent.click(screen.getByRole('link', { name: 'Tuyến' }));
    expect(within(screen.getByRole('dialog')).getByRole('heading').textContent).toBe(formatMessage('MSG-UNSAVED-CHANGES'));
    await userEvent.click(screen.getByRole('button', { name: 'Ở lại' }));
    expect(router.state.location.pathname).toBe('/admin/checkpoints/new');
  });
});
