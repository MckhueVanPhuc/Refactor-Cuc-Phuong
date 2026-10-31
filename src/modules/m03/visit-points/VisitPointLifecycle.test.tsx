import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint, type SeedCheckpoint } from '../testing/seedCheckpoints';

// Nạp sẵn chunk lazy của màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() => import('./VisitPointEditorPage'));

async function open(seed: Omit<SeedCheckpoint, 'name'>, index = 0) {
  const store = new FakeStore();
  const seeded = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', ...seed });
  const qrIdentifier = seeded.qrIdentifiers[index]!;
  const view = renderAdmin(`/admin/checkpoints/${seeded.checkpointId}/visit-points/${qrIdentifier}`, {
    store,
    signedInAs: 'CONTENT_STAFF',
  });
  await screen.findByRole('heading', { level: 1, name: /^Đang sửa: / });
  return { ...view, ...seeded, qrIdentifier };
}

describe('vòng đời điểm tham quan (BR-M03-E07, E09–E11; SC-M03-004)', () => {
  it('In lại chỉ gọi C-17: một dòng audit QR_REPRINTED, không đổi gì khác', async () => {
    const { store, qrIdentifier } = await open({ visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
    const before = store.audit.length;
    const qr = structuredClone(store.state.qrCodes.get(qrIdentifier));
    await userEvent.click(screen.getByRole('button', { name: 'In lại' }));
    await waitFor(() => expect(store.audit.length).toBe(before + 1));
    expect(store.audit.at(-1)).toMatchObject({ action: 'QR_REPRINTED', result: 'SUCCESS' });
    expect(store.state.qrCodes.get(qrIdentifier)).toEqual(qr);
  });

  it('Thu hồi cần lý do và hộp xác nhận MSG-CONFIRM-REVOKE-QR; QR hoạt động cuối → MSG-LAST-QR', async () => {
    const { store, qrIdentifier } = await open({ visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
    await userEvent.click(screen.getByRole('button', { name: 'Thu hồi mã QR' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-REVOKE-QR', { tên: 'Cây chò' }));
    const confirm = dialog.getByRole('button', { name: 'Thu hồi' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await userEvent.type(dialog.getByLabelText('Lý do'), 'Cây đã đổ');
    await userEvent.click(confirm);
    expect((await screen.findByRole('alert')).textContent).toBe(formatMessage('MSG-LAST-QR'));
    expect(store.state.qrCodes.get(qrIdentifier)?.status).toBe('HOAT_DONG');
  });

  it('Thu hồi khi còn QR hoạt động khác → Đã thu hồi', async () => {
    const store = new FakeStore();
    const seeded = await seedCheckpoint(store, {
      name: 'Hang Con Moong',
      mode: 'OFFLINE_REQUIRED',
      visitPoints: [{ name: 'Cây chò', ready: true }, { name: 'Cây lim', ready: true }],
      publish: true,
    });
    const qrIdentifier = seeded.qrIdentifiers[0]!;
    renderAdmin(`/admin/checkpoints/${seeded.checkpointId}/visit-points/${qrIdentifier}`, { store, signedInAs: 'CONTENT_STAFF' });
    await userEvent.click(await screen.findByRole('button', { name: 'Thu hồi mã QR' }));
    const dialog = within(screen.getByRole('dialog'));
    await userEvent.type(dialog.getByLabelText('Lý do'), 'Cây đã đổ');
    await userEvent.click(dialog.getByRole('button', { name: 'Thu hồi' }));
    await waitFor(() => expect(store.state.qrCodes.get(qrIdentifier)?.status).toBe('THU_HOI'));
    expect(await screen.findByText('Đã thu hồi')).toBeTruthy();
  });

  it('Hủy QR Nháp: lý do tùy chọn, hộp xác nhận MSG-CONFIRM-DISCARD-QR → Đã thu hồi, về editor điểm dừng', async () => {
    const { store, router, checkpointId, qrIdentifier } = await open({ visitPoints: [{ name: 'Cây chò' }] });
    expect(screen.queryByRole('button', { name: 'Thu hồi mã QR' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Hủy điểm tham quan' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('heading').textContent).toBe(formatMessage('MSG-CONFIRM-DISCARD-QR', { tên: 'Cây chò' }));
    const confirm = dialog.getByRole('button', { name: 'Hủy điểm tham quan' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(false);
    await userEvent.click(confirm);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/checkpoints/${checkpointId}`));
    expect(store.state.qrCodes.get(qrIdentifier)?.status).toBe('THU_HOI');
  });

  it('Esc trong hộp xác nhận = không làm gì', async () => {
    const { store, qrIdentifier } = await open({ visitPoints: [{ name: 'Cây chò' }] });
    await userEvent.click(screen.getByRole('button', { name: 'Hủy điểm tham quan' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(store.state.qrCodes.get(qrIdentifier)?.status).toBe('NHAP');
  });
});
