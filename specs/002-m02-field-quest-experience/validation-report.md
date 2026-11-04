# Validation report — 002 M02 Field Quest Experience

Báo cáo kiểm chứng của đợt cài đặt T001–T101 (2026-11-04, PR #26–#34). Chỉ ghi lệnh đã chạy thật; phần chưa chạy ghi `NOT RUN` kèm lý do (AGENTS.md §6). Phase 11 (tích hợp thật, T102–T106) ghi ở §8.

## 1. Bối cảnh

| Mục | Giá trị |
|---|---|
| Máy | Windows 11, Node.js v24.15.0, npm 11.12.1, Chromium của Playwright 1.64.1 |
| Phạm vi | US1–US7 (T026–T091) và Phase 10 (T092–T101) trên network mock; M01 thật trong E2E (hook `m01.seedContext`, `m01.seedPackage`), cổng M01 giả trong Vitest |
| Dependency mới | `@zxing/browser` 0.2.1, `@zxing/library` 0.23.0 (research R-02) |
| Độ phủ | [checklists/br-test-coverage.md](checklists/br-test-coverage.md): 26 BR, 19 SC, 11 DAC đều có test tự động |

## 2. Lệnh kiểm chứng (T099)

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run typecheck` | 0 | sạch |
| `npm run lint` | 0 | lint token 641 pass |
| `npm run test` | 0 | 149 file, 2107 pass, 133 skip (contract local-stack có sẵn), 0 lỗi chưa xử lý |
| `npm run build` | 0 | build PWA OK; precache 74 mục; chunk M02: `m02-trip`, `m02-content`, `m02-end`, `m02-qr-link`, `m02-scanner` (468 KB, chỉ khi mở scanner) |
| `npm run e2e -- --project=m02 --project=m02-cam-evil --repeat-each=2` | 0 | 94/94 (47 ca × 2) |
| `npm run e2e` | 0 | 111 pass, 47 skip (chỉ stack local), 0 fail |
| `git diff --check` (T101) | 0 | không lỗi khoảng trắng |

E2E M02 (`e2e/m02/`): `session-start` (V1–V4), `scan` (V1, V5–V8, V15, V23), `scan-evil` (V15 camera), `content` (V9–V12 + thiếu resource), `outside-closed` (V13–V14), `end` (V16–V19), `qr-link` (V20–V22), `sync` (V24–V26), `pwa-update` (V27), `no-presence-words` (V28, vi + en), `cross-tab`, `qr-link-chunks`.

## 3. `NOT RUN`

| Mục | Lý do | Ai chạy |
|---|---|---|
| T096 — LCP của `/q/Q1a` bằng Lighthouse profile di động (mục tiêu ≤ 2,5 s, research R-17) | Đo thủ công, cần Chrome DevTools trên bản build preview; phần tự động (không tải chunk scanner / màn M01 / M03) đã PASS ở `qr-link-chunks.spec.ts` | Chủ dự án |
| T100 — kiểm thủ công trên Android Chrome và iOS Safari thật (checklist §6) | Cần thiết bị thật | Chủ dự án |

## 4. Rà soát WCAG 2.1 AA (T097; design-system §6)

| Tiêu chí | Kiểm | Kết quả |
|---|---|---|
| 1.1.1 Nội dung không phải chữ | Ảnh có `alt` = tên đối tượng; ô placeholder `aria-hidden`; `<audio>`/`<video>` có `aria-label` "Âm thanh n"/"Video n"; số thứ tự journey `aria-hidden` (danh sách `<ol>` đã đọc thứ tự) | PASS |
| 1.3.1 Thông tin và quan hệ | Tiêu đề h1/h2 theo cấp; journey là `<ol>`; màn kết quả là `<ol>` | PASS |
| 1.4.1 Dùng màu | Trạng thái luôn có nhãn chữ ("Đã quét QR", "Chưa quét", thông báo có câu); vạch màu chỉ bổ sung | PASS |
| 1.4.3 Tương phản | Mọi màu lấy từ token (lint token 641 pass); cặp màu theo bảng design-system §5.3 (scanner và reader) | PASS (theo token) |
| 2.1.1 Bàn phím | Mọi hành động là `<button>`/`<a>`; **đã sửa**: Esc đóng scanner, Esc = [Đi tiếp] ở câu hỏi cuối chuyến (`QrScanner.test.tsx`, `EndFlow.test.tsx`) | PASS sau sửa |
| 2.4.3 Thứ tự focus | **Đã sửa**: mở scanner → focus vào "Đóng camera"; câu hỏi cuối chuyến → focus vào [Kết thúc] | PASS sau sửa |
| 2.4.7 Focus nhìn thấy được | `:focus-visible` dùng `--focus-ring-*` trên mọi nút/liên kết M02 | PASS |
| 2.5.5 Vùng chạm (mục tiêu dự án) | `min-height: var(--touch-target)` / `--touch-target-m01-primary` | PASS |
| 3.1.1 / 3.1.2 Ngôn ngữ | `document.documentElement.lang` theo ngôn ngữ hiển thị (FieldLayout); ô `lang` theo nội dung | PASS |
| 4.1.3 Thông báo trạng thái | Vùng thông báo `role="status"`; lỗi quét / tạm đóng / cần kết nối `role="alert"`; "Đang kiểm tra mã QR…" `role="status"`; scanner `role="dialog"`, câu hỏi cuối chuyến `role="alertdialog"` | PASS |

Chưa kiểm bằng trình đọc màn hình thật (TalkBack / VoiceOver) — nằm trong checklist §6.

## 5. Lệch so với tasks và quyết định khi cài đặt

| ID | Quyết định | Ở đâu |
|---|---|---|
| D-1 | Chữ chưa có trong bảng copy lấy từ mockup, bản tiếng Anh do agent đề xuất; chủ dự án duyệt 2026-11-04: tiêu đề "Chuyến đi" / "Your trip", "Cúc Phương Quest" (SCR-M02-004), "Hành trình", "Chưa quét", "Đã quét QR: {n}/{tổng} điểm", "Quét mã QR", "Đưa mã QR của điểm dừng vào khung.", "Đóng camera", "Thử lại", "Kết thúc chuyến" / "End trip" | `i18n/vi.ts`, `en.ts` |
| D-2 | Điểm `ONLINE_AVAILABLE` offline hiện "Điểm này cần có mạng để xem nội dung." (spec US-M02-03 mục 3, bảng copy SCR-M02-002); scan-resolution §2 dòng 6 và quickstart V10 đã sửa theo (chủ dự án duyệt) | `content/selectContentSource.ts` |
| D-3 | "Out of journey" không có thông báo riêng: không có chữ chốt | `content/ScanNotice.tsx` |
| D-4 | Chunk `/trip` nằm ở `session/` nên đặt alias `m02-session` → `m02-trip`; `@zxing` tính vào `m02-scanner` | `vite.config.ts` |
| D-5 | V23 giả lập camera bị từ chối bằng `getUserMedia` reject `NotAllowedError` (cờ camera giả luôn cấp quyền) | `e2e/m02/scan.spec.ts` |
| D-6 | Coordinator thêm alias trung tính `registerBusyWork` / `unregisterBusyWork` (cùng cơ chế giữ lock shared `cpq:busy` với form chưa lưu của M03) | `src/app/pwa/updateCoordinator.ts` |
| D-7 | Busy check M02 đăng ký đồng bộ trong effect khởi động của App (không qua `import()` động): trước đó bấm Cập nhật ngay sau khi mở trang có thể áp bản mới giữa phiên (V27 fail 1 lần) | `src/app/App.tsx` |
| D-8 | `useLiveValue` không trả giá trị của lần đọc với `deps` cũ (journey từng thoáng hiện "Chưa quét" ở mọi điểm khi vừa có phiên) | `storage/readers.ts` |
| D-9 | `QrLinkPage` và `useTripEntry` bỏ kết quả sau khi unmount và dùng chung một promise qua hai lần chạy effect của StrictMode (CI từng lỗi `window is not defined`) | `qr-link/QrLinkPage.tsx`, `session/TripPage.tsx` |
| D-10 | E2E: chờ hộp thoại kết thúc chuyến có style trước khi bấm (CSS chunk lazy tới muộn khi tải nặng); mock intake tự trả `internetdisconnected` khi offline (`page.route()` vẫn trả lời khi context offline); spec kết thúc phiên luôn mock intake để không gọi stack Supabase local đang chạy trên máy | `e2e/m02/*` |
| D-11 | `/q/…` được phép tải chunk khởi động `m01-offline-package-*` của shell (khôi phục thao tác gói dở, không render, không import `jsx-runtime`); chunk màn M01, M03 và `m02-scanner` không bao giờ được tải | `e2e/m02/qr-link-chunks.spec.ts` |

## 6. Checklist kiểm thủ công trên thiết bị thật (T100)

Chạy trên bản Preview hoặc Production đã deploy (HTTPS — camera cần secure context). Ghi PASS / FAIL kèm thiết bị, phiên bản OS và trình duyệt.

| # | Bước | Mong đợi | Android Chrome | iOS Safari |
|---|---|---|---|---|
| M1 | Start từ M01, vào `/trip`, bấm "Quét", cho phép camera, quét tem QR in thật | Camera sau mở; mã đầu tiên được nhận; "Đã ghi nhận lượt quét."; nội dung hiện | NOT RUN | NOT RUN |
| M2 | Từ chối quyền camera rồi bấm "Quét" | Thông báo camera cố định + "Thử lại"; cấp quyền lại trong cài đặt → "Thử lại" mở được | NOT RUN | NOT RUN |
| M3 | Dùng ứng dụng máy ảnh của điện thoại quét tem (không có phiên) | Trang `/q/…` mở thẳng nội dung theo ngôn ngữ máy, gợi ý khách tự do + "Chọn tuyến" | NOT RUN | NOT RUN |
| M4 | Như M3 nhưng có phiên trong cùng trình duyệt | Lượt ghé được ghi như quét trong app | NOT RUN | NOT RUN |
| M5 | Có phiên + gói tải trước, tắt mạng giữa chuyến, quét điểm `OFFLINE_REQUIRED` | "Chưa tải được nội dung mới…", nội dung gói, lượt ghé vẫn ghi | NOT RUN | NOT RUN |
| M6 | Kết thúc chuyến khi offline, rồi bật mạng | "Chờ gửi về hệ thống" → "Đã gửi về hệ thống" khi có mạng / mở lại app | NOT RUN | NOT RUN |
| M7 | Cài app lên màn hình chính (iPhone: Thêm vào MH chính), mở từ biểu tượng, lặp M1 | Hoạt động như trong trình duyệt; phiên mở trong Safari không được nhận trong app đã cài (spec SR-SCR-M02-004-003) | NOT RUN | NOT RUN |
| M8 | Audio/video ở điểm `ONLINE_AVAILABLE`, đổi VI/EN khi đang phát | Danh sách đổi ngay; tệp bị bỏ dừng phát; không tự phát | NOT RUN | NOT RUN |
| M9 | TalkBack / VoiceOver: đi qua `/trip`, scanner, nội dung, câu hỏi cuối chuyến | Thông báo quét được đọc; nút có tên; focus vào hộp thoại khi mở | NOT RUN | NOT RUN |
| M10 | Lighthouse profile di động trên `/q/Q1a` (T096) | LCP ≤ 2,5 s | NOT RUN | — |

## 7. Artifact upstream có nguy cơ stale (T101 — ghi lại, không tự sửa spec)

| # | Artifact | Ghi nhận |
|---|---|---|
| S-1 | spec-M02 SC-M02-013 và tasks T037 | **Đã xử lý 2026-11-04:** nhãn tiếng Anh thống nhất là "QR scanned" (spec-M02 3.3 clarification 2; `specs/002/spec.md`; tasks T037) |
| S-2 | screen spec SCR-M02-001, -004 (bảng copy) | **Đã xử lý 2026-11-04:** bảng copy có đủ các chữ của D-1 (SCR-M02-003 không cần thêm); `i18n/vi.ts`, `en.ts` lấy nguồn từ bảng copy |
| S-3 | research R-15 / tasks T092 | Không nêu coordinator cần API giữ lock theo id cho module khác M03; đã thêm alias (D-6) |
| S-4 | `src/modules/m01/architecture.test.ts` | Mẫu `storage/tables$` khớp mọi import `…/storage/tables` của module khác; M02 tránh bằng cách chỉ đọc bảng qua `storage/readers.ts` |
| S-5 | `src/modules/m03/editor/BilingualField.test.tsx` | Test chập chờn (CI #30, #32): `role="status"` "Đang dịch…" đôi khi biến mất trước khi test tìm — ngoài phạm vi M02. **Đã xử lý 2026-11-04 (#35):** bộ dịch giả chỉ trả kết quả khi test cho phép |
| S-6 | tasks T008 / field-ui-flow §1 | Gọi chunk `/trip` là `m02-trip` trong khi màn nằm ở `session/` (D-4) |
| S-7 | field-ui-flow §1 `/trip/end` | "chỉ khi có phiên vừa kết thúc": cài đặt dùng phiên từ router state, không có thì chuyến kết thúc gần nhất |

## 8. Tích hợp thật với M01 và M03 (Phase 11, T102–T106)

Chạy 2026-11-04 trên máy ở §1, Docker 29.9.2, Supabase CLI (stack local, không link cloud). `.env.local` trỏ tới stack local; base link QR `http://localhost:5173`.

| Task | Kết quả |
|---|---|
| T102 | Khớp. `m02/m01Port.ts` re-export đúng 9 export của `src/modules/m01/index.ts` (typecheck qua); `readSelectedRouteContext()` trả `NONE` / `INVALID` / `OK` (D-01); `registerBusyCheck` có trong `src/app/pwa/updateCoordinator.ts` (D-02). Không có gì báo package 001 |
| T103 | E2E chạy trên bản build có M01 thật (không có fakeM01Port; cổng giả chỉ dùng trong Vitest). Luồng M01 Start → `/trip` → phiên mới và nút VI/EN của trang `/q/…` ghi vào store của M01: PASS ở `integration.local.spec.ts` (V5, V20) |
| T104 | Đủ điều kiện: M03 T172, T190, T195 xong. M03 không tạo `e2e/.local-fixture.json` (validation-report M03 D-132), xem DV-1 |
| T105 | 9/9 PASS, chạy hai lần liên tiếp (bảng dưới). Job `local-stack` của CI (push lên `main`, chạy tay) có thêm bước `m02-local-stack`, như M01 |
| T106 | Đã điền cột "Tích hợp thật" trong [checklists/br-test-coverage.md](checklists/br-test-coverage.md). Không có mã HTTP ngoài bảng session-intake §3, nên không có đề xuất L-02 |

### Lệnh

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx supabase start` | 0 | stack local chạy |
| `npx supabase db reset` (chỉ local) | 0 | áp mọi migration tới `m03_04d_ingest_reports`, seed `supabase/seed.sql` |
| `npx supabase functions serve session-intake` | — (chạy nền) | phục vụ `session-intake`; GET trả 405 như contract |
| `PW_LOCAL_STACK=1 npx playwright test --project=m02-local-stack` | 0 | 9 pass (lần 1: 59,7 s; lần 2: 58,6 s) |
| `npx vitest run src/modules/m02` | 0 | 34 file, 238 pass |
| `npx playwright test --project=m02 --project=m02-cam-evil` | 0 | 47 pass |
| `npm run typecheck` | 0 | sạch |

### Kịch bản trên stack local (`e2e/m02/integration.local.spec.ts`)

| Kịch bản | Kiểm | Kết quả |
|---|---|---|
| V20 | `/q/{Q1a}` không phiên, `vi-VN`: nội dung thật, gợi ý khách tự do + "Chọn tuyến"; mọi request lookup chỉ có `p_qr_identifier`; 3 store M02 rỗng; bấm EN → `languagePreference` của M01 = `en`, chữ đổi ngay | PASS |
| V5 | Start từ M01 → một phiên `DANG_DIEN_RA` của tuyến thật; Q1a → một lượt ghé C1 (`qrIdentifier = Q1a`); Q1b (cùng điểm dừng) → nội dung riêng, không lượt ghé mới, hiện giờ ghé cũ; lookup luôn kèm `p_route_id` | PASS |
| V14 ROUTE | Quản lý tạm đóng tuyến (C-09 thật) giữa chuyến → thông báo tạm đóng, không nội dung, không lượt ghé | PASS |
| V14 CHECKPOINT | Mã của điểm dừng đang tạm đóng (C-10 thật) → cùng thông báo | PASS |
| V14 INVALID | Mã không tồn tại → "Mã không còn hiệu lực hoặc không tồn tại." | PASS |
| V24 ACCEPTED | Quét Q1a, điểm cuối Q2, [Kết thúc] → "Đã gửi về hệ thống", `SYNCED`, một dòng `app.session_records` | PASS |
| V24 mất response | M03 ghi nhưng trang không nhận response → `PENDING`; trang hiện lại → `IDENTICAL` → `SYNCED`; 2 lần POST, vẫn một dòng | PASS |
| V25 409 | M03 đã có phiên cùng `sessionId` khác nội dung → `CONFLICT`; trang hiện lại không gửi nữa; SCR-M02-001 hiện dòng lỗi E-SCR-M02-001-22 | PASS |
| V25 422 | M03 từ chối bản ghi (`contentVersion` không có snapshot) → `CONFLICT`, không gửi lại, dòng lỗi; không có dòng nào ở M03 | PASS |

### Lệch so với tasks

| # | Lệch | Lý do |
|---|---|---|
| DV-1 | Không dùng `e2e/.local-fixture.json`. Dữ liệu dựng phía Node trong `beforeAll` (`e2e/m02/localStack.ts`) bằng adapter Supabase thật của M03 (`seedCloseScenario`, thêm điểm tham quan thứ hai, tạm đóng điểm dừng), rồi đọc `qrIdentifier` do hệ thống sinh qua psql | M03 không tạo file này (M03 D-132); cùng cách với M01 (validation-report M01 DV-53) |
| DV-2 | "Quét" bằng link `/q/{mã}` khi có phiên, không bằng camera | `npm run dev` không có test hook; camera giả chỉ phát QR cố định trong khi mã do hệ thống sinh. Có phiên thì trang link đi cùng đường `processScan` với trình quét (US6, V21); camera đã kiểm ở project `m02` |
| DV-3 | V24 mất response và V25 dùng `page.route()` để bỏ response, giữ `PENDING`, hoặc sửa `contentVersion` trên đường đi. Phiên khác nội dung của 409 gửi phía Node qua chính `session-intake` | Không có cách tự nhiên để mất response hay có bản ghi bị từ chối; mọi kết quả 200 / 409 / 422 vẫn do Edge và DB thật trả |

Ngoài T105: V13 (mã ngoài hành trình), V6–V7 (mã thêm sau), audio/video và các nhánh offline chỉ kiểm bằng mock (cột "Tích hợp thật" ghi `NOT RUN`).
