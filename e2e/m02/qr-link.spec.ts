// Quickstart M02 V20–V22 (tasks T079): trang `/q/{qrIdentifier}` mở như từ camera điện thoại (điều hướng trang đầy đủ).
import { expect, test, type Page } from '@playwright/test';
import { readyPackage } from '../../src/modules/m02/api/fake/fixtures';
import { vi } from '../../src/modules/m02/i18n/vi';
import { callM01Hook, dumpStores, M02_STORES, seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

const viDevice = (page: Page) => page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));

async function m02StoreCounts(page: Page) {
  const dump = await dumpStores(page, M02_STORES);
  return M02_STORES.map((store) => dump[store]!.length);
}

/** Có phiên trong cùng trình duyệt: Start từ M01 (hook) rồi vào `/trip` một lần. */
async function startTrip(page: Page, pkg?: ReturnType<typeof readyPackage>) {
  await page.goto('/');
  await seedValidContext(page);
  if (pkg) await callM01Hook(page, 'seedPackage', pkg);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();
}

test('V20 — /q/Q1a không phiên, thiết bị vi-VN chưa có preference → nội dung ngay, tiếng Việt, gợi ý + "Chọn tuyến"; không ghi gì', async ({ page }) => {
  await viDevice(page);
  const requests = await mockLookup(page);
  await mockStorage(page);
  await page.goto('/q/Q1a');
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng Q1a' })).toBeVisible();
  await expect(page.getByText('Giới thiệu trực tuyến Q1a.')).toBeVisible();
  await expect(page.getByText(vi.notice.freeVisitor)).toBeVisible();
  await expect(page.getByRole('link', { name: vi.qrLink.chooseRoute })).toHaveAttribute('href', '/');
  // Không có bước chọn ngôn ngữ của M01 trước nội dung
  await expect(page.getByText('Chọn ngôn ngữ', { exact: true })).toHaveCount(0);
  expect(requests).toEqual([{ p_qr_identifier: 'Q1a' }]);
  expect(await m02StoreCounts(page)).toEqual([0, 0, 0]);
});

test('V21 — /q/… khi có phiên trong cùng trình duyệt → như quét trong app: lượt ghé, câu hỏi kết thúc ở điểm cuối', async ({ page }) => {
  await viDevice(page);
  const requests = await mockLookup(page);
  await mockStorage(page);
  await startTrip(page);

  await page.goto('/q/Q1a');
  await expect(page.getByText(vi.trip.visitRecorded)).toBeVisible();
  await expect(page.getByText(vi.notice.freeVisitor)).toHaveCount(0);
  expect(requests.at(-1)).toEqual({ p_qr_identifier: 'Q1a', p_route_id: 'A' });

  await page.goto('/q/Q3');
  await expect(page.getByRole('alertdialog')).toContainText(vi.endPrompt.question);
  const visits = (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkpointId: string }[];
  expect(visits.map((v) => v.checkpointId).sort()).toEqual(['C1', 'C3']);
});

test.describe('V22 — offline, đã từng mở app (shell đã cache)', () => {
  test('có phiên → như quét offline: lượt ghé + nội dung gói', async ({ page, context }) => {
    await viDevice(page);
    await mockLookup(page);
    await startTrip(page, readyPackage());
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.goto('/q/Q1a');
    await expect(page.getByText(vi.notice.sourceFailureInJourney)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Q1a (gói)' })).toBeVisible();
    const visits = (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkpointId: string }[];
    expect(visits.map((v) => v.checkpointId)).toEqual(['C1']);
    await context.setOffline(false);
  });

  test('không phiên → "Cần có kết nối mạng…" kèm gợi ý khách tự do; không ghi gì', async ({ page, context }) => {
    await viDevice(page);
    await mockLookup(page);
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.goto('/q/Q1a');
    await expect(page.getByRole('alert')).toHaveText(vi.notice.connectionNeeded);
    await expect(page.getByText(vi.notice.freeVisitor)).toBeVisible();
    expect(await m02StoreCounts(page)).toEqual([0, 0, 0]);
    await context.setOffline(false);
  });
});
