# Validation Report — 005 Mascot Mila

Chỉ ghi lệnh đã chạy thật; phần chưa chạy ghi `NOT RUN` (AGENTS.md §6). Ảnh production chưa có (OD-MAS-06): Mila hiện bằng hình giữ chỗ.

## 1. Đợt 2026-11-21 — Phase 1 (Setup) và Phase 2 (Foundational)

Branch `feat/mascot-foundation`, tách từ `docs/mascot-baseline` (PR #52). Task: T001–T023, T073, T074.

### 1.1 Test viết trước và đã thấy FAIL

| Test | Kết quả trước khi cài |
|---|---|
| `src/shared/config/env.test.ts` (ca mới VITE_FEATURE_MASCOT), `src/shared/mascot/flag.test.ts` | FAIL: giá trị lạ không báo lỗi; không resolve được `./flag` |
| `events.test.ts`, `arbiter.test.ts`, `machine.test.ts`, `MascotSlot.test.tsx`, `dialogue/catalog.test.ts`, `src/app/mascot/MascotHost.test.tsx`, `architecture.test.ts` | FAIL: không resolve được module |
| `src/app/App.mascot.test.tsx`; ca mới trong `src/shared/ui/Dialog.test.tsx` | FAIL: không resolve `./mascot/loadHost`; không có sự kiện |
| `noDataEffect.test.ts` (T073), `e2e/m02/mascot-no-data-effect.spec.ts` (T074) | Test canh giữ: PASS ngay vì chưa có mã vi phạm; giữ để đỏ khi sau này có vi phạm |

### 1.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/shared/mascot src/app/mascot` | 0 | 9 file, 57 test pass |
| `npx tsc -b --noEmit` | 0 | sạch |
| `npm run ci` (typecheck → lint → test → build) | 0 | lint token 705 pass; 162 file pass + 1 skipped, 2256 pass, 133 skipped; build precache 85 mục |
| `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` | 1 → 0 | Lần 1: 77 pass, 1 fail (T074, lỗi của chính test, DV-7). Sau khi sửa test: `--project=m02 e2e/m02/mascot-no-data-effect.spec.ts --repeat-each=2` → 2 pass. Toàn bộ E2E cũ của M01/M02 PASS khi bật Mila, không sửa |
| Đọc `dist-e2e/sw.js` | — | Có `mascot-*.js`, `mascot-*.css` trong precache |

### 1.3 Số đo

| Mục | Giá trị | Ngân sách |
|---|---|---|
| Chunk `mascot` (host + Mascot) | 21,19 kB JS (8,01 kB gzip) + 7,44 kB CSS (1,66 kB gzip) | ≤ 12 KB gzip (MAS-NFR-02) — đạt |
| Ảnh mascot trong precache | 0 (chưa có ảnh) | ≤ ~350 KB — đo khi có ảnh (T070) |

### 1.4 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-1 | T001: `VITE_FEATURE_MASCOT` được kiểm trong schema `env.ts` (giá trị sai → lỗi khởi động nêu tên biến) nhưng **không** thêm vào `AppEnv`; `src/shared/mascot/flag.ts` đọc `import.meta.env` mỗi lần gọi để test bật/tắt được. Test hiện có của `parseEnv` giữ nguyên | Áp dụng |
| DV-2 | `MascotSlot` giữ chỗ theo mode cố định: CELEBRATE `lg`, DOCK `md`, AVATAR `sm`; slot chỉ có INTRO không giữ chỗ (INTRO tràn trong hero). Contract §1 ghi "mode lớn nhất"; INTRO giữ chỗ 160px ở hero sẽ đẩy danh mục xuống | Áp dụng; cập nhật contract ở T071 |
| DV-3 | `m02.media.playing` dùng trường `mediaType` (contract ghi `type`, trùng tên trường phân loại sự kiện). Thêm sự kiện nội bộ `mascot.tick`, `mascot.timer`, `mascot.slots.changed`, `mascot.asset.failed` (host/engine phát, không module nào phát) | Áp dụng; cập nhật contract ở T071 |
| DV-4 | Tham số `{cheer}` của MSG-MAS-050 là **chỉ số** trong danh sách câu cổ vũ của ngôn ngữ đang hiển thị, không phải chuỗi: đổi VI/EN giữa chừng không ra câu lai hai thứ tiếng | Áp dụng |
| DV-5 | `import.meta.glob` trong test được Vite cache theo nội dung file test: thêm tệp mới vào `src/shared/mascot/` mà file test không đổi thì glob trả danh sách cũ ở máy local (CI sạch không bị). Đã sửa chú thích đầu hai file test glob để làm mới | Ghi nhận |
| DV-6 | Dự án không cài matcher của jest-dom: test dùng `innerHTML` / `toBeTruthy` thay `toBeEmptyDOMElement` / `toBeInTheDocument` | Áp dụng |
| DV-7 | T074 lần đầu đếm cả chunk CSS tĩnh `assets/mascot-*.css` là "request mang dữ liệu Mila"; sửa test để bỏ qua mọi tệp tĩnh dưới `/assets/` | Áp dụng |
| DV-8 | Bong bóng giữ ý định gốc (`BubbleState.intent`) để câu P4 vừa phát mang sang màn mới; câu mang sang bỏ qua kiểm tra một lần/cooldown (State Machine §5.2 luật 6). Cờ `failed` cho lỗi ảnh/lỗi bên trong (BR-MAS-15, 16) | Áp dụng |
| DV-9 | `Dialog` dùng chung phát `app.dialog.changed` bằng import trực tiếp `src/shared/mascot/events` (cùng tầng shared), không qua `index` để không kéo component mascot vào chunk của hộp thoại | Áp dụng |

### 1.5 `NOT RUN`

| Mục | Lý do |
|---|---|
| Thiết bị thật, TalkBack/VoiceOver, Lighthouse | Chưa có hành vi hiển thị (chưa có luật); chạy ở mốc pilot |
| Bố cục chồng lấp (T026) | Thuộc Phase 3 |

Checkpoint Phase 2 **đạt**: engine, host, slot, catalog có test; app chạy như cũ khi bật Mila (chưa có luật nên chưa hiện gì).

### 1.6 Sửa sau review PR #55 (2026-11-21)

| # | Vấn đề | Sửa |
|---|---|---|
| RV-1 | Precache chỉ có cỡ 240; avatar (MA-11) chỉ có cỡ 96/192 nên ảnh AVATAR không có khi offline → `onError` → Mila ẩn tới khi tải lại trang | Thêm mẫu `assets/ma-11-avatar-96-*.webp` vào `globPatterns`; cập nhật research R-09, quickstart, T004, T067 |
| RV-2 | `Dialog` phát mở/đóng theo từng hộp: hai hộp chồng nhau, đóng một hộp là gỡ chặn dù hộp kia còn mở | `holdMascotSignal` trong `events.ts` đếm số nguồn: chỉ phát khi hộp đầu tiên mở và hộp cuối cùng đóng; contract §3 dòng `app.dialog.changed` cập nhật |
| RV-3 | Chống trùng 500 ms (BR-MAS-06) nuốt tín hiệu trạng thái lặp lại: mở → đóng → mở hộp thoại (hoặc phát → dừng → phát) trong 500 ms thì lần mở thứ hai bị bỏ, Mila nói khi đang có hộp thoại | `machine.ts`: `app.dialog.changed`, `m02.media.playing/stopped`, `m02.notice.autoEndShown/Hidden` không chống trùng (engine áp chúng idempotent) |

Test mới: `events.test.ts` (holdMascotSignal), `machine.test.ts` (tín hiệu trạng thái không chống trùng), `Dialog.test.tsx` (hai hộp thoại). Lệnh: xem §1.7.

### 1.7 Lệnh kiểm chứng sau review

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/shared/mascot src/shared/ui/Dialog.test.tsx src/app` | 0 | 15 file, 103 test pass |
| `npm run ci` (sau khi merge `main` qua PR #52) | 0 | lint token 721 pass; 165 file pass + 1 skipped, 2289 pass, 133 skipped; build precache 94 mục |
| Mẫu `ma-11-avatar-96-*.webp` khớp tệp trong `dist/` | NOT RUN | Chưa có ảnh production (OD-MAS-06); kiểm ở T067/T070 |
