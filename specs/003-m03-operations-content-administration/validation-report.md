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
| Q3 chập chờn một lần (§4.1) | Chưa tìm được nguyên nhân; không tái hiện trong hai lần chạy lại |

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
