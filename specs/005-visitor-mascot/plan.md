# Implementation Plan: Mascot Mila — Đồng hành cùng du khách trên màn M01/M02

**Branch**: `005-visitor-mascot` *(định danh thư mục; git branch hiện tại `feat/m02-end-screen-redesign`)* | **Date**: 2026-11-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification [specs/005-visitor-mascot/spec.md](spec.md), bản dẫn xuất từ [spec-Mascot v1.0](../../docs/spec/spec-Mascot.md) (Change Brief [CHG-MASCOT-2026-11-21-01](change-brief-CHG-MASCOT-2026-11-21-01.md), APPROVED 2026-11-21). Nguồn kỹ thuật: [Technical spec](../../docs/mascot/MASCOT_TECHNICAL_SPECIFICATION.md), [State Machine](../../docs/mascot/MASCOT_STATE_MACHINE.md), [Behavior Matrix](../../docs/mascot/MASCOT_BEHAVIOR_MATRIX.md), [Asset spec](../../docs/mascot/MASCOT_ASSET_SPECIFICATION.md).

## Summary

Thêm Mila vào các màn du khách M01/M02 **chỉ ở frontend**:
- một engine tất định ở `src/shared/mascot/` (sự kiện, reducer, luật `MAS-B-*`, trọng tài ưu tiên, hẹn giờ, catalog VI/EN, registry ảnh);
- một host React ở `src/app/mascot/` render vào slot do layout từng màn khai báo;
- các lời gọi phát sự kiện một dòng ở chỗ M01/M02 đã có kết quả;
- minh họa tĩnh (INLINE) cạnh câu cố định.

Không backend, không dữ liệu bền vững, không dependency mới, không đổi hành vi hay contract M01/M02. Bật bằng công tắc `VITE_FEATURE_MASCOT`. Ảnh production do người dùng giao sau; trước đó dùng hình giữ chỗ CSS để kiểm hành vi (research R-08).

## Technical Context

**Language/Version**: TypeScript 7 (strict) trên Node.js 24; React 19.3; CSS Modules + token.

**Primary Dependencies**: không thêm. Dùng `react`, `react-dom` (portal), `react-router` (đường dẫn, điều hướng CTA), `vite` + `vite-plugin-pwa` (precache) đã có. Browser API: `matchMedia`, `IntersectionObserver`, `navigator.vibrate`, Page Visibility, `online`/`offline`.

**Storage**: Không. Chỉ UI state trong bộ nhớ (data-model §1).

**Testing**: Vitest + Testing Library (engine với đồng hồ giả, component, catalog, kiến trúc); Playwright project `m01`, `m02`, `m02-cam-evil` trên `preview:e2e` (cờ `on`); một lượt Vitest với cờ `off`; thiết bị thật do chủ dự án.

**Target Platform**: trình duyệt di động (Chrome Android, Safari iOS) và desktop; PWA offline sau lần mở đầu.

**Project Type**: web application (SPA modular monolith; chỉ phần frontend du khách).

**Performance Goals**: không làm chậm nội dung, dialog cuối chuyến hay LCP `/q/…` (SC-MAS-005, 010); engine + host ≤ 12 KB gzip; ảnh trong precache ≤ ~350 KB (MAS-NFR-01, 02; đo khi có ảnh thật).

**Constraints**: offline như online; giảm chuyển động; không chiếm focus; không đè nội dung; vòng animation ≤ 10 s; hẹn giờ dừng khi trang ẩn; lint token (không px/màu ngoài `tokens.css`).

**Scale/Scope**: 8 màn, 14 slot (contracts/mascot-ui-contract.md §2), ~30 điểm phát sự kiện ở ~14 tệp, 41 câu × 2 ngôn ngữ, 12 tư thế.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Kiểm tra | Trước Phase 0 | Sau Phase 1 | Bằng chứng |
|---|---|---|---|---|
| I. Spec-First Behavioral Authority | Mọi hành vi trỏ tới spec-Mascot (nguồn sự thật thứ năm theo constitution 2.2.0); bảng luật mang ID `MAS-B-*` dẫn tới BR-MAS; không thêm hành vi | PASS | PASS | spec.md Traceability; research R-04, R-05 |
| II. Module Ownership Boundaries | Mila không ghi entity nào; engine ở `src/shared/mascot/` không import module; M01/M02 chỉ import shared; host (app) đọc ngôn ngữ qua public API M01; M02 vẫn chỉ import M01 qua `m01Port.ts` | PASS | PASS | research R-02, R-15; contracts/mascot-event-contract.md §1; test kiến trúc mới |
| III. Minimal Diff & Traceability | Chỉ file trong brief §4.2; mỗi điểm phát một lời gọi; slot/figure là phần tử thêm vào layout; ID ổn định; artifact stale được ghi | PASS | PASS | contracts §3; research "Upstream có nguy cơ stale" |
| IV. Data Integrity & Immutability | Không dữ liệu bền vững; `SessionSyncRecord`, schema `visitorDb` không đổi; sự kiện phát sau khi lượt ghé đã commit | PASS | PASS | data-model §1, §3 |
| V. Security & Authorization | Không secret; `VITE_FEATURE_MASCOT` là cấu hình công khai (lint `findSecretPublicVars` vẫn áp); không gửi sự kiện ra ngoài, không analytics; payload không PII | PASS | PASS | research R-13; BR-MAS-18 |
| VI. Offline Integrity & PWA Contract | JS mascot và ảnh 240 trong precache; không runtime cache; không đụng busy check cập nhật; không hứa offline sai (BR-MAS-04) | PASS | PASS | research R-09 |
| VII. Simplicity & MVP Scope | Capability Could ở MVP-Scope §3.6; không điểm/huy hiệu (Won't §4 giữ nguyên); không scheduler nền — hẹn giờ chỉ khi trang hiện; không dependency mới | PASS | PASS | research R-01, R-11 |

Gate: **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/005-visitor-mascot/
├── change-brief-CHG-MASCOT-2026-11-21-01.md   # APPROVED
├── spec.md                                    # dẫn xuất spec-Mascot v1.0
├── checklists/requirements.md
├── plan.md                                    # file này
├── research.md                                # R-01…R-16
├── data-model.md                              # UI state trong bộ nhớ; không dữ liệu bền vững
├── contracts/
│   ├── mascot-event-contract.md               # sự kiện, payload, điểm phát
│   └── mascot-ui-contract.md                  # slot, component, token, catalog, ảnh
├── quickstart.md                              # Q1…Q17
└── tasks.md                                   # /speckit-tasks
```

### Source Code (repository root)

```text
src/shared/mascot/                 # mới — không import src/modules, src/app
├── events.ts                      # MascotEvent, emitMascotEvent, subscribeMascotEvents
├── machine.ts                     # step(state, input, ctx, now) → { state, effects }
├── rules.ts                       # bảng MAS-B-* → Intent
├── arbiter.ts                     # P0–P7, hàng đợi 1, cooldown, giới hạn chủ động, chống trùng
├── config.ts                      # giới hạn tạm spec-Mascot §5.4
├── slots.ts                       # registry slot (useSyncExternalStore)
├── MascotSlot.tsx                 # giữ chỗ + đăng ký
├── MascotFigure.tsx (+ .module.css)  # INLINE tĩnh
├── assets.ts                      # PoseId → { src240, src480 } | hình giữ chỗ
├── flag.ts                        # đọc VITE_FEATURE_MASCOT
├── dialogue/{catalog,vi,en}.ts
└── *.test.ts(x), architecture.test.ts

src/app/mascot/                    # mới
├── MascotHost.tsx                 # subscribe, chạy reducer, portal, timers, listeners
├── Mascot.tsx (+ Mascot.module.css)  # ảnh + bong bóng + CTA; AN-* bằng token
├── MascotBoundary.tsx
└── *.test.tsx

src/app/App.tsx                    # import() MascotHost khi cờ on (sửa nhỏ)
src/shared/ui/tokens.css           # token --mascot-*, --duration-mascot-*
src/shared/config/env.ts           # biến tùy chọn VITE_FEATURE_MASCOT
src/modules/m01/{language,catalog,recommendation,route-detail,offline-package}/…   # emit + slot/figure
src/modules/m02/{session,scanner,content,qr-link,end,layout}/…                    # emit + slot/figure
assets/mascot/web/*.webp           # khi người dùng giao ảnh (G2)
vite.config.ts                     # globPatterns ảnh 240; chunk `mascot`
.env.example, .env.fake, .env.e2e  # VITE_FEATURE_MASCOT
e2e/m01/mascot-*.spec.ts, e2e/m02/mascot-*.spec.ts
```

**Structure Decision**: một web app hiện có; thêm hai thư mục mới (`src/shared/mascot`, `src/app/mascot`), còn lại chỉ sửa nhỏ theo contracts. Không thư mục backend.

## Component Responsibilities

| Thành phần | Trách nhiệm | Không được |
|---|---|---|
| `events.ts` | Bus trong bộ nhớ, `queueMicrotask`, `try/catch`, no-op khi cờ tắt | Lưu, gửi ra ngoài, throw |
| `machine.ts` + `rules.ts` + `arbiter.ts` | Từ sự kiện + ngữ cảnh + thời gian ra trạng thái và hiệu ứng, tất định | Gọi DOM, `Date.now()`, IndexedDB |
| `MascotSlot` / `slots.ts` | Giữ chỗ, đăng ký vị trí, nhận callback CTA của màn | Logic hành vi |
| `MascotFigure` | Ảnh tĩnh INLINE | Bong bóng, sự kiện |
| `MascotHost` | Ngữ cảnh (đường dẫn, ngôn ngữ, hiển thị, mạng, giảm chuyển động), chạy reducer, thực thi hiệu ứng (portal, hẹn giờ, rung) | Ghi dữ liệu, đọc IndexedDB |
| `Mascot` | Render ảnh, bong bóng, nút đóng, CTA, lớp animation | Quyết định khi nào nói |
| Module M01/M02 | Phát sự kiện sau khi xong việc; đặt slot/figure | Đổi logic hiện có |

## Data Flow and Persistence Boundaries

`M01/M02 (đã xong việc)` → `emitMascotEvent` → `MascotHost` (ngữ cảnh) → `step()` → hiệu ứng → `Mascot` trong slot. Không có mũi tên ngược về module (trừ CTA "Đóng camera" gọi đúng `onClose` hiện có của scanner qua slot). Không ghi gì vào IndexedDB, Cache Storage hay `localStorage`.

## Integration Contracts

- [contracts/mascot-event-contract.md](contracts/mascot-event-contract.md) — danh mục sự kiện (26 dòng), payload, điểm phát, CTA.
- [contracts/mascot-ui-contract.md](contracts/mascot-ui-contract.md) — slot theo màn, component, token, catalog, ảnh, thuộc tính kiểm thử.
- Contract liên module M01/M02/M03 (AGENTS.md §3.2): **không đổi**.

## Implementation Sequence (định hướng cho `/speckit-tasks`)

1. **Setup**: cờ trong `env.ts` và `.env*`; token mới; nhánh chunk `mascot` và mẫu precache trong `vite.config.ts`; thư mục `assets/mascot/`.
2. **Foundational** (chặn mọi story): `events`, `config`, `arbiter`, `machine` (khung + T1–T15 trừ T11), `slots`, `MascotSlot`, `MascotFigure`, `assets` (hình giữ chỗ), catalog VI/EN + test catalog, `MascotHost` + `Mascot` + boundary, gắn vào `App.tsx`; test kiến trúc.
3. **US3 (tránh đường)** trước các story vui: luật P0/chặn, gỡ khỏi DOM khi tạm đóng, media/dialog/ẩn trang, giảm chuyển động, kiểm chồng lấp.
4. **US1 (làm quen)**, **US2 (lượt ghé + điểm cuối)**, **US4 (kết thúc)** → mốc pilot (G5).
5. **US5 (scanner)**, **US6 (mạng/dữ liệu)** → G6.
6. **US7 (M01 chuẩn bị)** → G7.
7. **US8 (chạm hỏi, nhắc thiên nhiên, chào lại)** → G8.
8. **Polish**: ảnh production khi có (xuất WebP, đo ngân sách), cập nhật bộ thiết kế stale, validation report.

## Risks

| Rủi ro | Giảm thiểu |
|---|---|
| Mila làm phiền (không có nút ẩn) | Luật P/cooldown/giới hạn trong reducer có test; pilot trên máy thật trước khi bật Production |
| Điểm phát làm đổi thứ tự hay timing nghiệp vụ | Phát sau khi xong, `queueMicrotask`, không await; toàn bộ test M01/M02 chạy với cờ on/off (SC-MAS-001) |
| Slot làm xô lệch layout đã duyệt (màn kết quả 2026-11-11, trip, content) | Slot giữ chỗ cố định theo token; so ảnh chụp E2E trước/sau; INTRO chỉ trong hero |
| Ảnh production chậm | Engine và hành vi kiểm bằng hình giữ chỗ; Production chỉ bật khi có ảnh và quyền (OD-MAS-06, 07) |
| Precache phình | Chỉ ảnh 240 trong precache; test đọc `dist/sw.js` |
| Rung bị trình duyệt chặn ở trang `/q/…` | Chấp nhận như "không hỗ trợ" (R-14) |

## Validation Strategy

- `npm run ci` PASS (typecheck, lint token gồm token mới, unit, build) — cờ `on` trong `fake`/`e2e`, và một lượt Vitest cờ `off`.
- `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` PASS, gồm các spec cũ không sửa.
- Kịch bản [quickstart](quickstart.md) Q1–Q17 ↔ SC-MAS-001…010.
- Ngân sách: chunk `mascot`, ảnh 240 trong `dist/sw.js`.
- Thiết bị thật, Lighthouse: chủ dự án; chưa chạy thì `NOT RUN`.

## Downstream References

- Bộ thiết kế `docs/mascot/` cần cập nhật sau khi code: vị trí `MascotSlot`/`MascotFigure` (R-02, R-07), mẫu precache (R-09).
- `docs/architecture/tech-stack.md`: không đổi (không dependency). `environment.md`: đã có `VITE_FEATURE_MASCOT`.

## Complexity Tracking

| # | Mục | Lý do | Phương án đơn giản hơn bị loại |
|---|---|---|---|
| 1 | Thư mục React trong `src/shared/mascot/` (slot, figure) | Module phải đặt slot trong layout của mình mà không import `src/app/` | Slot ở `src/app/` → module import app → vòng phụ thuộc với router |
| 2 | Hình giữ chỗ CSS khi chưa có ảnh | AGENTS.md §4 cấm agent tạo ảnh nhân vật; cần kiểm hành vi trước khi có ảnh | Cắt ảnh từ concept sheet: chưa xác nhận quyền, viền lỗi |
