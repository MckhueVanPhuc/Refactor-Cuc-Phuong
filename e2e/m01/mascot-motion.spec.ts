// Công tắc "Hiệu ứng chuyển động" (v1.4; trước "Chuyển động của Mila") và cử chỉ tự động (specs/005 tasks T083, T104; spec-Mascot v1.3 BR-MAS-17, 21;
// SC-MAS-011, 014; quickstart Q18–Q20, Q33). v1.3: công tắc duy nhất ở màn Tài nguyên, header không còn nút. Danh mục của du khách quay lại: câu chào 004 → đóng → Mila đứng chờ ở hero.
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

const motionSwitch = (page: Page) => page.getByRole('switch', { name: /Hiệu ứng chuyển động/ });

/** Mở màn Tài nguyên bằng thanh tab (điều hướng trong app, không tải lại: công tắc chỉ sống trong lần tải trang). */
async function openResources(page: Page) {
  await page.getByRole('link', { name: 'Tài nguyên' }).click();
  await expect(page).toHaveURL(/\/offline$/);
}

async function openCatalog(page: Page) {
  await page.getByRole('link', { name: 'Tuyến', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Animation đang chạy trong Mila (kể cả lá rơi). */
const runningMascotAnimations = (page: Page) =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running' && (a.effect as KeyframeEffect | null)?.target?.closest('[data-mascot-mode]')).length,
  );

test('Q18 (v1.5) — Mila đứng chờ ở danh mục: có cử chỉ tự động (lần đầu có thể là chớp mắt nên chờ tới 18 giây); cử chỉ ≤ 3 giây; chỉ có thở nhẹ chạy liên tục (SC-MAS-014: có công tắc)', async ({ page }) => {
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
    .poll(() => page.evaluate(() => (window as unknown as SeenWindow).__mascotAnimations!.some((a) => a.startsWith('gesture'))), {
      timeout: 18_000,
    })
    .toBe(true);
  const endTimes = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest('[data-mascot-mode]'))
      .map((a) => ({ end: Number(a.effect!.getComputedTiming().endTime), name: (a as CSSAnimation).animationName ?? '' })),
  );
  // Cử chỉ và phản ứng có hạn: ≤ 3 s (BR-MAS-21 v1.5) trong giới hạn 5 s; chỉ thở nhẹ ở DOCK chạy liên tục, dừng được bằng
  // công tắc ở Tài nguyên (Q19)
  for (const { end, name } of endTimes) {
    if (Number.isFinite(end)) expect(end).toBeLessThanOrEqual(5_000);
    else expect(name).toContain('mascot-breathe');
  }
});

test('Q19, Q33 — tắt công tắc ở Tài nguyên: không animation nào của Mila chạy ở danh mục, Mila vẫn hiện; bật lại thì có lại (SC-MAS-011)', async ({ page }) => {
  await returningVisitor(page);
  await openResources(page);
  await expect(motionSwitch(page)).toHaveAttribute('aria-checked', 'true');
  await expect(motionSwitch(page)).toContainText('Tắt để Mila và hiệu ứng trang trí đứng yên.');
  await motionSwitch(page).click();
  await expect(motionSwitch(page)).toHaveAttribute('aria-checked', 'false');
  await openCatalog(page);
  await expect(page.locator('[data-mascot-mode="DOCK"]')).toBeVisible();
  await page.waitForTimeout(300);
  expect(await runningMascotAnimations(page)).toBe(0);
  await expect(page.locator('[data-mascot-mode]')).not.toHaveAttribute('data-mascot-animation', /.+/);
  await openResources(page);
  await motionSwitch(page).click();
  await expect(motionSwitch(page)).toHaveAttribute('aria-checked', 'true');
});

test('Q20 — thiết bị giảm chuyển động: công tắc khởi đầu ở "tắt"', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await openResources(page);
  await expect(motionSwitch(page)).toHaveAttribute('aria-checked', 'false');
});

test('Q33 — header của màn M01 và M02 không còn nút chuyển động; chỉ màn Tài nguyên có công tắc', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(page.locator('[data-motion-switch], [data-mascot-motion-toggle]')).toHaveCount(0);
  await page.goto('/trip');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-motion-switch], [data-mascot-motion-toggle]')).toHaveCount(0);
  await page.goto('/offline');
  await expect(motionSwitch(page)).toBeVisible();
});
