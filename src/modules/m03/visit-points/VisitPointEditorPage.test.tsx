import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { syntheticFile } from '../api/contract/harness';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint, type SeedCheckpoint } from '../testing/seedCheckpoints';

async function setup(seed: Partial<SeedCheckpoint> = {}) {
  const store = new FakeStore();
  const seeded = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', ...seed });
  return { store, ...seeded };
}

async function openNew(store: FakeStore, checkpointId: string) {
  const view = renderAdmin(`/admin/checkpoints/${checkpointId}/visit-points/new`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Điểm tham quan mới' });
  return view;
}

async function openExisting(store: FakeStore, checkpointId: string, qrIdentifier: string, heading: string) {
  const view = renderAdmin(`/admin/checkpoints/${checkpointId}/visit-points/${qrIdentifier}`, {
    store,
    signedInAs: 'CONTENT_STAFF',
  });
  await screen.findByRole('heading', { level: 1, name: heading });
  return view;
}

// Nạp sẵn chunk lazy của màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() => import('./VisitPointEditorPage'));

const saveButton = () => screen.getByRole('button', { name: 'Lưu bản nháp' }) as HTMLButtonElement;

describe('SCR-M03-003 điểm tham quan (BR-M03-B01, E14–E16, F11)', () => {
  it('form mới: chưa có QR trước lần lưu đầu; nút lưu tắt khi form còn rỗng (SC-M03-034)', async () => {
    const { store, checkpointId } = await setup();
    await openNew(store, checkpointId);
    expect(saveButton().disabled).toBe(true);
    expect(screen.queryByText(/^Mã …/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Tải ảnh/ })).toBeNull();
    expect(store.state.qrCodes.size).toBe(0);
    await userEvent.type(screen.getByLabelText('Tên đối tượng (tiếng Việt)'), 'Cây chò');
    expect(saveButton().disabled).toBe(false);
  });

  it('thứ tự form: tên → giới thiệu → ảnh → ghi chú lắp đặt; điểm dừng "Cần tải trước" không có ô âm thanh/video', async () => {
    const { store, checkpointId } = await setup();
    await openNew(store, checkpointId);
    const labels = [
      'Tên đối tượng (tiếng Việt)',
      'Tên đối tượng (tiếng Anh)',
      'Giới thiệu (tiếng Việt)',
      'Giới thiệu (tiếng Anh)',
      'Ảnh của điểm tham quan',
      'Ghi chú lắp đặt',
    ].map((label) => screen.getByLabelText(label));
    for (let i = 1; i < labels.length; i += 1) {
      expect(labels[i - 1]!.compareDocumentPosition(labels[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.queryByLabelText('Âm thanh/video')).toBeNull();
    expect(screen.getByText('Điểm dừng cần tải trước chỉ nhận chữ và ảnh.')).toBeTruthy();
  });

  it('lần lưu đầu: MSG-QR-CREATED + "Thêm điểm tham quan khác"; ở lại form, có ảnh in, không hiện phần nào của mã', async () => {
    const { store, checkpointId } = await setup();
    const { router } = await openNew(store, checkpointId);
    await userEvent.type(screen.getByLabelText('Tên đối tượng (tiếng Việt)'), 'Cây chò');
    await userEvent.click(saveButton());
    expect(await screen.findByText(formatMessage('MSG-QR-CREATED', { tên: 'Cây chò' }))).toBeTruthy();
    const [qrIdentifier] = [...store.state.qrCodes.keys()];
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/admin/checkpoints/${checkpointId}/visit-points/${qrIdentifier}`),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Đang sửa: Cây chò' })).toBeTruthy();
    // Không hiện phần nào của mã (BR-M03-E16); tên đã lưu nên tải được ảnh tem
    expect(document.body.textContent).not.toContain(qrIdentifier!.slice(-6));
    expect((screen.getByRole('button', { name: 'Tải ảnh SVG' }) as HTMLButtonElement).disabled).toBe(false);

    await userEvent.click(screen.getByRole('button', { name: 'Thêm điểm tham quan khác' }));
    await screen.findByRole('heading', { level: 1, name: 'Điểm tham quan mới' });
    expect(router.state.location.pathname).toBe(`/admin/checkpoints/${checkpointId}/visit-points/new`);
  });

  it('tiêu đề "Đang sửa: {tên}" + MSG-VERSION-DRAFT; đã xuất bản không có nháp → MSG-VERSION-PUBLISHED', async () => {
    const draft = await setup({ visitPoints: [{ name: 'Cây chò' }] });
    const first = await openExisting(draft.store, draft.checkpointId, draft.qrIdentifiers[0]!, 'Đang sửa: Cây chò');
    expect(screen.getByText(formatMessage('MSG-VERSION-DRAFT'))).toBeTruthy();
    first.unmount();

    const published = await setup({ visitPoints: [{ name: 'Cây lim', ready: true }], publish: true });
    await openExisting(published.store, published.checkpointId, published.qrIdentifiers[0]!, 'Đang sửa: Cây lim');
    expect(screen.getByText(formatMessage('MSG-VERSION-PUBLISHED'))).toBeTruthy();
  });

  it('chưa đặt tên → tiêu đề dùng "Điểm tham quan chưa đặt tên {số}"', async () => {
    const { store, checkpointId, qrIdentifiers } = await setup({ visitPoints: [{ name: 'A' }, {}] });
    await openExisting(store, checkpointId, qrIdentifiers[1]!, 'Đang sửa: Điểm tham quan chưa đặt tên 2');
  });

  it('tải nhiều ảnh: tick quyền từng tệp; lưu lỗi không xóa tệp đã tải (BR-M03-E14, F11)', async () => {
    const { store, checkpointId, qrIdentifiers } = await setup({ visitPoints: [{ name: 'Cây chò' }] });
    await openExisting(store, checkpointId, qrIdentifiers[0]!, 'Đang sửa: Cây chò');
    await userEvent.upload(screen.getByLabelText('Ảnh của điểm tham quan'), [
      syntheticFile('cho-1.jpg', 'image/jpeg', 1024),
      syntheticFile('cho-2.png', 'image/png', 1024),
    ]);
    const first = await screen.findByLabelText('Xác nhận quyền sử dụng — cho-1.jpg');
    const second = screen.getByLabelText('Xác nhận quyền sử dụng — cho-2.png');
    await userEvent.click(first);
    expect((first as HTMLInputElement).checked).toBe(true);
    expect((second as HTMLInputElement).checked).toBe(false);

    store.failNext('VISIT_POINT_DRAFT_SAVED');
    await userEvent.click(saveButton());
    expect((await screen.findByRole('alert')).textContent).toBe(formatMessage('MSG-GENERIC'));
    expect(screen.getByLabelText('Xác nhận quyền sử dụng — cho-1.jpg')).toBeTruthy();
    expect(screen.getByLabelText('Xác nhận quyền sử dụng — cho-2.png')).toBeTruthy();

    await userEvent.click(saveButton());
    expect(await screen.findByText(formatMessage('MSG-SAVED'))).toBeTruthy();
    const media = [...store.state.media.values()];
    expect(media.map((item) => item.usageRightsConfirmed).sort()).toEqual([false, true]);
  });

  it('điểm dừng "Dùng được khi có mạng": có ô âm thanh/video và chọn ngôn ngữ nói từng tệp (BR-M03-E17)', async () => {
    const { store, checkpointId, qrIdentifiers } = await setup({ mode: 'ONLINE_AVAILABLE', visitPoints: [{ name: 'Chim' }] });
    await openExisting(store, checkpointId, qrIdentifiers[0]!, 'Đang sửa: Chim');
    await userEvent.upload(screen.getByLabelText('Âm thanh/video'), [syntheticFile('tieng-chim.mp3', 'audio/mpeg', 1024)]);
    const group = await screen.findByRole('group', { name: 'Ngôn ngữ của tệp — tieng-chim.mp3' });
    for (const option of ['Tiếng Việt', 'Tiếng Anh', 'Không lời']) expect(within(group).getByLabelText(option)).toBeTruthy();
    await userEvent.click(within(group).getByLabelText('Không lời'));
    await userEvent.click(saveButton());
    await screen.findByText(formatMessage('MSG-SAVED'));
    expect([...store.state.media.values()].find((item) => item.type === 'AUDIO')?.spokenLanguage).toBe('NONE');
  });

  it('không có ô nhập identifier nào (SC-M03-013)', async () => {
    const { store, checkpointId, qrIdentifiers } = await setup({ visitPoints: [{ name: 'Cây chò' }] });
    await openExisting(store, checkpointId, qrIdentifiers[0]!, 'Đang sửa: Cây chò');
    const inputs = screen.getAllByRole('textbox').map((input) => input.getAttribute('data-field-key') ?? '');
    expect(inputs.some((key) => /qr|identifier|id$/i.test(key))).toBe(false);
    expect(screen.queryAllByLabelText(/^Mã/).filter((element) => element.tagName === 'INPUT')).toEqual([]);
  });

  it('panel "Còn thiếu để xuất bản" phản ánh form', async () => {
    const { store, checkpointId } = await setup();
    await openNew(store, checkpointId);
    const panel = within(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' }));
    expect(panel.getByText('Còn thiếu: Tên đối tượng.')).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Tên đối tượng (tiếng Việt)'), 'Cây chò');
    expect(panel.getByText('Tên đối tượng: còn thiếu bản tiếng Anh.')).toBeTruthy();
  });
});
