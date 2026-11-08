// Icon cài đặt PWA và iOS (validation-report M01 DV-65): manifest khai báo icon 192/512 và maskable, mọi icon tải được
// ở URL cố định của bản build; trang có favicon và apple-touch-icon.
import { expect, test } from '@playwright/test';

type ManifestIcon = { src: string; sizes: string; type: string; purpose?: string };

test('manifest có icon 192, 512, maskable; favicon và apple-touch-icon tải được', async ({ page, request }) => {
  await page.goto('/');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();

  const manifest = (await (await request.get(new URL(manifestHref!, page.url()).href)).json()) as {
    theme_color: string;
    icons: ManifestIcon[];
  };
  expect(manifest.theme_color).toBe('#163c2d');
  expect(manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose ?? 'any'}`)).toEqual([
    '192x192 any',
    '512x512 any',
    '512x512 maskable',
  ]);

  const iconHrefs = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  expect(iconHrefs).toHaveLength(2);

  for (const url of [...manifest.icons.map((icon) => new URL(icon.src, page.url()).href), ...iconHrefs]) {
    const response = await request.get(url);
    expect(response.status(), url).toBe(200);
    expect(response.headers()['content-type'], url).toBe('image/png');
  }
});
