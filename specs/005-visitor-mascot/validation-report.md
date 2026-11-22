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

### 2.4 Sửa sau review PR #56 (2026-11-21)

| # | Vấn đề | Sửa |
|---|---|---|
| RV-4 | `MediaList` phát playing/stopped theo từng tệp: hai tệp cùng phát, dừng một tệp là gỡ chặn dù tệp kia còn phát | Dùng `holdMascotSignal('media', …)` (§1.6 RV-2): `playing` khi tệp đầu tiên phát, `stopped` khi tệp cuối cùng dừng hoặc bị gỡ; contract §3 dòng `m02.media.*` cập nhật. Test mới trong `mascotSignals.test.tsx` |

Lệnh: `npx vitest run src/modules/m02/content src/shared/mascot` → 15 file, 101 test pass; `npm run ci`: xem §3.4.

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

### 3.4 Lệnh kiểm chứng sau review (PR #55, #56)

Branch `feat/mascot-us3` sau khi merge `feat/mascot-foundation` (đã có `main` qua PR #52) và sửa RV-4.

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` (typecheck → lint → test → build) | 0 | lint token 724 pass; 168 file pass + 1 skipped, 2315 pass, 133 skipped; build precache 96 mục |
| E2E (`npx playwright test`) | NOT RUN ở máy local | Chạy trên CI của PR |

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

### 4.4 Đồng bộ với `main` và các sửa review (2026-11-21)

Merge `feat/mascot-us3` (đã có `main` qua #53, #54, #57, #59; US1 qua #58; sửa review RV-1…RV-4) vào `feat/mascot-us2`. Một xung đột chữ (báo cáo này, giữ cả hai phía). Không xung đột code; code US2 không đụng `Dialog`, `MediaList`.

| # | Mục | Trạng thái |
|---|---|---|
| DV-26 | Chống trùng 500 ms dùng payload làm khóa nên `route.changed` về `/trip` trong vòng 500 ms sau lần trước ở `/trip` (quét rồi "Quay lại" nhanh) bị nuốt; Mila kẹt ở màn cũ rồi mất trên màn chuyến đi. Q4/Q5 đạt hay không tùy tốc độ máy. Sửa: đổi sang path khác không bị chống trùng; màn mới bắt đầu với bảng chống trùng sạch. Cùng hướng với RV-3 (tín hiệu trạng thái không chống trùng). Tìm ra ở US4, đưa xuống đây để PR US2 tự đạt | Áp dụng |
| DV-27 | Trọng tài: ý định không lời (chỉ tư thế) mà slot chưa đăng ký thì đặt luôn vào view, host vẽ khi slot có; không giành chỗ duy nhất của hàng đợi với câu đang chờ (ví dụ 051 mang sang `/trip`). Bổ sung DV-18 | Áp dụng |
| DV-32 | Môi trường: sau khi kéo `main` (icon mới `close.svg`), Vitest dùng transform cũ trong `node_modules/.vitest-cache` của `import.meta.glob`, 14 test báo thiếu icon `close`. Xóa cache thì đạt; không phải lỗi code (cùng loại DV-5) | Ghi nhận |

## 5. Đợt 2026-11-21 — Phase 6: US4 "Kết thúc chuyến cùng Mila" (US-MAS-08) — hết pilot (G5)

Branch `feat/mascot-us4`, tách từ `feat/mascot-us2` (PR #61). Task: T043–T046.

### 5.1 Test viết trước

| Test | Kết quả trước khi cài |
|---|---|
| `rules.test.ts` US4 (062 rồi 063, chạm đóng → tĩnh, 063 mở lại / BO_DO, 070 offline, 071 `PENDING → SYNCED`, SYNCED ngay từ đầu, 072) | FAIL 6 ca; ca 072 (CONFLICT không câu) đạt ngay vì không có luật nào là đúng |
| `e2e/m02/mascot-end.spec.ts` (Q12, offline → 070, 409 CONFLICT) | Viết trước; chạy sau khi có slot và điểm phát |

### 5.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/shared src/app src/modules` | 0 | 2299 pass, 133 skipped |
| `npx tsc -b` | 0 | — |
| `npx playwright test` (cổng 4173/5174 đã kiểm trống, DV-19) | 0 | 131 pass, 46 skipped (local/integration như trước) |
| `npx playwright test --project=m02 mascot-visit mascot-end --repeat-each=3` | 0 | 15/15 |
| `npm run ci` | 0 | lint 708; 2299 pass, 133 skipped; build OK |
| Chụp màn hình (trong `e2e/m02/mascot-layout.spec.ts`) | — | 320 px lúc ăn mừng: bong bóng 062 trên Mila, Mila cạnh huy hiệu, không cuộn ngang. 430 px sau đó: Mila DOCK nhỏ cạnh huy hiệu, nhành lá của huy hiệu không chạm Mila; lời chào, thẻ hẹn gặp lại, danh sách giữ nguyên bố cục duyệt 2026-11-11 |

### 5.3 Lệch

| # | Mục | Trạng thái |
|---|---|---|
| DV-25 | "Vừa kết thúc" (MAS-B-062) không lấy từ router state như Behavior Matrix ghi: trình duyệt giữ `history.state` qua lần tải lại, nên tải lại sẽ ăn mừng lần nữa (sai Q12). Thay bằng cờ trong bộ nhớ `takeEndedHere(sessionId)` ở `useEndTrip.ts`, đặt khi `finishSession` trả `FINISHED` và chỉ lấy được một lần; tải lại thì mất. Không ghi dữ liệu, không đổi thứ tự ghi của M02 | Áp dụng; cập nhật Behavior Matrix ở T071 |
| DV-26, DV-27 | Tìm ra ở US4 nhưng là lỗi có sẵn của US2: đã chuyển xuống US2, xem §4.4 | Áp dụng (ở US2) |
| DV-28 | CELEBRATE kéo dài bằng thời gian đọc câu 062 (tối thiểu 3 s theo §5.4), không cắt ở 2,4 s; chuyển động (AN-CELEBRATE, lá rơi) vẫn ≤ `--duration-mascot-celebrate` 2 400 ms. Cắt ở 2,4 s sẽ làm câu biến mất trước khi đọc xong | Áp dụng |
| DV-29 | MAS-B-070 hiện ở slot `end-hero` (DOCK, tư thế ba lô), không ở AVATAR trong thẻ danh sách: màn chỉ có một slot để không thêm chỗ trống vào thẻ. Câu chờ sau phần ăn mừng (khoảng 4 s, còn bong bóng thì thử lại mỗi 1 s) thay vì 1 s, vì P5 không được chen vào câu P4 đang hiện | Áp dụng |
| DV-30 | CELEBRATE đặt bong bóng trên Mila (như INTRO), đuôi chỉ xuống giữa: slot đứng cạnh huy hiệu nên bề ngang hẹp ở 320 px | Áp dụng |
| DV-31 | Banner CONFLICT thành khối `data-end-conflict` chứa `MascotFigure confused` (sm, `aria-hidden`) và đoạn chữ `role="alert"`; chữ thông báo không đổi | Áp dụng |

### 5.4 Đồng bộ với `main` và các sửa review (2026-11-21)

Merge `feat/mascot-us2` (đã có `main` mới: tab bar M01, màn Quét QR `/scan`, trang kết quả gợi ý, toast dùng chung, cỡ chữ mới; US1; RV-1…RV-4; DV-26/27) vào `feat/mascot-us4`. Xung đột: báo cáo này và `machine.ts`/`machine.test.ts` (cùng bản sửa DV-26/27 ở hai phía; lấy bản của US2, đã gồm RV-3).

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | lint token 724; 2333 pass, 133 skipped; build OK |
| `npx playwright test` (cổng 4173/5174 đã kiểm trống) | 0 | 133 pass, 46 skipped |
| Ảnh 320 px lúc ăn mừng (cỡ chữ mới của `main`) | — | Không đè, không cuộn ngang; bố cục như §5.2 |

### 5.5 Pilot (Phase 1–6) đã xong

US3, US1, US2, US4 đã cài. Ảnh Mila đợt 1: xem §6. US5–US8 và Polish chỉ làm khi người dùng yêu cầu.

## 6. Đợt 2026-11-22 — Ảnh Mila đợt 1 (T070) và precache (T067)

Branch `feat/mascot-assets`, tách từ `feat/mascot-us4` (PR #62). Người dùng tự thiết kế 9 ảnh, chép vào `assets/mascot/source/` và xác nhận quyền sử dụng (OD-MAS-06, 07).

### 6.1 Kiểm ảnh gốc

| Mục | Kết quả |
|---|---|
| Định dạng | 9 PNG RGBA nền trong suốt thật; 1254×1254, riêng `ma-09-confused` 1230×1278 (đệm thành vuông khi xuất) |
| Viền | Điểm đỏ thuần quanh mép có alpha 1–15/255 (tàn dư nền cũ), không thấy trên nền tối, sáng, xanh rừng; khi xuất bỏ điểm alpha ≤ 3 |
| Mảng rời | Mỗi ảnh 9–65 hạt li ti (alpha ≤ 12); riêng `ma-09-confused` có dấu "?" tách rời (trái hướng dẫn §2 mục 6) → bỏ khi xuất, không vẽ lại nhân vật |
| Nhất quán | Cùng nhân vật, khăn xanh lá trắng, ba lô xanh rêu có cuộn chăn cùng màu, khóa đồng (ảnh cheer tạo lại theo câu mô tả ba lô) |

### 6.2 Xuất và số đo (WebP chất lượng 0,82; quy trình: `assets/mascot/README.md`)

| Ảnh | 240 (avatar 96) | 480 (avatar 192) |
|---|---|---|
| ma-01-wave | 11,3 KB | 28,0 KB |
| ma-02-map | 10,9 KB | 27,5 KB |
| ma-04-backpack | 11,5 KB | 31,3 KB |
| ma-05-binoculars | 10,7 KB | 27,3 KB |
| ma-07-thumbs-up | 12,8 KB | 34,8 KB |
| ma-08-cheer | 10,1 KB | 25,1 KB |
| ma-09-confused | 13,5 KB | 39,5 KB |
| ma-10-rest | 15,7 KB | 40,9 KB |
| ma-11-avatar | 5,0 KB | 11,7 KB |
| **Tổng** | **101,5 KB (precache)** | 266,2 KB (nạp khi cần) |

Trong ngân sách Asset spec §3 (~420 KB cho 12 ảnh cả hai cỡ; precache chỉ cỡ nhỏ).

### 6.3 Code

| # | Mục | Trạng thái |
|---|---|---|
| DV-33 | Chế độ AVATAR (40 px) dùng ảnh `ma-11-avatar` (Asset spec §3, MA-11 "đầu bong bóng AVATAR"); trước đó vẽ ảnh tư thế toàn thân, quá nhỏ để đọc. `data-mascot-pose` vẫn là tư thế của luật | Áp dụng; test `src/app/mascot/Mascot.test.tsx` FAIL trước khi sửa |
| DV-34 | Đợt 1 có 9 ảnh, thêm `ma-10-rest` (MAS-B-063 dùng khi chuyến tự kết thúc); đợt 2 còn 3 ảnh (think, magnifier, point) — các tư thế này hiện chưa có luật pilot nào dùng | Áp dụng; hướng dẫn tạo ảnh §1 cập nhật |
| DV-35 | Xuất bằng Chromium của Playwright thay cho `cwebp`: không cài công cụ ngoài | Áp dụng |

### 6.4 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/app/mascot/Mascot.test.tsx src/shared/mascot/assets.test.ts` (trước khi sửa) | 1 | 1 FAIL (AVATAR), 5 pass |
| `npm run ci` | 0 | lint token 726; 2341 pass, 133 skipped; build precache 106 mục |
| `dist/sw.js` | — | Đúng 8 × `ma-*-240-*.webp` + `ma-11-avatar-96-*.webp`; không 480, 192 |
| `npx playwright test` (cổng 4173/5174 đã kiểm trống) | 0 | 133 pass, 46 skipped |
| `npx playwright test e2e/m01/mascot-precache.spec.ts` (T067) | 0 | 1 pass |
| Chụp 390 px (spec tạm, đã xóa) | — | Danh mục (INTRO, DOCK), chuyến đi, trang nội dung (avatar cạnh 051), câu hỏi cuối chuyến, màn kết quả (ăn mừng, DOCK), CONFLICT, khách tự do: ảnh thật, không đè |

## 7. Đợt 2026-11-22 — Cập nhật gói theo spec-Mascot v1.1 (CHG-MASCOT-2026-11-22-02)

Branch `specs/mascot-v1.1`, tách từ `docs/mascot-v1.1` (PR #64). Chỉ tài liệu của gói; chưa có code.

### 7.1 Thay đổi

| Tệp | Nội dung |
|---|---|
| `spec.md` | Nguồn v1.1; US8 chạm theo ngữ cảnh + chạm nhiều lần; US9 mới; FR-MAS-005, 008 sửa; FR-MAS-011, 012; SC-MAS-011…014; traceability |
| `research.md` | R-17 công tắc (store trong bộ nhớ), R-18 cử chỉ tự động (RNG tiêm qua `StepContext`), R-19 "đang thao tác" (listener ở host, không sửa module), R-20 chữ hiện dần (bản đầy đủ `.visually-hidden`), R-21 cỡ theo slot, R-22 chạm, R-23 ba cấp (`trip.ended` thêm `n`), R-24 chớp mắt, R-25 vòng lặp ≤ 5 s |
| `plan.md` | Nguồn v1.1; trình tự G8b |
| `data-model.md` | Trạng thái mới trong bộ nhớ (`motion`, `lastActivityAt`, `lastGesture`, `lastTapAt`, `tapLog`, `helpCursor`, tiến độ theo màn); `Intent.source` |
| `contracts/` | Sự kiện `mascot.motion.changed`, `app.user.activity` (nội bộ); `m02.trip.ended` thêm `n`; UI: `MascotSlot size`, `MascotMotionToggle`, bong bóng kiểu A, token mới |
| `quickstart.md` | Q18…Q26 |
| `tasks.md` | T063–T065 sửa theo chạm v1.1; Phase 12–17 mới (T075–T096); phụ thuộc; chiến lược G8b |

### 7.2 Rà phủ (analyze, thủ công)

| Yêu cầu v1.1 | Task | Kết quả |
|---|---|---|
| BR-MAS-12 chạm theo ngữ cảnh | T063, T064, T065 | Có |
| BR-MAS-17 công tắc khởi đầu tắt khi giảm chuyển động | T082 | Có |
| BR-MAS-20 ngữ cảnh hoạt động | T093, T094 | Có |
| BR-MAS-21 cử chỉ tự động, công tắc, vòng lặp ≤ 5 s | T081–T086 | Có |
| BR-MAS-22 chạm nhiều lần | T087, T088 | Có |
| BR-MAS-23 ba cấp ăn mừng | T089–T092 | Có |
| SC-MAS-011 / 012 / 013 / 014 | T083 / T081, T093 / T087 / T083 | Có |
| Bong bóng kiểu A, chữ hiện dần, cỡ mới (design-system §9) | T075–T080 | Có |
| Chớp mắt (MA-20), ảnh đợt 2 | T095, T096 (chặn bởi ảnh) | Có |
| Constitution: không dependency, không dữ liệu bền vững, module chỉ import `shared/mascot` qua `index.ts` | R-17…R-25; test kiến trúc hiện có | Không vi phạm |

Không phát hiện mâu thuẫn chặn. Tổng task: 96 (74 cũ + 22 mới).

## 8. Đợt 2026-11-22 — Phase 12: bong bóng "Giấy dã ngoại", chữ hiện dần, cỡ mới (v1.1)

Branch `feat/mascot-v11-bubble`, tách từ `specs/mascot-v1.1` (PR #65). Task: T075–T080.

### 8.1 Test viết trước

| Test | Trước khi cài |
|---|---|
| `src/app/mascot/Mascot.test.tsx` (dòng tên, chữ hiện dần, chạm hiện hết, không hiện dần, srcset DOCK, lùi về ảnh 240) | FAIL 4 ca; 2 ca "không hiện dần" đạt ngay |
| `src/shared/mascot/machine.test.ts` (thời gian tự ẩn cộng thời gian gõ) | FAIL |
| `src/shared/mascot/MascotSlot.test.tsx` (`data-mascot-dock`, chỗ giữ CELEBRATE `xl`) | FAIL 2 ca |

### 8.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | lint token 727; 2349 pass, 133 skipped; build OK |
| `npx playwright test e2e/m01/mascot-layout.spec.ts e2e/m02/mascot-layout.spec.ts` | 0 | 6 pass: cỡ đo được DOCK 112 / 128 / 104 px, AVATAR 56 px, CELEBRATE ở 320 px trong 120–200 px; không đè, không cuộn ngang ở 320–430 px |
| `npx playwright test` (cổng đã kiểm trống) | 1 | 132 pass, 4 fail, 46 skipped; lượt chạy 3,5 phút (thường 1,8 phút) |
| Chạy lại 4 spec fail (`m03/forbidden-words`, `m03/checkpoints`, `m03/translate`, `m02/content`) | 0 | 23 pass — fail trước là do máy quá tải; 3/4 ở M03, không bị đụng |
| Ảnh chụp 390 px (spec tạm, đã xóa) | — | Bong bóng kiểu A ở danh mục, chuyến đi, nội dung, kết quả; chữ hiện dần giữa chừng giữ nguyên cỡ bong bóng; dải đồi không còn lộ |

### 8.3 Lệch

| # | Mục | Trạng thái |
|---|---|---|
| DV-36 | Chữ hiện dần làm bằng **lớp phủ** `aria-hidden` trên đoạn gốc (đoạn gốc giữ câu đầy đủ, trong suốt khi đang gõ) thay cho bản `.visually-hidden` riêng như R-20 ghi: trình đọc màn hình vẫn đọc một lần, bong bóng đủ cỡ từ đầu (không giật), `textContent` của `[data-mascot-message]` không đổi nên E2E hiện có giữ nguyên | Áp dụng; cập nhật R-20 khi đồng bộ tài liệu |
| DV-37 | DOCK cỡ lớn dùng `srcset` 480 cho 2×; ảnh 480/192 ngoài precache nên tải hỏng (offline) thì **lùi về ảnh 240** thay vì báo lỗi ảnh (trước đó INTRO/CELEBRATE offline có thể làm Mila biến mất). Test mới trong `Mascot.test.tsx` | Áp dụng |
| DV-38 | INTRO/CELEBRATE `min(200px, chỗ còn lại)`: cạnh huy hiệu ở 320 px không đủ 200 px | Áp dụng |
| DV-39 | Dải đồi trang trí của hero danh mục ẩn khi Mila có mặt (`:has`), thay vì dời vị trí | Áp dụng |
| DV-40 | Test "DOCK không srcset" của PR #63 đổi thành "DOCK có srcset 480" theo design-system v1.1 §9.2 | Ghi nhận |

## 9. Đợt 2026-11-23 — Phase 13: công tắc "Chuyển động" và cử chỉ tự động (v1.1)

Branch `feat/mascot-v11-motion`, tách từ `feat/mascot-v11-bubble` (PR #66). Task: T081–T086.

### 9.1 Test viết trước

| Test | Trước khi cài |
|---|---|
| `rules.test.ts` MAS-B-086 (lịch 8–15 s với `ctx.random`, cử chỉ ≤ 1,5 s rồi về tư thế cũ, không lặp liền, không khi có bong bóng / công tắc tắt / scanner mở / trang đọc bài, không tính vào giới hạn câu chủ động) | FAIL 3 ca |
| `motion.test.ts`, `MascotMotionToggle.test.tsx` | FAIL (chưa có module) |
| `e2e/m01/mascot-motion.spec.ts` (Q18, Q19, Q20, công tắc ở M02) | Viết trước; chạy sau khi cài |

### 9.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | lint token 734; 2364 pass, 133 skipped; build OK |
| `npx playwright test e2e/m01/mascot-motion.spec.ts` | 0 | 4 pass: cử chỉ trong 16 s; mọi animation của Mila `endTime` ≤ 5 000 ms; tắt → 0 animation chạy, Mila vẫn hiện; giảm chuyển động → công tắc khởi đầu "tắt"; công tắc có ở M02 |
| `npx playwright test` (cổng đã kiểm trống) | 1 | 136 pass, 4 fail, 46 skipped; lượt chạy 3 phút |
| Chạy lại 4 spec fail (`m03/checkpoints`, `m03/forbidden-words`, `m02/content`, `m02/mascot-end`) | 0 | 15 pass; `mascot-end` lặp 3 lần: 9/9. Hai spec M03 và `m02/content` V10 cũng fail ở §8.2 khi cả bộ chạy lâu — chập chờn theo tải máy, không do Mila |
| Ảnh header 320/390 px (spec tạm, đã xóa) | — | M01: công tắc có chữ ở 390, chỉ biểu tượng ở 320. M02 (có tiêu đề): chỉ biểu tượng; ở 320 px tiêu đề "Chuyến đi" xuống hai dòng, không bị cắt hay đè |

### 9.3 Lệch

| # | Mục | Trạng thái |
|---|---|---|
| DV-41 | Thanh đầu trang M02 có tiêu đề: công tắc chỉ hiện biểu tượng (`compact`), vì bản có chữ đẩy "EN" ra ngoài mép ở 390 px. Tên truy cập vẫn đủ. design-system §9.5 ghi "dưới 360 px chỉ biểu tượng" — M02 dùng biểu tượng ở mọi chiều rộng | Áp dụng; cập nhật §9.5 khi đồng bộ tài liệu |
| DV-42 | Ở 320 px, tiêu đề "Chuyến đi" của M02 xuống hai dòng vì thêm công tắc 44 px | Chờ chủ dự án xem trên điện thoại |
| DV-43 | Nhóm cử chỉ tự động v1: nhìn ống nhòm, vẫy, nhún, nghiêng đầu, kéo quai ba lô. "Thở" (AN-BREATHE 4,8 s) không vào nhóm vì cử chỉ tự động ≤ 1,5 s; chớp mắt vào nhóm ở Phase 17 khi có ảnh | Áp dụng |
| DV-44 | MAS-B-004 (chào lại) nói xong thì về tư thế bản đồ của danh mục (`then`), không giữ tư thế vẫy tay — để cử chỉ tự động có tư thế ngữ cảnh đúng | Áp dụng |
| DV-45 | Lịch cử chỉ đặt bởi máy trạng thái sau mỗi bước (điều kiện hết → bỏ hẹn), thay vì chỉ trong luật; luật \`MAS-B-086\` chọn cử chỉ khi tới hạn | Áp dụng |
