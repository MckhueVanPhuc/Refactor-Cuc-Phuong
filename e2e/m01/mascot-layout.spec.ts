// Bố cục Mila trên màn M01 (specs/005 tasks T026; SC-MAS-002): ở 320–430 px, Mila không đè phần tử nào, không cuộn
// ngang. Chạy lại sau mỗi story thêm slot.
import { expect, test } from '@playwright/test';
import { checkLayoutAcrossWidths, figureWidth } from '../mascot-helpers';
import { chooseLanguage, mockPublication } from './network';

// Bốn chiều rộng × nhiều màn: lâu hơn mức 30 s mặc định khi máy tải nặng
test.describe.configure({ timeout: 120_000 });

test.use({ locale: 'vi-VN' });

test('SCR-M01-001…004', async ({ page }) => {
  await mockPublication(page);
  await page.goto('/');
  await chooseLanguage(page);
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Tuyến thử Ao Hồ/ })).toBeVisible();
  });
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/recommend');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/');
    await page.getByRole('link', { name: /Tuyến thử Ao Hồ/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
  await checkLayoutAcrossWidths(page, async () => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

// Cỡ tối đa theo token (88 px dưới 360 px, 112 px từ 360 px); Mila co lại nếu tiêu đề một dòng cần thêm chỗ (DV-62)
for (const { width, size } of [
  { width: 320, size: 88 },
  { width: 360, size: 96 },
  { width: 390, size: 96 },
  { width: 430, size: 96 },
]) {
  test(`Q32 (v1.6) — hero danh mục ${width} px: tiêu đề một dòng, dải đồi hiện, Mila ${size} px trên đồi; bong bóng dưới hero, Mila không đổi chỗ; VI/EN cùng chỗ`, async ({
    page,
  }) => {
    await mockPublication(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await chooseLanguage(page);
    // Tải lại: du khách quay lại → câu chào 004 ở hero; đóng để Mila đứng yên
    await page.reload();
    await expect(page.locator('[data-mascot-message="MSG-MAS-004"]')).toBeVisible();
    await page.getByRole('button', { name: 'Đóng lời nhắn' }).click();
    await expect(page.locator('[data-mascot-message]')).toHaveCount(0);
    const mila = await figureWidth(page, 'catalog-hero', 'DOCK');
    expect(mila).toBeLessThanOrEqual(size);
    expect(mila).toBeGreaterThanOrEqual(72);

    const title = page.getByRole('heading', { level: 1 });
    const lineHeight = await title.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight));
    expect((await title.boundingBox())!.height).toBeLessThan(lineHeight * 1.5);
    // Dải đồi: span trang trí con trực tiếp của hero (icon được nhúng dạng data URI nên không tìm theo tên tệp)
    // Dải đồi (không tính lớp nắng/lá trang trí của specs/006 US8)
    const hills = title.locator('xpath=..').locator(':scope > span[aria-hidden="true"]:not([data-hero-decor])');
    await expect(hills).toHaveCount(1);
    await expect(hills).toBeVisible();
    expect((await hills.boundingBox())!.width).toBeGreaterThan(mila);
    // Không cuộn ngang
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

    const figure = page.getByRole('button', { name: 'Hỏi Mila' });
    // Vị trí layout (không tính transform của animation khi chạm)
    const layoutBox = (target = figure) =>
      target.evaluate((node) => {
        const element = node as HTMLElement;
        const parent = element.offsetParent?.getBoundingClientRect() ?? { x: 0, y: 0 };
        return { x: parent.x + element.offsetLeft, y: parent.y + element.offsetTop, width: element.offsetWidth, height: element.offsetHeight };
      });
    const before = await layoutBox();
    const recommend = (await page.getByRole('link', { name: 'Gợi ý tuyến' }).boundingBox())!;
    const titleBox = (await title.boundingBox())!;
    // Mila không đè tiêu đề hay nút "Gợi ý tuyến" (v1.6, phương án C: tiêu đề một hàng, Mila cạnh nút ở hàng dưới)
    expect(before.x).toBeGreaterThanOrEqual(recommend.x + recommend.width - 1);
    const titleRight = titleBox.x + (await title.evaluate((element) => element.scrollWidth));
    // Hàng dưới được kéo lên --space-2 (8 px) vào phần đệm dòng của tiêu đề; khung ảnh Mila có lề trong suốt phía trên
    const titleBottom = titleBox.y + titleBox.height;
    expect(before.x >= titleRight - 1 || before.y >= titleBottom - 9, JSON.stringify({ before, titleRight, titleBottom })).toBe(true);
    // Nút một dòng
    expect(recommend.height).toBeLessThanOrEqual(48);
    // Đổi sang EN: chỉ đổi chữ — Mila, nút và tiêu đề cùng chỗ, cùng cỡ (CHG-MASCOT-2026-11-25-06 D4)
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Route suggestions' })).toBeVisible();
    const en = await layoutBox(page.getByRole('button', { name: 'Ask Mila' }));
    expect(en).toEqual(before);
    const recommendEn = (await page.getByRole('link', { name: 'Route suggestions' }).boundingBox())!;
    expect(recommendEn).toEqual(recommend);
    expect((await title.boundingBox())!.y).toBeCloseTo(titleBox.y, 0);
    await page.getByRole('button', { name: 'VI', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Gợi ý tuyến' })).toBeVisible();

    await figure.click();
    const bubble = page.locator('[data-mascot-message="MSG-MAS-009"]');
    await expect(bubble).toBeVisible();
    await page.waitForTimeout(300);
    const after = await layoutBox();
    expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
    // Bong bóng nằm dưới Mila (dưới hero), không đè thẻ tuyến
    const bubbleBox = (await bubble.boundingBox())!;
    expect(bubbleBox.y).toBeGreaterThan(after.y + after.height - 1);
    const card = (await page.getByRole('link', { name: /Tuyến thử Ao Hồ/ }).boundingBox())!;
    expect(card.y).toBeGreaterThan(bubbleBox.y + bubbleBox.height);
  });
}
