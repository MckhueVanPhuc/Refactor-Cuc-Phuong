import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createFakeAdminApi } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { formatTime } from '../messages/format';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { publishSeededRoute, seedRoute } from '../testing/seedRoutes';

// Nạp sẵn chunk lazy của các màn để ca đầu tiên không phụ thuộc thời gian nạp module
beforeAll(() => Promise.all([import('../route-admin/RouteEditorPage'), import('../checkpoint-library/CheckpointEditorPage')]));

/** Tuyến đã xuất bản, đang mở trong editor của Nhân viên */
async function openPublishedRoute() {
  const store = new FakeStore();
  const { checkpointId } = await seedCheckpoint(store, {
    name: 'Hang Con Moong',
    mode: 'OFFLINE_REQUIRED',
    visitPoints: [{ name: 'Cây chò', ready: true }],
    publish: true,
  });
  const { routeId } = await seedRoute(store, { complete: true, checkpointIds: [checkpointId] });
  await publishSeededRoute(store, routeId);
  const view = renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' });
  return { ...view, routeId, checkpointId };
}

/** Quản lý sửa và lưu bản nháp của tuyến trong một phiên khác */
async function editAsReviewer(store: FakeStore, routeId: string, distanceKm: number) {
  const previous = store.currentUserId;
  store.currentUserId = FIXTURE_ACCOUNTS.REVIEWER.userId;
  try {
    const api = createFakeAdminApi(store);
    const editor = await api.getRouteEditor(routeId);
    const saved = await api.saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...(editor.draft ?? editor.published)!.content, distanceKm },
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: media.usageRightsConfirmed })),
    });
    if (!saved.ok) throw new Error('Quản lý không lưu được');
  } finally {
    store.currentUserId = previous;
  }
}

describe('sửa đồng thời và "Tải lại" (BR-M03-F06, L05; SC-M03-005; Q14)', () => {
  it('đã xuất bản, chưa có bản nháp → MSG-VERSION-PUBLISHED; lưu xong → MSG-VERSION-DRAFT và dấu có bản nháp chờ', async () => {
    const { store, routeId } = await openPublishedRoute();
    expect(screen.getByText(formatMessage('MSG-VERSION-PUBLISHED'))).toBeTruthy();
    const distance = screen.getByLabelText('Quãng đường (km)');
    await userEvent.clear(distance);
    await userEvent.type(distance, '5');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(await screen.findByText(formatMessage('MSG-VERSION-DRAFT'))).toBeTruthy();
    // Bản công khai không đổi cho tới khi xuất bản (BR-M03-C05)
    expect(store.state.routes.get(routeId)?.activeContentVersion).toBe(1);
  });

  it('phiên sau lưu bằng bản cũ → MSG-STALE nêu email và giờ; chữ đang gõ còn nguyên; không ghi đè', async () => {
    const { store, routeId } = await openPublishedRoute();
    await editAsReviewer(store, routeId, 6);
    const distance = screen.getByLabelText('Quãng đường (km)') as HTMLInputElement;
    await userEvent.clear(distance);
    await userEvent.type(distance, '7');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));

    const alert = await screen.findByRole('alert');
    const lastEdit = (await createFakeAdminApi(store).getRouteEditor(routeId)).draft!.lastEditedAt;
    expect(alert.textContent).toContain(
      formatMessage('MSG-STALE', { 'Tên người': 'reviewer@example.test', giờ: formatTime(lastEdit) }),
    );
    expect(distance.value).toBe('7');
    expect((await createFakeAdminApi(store).getRouteEditor(routeId)).draft?.content.distanceKm).toBe(6);
  });

  it('"Tải lại" nạp bản mới nhất; lưu lại được', async () => {
    const { store, routeId } = await openPublishedRoute();
    await editAsReviewer(store, routeId, 6);
    await userEvent.type(screen.getByLabelText('Mô tả ngắn (tiếng Việt)'), ' mới');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await userEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Tải lại' }));
    await waitFor(() => expect((screen.getByLabelText('Quãng đường (km)') as HTMLInputElement).value).toBe('6'));
    expect((screen.getByLabelText('Mô tả ngắn (tiếng Việt)') as HTMLInputElement).value).toBe('Rừng nguyên sinh');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(await screen.findByText(formatMessage('MSG-SAVED'))).toBeTruthy();
  });

  it('tuyến đã xuất bản có bản nháp → nút Xuất bản dẫn tới review ROUTE_INFORMATION', async () => {
    const { store, routeId, router } = await openPublishedRoute();
    expect(screen.queryByRole('button', { name: 'Xuất bản' })).toBeNull();
    await editAsReviewer(store, routeId, 6);
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    await userEvent.click(within(await screen.findByRole('alert')).getByRole('button', { name: 'Tải lại' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Xuất bản' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/review/ROUTE_INFORMATION/${routeId}`));
  });

  it('điểm dừng đã xuất bản: mở bản nháp chờ nếu có; Xuất bản dẫn tới CHECKPOINT_REVISION; danh sách có dấu bản nháp chờ', async () => {
    const store = new FakeStore();
    const { checkpointId } = await seedCheckpoint(store, {
      name: 'Hang Con Moong',
      mode: 'OFFLINE_REQUIRED',
      visitPoints: [{ name: 'Cây chò', ready: true }],
      publish: true,
    });
    const { router } = renderAdmin(`/admin/checkpoints/${checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    expect(screen.getByText(formatMessage('MSG-VERSION-PUBLISHED'))).toBeTruthy();
    const name = screen.getByLabelText('Tên điểm dừng (tiếng Việt)');
    await userEvent.clear(name);
    await userEvent.type(name, 'Hang Người Xưa');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));
    expect(await screen.findByText(formatMessage('MSG-VERSION-DRAFT'))).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/review/CHECKPOINT_REVISION/${checkpointId}`));

    await router.navigate('/admin/checkpoints');
    const table = within(await screen.findByRole('table', { name: 'Điểm dừng' }));
    expect(within(table.getByRole('row', { name: /Hang Người Xưa/ })).getByText('Có bản nháp chờ')).toBeTruthy();
  });
});
