// Phản hồi nhấn (specs/006 T017; quickstart M1, M2; design-system §5.4 v1.4): nhấn giữ → co lại, nhả → về; bố cục
// không dịch; giảm chuyển động → chỉ lớp phủ (transform: none).
import { expect, test, type Locator, type Page } from '@playwright/test';
import { chooseLanguage, mockPublication } from './network';

/** `target`: phần tử nhận con trỏ; `read`: phần tử co lại (mặc định chính nó). */
async function pressAndRead(page: Page, target: Locator, read: (el: Element) => Element = (el) => el) {
  await expect(target).toBeVisible();
  // Chờ chuyển cảnh (view transition) kết thúc: trong lúc chuyển cảnh, lớp giả của trình duyệt nhận con trỏ
  await expect
    .poll(() => page.evaluate(() => document.getAnimations().filter((a) => (a.effect as KeyframeEffect | null)?.pseudoElement?.startsWith('::view-transition')).length))
    .toBe(0);
  // hover() chờ phần tử đứng yên (bong bóng của Mila có thể vừa đẩy nội dung xuống) rồi đặt chuột đúng giữa
  await target.hover();
  await page.mouse.down();
  await page.waitForTimeout(250);
  const pressed = await target.evaluate((el, readSource) => {
    const pick = new Function('el', `return (${readSource})(el)`) as (el: Element) => Element;
    return getComputedStyle(pick(el)).transform;
  }, read.toString());
  await page.mouse.up();
  return pressed;
}

async function openCatalog(page: Page) {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
}

test('M1: nhấn giữ thẻ tuyến → co lại; thẻ kế bên không dịch', async ({ page }) => {
  await openCatalog(page);
  const cards = page.locator('a[href^="/routes/"]');
  await expect(cards.first()).toBeVisible();
  await page.waitForTimeout(800);
  // Vị trí bố cục (offset, không tính transform) của thẻ kế bên
  const layoutOf = () => cards.nth(1).evaluate((el) => ({ top: (el as HTMLElement).offsetTop, left: (el as HTMLElement).offsetLeft }));
  const neighbour = await layoutOf();
  // Không thả chuột trong lúc đo để không điều hướng
  const box = (await cards.first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 8);
  await page.mouse.down();
  await page.waitForTimeout(250);
  const pressed = await cards.first().evaluate((el) => getComputedStyle(el).transform);
  expect(pressed).toMatch(/^matrix\(0\.9[0-9]+/);
  expect(await layoutOf()).toEqual(neighbour);
  await page.mouse.move(0, 0);
  await page.mouse.up();
});

test('M1: nhấn giữ một ô tiêu chí ở Gợi ý tuyến → co lại', async ({ page }) => {
  await openCatalog(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  // Bong bóng gợi ý của Mila hiện sau 400 ms và đẩy form xuống một lần: chờ nó trước khi nhấn
  await expect(page.locator('[data-mascot-message="MSG-MAS-010"]')).toBeVisible();
  // Ô chọn (checkbox) trong suốt đè lên ô chữ (ô kính) nhận con trỏ; ô chữ là phần co lại (spec-M01 v3.3)
  const radio = page.getByRole('checkbox', { name: /Ngắn/ });
  const pressed = await pressAndRead(page, radio, (el) => el.nextElementSibling!);
  expect(pressed).toMatch(/^matrix\(0\.9[0-9]+/);
});

test('M2: giảm chuyển động → không co (chỉ lớp phủ màu)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCatalog(page);
  await page.getByRole('link', { name: 'Gợi ý tuyến' }).click();
  const radio = page.getByRole('checkbox', { name: /Ngắn/ });
  expect(await pressAndRead(page, radio, (el) => el.nextElementSibling!)).toBe('none');
});
