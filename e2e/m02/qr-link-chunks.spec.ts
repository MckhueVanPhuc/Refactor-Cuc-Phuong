// Trang `/q/Q1a` chỉ tải shell + chunk của nó (tasks T096; research R-17): không tải chunk `m02-scanner`, chunk màn M01
// (danh mục, gợi ý, chi tiết tuyến, gói tải trước) hay chunk M03. Chặn service worker trong ca này: precache của Workbox
// tải mọi chunk khi cài đặt, không phản ánh những gì trang cần. LCP đo thủ công bằng Lighthouse (validation-report).
//
// Ngoại lệ có chủ đích: shell (src/app/App.tsx) nạp trên MỌI trang một chunk nhỏ khôi phục thao tác gói dở của M01
// (`recoverOrphans`). Chunk đó nằm ở thư mục offline-package nên mang tên `m01-offline-package-*`, nhưng không phải
// chunk màn: nó không render gì nên không import `jsx-runtime`. Màn hình nào cũng import `jsx-runtime`.
import { expect, test, type Response } from '@playwright/test';
import { mockLookup, mockStorage } from './network';

test.use({ serviceWorkers: 'block' });

const SCREEN_OR_SCANNER_CHUNK = /\/assets\/(m02-scanner|m01-(catalog|recommendation|route-detail|offline-package|start)|m03-)[^/]*\.js$/;
const SHARED_STARTUP_CANDIDATE = /\/assets\/m01-offline-package-[^/]*\.js$/;

test('/q/Q1a không tải chunk scanner, chunk màn M01 hay M03', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'language', { get: () => 'vi-VN' }));
  await mockLookup(page);
  await mockStorage(page);
  const scripts: Response[] = [];
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/assets/') && url.pathname.endsWith('.js')) scripts.push(response);
  });

  await page.goto('/q/Q1a');
  await expect(page.getByRole('heading', { level: 1, name: 'Đối tượng Q1a' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const paths = scripts.map((response) => new URL(response.url()).pathname);
  expect(paths.some((path) => path.startsWith('/assets/m02-qr-link'))).toBe(true);

  const offenders: string[] = [];
  for (const response of scripts) {
    const path = new URL(response.url()).pathname;
    if (!SCREEN_OR_SCANNER_CHUNK.test(path)) continue;
    // Chunk khởi động của shell: không render gì
    if (SHARED_STARTUP_CANDIDATE.test(path) && !(await response.text()).includes('jsx-runtime')) continue;
    offenders.push(path);
  }
  expect(offenders).toEqual([]);
});
