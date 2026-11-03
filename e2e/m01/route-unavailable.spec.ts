// Quickstart M01 V22 (US-M01-05; tasks T068) trên bản build MODE e2e, network mock (project `m01`).
import { expect, test } from '@playwright/test';
import { publicationFixture } from '../../src/shared/contracts/__fixtures__/publication';
import { contextFromSnapshot, packageFromPublication } from '../../src/modules/m01/testing/packageFixture';
import { callM01Hook, dumpStores, PACKAGE_STORES } from './helpers';
import { chooseLanguage, defaultPublication, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

const M02_STORES = ['playSessions', 'checkpointVisits', 'pendingSyncItems'];

test('V22 — context A AUTHORIZED; A chuyển TAM_DONG; làm mới danh mục: A biến mất, Start bị chặn, context REVOKED, gói và store M02 không đổi', async ({
  page,
}) => {
  const mock = await mockPublication(page, defaultPublication());
  const { routes, snapshots } = publicationFixture();
  await page.goto('/');
  await chooseLanguage(page);
  await expect(page.getByRole('link', { name: /Tuyến thử Bách Thảo/ })).toBeVisible();
  const context = contextFromSnapshot(snapshots.A);
  await callM01Hook(page, 'seedContext', context);
  await callM01Hook(page, 'seedPackage', packageFromPublication(routes.A, snapshots.A));
  const before = await dumpStores(page, [...PACKAGE_STORES, ...M02_STORES]);

  // M03 tạm đóng tuyến A; du khách làm mới danh mục
  mock.routes = mock.routes.map((route) => (route.routeId === 'route-a' ? { ...route, status: 'TAM_DONG' } : route));
  await page.getByRole('link', { name: 'Tài nguyên offline' }).click();
  // Chờ màn /offline hiện (chunk lazy) để màn danh mục thật sự mount lại và làm mới nguồn
  await expect(page.getByRole('heading', { level: 1, name: 'Quản lý tài nguyên offline' })).toBeVisible();
  await page.getByRole('link', { name: 'Danh mục tuyến' }).click();
  await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Tuyến thử Bách Thảo/ })).toHaveCount(0);

  await expect
    .poll(async () => ((await dumpStores(page, ['selectedRouteContext'])).selectedRouteContext as { authorizationStatus: string }[])[0]?.authorizationStatus)
    .toBe('REVOKED');
  const [row] = (await dumpStores(page, ['selectedRouteContext'])).selectedRouteContext ?? [];
  expect(row).toEqual({ ...context, authorizationStatus: 'REVOKED', slot: 'current' });

  await page.goto('/routes/route-a');
  await expect(page.getByText('Tuyến này hiện không nhận chuyến mới.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu' })).toHaveCount(0);

  // routeEssentials của gói được làm mới sau mỗi lần đọc nguồn thành công (FR-M01-014): so phần còn lại
  const withoutEssentials = (data: Record<string, unknown[]>) => ({
    ...data,
    offlinePackages: (data.offlinePackages ?? []).map((row) => ({ ...(row as object), routeEssentials: undefined })),
  });
  expect(withoutEssentials(await dumpStores(page, [...PACKAGE_STORES, ...M02_STORES]))).toEqual(withoutEssentials(before));
});
