// Precache của Mila (specs/005 tasks T067; MAS-TC-062, 090; research R-09): service worker của `preview:e2e` có chunk
// `mascot`, và chỉ ảnh cỡ nhỏ (240, avatar 96) — cỡ lớn 480/192 nạp khi cần cho INTRO/CELEBRATE.
import { expect, test } from '@playwright/test';

test('sw.js precache: chunk mascot, đủ ảnh 240 và avatar 96, không cỡ lớn', async ({ request }) => {
  const response = await request.get('/sw.js');
  expect(response.ok()).toBe(true);
  const sw = await response.text();
  expect(sw).toMatch(/assets\/mascot-[\w-]+\.js/);
  const images = [...sw.matchAll(/assets\/(ma-[\w-]+?)-[\w-]{8}\.(?:webp|png|jpg)/g)].map((m) => m[1]).sort();
  expect(images).toEqual([
    'ma-01-wave-240',
    'ma-02-map-240',
    'ma-04-backpack-240',
    'ma-05-binoculars-240',
    'ma-07-thumbs-up-240',
    'ma-08-cheer-240',
    'ma-09-confused-240',
    'ma-10-rest-240',
    'ma-11-avatar-96',
    // Đợt 2 và ảnh mắt nhắm (2026-11-23)
    'ma-03-think-240',
    'ma-06-magnifier-240',
    'ma-13-point-240',
    'ma-20-map-blink-240',
    'ma-20-binoculars-blink-240',
    'ma-20-thumbs-up-blink-240',
    'ma-20-backpack-blink-240',
    'ma-20-rest-blink-240',
    // Đợt 4 (specs/006 T039, T045; quickstart M19)
    'ma-12-sorry-240',
    'ma-14-amazed-240',
    'ma-15-walk-240',
    'ma-16-peek-240',
    'ma-17-proud-240',
    // Khung 2 đạt kiểm (specs/006 T052): chỉ bước; vẫy, ăn mừng, chớp mắt proud chờ ảnh làm lại (DV-06)
    'ma-15-walk-f2-240',
  ].sort());
});
