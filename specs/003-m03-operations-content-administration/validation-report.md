# Validation report — 003 M03 Operations & Content Administration

Báo cáo kiểm chứng của giai đoạn triển khai code (runbook §13.4). Chỉ ghi lệnh đã chạy thật; phần chưa chạy ghi `NOT RUN`. Evidence lịch sử của bộ tài liệu không được dùng làm PASS cho code (runbook §10.1).

## 1. Đợt 2026-10-30/31 — Phase 1 (T002–T010) và Phase 2 (T011–T055)

### 1.1 Baseline và handoff (H0–H2)

| Mục | Giá trị |
|---|---|
| Remote | `origin` → `https://github.com/MckhueVanPhuc/Refactor-Cuc-Phuong` |
| Starting commit | `main` @ `4979d7a89e0209409fada8340f3bb9246510c935` (trùng `origin/main` sau `git fetch`), worktree sạch |
| Branch làm việc | `feat/m03-setup` (local, chưa push, chưa commit) |
| Reviewer / người nhận bàn giao | Chủ repo (người dùng phiên này) |
| H1 | Git 2.54.0.windows.1; Python `C:\Python314\python.exe` 3.14.4; `check_prerequisites.py --help` exit 0; Node v24.15.0, npm 11.12.1; Supabase CLI và Docker **chưa cài** (cần trước Phase 13) |
| H2 | `SPECIFY_FEATURE_DIRECTORY=specs/003-m03-operations-content-administration`, `check_prerequisites.py --json --require-tasks --include-tasks` exit 0; checklist `requirements-quality.md` 29/29 |

### 1.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm install` | 0 | 457 gói; phiên bản ghi ở research.md R-02 "Phiên bản đã cài" |
| `npm ls --depth=0` | 0 | Đúng phiên bản pin |
| `npm audit` | — | 4 lỗi mức thấp (`deepmerge` → `workbox-build`, chỉ lúc build); không áp `audit fix --force` |
| `npm run ci` (`typecheck` → `lint` → `test` → `build`) | 0 | Lần cuối 2026-10-31 sau D-1: typecheck sạch; lint 150 test pass; test 28 file, 441 pass, 2 `todo`; build PWA `generateSW`, precache 11 mục |
| `npm run e2e` | 0 | Chưa có spec (`--pass-with-no-tests`) |
| `vite build --mode fake` (thư mục tạm, đã xóa) | 0 | Có chunk `fakeAdminApi`, `e2eHooks` |
| Quét `dist/` production tìm adapter giả / `__cpqTestHooks` / `example.test` | — | Không có (đúng T007, T044) |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

Test viết trước và đã chạy thấy fail (không resolve được module) trước khi cài đặt, ở mỗi nhóm: B3, B4, B5, B6, B7 và T050.

### 1.3 `NOT RUN`

| Mục | Lý do |
|---|---|
| `supabase/config.toml` được Supabase CLI đọc (`supabase start`) | Máy chưa có Supabase CLI/Docker; kiểm ở Phase 13 |
| Adapter Supabase (`supabaseAdminApi.ts`) gọi RPC/Edge/Storage thật | Giai đoạn B; T197 chạy lại bộ `api/contract/*.contract.ts` với adapter này |
| Playwright có trình duyệt (`npx playwright install`) và E2E thật | Chưa có spec E2E nào; spec bắt đầu từ US1 |
| Job CI trên GitHub | Chưa push |

### 1.4 Lệch so với tasks và điểm cần quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-1 | Router: `useBlocker` (T050, R-20) và `errorElement` (T046) chỉ chạy trong data router (đã xác minh trên react-router 8.5.1), trong khi tech-stack chọn declarative mode | **Đã giải quyết 2026-10-31** — người dùng chọn chuyển sang data mode (`createBrowserRouter(createRoutesFromElements(...))` + `RouterProvider`). Đồng bộ: tech-stack §3, §14; plan.md và research.md của 001, 002, 003; mô tả T018. Code: `src/app/router.tsx`, `src/app/App.tsx`; T050 cài bằng `useBlocker` |
| D-2 | T046: lỗi tải chunk | Đã chuyển sang `errorElement` (`RouteErrorPage`: chunk lỗi → MSG-NETWORK-FAILED, lỗi khác → MSG-GENERIC); bỏ `ChunkErrorBoundary` |
| D-3 | Phía server không điền được `{tên tệp}` trong MSG-FILE-TYPE / MSG-FILE-TOO-BIG (và MSG-RIGHTS-NOT-CONFIRMED, MSG-AV-LANGUAGE-MISSING, MSG-IMAGE-NOT-READABLE sau này): Physical §5.5 `app.media` không lưu tên tệp gốc, object name là UUID. Client kiểm trước với tên thật; adapter giả tạm dùng "tệp vừa tải lên". | **Đã giải quyết 2026-10-31** — người dùng chọn (b): chấp nhận câu phía server không có tên tệp gốc; client kiểm trước với tên thật. Không đổi spec, S4 hay Physical. Cách điền thay thế ở §3.3 D-16 |
| D-4 | T044: phần AuthService của `AdminApiProvider` để T065 (interface AuthService được định nghĩa ở T065) | Ghi nhận |
| D-5 | `store.contract.ts`: ca STALE và FORBIDDEN theo role là `it.todo` vì giai đoạn nền chưa có command nào có `expected` hoặc chỉ dành cho Quản lý; thêm ở US1 (T061, với C-18/C-19). FORBIDDEN cho danh tính không có tài khoản đã kiểm qua C-04 | Ghi nhận |
| D-6 | Contract nội bộ M03: tên trường `leftOutCheckpoints[] {name, reason}`, `leftOutQrObjects[] {name, missing}` và hình dạng DTO query trong `adminDtos.ts` do plan quyết (spec chỉ nêu nội dung) | Plan decision; T197 đối chiếu với migration |
| D-7 | Thêm 4 dev dependency ngoài T003 (`@testing-library/dom`, `@types/react`, `@types/react-dom`, `@types/node`); TypeScript 7.0.2 | Người dùng duyệt 2026-10-30 |
| D-8 | Token tên do triển khai đặt cho giá trị design-system chưa có tên (§4: cỡ chữ, viền, vùng chạm, thời lượng; sidebar 212px trong khoảng 200–220px) và token điều khiển theo bề mặt (`--control-accent`, `--control-border-color`, `--focus-ring-color`) | Giá trị giữ nguyên tài liệu |

### 1.5 Checkpoint Phase 2

"Nền sẵn sàng" **đạt**: T001–T055 xong và có bằng chứng ở §1.2. Còn mở: các mục `NOT RUN` ở §1.3 (D-3 đã giải quyết 2026-10-31).

## 2. Đợt 2026-10-31 — Phase 3 US1 Quản lý truy cập (T056–T072)

Branch `feat/m03-us1` tạo từ `feat/m03-setup` @ `32e188c`. Test viết trước và đã chạy thấy fail trước khi cài đặt.

### 2.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch; lint 193 test pass; test 35 file, 538 pass, 0 `todo` (hai ca STALE/FORBIDDEN của `store.contract` đã thành test thật qua C-19); build xong |
| `npx playwright install chromium` | 0 | Tải trình duyệt cho E2E local |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | `e2e/m03/auth.spec.ts`: Q1–Q5 pass (5), 1 `fixme` (xem D-10) |
| Quét `dist/` production tìm adapter giả, mật khẩu synthetic, `example.test`, `__cpqTestHooks` | — | Không có |

Lỗi thật tìm được nhờ E2E và đã sửa: StrictMode chạy effect hai lần làm `AdminServicesProvider` tạo hai store giả (bản Supabase sẽ là hai client); nay dịch vụ được tạo một lần cho mỗi lần tải trang.

### 2.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| `auth/session.ts` (Supabase Auth: đăng nhập, link mời/khôi phục qua `detectSessionInUrl`, `updateUser`) | Giai đoạn B trên stack local; cách nhận diện link trong URL cần kiểm với Supabase CLI thật |
| `api/adminAccountsEdge.ts` gọi Edge `admin-accounts` thật | Edge Function là giai đoạn B (T195/T196); đã test bảng ánh xạ `result` → messageKey |
| Q5 phần "RPC bằng access token cũ bị từ chối" ở server | Adapter giả mô phỏng bằng phiên bị xóa; kiểm thật bằng `app.current_admin()` ở pgTAP giai đoạn B |

### 2.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-9 | T071 ghi "khóa/mở khóa với hộp xác nhận", nhưng BR-M03-L12 (spec-M03, canonical) chỉ cho hộp xác nhận khi đóng, mở lại, lưu trữ, thu hồi, hủy mục chưa xuất bản, xuất bản và rời editor; §5.6 cũng không có câu MSG-CONFIRM cho tài khoản | Làm theo spec: không có hộp xác nhận. Đã sửa câu chữ T071 trong tasks.md cho khớp spec (người dùng duyệt 2026-10-31) |
| D-10 | Q5 phần hộp thoại MSG-UNSAVED-CHANGES khi đăng xuất từ form chưa lưu cần một editor thật | `test.fixme` trong E2E; hành vi đã kiểm ở `auth/useSignOut.test.tsx`; bật lại khi có editor ở US2 |
| D-11 | Thiết kế đăng xuất: nút "Đăng xuất" điều hướng tới `/admin/login` trước, để guard rời trang của editor hỏi trước; chỉ khi rời đi màn đăng nhập mới hủy request đang bay và `signOut({ scope: 'local' })` | Đáp ứng auth-account §2.6 bước 1–4 |
| D-12 | Phiên hết hạn (T070): state form cất vào `sessionStorage` (khóa theo form), về đăng nhập với thông báo MSG-SESSION-EXPIRED, đăng nhập xong quay lại trang cũ; `useDraftForm({ restoreKey })` lấy lại và coi là chưa lưu | Editor của các story sau cần truyền `restoreKey` |
| D-13 | Kết quả thành công của Edge `link` và C-18/C-19 không có câu thông báo riêng trong §5.6; dùng `MSG-SAVED` làm khóa nội bộ nhưng UI không hiển thị (bảng tự cho thấy thay đổi; nhận lời mời thì chuyển màn) | Ghi nhận |
| D-14 | Adapter giả: tài khoản khóa theo email (tài khoản chờ nhận lời mời chưa có `userId`); thêm auth provider giả với hộp thư (`?fake_token=`) thay Inbucket | Chỉ ảnh hưởng adapter giả |

## 3. Đợt 2026-10-31 — Phase 4 US2 Điểm dừng và điểm tham quan (T073–T094)

Branch `feat/m03-us2` tạo từ `feat/m03-us1` @ `070768a`. Test viết trước và đã chạy thấy fail trước khi cài đặt: validation (T073–T074, không resolve được module), contract `checkpoints` (T081, 24 ca fail vì khu vực còn `pending`), component (T075–T080, 31 ca fail).

### 3.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch; lint 241 test pass; test 43 file, 675 pass; build xong. Chạy liền 3 lần đều pass sau khi sửa test chập chờn (§3.3 D-23) |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | 11 pass: `auth.spec.ts` Q1–Q5 (6, gồm ca Q5 đăng xuất từ editor chưa lưu trước là `fixme`, D-10) và `checkpoints.spec.ts` Q6–Q10 (5). Chạy lại lần hai: 11 pass |
| Quét `dist/` production tìm adapter giả, `__cpqTestHooks`, `example.test`, mật khẩu synthetic, helper seed | — | Không có |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 3.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Q9: decode ảnh QR thật ra đúng link bằng `@zxing/browser` | Gói chưa được cài (M02 T003). E2E đã kiểm SVG có đủ các dòng chữ và PNG rộng ≥ 1024 px (đọc IHDR); unit test kiểm chuỗi truyền vào `qrcode`, mức `Q`, lề 4 module |
| Adapter Supabase cho C-02, C-03, C-05, C-07, C-16, C-17, Q-05…Q-08 | Giai đoạn B (T181, T183); T197 chạy lại `checkpoints.contract.ts` với adapter này |
| Ca `fakeOnly` của `checkpoints.contract.ts` (va chạm identifier, ảnh không đọc được) trên stack local | Cần cách tiêm lỗi riêng ở giai đoạn B |

### 3.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-15 | Giới thiệu có chữ nhưng ngắn hơn `QR_INTRO_MIN_CHARS`: DAC-M03-052 chỉ nói "incomplete blocks publication", §5.6 không có câu riêng. Dùng MSG-MISSING-FIELD với `{tên ô}` = "Giới thiệu (tiếng Việt) (ít nhất 30 ký tự)", mức BLOCKS_PUBLISH | Ghi nhận; không thêm khóa mới vào danh mục |
| D-16 | Theo D-3 (b), câu phía server cần `{tên tệp}` (MSG-IMAGE-NOT-READABLE, MSG-RIGHTS-NOT-CONFIRMED, MSG-AV-LANGUAGE-MISSING) điền nhãn thay thế "{điểm tham quan} – ảnh {n}" / "– âm thanh/video {n}"; editor dùng tên tệp gốc khi tệp vừa tải trong phiên. MSG-FILE-TYPE / MSG-FILE-TOO-BIG phía server giữ "tệp vừa tải lên" | Ghi nhận |
| D-17 | Contract nội bộ (plan decision): thêm `VisitPointEditor.checkpointStatus` (Q-07) để editor biết khi nào xuất bản riêng `QR_OBJECT`; `ExpectedRevisions` nhận `undefined`; nhãn `FIELD_LABELS.CHECKPOINT.visitPoints` = "Danh sách điểm tham quan" cho khoảng trống "ít nhất một điểm tham quan sẵn sàng"; lý do thiếu/quá dài ở C-07, C-16 trả BLOCKED MSG-MISSING-FIELD / MSG-LIMIT-TEXT với "Lý do" | T197 đối chiếu với migration |
| D-18 | "In lại" (C-17) chỉ ghi audit, không có câu thông báo (§5.6 không có câu cho ghi nhận in lại) — giống D-13 | Ghi nhận |
| D-19 | Adapter giả: `reviewedConcurrencyRevision` của đơn vị = tổng `concurrencyRevision` của thực thể và bản nháp trong đơn vị (điểm dừng lần đầu gồm mọi điểm tham quan Nháp), nên mọi lần lưu trong đơn vị sau khi mở review đều thành STALE | Chỉ adapter giả; T183 chốt cách tính ở SQL |
| D-20 | MSG-AV-ONE-LANGUAGE (chỉ cảnh báo) đi qua `PublicationReview.impactNotes` vì contract không có trường riêng | Ghi nhận |
| D-21 | Ngoài phạm vi US2 và để lại cho story sau: nút "Xuất bản" trên editor điểm dừng chỉ hiện khi `NHAP` (`CHECKPOINT_REVISION` ở US4 T119/T122); thu hồi QR chưa dựng phiên bản hành trình mới cho tuyến liệt kê điểm dừng (US4 T119); C-07 cho tuyến báo khu vực chưa cài (T102); Đóng tạm / Mở lại / Lưu trữ (US6 T140); `affectedRoutes` trên review (T113, T117) | Theo tasks |
| D-22 | Một CSS dùng chung `editor/EditorLayout.module.css` cho bố cục danh sách/editor/review; `.module.css` riêng của từng màn chỉ chứa phần riêng | Hình thức, giá trị lấy từ token |
| D-23 | Ca đầu tiên của `VisitPointEditorPage.test.tsx` thỉnh thoảng fail khi chạy cả bộ (chunk lazy nạp chậm hơn thời gian chờ 1 s của `findBy*`). Sửa: các file test UI mới nạp sẵn module màn trong `beforeAll` | Đã sửa; 3 lần `npm run ci` liên tiếp pass |

### 3.4 Checkpoint Phase 4

"US1 và US2 chạy độc lập" **đạt** trên adapter giả: T056–T094 xong; Q1–Q10 pass. Còn mở: các mục `NOT RUN` ở §3.2.

## 4. Đợt 2026-10-31 — Phase 5 US3 Tạo và xuất bản tuyến (T095–T114)

Branch `feat/m03-us3` tạo từ `feat/m03-us2` @ `9661b4b`. Test viết trước và đã chạy thấy fail trước khi cài đặt: validation (T095–T097, không resolve được module), contract `publish-route` (T100, 16 ca fail vì khu vực routes còn `pending`), component (T098–T099, không resolve được module màn).

### 4.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch; lint 284 test pass; test 798 pass; build xong (sau D-25) |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | 14 pass: Q1–Q5 (6), Q6–Q10 (5), Q11–Q13 (3); Q12/Q13 chọn ảnh đại diện trước lần lưu đầu (D-25). Lần chạy đầu Q3 (US1, không đổi ở đợt này) fail một lần vì không thấy banner `role=status` khi dev server còn nguội; hai lần chạy lại đều 14/14 pass |
| Quét `dist/` production tìm adapter giả, `__cpqTestHooks`, `example.test`, mật khẩu synthetic, helper seed | — | Không có |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 4.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Adapter Supabase cho C-01, C-07 (tuyến), Q-02…Q-04, C-05 `ROUTE_FIRST_PUBLICATION`; view `api.published_routes`, `api.active_journey_snapshots` | Giai đoạn B (T183, T184); T197 chạy lại `publish-route.contract.ts` với adapter này, control `readPublication` đọc hai view |
| Ca `fakeOnly` của `publish-route.contract.ts` (tiêm lỗi, giữ khóa, phóng dung lượng media, đặt thẳng trạng thái điểm dừng) trên stack local | Cần cách tiêm lỗi riêng ở giai đoạn B; đóng điểm dừng thật có ở US6 |
| Q3 chập chờn một lần (§4.1) | Đã tìm ra và sửa ở §5.3 D-42 |

### 4.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-24 | Contract nội bộ (plan decision): C-01 thêm `mediaSettings[] {mediaId, usageRightsConfirmed}` vì BR-M03-F11 yêu cầu lần lưu ghi cả tick quyền từng ảnh mà input C-01 chưa có chỗ; `ContractControls.readPublication` đọc dòng Published Route và snapshot active (bản Supabase đọc hai view) | **Đã giải quyết 2026-10-31** — người dùng chọn giữ tick quyền từng tệp đúng spec-M03 §6.3, §8 ("confirmed file by file") và SF-M03-004-10; phương án một tick chung bị bỏ vì trái spec. Giữ `mediaSettings` trong C-01 |
| D-25 | Ảnh của tuyến phải thuộc một tuyến đã tồn tại (C-04), mà `routeId` chỉ có từ lần lưu đầu (BR-M03-B01) | **Đã giải quyết 2026-10-31** — người dùng chọn cách 1: trên form tuyến mới, ảnh chọn được ngay, kiểm trước ở client và giữ trên form; một lần "Lưu bản nháp" chạy C-01 tạo tuyến → tải + C-04 từng ảnh → C-01 lưu lại kèm ảnh (`route-admin/firstSave.ts`). Lần lưu đầu có hai dòng audit `ROUTE_DRAFT_SAVED`; ảnh lỗi không chặn ảnh khác, tuyến vẫn được tạo và MSG-UPLOAD-SUMMARY nêu tệp lỗi. Không đổi contract hay tài liệu. Ảnh chọn trước khi phiên hết hạn không giữ được nội dung tệp qua `sessionStorage`, nên được báo là chưa tải được |
| D-26 | Thiếu tick "không có cảnh báo an toàn": trên editor là một dòng MSG-SAFETY-CONFIRM ở panel; trên review là ô tick riêng (không nằm trong `blockingIssues`); C-05 không có tick → BLOCKED MSG-SAFETY-CONFIRM. Tick được lưu vào nội dung khi xuất bản (BR-M03-C09) | Ghi nhận |
| D-27 | Gói tải trước vượt trần ở review là một dòng MSG-OFFLINE-TOO-BIG trong `blockingIssues`; C-05 trả BLOCKED MSG-OFFLINE-TOO-BIG với `values` (tên tuyến, số MB, tối đa, ba ảnh nặng nhất "{điểm tham quan} – ảnh {n} ({x} MB)") | Ghi nhận |
| D-28 | `leftOutCheckpoints[].reason` dùng tên trạng thái ("Đang tạm đóng", "Chưa xuất bản", "Đã lưu trữ"); review hiện MSG-CHECKPOINT-LEFT-OUT | Ghi nhận |
| D-29 | Trường một dòng (tên, mô tả ngắn, chú thích, điểm nổi bật) bỏ CR/LF khi gõ và khi lưu thay vì báo lỗi — §5.6 không có câu cho CR/LF; nhãn trong một nhóm được khử trùng lặp khi lưu; quá `ROUTE_HIGHLIGHTS_MAX_ITEMS` điểm nổi bật bị chặn ở UI (nút thêm tắt), server trả FAILED | Ghi nhận |
| D-30 | `durationMin` kiểm > 0 và ≤ 1440 nhưng không kiểm số lẻ (MSG-NUMBER-DECIMALS chỉ nói "1 chữ số"); ô nhập là số | Ghi nhận |
| D-31 | Adapter giả: điểm dừng mới thêm vào danh sách phải `HOAT_DONG` (BR-M03-T01), điểm dừng đã có trong bản nháp/bản xuất bản thì giữ được dù đã đóng | Theo spec |
| D-32 | "Tạo điểm dừng mới" ở bước 4 cất state form (khóa của editor) rồi mở SCR-M03-008; mở lại editor tuyến thì lấy lại state | Theo T112 |
| D-33 | Ngoài phạm vi US3, để lại cho story sau: nút "Xuất bản" của tuyến chỉ hiện khi `NHAP` (`ROUTE_INFORMATION` ở US4 T119/T122); Đóng tạm / Mở lại / Lưu trữ (US6 T140); lịch sử/khôi phục (US8 T150) | Theo tasks |
| D-34 | Helper E2E dùng chung tách ra `e2e/m03/flows.ts` (tạo và xuất bản điểm dừng); `MediaThumbnail` tách ra `media/` để editor tuyến và điểm tham quan dùng chung | Tái cấu trúc nhỏ |

### 4.4 Checkpoint Phase 5

"US1–US3 chạy độc lập; có thể tạo điểm dừng → tuyến → xuất bản trên adapter giả" **đạt**: T056–T114 xong; Q1–Q13 pass. Còn mở: các mục `NOT RUN` ở §4.2.

## 5. Đợt 2026-10-31 — Phase 6 US4 Sửa dữ liệu đã xuất bản (T115–T122)

Branch `feat/m03-us4` tạo từ `feat/m03-us3` @ `517a58d`. Test viết trước và đã chạy thấy fail trước khi cài đặt: contract `publish-revise` (T116, 12/14 ca fail; hai ca bản nháp chờ và STALE đã đúng từ US2–US3), component (T115, T117, 6 ca fail).

### 5.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch; lint 292 test pass; test 830 pass; build xong |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | 18 pass: Q1–Q17. Sau khi sửa Q3 (D-42): 4 lần chạy liên tiếp, mỗi lần dev server khởi động mới, đều 18/18 |
| Quét `dist/` production tìm adapter giả, `__cpqTestHooks`, `example.test`, mật khẩu synthetic, hook seed E2E | — | Không có |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 5.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Hai lệnh xuất bản chạy thật sự đồng thời (Q16) | Adapter giả chạy tuần tự; BUSY được giả lập bằng `holdLock`. Khóa tập thật (advisory lock) kiểm ở pgTAP T186 |
| Adapter Supabase cho `ROUTE_INFORMATION`, `CHECKPOINT_REVISION`, `QR_OBJECT` có tuyến bị ảnh hưởng, C-16 dựng lại hành trình | Giai đoạn B (T186); T197 chạy lại `publish-revise.contract.ts` |

### 5.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-35 | Adapter giả: `reviewedConcurrencyRevision` của đơn vị điểm dừng/QR còn cộng `concurrencyRevision` của các tuyến bị ảnh hưởng, để một lần xuất bản tuyến xen giữa cũng làm review cũ thành STALE | Chỉ adapter giả; T186 chốt ở SQL |
| D-36 | `ROUTE_INFORMATION` của tuyến `HOAT_DONG` mà hành trình mới không còn điểm dừng hoạt động → BLOCKED MSG-ROUTE-LAST-CHECKPOINT (BR-M03-T05); panel editor vẫn hiện MSG-NO-ACTIVE-CHECKPOINT. Tuyến `TAM_DONG` được xuất bản với hành trình rỗng (publication-public §3: chỉ được rỗng khi tuyến không `HOAT_DONG`) | Theo spec |
| D-37 | T120 "Tải lại sau xác nhận": bấm "Tải lại" trên banner MSG-STALE chính là xác nhận; nạp bản mới nhất và bỏ chữ đang gõ (trước đó chữ vẫn trên màn hình để sao chép). Không thêm hộp thoại vì BR-M03-L12 không cho | Ghi nhận |
| D-38 | MSG-ROUTE-BUSY của bản sửa điểm dừng gọi điểm dừng bằng tên đang công khai, không phải tên nháp chưa xuất bản | Ghi nhận |
| D-39 | Câu hậu quả cho từng tuyến trên review (BR-M03-F02 b, X03) không có trong danh mục §5.6: "Gói tải trước của du khách cần cập nhật; các chuyến đang đi không bị thay đổi.", "Hành trình của tuyến không đổi.", "Tuyến sẽ tự đóng tạm." (ví dụ của X03), kèm trạng thái tuyến và dung lượng ước tính; MSG-AFFECTED-ROUTES và MSG-REPRINT-MODE-CHANGED đi qua `impactNotes` | Dùng từ vựng §5.4; không có từ cấm |
| D-40 | So sánh snapshot (research R-10) trên `checkpoints`, `offlineRouteMap`, `estimatedOfflineSizeBytes`; bỏ `contentVersion`, `previousContentVersion`, `publishedAt` | Ghi nhận |
| D-41 | Thu hồi QR (C-16) nay dựng lại hành trình cho mọi tuyến liệt kê điểm dừng và chuyển cùng lúc, không bị trần chặn (BR-M03-E09, X02, G10) — phần US2 để lại cho T119. Bảng "Thay đổi" của review tuyến (lần đầu và bản sửa) dùng chung một hàm so sánh nên lần đầu liệt kê đủ các trường | Ghi nhận |
| D-42 | Q3 (US1) chập chờn ở §4.1 và lần đầu đợt này: RouterProvider chạy điều hướng trong transition, nên khi chunk lazy của trang khôi phục còn đang tải (dev server nguội), trang đăng nhập vẫn hiện và test gõ email vào ô của trang đăng nhập. Sửa test: chờ tiêu đề "Khôi phục mật khẩu" trước khi gõ. Ứng dụng không lỗi | Đã sửa |
| D-43 | E2E Q14–Q17 dựng sẵn điểm dừng và hai tuyến đã xuất bản qua test hook `seedSharedRoutes`; phiên thứ hai (Q14) qua `reviseRouteAs`; ảnh nặng (Q17) qua `inflateLatestMedia`. Phần sửa, review, xuất bản, STALE, BUSY chạy qua giao diện | Chỉ MODE `fake` |

### 5.4 Checkpoint Phase 6

"US1–US4 chạy độc lập" **đạt** trên adapter giả: T056–T122 xong; Q1–Q17 pass. Còn mở: các mục `NOT RUN` ở §5.2.

## 6. Đợt 2026-11-01 — Phase 7 US5 Phản hồi validation rõ ràng (T123–T129)

Branch `feat/m03-us5` tạo từ `main` @ `8022f11` (đã merge PR #3, US1–US4). Phần lớn hành vi đã có từ Phase 2; story này kiểm chứng xuyên màn hình. Test viết trước và đã chạy trước khi cài đặt:

- T126 `editor/confirmations.test.ts`: fail (không resolve được `./confirmations`) → qua sau T127.
- T125 `editor/noAutosave.test.tsx`: 1 ca fail — lỗi thật D-44 → qua sau khi sửa. Gỡ bản sửa thì 2 ca fail (đã thử lại).
- T124 `editor/serverIssueMapping.test.tsx`, T123 `e2e/m03/forbidden-words.spec.ts`, phần mới của `messages/fieldLabels.test.ts` (T129): qua ngay vì hành vi đã có. Để chắc test không chạy suông, đã thử phá có chủ đích: bỏ issue server khỏi editor tuyến → T124 fail; đổi sai loại mục trong bảng nguồn issue → T129 fail; T123 có thêm ca kiểm bộ quy tắc quét trên mẫu vi phạm biết trước.

### 6.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run typecheck` | 0 | sạch |
| `npm run lint` | 0 | 296 test pass |
| `npm run test` (mặc định của Vitest, máy 20 luồng) | 1 | 868–870/871 pass; 1–4 ca fail mỗi lần, mỗi lần một file khác, đều do chờ quá lâu (`findBy*` 1 s hoặc 5 s): D-46. Cùng lệnh trên `main` @ `8022f11` (chưa có thay đổi đợt này): 826/830, 4 ca fail cùng kiểu |
| `npx vitest run --maxWorkers=6` | 0 | 871/871 pass, hai lần liên tiếp (~54 s mỗi lần) |
| `npm run ci` sau khi đặt `maxWorkers: 6` trong `vitest.config.ts` (D-46) | 0 | 3 lần liên tiếp: typecheck sạch; lint 296 pass; test 871/871 pass; build xong |
| `npm run build` | 0 | xong |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | 20 pass: Q1–Q17 và Q18 (2 ca: kiểm bộ quét, quét mọi màn) |
| Quét `dist/` production tìm `__cpqTestHooks`, `example.test`, mật khẩu synthetic, hook seed E2E, adapter giả | — | Không có |
| `git diff --check` (gồm file mới) | 0 | Không lỗi khoảng trắng |

### 6.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| CI trên GitHub cho nhánh này | Chưa push |
| Issue `VALIDATION` thật từ server cho ba editor | T124 giả lập kết quả của C-01/C-02/C-03; adapter Supabase ở giai đoạn B (T197) |

### 6.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-44 | Lỗi có từ US2–US3: ảnh vừa tải mang dòng MSG-UPLOADED-NOT-SAVED **cả sau khi** bản nháp đã lưu thành công (BR-M03-E14: chỉ "until then"). Sửa: `MediaUploader` nhận `savedMediaIds` (media mà bản nháp, hoặc bản xuất bản khi không có nháp, đang tham chiếu); editor điểm tham quan và ba ô ảnh của editor tuyến truyền vào | Đã sửa; T125 phủ cả hai editor |
| D-45 | `editor/confirmations.ts`: danh sách khép kín 12 loại xác nhận → khóa §5.6 + hai nhãn nút. Đóng điểm dừng không có khóa MSG-CONFIRM-*: dùng MSG-CLOSE-AFFECTS-ROUTES và `autoCloseSentence` (MSG-CLOSE-ROUTE-AUTO). Nhãn nút không có trong spec/screen spec: giữ nhãn đã dùng từ US2–US4; đóng/mở lại/lưu trữ dùng tên hành động của SCR-M03-001/008 ("Đóng tạm", "Mở lại", "Lưu trữ") với nút an toàn "Không đóng"/"Không mở lại"/"Không lưu trữ" theo mẫu "Không hủy". Bảy hộp hiện có đã chuyển sang `confirmation()`; test quét mã nguồn chặn hộp mới tự dựng | Hình thức; US6 dùng cho T136–T139 |
| D-46 | Vitest chập chờn khi chạy cả bộ với số worker mặc định trên máy 20 luồng: mỗi file một jsdom, quá tải làm chunk lazy và render chậm hơn thời gian chờ. Có từ trước đợt này (xem `main` ở §6.1). Đã áp cách của D-23 cho `routes.test.tsx`, `accounts/AccountsPage.test.tsx` (nạp sẵn chunk) và hai ca đầu `RouteEditorPage.test.tsx` (`findBy*` sau điều hướng); hai file test mới đặt timeout 15 s. Chưa hết hẳn. Người dùng duyệt 2026-11-01: đặt `maxWorkers: 6` trong `vitest.config.ts` | Đã sửa; `npm run ci` 3 lần liên tiếp exit 0 |
| D-47 | T128: không còn chỗ render mã thô; câu chữ cố định còn lại là nhãn màn hình theo screen spec (trạng thái rỗng, dòng hậu quả trên review D-39), không phải thông báo của danh mục §5.6. Thông báo đi qua `formatMessage` (cùng hàm `Message.tsx` dùng) vì tiêu đề hộp thoại và prop `error` cần chuỗi; không viết lại sang `<Message>` | Ghi nhận |
| D-48 | T129: mọi `targetFieldKey` của validation dùng chung và phần kiểm riêng của adapter giả đều đã có nhãn; không thêm nhãn mới. `makeIssue` vẫn ném lỗi khi thiếu nhãn | Ghi nhận |
| D-49 | Q18 import `DISPLAY_NAMES`, `NEVER_SHOWN_WORDS` từ `src/modules/m03/messages/displayNames.ts` để danh sách từ cấm và mã enum có một nguồn; mã ngôn ngữ `vi`/`en` không quét (là nội dung). Điều hướng bằng `spaNavigate` làm React Router in cảnh báo `useBlocker` trên POP trong log dev server; không ảnh hưởng kết quả | Ghi nhận |

### 6.4 Checkpoint Phase 7

"US1–US5 chạy độc lập" **đạt** trên adapter giả: T056–T129 xong; Q1–Q18 pass. Còn mở: các mục `NOT RUN` ở §6.2.

## 7. Đợt 2026-11-01 — Phase 8 US6 Đóng và mở lại (T130–T140)

Branch `feat/m03-us6` tạo từ `feat/m03-us5` @ `3958031` (PR #4 chưa merge; US6 dùng `editor/confirmations.ts` của US5). Test viết trước và đã chạy thấy fail trước khi cài đặt:

- T133 `api/contract/operations.contract.ts`: 15/15 ca fail, lý do "Adapter giả chưa có …: khu vực operations — T135".
- T130–T132 `operations/{Close,Reopen,Archive}Dialog.test.tsx`: 5 ca fail (không có nút "Đóng tạm", adapter chưa có) và một file không resolve được `./ReopenDialog`.
- T134 `e2e/m03/operations.spec.ts`: 3/3 fail vì chưa có test hook `seedCloseScenario`.

### 7.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | 2 lần liên tiếp: typecheck sạch; lint 316 pass; test 916/916 pass; build xong. Sau khi sửa D-51, D-55: 919/919 pass |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | 23 pass: Q1–Q21. Lần chạy đầu Q21 fail do chính test (`getByRole('button', { name: 'Mở lại' })` khớp cả "Không mở lại"); sửa test bằng `exact: true` |
| Quét `dist/` production tìm `__cpqTestHooks`, `seedCloseScenario`, `example.test`, mật khẩu synthetic, adapter giả | — | Không có |
| `git diff --check` (gồm file mới) | 0 | Không lỗi khoảng trắng |

### 7.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Adapter Supabase cho C-09…C-15, Q-09; khóa tập thật, transaction đóng điểm dừng + snapshot | Giai đoạn B (T188); T197 chạy lại `operations.contract.ts` với adapter này |
| Ca `fakeOnly` của `operations.contract.ts` (trần dung lượng khi đóng/mở lại, BUSY, MSG-CLOSE-FAILED, ảnh không đọc được) trên stack local | Cần cách tiêm lỗi riêng ở giai đoạn B |
| CI trên GitHub cho nhánh này | Chưa push |

### 7.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-50 | Danh mục §5.6 không có câu báo thành công cho đóng tạm / mở lại / lưu trữ. Adapter giả trả `messageKey: 'MSG-SAVED'` như C-16 (US2); UI không hiện câu đó mà nạp lại để trạng thái mới ("Tạm đóng", "Đang hoạt động", "Đã lưu trữ") tự nói lên kết quả. Chỉ kết quả không thành công hiện banner | Ghi nhận; giai đoạn B chọn `messageKey` thành công khi viết RPC |
| D-51 | Mục đổi trạng thái trong lúc hộp thoại đang mở (ví dụ người khác vừa đóng tuyến): trước đây danh sách đọc `concurrencyRevision` ngay trước khi gửi nên chỉ nhận FAILED MSG-GENERIC. **Đã quyết 2026-11-01** (người dùng ủy quyền): hộp thoại đọc phiên bản lúc **mở** (`useExpectedRevision`); mọi lần đổi trạng thái đều tăng phiên bản nên lần gửi bị STALE và hiện MSG-STALE kèm "Tải lại" (BR-M03-F06, L05). Không thêm khóa §5.6, không đổi contract. FAILED MSG-GENERIC chỉ còn cho ca không lường trước | Đã sửa; `CloseDialog.test.tsx` phủ |
| D-52 | Tuyến tự đóng khi đóng điểm dừng có dòng audit riêng `ROUTE_AUTO_CLOSED` (BR-M03-H02; admin-command §5), ghi sau dòng `CHECKPOINT_CLOSED` và chỉ khi command thành công: `store.run` có thêm `followUpAudit`. Dòng của C-10, C-11, C-13 nêu "Tuyến bị ảnh hưởng: …" (BR-M03-X06) | Ghi nhận |
| D-53 | Kiểm tra kỹ thuật khi mở lại (Q-09, C-12, C-13) chạy trên dữ liệu **đã xuất bản**: điểm dừng — ít nhất một điểm tham quan đang hoạt động, tên và nội dung các điểm tham quan đủ hai ngôn ngữ, xác nhận khảo sát còn hiệu lực với "Dùng được khi có mạng", ảnh "Cần tải trước" còn trong Storage; tuyến — các trường bắt buộc (cùng hàm `routePublishIssues`) và ít nhất một điểm dừng hoạt động. Danh sách cần sửa là các câu §5.6 đã điền, nối vào MSG-REOPEN-BLOCKED. Không có điểm dừng hoạt động → C-12 trả BLOCKED MSG-NO-ACTIVE-CHECKPOINT (contract), Q-09 vẫn đưa câu đó vào `reopenBlockers` để hộp thoại hiện. Trần dung lượng chỉ kiểm khi gửi C-13 (MSG-OFFLINE-TOO-BIG), không nằm trong `reopenBlockers` | Ghi nhận |
| D-54 | Q-09 với `REOPEN_*` do Nhân viên nội dung gọi → lỗi MSG-NO-PERMISSION (admin-command Q-09 "mở lại: R"). Q21 E2E kiểm Nhân viên không thấy nút "Mở lại"/"Lưu trữ"; FORBIDDEN khi vẫn gửi được kiểm ở `ReopenDialog.test.tsx` và contract | Theo contract |
| D-55 | Hộp thoại đóng điểm dừng không có khóa MSG-CONFIRM-*: tiêu đề là MSG-CLOSE-AFFECTS-ROUTES, câu phụ MSG-CLOSE-ROUTE-AUTO khi có tuyến sẽ tự đóng (D-45). Điểm dừng không có tuyến nào liệt kê: **đã quyết 2026-11-01** (người dùng chọn phương án A) — khóa mới MSG-CLOSE-NO-ROUTES "Điểm dừng này chưa có trong tuyến nào. Người quét mã QR tại đây sẽ thấy điểm dừng đang tạm đóng." Sửa spec trước: spec-M03 v3.7 clarification 9 (BR-M03-H01, §5.6); đồng bộ screen spec SCR-M03-008 E-16, contract `admin-ui-flow-contract.md`, `catalogText.ts`, `catalog.test.ts`. Script sinh `catalogText.ts` không có trong repo nên dòng mới được thêm tay đúng định dạng và thứ tự bảng §5.6; mockup SCR-M03-008 minh họa ca có 2 tuyến nên không đổi | Đã sửa |
| D-56 | Đóng/mở lại/lưu trữ từ **danh sách** đọc `concurrencyRevision` mới nhất ngay trước khi gửi (như "Hủy" của US3); từ editor điểm dừng thì gửi bản đang có trên màn, nên STALE nếu người khác vừa sửa. "Đóng tạm các tuyến liên quan" gửi lại đúng lý do đã nhập | Ghi nhận |
| D-57 | `OperationDialog` (khung chung) được thêm vào danh sách khung của test quét hộp xác nhận (D-45); thêm luật: mọi nơi dùng `<OperationDialog>` phải lấy câu từ `confirmation()`. CSS mới chỉ dùng token (`--space-*`, `--color-error`, `--color-ink-secondary`); `.rowActions` đặt trong `EditorLayout.module.css` cho hai danh sách | Hình thức |
| D-58 | Editor tuyến (SCR-M03-002) chưa có nút Đóng tạm/Mở lại/Lưu trữ: T140 chỉ giao danh sách tuyến, editor và danh sách điểm dừng | Theo tasks |

### 7.4 Checkpoint Phase 8

"US1–US6 chạy độc lập" **đạt** trên adapter giả: T056–T140 xong; Q1–Q21 pass. Còn mở: các mục `NOT RUN` ở §7.2.

## 8. Đợt 2026-11-01 — Phase 9 US7 Tra cứu QR trực tiếp (T141–T142)

Làm tiếp trên `feat/m03-us6` (chưa commit; file của Phase 9 tách riêng: `src/shared/contracts/liveQrLookup.cases.ts` và `.cases.test.ts`). Giai đoạn A chỉ chốt schema (T022/T026, đã có) và bảng sự thật làm oracle; producer thật `api.lookup_qr` thuộc giai đoạn B (T190–T191). Test viết trước: T141 fail vì không resolve được `./liveQrLookup.cases`, qua sau T142.

### 8.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/shared/contracts/liveQrLookup.cases.test.ts` | 0 | 31 pass |
| `npm run ci` | 0 | typecheck sạch; lint 318 pass; test 952/952 pass; build xong. Lần chạy trước đó 951/952: ca đầu `CheckpointEditorPage.test.tsx` không thấy tiêu đề trong 1 s (D-59); hai lần `npx vitest run` ngay sau đều 952/952 |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 8.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| `api.lookup_qr` chạy theo bảng sự thật (Q22), lỗi DB là error không phải `INVALID`, lookup không ghi dòng nào | Giai đoạn B (T190–T191) |
| Test consumer của M02 dùng bảng này | Package 002 chưa cài đặt |

### 8.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-59 | Thêm cách của D-46 cho `checkpoint-library/CheckpointEditorPage.test.tsx`: hai helper mở trang chờ tiêu đề tối đa 5 s | Đã sửa |
| D-60 | Bảng sự thật có 23 ca, mỗi ca ghi bước của BR-M03-I02 quyết định kết quả; phủ thứ tự ưu tiên (QR hỏng thắng mọi thứ; điểm dừng Nháp/Đã lưu trữ thắng tuyến; tuyến Nháp thắng điểm dừng đóng; tuyến đóng thắng điểm dừng đóng), có và không có `routeId`, tuyến không liệt kê điểm dừng (vẫn `VALID`, BR-M03-I01), identifier có khoảng trắng hai đầu (khớp sau trim), rỗng sau trim và khác hoa/thường (`INVALID`, BR-M03-B02), hai QR cùng điểm dừng (SC-M03-012), điểm dừng cần tải trước (`mediaResources` rỗng). Bảng chỉ ghi kết quả, không cài lại luật | Ghi nhận |

### 8.4 Checkpoint Phase 9

"Schema và oracle lookup sẵn sàng cho M02 và giai đoạn B" **đạt**: T141–T142 xong. Còn mở: các mục `NOT RUN` ở §8.2.

## 9. Đợt 2026-11-01 — Phase 10 US8 Lịch sử, khôi phục và nhật ký (T143–T151)

Branch `feat/m03-us8` tạo từ `feat/m03-us7` @ `58cb2c2`. Test viết trước và đã chạy thấy fail trước khi cài đặt:

- T146 `api/contract/history.contract.ts` (9 ca) và `audit.contract.ts`: 13 ca fail — khu vực history còn `pending`, dòng audit xuất bản chưa có trước/sau, thao tác trên điểm dừng chưa nêu tuyến. 20 ca "command thất bại vẫn ghi đúng một dòng" đã qua sẵn từ US1–US6.
- T143–T145 (component): 6 ca fail (chưa có panel, nút) và một file không resolve được `./AuditLogPage`.
- T147 `e2e/m03/history.spec.ts`: 2/2 fail.
- `messages/format.test.ts` (đọc ngày dd/mm/yyyy, D-63): 2 ca fail trước khi có hàm.

### 9.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch; lint 339 pass; test 1023/1023 pass; build xong |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | 25 pass: Q1–Q24. Lần đầu 5 fail: Q12, Q18 hết giờ khi dev server còn nguội (chạy lại đều pass); Q21 vì `getByText('Trạng thái: …')` khớp thêm dòng nhật ký mới (D-64); Q23, Q24 do chính test mới (bấm "Xuất bản" trước khi màn xem lại hiện; regex sai thứ tự cột). Đã sửa test, ứng dụng không lỗi |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 9.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Adapter Supabase cho C-06, C-08, Q-10, Q-11; `beforeState`/`afterState` thật trong `audit_records` | Giai đoạn B (T192–T193); T197 chạy lại `history.contract.ts`, `audit.contract.ts` |
| Ca `fakeOnly` khôi phục bản vi phạm giới hạn trên stack local | Cần cách sửa dữ liệu riêng ở giai đoạn B |

### 9.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-61 | Chỉ bản **Bản cũ** (`LUU_TRU`, từng xuất bản) có nút khôi phục; bản đang xuất bản thì không (BR-M03-F07 "earlier published revision"). Khôi phục và "Bỏ thay đổi" không có hộp xác nhận (BR-M03-L12 không liệt kê). Nút khôi phục tắt khi form còn thay đổi chưa lưu, vì khôi phục nạp bản nháp mới vào form và sẽ thay chữ đang gõ. "Bỏ thay đổi" chỉ có với mục đã xuất bản và đang có bản nháp chờ; mục chưa từng xuất bản dùng "Hủy" | Ghi nhận |
| D-62 | Khôi phục kiểm giới hạn hiện hành bằng đúng hàm kiểm tra lúc lưu bản nháp (`routeSaveIssues`, `checkpointSaveIssues` + trùng tên, `visitPointSaveIssues`); "danh sách chỗ cần sửa" của MSG-RESTORE-BLOCKED là các nhãn trường. Danh mục không có câu báo thành công cho khôi phục/bỏ thay đổi (như D-50): form nạp bản mới và VersionNote đổi | Ghi nhận |
| D-63 | Lọc ngày trên nhật ký nhập dd/mm/yyyy (cùng định dạng ngày hiển thị khắp M03 và với báo cáo T152), không dùng ô `type="date"` vì `TextField` dùng chung (`src/shared/ui`) chưa có kiểu đó. Hàm `parseDisplayDate` và `vietnamDayStartUtc` thêm vào `messages/format.ts`; "Đến ngày" tính hết ngày (mốc 00:00 hôm sau, giờ Việt Nam). Ngày gõ chưa xong/sai dạng thì chưa lọc theo ngày đó | Hình thức |
| D-64 | Ba E2E cũ (`checkpoints.spec.ts`, `routes.spec.ts`, `operations.spec.ts`) đổi `getByText('Trạng thái: …')` sang `exact: true`, vì panel lịch sử nay hiện các dòng "Trạng thái: … → …" trên cùng màn | Đã sửa test |
| D-65 | Dòng audit `PUBLISHED` nay ghi các dòng trước/sau của màn xem lại ("{nhãn}: {trước} → {sau}", BR-M03-F08) và, với điểm dừng/điểm tham quan, "Tuyến bị ảnh hưởng: …" (BR-M03-X06); thu hồi QR cũng nêu tuyến. Dòng lưu bản nháp trên adapter giả chưa có trước/sau từng trường; giai đoạn B lưu `beforeState`/`afterState` trong `audit_records` (Physical §5.8) | Ghi nhận |
| D-66 | Tên hiển thị của mọi giá trị `action` (admin-command §5) ở `history/auditFormat.ts`; test đọc danh sách từ contract để không sót. Giá trị lạ hiện "Thao tác quản trị". Nhật ký trang 50 dòng (`AUDIT_PAGE_SIZE`, lựa chọn kỹ thuật). Cột "Mở mục liên quan" (E-SCR-M03-009-08) chưa có vì `AuditRow` không mang id mục (id nội bộ không hiện, BR-M03-L10) | Ghi nhận; E-08 để giai đoạn B nếu cần |
| D-67 | Tách helper dựng dữ liệu của bộ test hợp đồng ra `api/contract/builders.ts` (dùng cho history, audit); `operations.contract.ts` giữ nguyên | Tái cấu trúc nhỏ |

### 9.4 Checkpoint Phase 10

"US1–US8 chạy độc lập" **đạt** trên adapter giả: T056–T151 xong; Q1–Q24 pass. Còn mở: các mục `NOT RUN` ở §9.2.
