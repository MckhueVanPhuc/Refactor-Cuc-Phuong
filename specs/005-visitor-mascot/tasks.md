---

description: "Danh sách task triển khai Mascot Mila — đồng hành cùng du khách trên màn M01/M02"
---

# Tasks: Mascot Mila — Đồng hành cùng du khách trên màn M01/M02

**Input**: Tài liệu thiết kế trong `specs/005-visitor-mascot/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/mascot-event-contract.md](contracts/mascot-event-contract.md), [contracts/mascot-ui-contract.md](contracts/mascot-ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: **Có.** Người dùng yêu cầu viết test trước như các gói 001–004; constitution "Testing & Validation" yêu cầu mỗi BR có test. Test viết trước và phải FAIL trước khi cài đặt.

**Organization**: Task nhóm theo user story của [spec.md](spec.md) (US1…US9) để mỗi story cài đặt và kiểm chứng độc lập. Thứ tự phase theo plan "Implementation Sequence": US3 (tránh đường) đi trước các story P1 khác vì mọi story phải tuân theo nó.

> **Quy tắc dẫn xuất.** File này không tạo requirement. Hành vi lấy từ [spec-Mascot v1.1](../../docs/spec/spec-Mascot.md) (Phase 12–17 và các task có ghi "v1.1" theo [CHG-MASCOT-2026-11-22-02](change-brief-CHG-MASCOT-2026-11-22-02.md)); quyết định kỹ thuật lấy từ plan/research; ID hành vi `MAS-B-*` theo [Behavior Matrix](../../docs/mascot/MASCOT_BEHAVIOR_MATRIX.md). Phạm vi file theo change brief [CHG-MASCOT-2026-11-21-01](change-brief-CHG-MASCOT-2026-11-21-01.md) §4.2 và non-goals §7: **không** backend, không dependency mới, không dữ liệu bền vững, không đổi logic/kiểu trả về/thứ tự ghi dữ liệu của M01/M02; mỗi điểm phát sự kiện là **một lời gọi** đặt sau khi việc nghiệp vụ đã xong.
>
> **Giao diện.** Task dựng giao diện dùng skill `frontend-design`; màu, font, khoảng cách, bo góc, thời lượng chỉ lấy từ token ([design-system](../../docs/design/design-system.md) §4.3, §9; lint `tokens.lint.test.ts`). Câu chữ lấy nguyên văn từ bảng copy screen spec (đã đồng bộ spec-Mascot §5.6). Không vẽ nhân vật, không đưa ảnh vào repo trước OD-MAS-06/07; dùng hình giữ chỗ CSS (research R-08).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story của task (US1…US8, theo spec.md)

## Path Conventions

- Engine: `src/shared/mascot/` (test Vitest đặt cạnh mã nguồn). Host: `src/app/mascot/`. Điểm phát và slot: `src/modules/m01/**`, `src/modules/m02/**`. E2E: `e2e/m01/mascot-*.spec.ts`, `e2e/m02/mascot-*.spec.ts` (project `m01`, `m02`, `m02-cam-evil` trên `preview:e2e`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Công tắc, token, cấu hình build, thư mục ảnh.

- [X] T001 [P] Thêm biến tùy chọn `VITE_FEATURE_MASCOT` (`on` | `off`, thiếu = `off`) vào schema trong `src/shared/config/env.ts` và tạo `src/shared/mascot/flag.ts` export `isMascotEnabled(): boolean`; test trong `src/shared/config/env.test.ts` (thiếu → off; giá trị lạ → lỗi khởi động nêu tên biến như các biến khác) (research R-13)
- [X] T002 [P] Thêm `VITE_FEATURE_MASCOT` vào `.env.example` (`off`, kèm chú thích "công tắc phát hành Mila, không phải secret"), `.env.fake` (`on`) và `.env.e2e` (`on`)
- [X] T003 [P] Thêm token `--mascot-size-sm/md/lg`, `--mascot-bubble-max-width`, `--duration-mascot-enter/-exit/-pop/-hop/-celebrate/-loop` vào `src/shared/ui/tokens.css` theo [mascot-ui-contract §4](contracts/mascot-ui-contract.md), và đặt mọi `--duration-mascot-*` = 0ms trong khối `@media (prefers-reduced-motion: reduce)` hiện có
- [X] T004 [P] Trong `vite.config.ts`: (a) `chunkPrefix` trả `mascot` khi mọi module id nằm dưới `src/shared/mascot/` hoặc `src/app/mascot/`; (b) thêm `assets/ma-*-240-*.webp` và `assets/ma-11-avatar-96-*.webp` vào `workbox.globPatterns`, không thêm `webp` chung (research R-09)
- [X] T005 [P] Tạo `assets/mascot/README.md` ghi quy ước thư mục `source/` (PNG gốc người dùng cung cấp) và `web/` (WebP 240/480 do agent xuất), tên `ma-<nn>-<name>-<size>.webp` ([Asset spec](../../docs/mascot/MASCOT_ASSET_SPECIFICATION.md) §3, §5); chưa thêm ảnh nào

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Engine, catalog, slot, host. Chưa có hành vi story nào; cờ `on` vẫn không hiện gì ngoài khung trống.

**⚠️ CRITICAL**: Không story nào bắt đầu trước khi phase này xong.

### Tests (viết trước, phải FAIL) ⚠️

- [X] T006 [P] Viết `src/shared/mascot/architecture.test.ts`: không file nào trong `src/shared/mascot/` (trừ `*.test.*`) import `src/modules/` hay `src/app/`; module M01/M02 chỉ import `src/shared/mascot/index` (không import file nội bộ); `src/modules/m02/architecture.test.ts` hiện có vẫn PASS (MAS-TC-043)
- [X] T007 [P] Viết `src/shared/mascot/events.test.ts`: listener nhận sự kiện ở microtask kèm `at`; listener throw không ảnh hưởng listener khác và người gọi; `emitMascotEvent` trả `undefined`, không promise; cờ off → không listener nào được gọi; unsubscribe hoạt động (contracts/mascot-event-contract.md §1)
- [X] T008 [P] Viết `src/shared/mascot/arbiter.test.ts`: P cao ngắt P thấp; cùng P mà bong bóng cũ < 1,5 s thì xếp hàng; hàng đợi 1 mục, TTL 4 000 ms; P5–P7 không xếp hàng; cooldown theo `messageId`; sự kiện trùng trong 500 ms bị bỏ; giới hạn 3 câu P5–P7 / 10 phút; ngữ cảnh chặn (`DIALOG`, `MEDIA`, trang ẩn) chỉ cho P0–P1 (MAS-TC-002…006, 011; BR-MAS-05…08)
- [X] T009 [P] Viết `src/shared/mascot/dialogue/catalog.test.ts`: `vi` và `en` cùng bộ khóa; mọi câu ≤ 90 ký tự sau khi thay tham số dài nhất (`k`, `n`, `count` = 99, `cheer` dài nhất); không chứa từ cấm (`đã đến`, `tới nơi`, `có mặt`, `arriv`, `you're at`, `made it to`, `bắt buộc`, `must`); nhãn CTA bằng đúng chuỗi i18n hiện có (`m01` `nav.recommend`, `recommend.seeAllRoutes`; `m02` `scanner.close`) (MAS-TC-050…052)
- [X] T010 [P] Viết `src/shared/mascot/machine.test.ts`: reducer thuần (cùng đầu vào → cùng đầu ra, snapshot); chuyển T1 (route có slot → `IDLE`), T4/T5 (bong bóng hiện/hết), T9 (CLOSED → `SUPPRESSED`), T10 (ngữ cảnh chặn), T14 (lỗi ảnh → `HIDDEN`) theo [State Machine](../../docs/mascot/MASCOT_STATE_MACHINE.md) §7; không gọi `Date.now()` (MAS-TC-012)
- [X] T011 [P] Viết `src/shared/mascot/MascotSlot.test.tsx` và `src/shared/mascot/MascotFigure.test.tsx`: slot giữ chỗ theo token của mode lớn nhất, đăng ký/hủy đăng ký trong registry, có `data-mascot-slot`; figure là `img alt=""` `aria-hidden`, ảnh lỗi → không render; cờ off → cả hai không render gì
- [X] T012 [P] Viết `src/app/mascot/MascotHost.test.tsx` (đồng hồ giả): host nhận sự kiện → render bong bóng vào đúng slot qua portal; đổi ngôn ngữ đổi chữ cùng `messageId`; trang ẩn → dừng hẹn giờ và bỏ bong bóng; lỗi trong listener/reducer → boundary đưa về `HIDDEN`, trang vẫn render; giảm chuyển động → không hiệu ứng `vibrate`, không lá rơi
- [X] T073 [P] *(thêm sau analyze 2026-11-21, chạy trong Phase 2)* Viết `src/shared/mascot/noDataEffect.test.ts` cho BR-MAS-01 và BR-MAS-18: quét mã nguồn (không gồm `*.test.*`) của `src/shared/mascot/` và `src/app/mascot/`, khẳng định không có `indexedDB`, `Dexie`, `.table(`, `localStorage`, `sessionStorage`, `caches.`, `fetch(`, `sendBeacon`, `XMLHttpRequest`, và không import `src/shared/db/`, `src/shared/supabase/`, `src/app/analytics/`, `@vercel/analytics`, `@vercel/speed-insights`
- [X] T074 [P] *(thêm sau analyze 2026-11-21, chạy trong Phase 2, mở rộng dần theo story)* Viết `e2e/m02/mascot-no-data-effect.spec.ts` cho BR-MAS-01, BR-MAS-18 và SC-MAS-001: đi trọn một chuyến (Start → quét → kết thúc) với cờ `on`; khẳng định `localStorage` và `sessionStorage` không có khóa chứa `mascot`; danh sách object store của IndexedDB `visitorDb` bằng đúng danh sách khai báo trong `src/shared/db/visitorDb.ts`; `SessionSyncRecord` gửi tới intake (bắt bằng `page.route` như V24) đúng shape và giá trị mong đợi của E2E hiện có; không request nào trong chuyến có body hay URL chứa `MSG-MAS` hoặc `mascot`

### Implementation

- [X] T013 Tạo `src/shared/mascot/events.ts` (`MascotEvent` union đúng [contract sự kiện](contracts/mascot-event-contract.md) §3, `emitMascotEvent`, `subscribeMascotEvents`), `src/shared/mascot/config.ts` (hằng spec-Mascot §5.4: `MASCOT_SCANNER_LOOK_S`… `MASCOT_VIBRATION_MS`, `NATURE_REMINDERS_APPROVED = false`) và `src/shared/mascot/index.ts` (public entry: emit, `MascotSlot`, `MascotFigure`, kiểu)
- [X] T014 Tạo `src/shared/mascot/dialogue/vi.ts`, `en.ts` (`en: typeof vi`), `catalog.ts`: 41 câu MSG-MAS-001…075 + 057a–e, nhãn `ask` ("Hỏi Mila"/"Ask Mila"), `dismiss` ("Đóng lời nhắn"/"Dismiss message"), `notNow` ("Chưa"/"Not now"), nhãn CTA; chép nguyên văn từ bảng copy SCR-M01-001…004, SCR-M02-001…004; metadata (P, cooldown, tự ẩn, CTA, `role`) theo [Dialogue Library](../../docs/mascot/MASCOT_DIALOGUE_LIBRARY.md) §3; thời lượng đọc theo spec-Mascot §5.4
- [X] T015 Tạo `src/shared/mascot/arbiter.ts` theo T008 (research R-05)
- [X] T016 Tạo `src/shared/mascot/machine.ts` (kiểu `MascotState`, `MascotContext`, `Intent`, `Effect` theo [data-model](data-model.md) §2; `step()`) và `src/shared/mascot/rules.ts` (registry rỗng `MAS-B-* → (event, ctx, state) => Intent | null`, mỗi dòng mang `behaviorId`) theo T010
- [X] T017 [P] Tạo `src/shared/mascot/slots.ts` (registry + `useSyncExternalStore`), `src/shared/mascot/MascotSlot.tsx` (giữ chỗ, nhận `onCta`) theo T011
- [X] T018 [P] Tạo `src/shared/mascot/assets.ts` (`PoseId` MA-01…11, MA-13 → `{ src240, src480 }` qua `import.meta.glob('/assets/mascot/web/*.webp', { eager: true, query: '?url' })`; thiếu tệp → `null` để component dùng hình giữ chỗ CSS) và `src/shared/mascot/MascotFigure.tsx` + `MascotFigure.module.css` (hình giữ chỗ: đĩa tròn màu token, không phải nhân vật) theo T011 (research R-08)
- [X] T019 Tạo `src/app/mascot/Mascot.tsx` + `Mascot.module.css` (dùng skill `frontend-design`): ảnh (`<button aria-label="Hỏi Mila">` ở DOCK/AVATAR, `aria-hidden` ở INTRO/CELEBRATE), `<img srcset>` 240/480 rơi về 240 khi 480 lỗi, bong bóng `<p lang>` + nút đóng 44px + CTA, lớp `AN-ENTER/EXIT/INTRO/SHRINK/POP/SETTLE/BREATHE/LOOK/TILT/HOP/SEARCH/PACK/THUMB/CELEBRATE` bằng token, vòng lặp hữu hạn ≤ 10 s; `data-mascot-mode`, `data-mascot-pose`, `data-mascot-message` ([mascot-ui-contract](contracts/mascot-ui-contract.md) §1, §3; design-system §9)
- [X] T020 Tạo `src/app/mascot/MascotHost.tsx` + `MascotBoundary.tsx`: subscribe bus; ngữ cảnh (ngôn ngữ qua `useLanguagePreference` + `resolveDisplayLanguage` từ `src/modules/m01/index.ts`, `visibilitychange`, `online`/`offline`, `matchMedia` reduced motion, `pathname`); chạy `step()`; thực thi hiệu ứng (portal vào slot, một `setTimeout`, `navigator.vibrate?.()` trong `try`) theo T012 (research R-10, R-11, R-12, R-14, R-15)
- [X] T021 Sửa `src/app/App.tsx`: khi `isMascotEnabled()` thì `import()` `MascotHost` và render ngang hàng `UpdatePrompt`, truyền `pathname` và `router.navigate`; cờ off không `import()`; test trong `src/app/router.m02.test.tsx` hoặc file mới `src/app/App.mascot.test.tsx`
- [X] T022 Sửa `src/shared/ui/Dialog.tsx`: phát `app.dialog.changed { open, kind: 'OTHER' }` khi mở/đóng (một lời gọi mỗi chiều, không đổi hành vi dialog); test trong `src/shared/ui/Dialog.test.tsx`
- [X] T023 Chạy `npm run ci` và `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` với cờ `on`: toàn bộ test hiện có PASS không sửa (SC-MAS-001 mốc nền); ghi kết quả vào `specs/005-visitor-mascot/validation-report.md`

**Checkpoint**: Engine và host sẵn sàng; chưa có luật nào; app chạy như cũ.

---

## Phase 3: User Story 3 - Mila tránh đường — US-MAS-05 (Priority: P1)

**Goal**: Mila không che việc chính, rời màn khi tạm đóng, im lặng khi nghe/xem/có dialog/trang ẩn, tôn trọng giảm chuyển động, hỏng thì im.

**Independent Test**: quickstart Q7, Q8, Q13, Q14 (và Q14 chạy lại sau mỗi story có slot mới).

### Tests for User Story 3 ⚠️

- [X] T024 [P] [US3] Thêm vào `src/shared/mascot/rules.test.ts` các ca MAS-B-045 (CLOSED → `SUPPRESSED`, xóa hàng đợi, cả `m02.notice.closedShown`), MAS-B-058 (media), MAS-B-035 (thông báo tự kết thúc → chỉ P0–P1), MAS-B-082 (ảnh lỗi → `HIDDEN`), MAS-B-083 (đổi màn hủy bong bóng/hẹn giờ, giữ P4 vừa phát), MAS-B-084 (trang ẩn), dialog `OTHER` chặn, dialog `FINAL_PROMPT` không chặn
- [X] T025 [P] [US3] Viết `e2e/m02/mascot-safety.spec.ts`: Q7 (lookup giả `TEMPORARILY_CLOSED` → không có `[data-mascot-slot] img`, thông báo cố định nguyên văn), Q8 (phát audio → không `[data-mascot-message]`), Q13 (`page.emulateMedia({ reducedMotion: 'reduce' })` → `getAnimations()` của phần tử mascot rỗng)
- [X] T026 [P] [US3] Viết `e2e/m02/mascot-layout.spec.ts` và `e2e/m01/mascot-layout.spec.ts`: ở 320/360/390/430 px, với mọi `[data-mascot-slot]` đang hiện, `boundingBox` không giao nút hành động, khung quét, vùng thông báo, toast, dialog, bài đọc; không cuộn ngang ở 320 px (SC-MAS-002; chạy lại sau mỗi story)

### Implementation for User Story 3

- [X] T027 [US3] Cài các luật MAS-B-035, 045, 058, 082, 083, 084 và chặn dialog trong `src/shared/mascot/rules.ts`; host gỡ mascot khỏi DOM (không chỉ ẩn CSS) khi `SUPPRESSED` do CLOSED
- [X] T028 [P] [US3] Phát `m02.notice.closedShown` trong `src/modules/m02/content/ScanNotice.tsx` khi `kind = 'CLOSED'` (một lời gọi trong effect)
- [X] T029 [P] [US3] Phát `m02.media.playing` / `m02.media.stopped` từ sự kiện `play`, `pause`, `ended` trong `src/modules/m02/content/MediaList.tsx`
- [X] T030 [P] [US3] Phát `m02.notice.autoEndShown` / `Hidden` theo `useAutoEndNotice` trong `src/modules/m02/layout/FieldLayout.tsx`

**Checkpoint**: Mọi luật an toàn có test; các story sau không thể đặt Mila sai chỗ mà không đỏ T026.

---

## Phase 4: User Story 1 - Làm quen với Mila — US-MAS-01 (Priority: P1) 🎯 Pilot

**Goal**: Giới thiệu một lần sau lần chọn ngôn ngữ đầu tiên; chào lại khi đã có ngôn ngữ; không có gì trên `/q/…`.

**Independent Test**: quickstart Q1, Q2, Q3.

### Tests for User Story 1 ⚠️

- [X] T031 [P] [US1] Thêm vào `src/shared/mascot/rules.test.ts`: MAS-B-001 → 002 → 003 (INTRO hai câu rồi DOCK; × hoặc `m01.catalog.interacted` kết thúc sớm), MAS-B-004 (chỉ khi ngôn ngữ có trước khi tải trang, một lần), MAS-B-080 (đổi ngôn ngữ giữ `messageId`)
- [X] T032 [P] [US1] Viết `e2e/m01/mascot-intro.spec.ts` (Q1: chọn "Tiếng Việt" → MSG-MAS-001 rồi 002, danh mục bấm được; Q2: reload → không INTRO, có MSG-MAS-004; đổi EN khi bong bóng hiện → chữ tiếng Anh cùng `data-mascot-message`) và `e2e/m02/mascot-qr-link.spec.ts` (Q3: context mới mở `/q/Q1a` → không `INTRO`, có `[data-mascot-figure]` cạnh gợi ý khách tự do, nội dung hiện như trước)

### Implementation for User Story 1

- [X] T033 [US1] Cài MAS-B-001…004, 080 trong `src/shared/mascot/rules.ts`
- [X] T034 [P] [US1] Phát `m01.language.selected` sau khi `writeLanguagePreference` resolve trong `src/modules/m01/language/LanguageGate.tsx`; phát `m01.language.changed` trong `src/modules/m01/language/LanguageControl.tsx`
- [X] T035 [US1] Trong `src/modules/m01/catalog/CatalogPage.tsx` (+ `CatalogPage.module.css`, dùng skill `frontend-design`): đặt `<MascotSlot id="catalog-hero" modes={['INTRO','DOCK']} />` trong hero; phát `m01.catalog.loaded` theo `catalog.status` và `m01.catalog.interacted` ở lần cuộn đầu / mở thẻ đầu
- [X] T036 [P] [US1] Đặt `<MascotFigure pose="map" />` cạnh gợi ý khách tự do trong `src/modules/m02/qr-link/FreeVisitorHint.tsx` (+ `.module.css`) (OD-MAS-14)

**Checkpoint**: US1 kiểm độc lập được bằng Q1–Q3.

---

## Phase 5: User Story 2 - Mila ăn mừng tiến độ có thật — US-MAS-02 (Priority: P1) 🎯 Pilot

**Goal**: Ăn mừng lượt ghé mới với "{k}/{n}", rung nhẹ; không ăn mừng khi quét lại hay khách tự do; dialog cuối chuyến không bị chậm.

**Independent Test**: quickstart Q4, Q5, Q6.

### Tests for User Story 2 ⚠️

- [X] T037 [P] [US2] Thêm vào `src/shared/mascot/rules.test.ts`: MAS-B-050 (pool `{cheer}` xoay tất định), 051 (k = 1, một lần mỗi phiên), 055 (k = ⌈n/2⌉, n ≥ 4, không phải điểm cuối, thay 050), 053 (quét lại → không), `m02.visit.recorded` lặp cùng `visitRef` (lùi/tiến về trang nội dung) → không ăn mừng, không rung lần hai, MAS-B-033 (tư thế DOCK theo tiến độ: chưa quét → `binoculars`, đã quét → `map`, đã quét điểm cuối và còn phiên → `thumbs-up`; State Machine §3.1), khách tự do → không (BR-MAS-14), hiệu ứng `vibrate(30)` chỉ cho lượt ghé mới và không khi giảm chuyển động (BR-MAS-19), 060 (figure trong dialog, không trì hoãn), 061 ("Đi tiếp")
- [X] T038 [P] [US2] Viết `e2e/m02/mascot-visit.spec.ts`: Q4 (MSG-MAS-051, toast "Đã ghi nhận lượt quét." còn), Q5 (MSG-MAS-055 ở điểm 2/4; quét lại điểm 1 không có bong bóng), Q6 (thời điểm dialog cuối chuyến xuất hiện không trễ hơn ngưỡng của E2E hiện có cho dialog; `[data-mascot-figure="cheer"]` trong dialog; "Đi tiếp" → MSG-MAS-061)

### Implementation for User Story 2

- [X] T039 [US2] Cài MAS-B-033, 050, 051, 053, 055, 060, 061, chống lặp theo `visitRef` (trong `onceFlags`, data-model §2.2) và hiệu ứng rung trong `src/shared/mascot/rules.ts`
- [X] T040 [US2] Trong `src/modules/m02/content/ScanContent.tsx` (+ `ScanContent.module.css`): đặt `<MascotSlot id="content-toast" modes={['AVATAR']} />` sát toast; phát `m02.scan.resolved` (từ `scan`) và, khi `scan.visitCreated`, `m02.visit.recorded { sessionRef, visitRef, k, n, isFinal }` với `k` từ `useSessionVisits` hiện có, `n` từ `journeyCheckpoints`, `visitRef` từ (phiên, điểm dừng, `checkedInAt`) của `scan.visit` — sau khi đã render, không chờ; không đổi router state của M02
- [X] T041 [P] [US2] Trong `src/modules/m02/end/FinalPrompt.tsx` (+ `FinalPrompt.module.css`): `<MascotFigure pose="cheer" />` ở đầu dialog; phát `app.dialog.changed { kind: 'FINAL_PROMPT' }`, `m02.finalPrompt.opened` / `continued` / `ended`; focus và nút như cũ
- [X] T042 [US2] Trong `src/modules/m02/session/TripPage.tsx` (+ `TripPage.module.css`): đặt `<MascotSlot id="trip-dock" modes={['DOCK']} />` cùng hàng nút Quét QR; phát `m02.trip.entered { kind, hasSession, k, n }` và `m02.trip.shown`; `<MascotFigure pose="confused" />` cạnh thông báo REJECTED/FREE (MAS-B-031)

**Checkpoint**: US2 kiểm độc lập; T026 vẫn PASS với slot mới.

---

## Phase 6: User Story 4 - Kết thúc chuyến cùng Mila — US-MAS-08 (Priority: P1) 🎯 Pilot

**Goal**: Ăn mừng một lần ngay sau khi kết thúc; hình tĩnh cạnh huy hiệu; nói đúng về trạng thái gửi.

**Independent Test**: quickstart Q12 và trạng thái gửi.

### Tests for User Story 4 ⚠️

- [X] T043 [P] [US4] Thêm vào `src/shared/mascot/rules.test.ts`: MAS-B-062 (chỉ khi `justEnded` và `HOAN_TAT`, ≤ 2 400 ms, chạm kết thúc), 063 (mở lại → tĩnh), 070 (`PENDING` + offline), 071 (`PENDING → SYNCED` → `AN-THUMB`, không chữ "đã gửi"), 072 (`CONFLICT` → chỉ figure, không CTA)
- [X] T044 [P] [US4] Viết `e2e/m02/mascot-end.spec.ts`: Q12 (CELEBRATE rồi tĩnh; reload chỉ tĩnh; huy hiệu và nội dung màn như ảnh mẫu 2026-11-11), kết thúc khi offline → MSG-MAS-070, `CONFLICT` (giả lập 409 như V25 hiện có) → không nút thử lại

### Implementation for User Story 4

- [X] T045 [US4] Cài MAS-B-062, 063, 070, 071, 072 trong `src/shared/mascot/rules.ts`; lá rơi 12 phần tử dùng `TintIcon name="leaf"` trong `src/app/mascot/Mascot.tsx` / `Mascot.module.css`
- [X] T046 [US4] Trong `src/modules/m02/end/EndPage.tsx` (+ `EndPage.module.css`, skill `frontend-design`): `<MascotSlot id="end-hero" modes={['CELEBRATE','DOCK']} />` cạnh huy hiệu (giữ bố cục đã duyệt); phát `m02.trip.ended { status, k, justEnded }` và `m02.sync.statusChanged { status, online }`; `<MascotFigure pose="confused" />` cạnh banner `CONFLICT`

**Checkpoint (mốc pilot G5)**: US3 + US1 + US2 + US4 xong → người dùng thử trên điện thoại; cờ Production vẫn `off`.

---

## Phase 7: User Story 5 - Mila giúp khi quét khó — US-MAS-03 (Priority: P2)

**Goal**: Hướng dẫn quét lần đầu, nhắc khi scanner mở lâu, giải thích lỗi lặp, báo tra mã chậm.

**Independent Test**: quickstart Q9, Q10.

### Tests for User Story 5 ⚠️

- [ ] T047 [P] [US5] Thêm vào `src/shared/mascot/rules.test.ts` (đồng hồ giả): MAS-B-040 (chưa có lượt ghé hoặc không phiên; một lần mỗi tải trang; đếm từ `cameraStarted`), 041/042/049 (15/30/90 s, mỗi mức một lần mỗi lần mở; hoạt động reset; trang ẩn dừng), 043/044 (BUSY; 3 s), 046/047/048 (streak 2, reset khi kết quả khác hoặc đổi màn), 038 (camera lỗi → chỉ figure)
- [ ] T048 [P] [US5] Viết `e2e/m02/mascot-scanner.spec.ts` (project `m02`, camera giả): Q9 với `page.clock`, Q10 (hai mã sai liên tiếp → MSG-MAS-046, câu `INVALID` cố định còn), bấm "Đóng camera" trong MSG-MAS-049 đóng scanner như nút đóng; thêm một ca vào `e2e/m02/scan-evil.spec.ts` (project `m02-cam-evil`): camera từ chối → `[data-mascot-figure="confused"]` cạnh câu camera cố định

### Implementation for User Story 5

- [ ] T049 [US5] Cài MAS-B-038, 040…044, 046…049 và hẹn giờ scanner trong `src/shared/mascot/rules.ts` / `machine.ts`
- [ ] T050 [US5] Trong `src/modules/m02/scanner/QrScanner.tsx` (+ `QrScanner.module.css`): `<MascotSlot id="scanner-bottom" modes={['AVATAR']} onCta={...} />` ở dải dưới khung (CTA "Đóng camera" gọi đúng `onClose` hiện có); phát `m02.scanner.cameraStarted` khi `decodeFromConstraints` resolve và `m02.scanner.cameraFailed` khi `setCameraFailed(true)`; `<MascotFigure pose="confused" />` trong panel camera lỗi
- [ ] T051 [US5] Trong `src/modules/m02/session/TripPage.tsx`: phát `m02.scanner.opened/closed` theo `setScanning`, `m02.scanner.detected` đầu `handleText`, `m02.scan.resolved` cho kết quả ở lại màn; trong `src/modules/m02/content/ScanNotice.tsx`: `<MascotFigure pose="confused" />` cho `INVALID`, `CONNECTION_NEEDED` (không cho `CLOSED`)

**Checkpoint**: US5 kiểm độc lập; T026 vẫn PASS (slot scanner không giao khung).

---

## Phase 8: User Story 6 - Bình tĩnh về mạng và dữ liệu — US-MAS-04 (Priority: P2)

**Goal**: Báo mất/có sóng đúng, trấn an khi dùng nội dung đã tải, nói rõ mã ngoài hành trình.

**Independent Test**: quickstart Q11 và mã ngoài hành trình.

### Tests for User Story 6 ⚠️

- [ ] T052 [P] [US6] Thêm vào `src/shared/mascot/rules.test.ts`: MAS-B-074 (chỉ khi `hasSession`, cooldown 10 phút), 075 (chỉ sau 074 trong 30 phút, P7), 054 (PACKAGE; bị bỏ nếu P4 đang hiện), 052 (LIVE, có phiên, `inJourney = false`, không lượt ghé; không cho khách tự do)
- [ ] T053 [P] [US6] Viết `e2e/m02/mascot-network.spec.ts`: Q11 (`context.setOffline(true)` giữa chuyến → MSG-MAS-074 một lần; quét mã trong tuyến có gói → MSG-MAS-054), mã `VALID` ngoài hành trình (lookup giả) → MSG-MAS-052, không lượt ghé mới; SC-MAS-007: khi offline (sau lần mở đầu), đi qua lần lượt slot `trip-dock`, `scanner-bottom`, `content-toast`, `end-hero` và các `MascotFigure` của M02, khẳng định mỗi ảnh mascot đã tải xong (`img.complete && naturalWidth > 0`, hoặc hình giữ chỗ CSS khi chưa có ảnh) và bong bóng có chữ

### Implementation for User Story 6

- [ ] T054 [US6] Cài MAS-B-052, 054, 074, 075 trong `src/shared/mascot/rules.ts`; host giữ `hasSession` từ payload M02 (research R-15)
- [ ] T055 [US6] Bổ sung payload `inJourney` (= có phiên, `display.kind = 'LIVE'`, `visit` null) và `hasSession` cho `m02.scan.resolved` trong `src/modules/m02/content/ScanContent.tsx` (không đổi logic hiển thị)

**Checkpoint**: US6 kiểm độc lập.

---

## Phase 9: User Story 7 - Chuẩn bị cùng Mila — US-MAS-07 (Priority: P2)

**Goal**: Phản hồi ở danh mục, gợi ý tuyến, chi tiết tuyến, gói tải trước.

**Independent Test**: quickstart Q15 và các ca gợi ý, nhắc an toàn, gợi ý danh mục.

### Tests for User Story 7 ⚠️

- [ ] T056 [P] [US7] Thêm vào `src/shared/mascot/rules.test.ts`: MAS-B-005 (> 600 ms), 008 (20 s, chưa cuộn/mở, một lần), 010, 011 (số ít/nhiều EN), 012/013 (streak rỗng), 014 (có cảnh báo an toàn, một lần mỗi tuyến), 020, 021, 022, 024, 025, 026 (lần 2 cùng tuyến khi online), không có phần trăm trong mọi câu gói
- [ ] T057 [P] [US7] Viết `e2e/m01/mascot-prepare.spec.ts`: tải gói thành công (MSG-MAS-020 → 021), lỗi lưu trữ bằng hook `failNextActivation` hiện có (MSG-MAS-025), lỗi hai lần (MSG-MAS-026); gợi ý có kết quả (MSG-MAS-011) và hai lần rỗng (MSG-MAS-013 + "Xem tất cả tuyến" điều hướng `/`); chi tiết tuyến có cảnh báo an toàn → MSG-MAS-014 khi cuộn tới panel Bắt đầu, Mila không nằm trong khối cảnh báo; danh mục 20 s → MSG-MAS-008 + "Gợi ý tuyến" điều hướng `/recommend`

### Implementation for User Story 7

- [ ] T058 [US7] Cài MAS-B-005…008, 010…016, 020…026 trong `src/shared/mascot/rules.ts`; CTA điều hướng qua `navigate` của host tới `PATHS.recommend` / `PATHS.catalog`
- [ ] T059 [P] [US7] `src/modules/m01/recommendation/RecommendPage.tsx` (+ `.module.css`): `<MascotSlot id="recommend-head" modes={['AVATAR']} />`; phát `m01.recommend.opened` / `resolved { count }`; `<MascotFigure pose="think" />` cạnh câu không có kết quả
- [ ] T060 [P] [US7] `src/modules/m01/route-detail/StartPanel.tsx`, `OfflineDecisionDialog.tsx` (+ `.module.css`): `<MascotSlot id="start-panel" modes={['AVATAR']} />` phía trên nút Bắt đầu; IntersectionObserver phát `m01.routeDetail.startPanelVisible { routeRef, hasSafetyWarning }` lần đầu; `<MascotFigure pose="confused" />` cạnh lỗi Start; `<MascotFigure pose="backpack" />` đầu dialog quyết định offline
- [ ] T061 [P] [US7] `src/modules/m01/route-detail/PackagePanel.tsx`, `src/modules/m01/offline-package/OfflinePage.tsx` (+ `.module.css`): `<MascotSlot id="package-panel" modes={['AVATAR']} />`; phát `m01.package.downloadStarted` trước `await` và `m01.package.resolved { kind, reason, update, online }` sau `await` của thao tác gói; `<MascotFigure pose="confused" />` cạnh "Chưa cập nhật được…", `<MascotFigure pose="rest" />` cạnh "Bạn chưa tải tuyến nào."
- [ ] T062 [P] [US7] `src/modules/m01/catalog/CatalogPage.tsx`: phát `slow` khi `loading` > 600 ms; `<MascotFigure pose="rest" />` cạnh câu danh mục rỗng, `<MascotFigure pose="confused" />` cạnh câu lỗi nguồn

**Checkpoint**: US7 kiểm độc lập; T026 (M01) vẫn PASS.

---

## Phase 10: User Story 8 - Hỏi Mila và lời nhắc thiên nhiên — US-MAS-06 (Priority: P3)

**Goal**: Chạm hỏi một câu mỗi màn; nhắc cất máy và ứng xử với thiên nhiên; chào khi bắt đầu và khi mở lại giữa chuyến.

**Independent Test**: quickstart Q16 và quay lại hành trình sau lượt ghé mới.

### Tests for User Story 8 ⚠️

- [X] T063 [P] [US8] Thêm vào `src/shared/mascot/rules.test.ts`: chạm theo ngữ cảnh v1.1 (BR-MAS-12) — MAS-B-009 → 012 khi chạm lại ở M01, 032 (k = 0), 036 → 033 với {r} = n − k, 037 → 043 khi scanner mở, 059, 065; P3, không cooldown khi chạm, không tính vào BR-MAS-07; không có ở INLINE/CELEBRATE; 030 (phiên mới), 034 (ẩn ≥ 10 phút + có phiên, không khi có thông báo tự kết thúc), 056/057 (luân phiên; `NATURE_REMINDERS_APPROVED = false` → chỉ 056; pool 057a–e xoay tất định; giới hạn chủ động)
- [X] T064 [P] [US8] Viết `e2e/m02/mascot-companion.spec.ts` và một ca trong `e2e/m01/mascot-intro.spec.ts`: Q16/Q21 (chạm Mila ở danh mục hai lần → 009, 012; chuyến đi chưa quét → 032; sau khi quét 1/3 → 033 "Còn 2 điểm nữa…"; scanner mở → 043; nội dung → 059; màn kết quả → 065), quay về hành trình sau lượt ghé mới → MSG-MAS-056, bắt đầu chuyến → MSG-MAS-030

### Implementation for User Story 8

- [X] T065 [US8] Cài MAS-B-009, 030, 032, 034, 036, 037, 056, 057, 059, 065 trong `src/shared/mascot/rules.ts` (chạm theo ngữ cảnh v1.1: `screen:k`, `screen:n` từ `m02.trip.shown`, `scannerOpen`, `helpCursor` — research R-22); thêm MSG-MAS-012, 033, 043, 065 vào catalog VI/EN; host xử lý `mascot.user.tapped` và tính thời gian ẩn cho 034
- [X] T066 [US8] Trong `src/modules/m02/content/ScanContent.tsx`: thêm `onClick` vào `<Link to={PATHS.m02SessionEntry}>` "Quay lại" hiện có, phát `m02.content.backPressed { afterNewVisit }` (`afterNewVisit` = `scan.visitCreated` và không phải điểm cuối); link vẫn điều hướng như cũ, không thêm router state hay dữ liệu lưu. Host giữ cờ này để `m02.trip.shown` kế tiếp kích hoạt MAS-B-056/057 (contracts/mascot-event-contract.md §3)

**Checkpoint**: Tất cả story xong; T026 PASS trên mọi màn.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [X] T067 [P] Viết `e2e/m01/mascot-precache.spec.ts`: tải `/sw.js` của `preview:e2e`, khẳng định có chunk `mascot` và (khi có ảnh) chỉ `ma-*-240-*.webp` cùng `ma-11-avatar-96-*.webp`, không `-480-`, không `-192-`, không `.jpg` (MAS-TC-062, 090)
- [ ] T068 [P] Chạy `VITE_FEATURE_MASCOT=off npx vitest run` và một test component `src/app/App.mascot.test.tsx` khẳng định cờ off không `import()` host và không có `[data-mascot-slot]` có nội dung (Q17, MAS-TC-045)
- [ ] T069 Rà toàn bộ bằng skill `frontend-design` trên `dev:fake` ở 320/390 px: bong bóng, DOCK, INTRO, CELEBRATE đúng design-system §9; không đổi bố cục đã duyệt của SCR-M02-001/002/003
- [X] T070 **(Chặn bởi OD-MAS-06, 07 — đã giao và xác nhận 2026-11-22)** Khi người dùng giao PNG gốc vào `assets/mascot/source/` và xác nhận quyền: xuất `assets/mascot/web/ma-*-{240,480}.webp` (avatar 96/192) bằng công cụ chạy ngoài repo, không thêm dependency; đo dung lượng từng tệp và tổng precache so với MAS-NFR-01; kiểm viền alpha; ghi số đo vào validation report
- [ ] T071 [P] Cập nhật bộ thiết kế stale: `docs/mascot/MASCOT_TECHNICAL_SPECIFICATION.md` §2, §5 (`MascotSlot`/`MascotFigure` ở `src/shared/mascot/`), `docs/mascot/MASCOT_ASSET_SPECIFICATION.md` §3 (mẫu precache `assets/ma-*-240-*.webp`)
- [ ] T072 Chạy `npm run ci`, `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil`, `git diff --check`; hoàn tất `specs/005-visitor-mascot/validation-report.md` (lệnh đã chạy, kết quả, lệch so với tasks; thiết bị thật, TalkBack/VoiceOver, Lighthouse ghi `NOT RUN` nếu chưa chạy)

---

## Phase 12: v1.1 — Bong bóng "Giấy dã ngoại", chữ hiện dần, cỡ mới (US9)

**Goal**: Mila lớn hơn và bong bóng là lời của nhân vật (nhận xét thử trên điện thoại 2026-11-22; design-system §9.2, §9.3).

**Independent Test**: quickstart Q26; ảnh chụp 320/390/430 px.

### Tests ⚠️

- [X] T075 [P] [US9] Thêm vào `src/app/mascot/Mascot.test.tsx`: bong bóng có dòng tên "Mila" (`aria-hidden`), nút "Đóng lời nhắn"; chữ hiện dần theo `MASCOT_TYPE_CPS` (đồng hồ giả + `requestAnimationFrame` giả); chạm bong bóng hiện hết; `motion` off hoặc giảm chuyển động → hiện ngay; bản đầy đủ `.visually-hidden` giữ `lang`/`role` (R-20)
- [X] T076 [P] [US9] Thêm vào `src/shared/mascot/machine.test.ts`: `expiresAt` cộng thời gian gõ khi `ctx.typing` bật, không cộng khi tắt (R-20)
- [X] T077 [P] [US9] Cập nhật `e2e/m01/mascot-layout.spec.ts`, `e2e/m02/mascot-layout.spec.ts`: đo cỡ hình DOCK 112 / 128 / 104 px, AVATAR 56 px, CELEBRATE 200 px; không đè, không cuộn ngang ở 320–430 px với bong bóng kiểu A (MAS-TC-121)

### Implementation

- [X] T078 [US9] `src/shared/ui/tokens.css`: `--mascot-size-sm` 56px, `--mascot-size-dock-catalog/-trip/-end`, `--mascot-size-xl`, `--mascot-bubble-max-width` 240px, `--mascot-bubble-surface`, thời lượng mới (contracts/mascot-ui-contract.md §4); lint token PASS
- [X] T079 [US9] `src/shared/mascot/MascotSlot.tsx` (+ CSS): prop `size` → `data-mascot-dock`; truyền `size` ở `CatalogPage.tsx` (`catalog`), `TripPage.tsx` (`trip`), `EndPage.tsx` (`end`). Sửa hình đồi trang trí lộ sau bong bóng ở hero danh mục (`CatalogPage.module.css`, chỉ CSS)
- [X] T080 [US9] `src/app/mascot/Mascot.tsx` + `Mascot.module.css` + hook `useTypewriter` (skill `frontend-design`): bong bóng kiểu A theo design-system §9.3, đuôi và góc 6px theo `data-mascot-tail`; ảnh DOCK lớn dùng `srcSet` 480; engine `expiresAt` theo R-20 (`StepContext.typing`)

**Checkpoint**: T026/T077 PASS; ảnh chụp đưa chủ dự án duyệt.

---

## Phase 13: v1.1 — Công tắc "Chuyển động" và cử chỉ tự động (US9)

**Goal**: Mila sống động giữa các sự kiện mà vẫn tạm dừng được (BR-MAS-21; WCAG 2.2.2).

**Independent Test**: quickstart Q18, Q19, Q20.

### Tests ⚠️

- [X] T081 [P] [US9] Thêm vào `src/shared/mascot/rules.test.ts`: MAS-B-086 — lịch 8–15 s với `ctx.random` cố định; chỉ ở SCR-M01-001, SCR-M02-001 (scanner đóng), SCR-M02-003; không khi có bong bóng, blocker, motion off, trong grace; không lặp cử chỉ liền nhau; cử chỉ đổi tư thế quay về tư thế ngữ cảnh; không tính vào BR-MAS-07; `mascot.motion.changed { on: false }` hủy lịch (R-18)
- [X] T082 [P] [US9] Viết `src/shared/mascot/MascotMotionToggle.test.tsx` và `motion.test.ts`: `aria-pressed`, tên truy cập, chữ bật/tắt; khởi đầu `off` khi giảm chuyển động; không render khi cờ tắt; không ghi `localStorage` (R-17)
- [X] T083 [P] [US9] Viết `e2e/m01/mascot-motion.spec.ts`: công tắc có ở header M01 và M02; tắt → `getAnimations()` của Mila rỗng, Mila vẫn hiện (SC-MAS-011); có ít nhất một cử chỉ trong 16 s ở danh mục (quan sát `data-mascot-animation`); mọi animation của phản ứng có `endTime` ≤ 5 000 ms (SC-MAS-014)

### Implementation

- [X] T084 [US9] `src/shared/mascot/motion.ts`, `MascotMotionToggle.tsx` (+ CSS), export ở `index.ts`; icon mới `assets/icons/pause.svg`, `assets/icons/play.svg` theo design-system §7
- [X] T085 [US9] Engine: sự kiện `mascot.motion.changed`, hẹn giờ `ambient`, `StepContext.random`, nhóm cử chỉ (nhìn ống nhòm, vẫy, nhún, nghiêng đầu, kéo quai ba lô, thở) trong `rules.ts`/`machine.ts`; animation CSS mới và số vòng lặp ≤ 5 s (R-25); host đọc `useMotion()`
- [X] T086 [US9] Đặt `<MascotMotionToggle />` trong header `src/modules/m01/layout/VisitorLayout.tsx` và `src/modules/m02/layout/FieldLayout.tsx` (chỉ thêm phần tử; không đổi hành vi header)

**Checkpoint**: T083 PASS; toàn bộ E2E hiện có PASS (công tắc không đè VI/EN ở 320 px).

---

## Phase 14: v1.1 — Chạm nhiều lần (US8)

**Goal**: BR-MAS-22. Đi cùng hoặc sau Phase 10 (chạm theo ngữ cảnh).

### Tests ⚠️

- [X] T087 [P] [US8] Thêm vào `src/shared/mascot/rules.test.ts`: MAS-B-089 (chạm trong 400 ms bỏ qua; animation đang chạy không chạy lại), chạm khi đang có câu hướng dẫn → câu kế tiếp (danh mục) hoặc chỉ nhún (màn một câu), MAS-B-085 (5 lần / 3 s → 085 với tư thế `confused` và animation `dizzy`, một lần mỗi lần tải trang) — quickstart Q22

### Implementation

- [X] T088 [US8] Cài `lastTapAt`, `tapLog`, cờ `once` `DIZZY` trong engine; animation `dizzy` trong `Mascot.module.css`; MSG-MAS-085 vào catalog

---

## Phase 15: v1.1 — Ba cấp ăn mừng (US2, US4)

**Goal**: BR-MAS-23.

### Tests ⚠️

- [ ] T089 [P] [US2] Thêm vào `src/shared/mascot/rules.test.ts`: cấp 1 `success` + 050; cấp 2 `milestone` + 051 / 055 (n ≥ 4) / 058 (k = n − 1, n ≥ 3) theo thứ tự ưu tiên đầu tiên > nửa > còn 1; điểm cuối vẫn chỉ rung
- [ ] T090 [P] [US4] Thêm vào `src/shared/mascot/rules.test.ts` và `e2e/m02/mascot-end.spec.ts`: `m02.trip.ended` có `n`; k = n → MAS-B-064 / MSG-MAS-063, k < n → 062 (quickstart Q23, Q24)

### Implementation

- [ ] T091 [US2] Luật MAS-B-050, 051, 055, 066 với animation `success` / `milestone` (6 lá FX-01); MSG-MAS-058 vào catalog
- [ ] T092 [US4] `EndPage.tsx` phát thêm `n` (số điểm của hành trình); luật MAS-B-064; MSG-MAS-063 vào catalog

---

## Phase 16: v1.1 — Ngữ cảnh "đang thao tác" (US3)

**Goal**: BR-MAS-20.

### Tests ⚠️

- [ ] T093 [P] [US3] Thêm vào `src/shared/mascot/machine.test.ts`: `app.user.activity` → ý định `source` `timer`/`ambient` trong 2 s bị bỏ, ý định `user`/`event` vẫn chạy; trang đọc bài không có cử chỉ tự động; media bắt đầu → bong bóng đóng ngay (MAS-TC-115) — quickstart Q25

### Implementation

- [ ] T094 [US3] Host: listener `pointerdown`/`keydown`/`scroll` (capture, passive, gộp 250 ms) → `app.user.activity`; trọng tài theo `source` (R-19)

---

## Phase 17: v1.1 — Chớp mắt (US9) — **chặn bởi ảnh MA-20 của chủ dự án**

### Tests ⚠️

- [ ] T095 [P] [US9] Thêm vào `src/shared/mascot/assets.test.ts` và `rules.test.ts`: `blinkAsset(pose)`; cử chỉ `blink` chỉ có khi tư thế hiện tại có ảnh mắt nhắm (MAS-TC-122)

### Implementation

- [ ] T096 [US9] Khi có ảnh: kiểm ảnh mắt nhắm so với ảnh gốc từng điểm ảnh, xuất `ma-20-*-blink-240.webp` (và ảnh đợt 2: think, magnifier, point) như T070; `blinkAsset` trong `assets.ts`; host đổi `src` 120 ms (R-24); ghi số đo vào validation report

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: không phụ thuộc; T001–T005 song song.
- **Foundational (Phase 2)**: sau Setup; chặn mọi story. Test T006–T012 song song, viết trước T013–T022.
- **US3 (Phase 3)**: sau Foundational; đi trước các story khác (luật an toàn và test bố cục dùng chung).
- **US1, US2, US4 (Phase 4–6)**: sau US3; có thể song song giữa các story (khác tệp), trừ các task cùng tệp làm tuần tự: `TripPage.tsx` (T042, T051), `ScanContent.tsx` (T040, T055, T066).
- **T073, T074** (thêm sau analyze): thuộc Phase 2, chạy cùng nhóm test T006–T012; T074 mở rộng khi thêm slot ở mỗi story.
- **US5, US6 (Phase 7–8)**: sau US3; US6 dùng payload `m02.scan.resolved` mà US2 (T040) thêm.
- **US7 (Phase 9)**: sau US3 và US1 (dùng slot `catalog-hero` của T035).
- **US8 (Phase 10)**: sau US2 (slot `trip-dock`, `content-toast`) và US1.
- **Polish (Phase 11)**: sau các story cần giao; T070 chờ người dùng.
- **v1.1 (Phase 12–17)**: sau pilot (Phase 1–6). Phase 12 trước (nền giao diện cho mọi phase sau). Phase 13 sau 12. Phase 14 cùng hoặc sau Phase 10 (chạm theo ngữ cảnh T063–T065). Phase 15 sau US2/US4. Phase 16 sau 13 (dùng `source: ambient`). Phase 17 chờ ảnh MA-20. Cùng tệp làm tuần tự: `rules.ts`, `machine.ts`, `Mascot.tsx`.

### User Story Dependencies

- US3: Foundational.
- US1: US3.
- US2: US3.
- US4: US3.
- US5: US3; cùng tệp `TripPage.tsx` với US2.
- US6: US2 (T040).
- US7: US1 (T035).
- US8: US1, US2.
- US9 (v1.1): pilot; Phase 12 → 13 → 16; Phase 17 chờ ảnh.

### Within Each User Story

Test (FAIL) → luật trong `rules.ts` → điểm phát/slot/figure trong module → E2E PASS → checkpoint chạy lại T026.

---

## Parallel Example

```text
# Foundational — test viết song song:
T006 architecture.test.ts | T007 events.test.ts | T008 arbiter.test.ts | T009 catalog.test.ts
T010 machine.test.ts | T011 MascotSlot/MascotFigure tests | T012 MascotHost.test.tsx

# US7 — điểm phát ở các tệp khác nhau:
T059 RecommendPage.tsx | T060 StartPanel.tsx + OfflineDecisionDialog.tsx | T061 PackagePanel.tsx + OfflinePage.tsx | T062 CatalogPage.tsx
```

---

## Implementation Strategy

### Pilot trước (G5)

1. Phase 1–2 (nền), Phase 3 (US3 tránh đường).
2. Phase 4–6 (US1, US2, US4): ba khoảnh khắc pilot.
3. **Dừng và kiểm**: quickstart Q1–Q8, Q12–Q14 với cờ `on` ở `dev:fake`/`e2e`; người dùng thử trên điện thoại. Production cờ vẫn `off`.

### Giao dần

- G6: US5, US6 (M02 đầy đủ).
- G7: US7 (M01).
- G8: US8 (chạm hỏi, nhắc thiên nhiên — câu nhắc chỉ bật khi Ban Quản lý duyệt, đổi `NATURE_REMINDERS_APPROVED`).
- G8b (v1.1, theo thứ tự đã chốt với chủ dự án 2026-11-22): Phase 12 (bong bóng, cỡ) → 13 (công tắc, cử chỉ) → 10 + 14 (chạm) → 15 (ba cấp) → 16 (đang thao tác) → 17 (chớp mắt, khi có ảnh). Thử lại trên điện thoại sau Phase 13.
- G9: T070 khi có ảnh; kiểm thực địa; bật cờ Production.

## Notes

- Mỗi phase một branch và một PR, như các gói trước; không commit/push khi người dùng chưa yêu cầu.
- Test FAIL trước khi cài; ghi bằng chứng vào validation report.
- Không sửa test hiện có để "cho qua"; chỉ **thêm** ca (T048 thêm vào `scan-evil.spec.ts`).
- Không đưa ảnh nhân vật vào repo trước T070.
