# Research — 006 Motion & micro-interactions

Ngày: 2026-11-24. Nền: `main` 7c29104 + PR #79 (spec-Mascot v1.5, Phase 19 của gói 005). Mỗi mục: **Decision / Rationale / Alternatives**. Không có `NEEDS CLARIFICATION` còn mở.

## R-01 Không thêm thư viện; chuyển cảnh bằng `<ViewTransition>` của React 19.3

- **Decision**: CSS animation/transition cho T1–T3, Web Animations API chỉ khi cần đọc `getAnimations()` trong test. Chuyển cảnh giữa màn dùng `ViewTransition` (export ổn định của `react` 19.3.1), không dùng prop `viewTransition` của react-router 8 (đã deprecated, typings `lib/dom/lib.d.ts` khuyên dùng `<ViewTransition>` của React).
- **Rationale**: change brief Q1, design-system §4.3.2 (≤ 15 KB, không thư viện). React chỉ kích hoạt view transition khi cập nhật nằm trong `startTransition`; react-router 8 (data router) đưa điều hướng vào transition. Nếu kiểm thử thấy không kích hoạt, gói điều hướng của `Link` du khách vào `startTransition` ở một chỗ (VisitorLayout/FieldLayout), không đổi route. Trình duyệt không có `document.startViewTransition` → React đổi màn tức thì (FR-MOT-006).
- **Alternatives**: thư viện `motion` (15–35 KB, brief loại); `document.startViewTransition` tự viết quanh `navigate` (trùng việc React đã làm, khó phối hợp với Suspense lazy route).
- **Kiểm chứng đầu tiên** (task spike): Chrome 129+ có `::view-transition-*` khi đổi `/` → `/routes/:id`; Firefox/Safari cũ đổi tức thì; không lỗi console.

## R-02 Một nguồn "mức chuyển động" trong `src/shared/motion/`

- **Decision**: chuyển `src/shared/mascot/motion.ts` sang `src/shared/motion/store.ts` (công tắc, khởi đầu theo `prefers-reduced-motion`, không lưu — BR-MAS-18). Thêm `level.ts` suy ra **mức hiệu lực**: `full` hoặc `reduced` (công tắc tắt hoặc giảm chuyển động) và `decor: on|off` (`off` khi `reduced`, `navigator.connection.saveData`, `navigator.deviceMemory ≤ 2`). Một effect ở `App.tsx` ghi `data-motion="full|reduced"` và `data-decor="on|off"` lên `<html>`; CSS mọi nơi gate bằng thuộc tính này. `src/shared/mascot/motion.ts` thành re-export để không đổi import của engine/host.
- **Rationale**: FR-MOT-013–015; một cờ CSS ở gốc thay cho truyền prop qua từng component (minimal diff). Công tắc phải hiện cả khi Mila tắt (OD-MOT-02) nên không thể nằm sau `isMascotEnabled()`.
- **Alternatives**: context React (phải bọc cây, component CSS-only không cần); chỉ `@media (prefers-reduced-motion)` (không phủ công tắc, saveData, máy yếu).

## R-03 Token

- **Decision**: thêm vào `src/shared/ui/tokens.css` đúng bảng design-system §4.3.1 (`--duration-press`, `-feedback`, `-trail-draw`, `-reveal`, `-shimmer`, `-confetti`, `-count-up`, `-ambient-drift`, `--ease-spring`, `--ease-standard`, `--press-scale`). Đặt về `0ms` / `1` dưới `@media (prefers-reduced-motion: reduce)` **và** `:root[data-motion='reduced']`. T1 khi giảm chuyển động dùng nhánh CSS riêng: chỉ đổi màu hoặc `opacity`, thời lượng token mới `--duration-feedback-reduced: 150ms` (không về 0, design-system §4.3.1 cột T1); thêm token này vào design-system khi cài.
- **Rationale**: lint token cấm literal ngoài `tokens.css`; cách đặt về 0 của §4.3 đã có, chỉ thêm selector thuộc tính.
- **Alternatives**: hằng số trong CSS Module (lint chặn).

## R-04 Phản hồi nhấn và hover (US1)

- **Decision**: trong `Button.module.css`, `RouteCard.module.css`, ô chọn của `RecommendPage.module.css`, nút Quét QR của `TripPage`, thẻ điểm hành trình: `:root[data-motion='full'] … :active { transform: scale(var(--press-scale)) }` với `transition: transform var(--duration-press) var(--ease-standard)`; thẻ tuyến `@media (hover: hover)` nhấc `translateY` bằng `calc(var(--space-1) * -0.5)`. Không đổi kích thước hộp (transform không ảnh hưởng bố cục). M03 không có selector này.
- **Rationale**: design-system §5.4 v1.4; CSS thuần, không JS.
- **Alternatives**: component bọc `<Pressable>` (đổi markup nhiều chỗ).

## R-05 Thanh tiến trình hành trình và "mở khóa" (US2)

- **Decision**: component `ProgressTrail` ở `src/shared/ui/` (prop `value`, `max`, `label` hoặc `indeterminate`), vẽ bằng `transform: scaleX` của phần đã đi và icon `footprint.svg` mask ở đầu; `role="progressbar"`. `RouteJourneyMap` đặt nó dưới câu tiến độ (giữ nguyên câu). Tín hiệu "vừa có lượt ghé mới": module UI-state trong M02 `src/modules/m02/journey/unlockSignal.ts` (`markUnlock(checkpointId, fromK)`, `takeUnlock()` — một lần, chỉ bộ nhớ). `ScanContent` gọi `markUnlock` đúng chỗ đang phát `m02.content.backPressed` với `afterNewVisit` (cùng điều kiện `visitCreated && !finalPromptNeeded`). `TripPage` gọi `takeUnlock()` khi mount; có thì truyền `unlock` cho `RouteJourneyMap`: điểm nảy (`--duration-feedback`, `--ease-spring`), đoạn nối tới điểm kế (SVG `stroke-dashoffset`, `--duration-trail-draw`), thanh tăng từ `fromK` lên `k`.
- **Rationale**: FR-MOT-003, 004; không đổi `processScan`, dữ liệu hay thứ tự ghi; tải lại trang mất dấu (Key Entities "Dấu vừa có lượt ghé mới").
- **Alternatives**: router state trên link "Quay lại" (đổi contract điều hướng nội bộ, sống qua reload của history — DV-25 của gói 005 đã gặp); so sánh số lượt ghé với lần render trước (sai khi tải lại giữa chừng).

## R-06 Thanh "đang tải" của gói (US4)

- **Decision**: `ProgressTrail indeterminate` cạnh chip "Đang tải…" ở `PackagePanel` và `OfflinePage` khi `candidate === 'downloading'`; khi trạng thái đổi từ `downloading` sang sẵn sàng trong lần render này (so với giá trị trước bằng `useRef`) hiện `check.svg` một lần (T1). Lỗi: thanh biến mất, câu lỗi như cũ.
- **Rationale**: M01 không báo phần trăm (change brief §10.1); không đổi logic tải.
- **Alternatives**: ước lượng tiến độ (giả số, bị loại).

## R-07 Chuyển cảnh và phần tử chung (US5)

- **Decision**: `<ViewTransition>` bọc `<Outlet>` trong `VisitorLayout` và `FieldLayout` (crossfade + trượt nhẹ bằng CSS `::view-transition-old/new`, `--duration-page`); ảnh thẻ tuyến và ảnh đầu màn chi tiết bọc `<ViewTransition name={'route-cover-' + routeId}>` (tên duy nhất trên mỗi màn). `data-motion='reduced'` → `::view-transition-*` `animation: none`.
- **Rationale**: FR-MOT-006; không đổi route hay guard.
- **Alternatives**: CSS animation khi mount trang (không có phần tử chung).

## R-08 Thẻ hiện dần khi cuộn (US5)

- **Decision**: hook `useReveal()` ở `src/shared/motion/` dùng một `IntersectionObserver` dùng chung; phần tử đã ở trong viewport khi mount → hiện ngay (không ẩn, không làm chậm LCP); phần tử dưới màn đầu bắt đầu `opacity: 0; transform: translateY(var(--space-3))` rồi về 0 khi vào viewport, một lần (Set id trong bộ nhớ của lần tải trang). Chỗ của thẻ giữ nguyên (CLS 0). Áp cho thẻ danh mục và kết quả gợi ý.
- **Rationale**: FR-MOT-007, design-system §4.3.2.
- **Alternatives**: `animation-timeline: view()` (chưa có trên Safari/Firefox ổn định; khó "một lần").

## R-09 Skeleton

- **Decision**: thay `pulse` của `.placeholderCard` và `.coverPlaceholder` bằng vệt sáng `::after` (`linear-gradient` trắng 40% qua `color-mix`, `translateX` lặp `--duration-shimmer`); `data-motion='reduced'` → không `::after` animation. Kích thước khối giữ nguyên.
- **Rationale**: FR-MOT-008; khối giữ chỗ đã có.

## R-10 Ảnh đợt 4: kiểm, ghép, xuất

- **Decision**: quy trình như đợt 1–3 (assets/mascot/README.md), chạy trong Chromium của Playwright, script tạm ngoài repo:
  1. Kiểm kênh alpha, viền màu lạ, mảng rời; căn toàn thân cùng đường chân (y = 1225/1254), nửa thân mép cắt đáy.
  2. **Khung phụ** (`ma-15-walk-f2`, `ma-21-wave-f2`, `ma-22-cheer-f2`, `ma-20-proud-blink`): ảnh nguồn có kích thước khác ảnh gốc (1228–1254 × 1254–1281) → đổi cỡ và dò dịch chuyển tốt nhất với ảnh gốc, tìm vùng khác biệt mạnh, nở 10 px, mép mờ 6 px, ghép **chỉ vùng đó** lên ảnh gốc (như MA-20). Báo % diện tích; vùng ngoài cử động phải trùng từng điểm ảnh (US9 mục 5).
  3. WebP 0,82 cỡ 240 và 480 vào `assets/mascot/web/`; ghi số đo; precache tự nhận `ma-*-240-*.webp`.
- **Rationale**: AGENTS §4 (chỉ cắt, đổi cỡ, nén, ghép vùng khác biệt); ngân sách ≤ 120 KB (SC-MOT-006).
- **Alternatives**: thêm dependency `sharp` (cần duyệt, không cần).

## R-11 Tư thế mới và khung phụ trong engine

- **Decision**: `PoseId` thêm `sorry`, `amazed`, `walk`, `peek`, `proud`; registry `assets.ts` thêm tệp và `frame2Asset(pose)` cho `wave`, `cheer`, `walk`; `blinkAsset('proud')`. Luật theo Behavior Matrix §3b: MAS-B-006/023 `peek` (màn tự đặt `MascotFigure`), MAS-B-050 `amazed`, MAS-B-056 `walk` + animation `walk`, MAS-B-063 `proud`, MAS-B-072 `sorry` (`MascotFigure` của banner), MAS-B-001 vẫn `wave` nhưng có khung 2. Thiếu ảnh → `poseAsset` trả `null` → lùi về tư thế cũ (bảng fallback trong registry).
- **Khung phụ không dùng timer JS**: `Pose` vẽ thêm một `<img>` khung 2 chồng khít, CSS `animation: mascot-frame var(--duration-…) steps(1) N` đổi `opacity` 0/1 trong thời lượng animation sẵn có (AN-GREET, AN-MILESTONE/CELEBRATE, AN-WALK). Giảm chuyển động: không vẽ khung 2.
- **Rationale**: FR-MOT-009; không thêm vòng lặp JS.

## R-12 Màn kết quả (US7)

- **Decision**: chỉ khi `takeEndedHere()` đúng và phiên `HOAN_TAT` (cùng điều kiện cấp 3): huy hiệu dùng keyframes "đóng dấu" (`scale` 1.3 → 0.95 → 1, `--duration-feedback`, `--ease-spring`) thay `badge-in`; `LeafConfetti` (`src/shared/motion/`, DOM span + mask `leaf.svg`, ≤ 40 hạt, `--duration-confetti`, `pointer-events: none`, `aria-hidden`) phủ khu đầu màn; danh sách điểm `animation-delay: calc(var(--i) * var(--duration-press))`. Chạm bất kỳ → bỏ class chạy (trạng thái cuối). Không thêm chữ/số (FR-MOT-016; spec "Ghi chú dẫn xuất").
- **DV-95** (hai Mila khi `CONFLICT`): khi `sync === 'CONFLICT'` thẻ "Hẹn gặp lại" dùng trái tim, không slot (FR-MOT-017).
- **Rationale**: FR-MOT-011, 017; tổng T3 cùng lúc: confetti + lá của Mila + (không có hero) ≤ 3.

## R-13 Hero danh mục (US8)

- **Decision**: lớp trang trí trong hero `CatalogPage` (sau dải đồi): `sun-rays.svg` mask xoay/nhấp nháy rất nhẹ (`opacity`), 2 lá `leaf.svg` trôi chéo. Keyframes chuyển động trong 0–80% của `--duration-ambient-drift` (6000ms → dừng ở 4,8 s), một lần mỗi lần hiển thị (FR-MOT-012). Gate `:root[data-decor='on']`; tạm dừng khi có lớp phủ INTRO (`:root:has([data-mascot-mode='INTRO'])` → `animation-play-state: paused`). `aria-hidden`.
- **Rationale**: SC-MOT-003, 009.

## R-14 Rung theo công tắc (BR-MAS-19 v1.4)

- **Decision**: `MascotHost` dựng `StepContext.reducedMotion` từ `still` (giảm chuyển động **hoặc** công tắc tắt) thay vì chỉ `reducedMotion`; trước khi gọi `navigator.vibrate` kiểm lại `getMotion()`. Luật MAS-B-05x điểm cuối (`effects: vibrate` trong rules.ts) cũng qua cùng kiểm tra ở host.
- **Rationale**: spec-Mascot v1.4 BR-MAS-19; SC-MOT-002.

## R-15 Công tắc "Hiệu ứng chuyển động"

- **Decision**: `MotionSwitch` ở `src/shared/motion/` (thay `MascotMotionSwitch`), nhãn từ catalog `mascot.motion` / `mascot.motionHint` (chuỗi tĩnh, import được khi cờ Mila tắt); `OfflinePage` render nó không điều kiện. Catalog đổi chuỗi theo spec-Mascot v1.4.
- **Rationale**: OD-MOT-02, OD-MAS-21; DV-93.

## R-16 Đo hiệu năng và kiểm chứng

- **Decision**: (1) kích thước: so `dist/assets/*.js|css` gzip trước/sau (script tạm, ghi validation report); (2) CLS: Playwright đọc `PerformanceObserver('layout-shift')` (bỏ entry `hadRecentInput`) trên `preview:e2e` ở SCR-M01-001, SCR-M02-001, SCR-M02-003; (3) LCP: `largest-contentful-paint` trên SCR-M01-001 với throttling CDP (Slow 4G, CPU 4×), so với nền `main` trước gói 006 (đo trước khi code, task đầu); (4) `saveData`/`deviceMemory`: `addInitScript` ghi đè `navigator.connection`/`deviceMemory`; (5) giảm chuyển động: `page.emulateMedia({ reducedMotion: 'reduce' })`. Thiết bị thật: `NOT RUN` nếu chủ dự án chưa thử (SC-MOT-011).
- **Alternatives**: Lighthouse CI (thêm dependency; giữ `NOT RUN` như DV-89).

## Upstream có nguy cơ stale

- `docs/mascot/MASCOT_TECHNICAL_SPECIFICATION.md` (cây thư mục: `motion.ts` chuyển sang `src/shared/motion/`) — cập nhật trong task tài liệu cuối gói.
- `specs/005-visitor-mascot/contracts/mascot-ui-contract.md` (`MascotMotionSwitch`) — ghi chú chuyển sang gói 006.
