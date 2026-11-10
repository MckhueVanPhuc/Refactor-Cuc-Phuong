// Quickstart M02 V13–V14 (tasks T059): mã ngoài hành trình, tạm đóng, không hợp lệ, lỗi mạng.
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { dumpStores, seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function startTrip(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

async function scan(page: Page, qrIdentifier: string) {
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qrIdentifier}`);
}

async function visits(page: Page) {
  return (await dumpStores(page, ['checkpointVisits'])).checkpointVisits;
}

test('V13 — online quét QX (ngoài tuyến) → nội dung live, không lượt ghé, journey không đổi', async ({ page }) => {
  await mockLookup(page);
  await mockStorage(page);
  await startTrip(page);
  await scan(page, 'QX');
  await expect(page).toHaveURL(/\/trip\/qr\/QX$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng QX' })).toBeVisible();
  await expect(page.getByText(vi.trip.visitRecorded)).toHaveCount(0);
  expect(await visits(page)).toEqual([]);
  await page.goto('/trip');
  await expect(page.getByRole('listitem')).toHaveCount(3);
  await expect(page.getByText(vi.journey.progress({ scanned: 0, total: 3 }))).toBeVisible();
});

test.describe('V14 — tạm đóng (ROUTE, CHECKPOINT) và INVALID: không nội dung, không lượt ghé', () => {
  for (const closedScope of ['ROUTE', 'CHECKPOINT'] as const) {
    test(`TEMPORARILY_CLOSED ${closedScope} với mã trong hành trình → cùng một thông báo tạm đóng`, async ({ page }) => {
      await mockLookup(page, { Q1a: { outcome: 'TEMPORARILY_CLOSED', closedScope } });
      await startTrip(page);
      await scan(page, 'Q1a');
      await expect(page.getByRole('alert')).toHaveText(vi.notice.temporarilyClosed);
      await expect(page).toHaveURL(/\/trip$/);
      await expect(page.locator('article')).toHaveCount(0);
      expect(await visits(page)).toEqual([]);
    });
  }

  test('INVALID → "Mã không còn hiệu lực hoặc không tồn tại.", không lượt ghé', async ({ page }) => {
    await mockLookup(page, { Q1a: { outcome: 'INVALID' } });
    await startTrip(page);
    await scan(page, 'Q1a');
    await expect(page.getByRole('alert')).toHaveText(vi.notice.invalid);
    expect(await visits(page)).toEqual([]);
  });

  test('lỗi mạng (HTTP 500) với mã ngoài hành trình → cần kết nối, không bao giờ là mã không hợp lệ', async ({ page }) => {
    await mockLookup(page, { QX: 'ERROR' });
    await startTrip(page);
    await scan(page, 'QX');
    await expect(page.getByRole('alert')).toHaveText(vi.notice.connectionNeeded);
    await expect(page.getByText(vi.notice.invalid)).toHaveCount(0);
    await expect(page.getByText(vi.notice.temporarilyClosed)).toHaveCount(0);
    expect(await visits(page)).toEqual([]);
  });
});
