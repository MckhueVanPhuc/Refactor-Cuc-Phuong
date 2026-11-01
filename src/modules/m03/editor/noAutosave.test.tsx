// Không tự lưu: không command nào chạy nếu chưa bấm "Lưu bản nháp"; MSG-SAVED chỉ sau khi cả form và media đã lưu
// (BR-M03-F11; SC-M03-033). Tải tệp lên (C-04) là bước riêng trước đó (BR-M03-E14), không phải lưu bản nháp.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { syntheticFile } from '../api/contract/harness';
import type { AdminApi } from '../api/AdminApi';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { seedRoute } from '../testing/seedRoutes';

// Dựng cả editor và gõ phím: khi cả bộ test chạy song song, một ca có thể vượt mặc định 5 s
const EDITOR_TEST_TIMEOUT = 15_000;

beforeAll(() =>
  Promise.all([
    import('../route-admin/RouteEditorPage'),
    import('../checkpoint-library/CheckpointEditorPage'),
    import('../visit-points/VisitPointEditorPage'),
  ]),
);

afterEach(() => {
  vi.useRealTimers();
});

/** Command ghi C-01…C-19 và Edge `admin-accounts` (admin-command §5), trừ C-04 đăng ký tệp vừa tải */
const WRITE_COMMANDS = [
  'saveRouteDraft',
  'saveCheckpointDraft',
  'saveVisitPointDraft',
  'publishUnit',
  'discardDraft',
  'discardUnpublished',
  'restoreRevision',
  'closeRoute',
  'closeCheckpoint',
  'closeRoutesListingCheckpoint',
  'reopenRoute',
  'reopenCheckpoint',
  'archiveRoute',
  'archiveCheckpoint',
  'revokeVisitPoint',
  'recordReprint',
  'changeAccountRole',
  'setAccountStatus',
  'inviteAccount',
  'resendInvitation',
  'linkInvitation',
] as const satisfies readonly (keyof AdminApi)[];

function spyCommands(api: AdminApi) {
  return WRITE_COMMANDS.map((name) => [name, vi.spyOn(api, name)] as const);
}

const calledCommands = (spies: ReturnType<typeof spyCommands>) =>
  spies.filter(([, spy]) => spy.mock.calls.length > 0).map(([name]) => name);

/** Gõ vào các ô, rời ô, rồi để yên 10 phút: không có lần lưu nào chạy ngầm */
async function typeAndIdle(labels: readonly string[]) {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  for (const label of labels) {
    await user.type(screen.getByLabelText(label), ' thêm');
    await user.tab();
  }
  await vi.advanceTimersByTimeAsync(10 * 60_000);
  vi.useRealTimers();
}

describe('không tự lưu (BR-M03-F11; SC-M03-033)', { timeout: EDITOR_TEST_TIMEOUT }, () => {
  it('editor tuyến', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { complete: true });
    const { services } = renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' });
    const spies = spyCommands(services.api);
    await typeAndIdle(['Tên tuyến (tiếng Việt)', 'Mô tả ngắn (tiếng Anh)', 'Quãng đường (km)']);
    expect(calledCommands(spies)).toEqual([]);
    expect(screen.queryByText(formatMessage('MSG-SAVED'))).toBeNull();
  });

  it('editor điểm dừng', async () => {
    const store = new FakeStore();
    const { checkpointId } = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED' });
    const { services } = renderAdmin(`/admin/checkpoints/${checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    const spies = spyCommands(services.api);
    await typeAndIdle(['Tên điểm dừng (tiếng Anh)', 'Ghi chú vị trí']);
    expect(calledCommands(spies)).toEqual([]);
    expect(screen.queryByText(formatMessage('MSG-SAVED'))).toBeNull();
  });

  it('editor điểm tham quan', async () => {
    const store = new FakeStore();
    const { checkpointId, qrIdentifiers } = await seedCheckpoint(store, {
      name: 'Hang Con Moong',
      mode: 'OFFLINE_REQUIRED',
      visitPoints: [{ name: 'Cây chò' }],
    });
    const { services } = renderAdmin(`/admin/checkpoints/${checkpointId}/visit-points/${qrIdentifiers[0]}`, {
      store,
      signedInAs: 'CONTENT_STAFF',
    });
    await screen.findByRole('heading', { level: 1, name: 'Đang sửa: Cây chò' });
    const spies = spyCommands(services.api);
    await typeAndIdle(['Tên đối tượng (tiếng Anh)', 'Giới thiệu (tiếng Việt)', 'Ghi chú lắp đặt']);
    expect(calledCommands(spies)).toEqual([]);
    expect(screen.queryByText(formatMessage('MSG-SAVED'))).toBeNull();
  });
});

describe('MSG-SAVED chỉ khi cả form và media đã lưu (BR-M03-F11)', { timeout: EDITOR_TEST_TIMEOUT }, () => {
  it('ảnh vừa tải chưa thuộc bản nháp; lưu lỗi → không MSG-SAVED, ảnh còn trên màn; lưu được → MSG-SAVED và bản nháp có ảnh', async () => {
    const store = new FakeStore();
    const { checkpointId, qrIdentifiers } = await seedCheckpoint(store, {
      name: 'Hang Con Moong',
      mode: 'OFFLINE_REQUIRED',
      visitPoints: [{ name: 'Cây chò' }],
    });
    const qrIdentifier = qrIdentifiers[0]!;
    const { services } = renderAdmin(`/admin/checkpoints/${checkpointId}/visit-points/${qrIdentifier}`, {
      store,
      signedInAs: 'CONTENT_STAFF',
    });
    await screen.findByRole('heading', { level: 1, name: 'Đang sửa: Cây chò' });
    const saveDraft = vi.spyOn(services.api, 'saveVisitPointDraft');
    const draftImages = async () => (await services.api.getVisitPointEditor(qrIdentifier)).draft?.content.mediaItems?.length ?? 0;

    await userEvent.upload(screen.getByLabelText('Ảnh của điểm tham quan'), syntheticFile('cho-1.jpg', 'image/jpeg', 1024));
    await userEvent.click(await screen.findByLabelText('Xác nhận quyền sử dụng — cho-1.jpg'));
    expect(await screen.findByText(formatMessage('MSG-UPLOADED-NOT-SAVED'))).toBeTruthy();
    expect(saveDraft).not.toHaveBeenCalled();
    expect(screen.queryByText(formatMessage('MSG-SAVED'))).toBeNull();
    expect(await draftImages()).toBe(0);

    store.failNext('VISIT_POINT_DRAFT_SAVED');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect((await screen.findByRole('alert')).textContent).toBe(formatMessage('MSG-GENERIC'));
    expect(screen.queryByText(formatMessage('MSG-SAVED'))).toBeNull();
    expect(screen.getByLabelText('Xác nhận quyền sử dụng — cho-1.jpg')).toBeTruthy();
    expect(await draftImages()).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(await screen.findByText(formatMessage('MSG-SAVED'))).toBeTruthy();
    expect(saveDraft).toHaveBeenCalledTimes(2);
    expect(await draftImages()).toBe(1);
    expect(screen.queryByText(formatMessage('MSG-UPLOADED-NOT-SAVED'))).toBeNull();
  });

  it('editor tuyến: ảnh chi tiết vừa tải "chưa lưu" cho tới khi lưu bản nháp thành công', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { complete: true });
    const { services } = renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' });
    await userEvent.click(screen.getByRole('button', { name: /Chi tiết/ }));
    await userEvent.upload(screen.getByLabelText('Ảnh chi tiết'), syntheticFile('chi-tiet.jpg', 'image/jpeg', 1024));
    expect(await screen.findByText(formatMessage('MSG-UPLOADED-NOT-SAVED'))).toBeTruthy();
    const saved = async () => (await services.api.getRouteEditor(routeId)).draft?.content.galleryItems?.length ?? 0;
    expect(await saved()).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(await screen.findByText(formatMessage('MSG-SAVED'))).toBeTruthy();
    expect(await saved()).toBe(1);
    expect(screen.queryByText(formatMessage('MSG-UPLOADED-NOT-SAVED'))).toBeNull();
  });
});
