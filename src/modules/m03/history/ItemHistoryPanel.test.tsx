// Panel lịch sử của một mục (tasks T143; BR-M03-F09, L10, L11): các bản đã xuất bản (số, email người xuất bản,
// thời gian, dấu "tự xuất bản"); nhật ký của mục với trước/sau dạng "{nhãn}: {trước} → {sau}", không JSON.
import { beforeAll, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { FakeStore } from '../api/fake/store';
import { renderAdmin } from '../testing/renderAdmin';
import { asRole } from '../testing/seedOperations';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { publishSeededRoute, seedRoute } from '../testing/seedRoutes';

const PAGE_TEST_TIMEOUT = 15_000;

beforeAll(() => import('../route-admin/RouteEditorPage'));

/** Tuyến xuất bản hai lần (4,5 km rồi 6 km); lần hai do Quản lý xuất bản bản nháp của Nhân viên */
async function routePublishedTwice() {
  const store = new FakeStore();
  const { checkpointId } = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
  const { routeId } = await seedRoute(store, { complete: true, checkpointIds: [checkpointId] });
  await publishSeededRoute(store, routeId);
  await asRole(store, 'CONTENT_STAFF', async (api) => {
    const editor = await api.getRouteEditor(routeId);
    await api.saveRouteDraft({
      routeId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...editor.published!.content, distanceKm: 6 },
      mediaSettings: editor.media.map((media) => ({ mediaId: media.mediaId, usageRightsConfirmed: true })),
    });
  });
  await asRole(store, 'REVIEWER', async (api) => {
    const review = await api.openPublicationReview({ unitType: 'ROUTE_INFORMATION', subjectId: routeId });
    await api.publishUnit({ unitType: 'ROUTE_INFORMATION', subjectId: routeId, reviewedConcurrencyRevision: review.reviewedConcurrencyRevision });
  });
  return { store, routeId };
}

describe('ItemHistoryPanel (BR-M03-F09, L10)', { timeout: PAGE_TEST_TIMEOUT }, () => {
  it('liệt kê bản đã xuất bản mới nhất trước: số, trạng thái, người xuất bản, thời gian, dấu tự xuất bản', async () => {
    const { store, routeId } = await routePublishedTwice();
    renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    const panel = within(await screen.findByRole('region', { name: 'Lịch sử xuất bản' }, { timeout: 5_000 }));
    const items = await panel.findAllByRole('listitem');
    expect(items[0]!.textContent).toMatch(/^Bản 2.*Đã xuất bản.*\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}.*reviewer@example\.test/);
    expect(items[0]!.textContent).not.toMatch(/Tự xuất bản/);
    expect(items[1]!.textContent).toMatch(/^Bản 1.*Bản cũ.*staff@example\.test.*Tự xuất bản/);
  });

  it('nhật ký của mục: tên thao tác, kết quả, trước/sau dạng "{nhãn}: {trước} → {sau}", không JSON hay mã', async () => {
    const { store, routeId } = await routePublishedTwice();
    renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    const log = within(await screen.findByRole('region', { name: 'Nhật ký của mục' }, { timeout: 5_000 }));
    expect(await log.findByText('Quãng đường (km): 4,5 → 6')).toBeTruthy();
    expect(log.getAllByText('Xuất bản').length).toBeGreaterThan(0);
    expect(log.getAllByText('Thành công').length).toBeGreaterThan(0);
    const text = log.getByRole('list').textContent ?? '';
    expect(text).not.toMatch(/PUBLISHED|ROUTE_DRAFT_SAVED|SUCCESS|[{}]/);
  });
});
