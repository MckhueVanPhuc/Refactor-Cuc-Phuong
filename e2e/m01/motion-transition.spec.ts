// Chuyển cảnh và thẻ hiện dần (specs/006 T038; quickstart M11, M12; FR-MOT-006, 007; SC-MOT-004 theo DV-01).
import { expect, test, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

type VtWindow = { __vt?: string[] };

/** Ghi tên các pseudo-element view transition khi trình duyệt bắt đầu chuyển cảnh. */
async function recordTransitions(page: Page) {
  await page.evaluate(() => {
    const record: string[] = [];
    (window as unknown as VtWindow).__vt = record;
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    (document as unknown as { startViewTransition: typeof original }).startViewTransition = ((...args: Parameters<typeof original>) => {
      const transition = original(...args);
      void transition.ready.then(() => {
        for (const animation of document.getAnimations()) {
          const pseudo = (animation.effect as KeyframeEffect | null)?.pseudoElement;
          if (pseudo) record.push(pseudo);
        }
      });
      return transition;
    }) as typeof original;
  });
}

const recorded = (page: Page) => page.evaluate(() => (window as unknown as VtWindow).__vt ?? []);

async function open(page: Page) {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await expect(page.locator('a[href^="/routes/"]').first()).toBeVisible();
}

test('M11: chạm thẻ tuyến → chuyển cảnh (crossfade root)', async ({ page }) => {
  await open(page);
  await recordTransitions(page);
  await page.getByRole('link', { name: /Tuyến thử Bách Thảo/ }).click();
  await expect(page).toHaveURL(/\/routes\/route-a$/);
  // Ảnh chung route-cover không ghép được: ảnh đầu màn chi tiết đến sau (URL ký), xem validation report DV-04
  await expect.poll(() => recorded(page)).toContain('::view-transition-group(root)');
  // Back của trình duyệt (popstate) đổi màn tức thì: react-router không đưa vào transition (DV-04)
});

test('M11: giảm chuyển động → không animation chuyển cảnh', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page);
  await recordTransitions(page);
  await page.getByRole('link', { name: /Tuyến thử Bách Thảo/ }).click();
  await expect(page).toHaveURL(/\/routes\/route-a$/);
  await page.waitForTimeout(400);
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.startsWith('::view-transition')).length,
  );
  expect(running).toBe(0);
});

test('M12: thẻ dưới màn đầu ẩn rồi hiện khi cuộn tới; thẻ màn đầu hiện ngay; không dịch bố cục do reveal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 520 });
  await page.addInitScript(() => {
    (window as unknown as { __shifts: number }).__shifts = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
        if (!entry.hadRecentInput) (window as unknown as { __shifts: number }).__shifts += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await open(page);
  const cards = page.locator('a[href^="/routes/"]');
  await expect(cards.first()).toHaveAttribute('data-reveal', 'shown');
  const last = cards.last();
  await expect(last).toHaveAttribute('data-reveal', 'hidden');
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => (window as unknown as { __shifts: number }).__shifts);
  await last.scrollIntoViewIfNeeded();
  await expect(last).toHaveAttribute('data-reveal', 'shown');
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => (window as unknown as { __shifts: number }).__shifts);
  expect(after - before).toBe(0);
});
