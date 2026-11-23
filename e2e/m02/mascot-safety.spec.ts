// Mila tránh đường (specs/005 tasks T025; US-MAS-05; SC-MAS-003, 004). Build `preview:e2e` bật VITE_FEATURE_MASCOT.
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

const BASE = 'http://localhost:4173';
type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function startTrip(page: Page, overrides: Parameters<typeof mockLookup>[1] = {}) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page, overrides);
  await mockStorage(page);
  await mockIntakeUnavailable(page);
  await page.goto('/');
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

async function scan(page: Page, qr: string) {
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `${BASE}/q/${qr}`);
}

test('Q7 — mã của điểm tạm đóng: chỉ có thông báo cố định, không có Mila trên màn (SC-MAS-003)', async ({ page }) => {
  await startTrip(page, { Q1a: { outcome: 'TEMPORARILY_CLOSED', closedScope: 'CHECKPOINT' } });
  await scan(page, 'Q1a');
  await expect(page.getByText(vi.notice.temporarilyClosed)).toBeVisible();
  await page.waitForTimeout(300);
  await expect(page.locator('[data-mascot-mode]')).toHaveCount(0);
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
});

test('Q8 — audio đang phát: không bong bóng nào của Mila (SC-MAS-004)', async ({ page }) => {
  await startTrip(page);
  await scan(page, 'Q2');
  await expect(page).toHaveURL(/\/trip\/qr\/Q2$/);
  const audio = page.locator('audio').first();
  await expect(audio).toBeAttached();
  await audio.evaluate((element) => element.dispatchEvent(new Event('play')));
  await page.waitForTimeout(300);
  await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
});
