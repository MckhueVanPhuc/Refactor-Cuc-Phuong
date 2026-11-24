# Implementation Plan: Motion & micro-interactions trên màn du khách M01/M02

**Branch**: `006-visitor-motion` *(định danh thư mục; git branch `feat/visitor-motion`, tách từ `feat/mascot-v15-motion-docs` của PR #79)* | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: [spec.md](spec.md) (dẫn xuất từ spec-Mascot v1.5 và design-system §4.3.1–4.3.2, §5.3, §5.4, §7, §9); Change Brief [CHG-MOTION-2026-11-24-01](change-brief-CHG-MOTION-2026-11-24-01.md) (APPROVED 2026-11-24). Nền code: `main` 7c29104 + Phase 19 của gói 005 (PR #79).

## Summary

Thêm chuyển động ba tầng cho màn du khách **chỉ ở frontend**, không thư viện:
- một nguồn "mức chuyển động" ở `src/shared/motion/` (công tắc chung, giảm chuyển động, tiết kiệm dữ liệu, máy yếu) phản chiếu thành `data-motion` / `data-decor` trên `<html>` để CSS gate (research R-02);
- T1: phản hồi nhấn, thanh tiến trình hành trình xác định và hiệu ứng mở khóa checkpoint, thanh "đang tải" không xác định của gói (R-04–R-06);
- T2: `<ViewTransition>` của React 19.3 cho đổi màn và ảnh thẻ → ảnh chi tiết, thẻ hiện dần, skeleton có vệt sáng (R-01, R-07–R-09);
- T3: màn kết quả (đóng dấu huy hiệu, confetti lá, danh sách lần lượt), nắng và lá ở hero danh mục (R-12, R-13);
- Mila: ảnh đợt 4, tư thế mới, khung phụ bằng CSS, rung theo công tắc, công tắc "Hiệu ứng chuyển động" luôn hiện (R-10, R-11, R-14, R-15).

Ba đợt giao theo change brief §8: đợt 1 = US1–US4 (P1), đợt 2 = US5–US6 (P2), đợt 3 = US7–US9 (P3).

## Technical Context

**Language/Version**: TypeScript 7 (strict) trên Node.js 24; React 19.3.1 (`ViewTransition`); CSS Modules + token.

**Primary Dependencies**: không thêm. `react`, `react-router` 8.5 (đã có), `vite` + `vite-plugin-pwa`. Browser API: `matchMedia`, `IntersectionObserver`, View Transitions, `navigator.connection` (tùy chọn), `navigator.deviceMemory` (tùy chọn), `navigator.vibrate`.

**Storage**: Không. Chỉ UI state trong bộ nhớ (data-model).

**Testing**: Vitest + Testing Library (store/level, hook reveal, `ProgressTrail`, `LeafConfetti`, engine Mila cho tư thế mới); Playwright `m01`, `m02`, `m02-cam-evil` trên `preview:e2e` (thêm kịch bản quickstart M1–M20, đo CLS/LCP); thiết bị thật do chủ dự án.

**Target Platform**: Chrome Android, Safari iOS, desktop; PWA offline sau lần mở đầu.

**Project Type**: web application (SPA modular monolith; chỉ phần frontend du khách).

**Performance Goals**: JS + CSS motion ≤ 15 KB gzip; ảnh đợt 4 ≤ 120 KB precache; LCP SCR-M01-001 không chậm hơn nền quá 100 ms; CLS 0; chỉ `transform`/`opacity` (+ `stroke-dashoffset`).

**Constraints**: lint token (không px/màu ngoài `tokens.css`); offline như online; T3 ≤ 3 cùng lúc, tự dừng ≤ 5 s hoặc theo công tắc; không vòng JS khi màn đứng yên; dừng khi trang ẩn; WCAG 2.2.2, 2.3.1; Mila tối đa một lần trên màn.

**Scale/Scope**: 9 màn du khách (SCR-M01-001…004, SCR-M02-001…005), ~20 tệp màn/layout chỉ sửa phần trình bày, 9 ảnh đợt 4, 11+1 token.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Kiểm tra | Trước Phase 0 | Sau Phase 1 | Bằng chứng |
|---|---|---|---|---|
| I. Spec-First Behavioral Authority | Hành vi công tắc, rung, tư thế lấy từ spec-Mascot v1.4/v1.5; hình thức từ design-system; không câu/số mới (FR-MOT-016) | PASS | PASS | spec.md Traceability; research R-11, R-12, R-15 |
| II. Module Ownership Boundaries | `src/shared/motion` không import module; M01/M02 chỉ đổi phần trình bày; dấu mở khóa là UI state nội bộ M02; M02 vẫn chỉ import M01 qua `m01Port.ts` | PASS | PASS | contracts/motion-ui-contract.md §2, §6; data-model §3 |
| III. Minimal Diff & Traceability | Chỉ file trong brief §4.2; tái dùng khối giữ chỗ, huy hiệu, `MascotFigure`; artifact stale ghi ở research | PASS | PASS | research "Upstream có nguy cơ stale" |
| IV. Data Integrity & Immutability | Không ghi `PlaySession`, `CheckpointVisit`, `SessionSyncRecord`; `processScan` không đổi | PASS | PASS | data-model; R-05 |
| V. Security & Authorization | Không secret, không dịch vụ ngoài, không analytics mới | PASS | PASS | change brief §5 |
| VI. Offline Integrity & PWA Contract | Ảnh đợt 4 cỡ 240 vào precache theo glob sẵn có; không runtime cache; không đụng busy check cập nhật | PASS | PASS | R-10; quickstart M19 |
| VII. Simplicity & MVP Scope | Could (MVP-Scope §3.7); không huy hiệu/điểm; không dependency; không scheduler | PASS | PASS | change brief §7 |

Gate: **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/006-visitor-motion/
├── change-brief-CHG-MOTION-2026-11-24-01.md   # APPROVED
├── spec.md
├── checklists/requirements.md
├── plan.md                                    # file này
├── research.md                                # R-01…R-16
├── data-model.md                              # UI state trong bộ nhớ
├── contracts/motion-ui-contract.md
├── quickstart.md                              # M1…M20, đo
└── tasks.md                                   # /speckit-tasks
```

### Source Code (repository root)

```text
src/shared/motion/                 # mới — không import src/modules, src/app
├── store.ts                       # công tắc (chuyển từ shared/mascot/motion.ts)
├── level.ts                       # useMotionLevel, useMotionAttributes
├── MotionSwitch.tsx (+ .module.css)
├── reveal.ts                      # useReveal
├── LeafConfetti.tsx (+ .module.css)
└── index.ts

src/shared/ui/
├── tokens.css                     # token §4.3.1 + gate data-motion
├── ProgressTrail.tsx (+ .module.css)
└── Button.module.css              # phản hồi nhấn

src/shared/mascot/                 # motion.ts → re-export; assets.ts, types.ts, rules.ts (tư thế đợt 4, AN-WALK)
src/app/App.tsx                    # useMotionAttributes
src/app/mascot/                    # Mascot.tsx khung phụ; MascotHost rung theo công tắc
src/modules/m01/                   # CatalogPage, RouteCard, RecommendResultsPage, RouteDetailPage, PackagePanel,
                                   # OfflinePage, VisitorLayout — chỉ trình bày
src/modules/m02/                   # TripPage, RouteJourneyMap, journey/unlockSignal.ts, ScanContent (markUnlock),
                                   # EndPage, FieldLayout — chỉ trình bày
assets/icons/                      # footprint.svg, sun-rays.svg (mới)
assets/mascot/web/                 # WebP đợt 4
e2e/m01, e2e/m02                   # kịch bản quickstart
```

**Structure Decision**: modular monolith hiện có; thêm một thư mục dùng chung `src/shared/motion/` (đã nêu trong change brief §4.2), còn lại sửa tại chỗ.

## Thứ tự giao

| Đợt | Story | Nội dung chính | Cổng |
|---|---|---|---|
| 0 | — | Đo nền LCP/CLS/kích thước; spike `ViewTransition` + react-router 8 (R-01) | số đo ghi validation report |
| 1 | US3, US1, US2, US4 | `src/shared/motion` + token + công tắc chung + rung; nhấn/hover; `ProgressTrail` + mở khóa; thanh gói | `npm run ci`, E2E, M1–M10 |
| 2 | US5, US6 | ViewTransition, reveal, skeleton; ảnh đợt 4 (xuất, registry, tư thế) | M11–M14, M19 |
| 3 | US7, US8, US9 | màn kết quả, hero, khung phụ; DV-95 | M15–M18, M20; đo cuối |

## Complexity Tracking

Không có vi phạm constitution cần biện minh.
