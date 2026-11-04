// Hai tab cùng trình duyệt (tasks T095; BR-M02-002; field-ui-flow §5): quét ở tab A thì tab B thấy lượt ghé; thay phiên
// ở tab A thì tab B thấy phiên mới; không bao giờ có hai phiên DANG_DIEN_RA.
import { expect, test, type Page } from '@playwright/test';
import { contextV3 } from '../../src/modules/m02/api/fake/fixtures';
import { vi } from '../../src/modules/m02/i18n/vi';
import { callM01Hook, playSessions, seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function prepare(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  await mockIntakeUnavailable(page);
}

test('quét ở tab A → tab B thấy lượt ghé; thay phiên ở tab A → tab B thấy phiên mới; luôn một phiên chạy', async ({ page: tabA, context }) => {
  await prepare(tabA);
  await tabA.goto('/');
  await seedValidContext(tabA);
  await tabA.goto('/trip');
  await expect(tabA.getByText(vi.notice.sessionStartHint)).toBeVisible();

  const tabB = await context.newPage();
  await prepare(tabB);
  await tabB.goto('/trip');
  await expect(tabB.locator('[data-entry="RESTORED"]')).toBeAttached();
  const first = (await playSessions(tabA))[0]!.sessionId as string;
  await expect(tabB.locator('[data-session-id]')).toHaveAttribute('data-session-id', first);
  await expect(tabB.getByText(vi.journey.progress({ scanned: 0, total: 3 }))).toBeVisible();

  // Quét ở tab A
  await tabA.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await tabA.evaluate(() => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!('http://localhost:4173/q/Q2'));
  await expect(tabA).toHaveURL(/\/trip\/qr\/Q2$/);
  await expect(tabB.getByText(vi.journey.progress({ scanned: 1, total: 3 }))).toBeVisible();
  await expect(tabB.getByText(vi.trip.scanned, { exact: true })).toHaveCount(1);

  // Thay phiên ở tab A
  await callM01Hook(tabA, 'seedContext', contextV3({ authorizedAt: new Date(Date.now() - 60_000).toISOString(), handoffId: '2e1d0c9b-8a7f-4e6d-9c5b-4a3f2e1d0c9b' }));
  await tabA.goto('/trip');
  await expect(tabA.getByText(vi.notice.sessionStartHint)).toBeVisible();
  const sessions = await playSessions(tabA);
  const running = sessions.filter((s) => s.status === 'DANG_DIEN_RA');
  expect(running).toHaveLength(1);
  expect(sessions.find((s) => s.sessionId === first)).toMatchObject({ status: 'BO_DO' });
  await expect(tabB.locator('[data-session-id]')).toHaveAttribute('data-session-id', String(running[0]!.sessionId));
  await expect(tabB.getByText(vi.journey.progress({ scanned: 0, total: 3 }))).toBeVisible();
  await tabB.close();
});
