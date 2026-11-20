# Research — 005 Mascot Mila

**Package**: `specs/005-visitor-mascot/` · **Date**: 2026-11-21 · **Spec**: [spec.md](spec.md) (dẫn xuất spec-Mascot v1.0)

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

- **Decision**: thêm vào `workbox.globPatterns` một mẫu hẹp `assets/ma-*-240-*.webp` (chỉ cỡ 240); cỡ 480 không precache. JS của engine/host nằm trong `**/*.js` đã có. Đặt tên chunk `mascot` bằng một nhánh mới trong `chunkPrefix` cho `src/shared/mascot/` và `src/app/mascot/`.
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
- `docs/mascot/MASCOT_ASSET_SPECIFICATION.md` §3 ghi mẫu precache `assets/mascot-*.webp`; tên thật theo Vite là `assets/ma-*-240-*.webp` (R-09).
