// Công tắc "Chuyển động" và cử chỉ tự động (specs/005 tasks T083; spec-Mascot BR-MAS-17, 21; SC-MAS-011, 014;
// quickstart Q18–Q20). Danh mục của du khách quay lại: câu chào 004 → đóng → Mila đứng chờ ở hero.
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });
test.describe.configure({ timeout: 60_000 });

type SeenWindow = { __mascotAnimations?: string[] };

async function returningVisitor(page: Page) {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.reload();
  await expect(page.locator('[data-mascot-message="MSG-MAS-004"]')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
  await expect(page.locator('[data-mascot-slot="catalog-hero"] [data-mascot-mode="DOCK"]')).toBeVisible();
}

const toggle = (page: Page) => page.getByRole('button', { name: 'Chuyển động của Mila' });

/** Animation đang chạy trong Mila (kể cả lá rơi). */
const runningMascotAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect | null)?.target?.closest('[data-mascot-mode]')).length,
  );

test('Q18 — Mila đứng chờ ở danh mục: có cử chỉ tự động trong 16 giây; mọi animation dừng trong 5 giây (SC-MAS-014)', async ({ page }) => {
  await page.addInitScript(() => {
    const seen: string[] = [];
    (window as unknown as SeenWindow).__mascotAnimations = seen;
    new MutationObserver(() => {
      const element = document.querySelector('[data-mascot-slot="catalog-hero"] [data-mascot-mode="DOCK"]');
      const value = element?.getAttribute('data-mascot-animation');
      if (value && seen[seen.length - 1] !== value) seen.push(value);
    }).observe(document, { subtree: true, childList: true, attributes: true });
  });
  await returningVisitor(page);
  await expect
    .poll(() => page.evaluate(() => (window as unknown as SeenWindow).__mascotAnimations!.some((a) => ['tilt', 'wave', 'hop'].includes(a))), {
      timeout: 17_000,
    })
    .toBe(true);
  const endTimes = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest('[data-mascot-mode]'))
      .map((a) => Number(a.effect!.getComputedTiming().endTime)),
  );
  for (const end of endTimes) expect(end).toBeLessThanOrEqual(5_000);
});

test('Q19 — tắt công tắc: không animation nào của Mila chạy, Mila vẫn hiện; bật lại thì có lại (SC-MAS-011)', async ({ page }) => {
  await returningVisitor(page);
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle(page)).toContainText('Chuyển động: tắt');
  await page.waitForTimeout(300);
  expect(await runningMascotAnimations(page)).toBe(0);
  await expect(page.locator('[data-mascot-mode="DOCK"]')).toBeVisible();
  await expect(page.locator('[data-mascot-mode]')).not.toHaveAttribute('data-mascot-animation', /.+/);
  await toggle(page).click();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
});

test('Q20 — thiết bị giảm chuyển động: công tắc khởi đầu ở "tắt"', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
});

test('công tắc có ở thanh đầu trang M02 (màn chuyến đi không phiên)', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await page.goto('/trip');
  await expect(toggle(page)).toBeVisible();
});
