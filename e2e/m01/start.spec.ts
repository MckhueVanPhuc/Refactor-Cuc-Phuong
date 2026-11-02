// Quickstart M01 V17–V21 (US-M01-04; tasks T060) trên bản build MODE e2e, network mock (project `m01`).
import { expect, test, type Page } from '@playwright/test';
import { publicationFixture } from '../../src/shared/contracts/__fixtures__/publication';
import { contextFromSnapshot, manifestOf, packageFromPublication } from '../../src/modules/m01/testing/packageFixture';
import { callM01Hook, dumpStores } from './helpers';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

type ContextRow = Record<string, unknown> & { handoffId: string; authorizedAt: string; expiresAt: string };

async function contextRows(page: Page): Promise<ContextRow[]> {
  return (await dumpStores(page, ['selectedRouteContext'])).selectedRouteContext as ContextRow[];
}

async function openDetail(page: Page, routeId: string) {
  await page.goto(`/routes/${routeId}`);
  await expect(page.getByRole('button', { name: 'Bắt đầu' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
});

test('V17 — Start B online: context v3 AUTHORIZED, handoffId UUID, hạn 24 giờ, manifest = snapshot B; sang M02 sau commit', async ({
  page,
}) => {
  await openDetail(page, 'route-b');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page).toHaveURL(/\/trip$/);
  const [row] = await contextRows(page);
  expect(row).toMatchObject({
    slot: 'current',
    contractVersion: 3,
    routeId: 'route-b',
    authorizationStatus: 'AUTHORIZED',
    routeJourneyManifest: manifestOf(publicationFixture().snapshots.B),
  });
  expect(row!.handoffId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(Date.parse(row!.expiresAt) - Date.parse(row!.authorizedAt)).toBe(86_400_000);
});

test('V18 — Start B lần hai: handoffId mới, context cũ bị thay', async ({ page }) => {
  await openDetail(page, 'route-b');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page).toHaveURL(/\/trip$/);
  const [first] = await contextRows(page);
  await openDetail(page, 'route-b');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page).toHaveURL(/\/trip$/);
  const rows = await contextRows(page);
  expect(rows).toHaveLength(1);
  expect(rows[0]!.handoffId).not.toBe(first!.handoffId);
});

test('V19 — offline, có gói A OUTDATED: cảnh báo cũ; context từ manifest của gói (version gói)', async ({ page, context }) => {
  const { routes, snapshots } = publicationFixture();
  await callM01Hook(page, 'seedPackage', packageFromPublication(routes.A, snapshots.A, { versionStatus: 'OUTDATED' }));
  await openDetail(page, 'route-a');
  await expect(page.getByText('Gói tải trước này đã cũ nhưng vẫn dùng được.')).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page).toHaveURL(/\/trip$/);
  const [row] = await contextRows(page);
  expect(row).toMatchObject({ routeId: 'route-a', routeJourneyManifest: manifestOf(snapshots.A) });
  await context.setOffline(false);
});

test('V20 — offline, không có gói: Start A và Start B đều bị chặn; context cũ không đổi', async ({ page, context }) => {
  const previous = contextFromSnapshot(publicationFixture().snapshots.B);
  await callM01Hook(page, 'seedContext', previous);
  for (const routeId of ['route-a', 'route-b']) {
    await openDetail(page, routeId);
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Bắt đầu' }).click();
    await expect(page.getByRole('alert')).toHaveText('Chưa bắt đầu được vì không có mạng và tuyến này chưa được tải trước.');
    await expect(page).toHaveURL(new RegExp(`/routes/${routeId}$`));
    await context.setOffline(false);
  }
  expect(await contextRows(page)).toEqual([{ ...previous, slot: 'current' }]);
});

test('V21 — bấm Start hai lần liền → một context; lỗi ghi transaction → context trước nguyên vẹn', async ({ page }) => {
  await openDetail(page, 'route-b');
  await page.getByRole('button', { name: 'Bắt đầu' }).dblclick();
  await expect(page).toHaveURL(/\/trip$/);
  const rows = await contextRows(page);
  expect(rows).toHaveLength(1);

  await openDetail(page, 'route-a');
  await callM01Hook(page, 'failNextContextWrite');
  await page.getByRole('button', { name: 'Bắt đầu' }).click();
  await expect(page.getByRole('alert')).toHaveText('Chưa bắt đầu được. Hãy thử lại.');
  await expect(page).toHaveURL(/\/routes\/route-a$/);
  expect(await contextRows(page)).toEqual(rows);
});
