// Quickstart M01 V1–V3 (US-M01-01; tasks T038) trên bản build MODE e2e (project `m01`).
import { expect, test } from '@playwright/test';
import { publicationFixture } from '../../src/shared/contracts/__fixtures__/publication';
import { contextFromSnapshot, packageFromPublication } from '../../src/modules/m01/testing/packageFixture';
import { callM01Hook, dumpStores, PACKAGE_STORES } from './helpers';
import { mockPublication } from './network';

test.use({ locale: 'vi-VN' });

test('V1 — mở / lần đầu: panel chọn ngôn ngữ chặn trang; chọn English → lưu en, UI tiếng Anh', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Chọn ngôn ngữ (Tiếng Việt / English)' })).toBeVisible();
  await expect(page.getByRole('banner')).toHaveCount(0);

  await page.getByRole('button', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Routes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Offline downloads' })).toBeVisible();
  expect((await dumpStores(page, ['languagePreference'])).languagePreference).toEqual([
    { slot: 'current', languageCode: 'en' },
  ]);

  // Tải lại: không hỏi lại
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Routes' })).toBeVisible();
});

// Trang /q/{qrIdentifier} thuộc M02 (package 002, SCR-M02-004) chưa được cài; hành vi "không panel, không ghi gì"
// đã kiểm ở src/modules/m01/language/LanguageGate.test.tsx. Bật lại khi M02 có trang này.
test.fixme('V2 — mở /q/{id} lần đầu với vi-VN rồi en-US: không panel, hiển thị theo thiết bị, store trống', async () => {});

test('V3 — offline, bấm VI/EN trên SCR-M01-003 có gói: UI đổi ngay; gói và context không đổi', async ({ page, context }) => {
  const { routes, snapshots } = publicationFixture();
  await mockPublication(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Tiếng Việt' }).click();
  await callM01Hook(page, 'seedPackage', packageFromPublication(routes.A, snapshots.A));
  await callM01Hook(page, 'seedContext', contextFromSnapshot(snapshots.A));
  await page.goto('/routes/route-a');
  await expect(page.getByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeVisible();
  const before = await dumpStores(page, [...PACKAGE_STORES, 'selectedRouteContext']);

  await context.setOffline(true);
  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Test Botanic trail' })).toBeVisible();
  await expect(page.getByText('Test gate A')).toBeVisible();
  await expect(page.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'VI' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tuyến thử Bách Thảo' })).toBeVisible();

  expect(await dumpStores(page, [...PACKAGE_STORES, 'selectedRouteContext'])).toEqual(before);
  expect((await dumpStores(page, ['languagePreference'])).languagePreference).toEqual([
    { slot: 'current', languageCode: 'vi' },
  ]);
  await context.setOffline(false);
});
