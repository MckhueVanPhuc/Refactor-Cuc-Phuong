// Quickstart M02 V28 (tasks T094; SC-M02-013; field-ui-flow §3): duyệt mọi màn M02 ở cả vi và en, quét chữ hiển thị:
// không có "đã đến", "có mặt", "arrived", mã enum hay UUID thô. (Tên đối tượng của fixture synthetic có chứa mã như
// "Q1a" — đó là nội dung giả, không phải định danh được render.)
import { expect, test, type Page } from '@playwright/test';
import { contextV3 } from '../../src/modules/m02/api/fake/fixtures';
import { callM01Hook, seedValidContext } from './helpers';
import { mockIntakeUnavailable, mockLookup, mockStorage } from './network';

const FORBIDDEN = [/đã đến/i, /có mặt/i, /arrived/i];
const ENUM_CODES = /\b(DANG_DIEN_RA|HOAN_TAT|BO_DO|PENDING|SYNCED|CONFLICT|VALID|INVALID|TEMPORARILY_CLOSED|OFFLINE_REQUIRED|ONLINE_AVAILABLE|AUTHORIZED|REVOKED|SAN_SANG|OUTDATED)\b/;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

type M02TestWindow = { __cpqTestHooks?: { m02?: { scan?: (text: string) => Promise<void> } } };

async function scan(page: Page, qr: string) {
  await page.waitForFunction(() => Boolean((window as unknown as M02TestWindow).__cpqTestHooks?.m02?.scan));
  await page.evaluate((text) => (window as unknown as M02TestWindow).__cpqTestHooks!.m02!.scan!(text), `http://localhost:4173/q/${qr}`);
}

/** Toàn bộ chữ hiển thị và nhãn truy cập của màn đang mở. */
async function visibleText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const labels = [...document.querySelectorAll('[aria-label], [alt], [title]')].map((el) =>
      ['aria-label', 'alt', 'title'].map((name) => el.getAttribute(name) ?? '').join(' '),
    );
    return `${document.body.innerText}\n${labels.join('\n')}`;
  });
}

for (const language of ['vi', 'en'] as const) {
  test(`V28 (${language}) — không màn M02 nào diễn đạt lượt ghé là có mặt; không mã enum hay UUID`, async ({ page }) => {
    await page.addInitScript((lang) => Object.defineProperty(navigator, 'language', { get: () => (lang === 'vi' ? 'vi-VN' : 'en-US') }), language);
    await mockLookup(page, { QX: { outcome: 'TEMPORARILY_CLOSED', closedScope: 'ROUTE' } });
    await mockStorage(page);
    await mockIntakeUnavailable(page);
    const screens: Record<string, string> = {};

    // Handoff bị từ chối
    await page.goto('/');
    await callM01Hook(page, 'seedContext', contextV3({ authorizedAt: new Date(Date.now() - 60_000).toISOString(), authorizationStatus: 'REVOKED' }));
    await page.goto('/trip');
    await expect(page.getByRole('alert')).toBeVisible();
    screens.rejected = await visibleText(page);

    // Phiên: journey, nội dung live có media, tạm đóng, câu hỏi cuối chuyến, màn kết quả
    await seedValidContext(page);
    await page.goto('/trip');
    await expect(page.getByRole('listitem')).toHaveCount(3);
    screens.trip = await visibleText(page);
    await scan(page, 'Q2');
    await expect(page.locator('article[data-view="LIVE"]')).toBeAttached();
    screens.content = await visibleText(page);
    await page.goto('/trip');
    await expect(page.getByRole('listitem')).toHaveCount(3);
    screens.tripScanned = await visibleText(page);
    await scan(page, 'QX');
    await expect(page.getByRole('alert')).toBeVisible();
    screens.closed = await visibleText(page);
    await scan(page, 'Q3');
    await expect(page.getByRole('alertdialog')).toBeVisible();
    screens.finalPrompt = await visibleText(page);
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="alertdialog"]');
      return Boolean(dialog?.parentElement && getComputedStyle(dialog.parentElement).position === 'fixed');
    });
    await page.locator('[role="alertdialog"] button').first().click();
    await expect(page).toHaveURL(/\/trip\/end$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    screens.end = await visibleText(page);

    // Trang mở từ camera điện thoại, khách tự do
    await page.goto('/q/Q1a');
    await expect(page.locator('article[data-view="LIVE"]')).toBeAttached();
    screens.qrLink = await visibleText(page);

    for (const [name, text] of Object.entries(screens)) {
      for (const word of FORBIDDEN) expect(text, `${name}: ${word}`).not.toMatch(word);
      expect(text, `${name}: mã enum`).not.toMatch(ENUM_CODES);
      expect(text, `${name}: UUID`).not.toMatch(UUID);
    }
  });
}
