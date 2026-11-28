// SCR-M02-005 Quét QR mở từ nút giữa thanh tab M01 (2026-11-21), project `m02`: camera giả của Chromium phát mã
// `${BASE}/q/Q1a` (e2e/fixtures/qr-q1a.y4m), nên đây là đường camera thật: bấm tab → camera bật ngay → đọc mã → nội dung.
import { expect, test, type Page } from '@playwright/test';
import { vi } from '../../src/modules/m02/i18n/vi';
import { chooseLanguage, mockPublication } from '../m01/network';
import { dumpStores, expectCheckInFeedback, M02_STORES, seedValidContext } from './helpers';
import { mockLookup, mockStorage } from './network';

async function m02StoreCounts(page: Page) {
  const dump = await dumpStores(page, M02_STORES);
  return M02_STORES.map((store) => dump[store]!.length);
}

const scanTab = (page: Page) =>
  page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Quét QR' });

test('V-SCAN-1 — không có phiên: bấm Quét QR ở thanh tab → camera đọc mã → nội dung khách tự do; không ghi gì; chỉ có Chọn tuyến về danh mục (không có Quay lại)', async ({
  page,
}) => {
  await mockPublication(page);
  const requests = await mockLookup(page);
  await mockStorage(page);
  await page.goto('/');
  await chooseLanguage(page);

  await scanTab(page).click();
  await expect(page).toHaveURL(/\/trip\/qr\/Q1a$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng Q1a' })).toBeVisible();
  await expect(page.getByText(vi.notice.freeVisitor)).toBeVisible();
  await expect(page.getByRole('link', { name: vi.content.back })).toHaveCount(0);
  expect(requests).toEqual([{ p_qr_identifier: 'Q1a' }]);
  expect(await m02StoreCounts(page)).toEqual([0, 0, 0]);

  await page.getByRole('link', { name: vi.qrLink.chooseRoute }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Danh mục tuyến' })).toBeVisible();
});

test('V-SCAN-2 — đang có phiên: quét từ thanh tab ở danh mục là lượt quét của phiên (gửi tuyến, ghi lượt ghé, toast)', async ({
  page,
}) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockPublication(page);
  const requests = await mockLookup(page);
  await mockStorage(page);
  await page.goto('/');
  await chooseLanguage(page);
  await seedValidContext(page);
  await page.goto('/trip');
  await expect(page.getByText(vi.notice.sessionStartHint)).toBeVisible();

  await page.goto('/');
  await scanTab(page).click();
  await expect(page).toHaveURL(/\/trip\/qr\/Q1a$/);
  await expectCheckInFeedback(page);
  expect(requests.at(-1)).toEqual({ p_qr_identifier: 'Q1a', p_route_id: 'A' });
  const visits = (await dumpStores(page, ['checkpointVisits'])).checkpointVisits as { checkpointId: string }[];
  expect(visits.map((visit) => visit.checkpointId)).toEqual(['C1']);
});
