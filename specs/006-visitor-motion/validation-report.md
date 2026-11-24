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
| DV-01 | SC-MOT-004 "CLS = 0": nền đã 0,03–0,10; đề xuất cổng "không tăng so với nền" | Chờ chủ dự án |

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
