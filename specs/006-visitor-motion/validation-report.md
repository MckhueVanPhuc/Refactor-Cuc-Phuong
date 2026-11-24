# Validation report — 006 Motion & micro-interactions

Nền: `main` 7c29104 + PR #79 (spec-Mascot v1.5, gói 005 Phase 19). Branch `feat/visitor-motion`.

## 1. Setup (T001–T003, 2026-11-24)

### 1.1 Số đo nền (T001)

Đo trên máy phát triển (Windows, Chromium của Playwright). Script đo tạm, không nằm trong repo.

| Chỉ số | Giá trị nền | Cách đo |
|---|---|---|
| JS gzip (tổng `dist/assets/*.js`) | 498 316 B | `npx vite build`, `zlib.gzipSync` từng tệp |
| CSS gzip (tổng `dist/assets/*.css`) | 33 707 B | như trên |
| LCP SCR-M01-001 (tải lại, ngôn ngữ đã có) | 3 040 / 1 144 / 1 080 ms (lần 1 cache trống) | `preview:e2e`, CDP: 150 ms RTT, 1,6 Mbps xuống, CPU 4× |
| CLS SCR-M01-001 | 0,0351 | `layout-shift` không do thao tác, 6 s sau khi tải |
| CLS SCR-M02-001 | 0,0327 | mở `/trip` sau khi có chuyến, 6 s |
| CLS luồng chuyến đi → kết quả (một document SPA) | 0,1017 | quét 3 điểm → Kết thúc, 6 s sau màn kết quả |
| CLS mở lại SCR-M02-003 | 0,0342 | `/trip/end` |

Nhận xét: CLS nền **không bằng 0** (bong bóng của Mila đẩy nội dung, ảnh tải muộn). SC-MOT-004 (CLS = 0) không đạt ngay cả trước gói này; cổng thực tế của gói: **không tăng CLS so với nền** trên các màn đã đo, và các phần tử do gói thêm (reveal, thanh tiến trình, trang trí) không tạo `layout-shift`. Cần chủ dự án xác nhận cách hiểu này (DV-01).

### 1.2 Spike ViewTransition (T002)

`<ViewTransition>` (react 19.3.1) bọc `<Outlet>` trong `VisitorLayout`: chạm thẻ tuyến `/` → `/routes/route-a` gọi `document.startViewTransition` một lần (bắt bằng wrapper), không lỗi console. React Router 8 đưa điều hướng vào transition nên **không cần** `startTransition` riêng (R-01). Đã hoàn nguyên; cài thật ở T035.

| # | Mục | Trạng thái |
|---|---|---|
| DV-01 | SC-MOT-004 "CLS = 0": nền đã 0,03–0,10; cổng "không tăng so với nền" | **Duyệt 2026-11-24**; spec.md SC-MOT-004 đã sửa |

## 2. Đợt 1 — US3, US1, US2, US4 (T004–T032, 2026-11-24)

### 2.1 Đã làm

| Việc | Tệp |
|---|---|
| Mức chuyển động dùng chung; `data-motion` / `data-decor` trên `<html>`; store công tắc chuyển sang `src/shared/motion` (re-export ở chỗ cũ) | `src/shared/motion/{store,level,index}.ts`, `src/shared/mascot/motion.ts`, `src/app/App.tsx` |
| Token §4.3.1 + `--duration-feedback-reduced`; về 0 dưới giảm chuyển động **và** `data-motion='reduced'` | `src/shared/ui/tokens.css`, design-system §4.3.1 |
| Công tắc "Hiệu ứng chuyển động" luôn hiện (kể cả khi tắt Mila); chuỗi VI/EN mới; rung tắt theo công tắc | `src/shared/motion/MotionSwitch.tsx`, `dialogue/vi.ts`, `en.ts`, `OfflinePage.tsx`, `MascotHost.tsx` |
| Phản hồi nhấn chỉ trên màn du khách (`[data-surface]`), thẻ tuyến nhấc khi hover | `Button.module.css`, `RouteCard.module.css`, `RecommendPage.module.css`, `TripPage.module.css`, `RouteJourneyMap.module.css` |
| `ProgressTrail` (xác định / không xác định, dấu chân) | `src/shared/ui/ProgressTrail.tsx` (+ css) |
| Thanh tiến trình hành trình + mở khóa (điểm nảy, đường mòn vẽ, thanh tăng từ k − 1); dấu mở khóa là UI state một lần | `RouteJourneyMap.tsx` (+ css), `journey/unlockSignal.ts`, `TripPage.tsx`, `ScanContent.tsx` |
| Thanh "đang tải" của gói và dấu ✓ khi vừa sẵn sàng | `offline-package/PackageProgress.tsx` (+ css), `PackagePanel.tsx`, `OfflinePage.tsx` |
| Icon `footprint.svg`, `sun-rays.svg` | `assets/icons/` |

### 2.2 Test đổi có chủ đích

| Test | Lý do |
|---|---|
| `src/shared/mascot/MascotMotionSwitch.test.tsx` → `src/shared/motion/MotionSwitch.test.tsx` | Nhãn mới; công tắc hiện khi cờ Mila tắt (trước: không render) |
| `src/shared/mascot/dialogue/catalog.test.ts` | Nhãn công tắc v1.4 |
| `src/shared/mascot/motion.test.ts` → `src/shared/motion/store.test.ts` | Đổi chỗ, không đổi nội dung |
| `e2e/m01/mascot-motion.spec.ts` | Nhãn và câu phụ mới; thuộc tính `data-motion-switch` |

Test mới: `level.test.tsx`, `architecture.test.ts` (motion), `MotionSwitch.test.tsx`, `ProgressTrail.test.tsx`, `unlockSignal.test.ts`, `RouteJourneyMap.test.tsx` (+2), `MascotHost.test.tsx` (+1); E2E `motion-level`, `motion-press`, `motion-package` (m01), `motion-journey` (m02).

### 2.3 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | lint token 758; 2477 pass, 133 skipped; build OK |
| `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` | 0 | 139 pass (lượt trước: 137 pass, 2 fail — cuộn ngang 87 px do lớp dấu chân, đã sửa; `mascot-visit` Q4/Q5 chập chờn khi tải nặng, chạy riêng 4/4 pass, DV-85 của gói 005) |
| Kích thước sau đợt 1 | — | JS gzip 500 151 B (+1 835), CSS gzip 35 117 B (+1 410); tổng +3,2 KB ≤ 15 KB |
| Chụp 390 px: panel gói lúc tải / xong; hành trình 1/3 sau mở khóa | — | Thanh không số; ✓ cạnh chip; dấu chân ở đầu phần đã đi |

### 2.4 Còn mở

| # | Mục | Trạng thái |
|---|---|---|
| DV-02 | Vitest giữ kết quả `import.meta.glob` của icon trong `node_modules/.vitest-cache` khi thêm tệp SVG mới; phải xóa cache trên máy (CI chạy sạch không gặp) | Ghi nhận |
| DV-03 | Test kiến trúc của gói 005 (`src/shared/mascot/architecture.test.ts`) không biết `src/shared/motion`; test riêng của motion đã thêm | Ghi nhận |
| — | Thử trên điện thoại thật đợt 1 (SC-MOT-011) | NOT RUN — chờ chủ dự án |

## 3. Đợt 2 — US5, US6 (T033–T045, 2026-11-24)

### 3.1 Đã làm

| Việc | Tệp |
|---|---|
| `useReveal` (một IntersectionObserver dùng chung; thẻ trong màn đầu hiện ngay; một lần mỗi lần tải trang) | `src/shared/motion/reveal.ts` |
| Thẻ tuyến hiện dần (opacity + transform, không dịch bố cục) ở danh mục và kết quả gợi ý | `RouteCard.tsx` (+ css) |
| Chuyển cảnh `ViewTransition` quanh `Outlet` (VisitorLayout) và nội dung FieldLayout; thời lượng `--duration-page`; tắt khi giảm chuyển động / công tắc tắt | `VisitorLayout.tsx`, `FieldLayout.tsx`, `src/shared/ui/global.css` |
| Skeleton: vệt sáng thay `pulse` ở thẻ giữ chỗ danh mục và ảnh đầu chi tiết đang tải | `CatalogPage.module.css`, `RouteDetailPage.module.css` |
| Ảnh đợt 4 (5 tư thế) kiểm và xuất; quy trình ở `assets/mascot/README.md` "Đợt 4" | `assets/mascot/web/ma-1{2,4,5,6,7}-*-{240,480}.webp` |
| Tư thế mới trong engine, fallback khi thiếu ảnh; AN-WALK; MAS-B-056 `walk`, MAS-B-063 `proud`; hình `peek` ở danh mục rỗng và Tài nguyên rỗng, `sorry` ở banner `CONFLICT` | `types.ts`, `assets.ts`, `rules.ts`, `Mascot.module.css`, `CatalogPage.tsx`, `OfflinePage.tsx`, `EndPage.tsx` |

### 3.2 Test đổi có chủ đích

| Test | Lý do |
|---|---|
| `src/shared/mascot/rules.test.ts` (5 ca màn kết quả) | Tư thế đứng sau chuyến hoàn tất `cheer` → `proud` (Behavior Matrix §3b) |
| `e2e/m01/mascot-precache.spec.ts` | Thêm 5 ảnh 240 đợt 4 vào danh sách precache |
| `e2e/m02/mascot-end.spec.ts` (CONFLICT) | Hình là `sorry` |
| `e2e/m01/motion-press.spec.ts` | Chờ chuyển cảnh và bong bóng MSG-MAS-010 xong; nhấn vào radio (lớp nhận con trỏ của ô chọn) |

Test mới: `reveal.test.tsx`, `assets.test.ts` (+2), `rules.test.ts` (MAS-B-056 `walk`); E2E `motion-transition` (m01).

### 3.3 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | lint token 760; 2484 pass, 133 skipped; build OK |
| `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` | 0 | 142 pass (hai lượt trước: `motion-press` ô tiêu chí hỏng do đo lúc chuyển cảnh/bong bóng đang đẩy form — đã sửa test; MAS-B-008 chập chờn khi tải nặng, DV-85 của gói 005) |
| Kích thước sau đợt 2 | — | JS gzip 500 711 B (+2 395 so với nền), CSS gzip 35 526 B (+1 819); tổng +4,1 KB ≤ 15 KB. Ảnh 240 đợt 4 thêm vào precache 70,1 KB |

### 3.4 Lệch so với spec và còn mở

| # | Mục | Trạng thái |
|---|---|---|
| DV-04 | US5 mục 2 (ảnh thẻ tuyến "biến thành" ảnh đầu màn chi tiết; Back chạy ngược): **không làm được** như mô tả. Ảnh đầu màn chi tiết chỉ có sau khi tải URL ký, tức là sau khi chuyển cảnh đã chụp màn mới, nên trình duyệt không có cặp ảnh để ghép; Back của trình duyệt (popstate) được react-router xử lý ngoài transition nên đổi tức thì. Đã cài crossfade chung cho mọi lần đổi màn bằng liên kết. Muốn có ảnh chung cần hiện sẵn một ảnh của tuyến ở màn chi tiết trước khi tải (đổi nội dung màn) | Chờ chủ dự án |
| DV-05 | Behavior Matrix §3b gán `amazed` cho MAS-B-050, nhưng phản ứng này ở chế độ AVATAR, vốn luôn vẽ ảnh đầu tròn MA-11 nên tư thế không hiện. Ảnh `amazed` đã xuất và đăng ký, chưa dùng ở đâu | Chờ chủ dự án chọn chỗ dùng |
| — | Thử trên điện thoại thật đợt 1–2 (SC-MOT-011) | NOT RUN |

## 4. Đợt 3 — US7, US8, US9 (T046–T055, 2026-11-24)

Quyết định chủ dự án trước đợt 3: **DV-04 (a)** giữ crossfade chung, không làm ảnh chung; **DV-05 (b)** dùng `amazed` khi mở khóa điểm trên màn chuyến đi.

### 4.1 Đã làm

| Việc | Tệp |
|---|---|
| DV-05: quay về sau lượt ghé mới → Mila `amazed` (không lời, 900 ms) trong lúc điểm mở khóa, rồi sải bước `walk` và nói 056; MAS-B-033 nhường lượt này | `src/shared/mascot/rules.ts` |
| `LeafConfetti` (≤ 40 hạt, mask lá, ba sắc token, không render khi không có trang trí) | `src/shared/motion/LeafConfetti.tsx` (+ css) |
| Màn kết quả: vừa kết thúc chuyến hoàn tất → huy hiệu đóng dấu, confetti lá **sau chữ**, danh sách điểm hiện lần lượt; ≤ 2,4 s; chạm → trạng thái cuối; mở lại: tĩnh. `CONFLICT` → thẻ "Hẹn gặp lại" dùng trái tim, một Mila (DV-95 của gói 005) | `EndPage.tsx` (+ css) |
| Hero danh mục: tia nắng và hai lá trôi sau dải đồi, một lần ≤ 4,98 s, chỉ khi có trang trí, tạm dừng khi lớp phủ giới thiệu mở | `CatalogPage.tsx` (+ css) |
| Khung 2: `frame2Asset`, ảnh khung 2 chồng khít, đổi bằng CSS `steps(1)` trong thời lượng animation sẵn có (bước, vẫy, ăn mừng); không khi giảm chuyển động | `assets.ts`, `Mascot.tsx`, `Mascot.module.css` |
| Ảnh khung 2: chỉ `ma-15-walk-f2` đạt kiểm và được xuất (quy trình ở `assets/mascot/README.md` "Đợt 4B") | `assets/mascot/web/ma-15-walk-f2-*.webp` |

### 4.2 Test đổi có chủ đích

| Test | Lý do |
|---|---|
| `rules.test.ts` MAS-B-056 | `amazed` trước, `walk` + 056 sau |
| `e2e/m01/mascot-layout.spec.ts` Q32 | Đếm dải đồi không tính lớp nắng/lá (`data-hero-decor`) |
| `e2e/m01/mascot-prepare.spec.ts` MAS-B-008 | Đồng hồ giả + chuyển cảnh làm `click()` chập chờn (3/6 hỏng); gửi thẳng `click` vào CTA (6/6 đạt) |
| `e2e/m01/mascot-precache.spec.ts` | Thêm `ma-15-walk-f2-240` |

Test mới: `LeafConfetti.test.tsx`, `Mascot.test.tsx` (+4 khung 2); E2E `motion-end` (m02), `motion-hero` (m01), `motion-journey` (+1: `amazed` → `walk` khung 2, một Mila).

### 4.3 Lệch và còn mở

| # | Mục | Trạng thái |
|---|---|---|
| DV-06 | Khung phụ đợt 4B: công cụ tạo ảnh vẽ lại cả hình. Sau đăng ký (tỉ lệ + độ lệch) và cân màu, chỉ `walk-f2` đạt; `wave-f2` (đầu to hơn, lệch chỗ), `cheer-f2` (thân mờ), `proud-blink` (mõm xám) không xuất. App chạy vẫy, ăn mừng với ảnh gốc, `proud` không chớp mắt. Hướng dẫn làm lại: hướng dẫn tạo ảnh §9.4 | Chờ chủ dự án làm lại 3 ảnh |
| — | T055 (E2E vẫy tay khung 2, `proud` chớp mắt) chưa có ảnh để kiểm; test component đã phủ trường hợp thiếu ảnh | Chờ DV-06 |

## 5. Đo cuối và kết luận (T056–T059)

| Chỉ số | Nền | Sau gói 006 | Ngưỡng | Kết quả |
|---|---|---|---|---|
| JS gzip | 498 316 B | 501 694 B (+3 378) | | |
| CSS gzip | 33 707 B | 36 398 B (+2 691) | tổng ≤ 15 KB | **+6,1 KB — đạt** |
| Ảnh đợt 4 trong precache (240) | — | 82,1 KB (5 tư thế + `walk-f2`) | ≤ 120 KB | **đạt** |
| LCP SCR-M01-001 (cùng điều kiện, đo lại nền trong worktree cùng lúc) | 3 936 / 3 408 / 3 420 ms | 3 916 / 2 684 / 2 460 ms | ≤ nền + 100 ms | **đạt** (lần đo nền 1,1 s ở §1 là lúc máy nhẹ tải; phần tử LCP là ảnh Mila ở hero cả hai bản) |
| CLS SCR-M01-001 | 0,0351 | 0,0351 | không tăng (DV-01) | **đạt** |
| CLS SCR-M02-001 | 0,0327 | 0,0327 | không tăng | **đạt** |
| CLS luồng chuyến đi → kết quả | 0,1017 | 0,1017 | không tăng | **đạt** |
| CLS mở lại SCR-M02-003 | 0,0342 | 0,0448 | không tăng | **lệch +0,011** (DV-07) |

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | lint token 765; 2495 pass, 133 skipped; build OK (lượt trước: `EndFlow.test.tsx` hết thời gian khi cả bộ chạy, chạy riêng 6/6 đạt — chập chờn do tải) |
| `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` | 0 | 148 pass |

| # | Mục | Trạng thái |
|---|---|---|
| DV-07 | CLS khi mở lại màn kết quả tăng 0,034 → 0,045: thẻ "Hẹn gặp lại" có Mila (phương án E, gói 005 v1.5) và hình Mila tải sau làm dịch nhẹ; không do chuyển động của gói 006 (không có hiệu ứng khi mở lại) | Ghi nhận; đề xuất giữ chỗ cố định cho Mila trong thẻ ở đợt sửa nhỏ sau |
| — | Thiết bị thật (SC-MOT-011), Lighthouse | NOT RUN — chờ chủ dự án |
