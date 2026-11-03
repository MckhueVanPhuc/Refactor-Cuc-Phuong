// Tasks T096 (visitor-ui-flow §4; screen spec): duyệt mọi màn M01 ở vi/en, DOM không có mã enum, ID hay tên trường.
import { expect, test, type Page } from '@playwright/test';
import { publicationFixture } from '../../src/shared/contracts/__fixtures__/publication';
import { packageFromPublication } from '../../src/modules/m01/testing/packageFixture';
import { callM01Hook } from './helpers';
import { chooseLanguage, mockPublication } from './network';

test.use({ locale: 'vi-VN' });

const FORBIDDEN = [
  'HOAT_DONG', 'TAM_DONG', 'LUU_TRU', 'NHE', 'TRUNG_BINH', 'KHO', 'TIME_NGAN', 'TIME_VUA', 'TIME_DAI', 'GROUP_', 'INTEREST_',
  'SAN_SANG', 'DANG_TAI', 'CHUA_TAI', 'CHUA_HOAN_TAT', 'CURRENT', 'OUTDATED', 'OFFLINE_REQUIRED', 'ONLINE_AVAILABLE',
  'AUTHORIZED', 'REVOKED', 'DA_CONG_BO',
  'route-a', 'route-b', 'cp-a1', 'qr-a1-1', 'fixture/',
  'routeId', 'checkpointId', 'qrIdentifier', 'contentVersion', 'handoffId', 'sourceRef', 'undefined', 'null', 'NaN',
];

async function expectClean(page: Page, label: string) {
  const text = await page.locator('body').innerText();
  const found = FORBIDDEN.filter((code) => new RegExp(`(^|[^\\p{L}])${code.replace(/[/]/g, '\\/')}`, 'u').test(text));
  expect(found, label).toEqual([]);
}

for (const language of ['Tiếng Việt', 'English'] as const) {
  test(`mọi màn M01 (${language}) không có mã thô`, async ({ page }) => {
    const { routes, snapshots } = publicationFixture();
    await mockPublication(page);
    await page.goto('/');
    await chooseLanguage(page, language);
    await expect(page.getByRole('listitem').first()).toBeVisible();
    await expectClean(page, 'danh mục');

    await callM01Hook(page, 'seedPackage', packageFromPublication(routes.A, snapshots.A, { versionStatus: 'OUTDATED' }));

    await page.goto('/recommend');
    await page.getByRole('radio').nth(1).check();
    await page.getByRole('radio').nth(4).check();
    await page.getByRole('radio').nth(8).check();
    await page.locator('form button[type=submit]').click();
    await expectClean(page, 'gợi ý');

    for (const routeId of ['route-a', 'route-b']) {
      await page.goto(`/routes/${routeId}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('[data-testid=gallery], [data-testid=cover-placeholder]').first()).toBeVisible();
      await expectClean(page, `chi tiết ${routeId}`);
    }

    // Dialog quyết định offline trên tuyến cần gói mà chưa có gói (xóa gói A trước)
    await page.goto('/offline');
    await expectClean(page, 'tài nguyên offline');
    await page.getByRole('button', { name: /^(Xóa|Delete)$/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^(Xóa|Delete)$/ }).click();
    // Chờ xóa xong trước khi rời trang (điều hướng có thể cắt ngang thao tác xóa)
    await expect(page.getByText(/^(Bạn chưa tải tuyến nào\.|You have not downloaded any route\.)$/)).toBeVisible();
    await page.goto('/routes/route-a');
    await page.getByRole('button', { name: /^(Bắt đầu|Start)$/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectClean(page, 'dialog quyết định offline');
  });
}
