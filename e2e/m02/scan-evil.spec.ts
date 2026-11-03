// Quickstart M02 V15 qua camera thật (project m02-cam-evil: camera giả phát `https://evil.example/q/Q1a`).
// Link đúng path nhưng sai base → mã không hợp lệ, không gọi lookup (FR-M02-026; BR-M02-023).
import { expect, test } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { dumpStores, seedValidContext } from './helpers';
import { mockLookup } from './network';

test('V15 — camera đọc https://evil.example/q/Q1a → mã không hợp lệ, không request, không lượt ghé', async ({ page }) => {
  const requests = await mockLookup(page);
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();

  await page.getByRole('button', { name: vi.trip.scan }).click();
  await expect(page.getByRole('alert')).toContainText(vi.notice.invalid);
  await expect(page).toHaveURL(/\/trip$/);
  expect(requests).toEqual([]);
  expect((await dumpStores(page, ['checkpointVisits'])).checkpointVisits).toEqual([]);
});
