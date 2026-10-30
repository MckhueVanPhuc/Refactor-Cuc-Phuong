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
| D-3 | Phía server không điền được `{tên tệp}` trong MSG-FILE-TYPE / MSG-FILE-TOO-BIG (và MSG-RIGHTS-NOT-CONFIRMED, MSG-AV-LANGUAGE-MISSING, MSG-IMAGE-NOT-READABLE sau này): Physical §5.5 `app.media` không lưu tên tệp gốc, object name là UUID. Client kiểm trước với tên thật; adapter giả tạm dùng "tệp vừa tải lên". | `[NEEDS CLARIFICATION: thêm tên tệp gốc vào Media (spec-M03 §6.3 → S4 → Physical) hay chấp nhận câu không có tên tệp ở server]` |
| D-4 | T044: phần AuthService của `AdminApiProvider` để T065 (interface AuthService được định nghĩa ở T065) | Ghi nhận |
| D-5 | `store.contract.ts`: ca STALE và FORBIDDEN theo role là `it.todo` vì giai đoạn nền chưa có command nào có `expected` hoặc chỉ dành cho Quản lý; thêm ở US1 (T061, với C-18/C-19). FORBIDDEN cho danh tính không có tài khoản đã kiểm qua C-04 | Ghi nhận |
| D-6 | Contract nội bộ M03: tên trường `leftOutCheckpoints[] {name, reason}`, `leftOutQrObjects[] {name, missing}` và hình dạng DTO query trong `adminDtos.ts` do plan quyết (spec chỉ nêu nội dung) | Plan decision; T197 đối chiếu với migration |
| D-7 | Thêm 4 dev dependency ngoài T003 (`@testing-library/dom`, `@types/react`, `@types/react-dom`, `@types/node`); TypeScript 7.0.2 | Người dùng duyệt 2026-10-30 |
| D-8 | Token tên do triển khai đặt cho giá trị design-system chưa có tên (§4: cỡ chữ, viền, vùng chạm, thời lượng; sidebar 212px trong khoảng 200–220px) và token điều khiển theo bề mặt (`--control-accent`, `--control-border-color`, `--focus-ring-color`) | Giá trị giữ nguyên tài liệu |

### 1.5 Checkpoint Phase 2

"Nền sẵn sàng" **đạt**: T001–T055 xong và có bằng chứng ở §1.2. Còn mở: D-3 (`NEEDS CLARIFICATION`), các mục `NOT RUN` ở §1.3.
