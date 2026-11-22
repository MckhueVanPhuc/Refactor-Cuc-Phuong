# Research — 005 Mascot Mila

**Package**: `specs/005-visitor-mascot/` · **Date**: 2026-11-21; bổ sung R-17…R-25 ngày 2026-11-22 · **Spec**: [spec.md](spec.md) (dẫn xuất spec-Mascot v1.1)

Mỗi mục: **Decision** / **Rationale** / **Alternatives considered**. Nguồn kỹ thuật đầu vào: [Technical spec](../../docs/mascot/MASCOT_TECHNICAL_SPECIFICATION.md), [State Machine](../../docs/mascot/MASCOT_STATE_MACHINE.md), [Asset spec](../../docs/mascot/MASCOT_ASSET_SPECIFICATION.md). Spec canonical không có `NEEDS CLARIFICATION` (clarify 2026-11-21: 0 câu hỏi); các mục dưới đây là quyết định kỹ thuật.

## R-01 — Không thêm dependency

- **Decision**: Event bus, máy trạng thái, hàng đợi, cooldown, hẹn giờ và animation đều tự viết bằng TypeScript + CSS. Không thêm gói npm nào, kể cả dev dependency.
- **Rationale**: tech-stack §12 và plan M01/M02 Constitution VII cấm dependency runtime ngoài danh sách đã chọn; logic nhỏ (ước tính < 12 KB gzip, MAS-NFR-02); pure reducer test dễ bằng Vitest có sẵn.
- **Alternatives**: XState (dependency mới, nặng hơn nhu cầu); `mitt` (dependency cho ~20 dòng code); Lottie/Rive (cần vẽ lại vector, runtime lớn — để G12 theo Asset spec §2.1); `canvas-confetti` (thay bằng 12 phần tử CSS dùng lại `leaf.svg`).

## R-02 — Vị trí code và ranh giới module

- **Decision**:
  - `src/shared/mascot/` — engine thuần (sự kiện, reducer, luật, trọng tài ưu tiên, hẹn giờ, catalog lời thoại, registry ảnh) **và** hai component dùng chung không chứa logic: `MascotSlot` (khai báo chỗ) và `MascotFigure` (ảnh tĩnh cho INLINE). Không import `src/modules/**` hay `src/app/**`.
  - `src/app/mascot/` — `MascotHost` (React) gắn một lần trong `App.tsx`: đăng ký bus, chạy reducer, render DOCK/AVATAR/INTRO/CELEBRATE vào slot đang hoạt động bằng portal; đọc ngôn ngữ qua public API M01 (`src/modules/m01/index.ts`: `useLanguagePreference`, `resolveDisplayLanguage`).
  - `src/modules/m01/**`, `src/modules/m02/**` chỉ import `src/shared/mascot/` (emit + slot + figure). M02 vẫn chỉ import M01 qua `m01Port.ts`.
- **Rationale**: `src/shared/ui/` đã chứa component React dùng chung, nên shared có React là quy ước hiện có. Đặt slot ở shared tránh để module import `src/app/` (app đã import route của module → vòng phụ thuộc). Host ở app vì cần cả ngôn ngữ (M01) lẫn đường dẫn router.
- **Alternatives**: host trong M02 (M01 không dùng được); một context React bọc toàn app (khó dùng cho portal vào layout của từng module, và buộc module import app).

## R-03 — Phát sự kiện

- **Decision**: `emitMascotEvent(event)` đồng bộ trả `void`; bên trong `queueMicrotask` gọi từng listener trong `try/catch`. Không trả promise, không ném lỗi. Khi cờ tắt hoặc host chưa mount → no-op (sự kiện bị bỏ, không xếp hàng). Điểm phát đặt **sau** khi việc nghiệp vụ hoàn tất: trong effect của component đã có kết quả, hoặc ngay sau `await` của thao tác. Payload chỉ chứa giá trị enum có sẵn và số đếm; không nội dung bài, không id thiết bị.
- **Rationale**: BR-MAS-01, 16, 18; SC-MAS-001 (không đổi thứ tự ghi dữ liệu, không thêm độ trễ). StrictMode chạy effect hai lần ở dev → trọng tài bỏ sự kiện trùng trong 500 ms (BR-MAS-06).
- **Alternatives**: `CustomEvent` trên `window` (khó định kiểu, rò sang mã khác); React context callback (bắt module biết React tree của host).

## R-04 — Máy trạng thái thuần

- **Decision**: `step(state, input, ctx, now) → { state, effects }`; `input` là sự kiện hoặc tín hiệu nội bộ (`timer.fired`, `bubble.expired`, `animation.ended`, `user.tapped`, `user.closedBubble`). `effects` là danh sách lệnh cho host: `show`, `hide`, `setPose`, `playAnimation`, `showBubble`, `clearBubble`, `setTimer`, `clearTimer`, `vibrate`. Thời gian truyền vào (`now`), không gọi `Date.now()` trong reducer. Pool câu xoay vòng bằng bộ đếm trong state. Bảng luật (`rules.ts`) là dữ liệu, mỗi dòng mang ID `MAS-B-xxx` của Behavior Matrix.
- **Rationale**: tất định → test bảng bằng Vitest không cần DOM (MAS-TC-001…012); đổi renderer sau này không đụng logic (Technical spec §11).
- **Alternatives**: logic trong component React (khó test thời gian, dễ rò hẹn giờ).

## R-05 — Trọng tài ưu tiên và giới hạn

- **Decision**: lớp P0–P7 theo BR-MAS-05; một bong bóng; hàng đợi tối đa 1 mục, TTL `MASCOT_QUEUE_TTL_MS`; P5–P7 không xếp hàng; cooldown theo `messageId` (Map trong bộ nhớ); giới hạn câu chủ động P5–P7 bằng danh sách mốc thời gian trượt `MASCOT_PROACTIVE_WINDOW_MIN`. Ngữ cảnh chặn (media, dialog, trang ẩn) chỉ cho P0–P1. P4 vừa phát ở màn cũ được mang sang màn mới nếu màn mới có slot AVATAR/DOCK (lượt ghé mới → điều hướng sang nội dung).
- **Rationale**: spec-Mascot BR-MAS-05…08; State Machine §5.2.
- **Alternatives**: hàng đợi dài (gây nói dồn, trái P1 của Brief).

## R-06 — Ngôn ngữ và catalog

- **Decision**: `src/shared/mascot/dialogue/vi.ts`, `en.ts` theo mẫu i18n hiện có (`export const vi = {...}`, `en: typeof vi`); khóa là `MSG-MAS-nnn`; câu có tham số là hàm. Metadata không phụ thuộc ngôn ngữ (P, cooldown, CTA, tự ẩn) ở `catalog.ts`. Chữ chép nguyên văn từ bảng copy screen spec (đã đồng bộ với spec-Mascot §5.6). Catalog mascot chứa luôn nhãn CTA ("Gợi ý tuyến", "Xem tất cả tuyến", "Đóng camera", "Chưa") để shared không import module; một test so các nhãn này với i18n của M01/M02 để không lệch. Ngôn ngữ: host dùng `resolveDisplayLanguage(useLanguagePreference(), navigator.language)` như M02.
- **Rationale**: không thêm thư viện i18n (plan M01 R-12); ranh giới R-02.
- **Alternatives**: host import i18n của M01/M02 (app import module là hợp lệ, nhưng bong bóng cần cả nhãn M01 lẫn M02 → host phụ thuộc chi tiết i18n hai module; test so chuỗi rẻ hơn).

## R-07 — Slot và portal

- **Decision**: `MascotSlot` render một phần tử giữ chỗ (kích thước theo token của mode) và đăng ký `{ id, modes, element }` vào registry trong `src/shared/mascot/slots.ts` (store + `useSyncExternalStore`). Host chọn slot đang hiện phù hợp với mode cần dùng và `createPortal` vào đó. **INLINE không qua host**: màn render trực tiếp `<MascotFigure pose="confused" />` cạnh câu cố định (ảnh tĩnh, không bong bóng, không logic) — đơn giản và không phụ thuộc thứ tự sự kiện. Slot scanner nằm trong overlay `QrScanner` ở dải dưới khung.
- **Rationale**: SC-MAS-002 (slot chiếm chỗ thật nên không đè); cùng cơ chế với `FieldNotice` hiện có; INLINE tĩnh giảm sự kiện cần phát.
- **Alternatives**: phần tử `position: fixed` toàn cục (dễ đè nút, vi phạm BR-MAS-11).

## R-08 — Ảnh và ảnh tạm

- **Decision**: `assets/mascot/web/ma-<nn>-<name>-{240,480}.webp` import qua Vite (URL băm). Registry `poseId → { src240, src480 }`. `<img srcset>` 240w/480w, `sizes` theo token mode, `alt=""`, `decoding="async"`; nếu ảnh 480 lỗi (offline, chưa cache) thì đổi về 240 không `srcset`; 240 lỗi → `HIDDEN` (BR-MAS-15). **Khi chưa có ảnh production** (G2): registry dùng hình giữ chỗ dựng bằng CSS (đĩa tròn màu token, không phải nhân vật) — không agent nào vẽ nhân vật (AGENTS.md §4); hình giữ chỗ chỉ để kiểm hành vi ở `dev:fake`/`e2e`. Production chỉ bật cờ khi có ảnh thật (OD-MAS-06, 07).
- **Rationale**: Asset spec §2–§4; AGENTS.md §4 (ảnh do người dùng cung cấp).
- **Alternatives**: cắt ảnh từ concept sheet (chất lượng kém, viền lỗi, chưa xác nhận quyền).

## R-09 — Precache

- **Decision**: thêm vào `workbox.globPatterns` hai mẫu hẹp `assets/ma-*-240-*.webp` (cỡ 240) và `assets/ma-11-avatar-96-*.webp` (avatar chỉ có cỡ 96/192, dùng ở AVATAR khi quét ngoài thực địa); cỡ 480 và avatar 192 không precache. JS của engine/host nằm trong `**/*.js` đã có. Đặt tên chunk `mascot` bằng một nhánh mới trong `chunkPrefix` cho `src/shared/mascot/` và `src/app/mascot/`.
- **Rationale**: MAS-NFR-01 (ngân sách precache); ảnh nền JPG không bị kéo vào; Constitution VI.
- **Alternatives**: thêm `webp` vào mẫu chung (kéo mọi webp tương lai vào precache).

## R-10 — Animation, token, giảm chuyển động

- **Decision**: lớp CSS `AN-*` trong `src/app/mascot/Mascot.module.css` và `src/shared/mascot/MascotFigure.module.css`; mọi kích thước/thời lượng là token mới trong `tokens.css` (`--mascot-size-sm/md/lg`, `--mascot-bubble-max-width`, `--duration-mascot-*`), có giá trị 0 trong khối `prefers-reduced-motion` sẵn có. Vòng lặp (`AN-BREATHE`, `AN-SEARCH`, `AN-PACK`) dùng `animation-iteration-count` hữu hạn tương đương ≤ 10 s. Lá rơi: 12 phần tử dùng `TintIcon name="leaf"`. Host đọc `matchMedia('(prefers-reduced-motion: reduce)')` để bỏ rung và lá rơi.
- **Rationale**: design-system §4.3, §9; lint token (`tokens.lint.test.ts`) cấm px/màu ngoài `tokens.css`; BR-MAS-17.
- **Alternatives**: Web Animations API trong JS (khó lint token, khó tắt bằng CSS).

## R-11 — Hẹn giờ không hoạt động

- **Decision**: một `setTimeout` duy nhất do host quản lý theo hiệu ứng `setTimer`/`clearTimer`; hoạt động có ý nghĩa (`pointerdown`, `keydown`, `scroll`, `wheel`) chỉ lắng nghe khi scanner mở hoặc trong cửa sổ gợi ý của danh mục; `visibilitychange` ẩn → dừng, hiện → đặt lại từ 0. Hằng trong `src/shared/mascot/config.ts` (giá trị §5.4 của spec, tạm).
- **Rationale**: BR-MAS-08, 09; Constitution VII (không scheduler nền — hẹn giờ chỉ chạy khi trang hiện).
- **Alternatives**: `setInterval` (tốn pin, khó test).

## R-12 — Truy cập

- **Decision**: ảnh `alt=""`; bong bóng là chữ thật có `lang`; chỉ bong bóng P2 có `role="status"`; không `aria-live` cho P4–P7 (toast/banner đã công bố); không gọi `focus()`; nút đóng là `<button>` có tên "Đóng lời nhắn"/"Dismiss message", vùng chạm `--touch-target`; ảnh trong DOCK/AVATAR là `<button aria-label="Hỏi Mila">` để chạm hỏi (BR-MAS-12). Thông báo tạm đóng: host gỡ mascot khỏi DOM.
- **Rationale**: design-system §6, §9.3; Technical spec §7.
- **Alternatives**: `aria-live` cho mọi bong bóng (đọc chồng toast).

## R-13 — Công tắc phát hành

- **Decision**: `VITE_FEATURE_MASCOT` (`on`/`off`), đọc trong `src/shared/config/env.ts` như biến tùy chọn (không bắt buộc, mặc định `off`); `.env.fake` và `.env.e2e` đặt `on`; `.env.example` thêm tên biến. Khi `off`: `emitMascotEvent` no-op, `MascotHost` không được `import()`, `MascotSlot`/`MascotFigure` render rỗng.
- **Rationale**: OD-MAS-15; environment.md (đã có dòng biến); không phải secret (lint `findSecretPublicVars` vẫn qua).
- **Alternatives**: cờ trong code (phải build lại để bật).

## R-14 — Rung

- **Decision**: hiệu ứng `vibrate` → `navigator.vibrate?.(MASCOT_VIBRATION_MS)` trong `try`; chỉ cho lượt ghé mới (BR-MAS-19); bỏ khi giảm chuyển động. Trên trang mở từ camera, trình duyệt có thể bỏ qua vì chưa có thao tác người dùng — coi như "không hỗ trợ".
- **Rationale**: BR-MAS-19; clarify 2026-11-21 (điểm kỹ thuật).

## R-15 — Biết "có phiên" ở host

- **Decision**: host không đọc IndexedDB. M02 đưa `hasSession` (và `k`, `n` khi cần) vào payload `m02.trip.entered`, `m02.trip.shown`, `m02.scan.resolved`; host giữ cờ `hasSession` trong ngữ cảnh, xóa khi `m02.trip.ended` hoặc rời các route M02. MAS-B-074/075 chỉ áp khi `hasSession`.
- **Rationale**: R-02 (engine không đụng dữ liệu module); BR-MAS-01.

## R-16 — Kiểm thử

- **Decision**: Vitest cho engine (đồng hồ giả) và component (Testing Library); một test kiến trúc mới `src/shared/mascot/architecture.test.ts` (không import `modules/`/`app/`); test catalog (cùng khóa, ≤ 90 ký tự với giá trị dài nhất, từ cấm, nhãn CTA khớp i18n module); test precache đọc `dist/sw.js` sau build. E2E đặt cạnh spec hiện có: `e2e/m01/mascot-*.spec.ts`, `e2e/m02/mascot-*.spec.ts` (project `m01`, `m02` đã chạy trên `preview:e2e` với cờ `on`); giảm chuyển động bằng `page.emulateMedia({ reducedMotion: 'reduce' })`; chồng lấp bằng `boundingBox()` ở 320/360/390/430 px. Toàn bộ test hiện có chạy với cờ `on` (CI mặc định e2e) và một lượt Vitest với cờ `off`.
- **Rationale**: MAS-TC-*; SC-MAS-001.

## Upstream có nguy cơ stale

- `docs/mascot/MASCOT_TECHNICAL_SPECIFICATION.md` §2 đặt `MascotSlot` ở `src/app/mascot/`; plan này chuyển sang `src/shared/mascot/` (R-02) và tách INLINE thành `MascotFigure` (R-07). Cập nhật bộ thiết kế khi code xong (tài liệu dẫn xuất, không chặn).
- `docs/mascot/MASCOT_ASSET_SPECIFICATION.md` §3 ghi mẫu precache `assets/mascot-*.webp`; tên thật theo Vite là `assets/ma-*-240-*.webp` và `assets/ma-11-avatar-96-*.webp` (R-09).

## Bổ sung v1.1 (spec-Mascot v1.1; CHG-MASCOT-2026-11-22-02, APPROVED 2026-11-22)

Các mục R-17…R-25 là quyết định kỹ thuật cho BR-MAS-12, 17, 20–23. Không thêm dependency (R-01 giữ nguyên); không dữ liệu bền vững (R-03).

## R-17 — Công tắc "Chuyển động"

- **Decision**: một store nhỏ trong bộ nhớ `src/shared/mascot/motion.ts` (`getMotion`, `setMotion`, `subscribeMotion`, `useMotion`, cùng kiểu `slots.ts`); giá trị đầu = `off` nếu `matchMedia('(prefers-reduced-motion: reduce)')`, ngược lại `on`; không ghi `localStorage`. Component `MascotMotionToggle` (export ở `src/shared/mascot/index.ts`, như `MascotSlot`) render `<button aria-pressed>` khi cờ Mila bật; layout của M01 (`VisitorLayout`) và M02 (`FieldLayout`) đặt nó cạnh nhóm VI/EN. Đổi trạng thái phát `mascot.motion.changed { on }` để engine dừng / chạy lại lịch cử chỉ. Host đọc `useMotion()`: `off` → không gắn `data-mascot-animation`, không lá rơi, chữ hiện ngay.
- **Rationale**: BR-MAS-21 (WCAG 2.2.2); BR-MAS-18 (không lưu); kiến trúc hiện có (module chỉ import `shared/mascot` qua `index.ts`).
- **Alternatives**: nút trong slot của Mila (trùng vai trò "Hỏi Mila", và không có ở màn không có DOCK); lưu `localStorage` (trái BR-MAS-18).

## R-18 — Cử chỉ tự động

- **Decision**: hẹn giờ `ambient` của engine (cùng `nextDeadline`, một `setTimeout`). Khoảng cách lấy từ `ctx.random()` — hàm ngẫu nhiên **được tiêm qua `StepContext`** (host: `Math.random`; test: dãy cố định) để reducer vẫn tất định. Mỗi lượt kiểm điều kiện MAS-B-086; không đạt thì hẹn lại, không xếp hàng. Cử chỉ là `Intent` P7 không lời, `source: 'ambient'`, có thể đổi tư thế tạm qua `holdMs` (≤ 1 500 ms) rồi `then` về tư thế ngữ cảnh đang có. Không lặp cử chỉ vừa dùng (`lastGesture`). Không tính vào BR-MAS-07.
- **Rationale**: BR-MAS-21; R-11 (một hẹn giờ); test được bằng đồng hồ và RNG giả.
- **Alternatives**: `setInterval` trong component (khó tắt theo ngữ cảnh, khó test); CSS `animation-delay` ngẫu nhiên (không biết ngữ cảnh, không dừng theo luật).

## R-19 — Phát hiện "đang thao tác"

- **Decision**: host lắng nghe `pointerdown`, `keydown`, `scroll` (capture, passive, gộp 250 ms) trên `window` và gửi sự kiện nội bộ `app.user.activity` thẳng vào reducer (không qua bus, không vào chống trùng). Reducer ghi `lastActivityAt`. Trọng tài bỏ ý định có `source` là `timer` hoặc `ambient` nếu `now − lastActivityAt < MASCOT_INTERACTION_GRACE_MS`; ý định do sự kiện của chính thao tác (`mascot.user.*`, `m0x.*` kết quả) không bị bỏ. Hẹn giờ không hoạt động của scanner/danh mục tiếp tục reset như R-11.
- **Rationale**: BR-MAS-20; không cần sửa module M01/M02.
- **Alternatives**: phát từ từng màn (nhiều điểm sửa trong module, dễ sót).

## R-20 — Chữ hiện dần

- **Decision**: hook `useTypewriter(text, enabled)` trong `src/app/mascot/` hiện dần `MASCOT_TYPE_CPS` ký tự/giây bằng `requestAnimationFrame`; chạm bong bóng hiện hết. Phần chữ hiện dần `aria-hidden`; một bản đầy đủ ẩn thị giác (lớp `visually-hidden` hiện có) giữ `lang` và `role` cũ, nên trình đọc màn hình đọc câu một lần. Engine cộng thời gian gõ vào `expiresAt` khi `ctx.typing` bật (motion on và không giảm chuyển động): `expiresAt = shownAt + ceil(length / CPS) + readingTime`.
- **Rationale**: design-system §9.3; Dialogue Library §2 (thời lượng tính từ khi chữ hiện đủ); MAS-TC-120.
- **Alternatives**: CSS `steps()` với `width` (không chuẩn với chữ Việt nhiều dòng, không biết khi nào xong).

## R-21 — Cỡ theo slot và bong bóng kiểu A

- **Decision**: token mới `--mascot-size-dock-catalog/-trip/-end` (112/128/104), `--mascot-size-sm` 56, `--mascot-size-xl` 200, `--mascot-bubble-max-width` 240, `--mascot-bubble-surface` #fffaf0. `MascotSlot` nhận prop `size?: 'catalog' | 'trip' | 'end'` → `data-mascot-dock`; CSS của slot đặt biến `--mascot-dock-size` theo token, `Mascot` dùng `var(--mascot-dock-size, var(--mascot-size-md))` cho DOCK. Bong bóng: góc 6 px phía Mila theo hướng (`data-mascot-tail="start|end"`), tên "Mila" là dòng đầu (`aria-hidden`, vì nút đã có tên "Hỏi Mila"). Ảnh DOCK > 120 px dùng `srcSet` 480 cho 2×.
- **Rationale**: design-system §9.2, §9.3, §9.5; lint token.
- **Alternatives**: cỡ cố định theo mode (không phân biệt hero danh mục với màn chuyến đi).

## R-22 — Chạm theo ngữ cảnh và chạm nhiều lần

- **Decision**: reducer giữ `screen:k`, `screen:n` (từ `m02.trip.shown`, xóa khi đổi màn như bộ đếm `screen:` hiện có) và `scannerOpen`. Luật chạm chọn câu theo BR-MAS-12; danh mục xoay 009 → 012 bằng `helpCursor`. Chạm: `lastTapAt` (bỏ trong `MASCOT_TAP_DEBOUNCE_MS`), `tapLog` (cửa sổ `MASCOT_DIZZY_WINDOW_MS`), cờ `once` `DIZZY`. Câu P3 do chạm bỏ qua cooldown và BR-MAS-07 (`source: 'user'`). Component không chạy lại animation đang chạy: host giữ `key={view.seq}` chỉ tăng khi tư thế hoặc animation thật sự đổi.
- **Rationale**: BR-MAS-12, 22.

## R-23 — Ba cấp ăn mừng

- **Decision**: animation mới `success` (AN-SUCCESS, nhún 1 lần) và `milestone` (AN-MILESTONE, nhảy 2 lần + 6 lá); thứ tự ưu tiên trong luật `m02.visit.recorded`: đầu tiên > nửa (n ≥ 4) > còn 1 (n ≥ 3) > thường. `m02.trip.ended` thêm `n` (EndPage có `journeyCheckpoints`) để chọn 063 (k = n) hay 062.
- **Rationale**: BR-MAS-23; payload sự kiện là thông báo trong bộ nhớ, không phải contract liên module.

## R-24 — Chớp mắt

- **Decision**: `assets.ts` thêm `blinkAsset(pose)` từ glob `ma-20-<tư thế>-blink-240.webp`; cử chỉ `blink` chỉ có trong nhóm khi tư thế hiện tại có ảnh mắt nhắm. Host đổi `src` sang ảnh mắt nhắm 120 ms rồi về (ảnh đã nạp sẵn bằng `new Image()` khi tư thế hiện). Mẫu precache `assets/ma-*-240-*.webp` hiện có đã khớp tên này.
- **Rationale**: Asset spec MA-20, AN-BLINK; MAS-TC-122.

## R-25 — Vòng lặp ≤ 5 s

- **Decision**: `--duration-mascot-loop` giữ 1 200 ms; số lần lặp của AN-SEARCH, AN-PACK, AN-THINK = 4 (4,8 s); AN-BREATHE 2 × 2 400 ms. Test E2E đo `getAnimations()` với `effect.getComputedTiming().endTime ≤ 5000` cho mọi animation của Mila trừ khi công tắc có trên màn.
- **Rationale**: BR-MAS-21, SC-MAS-014.
