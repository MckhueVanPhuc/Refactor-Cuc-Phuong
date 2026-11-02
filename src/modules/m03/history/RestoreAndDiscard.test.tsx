// Khôi phục và bỏ thay đổi (tasks T144; BR-M03-F07, F10; SC-M03-021): khôi phục tạo bản nháp dựa trên bản cũ;
// đã có bản nháp → MSG-DRAFT-EXISTS; bản cũ vi phạm giới hạn hiện hành → MSG-RESTORE-BLOCKED, không tạo gì;
// "Bỏ thay đổi" → bản nháp Đã bỏ, bản đang xuất bản không đổi. Không có hộp xác nhận (BR-M03-L12).
import { beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import { NAME_MAX_CHARS } from '../config/limits';
import type { RouteContent } from '../contracts/adminDtos';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { asRole } from '../testing/seedOperations';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { publishSeededRoute, seedRoute } from '../testing/seedRoutes';

const PAGE_TEST_TIMEOUT = 15_000;

beforeAll(() => Promise.all([import('../route-admin/RouteEditorPage'), import('../checkpoint-library/CheckpointEditorPage')]));

async function editRoute(store: FakeStore, routeId: string, distanceKm: number) {
  await asRole(store, 'CONTENT_STAFF', async (api) => {
    const editor = await api.getRouteEditor(routeId);
    const result = await api.saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...(editor.draft ?? editor.published)!.content, distanceKm },
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: true })),
    });
    if (!result.ok) throw new Error('không lưu được bản nháp');
  });
}

async function routePublishedTwice() {
  const store = new FakeStore();
  const { checkpointId } = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
  const { routeId } = await seedRoute(store, { complete: true, checkpointIds: [checkpointId] });
  await publishSeededRoute(store, routeId);
  await editRoute(store, routeId, 6);
  await asRole(store, 'CONTENT_STAFF', async (api) => {
    const review = await api.openPublicationReview({ unitType: 'ROUTE_INFORMATION', subjectId: routeId });
    await api.publishUnit({ unitType: 'ROUTE_INFORMATION', subjectId: routeId, reviewedConcurrencyRevision: review.reviewedConcurrencyRevision });
  });
  return { store, routeId };
}

async function openRoute(store: FakeStore, routeId: string) {
  renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' }, { timeout: 5_000 });
  return within(await screen.findByRole('region', { name: 'Lịch sử xuất bản' }));
}

const distance = () => (screen.getByLabelText('Quãng đường (km)') as HTMLInputElement).value;

describe('khôi phục và bỏ thay đổi (BR-M03-F07, F10)', { timeout: PAGE_TEST_TIMEOUT }, () => {
  it('khôi phục bản 1: form hiện bản nháp dựa trên bản 1, không có hộp xác nhận; bản đang xuất bản không đổi', async () => {
    const { store, routeId } = await routePublishedTwice();
    const panel = await openRoute(store, routeId);
    expect(panel.queryByRole('button', { name: /bản 2$/ })).toBeNull();
    await userEvent.click(await panel.findByRole('button', { name: 'Khôi phục bản đã xuất bản trước đó: bản 1' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(distance()).toBe('4.5'));
    expect(screen.getByText(formatMessage('MSG-VERSION-DRAFT'))).toBeTruthy();
    const editor = await asRole(store, 'CONTENT_STAFF', (api) => api.getRouteEditor(routeId));
    expect(editor.draft).toMatchObject({ basedOnRevisionNumber: 1 });
    expect(editor.published?.content.distanceKm).toBe(6);
  });

  it('đã có bản nháp chờ → MSG-DRAFT-EXISTS, không tạo gì', async () => {
    const { store, routeId } = await routePublishedTwice();
    await editRoute(store, routeId, 8);
    const panel = await openRoute(store, routeId);
    await userEvent.click(await panel.findByRole('button', { name: 'Khôi phục bản đã xuất bản trước đó: bản 1' }));
    expect((await screen.findByRole('alert')).textContent).toBe(formatMessage('MSG-DRAFT-EXISTS'));
    expect(distance()).toBe('8');
  });

  it('bản cũ vi phạm giới hạn hiện hành → MSG-RESTORE-BLOCKED kèm chỗ cần sửa, không tạo bản nháp', async () => {
    const { store, routeId } = await routePublishedTwice();
    const old = [...store.state.revisions.values()].find((rev) => rev.subjectId === routeId && rev.revisionNumber === 1)!;
    (old.content as RouteContent).name = { vi: 'Đ'.repeat(NAME_MAX_CHARS + 1), en: 'Ma To trail' };
    const panel = await openRoute(store, routeId);
    await userEvent.click(await panel.findByRole('button', { name: 'Khôi phục bản đã xuất bản trước đó: bản 1' }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/^Chưa khôi phục được bản này vì có chỗ không còn hợp với giới hạn hiện nay: .*Tên tuyến \(tiếng Việt\)/);
    expect((await asRole(store, 'CONTENT_STAFF', (api) => api.getRouteEditor(routeId))).draft).toBeUndefined();
  });

  it('"Bỏ thay đổi": bản nháp thành Đã bỏ, form về bản đang xuất bản; không có hộp xác nhận', async () => {
    const { store, routeId } = await routePublishedTwice();
    await editRoute(store, routeId, 8);
    await openRoute(store, routeId);
    expect(distance()).toBe('8');
    await userEvent.click(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(distance()).toBe('6'));
    expect(screen.getByText(formatMessage('MSG-VERSION-PUBLISHED'))).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Bỏ thay đổi' })).toBeNull();
    expect([...store.state.revisions.values()].some((rev) => rev.subjectId === routeId && rev.status === 'DA_BO')).toBe(true);
  });

  it('mục chưa từng xuất bản không có "Bỏ thay đổi" (dùng Hủy); điểm dừng cũng có panel lịch sử', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { complete: true });
    renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' }, { timeout: 5_000 });
    expect(screen.queryByRole('button', { name: 'Bỏ thay đổi' })).toBeNull();
  });
});
