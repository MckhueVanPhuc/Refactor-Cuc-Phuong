// Tích hợp thật M01 ↔ M03 giai đoạn B trên stack Supabase local (tasks M01 T104, T105; quickstart V4, V10, V17, V22).
// Chỉ chạy ở project `m01-local-stack` (PW_LOCAL_STACK=1, `npm run dev` với .env.local của stack local).
import { expect, test, type Page } from '@playwright/test';
import { parseJourneySnapshotRow, parsePublishedRouteRow } from '../../src/shared/contracts/publicationRowMapping';
import { readPublicationLocal } from '../m03/localStack';
import { dumpStores } from './helpers';
import { closeRoute, M01_LOCAL_PROJECT, resetLocalStack, seedTwoRoutes, visitorClient } from './localStack';

test.use({ locale: 'vi-VN' });
test.describe.configure({ mode: 'serial' });

const NAMES = {
  checkpoint: 'Điểm M01 rừng già',
  other: 'Điểm M01 suối',
  routeA: 'Tuyến M01 Cây Chò',
  routeB: 'Tuyến M01 Bản Mường',
};
let ids: { routeA: string; routeB: string };

test.beforeAll(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== M01_LOCAL_PROJECT, 'chỉ chạy với stack Supabase local (PW_LOCAL_STACK=1)');
  resetLocalStack();
  ids = await seedTwoRoutes(NAMES);
});

async function openCatalog(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
}

test('T104 — dòng view thật qua publicationRowMapping khớp kết quả của M03; danh sách cột khớp view', async () => {
  const supabase = visitorClient();
  for (const routeId of [ids.routeA, ids.routeB]) {
    const route = await supabase.from('published_routes').select('*').eq('route_id', routeId).single();
    const snapshot = await supabase.from('active_journey_snapshots').select('*').eq('route_id', routeId).single();
    expect(route.error).toBeNull();
    expect(snapshot.error).toBeNull();
    const parsedRoute = parsePublishedRouteRow(route.data);
    const parsedSnapshot = parseJourneySnapshotRow(snapshot.data);
    expect(parsedRoute).not.toBeNull();
    expect(parsedSnapshot).not.toBeNull();
    expect({ route: parsedRoute, snapshot: parsedSnapshot }).toEqual(await readPublicationLocal(routeId));
  }
});

test('V4 — danh mục từ view thật: hai tuyến đã xuất bản, sắp A→Z, dấu cần tải trước', async ({ page }) => {
  await openCatalog(page);
  const a = page.getByRole('link', { name: new RegExp(NAMES.routeA) });
  const b = page.getByRole('link', { name: new RegExp(NAMES.routeB) });
  await expect(a).toBeVisible();
  await expect(b).toBeVisible();
  await expect(page.getByRole('listitem').getByRole('heading')).toHaveText([NAMES.routeB, NAMES.routeA]);
  await expect(a.getByText('Cần tải trước')).toBeVisible();
});

test('V10 — tải gói A từ Storage thật: SAN_SANG + CURRENT, resource và byte ảnh có trong IndexedDB', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('link', { name: new RegExp(NAMES.routeA) }).click();
  const panel = page.getByRole('region', { name: 'Gói tải trước' });
  await panel.getByRole('button', { name: 'Tải về' }).click();
  await expect(panel.getByText('Sẵn sàng – mới nhất')).toBeVisible({ timeout: 30_000 });
  const data = await dumpStores(page, ['offlinePackages', 'offlineResources', 'imageBytes', 'packageCandidates']);
  expect(data.offlinePackages).toMatchObject([{ routeId: ids.routeA, status: 'SAN_SANG', versionStatus: 'CURRENT' }]);
  expect(data.offlineResources).toHaveLength(1);
  expect((data.imageBytes as { blob: number }[]).every((image) => image.blob > 0)).toBe(true);
  expect(data.imageBytes!.length).toBeGreaterThan(0);
  expect(data.packageCandidates).toEqual([]);
});

test('V17 — Start B online từ snapshot thật: context v3 rồi sang /trip', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('link', { name: new RegExp(NAMES.routeB) }).click();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  // B có điểm dừng cần tải trước: chọn tiếp tục không tải (BR-M01-007)
  await page.getByRole('dialog').getByRole('button', { name: 'Tiếp tục không tải' }).click();
  await expect(page).toHaveURL(/\/trip$/);
  const [row] = (await dumpStores(page, ['selectedRouteContext'])).selectedRouteContext as Record<string, unknown>[];
  expect(row).toMatchObject({ contractVersion: 3, routeId: ids.routeB, authorizationStatus: 'AUTHORIZED' });
  expect(Date.parse(row!.expiresAt as string) - Date.parse(row!.authorizedAt as string)).toBe(86_400_000);
});

test('V22 — Quản lý tạm đóng A: làm mới danh mục, A biến mất, context A REVOKED, gói A còn', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('link', { name: new RegExp(NAMES.routeA) }).click();
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tiếp tục không tải' }).click().catch(() => {});
  await expect(page).toHaveURL(/\/trip$/);

  await closeRoute(ids.routeA);
  await page.goto('/offline');
  await expect(page.getByRole('heading', { level: 1, name: 'Quản lý tài nguyên offline' })).toBeVisible();
  await page.getByRole('link', { name: 'Danh mục tuyến' }).first().click();
  await expect(page.getByRole('link', { name: new RegExp(NAMES.routeB) })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(NAMES.routeA) })).toHaveCount(0);
  await expect
    .poll(async () => ((await dumpStores(page, ['selectedRouteContext'])).selectedRouteContext as { authorizationStatus: string }[])[0]?.authorizationStatus)
    .toBe('REVOKED');
});
