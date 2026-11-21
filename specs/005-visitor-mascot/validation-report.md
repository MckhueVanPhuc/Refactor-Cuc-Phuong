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

## 2. Đợt 2026-11-21 — Phase 3: US3 "Mila tránh đường" (US-MAS-05)

Branch `feat/mascot-us3`, tách từ `feat/mascot-foundation` (PR #55). Task: T024–T030.

### 2.1 Test viết trước

| Test | Kết quả trước khi cài |
|---|---|
| `src/modules/m02/content/mascotSignals.test.tsx` (ScanNotice, MediaList), `src/modules/m02/layout/FieldLayout.mascot.test.tsx` | FAIL: không có sự kiện nào được phát |
| `src/shared/mascot/rules.test.ts` (US3: MAS-B-035, 045, 058, 082, 083, 084, dialog) | PASS ngay: các luật an toàn nằm trong máy trạng thái từ Phase 2 (T016, State Machine T9/T10), không cần luật riêng trong `rules.ts` (DV-10) |
| `e2e/m02/mascot-safety.spec.ts`, `e2e/m02/mascot-layout.spec.ts`, `e2e/m01/mascot-layout.spec.ts` | Chưa có slot nào nên các khẳng định "không có Mila", "không đè" đạt ngay; chúng có ý nghĩa từ US1/US2 khi slot xuất hiện và được chạy lại ở mỗi story (DV-11) |

### 2.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/modules/m02 src/shared/mascot` | 0 | 46 file, 305 pass |
| `npx playwright test --project=m01 --project=m02 e2e/m02/mascot-safety.spec.ts e2e/m02/mascot-layout.spec.ts e2e/m01/mascot-layout.spec.ts` | 0 | 6 pass (sau hai lần sửa test, DV-12) |
| `npm run ci` | 0 | lint 708 pass; 165 file pass + 1 skipped, 2273 pass, 133 skipped; build OK |

### 2.3 Lệch

| # | Mục | Trạng thái |
|---|---|---|
| DV-10 | T027: luật MAS-B-035, 045, 058, 082, 083, 084 và chặn dialog đã nằm trong `machine.ts` (Phase 2) vì là hành vi của engine, không phụ thuộc sự kiện cụ thể; `rules.ts` không thêm dòng nào cho US3. Host đã gỡ Mila khỏi DOM khi `view = null` | Áp dụng |
| DV-11 | E2E an toàn/bố cục của US3 chưa có Mila để kiểm; giữ để chạy lại ở mỗi story có slot (T026). Q13 (giảm chuyển động) chuyển sang E2E của US1 khi INTRO có trên màn | Áp dụng |
| DV-12 | Test E2E: phải chờ nút "Quét QR" (khớp chính xác tên, vì mục hành trình đã quét có chữ "Đã quét QR") trước khi gọi hook quét | Áp dụng |
| DV-13 | `MediaList`: tệp bị gỡ khỏi DOM khi đang phát (đổi VI/EN) cũng phát `m02.media.stopped`, để Mila không im mãi | Áp dụng |

## 3. Đợt 2026-11-21 — Phase 4: US1 "Làm quen với Mila" (US-MAS-01)

Branch `feat/mascot-us1`, tách từ `feat/mascot-us3` (PR #56). Task: T031–T036.

### 3.1 Test viết trước

| Test | Kết quả trước khi cài |
|---|---|
| `rules.test.ts` US1 (MAS-B-001→002→003, đóng sớm, MAS-B-004) | FAIL 3 ca; 2 ca (không giới thiệu trên `/q/…`, MAS-B-080) đạt ngay vì là hành vi mặc định |
| `e2e/m01/mascot-intro.spec.ts` Q1, Q2 | FAIL (không có bong bóng) — lần đầu sau khi cài cũng FAIL, phát hiện DV-14 |
| `events.test.ts` (giữ tạm sự kiện trước khi host đăng ký) | FAIL 2 ca |

### 3.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/shared src/app src/modules` | 0 | 165 file pass + 1 skipped; 2281 pass |
| `npx playwright test --project=m01 e2e/m01/mascot-intro.spec.ts` | 0 | 3 pass (Q1, Q2, Q13) |
| `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` | 0 | 88 pass: toàn bộ E2E cũ + mới, gồm bố cục M01/M02 (T026) và Q3 trang QR |
| `npm run ci` | 0 | lint 708; 2281 pass, 133 skipped; build OK |
| Chụp màn hình 320/390 px (spec tạm, đã xóa) | — | INTRO: bong bóng có đuôi trên Mila, danh mục bị đẩy xuống một lần, không đè. DOCK: Mila cạnh "Gợi ý tuyến" trên dải đồi |

### 3.3 Lệch

| # | Mục | Trạng thái |
|---|---|---|
| DV-14 | Bus giữ tạm tối đa 20 sự kiện trong 5 giây khi **chưa từng** có listener (host nạp lazy), giao cho listener đầu tiên với thời điểm gốc. Không có bộ đệm này thì chọn ngôn ngữ ngay khi trang vừa mở (hay mạng yếu, chunk `mascot` tải chậm) làm mất lời giới thiệu. Sau lần đăng ký đầu, không listener → bỏ như contract. Thêm `resetMascotEventsForTest()` cho test | Áp dụng; cập nhật contract §1 ở T071 |
| DV-15 | MAS-B-001 hiện sau 300 ms bằng hẹn giờ của luật (danh mục và slot chưa render lúc sự kiện tới) | Áp dụng (đúng Delay của Behavior Matrix) |
| DV-16 | Hero danh mục: nút "Gợi ý tuyến" và slot `catalog-hero` cùng một hàng (`heroActions`), xuống dòng khi hẹp; INTRO đẩy danh mục xuống trong lúc giới thiệu (không đè) | Áp dụng |
| DV-17 | `MAS-B-004` "ngôn ngữ có từ trước khi tải trang" suy ra từ việc không có `m01.language.selected` trong lần tải trang (không đọc dữ liệu M01) | Áp dụng |

## 4. Đợt 2026-11-21 — Phase 5: US2 "Mila ăn mừng tiến độ có thật" (US-MAS-02)

Branch `feat/mascot-us2`, tách từ `feat/mascot-us1` (PR #58). Task: T037–T042.

### 4.1 Test viết trước

| Test | Kết quả trước khi cài |
|---|---|
| `rules.test.ts` US2 (051, 055, 050 xoay câu cổ vũ, điểm cuối chỉ rung, 033 tư thế theo tiến độ, 061) | FAIL 6 ca; 3 ca "không làm gì" (053 phát lại cùng lượt ghé, giảm chuyển động không rung, khách tự do) đạt ngay |
| `e2e/m02/mascot-visit.spec.ts` Q4–Q6 | FAIL trước khi có slot và điểm phát |
| `machine.test.ts` ca "slot chưa đăng ký" (DV-18) | Sửa test và mã **cùng một lượt**, không chạy riêng bước FAIL |

### 4.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/shared/mascot` | 0 | 76 pass |
| `npx playwright test --project=m01 --project=m02 --project=m02-cam-evil` (server mới, DV-19) | 0 | 91 pass |
| `npx playwright test --project=m01 <spec trace tạm> --repeat-each=10` | 0 | 10/10 lần có lời giới thiệu (spec và đoạn trace tạm đã gỡ) |
| `npm run ci` | 0 | lint 708; 2290 pass, 133 skipped; build OK |
| Chụp màn hình 390 px (spec tạm, đã xóa) | — | Chuyến đi: Mila DOCK "ống nhòm" trên nút Quét QR. Nội dung: bong bóng 051 dưới ảnh đầu trang, toast cũ giữ nguyên phía trên, không đè |

### 4.3 Lệch

| # | Mục | Trạng thái |
|---|---|---|
| DV-18 | Trọng tài: ý định bị chặn **chỉ vì slot của màn chưa đăng ký** (cuộc đua render: sự kiện tới trước khi slot mount) được chờ trong hàng đợi, mọi mức ưu tiên, TTL 4 s; hiện ngay khi slot có. Quy tắc "P5–P7 không chờ" (BR-MAS-05) giữ nguyên cho trường hợp đang có bong bóng khác (`queued.reason = 'busy'`). Không có thay đổi này, tư thế DOCK khi quay về `/trip` và lời giới thiệu đôi khi bị bỏ | Áp dụng; cập nhật State Machine §5.2 ở T071 |
| DV-19 | Hai server Vite (`dev:fake` 5174, `preview:e2e` 4173) của một lượt E2E bị ngắt giữa chừng còn chạy; `reuseExistingServer` khiến các lượt sau dùng **bản build cũ**, gây lỗi giả. Đã dừng hai tiến trình (kiểm dòng lệnh trước), chạy lại toàn bộ trên server mới. Từ đây kiểm cổng 4173/5174 trống trước khi chạy E2E | Ghi nhận |
| DV-20 | `RuleResult.effects`: luật trả hiệu ứng không kèm lời (rung ở điểm cuối, BR-MAS-19); rung bị bỏ khi giảm chuyển động | Áp dụng |
| DV-21 | Slot `content-toast` nằm dưới ảnh đầu trang, không ở đầu trang: toast cũ là lớp cố định dưới thanh app nên đặt trên sẽ đè | Áp dụng |
| DV-22 | MAS-B-061 chọn slot đang có: DOCK ở `/trip`, AVATAR ở trang nội dung (câu hỏi cuối chuyến thường hiện ở trang nội dung) | Áp dụng |
| DV-23 | E2E giới thiệu (US1) ghi lại mọi câu Mila nói bằng MutationObserver và khẳng định thứ tự, thay vì nhìn một thời điểm (câu 001 chỉ hiện ~3,8 s). Thử `page.clock` không dùng được: đồng hồ giả làm treo phần đọc IndexedDB và nạp danh mục | Áp dụng |
| DV-24 | Spec bố cục (4 chiều rộng × nhiều màn) đặt timeout 120 s | Áp dụng |
