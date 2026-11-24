# Tasks: Motion & micro-interactions trên màn du khách M01/M02

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/motion-ui-contract.md](contracts/motion-ui-contract.md), [quickstart.md](quickstart.md); Change Brief [CHG-MOTION-2026-11-24-01](change-brief-CHG-MOTION-2026-11-24-01.md).

**Tests**: Có — theo thông lệ của repo (gói 005) và SC-MOT-001…011; test viết trước phần cài trong mỗi story.

**Quy ước**: `[P]` = làm song song được (tệp khác, không phụ thuộc task chưa xong). `[USn]` = user story trong spec.md. Mọi CSS chỉ dùng token (`npm run lint`). Không đổi logic, dữ liệu hay câu cố định của M01/M02.

## Phase 1: Setup

- [X] T001 Đo nền trước khi code (R-16): build bản hiện tại (`npx vite build`), ghi gzip từng tệp `dist/assets/*.js|css`; đo LCP SCR-M01-001 (Playwright + CDP Slow 4G, CPU 4×) và CLS SCR-M01-001, SCR-M02-001, SCR-M02-003 trên `preview:e2e` bằng script tạm ngoài repo; ghi số vào `specs/006-visitor-motion/validation-report.md` §1 (tạo tệp)
- [X] T002 Spike R-01: bọc `<Outlet>` của `src/modules/m01/layout/VisitorLayout.tsx` bằng `ViewTransition` của `react`, kiểm trên Chromium (Playwright) rằng đổi `/` → `/routes/route-a` tạo `::view-transition-old/new` (`document.getAnimations()` có pseudo-element), không lỗi console; nếu không kích hoạt thì gói điều hướng trong `startTransition`; ghi kết luận vào validation report §1 rồi hoàn nguyên spike
- [X] T003 [P] Vẽ `assets/icons/footprint.svg` và `assets/icons/sun-rays.svg` (lưới 24×24, nét đơn sắc, dùng làm mask; design-system §7)

## Phase 2: Foundational (chặn mọi story)

- [X] T004 [P] Test `src/shared/motion/level.test.ts`: `useMotionLevel` → `full`/`reduced` theo công tắc và `prefers-reduced-motion`; `decor` off khi `reduced`, `saveData`, `deviceMemory ≤ 2`; không báo → on; `useMotionAttributes` ghi `data-motion`/`data-decor` trên `<html>` và cập nhật khi công tắc đổi
- [X] T005 Chuyển `src/shared/mascot/motion.ts` sang `src/shared/motion/store.ts` (giữ nguyên hành vi, vẫn phát `mascot.motion.changed`); `src/shared/mascot/motion.ts` chỉ re-export; cập nhật import test hiện có nếu cần
- [X] T006 Cài `src/shared/motion/level.ts` (`useMotionLevel`, `useMotionAttributes`) và `src/shared/motion/index.ts` theo contracts §2
- [X] T007 Gọi `useMotionAttributes()` một lần trong `src/app/App.tsx`
- [X] T008 Thêm token design-system §4.3.1 và `--duration-feedback-reduced: 150ms` vào `src/shared/ui/tokens.css`; đặt về `0ms`/`1` dưới `@media (prefers-reduced-motion: reduce)` và `:root[data-motion='reduced']` (trừ `--duration-feedback-reduced`); thêm dòng `--duration-feedback-reduced` vào `docs/design/design-system.md` §4.3.1
- [X] T009 Test kiến trúc: thêm `src/shared/motion` vào kiểm tra "shared không import module" trong `src/modules/m01/architecture.test.ts` (hoặc test kiến trúc dùng chung hiện có)

**Checkpoint**: `npm run ci` PASS; `<html>` có `data-motion`, `data-decor`.

## Phase 3: User Story 3 — Một công tắc cho mọi hiệu ứng (Priority: P1) 🎯 nền đợt 1

**Goal**: công tắc "Hiệu ứng chuyển động" luôn ở SCR-M01-004, dừng Mila + T3 + rung (BR-MAS-17, 19, 21 v1.4).

**Independent Test**: quickstart M7, M8, M9.

- [X] T010 [P] [US3] Test `src/shared/motion/MotionSwitch.test.tsx`: `role="switch"`, nhãn "Hiệu ứng chuyển động", câu phụ "Tắt để Mila và hiệu ứng trang trí đứng yên."; render khi `VITE_FEATURE_MASCOT=off`; bấm đổi `aria-checked` và store
- [X] T011 [P] [US3] Test `src/app/mascot/MascotHost.test.tsx`: công tắc tắt → lượt ghé mới không gọi `navigator.vibrate`; bật → gọi một lần 30 ms
- [X] T012 [US3] Đổi chuỗi `mascot.motion` / `mascot.motionHint` (VI/EN) trong `src/shared/mascot/dialogue/vi.ts`, `en.ts` theo spec-Mascot v1.4; cập nhật `src/shared/mascot/dialogue/catalog.test.ts`
- [X] T013 [US3] Cài `src/shared/motion/MotionSwitch.tsx` (+ `.module.css`, chuyển style từ `MascotMotionSwitch`); xóa `src/shared/mascot/MascotMotionSwitch.tsx` (+ test, css) và export trong `src/shared/mascot/index.ts`
- [X] T014 [US3] `src/modules/m01/offline-package/OfflinePage.tsx`: render `MotionSwitch` không điều kiện (thay `MascotMotionSwitch`)
- [X] T015 [US3] `src/app/mascot/MascotHost.tsx`: `StepContext.reducedMotion` = `still` (giảm chuyển động hoặc công tắc tắt); kiểm `getMotion()` trước `navigator.vibrate` (R-14)
- [X] T016 [US3] E2E `e2e/m01/mascot-motion.spec.ts`: đổi nhãn công tắc; thêm ca cờ Mila tắt vẫn có công tắc (M7); thêm ca `saveData`/`deviceMemory` qua `addInitScript` → `data-decor="off"` (M9)

**Checkpoint**: M7–M9 PASS.

## Phase 4: User Story 1 — Mọi cú chạm đều có phản hồi (Priority: P1)

**Goal**: nhấn co về `--press-scale`, thẻ tuyến nhấc khi hover (design-system §5.4 v1.4).

**Independent Test**: quickstart M1, M2.

- [X] T017 [P] [US1] E2E `e2e/m01/motion-press.spec.ts`: nhấn giữ nút chính SCR-M01-003 và thẻ tuyến → `getComputedStyle(…).transform` là scale < 1 trong lúc giữ, `boundingBox` phần tử kề không đổi; `reducedMotion: 'reduce'` → `transform: none`
- [X] T018 [P] [US1] `src/shared/ui/Button.module.css`: `:root[data-motion='full'] .button:active:not(:disabled)` scale + transition token
- [X] T019 [P] [US1] `src/modules/m01/catalog/RouteCard.module.css`: nhấn scale; `@media (hover: hover)` nhấc `translateY` khi `data-motion='full'`
- [X] T020 [P] [US1] `src/modules/m01/recommendation/RecommendPage.module.css` (`.optionText`, `.submit`), `src/modules/m02/session/TripPage.module.css` (nút Quét QR), `src/modules/m02/journey/RouteJourneyMap.module.css` (`.open`): nhấn scale theo cùng quy tắc

**Checkpoint**: M1–M2 PASS; M03 không đổi.

## Phase 5: User Story 2 — Hành trình tiến lên sau mỗi lần quét (Priority: P1)

**Goal**: thanh tiến trình xác định trên SCR-M02-001 và hiệu ứng mở khóa một lần (FR-MOT-003, 004).

**Independent Test**: quickstart M3–M6.

- [X] T021 [P] [US2] Test `src/shared/ui/ProgressTrail.test.tsx`: xác định → `role="progressbar"`, `aria-valuenow/max`, nhãn; không xác định → không `aria-valuenow`
- [X] T022 [P] [US2] Test `src/modules/m02/journey/unlockSignal.test.ts`: `takeUnlock` trả một lần rồi `null`
- [X] T023 [P] [US2] Test `src/modules/m02/journey/RouteJourneyMap.test.tsx`: có thanh dưới câu tiến độ (câu nguyên văn); `unlock` → điểm có `data-unlock`; không `unlock` → không
- [X] T024 [US2] Cài `src/shared/ui/ProgressTrail.tsx` (+ `.module.css`): `scaleX`, `footprint.svg` mask ở đầu, vệt không xác định (dùng ở US4); T1/T2 gate theo `data-motion`
- [X] T025 [US2] Cài `src/modules/m02/journey/unlockSignal.ts` (`markUnlock`, `takeUnlock`) theo data-model §3
- [X] T026 [US2] `src/modules/m02/content/ScanContent.tsx`: gọi `markUnlock(checkpointId, k - 1)` tại onClick "Quay lại" đang phát `m02.content.backPressed` khi `afterNewVisit` (không đổi điều kiện hay điều hướng)
- [X] T027 [US2] `src/modules/m02/journey/RouteJourneyMap.tsx` (+ `.module.css`): `ProgressTrail` dưới câu tiến độ; prop `unlock?: { checkpointId; fromK }`: điểm nảy (`--duration-feedback`, `--ease-spring`), đoạn SVG tới điểm kế `stroke-dashoffset` (`--duration-trail-draw`), thanh tăng từ `fromK`; nhánh giảm chuyển động chỉ đổi màu/opacity ≤ 150 ms
- [X] T028 [US2] `src/modules/m02/session/TripPage.tsx`: `takeUnlock()` khi mount (chỉ khi có phiên), truyền cho `RouteJourneyMap`
- [X] T029 [US2] E2E `e2e/m02/motion-journey.spec.ts`: M3 (quét điểm 2 → quay lại → `data-unlock`, thanh 2/4), M4 (tải lại, quét lại → không), M5 (khách tự do không thanh), M6 (điểm cuối: dialog không trễ so với nền)

**Checkpoint**: M3–M6 PASS.

## Phase 6: User Story 4 — Biết gói đang tải và khi nào xong (Priority: P1)

**Goal**: thanh "đang tải" không xác định và ✓ một lần (FR-MOT-005).

**Independent Test**: quickstart M10.

- [X] T030 [P] [US4] E2E `e2e/m01/motion-package.spec.ts`: ảnh trễ 800 ms → có `role="progressbar"` không `aria-valuenow`, không chữ `%`; xong → dấu ✓ (`data-package-ready`), thanh mất; lỗi lưu (`failNextActivation`) → không thanh, câu lỗi như cũ
- [X] T031 [US4] `src/modules/m01/route-detail/PackagePanel.tsx` (+ `.module.css`): `ProgressTrail indeterminate` cạnh chip khi `busy`; `useRef` trạng thái trước → `downloading` sang sẵn sàng thì hiện `check.svg` một lần
- [X] T032 [US4] `src/modules/m01/offline-package/OfflinePage.tsx` (+ `.module.css`): như T031 cho dòng gói đang tải

**Checkpoint đợt 1**: `npm run ci`, E2E m01/m02 PASS; M1–M10; ghi validation report §2.

## Phase 7: User Story 5 — Chuyển màn mượt, nội dung hiện tự nhiên (Priority: P2)

**Goal**: View Transitions và thẻ hiện dần (FR-MOT-006, 007).

**Independent Test**: quickstart M11, M12.

- [X] T033 [P] [US5] Test `src/shared/motion/reveal.test.ts`: phần tử trong viewport lúc mount không có class ẩn; ngoài viewport → ẩn rồi hiện khi giao; id đã hiện không chạy lại
- [X] T034 [US5] Cài `src/shared/motion/reveal.ts` (`useReveal`, một `IntersectionObserver` dùng chung) và CSS reveal trong `src/shared/motion/reveal.module.css` gate `data-motion='full'`
- [X] T035 [US5] `src/modules/m01/layout/VisitorLayout.tsx` (+ `.module.css`), `src/modules/m02/layout/FieldLayout.tsx` (+ `.module.css`): `ViewTransition` quanh `Outlet` theo kết luận T002; CSS `::view-transition-old/new` dùng `--duration-page`; `data-motion='reduced'` → `animation: none`
- [X] T036 [US5] `src/modules/m01/catalog/RouteCard.tsx`, `src/modules/m01/route-detail/RouteDetailPage.tsx`: `ViewTransition name={'route-cover-' + routeId}` cho ảnh thẻ và ảnh đầu đầu tiên
- [X] T037 [US5] `src/modules/m01/catalog/CatalogPage.tsx`, `src/modules/m01/recommendation/RecommendResultsPage.tsx`: `useReveal` cho thẻ trong danh sách
- [X] T038 [US5] E2E `e2e/m01/motion-transition.spec.ts`: M11 (có animation pseudo-element khi chạm thẻ; Back ngược), M12 (cuộn: thẻ dưới màn đầu hiện dần, CLS = 0 bằng `PerformanceObserver('layout-shift')`)

## Phase 8: User Story 6 — Chờ và trống có hồn (Priority: P2)

**Goal**: skeleton có vệt sáng; Mila dùng tư thế đợt 4 (FR-MOT-008–010).

**Independent Test**: quickstart M13, M14, M19.

- [X] T039 [US6] Kiểm và xuất ảnh đợt 4 theo research R-10 (script tạm ngoài repo, Chromium của Playwright): 5 tư thế → `assets/mascot/web/ma-12-sorry`, `ma-14-amazed`, `ma-15-walk`, `ma-16-peek`, `ma-17-proud` `-240.webp`/`-480.webp`; ghi quy trình và số đo vào `assets/mascot/README.md` (mục "Đợt 4") và validation report; ảnh nào không đạt → báo chủ dự án, không xuất
- [X] T040 [P] [US6] Test `src/shared/mascot/assets.test.ts`: tư thế mới có ảnh; fallback `sorry→confused`, `amazed→thumbsUp`, `walk→map`, `peek→rest`, `proud→cheer` khi thiếu ảnh
- [X] T041 [P] [US6] Test `src/shared/mascot/rules.test.ts`: MAS-B-050 `amazed`, MAS-B-056 `walk` + animation `walk`, MAS-B-063 `proud` (Behavior Matrix §3b)
- [X] T042 [US6] `src/shared/mascot/types.ts` (`PoseId` + 5 tư thế, `AnimationId` + `walk`), `src/shared/mascot/assets.ts` (tệp, fallback), `src/shared/mascot/rules.ts` (MAS-B-050, 056, 063); `src/app/mascot/Mascot.module.css` keyframes AN-WALK (≤ 1200ms)
- [X] T043 [US6] Màn đặt `MascotFigure`: `src/modules/m01/catalog/CatalogPage.tsx` và `src/modules/m01/offline-package/OfflinePage.tsx` rỗng → `peek`; `src/modules/m02/end/EndPage.tsx` banner `CONFLICT` → `sorry`
- [X] T044 [US6] Skeleton: `src/modules/m01/catalog/CatalogPage.module.css` (`.placeholderCard`), `src/modules/m01/route-detail/RouteDetailPage.module.css` (`.coverPlaceholder`): thay `pulse` bằng vệt sáng `::after` `--duration-shimmer`, gate `data-motion='full'`
- [X] T045 [US6] E2E: `e2e/m01/mascot-precache.spec.ts` thêm tư thế đợt 4 cỡ 240 (M19); kiểm tư thế ở `e2e/m01/mascot-prepare.spec.ts` (rỗng `peek`) và `e2e/m02/mascot-end.spec.ts` (`CONFLICT` `sorry`); M13 skeleton đứng yên khi giảm chuyển động

**Checkpoint đợt 2**: `npm run ci`, E2E PASS; M11–M14, M19; ghi validation report §3.

## Phase 9: User Story 7 — Kết thúc chuyến đáng nhớ (Priority: P3)

**Goal**: đóng dấu huy hiệu, confetti lá, danh sách lần lượt; một Mila khi `CONFLICT` (FR-MOT-011, 017).

**Independent Test**: quickstart M15, M16.

- [ ] T046 [P] [US7] Test `src/shared/motion/LeafConfetti.test.tsx`: `count` bị chặn ở 40; `aria-hidden`; không render khi `decor` off; `onDone` sau `--duration-confetti`
- [ ] T047 [US7] Cài `src/shared/motion/LeafConfetti.tsx` (+ `.module.css`, mask `leaf.svg`, `pointer-events: none`)
- [ ] T048 [US7] `src/modules/m02/end/EndPage.tsx` (+ `.module.css`): chỉ khi `takeEndedHere()` và `HOAN_TAT`: huy hiệu keyframes đóng dấu, `LeafConfetti` ở đầu màn, danh sách `animation-delay` theo `--i`; chạm → trạng thái cuối; `sync === 'CONFLICT'` → thẻ "Hẹn gặp lại" dùng trái tim, không slot (DV-95)
- [ ] T049 [US7] E2E `e2e/m02/motion-end.spec.ts`: M15 (có hạt ≤ 40, hết sau 2,4 s, mở lại tĩnh, không chữ/số mới), M16 (`CONFLICT`: đúng một `[data-mascot-figure], [data-mascot-mode]`)

## Phase 10: User Story 8 — Cảm giác rừng ở màn đầu (Priority: P3)

**Goal**: nắng và lá ở hero danh mục, tự dừng ≤ 5 s (FR-MOT-012).

**Independent Test**: quickstart M17.

- [ ] T050 [US8] `src/modules/m01/catalog/CatalogPage.tsx` (+ `.module.css`): lớp trang trí `sun-rays.svg` + 2 lá `leaf.svg` sau dải đồi, `aria-hidden`; keyframes chuyển động trong 0–80% của `--duration-ambient-drift`; gate `:root[data-decor='on']`; `:root:has([data-mascot-mode='INTRO'])` → `animation-play-state: paused`
- [ ] T051 [US8] E2E `e2e/m01/motion-hero.spec.ts`: animation của lớp trang trí có `endTime ≤ 5000`; `data-decor='off'` → không animation; không giao tiêu đề, nút, Mila (`boundingBox`)

## Phase 11: User Story 9 — Mila cử động thật (Priority: P3)

**Goal**: khung phụ vẫy, ăn mừng, bước; `proud` chớp mắt (FR-MOT-009).

**Independent Test**: quickstart M18.

- [ ] T052 [US9] Ghép và xuất khung phụ theo research R-10 bước 2: `ma-15-walk-f2`, `ma-21-wave-f2`, `ma-22-cheer-f2`, `ma-20-proud-blink` vào `assets/mascot/web/`; báo % diện tích vùng ghép, ảnh so sánh; ghi `assets/mascot/README.md`
- [ ] T053 [P] [US9] Test `src/app/mascot/Mascot.test.tsx`: animation `intro`/`milestone`/`celebrate`/`walk` có ảnh khung 2 (`data-mascot-frame2`); giảm chuyển động → không; thiếu ảnh khung 2 → không
- [ ] T054 [US9] `src/shared/mascot/assets.ts` (`frame2Asset`, `blinkAsset('proud')`), `src/app/mascot/Mascot.tsx` (`<img>` khung 2 chồng khít), `src/app/mascot/Mascot.module.css` (`mascot-frame` `steps(1)` trong thời lượng animation sẵn có)
- [ ] T055 [US9] E2E `e2e/m01/mascot-intro.spec.ts` (khung 2 khi vẫy) và `e2e/m02/mascot-end.spec.ts` (`proud` + chớp mắt khi có ảnh)

**Checkpoint đợt 3**: `npm run ci`, E2E PASS; M15–M18, M20; ghi validation report §4.

## Phase 12: Polish & Cross-Cutting

- [ ] T056 Đo cuối theo quickstart §4 (kích thước JS/CSS, ảnh precache, LCP, CLS) so với T001; ghi validation report §5; vượt ngưỡng → báo chủ dự án
- [ ] T057 [P] E2E `e2e/m01/motion-layout.spec.ts` + `e2e/m02/…`: M20 ở 320/360/390/430 px dùng `expectMascotOverlapsNothing`, đếm tối đa một Mila mỗi màn
- [ ] T058 [P] Đồng bộ tài liệu dẫn xuất: `docs/mascot/MASCOT_TECHNICAL_SPECIFICATION.md` (cây `src/shared/motion`), `specs/005-visitor-mascot/contracts/mascot-ui-contract.md` (`MotionSwitch`), `docs/mascot/MASCOT_ASSET_SPECIFICATION.md` §4 (READY đợt 4), `screens/screen-spec` nếu lệch
- [ ] T059 Chạy `npm run ci` và `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil`; hoàn tất `validation-report.md` (lệnh, exit, test đổi có chủ đích, NOT RUN: thiết bị thật SC-MOT-011)

## Dependencies & Execution Order

- Setup (T001–T003) → Foundational (T004–T009) → các story.
- Đợt 1: US3 (T010–T016) trước US1/US2/US4 vì đổi công tắc và `MascotHost`; US1 (T017–T020), US2 (T021–T029), US4 (T030–T032) độc lập với nhau. US4 dùng `ProgressTrail` của T024 → làm sau T024.
- Đợt 2: US5 (T033–T038) cần kết luận T002. US6 (T039–T045): T042 sau T039 (cần ảnh để test có ảnh; fallback test chạy được trước).
- Đợt 3: US7 (T046–T049), US8 (T050–T051) độc lập; US9 (T052–T055) sau T042.
- Polish sau cả ba đợt.

## Parallel Examples

- Đợt 1: T018, T019, T020 song song (CSS khác tệp); T021, T022, T023 song song (test).
- Đợt 2: T033 và T040, T041 song song; T044 song song với T036–T037.
- Đợt 3: T046 và T053 song song; US7 và US8 song song.

## Implementation Strategy

1. **MVP = đợt 1** (US3 + US1 + US2 + US4): phản hồi rõ nhất ngoài thực địa, công tắc an toàn, không cần ảnh mới. Dừng, cho chủ dự án thử trên điện thoại, rồi mới sang đợt 2.
2. Đợt 2 và 3 mỗi đợt một PR; sau mỗi đợt chạy CI + E2E và cập nhật validation report.
3. Không có ảnh đợt 4 đạt kiểm → US6/US9 vẫn giao được với fallback; ghi rõ trong validation report.
