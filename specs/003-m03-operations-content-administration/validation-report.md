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

## 10. Đợt 2026-11-01 — Phase 11 US9 Nhận phiên và báo cáo (T152–T159)

Branch `feat/m03-us9` tạo từ `feat/m03-us8` @ `f58b743`. Intake thật (`session-intake`, `api.ingest_session`) thuộc giai đoạn B (T194–T196); giai đoạn A chốt bảng ca intake làm oracle và chạy báo cáo trên `SessionRecord` synthetic. Test viết trước và đã chạy thấy fail trước khi cài đặt: T152, T154, T153 không resolve được module; `reports.contract.ts` 4/4 fail (khu vực reports còn `pending`); T155 fail vì chưa có hook `seedSessions`.

### 10.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch; lint 347 pass; test 1073/1073 pass; build xong |
| `npm run e2e` (project `m03`, `dev:fake`) | 0 | 26 pass: Q1–Q24, Q26 |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 10.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Q25: POST tới `session-intake` theo bảng `sessionSyncRecord.cases.ts`; chỉ một dòng `session_records` | Giai đoạn B (T194–T196) |
| Adapter Supabase cho Q-12, Q-13 (lọc `ended_at` theo múi giờ ở SQL) | Giai đoạn B; T197 chạy lại `reports.contract.ts` (ca `fakeOnly` cần nạp `SessionRecord` theo cách khác) |

### 10.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-68 | `SessionRecord` synthetic nằm trong bảng mới `sessionRecords` của store giả, nạp bằng điều khiển `seedSessionRecords` (fakeOnly) và hook E2E `seedSessions`. Không ghi qua command vì intake không phải thao tác quản trị và không ghi audit (session-intake §2) | Chỉ adapter giả |
| D-69 | Bảng ca intake chạy **theo thứ tự** trên một snapshot cho trước (`SESSION_INTAKE_SNAPSHOT`): ca IDENTICAL/CONFLICT dùng lại `sessionId` đã ACCEPTED trước đó. 19 ca: 3 ACCEPTED (gồm tuyến Tạm đóng, BR-M03-J04), 2 IDENTICAL (gồm đảo thứ tự visits và khóa, BR-M03-J03), 2 CONFLICT, 5 INVALID qua Zod nhưng lệch snapshot/dữ liệu (BR-M03-J02), 7 INVALID không qua Zod (khóa lạ ở gốc và phần tử, `DANG_DIEN_RA`, thời gian, lượt ghé lặp, `sessionId` không phải UUID) | Ghi nhận |
| D-70 | Màn báo cáo điền sẵn hai ô ngày bằng 30 ngày mặc định (dd/mm/yyyy, giờ Việt Nam) và nạp báo cáo khi mở; "Áp dụng" tắt khi khoảng ngày sai, câu MSG-REPORT-DATES-INVALID / MSG-REPORT-SPAN hiện dưới bộ lọc bằng chữ màu lỗi (không phải banner). Lỗi tải dùng banner `error` (role `alert`) như các màn M03 khác — screen spec gọi là "kiểu cảnh báo". Tỷ lệ hiện dạng phần trăm `vi-VN`, tối đa một chữ số thập phân. Bộ lọc tuyến liệt kê các tuyến đã từng xuất bản | Hình thức |
| D-71 | Q-12/Q-13 trên adapter giả từ chối khoảng ngày sai bằng lỗi MSG-GENERIC (client không bao giờ gửi khoảng sai; contract không có kết quả lỗi riêng cho query). RPT-02 sắp theo tên tuyến rồi thứ tự điểm dừng (lựa chọn trình bày) | Ghi nhận |
| D-72 | Mọi khu vực của adapter giả đã cài: bỏ cơ chế `pending` trong `fakeAdminApi.ts` (kiểu `AdminApi` bảo đảm đủ phương thức); bỏ `layout/PlaceholderPage` vì không còn màn nào dùng (T046 đã hết vai trò) | Dọn mã |

### 10.4 Checkpoint Phase 11

"Mọi user story của giai đoạn A chạy độc lập trên adapter giả" **đạt**: T056–T159 xong; Q1–Q24, Q26 pass. Còn mở: các mục `NOT RUN` ở §10.2.

## 11. Đợt 2026-11-01 — Phase 12 Polish và kiểm chứng giai đoạn A (T160–T165)

Branch `feat/m03-polish-a` tạo từ `feat/m03-us9` @ `9e9b88e`.

### 11.1 Lệnh kiểm chứng (T163)

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` (`typecheck` + `lint` + `test` + `build`) | 0 | 3 lần liên tiếp: typecheck sạch; lint 348 pass; test 1120/1120 pass; build xong. Lần đầu đợt này 1116/1120: 3 ca hết giờ khi chạy song song và 1 hồi quy thật do D-73 (đã sửa) — xem D-74 |
| `npm run e2e -- --project=m03` | 0 | 26 pass: Q1–Q24, Q26 |
| CI trên GitHub (`verify`, `e2e`) của các nhánh đã push | 0 | PR #4 (`feat/m03-us5`), #5 (`feat/m03-us6`), #6 (`feat/m03-us7`): mọi job pass. Nhánh `feat/m03-us8`, `feat/m03-us9`, `feat/m03-polish-a` chưa push nên chưa có lần chạy CI |
| `npm run build` + kiểm chunk (T161) | 0 | Entry chỉ tải sẵn runtime. Mọi trang `/admin/*`, adapter RPC, `supabase-js` (214 KB), schema (92 KB) nạp lazy; `qrcode` ở chunk riêng (`browser-*.js`). Khung quản trị nhẹ (layout, ngữ cảnh đăng nhập, danh mục thông báo) nằm trong entry — D-75 |
| Quét `dist/` tìm `APP_BACKEND_SECRET_KEY`, `service_role`, `SUPABASE_SERVICE`, `sb_secret_` (T161) | — | Không có khóa nào. Một chỗ khớp `sb_secret_` là code nhận diện tiền tố khóa của chính `supabase-js`, không phải giá trị |
| Tương phản token (T160) — `src/modules/m03/layout/contrast.test.ts` | 0 | Mọi màu chữ M03 trên mọi nền sáng ≥ 4.5:1 (thấp nhất: `--color-error` trên `--color-m03-active` 4.78:1); chữ trắng trên accent 7.50:1; viền ô nhập ≥ 3:1 (thấp nhất 3.09:1) |
| `git diff --check`; kiểm link tương đối các file đã sửa trong `specs/003`, spec-M03, SCR-M03-008 (T164) | 0 | Không lỗi khoảng trắng; không link hỏng (link `screen%20list` có từ trước, file tồn tại) |

### 11.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Đo WCAG bằng công cụ tự động (axe) và kiểm bằng trình đọc màn hình thật | Không có dependency cho axe (không cài thêm); cần người kiểm thủ công. T160 dựa trên rà mã, test vai trò/nhãn của Testing Library và test tương phản |
| CI GitHub cho `feat/m03-us8`, `feat/m03-us9`, `feat/m03-polish-a` | Chưa push |

### 11.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-73 | T162 thêm test cho mọi BR trước đó chưa có test (`checklists/br-test-coverage.md`). Hai test lộ lỗi của adapter giả, đã sửa: (1) mời hoặc đổi sang vai trò ngoài `REVIEWER`/`CONTENT_STAFF` được chấp nhận (BR-M03-A01) → nay FAILED, không tạo hay đổi gì; (2) chỉ đổi ghi chú vị trí của điểm dừng đã xuất bản lại tạo bản nháp chờ (BR-M03-D11) → nay lưu ghi chú mà không tạo bản nháp khi nội dung giống hệt bản đang xuất bản. Hệ quả: `PublicationReviewPage.revision.test.tsx` ca G05 trước dựng "bản sửa không đổi hành trình" bằng bản nháp giống hệt; đổi sang bản nháp chỉ khác khoảng trắng thừa (hành trình như cũ vì snapshot cắt khoảng trắng) | Đã sửa |
| D-74 | Bộ test tăng 871 → 1120 ca, phần lớn dựng màn; với `maxWorkers: 6` vẫn còn ca hết giờ khi chạy song song. Thay cho vá từng file (D-46, D-59): `testTimeout: 15_000` (`vitest.config.ts`) và `configure({ asyncUtilTimeout: 3_000 })` (`src/test/setup.ts`). Chỉ ca sai mới chờ lâu hơn; `npm run ci` 3 lần liên tiếp pass | Đã sửa |
| D-75 | R-24 "lazy-load cây `/admin/*`": các trang và phần nặng đã lazy, nhưng `src/app/router.tsx` import `m03Routes` tĩnh nên khung quản trị nằm trong entry (344 KB, chủ yếu là React/React Router). Hiện chưa có route du khách nên chưa ảnh hưởng; khi M01 thêm route du khách và cấu hình precache (M01 T007, T032) nên tách khung `/admin` thành chunk lazy (route `lazy` của React Router). Không refactor router dùng chung ở đợt này | Ghi nhận; chuyển cho M01 T007/T032 |
| D-76 | T160 rà WCAG 2.1 AA trên `src/modules/m03/**`: focus ring dùng chung (`global.css :focus-visible`), vùng chạm theo `--touch-target` (44 px) ở nút, ô nhập, lựa chọn, dòng panel, tab mới; bảng có `aria-label`; tab báo cáo có `role="tablist"`/`tab`/`tabpanel`, phím mũi tên; nhãn nút khôi phục chứa chữ hiển thị (WCAG 2.5.3); thông báo lỗi dùng `role="alert"`, thông báo khác `role="status"`. Sửa: câu sai khoảng ngày của báo cáo nay có `role="status"` để trình đọc màn hình đọc được khi nó xuất hiện (WCAG 4.1.3) | Đã sửa |

### 11.4 Artifact upstream có nguy cơ stale (T165; không tự sửa spec/architecture)

| Artifact | Điểm | Đề xuất |
|---|---|---|
| `contracts/admin-command-contract.md` §5 (C-09, C-14, C-15) | Ghi "BLOCKED nếu không `HOAT_DONG`/`TAM_DONG`" nhưng §5.6 không có khóa cho trường hợp này. Thực tế giao diện chỉ gặp khi hai phiên thao tác chồng nhau và nay được báo bằng MSG-STALE (D-51) | Ghi rõ trong contract: sai trạng thái nguồn do thao tác đồng thời → STALE; còn lại FAILED MSG-GENERIC |
| `screens/screen-spec/M03/screen-spec-SCR-M03-009.md` E-08 "Mở mục liên quan" | `AuditRow` (admin-command Q-11) không mang id mục vì id nội bộ không được hiện (BR-M03-L10), nên chưa dựng được link (D-66) | Quyết định khi viết Q-11 ở giai đoạn B: thêm id mục vào dòng trả về (chỉ dùng để dựng link, không hiện) hoặc bỏ E-08 khỏi screen spec |
| `research.md` R-24 | "Lazy-load cây `/admin/*`" mới đúng một phần (D-75) | Cập nhật khi M01 tách khung `/admin` |
| `screens/screen-spec/M03/screen-spec-SCR-M03-005.md` E-15, `SCR-M03-009` §4 "Spinner" | Màn chỉ đánh dấu `aria-busy` khi đang tải; chưa có spinner (design-system không có component spinner) | Bổ sung spinner vào design-system nếu cần, hoặc ghi "đang tải" không cần spinner |
| `docs/spec/spec-M03.md` | Đã sửa đúng quy trình ở đợt US6 (v3.7 clarification 9, MSG-CLOSE-NO-ROUTES) và đồng bộ SCR-M03-008, `admin-ui-flow-contract.md`. `MVP-Scope.md`, `docs/function list/`, `data/` không nhắc khóa này | Không cần sửa |

### 11.5 Checkpoint Phase 12

"Giai đoạn A hoàn tất" **đạt**: T001–T165 xong trên adapter giả; Q1–Q24, Q26 pass; mọi BR-M03 còn hiệu lực đã có test hoặc ghi rõ nơi chịu test. Dừng tại đây theo tasks.md: giai đoạn B (Phase 13–15, cần Docker cho stack Supabase local) chuyển cho người làm backend. Còn mở: các mục `NOT RUN` ở §11.2 và §6.2–§10.2, artifact §11.4.

## 12. Đợt 2026-11-01 — Phase 13 Giai đoạn B, nền backend (T168–T176)

Branch `feat/m03-b-foundation` tạo từ `feat/m03-polish-a` @ `73d84d0`. Chỉ stack Supabase local (Supabase CLI 2.122.0, Postgres 17, Docker Desktop trên WSL2); không `supabase link`, `db push` hay deploy (CHG-M03-2026-10-30-01 §4, §7).

### 12.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` | 0 | Áp sạch migration 01, 02, 03a, 04a, 05 và `seed.sql` trên DB trống |
| `supabase start` | 0 | Mọi dịch vụ khỏe (hết lỗi 503 do thiếu schema `api`) |
| `supabase test db` | 0 | 4 file, 197/197 pass: `m03_01_schema` 53, `m03_02_triggers` 66, `m03_03_access` 44, `m03_04_helpers` 34 |
| Đăng nhập tài khoản seed qua GoTrue local + gọi `app.current_admin()` bằng claims của JWT thật (script ngoài repo) | 0 | staff, reviewer: HTTP 200, nhận đúng tài khoản; locked, noaccount: rỗng; token sau đăng xuất (204): rỗng; đăng ký công khai: 422 `signup_disabled` |
| `npm run ci` | 0 | typecheck sạch; lint pass; test 1123/1123 (thêm `src/modules/m03/api/sqlCatalog.test.ts`); build xong |

### 12.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Đường BUSY của `app.lock_connected_set` | Cần hai phiên DB song song; để cho contract test trên stack thật (T186) |
| `function_privs_are` trên `api.*` (command, query, `api.lookup_qr`, `api.ingest_session`) | Các hàm này chưa có; thêm vào pgTAP cùng migration 4b–4d của từng story (T191, T196). T175 hiện kiểm: role API chỉ EXECUTE được `app.current_admin` và `app.media_object_is_public`; `service_role` không EXECUTE hàm `app` nào |
| Contract test adapter Supabase (`supabaseAdminApi.contract.local.test.ts`) | Dựng cùng command đầu tiên ở Phase 14; `test_support.reset_m03()` đã có trong `seed.sql` |

### 12.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-77 | T168 ghi `ALTER DEFAULT PRIVILEGES IN SCHEMA app, api REVOKE EXECUTE … FROM PUBLIC`. Lệnh theo schema không thu hồi được quyền EXECUTE mặc định toàn cục của PUBLIC, nên hàm tạo sau migration 04a (`app.media_object_is_public`) vẫn cho PUBLIC chạy — T175 phát hiện. Sửa: `ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` (toàn cục cho role chạy migration) và `revoke … from public` tường minh ở migration 05. Đúng ý Physical §9 | Đã sửa; câu chữ T168 đã cập nhật |
| D-78 | Giới thiệu điểm tham quan dưới `QR_INTRO_MIN_CHARS`: trigger chấp nhận khi lưu, chỉ chặn ở xuất bản (DAC-M03-052) | Theo DAC |
| D-79 | Điểm nổi bật chỉ có một ngôn ngữ được lưu nháp (BR-M03-C06); thiếu ngôn ngữ chỉ chặn xuất bản | Theo spec |
| D-80 | `shortDescription` giữ xuống dòng; trường một dòng chỉ gồm tên, chú thích ảnh, điểm nổi bật (DAC-M03-087, 088) | Theo DAC |
| D-81 | `routeMapCaption` khi không có sơ đồ bị trigger từ chối (DAC-M03-038). Lệnh lưu (Phase 14) phải bỏ chú thích khi gỡ sơ đồ, giống adapter giả | Chuyển cho T180 |
| D-82 | Danh mục thông báo (87 khóa) và nhãn trường (34 dòng) nằm trong SQL dạng `VALUES` (`app.message_template`, `app.field_label_base`), sinh từ `catalogText.ts`/`fieldLabels.ts`. `sqlCatalog.test.ts` so từng chữ với định nghĩa mới nhất qua mọi migration; đổi câu chữ thì sửa TypeScript trước rồi thêm migration | Đã có test |
| D-83 | T170 gọi bộ dựng STALE là `app.stale_result`; code dùng họ `app.cr_*` (`cr_ok`, `cr_validation`, `cr_busy`, `cr_forbidden`, `cr_blocked`, `cr_failed`, `cr_stale`). Chỉ `app.current_admin` và `app.media_object_is_public` là `SECURITY DEFINER`; helper thuần (`render_message`, `cr_*`, …) chạy trong command `SECURITY DEFINER` gọi chúng và không cấp EXECUTE cho role API nào | Ghi nhận |
| D-84 | `supabase/config.toml`: ở CLI, `[auth.email] enable_signup = false` tắt luôn đăng nhập email ("Email logins are disabled"). Đặt `true` ở `[auth.email]`; đăng ký công khai vẫn bị chặn bởi `[auth] enable_signup = false` (đã kiểm: 422 `signup_disabled`). `[inbucket]` đổi tên thành `[local_smtp]`; tắt `[analytics]` (container `vector` khởi động lại liên tục trên Docker Desktop Windows) | Đã sửa |
| D-85 | Trigger chặn `DELETE` là cấp dòng (bảng rỗng không kích hoạt); `TRUNCATE` chặn cấp câu lệnh. pgTAP tạo dòng trước khi thử xóa | Ghi nhận |
| D-86 | `seed.sql` thêm schema `test_support` (đóng với mọi role API): `seed_m03()` tạo 4 người dùng Auth `*@example.test` (reviewer, staff, locked, noaccount) và 3 tài khoản đi đúng vòng đời; `reset_m03()` xóa dữ liệu M03 với `session_replication_role = replica`, chỉ gọi qua `psql` trong container | Chỉ local |

### 12.4 Checkpoint Phase 13

"`supabase db reset` local áp được migration 1, 2, 3a, 4a, 5 và pgTAP nền chạy" **đạt**. Tiếp theo: Phase 14 theo từng story, bắt đầu US1 trên branch `feat/m03-b-us1`.

## 13. Đợt 2026-11-01 — Phase 14 US1 backend (T177–T180)

Branch `feat/m03-b-us1` tạo từ `feat/m03-b-foundation` @ `16b390f`. Chỉ stack local.

### 13.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` | 0 | Áp sạch migration 01–05 và 3b `m03_03b_accounts` |
| `supabase test db` | 0 | 5 file, 256/256 pass; `m03_us1_accounts` 59 ca: quyền EXECUTE từng function, Q-01, Q-14 (Nhân viên → 42501), C-18/C-19 của Nhân viên → FORBIDDEN có audit FAILURE và không đổi gì, Reviewer cuối (hạ role, khóa) → BLOCKED MSG-LAST-REVIEWER, STALE, mỗi command một dòng audit có trước/sau, vai trò lạ → FAILED, mời/gửi lại/nối, cấp Reviewer đầu tiên chỉ khi rỗng và lần hai là no-op |
| `supabase functions serve admin-accounts --env-file supabase/functions/.env` + script HTTP ngoài repo | 0 | 25/25 mục: preflight 204 + CORS; thiếu JWT, JWT rác, phiên đã đăng xuất → 401; Nhân viên mời → 403; mời → SENT, mời lại/gửi lại → RESENT, một tài khoản duy nhất; 409 EMAIL_TAKEN; 400 INVALID_EMAIL; thư mời trong Mailpit, link mở `/admin/invitation` với phiên của người được mời; nối → LINKED, `ACTIVE` đúng role; email không có lời mời / nối lần hai → 422; không body nào chứa user id hay token; đúng một dòng audit mỗi lần gọi; đăng ký công khai → 422 |
| Thủ tục cấp Reviewer đầu tiên trên môi trường trống (script ngoài repo; xóa tài khoản bằng `replica`, sau đó `db reset`) | 0 | 11/11 mục: script thiếu tham số → exit 2; bước 1 `CREATED`, lặp lại `ALREADY_PROVISIONED`; bước 2 `provision-initial-reviewer.ts` gửi lời mời, không in secret; link mở `/admin/invitation`; người nhận nối qua Edge → Reviewer `ACTIVE`; audit `INITIAL_REVIEWER_PROVISIONED` (actor trống) rồi `ACCOUNT_LINKED`; đã có tài khoản → `NOT_EMPTY` |
| `supabase db reset` + `supabase test db` + `npm run ci` sau cùng | 0 | 256/256 pgTAP; CI: test 1123/1123, build xong |

### 13.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| `supabase/functions/admin-accounts/index.test.ts` (Deno) | Không cài Deno (quyết định giai đoạn B #7). Hành vi cùng các ca đó đã kiểm trực tiếp qua `functions serve` (§13.1) |
| Reviewer cuối với hai phiên DB thật song song | pgTAP chạy một phiên; khóa bảng `share row exclusive` tuần tự hóa hai lệnh. Ca song song có trong bộ contract dùng chung, chạy với adapter Supabase ở T197 |

### 13.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-87 | Chú thích mẫu command ở migration 3a đặt `app.require_admin` ngoài khối trong; như vậy FORBIDDEN thành lỗi HTTP thay vì `CommandResult` và không có audit FAILURE. Sửa chú thích: gọi trong khối, audit FAILURE ghi `auth.uid()` sau khi khối rollback (người không có tài khoản → null) | Đã sửa |
| D-88 | R-16/T177/T179: `app.provision_initial_reviewer` "không có trong schema `api`", script chỉ đọc `APP_BACKEND_SECRET_KEY`. Nhưng Data API chỉ mở schema `api`, nên script dùng secret key qua REST không gọi được function trong `app`. Người dùng chọn: hai bước — operator chạy `select app.provision_initial_reviewer(…)` trong SQL editor, rồi script chỉ gửi lời mời. Đã sửa R-16, T179, T207, auth-account §2.8 | Đã quyết định 2026-11-01 |
| D-89 | Edge mời/gửi lại gồm 3 lời gọi service_role: `api.prepare_invitation` (kiểm actor là Reviewer active, chuẩn hóa/kiểm email, giữ đúng một `INVITATION_PENDING`; không audit), Auth Admin `inviteUserByEmail`, rồi `api.record_account_event` (đúng một dòng audit). `api.link_invitation` nối và audit trong một lời gọi. Cả ba chỉ `service_role` | Ghi nhận |
| D-90 | STALE của tài khoản: bảng không có cột người sửa cuối, nên `editorEmail` lấy từ actor của dòng audit SUCCESS mới nhất của tài khoản (`app.account_last_editor`) | Ghi nhận |
| D-91 | `api.list_accounts` của người không phải Reviewer ném `42501` (query không trả `CommandResult`); adapter ánh xạ sang MSG-NO-PERMISSION như contract dùng chung đòi | Theo contract |
| D-92 | Gửi lại cho tài khoản không ở `INVITATION_PENDING` → HTTP 400 `{ result: 'FAILED' }` (auth-account §3 không có mã riêng); client ánh xạ sang FAILED MSG-GENERIC như adapter giả | Ghi nhận |
| D-93 | `inviteUserByEmail` bị provider từ chối với người dùng Auth đã xác nhận email (ví dụ đã từng có tài khoản rồi bị xóa) → 502 INVITE_FAILED. Hiếm ở MVP; không xử lý thêm | Ghi nhận |

## 14. Đợt 2026-11-01 — Phase 14 US2 backend (T181–T182)

Branch `feat/m03-b-us2` tạo từ `feat/m03-b-us1` @ `ab7285b`. Chỉ stack local.

### 14.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` | 0 | Áp sạch migration 01–05, 3b, 3c `m03_03c_checkpoints_visit_points` |
| `supabase test db` | 0 | 6 file, 334/334 pass; `m03_us2_checkpoints` 78 ca: quyền; FORBIDDEN cho danh tính không có tài khoản; C-02 tạo nháp, mode không mặc định, tên trùng (hoa/thường, khoảng trắng), MSG-ONLINE-NOT-VERIFIED, câu MSG-LIMIT-TEXT đủ nhãn và số, người/thời điểm khảo sát do M03 ghi, STALE (cả khi bản nháp người khác vừa tạo); C-03 MSG-MODE-REQUIRED-FIRST không tạo QR, QR + identifier ≥ 16 + bản nháp 1 cùng lúc, tick quyền theo từng tệp, MSG-AV-OFFLINE, MSG-MODE-HAS-AV, issue/readiness trên dữ liệu đã lưu, lưu lỗi thì không đổi gì (kể cả tick quyền) và đúng một dòng audit, media của điểm dừng khác, QR không chuyển điểm dừng; C-04 object không tồn tại / ngoài thư mục owner / usage sai owner / đăng ký lần hai → FAILED, MSG-FILE-TYPE, MSG-FILE-TOO-BIG (biên đúng mức tối đa nhận), MIME/kích thước lấy từ Storage; MSG-LIMIT-QR, hủy QR nháp rồi thêm lại; C-07 điểm dừng cần lý do, QR nháp → THU_HOI, tên dùng lại được, đã xuất bản thì không hủy; ghi chú vị trí không tạo bản nháp; C-16 chỉ QR hoạt động, MSG-LAST-QR, cần lý do, audit giữ lý do; C-17 một dòng audit, không đổi gì; Q-05/Q-06/Q-07 |
| Kịch bản HTTP (`scratch/check_us2_http.mjs`, ngoài git) với `supabase-js` của repo | 0 | 12/12: C-02/C-03/C-04/Q-05/Q-07 qua PostgREST với JWT thật; tải ảnh lên Storage qua policy, ghi đè và tải ngoài `uploads/` bị từ chối; `register_media` đọc được `metadata.mimetype`/`size` của Storage thật; admin ký URL ảnh nháp, du khách không ký được; anon gọi query quản trị bị từ chối |
| `npm run ci` | 0 | test 1123/1123, build xong |

### 14.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| T182 "xuất bản điểm dừng `OFFLINE_REQUIRED` có ảnh không đọc được bị chặn" | Cần `api.publish_unit` (T183); chuyển sang pgTAP T185 |
| Hai lần lưu cùng tên điểm dừng chạy song song thật | pgTAP một phiên; khóa advisory theo tên chuẩn hóa tuần tự hóa (Physical §14 O-1). Ca song song chạy ở T197 |
| So khớp tự động quy tắc issue SQL ↔ `src/modules/m03/validation/*` | Chưa có test parity riêng (chỉ câu chữ/nhãn qua `sqlCatalog.test.ts`). Bộ contract dùng chung ở T197 so hành vi hai adapter |

### 14.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-94 | C-16 thu hồi QR phải dựng hành trình mới cho mọi tuyến liệt kê điểm dừng (BR-M03-X02). Chưa có code dựng snapshot (T183), nên `app.rebuild_after_visit_point_change` tạm thời từ chối khi có tuyến đã xuất bản liệt kê điểm dừng (không thể xảy ra trước US3). Migration 3d/3e phải `create or replace` hàm này | Chuyển cho T183/T186 |
| D-95 | Migration 01 đặt CHECK `media_spoken_language` = "non-null đúng khi AUDIO/VIDEO" theo câu chữ Physical §5. Nhưng DAC-M03-059 ("Missing value: visit point not ready, MSG-AV-LANGUAGE-MISSING"), Physical §8 (guard xuất bản kiểm ngôn ngữ nói) và UI (đăng ký AV trước, chọn ngôn ngữ khi lưu) cho thấy thiếu ngôn ngữ chỉ chặn xuất bản. Migration 3c nới CHECK thành "ảnh không có ngôn ngữ nói"; pgTAP T173 đổi theo | Người dùng chọn giữ cách nới (2026-11-02); đã sửa câu chữ Physical §5 dòng `spoken_language` |
| D-96 | `qr_codes` không có cột thứ tự tạo; `creationOrder` = thứ tự theo `created_at` (lệnh tạo ghi `clock_timestamp()`), tính cả QR đã thu hồi như adapter giả | Ghi nhận |
| D-97 | Bảng thực thể không có cột người sửa cuối; `editorEmail` của STALE trên thực thể lấy từ actor dòng audit SUCCESS mới nhất (`app.entity_last_editor`), trên bản nháp lấy `revisions.last_edited_by_user_id` | Ghi nhận |
| D-98 | `register_media` còn từ chối (FAILED) object nằm ngoài `uploads/{ownerType}/{ownerId}/` và object đã đăng ký — media-storage-contract §1 nêu thư mục nhưng không nói rõ kiểm ở bước đăng ký | Ghi nhận |
| D-99 | Query (Q-05–Q-07) từ chối người không phải admin bằng `42501` (adapter → MSG-NO-PERMISSION) và id không tồn tại bằng `P0002` (→ MSG-GENERIC); adapter giả ném MSG-SESSION-EXPIRED khi không có admin | Ghi nhận; T197 xem lại nếu contract dùng chung đòi khác |
| D-100 | Quy tắc issue của điểm dừng/điểm tham quan được viết lại trong SQL (`app.check_*`, `app.checkpoint_*_issues`, `app.visit_point_*_issues`, `app.qr_issues`, `app.readiness`) cùng khóa trường, nhãn và câu như `validation/*.ts`, vì R-26 yêu cầu readiness tính phía server trên dữ liệu đã lưu. Hai nơi phải sửa cùng nhau | Ghi nhận; rủi ro lệch nêu ở §14.2 |

## 15. Đợt 2026-11-02 — Phase 14 US3 backend (T183–T185)

Branch `feat/m03-b-us3` tạo từ `feat/m03-b-us2` @ `5f7549c`. Chỉ stack local.

### 15.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` | 0 | Áp sạch tới 3d `m03_03d_routes_publish` và 4b `m03_04b_public_views` |
| `supabase test db` | 0 | 7 file, 400/400 pass; `m03_us3_publish` 66 ca: quyền hàm và view; xuất bản điểm dừng lần đầu (điểm tham quan chưa đủ giữ Nháp, review liệt kê thiếu gì, tự xuất bản có cờ); C-01 tuyến (MSG-TAG-CONFLICT, MSG-NUMBER-DECIMALS, MSG-CHECKPOINT-DUPLICATE, điểm dừng chưa hoạt động bị từ chối, lần lưu đầu không có ảnh, bỏ tick và chú thích sơ đồ khi không có sơ đồ, mỗi lần từ chối có audit); Q-02/Q-03/Q-04; review tuyến (đòi tick an toàn, ước tính chỉ ảnh + chữ offline, changes bằng chữ thường); BLOCKED MSG-SAFETY-CONFIRM không đổi gì; STALE; xuất bản → `HOAT_DONG` + version 1 atomic, tick lưu vào nội dung, điểm dừng không bị đụng; cột hai view đúng khóa contract, dòng Published Route đầy đủ với giá trị suy ra; `anon` đọc view, không đọc bảng; tuyến nháp vắng; thiếu nội dung → VALIDATION; QR_OBJECT ở điểm dừng đang hoạt động → version 2, version 1 giữ nguyên, mở review không ghi gì; thu hồi QR → version 3 cùng transaction (D-94); STALE sau khi sửa; ảnh không còn trong Storage → MSG-IMAGE-NOT-READABLE; snapshot không dựng được → FAILED MSG-PUBLISH-FAILED, không đổi gì, một dòng audit FAILURE |
| Vitest tạm trên stack local (đã xóa sau khi chạy) | 0 | Tải ảnh lên Storage thật, xuất bản điểm dừng và tuyến (có sơ đồ offline, cảnh báo an toàn) qua PostgREST; `PublicationReview` qua `publicationReviewSchema`; `anon` đọc hai view, đổi tên cột sang camelCase rồi qua `publishedRouteSchema` và `journeySnapshotSchema`; du khách ký được URL ảnh đã xuất bản |
| `npm run ci` | 0 | test 1124/1124 (thêm ca `app.display_name` ở `sqlCatalog.test.ts`), build xong |

### 15.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| BUSY khi hai thao tác giữ tập kết nối giao nhau | Cần hai phiên; T186 |
| Vượt trần `OFFLINE_PACKAGE_MAX_MB` | Cần > 25 ảnh 2 MB; ca `fakeOnly` ở contract. Code dựng issue/BLOCKED dùng chung với QR_OBJECT; chưa có pgTAP riêng |
| `sequence` có khoảng trống khi điểm dừng trong danh sách không hoạt động | Cần đóng điểm dừng (US6, T188); `build_journey` đã giữ vị trí trong danh sách |
| Chạy bộ contract dùng chung với adapter Supabase | T197 |

### 15.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-94 | Thu hồi QR dựng hành trình mới cho mọi tuyến liệt kê điểm dừng: migration 3d thay hàm tạm bằng `app.commit_rebuilds(app.rebuild_routes(...))`, không bị trần chặn | Đã xong; pgTAP T185 kiểm |
| D-101 | Q-08 dùng chung lõi `app.publication_unit` với C-05 để guard chạy lại đúng như review (BR-M03-F02). Review cần thấy hành trình "sau khi xuất bản" (QR_OBJECT), nên lõi ghi trong một khối con rồi ném SQLSTATE riêng để rollback; không có gì được commit hay lộ ra (BR-M03-G09; R-10 "dựng thử trong transaction chỉ đọc") | Ghi nhận |
| D-102 | View công khai chỉ dùng hàm có sẵn của Postgres: PostgreSQL kiểm quyền EXECUTE của hàm trong view theo người đọc (`anon`), mà hàm `app.*` không cấp cho `anon` | Ghi nhận |
| D-103 | `changes`/`sensitiveChanges`, ghi chú tác động, MSG-OFFLINE-TOO-BIG và tên hiển thị (độ khó, nhãn, loại kết nối — `app.display_name`, có test đồng bộ) được viết lại trong SQL như adapter giả | Ghi nhận; cùng rủi ro lệch như D-100 |
| D-104 | Lưu tuyến phía server: chuẩn hóa như `normalizeRouteContent` (một dòng, nhãn phân biệt, bỏ tick sơ đồ khi không có sơ đồ, bỏ tick "không có cảnh báo" khi có cảnh báo) và bỏ luôn `routeMapCaption` khi không có sơ đồ (D-81); lần lưu đầu có ảnh → FAILED (D-25) | Ghi nhận |
| D-105 | `ROUTE_INFORMATION` và `CHECKPOINT_REVISION` chưa có: `publish_unit` trả FAILED, review lỗi `P0002` cho tới migration 3e (T186) | Chuyển cho T186 |
| D-106 | Dòng audit `PUBLISHED` giữ `after_state = {changes, affectedRoutes}`; dòng "{nhãn}: {trước} → {sau}" và tên tuyến bị ảnh hưởng do Q-10/Q-11 dựng (T192) | Chuyển cho T192 |
| D-107 | Audit của C-16 (migration 3c) chưa nêu tên các tuyến bị ảnh hưởng (BR-M03-X06) | Chuyển cho T192/T193 |
| D-108 | Physical §5.6 nói "a deferred check re-verifies the route's new active snapshot against the live sources at commit". Trigger hoãn hiện chỉ kiểm version active là version cao nhất; thành phần hành trình được kiểm khi dựng trong lệnh. Không thêm kiểm lại lúc commit cho MVP | Người dùng chấp nhận cho MVP (2026-11-02) |

## 16. Đợt 2026-11-02 — Phase 14 US4 backend (T186)

Branch `feat/m03-b-us4` tạo từ `feat/m03-b-us3` @ `8267460`. Chỉ stack local.

### 16.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` | 0 | Áp sạch tới 3e `m03_03e_publish_revisions` |
| `supabase test db` | 0 | 8 file, 433/433 pass; `m03_us4_revise` 33 ca: sửa tuyến đã xuất bản là một bản nháp chờ, lần sửa sau tiếp tục bản đó, bản công khai không đổi, danh sách đánh dấu bản nháp chờ; STALE không ghi đè; đổi thông tin khác → không version, bản cũ thành `LUU_TRU`; đổi thứ tự → version mới chỉ cho tuyến đó, theo thứ tự mới; sơ đồ không đánh dấu → không version, bật tick → version mới có sơ đồ, tick là thay đổi nhạy cảm; đổi tên điểm dừng chung hai tuyến → review nêu cả hai, mở review không ghi gì, hai tuyến nhận version cùng lúc, version cũ giữ tên cũ; đổi mode → MSG-REPRINT-MODE-CHANGED; nội dung điểm tham quan ở điểm dừng có mạng → không version, ở điểm dừng cần tải trước → version cho mọi tuyến liệt kê, mang nội dung mới; bỏ điểm dừng hoạt động cuối → BLOCKED MSG-ROUTE-LAST-CHECKPOINT, hành trình công khai không đổi; phiên thứ hai (`dblink`) giữ khóa của tập giao nhau → BUSY nêu tên, không đổi gì, một dòng audit FAILURE; tập rời nhau vẫn chạy; nhả khóa thì chạy được |
| `npm run ci` | 0 | test 1124/1124, build xong |

### 16.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Vượt trần `OFFLINE_PACKAGE_MAX_MB` khi sửa | Như §15.2; code dùng chung `app.size_block` |
| Snapshot dựng lỗi giữa chừng khi có nhiều tuyến | Đã kiểm một tuyến ở T185; nhiều tuyến dùng chung `app.commit_rebuilds` trong một transaction |

### 16.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-105 | `ROUTE_INFORMATION` và `CHECKPOINT_REVISION` có ở migration 3e. Lõi của 3d được đổi tên thành `app.publication_unit_first`; `app.publication_unit` mới chỉ chia việc theo loại đơn vị, nên `api.publish_unit`/`api.open_publication_review` không phải viết lại | Đã xong |
| D-109 | `CHECKPOINT_REVISION` đổi sang "Cần tải trước" kiểm ảnh trong nội dung *đã xuất bản* của mọi điểm tham quan đang hoạt động (`app.unreadable_published_images`), như adapter giả | Ghi nhận |
| D-110 | pgTAP BUSY: khóa advisory giữ tới hết transaction, nên phiên test không được dùng lại khóa của thực thể đã xuất bản trước đó (lần chạy đầu bị treo vì phiên `dblink` chờ khóa của phiên test — đã ngắt và viết lại). Phiên thứ hai dùng `pg_try_advisory_xact_lock`, không bao giờ chờ. Mật khẩu `dblink` là mặc định công khai của stack local | Ghi nhận |

## 17. Đợt 2026-11-02 — Phase 14 US5 backend (T187)

Branch `feat/m03-b-us5` tạo từ `feat/m03-b-us4` @ `04beaf2`. Chỉ stack local; không có migration mới.

### 17.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` + `supabase test db` | 0 | 9 file, 482/482 pass; `m03_us5_messages` 49 ca. 29 nhánh từ chối của command US1–US4 (FORBIDDEN ×2, STALE ×2, BLOCKED ×8, VALIDATION ×11, FAILED ×6 — gồm nội dung sai hình dạng bị trigger từ chối, `expected` không phải số, đơn vị không tồn tại, object không có, snapshot không dựng được) mỗi nhánh đúng `reason` + `messageKey`; issue gom từ editor (điểm tham quan, điểm dừng, tuyến), review (điểm dừng, điểm tham quan) và guard xuất bản tuyến. Quy tắc chung: mọi khóa có trong danh mục §5.6; FAILED chỉ PUBLISH/CLOSE/GENERIC; STALE có email và thời điểm UTC; câu BLOCKED và câu issue điền đủ placeholder; `values` và câu không chứa id hay identifier QR; không chữ lỗi PostgreSQL nào (error, violates, constraint, relation, SQLSTATE, tên schema…) lọt vào `CommandResult`; VALIDATION luôn có issue và lấy khóa của issue đầu; issue đủ đúng 7 trường, severity hợp lệ, nhãn tiếng Việt khác khóa nội bộ, `targetFieldKey` có nhãn (kể cả khóa phần tử danh sách có chỉ số và ngôn ngữ) |
| `npm run ci` | 0 | test 1124/1124, build xong |

### 17.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Nhánh từ chối của command US6–US9 (đóng, mở lại, lưu trữ, khôi phục, bỏ bản nháp, báo cáo, nhận phiên) | Chưa có command; mỗi story thêm nhánh của mình vào pgTAP riêng và theo cùng quy tắc |
| BUSY trong bộ này | Đã kiểm với hai phiên ở T186 |

### 17.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-111 | Issue của `register_media` với file QR_MEDIA có `targetItemType = 'CHECKPOINT'` (chủ media) nhưng `targetFieldKey` là `images`/`avFiles`, hai khóa chỉ có nhãn dưới QRCODE; `fieldLabel` của issue được đặt sẵn ("Ảnh của điểm tham quan"/"Âm thanh/video"). Adapter giả làm y như vậy; UI hiện câu này ở hàng đợi tải lên, không dùng khóa để focus. pgTAP ghi đây là ngoại lệ duy nhất | Người dùng chọn giữ nguyên (2026-11-02) |

## 18. Đợt 2026-11-02 — Phase 14 US6 backend (T188–T189)

Branch `feat/m03-b-us6` tạo từ `feat/m03-b-us5` @ `f056599`. Chỉ stack local.

### 18.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` + `supabase test db` | 0 | 10 file, 534/534 pass; `m03_us6_operations` 52 ca: quyền; Q-09 đóng điểm dừng nêu mọi tuyến và tuyến sẽ tự đóng; đóng điểm dừng cần lý do, STALE, đóng → TAM_DONG đủ lý do/người/lúc, tuyến chỉ có nó tự đóng `AUTO_NO_ACTIVE_CHECKPOINT`, tuyến kia version mới cùng transaction với `sequence` có khoảng trống (mục còn lại của §15.2), một dòng audit cho điểm dừng nêu tuyến bị ảnh hưởng và một dòng riêng cho mỗi tuyến tự đóng; Nhân viên mở lại/lưu trữ → FORBIDDEN, Q-09 mở lại → 42501; mở lại điểm dừng cần ghi chú an toàn, các tuyến có lại điểm dừng nhưng tuyến tự đóng không tự mở lại, xóa trường đóng; mở lại tuyến; đóng tuyến cần lý do, đóng thủ công không tạo version, M01 thấy TAM_DONG; tuyến không còn điểm dừng hoạt động không mở lại được (MSG-NO-ACTIVE-CHECKPOINT, Q-09 nêu lý do); lưu trữ tuyến chỉ khi đóng, điểm dừng không đổi; lưu trữ điểm dừng còn tuyến dùng → MSG-CHECKPOINT-IN-USE nêu tên, điểm dừng đang hoạt động không lưu trữ được; "đóng các tuyến liên quan" đóng tuyến, điểm dừng vẫn hoạt động, một dòng audit nêu tuyến; lưu trữ điểm dừng → QR thu hồi, không version mới; ảnh không đọc được → Q-09 liệt kê, MSG-REOPEN-BLOCKED; hành trình không dựng lại được khi đóng → FAILED MSG-CLOSE-FAILED, không đổi gì, có audit FAILURE, rồi lệnh dự phòng đóng được tuyến |
| `npm run ci` | 0 | test 1124/1124, build xong |

### 18.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| BUSY khi đóng/mở lại | Cùng `app.lock_connected_set`; đã kiểm hai phiên ở T186 |
| Mở lại vượt trần `OFFLINE_PACKAGE_MAX_MB` | Như §15.2; dùng chung `app.rebuild_impact` |

### 18.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-112 | `app.audit` (migration 3a) ghi `occurred_at = clock_timestamp()` thay vì mặc định `now()` của bảng: các dòng của một transaction (đóng điểm dừng rồi từng tuyến tự đóng) giữ đúng thứ tự cho lịch sử và nhật ký. pgTAP T189 phát hiện thứ tự ngẫu nhiên khi dùng `now()` | Đã sửa |
| D-113 | Thứ tự trong C-10: tính tuyến sẽ tự đóng trên snapshot active trước khi đóng, đóng điểm dừng, dựng lại mọi tuyến bị ảnh hưởng (không bị trần chặn), rồi mới đóng các tuyến tự đóng — như adapter giả. Lỗi bất kỳ → MSG-CLOSE-FAILED | Ghi nhận |
| D-114 | Mở lại tuyến không dựng lại hành trình: hành trình của tuyến đóng vẫn được dựng lại mỗi khi điểm dừng của nó đổi (tuyến `TAM_DONG` thuộc tuyến bị ảnh hưởng, BR-M03-X02), nên version active đã đúng lúc mở lại | Ghi nhận |

## 19. Đợt 2026-11-02 — Phase 14 US7 backend (T190–T191)

Branch `feat/m03-b-us7` tạo từ `feat/m03-b-us6` @ `bec5a7a`. Chỉ stack local.

### 19.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` + `supabase test db` | 0 | 11 file, 562/562 pass; `m03_us7_lookup` 28 ca: 23 ca của `LIVE_QR_LOOKUP_CASES` (6 bước BR-M03-I02, có/không `routeId`, tuyến không liệt kê điểm dừng vẫn VALID, trim identifier, phân biệt hoa/thường, QR thứ hai có nội dung riêng, điểm dừng cần tải trước không có âm thanh/video) gọi bằng role `anon`; `anon` và `authenticated` được EXECUTE; hàm `STABLE` + `SECURITY DEFINER`; bốn lần tra cứu không ghi dòng nào (kể cả audit); bản nháp không lộ; nội dung đã xuất bản không đọc được → lỗi `22000`, không phải INVALID |
| `PW_LOCAL_STACK=1 npx playwright test e2e/m03/lookup.local.spec.ts --project=m03-local-stack` | 0 | 23/23 pass: chính bảng TypeScript, dựng thế giới bằng `test_support.lookup_world` qua `psql`, gọi RPC bằng publishable key, body qua `liveQrLookupResultSchema`, bằng `expected`; dọn bằng `test_support.reset_m03()` |
| `npx playwright test e2e/m03/lookup.local.spec.ts --project=m03` | 0 | 23 skipped: spec chỉ chạy ở project local-stack |
| `npm run ci` | 0 | typecheck (gồm `e2e/`) sạch; test 1124/1124; build xong |

### 19.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Toàn bộ project `m03-local-stack` (các spec giao diện chạy với adapter Supabase) | T198 |

### 19.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-115 | `test_support.lookup_world` (seed.sql, chỉ local, chỉ gọi khi test) dựng thẳng bằng SQL với `replica` thế giới của bảng sự thật — cần cả trạng thái không đi qua lệnh được (QR không tồn tại, nội dung có âm thanh ở điểm dừng cần tải trước). Ngoại lệ có chủ đích của quy tắc "không chèn nội dung bằng SQL tay" ở đầu seed.sql, ghi ngay tại hàm | Ghi nhận |
| D-116 | `test_support.reset_m03()` (T176) xóa `auth.users` khi đang `replica` nên khóa ngoại không cascade sang `auth.identities`; seed lại bị trùng khóa. E2E T191 phát hiện. Sửa: chỉ `replica` cho bảng `app` và `storage.objects`, xóa `auth.users` với trigger bật | Đã sửa |
| D-117 | `.env.local` (đã gitignore) tạo theo quickstart §2 với URL và publishable key của stack local; spec E2E đọc `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` từ môi trường, nếu không có thì từ file này | Chỉ local |

## 20. Đợt 2026-11-02 — Phase 14 US8 backend (T192–T193)

Branch `feat/m03-b-us8` tạo từ `feat/m03-b-us7` @ `81cd700`. Chỉ stack local.

### 20.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` + `supabase test db` | 0 | 12 file, 608/608 pass; `m03_us8_history` 46 ca: quyền; Q-10 liệt kê bản đã xuất bản mới nhất trước kèm người xuất bản và cờ tự xuất bản (Nhân viên tự xuất bản = có cờ, Quản lý xuất bản bản nháp của người khác = không), không có nội dung, dòng audit không có id; dòng xuất bản "Quãng đường (km): 4,5 → 6"; xuất bản bản sửa điểm dừng, xuất bản điểm tham quan, thu hồi QR, đóng, mở lại điểm dừng đều nêu cả hai tuyến bị ảnh hưởng; tuyến tự đóng nói lý do; C-06 STALE, bỏ bản nháp → `DA_BO`, không xóa gì, bản công khai không đổi, lịch sử không liệt kê bản đã bỏ, không còn bản nháp → FAILED; C-08 khôi phục bản 1 → bản nháp dựa trên bản 1 mang đúng nội dung, lần hai MSG-DRAFT-EXISTS, bản đang xuất bản/số không có → FAILED, nội dung cũ vi phạm giới hạn hiện hành → MSG-RESTORE-BLOCKED nêu chỗ cần sửa, không tạo gì, đúng một dòng audit, khôi phục điểm dừng; Q-11 Nhân viên → 42501, mới nhất trước, có `subjectId`, lọc người (không phân biệt hoa/thường), loại mục, thời gian, trang 50 dòng với `hasMore`, hai trang không lặp; không dòng thay đổi nào có JSON, id hay mã; đổi vai trò đọc bằng chữ thường |
| `npm run ci` | 0 | test 1124/1124 (`sqlCatalog.test.ts` kiểm thêm tên trạng thái, vai trò, nguồn đóng), build xong |

### 20.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Link "Mở mục liên quan" trên SCR-M03-009 (E-08) dùng `subjectId` | Việc của UI; backend và kiểu `AuditRow` đã có trường này |

### 20.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-106 | Dòng audit hiển thị bằng `app.audit_change_lines`: dòng trước/sau của xuất bản ("—" cho ô trống), trạng thái/vai trò bằng tên hiển thị §5.4, nguồn đóng, dòng riêng (bỏ bản nháp, khôi phục), "Tuyến bị ảnh hưởng: …" cho mọi thao tác trên điểm dừng/điểm tham quan | Đã xong |
| D-107 | `api.revoke_visit_point` được viết lại ở migration 3g: dòng audit ghi các tuyến bị ảnh hưởng | Đã xong |
| D-118 | Quyết định giai đoạn B #5: `admin-command-contract.md` Q-11 sửa trước (mỗi dòng kèm `subjectId` chỉ để dựng link, không hiển thị), rồi `AuditRow.subjectId?` (adminDtos.ts), adapter giả trả `subjectId` ở Q-11, SQL như vậy. Mục §11.4 về SCR-M03-009 E-08 đã có dữ liệu để dựng link | Đã xong phía backend/contract |
| D-119 | `subjectName` của dòng audit là tên **hiện tại** của mục (tính lúc đọc), không phải tên lúc ghi như adapter giả; tên cũ vẫn thấy trong dòng trước/sau | Ghi nhận |
| D-120 | Khôi phục tuyến có danh sách cũ chứa điểm dừng nay không còn hoạt động: trigger tham chiếu từ chối → FAILED MSG-GENERIC (adapter giả không kiểm). Hiếm ở MVP | Ghi nhận |

## 21. Đợt 2026-11-02 — Phase 14 US9 backend (T194–T196)

Branch `feat/m03-b-us9` tạo từ `feat/m03-b-us8` @ `a38e2fd`. Chỉ stack local. Phase 14 (T177–T196) hoàn tất.

### 21.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` + `supabase test db` | 0 | 13 file, 649/649 pass; `m03_us9_ingest_reports` 41 ca: chỉ `service_role` chạy `api.ingest_session`, `anon` gọi thẳng → 42501, báo cáo chỉ cho admin; nhận lần đầu → ACCEPTED, gửi lại giống hệt / đổi thứ tự lượt ghé và khóa / cùng thời điểm viết khác → IDENTICAL, khác nội dung → CONFLICT, một dòng, bản đầu nguyên; offset khác UTC → INVALID; phiên bỏ dở không lượt ghé; tuyến TAM_DONG và LUU_TRU vẫn nhận; phiên của version cũ kiểm theo version đó; 14 bản ghi không hợp lệ (lệch sequence/tên/điểm dừng với snapshot, tuyến/version không có, khóa lạ ở gốc và lượt ghé, trạng thái DANG_DIEN_RA, endedAt < startedAt, ghé trùng, giờ ngoài phiên, sessionId không phải UUID, version không nguyên, không phải object) → INVALID, không lưu gì; RPT-01 đếm theo `ended_at` trong kỳ với tỷ lệ trên tổng, `lastSuccessfulIngestionAt` UTC, 17:30 UTC 31/10 tính vào 01/11 giờ Việt Nam, lọc theo tuyến; RPT-02 đếm phiên phân biệt theo (tuyến, điểm dừng), điểm dừng chung hai tuyến đếm riêng; 367 ngày → MSG-REPORT-SPAN, 366 ngày nhận; một ngày lẻ / from > to → MSG-REPORT-DATES-INVALID; mặc định 30 ngày; không ghi audit |
| `supabase functions serve --env-file supabase/functions/.env` + `PW_LOCAL_STACK=1 npx playwright test e2e/m03/intake.local.spec.ts --project=m03-local-stack` | 0 | 22/22 pass: 19 ca của `SESSION_INTAKE_CASES` theo thứ tự qua Edge thật (publishable key, không JWT), đúng `result` và HTTP (200/409/422); body > 64 KiB → 413; GET → 405; du khách gọi thẳng RPC → bị từ chối. Import map `zod` (`supabase/functions/deno.json`) chạy được trên edge-runtime |
| `npx playwright test e2e/m03/intake.local.spec.ts --project=m03` | 0 | 22 skipped |
| `npm run ci` | 0 | test 1128/1128 (thêm `sessionSyncRecord.parity.test.ts`: bản sao `_shared/sessionSyncRecord.ts` và `_shared/common.ts` giống hệt nguồn ngoài dòng import), build xong |

### 21.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| `supabase/functions/session-intake/index.test.ts` (Deno) | Không cài Deno (quyết định giai đoạn B #7); các bước của handler đã chạy qua Edge thật ở E2E |
| Hai lần gửi cùng `sessionId` đồng thời | Chèn bằng `on conflict (session_id) do nothing` rồi so sánh; chưa thử hai phiên thật |

### 21.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-121 | `api.ingest_session` báo bản ghi không hợp lệ bằng SQLSTATE `22023` (thông điệp `INVALID_SESSION_RECORD`); Edge ánh xạ mã này sang 422 INVALID, lỗi khác sang 500 (M02 giữ PENDING). Physical §7.2 chỉ nói "raises a validation error" | Ghi nhận |
| D-122 | Edge cần cả `_shared/common.ts` (schema import `./common`), và Deno cần đuôi `.ts`: test parity so hai file sau khi bỏ dòng `import`, thay vì "ngoài dòng import zod" như T195 ghi | Ghi nhận |
| D-123 | DB kiểm lại timestamp phải là UTC (`Z` hoặc `±00:00`) như Zod `utcDateTime`; offset khác bị từ chối ở cả hai lớp | Theo contract |
| D-124 | Báo cáo từ chối khoảng ngày sai bằng lỗi `22023` có thông điệp là khóa (MSG-REPORT-DATES-INVALID / MSG-REPORT-SPAN); adapter hiện ánh xạ mọi lỗi query sang MSG-GENERIC, UI đã chặn khoảng sai trước khi gọi (R-17) | Ghi nhận; T197 xem có cần ánh xạ khóa không |
| D-125 | Tỷ lệ RPT-01 trả `double precision` (JSON `0.8`), không phải `numeric` | Ghi nhận |

## 22. Đợt 2026-11-02 — Phase 15 kiểm chứng giai đoạn B (T197–T200)

Branch `feat/m03-b-verify` tạo từ `feat/m03-b-us9` @ `6bf556e`. Chỉ stack local (Supabase CLI 2.122.0, Docker Desktop trên Windows); không link, không `db push`, không deploy. Phase 16 vẫn ⛔ (T201).

### 22.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `supabase db reset` + `supabase test db` | 0 | 13 file, 655/655 pass (thêm 3 ca snapshot thiếu một ngôn ngữ — D-128 — và 3 ca H08 — D-133) |
| Đối chiếu `src/modules/m03/api/rpcNames.ts` với schema `api` | — | 33/33 tên có function; chú thích đổi thành "tên đã chốt" (T197) |
| `M03_LOCAL_STACK=1 npx vitest run src/modules/m03/api/supabaseAdminApi.contract.local.test.ts` | 0 | 114 pass, 19 skipped (ca `itFakeOnly`): toàn bộ `src/modules/m03/api/contract/*.contract.ts` chạy với adapter Supabase, đăng nhập tài khoản seed, reset bằng `test_support.reset_m03()` trước mỗi ca (T197) |
| `supabase functions serve --env-file supabase/functions/.env` + `PW_LOCAL_STACK=1 npx playwright test --project=m03-local-stack --workers=1` | 0 | 68 pass, 4 skipped trên 72 ca (Q1–Q26, lookup, intake, perf): Q13, Q20 cần `failNext`, Q16 cần `holdLock`, Q17 cần `inflateLatestMedia` — chỉ có ở adapter giả (T198) |
| `npx playwright test` (project mock) | 0 | 26 pass, 46 skipped (spec `*.local.spec.ts` và ca chỉ chạy ở stack local) |
| `PW_LOCAL_STACK=1 npx playwright test e2e/m03/perf.local.spec.ts --project=m03-local-stack` | 0 | Đạt mọi mục tiêu R-24, xem §22.2 (T199) |
| `npm run ci` | 0 | lint 352 pass; test 1130 pass, 133 skipped; build xong |
| `git diff --check` | 0 | Không lỗi khoảng trắng (T200) |
| `gh workflow run ci.yml --ref feat/m03-b-verify` (run 41463656516, runner `ubuntu-26.04`) | 0 | Cả ba job `verify`, `e2e`, `local-stack` success; `local-stack` mất 7 phút 20 giây: pgTAP 655/655, contract 114 pass + 19 skipped, E2E `m03-local-stack` 68 pass + 4 skipped; T199 trên runner p95: review 0,60 s, publish 0,92 s, close 0,91 s, reopen 0,87 s, lookup 3,5 ms. Log lộ `sb_secret_…` của stack tạm trong bảng mà `supabase start` in ra, trước bước che key (D-134) |

### 22.2 Hiệu năng (T199)

Fixture `test_support.perf_world()`: 30 điểm dừng "Cần tải trước", mỗi điểm 20 điểm tham quan có một ảnh 50 KB, 10 tuyến cùng liệt kê cả 30 điểm. Mỗi thao tác chạy 10 lần trên `PerfCheckpoint001` (dựng lại 10 hành trình), lookup 100 lần; đo RPC qua supabase-js gồm HTTP local. Kết quả ghi ở `test-results/m03-perf.json` (không commit).

| Thao tác | Mục tiêu p95 | Lần đầu | Sau D-127 |
|---|---|---|---|
| `open_publication_review` (CHECKPOINT_REVISION) | — | Hết `statement_timeout` 8 s của `authenticated` | 0,73 s |
| `publish_unit` (CHECKPOINT_REVISION) | ≤ 5 s | Không đo được | 1,06 s |
| `close_checkpoint` | ≤ 5 s | Không đo được | 1,25 s |
| `reopen_checkpoint` | ≤ 5 s | Không đo được | 1,31 s |
| `api.lookup_qr` | ≤ 300 ms | — | 10 ms |

Đo nguội (ngay sau khi nạp, trước khi autovacuum ANALYZE): review ≈ 3,4 s, publish ≈ 3,7 s p95, vẫn dưới 5 s. Số đo của máy dev, không phải của môi trường cloud.

### 22.3 `NOT RUN`

| Mục | Lý do |
|---|---|
| `e2e/local-stack/global-setup.ts`, project `m01-local-stack` và `m02-local-stack` | Quyết định giai đoạn B #4: T198 chỉ làm phần M03 (hook phía Node trong `e2e/m03/localStack.ts`); BR-M03-I05, I06 ghi `NOT RUN` trong checklist BR |
| Test Deno `supabase/functions/*/index.test.ts` | Không cài Deno (quyết định giai đoạn B #7); handler đã chạy qua Edge thật ở E2E |
| Ca cần tiêm lỗi hoặc giữ khóa ở stack local (19 ca `itFakeOnly`; E2E Q13, Q16, Q17, Q20) | Hook chỉ có ở adapter giả; BUSY kiểm bằng dblink trong `m03_us4_revise`, rollback khi lỗi bằng khối con và SQLSTATE `CPQRV` trong pgTAP Phase 14 |
| SMTP thật | Chỉ Mailpit của stack local |

### 22.4 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-124 | Adapter không ánh xạ khóa lỗi báo cáo (MSG-REPORT-DATES-INVALID / MSG-REPORT-SPAN) | Đóng: UI chặn khoảng ngày sai trước khi gọi (`reportInput.ts`); lỗi server chỉ là lớp phòng thủ, hiện MSG-GENERIC |
| D-126 | Bucket `quest-media` có `allowed_mime_types` nên Storage từ chối tệp sai loại ngay lúc upload, trước khi `register_media` kịp trả MSG-FILE-TYPE như media-storage §1 bước 4 (contract test media lệch) | Bỏ danh sách MIME khỏi bucket; `register_media` kiểm `metadata.mimetype` như contract |
| D-127 | T199 lần đầu: review hết thời gian chờ. Ba nguyên nhân: `app.build_journey` nối jsonb trong vòng lặp (bình phương, 543 ms/tuyến); 7 hàm SQL nhỏ có `set search_path` nên planner không inline được, bị gọi hàng chục nghìn lần (`trim_text`, `is_blank`, `complete_bilingual`, `visit_point_name`, `text_len`, `non_empty_text`, `bilingual_complete`); `rebuild_routes` gọi `build_journey` hai lần mỗi tuyến vì subquery lateral bị kéo lên | `build_journey` viết lại set-based, cho kết quả giống hệt bản cũ trên cả 10 tuyến của fixture; 7 hàm trên bỏ mệnh đề `SET` (hàm invoker thuần túy, chỉ dùng tên đủ schema; `search_path` cố định vẫn bắt buộc với `SECURITY DEFINER` — plan §V; linter Supabase `function_search_path_mutable` sẽ cảnh báo 7 hàm này, chấp nhận); `bilingual_complete` bỏ subquery; `offset 0` trong `rebuild_routes`; `perf_world()` chạy ANALYZE ở cuối để đo trạng thái ổn định |
| D-128 | `app.non_empty_text(NULL)` và `app.bilingual_complete` trả NULL thay vì false: trong CHECK, NULL được coi là đạt, nên snapshot có tên thiếu `en`, resource thiếu `introductionText` hay caption sơ đồ thiếu một ngôn ngữ vẫn lọt qua `snapshot_checkpoints_ok` / `offline_route_map_ok` (lỗi tiềm ẩn từ Phase 14; `build_journey` chưa bao giờ sinh ra dạng này) | Sửa: luôn trả true/false; thêm 3 ca pgTAP trong `m03_02_triggers` |
| D-129 | Lệnh lưu và đổi trạng thái kiểm trạng thái hay nghiệp vụ trước STALE, còn adapter giả và contract kiểm STALE trước (contract test lệch) | SQL theo thứ tự của `store.run`: mục phải tồn tại → STALE → trạng thái và nghiệp vụ (03b, 03c, 03d, 03f, 03g) |
| D-130 | Review của tuyến chưa có tên tiếng Việt trả `routeName` rỗng, vi phạm `PublicationReview.routeName` (`z.string().min(1)`); adapter giả cũng trả rỗng nhưng không parse Zod | SQL và adapter giả dùng `Tuyến chưa đặt tên` (chuỗi đã có ở `fake/reports.ts`) cho review, chặn dung lượng và tên khóa BUSY; spec không quy định câu chữ — muốn câu khác thì sửa spec trước |
| D-131 | Tuyến bị ảnh hưởng trong review và ghi chú tác động sắp theo id ở SQL, theo tên ở adapter giả | SQL sắp theo `app.route_name` rồi id, như adapter giả |
| D-132 | T198 viết `e2e/local-stack/global-setup.ts` dùng chung M01/M02/M03 | Chỉ phần M03 (quyết định #4): project `m03-local-stack` dùng hook phía Node (`e2e/m03/localStack.ts`) dựng dữ liệu bằng chính adapter Supabase, Mailpit và psql; reset trước mỗi ca; Q4 và Q18 rẽ nhánh theo project; `MEDIA_BUCKET` tách sang `src/shared/config/storage.ts` để code Node import được mà không cần hằng Vite |
| D-133 | T200: 11 BR có assertion pgTAP kiểm đúng hành vi nhưng chưa trích ID (C02, C14, T02, T09, D06, X01, E03, E16, H05, L05, L07); K02 chỉ được kiểm ở E2E Q3; H08 chưa có test xuất bản tuyến đang tạm đóng | Gắn ID vào assertion; thêm chú thích BR-M03-K02 cho Q3; thêm 3 ca H08 vào `m03_us6_operations`. Checklist BR: 121 BR có test giai đoạn B trích đúng ID, 3 hàng trỏ dùng test của nhóm đích, 8 BR chỉ giao diện, 2 BR consumer `NOT RUN` |
| D-134 | `supabase start` in bảng trạng thái có key `sb_secret_…` của stack local trước khi bước cấu hình kịp `::add-mask::` (run 41463656516). Key chỉ thuộc stack tạm trong runner, bị hủy khi job kết thúc, không mở được dịch vụ nào bên ngoài | `ci.yml`: ghi output của `supabase start` ra file, chỉ in khi lỗi và đã lọc key; log của run 41463656516 đã xóa 2026-11-05 theo quyết định của chủ dự án |

## 23. Đợt 2026-11-05 — Phase 16 T201 (change brief triển khai)

Branch `docs/deploy-change-brief` tạo từ `main` @ `b347078`. Tham chiếu: [change brief CHG-M03-2026-11-05-01](change-brief-CHG-M03-2026-11-05-01-deployment.md), chủ dự án duyệt 2026-11-05. Không có lệnh cloud nào được chạy trong đợt này.

### 23.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm ci` | 0 | `node_modules` trên máy còn từ nhánh cũ, thiếu `@zxing/browser`; lockfile không đổi so với `main` |
| `npm run ci` (lần cuối, sau D-135) | 0 | typecheck sạch; lint 641 pass; test 2107 pass, 133 skipped; build xong, precache 74 mục |
| `npx playwright test --workers=4` (project mock) | 0 | 113 pass, 46 skipped (D-136) |
| `git diff --check` | 0 | Không lỗi khoảng trắng |
| Quét lịch sử git (128 commit, mọi ref) theo mẫu key Supabase, Google, GitHub, Resend, JWT, private key; liệt kê file `.env` từng được track | — | Không có secret theo các mẫu trên; `.env.e2e`, `.env.fake`, `.env.example` chỉ chứa giá trị giả hoặc placeholder. Chạy trước khi repo chuyển sang public (brief §12) |

### 23.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Job `local-stack`, pgTAP, test Deno | Đợt này không đổi backend |
| Quét secret trong bình luận PR, issue và log GitHub Actions ngoài các run ở §24 | Chỉ quét lịch sử git và các run ở §24 |
| T202–T210 | Chưa đến lượt; lệnh cloud chỉ chạy sau khi PR này merge |

### 23.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-135 | `SyncStatus.test.tsx`, ca "đã có chuyến mới đang chạy": phiên có `startedAt` cố định `2026-11-04T04:00Z`, `/trip` tự đóng phiên quá 24 giờ (BR-M02-022) nên test hỏng từ `2026-11-05T04:00Z` theo giờ thực, không liên quan tới thay đổi tài liệu. Lỗi ổn định 5/5 lần trước khi sửa | Sửa test: `startedAt` theo giờ thực, như `QrLinkPage.test.tsx`; pass 3/3 lần và trong `npm run ci` |
| D-136 | `npm run e2e` với số worker mặc định trên máy 20 nhân: 13 ca lỗi, chủ yếu hết thời gian chờ. Một worker: cả 13 file pass (53 ca). Bốn worker: toàn bộ pass. Unit test cũng có ca hết thời gian chờ trong lần chạy ngay sau `npm ci`, không lặp lại | Tải của máy local, không sửa code. Không đo được trên runner CI trong đợt này trước khi mở PR |
| D-137 | Tài liệu dẫn xuất lệch, ngoài phạm vi brief §7.1: `docs/README.md` dòng 74–76 (M02 "chưa cài đặt", M03 "chờ change brief", 004); `docs/architecture/tech-stack.md` dòng 80 ("chờ CHG-AI-2026-11-03-01"); `CLAUDE.md` ("Chưa có source code nào được viết") | Đã sửa ở §24 theo yêu cầu của chủ dự án |

## 24. Đợt 2026-11-05 — Đồng bộ tài liệu trạng thái (D-137)

Branch `docs/sync-status-docs` tạo từ `main` @ `34daa6f`. Chỉ sửa tài liệu; không có lệnh cloud nào được chạy.

| Mục | Kết quả |
|---|---|
| `npm run ci` | Exit 0: lint 641 pass; test 2107 pass, 133 skipped; build xong |
| `npx playwright test --workers=4` | Exit 0: 113 pass, 46 skipped |
| `git diff --check` | Exit 0 |
| `README.md`, `docs/README.md`, `CLAUDE.md` | Sửa trạng thái M02, M03, AI và phạm vi cloud. Giữ các địa chỉ `localhost` ở README §2 vì đó là hướng dẫn chạy trên máy; đổi tên mục và ghi rõ dữ liệu giả, địa chỉ Production không ghi trong repo |
| `docs/architecture/tech-stack.md` | Thêm status `Implemented — local`; áp cho phần đã đối chiếu với `package.json`, lockfile và `supabase/`. Các dòng cloud (Cloud environment, Web hosting, Backend model, Supabase, §7) và T210 giữ `Selected` |
| Brief §4, Q9 | Làm rõ: người vận hành cloud merge PR từ khi nối Vercel (T203), theo quyết định của chủ dự án về PR #39 |
| Xóa log run 41463656516 (`DELETE /actions/runs/{id}/logs`) | Exit 0; `gh run view --log` trả 0 dòng (D-134) |
| Quét `sb_secret_…` chưa bị che trong log: 5 run `workflow_dispatch` còn lại và 2 run `push` vào `main` trước 2026-11-02T15:00Z | 0 dòng |

## 25. Đợt 2026-11-05 — Chuẩn bị bàn giao Phase 16 (T202, T210, runbook)

Branch `feat/m03-phase16-prep` tạo từ `main` @ `21ca50a`. Không có lệnh cloud nào được chạy.

### 25.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm install --save-exact @vercel/analytics@2.0.1 @vercel/speed-insights@2.0.0` | 0 | Thêm hai gói vào `dependencies`, cập nhật lockfile |
| `npm run ci` | 0 | lint 644 pass; test 2120 pass, 133 skipped; build xong |
| `npx playwright test --workers=4` | 0 | 113 pass, 46 skipped |
| Quét build thường (`dist/`) tìm `_vercel/insights`, `_vercel/speed-insights` | — | Không có |
| `VERCEL_ENV=production npx vite build` vào thư mục tạm (đã xóa) | 0 | Chỉ chunk `startAnalytics-*.js` chứa `_vercel/insights` |
| Đối chiếu `vercel.json` bằng regex và `minimatch` | — | `/q/abc`, `/routes/x`, `/trip`, `/admin/login`, `/` khớp rewrite; `/assets/a.js` không khớp. `main` khớp `main`; `feat/x`, `docs/a/b` chỉ khớp `**` nên không deploy |
| `gh workflow run ci.yml --ref feat/m03-phase16-prep` (run 42060558523, commit `c3d31fa`) | 0 | `verify`, `e2e`, `local-stack` success: pgTAP PASS; contract 114 pass, 19 skipped; E2E `m03-local-stack` 68 pass; thêm hai project local-stack 5 pass và 9 pass; log không có `sb_secret_…` chưa bị che |

### 25.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| `vercel.json` trên Vercel thật (rewrite, header, chặn deploy nhánh khác) | Chưa có Vercel project; kiểm ở T206 và T208 theo [cloud-runbook.md](cloud-runbook.md) |
| Analytics và Speed Insights gửi sự kiện thật | Chỉ chạy trên Vercel; kiểm ở T208 |
| `publishableKeyFromEnv` trên project cloud | Chưa có project cloud; trên stack local đã chạy qua E2E M03; kiểm ở T205, T207, T208 |
| Các lệnh trong runbook | Agent không chạy lệnh cloud; Supabase CLI không cài trên máy này. Lệnh và cờ đối chiếu với tài liệu CLI, chưa chạy thử trên cloud |

### 25.3 Lệch và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| D-138 | Tài liệu Supabase xếp `SUPABASE_ANON_KEY` vào nhóm legacy trên hosted project, không nói rõ project mới có còn biến này không. `admin-accounts` và `translate` đọc biến này cho client của người gọi, nên có thể hỏng trên cloud | Thêm `_shared/publishableKey.ts`: đọc `SUPABASE_PUBLISHABLE_KEYS` trước, biến legacy sau; bổ sung vào brief §7.1 |
| D-139 | T202 ghi "mọi đường dẫn không khớp file tĩnh" về `/index.html`. Nếu `/assets/*` cũng rewrite, chunk cũ bị thiếu sẽ nhận HTML với header `immutable`, cache sai suốt một năm | Loại `/assets/` khỏi rewrite, trả 404. Thêm `git.deploymentEnabled` để chỉ `main` được deploy (brief Q4). Không có route nào của app nằm dưới `/assets/` |
| D-140 | `vite.config.ts` có `manifest.icons` rỗng, chờ chủ dự án cung cấp icon vuông 192 và 512 px; agent không tự tạo asset. Có thể ảnh hưởng checklist M7 (cài app lên màn hình chính) | Báo chủ dự án, chưa sửa |
