---

description: "Danh sách task triển khai M03 — Operations & Content Administration"
---

# Tasks: M03 — Operations & Content Administration

**Input**: Tài liệu thiết kế trong `specs/003-m03-operations-content-administration/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: **Có.** Constitution "Testing & Validation" yêu cầu mỗi BR-* có test, contract test phủ Required/Conditional/Optional, test rollback cho thao tác atomic, test bảo mật cho role không được phép; plan.md "Validation Strategy" yêu cầu ít nhất một test cho mỗi BR-M03 còn hiệu lực. Test viết trước và phải FAIL trước khi cài đặt.

**Organization**: Task nhóm theo user story của [spec.md](spec.md) để mỗi story cài đặt và kiểm chứng độc lập.

> **Quy tắc dẫn xuất.** File này không tạo requirement. Hành vi lấy từ [spec-M03 v3.7](../../docs/spec/spec-M03.md); quyết định kỹ thuật lấy từ plan/research. Giữ nguyên tên contract (`JourneySnapshot`, `LiveQrLookupResult`, `LiveStationContent`, `SessionSyncRecord`, `SessionRecord`, `Revision`) và mọi ID. Mọi giới hạn số là **provisional** (spec-M03 §5.3).
>
> **Hai giai đoạn (research R-01).** Phase 1–12 là **giai đoạn A** (frontend, adapter, contract, cấu hình local), nằm trong phạm vi code hiện tại. Phase 13–15 là **giai đoạn B** (SQL migration, RPC, Edge Function, pgTAP, script cấp Reviewer) và được mở phạm vi **chỉ trên stack Supabase local** bởi change brief backend CHG-M03-2026-10-30-01 (APPROVED 2026-10-30; AGENTS.md §2; plan.md Complexity Tracking #1). Phase 16 (kích hoạt môi trường cloud và phát hành) cần thêm một change brief triển khai.
>
> **Giao diện.** Mọi task dựng màn hình dùng skill `frontend-design`; màu, font, khoảng cách, bo góc chỉ lấy từ token ([design-system.md](../../docs/design/design-system.md)); icon chỉ từ `assets/icons/`; hình thức tham chiếu `screens/screen-spec/M03/screen-spec-SCR-M03-nnn.md` và `screens/html/mockup-SCR-M03-nnn.html` (CLAUDE.md). Mọi chữ hiển thị đi qua danh mục thông báo (BR-M03-L13).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story của task (US1…US9, theo spec.md)
- Mỗi task nêu đường dẫn file chính xác

## Path Conventions

- Web app modular monolith (plan.md "Project Structure"): mã ứng dụng ở `src/`; M03 nằm trọn trong `src/modules/m03/`; phần dùng chung ở `src/shared/` và shell ở `src/app/`.
- Unit/contract/component test đặt cạnh mã nguồn dạng `*.test.ts(x)` (research R-23). E2E ở `e2e/m03/`.
- Backend (giai đoạn B) ở `supabase/`: `migrations/`, `functions/`, `scripts/`, `tests/`. Tên migration tạo bằng `supabase migration new <tên>`; `<ts>` trong đường dẫn là timestamp do CLI sinh.
- M03 không import từ `src/modules/m01|m02` và ngược lại (constitution II).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling gốc và cấu hình local (plan.md Implementation Sequence bước 1)

- [X] T001 Xin người dùng xác nhận plan.md Complexity Tracking #2 (file tooling gốc `package.json`, lockfile, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, thư mục `e2e/`) và #3 (chưa nối CI); ghi quyết định và ngày ngay dưới bảng Complexity Tracking của specs/003-m03-operations-content-administration/plan.md. Không làm T002 trở đi nếu #2 chưa được xác nhận
- [X] T002 Tạo package.json (Node.js 24 LTS, npm) với script `dev`, `dev:fake` (`vite --mode fake --port 5174`), `build`, `preview`, `typecheck` (`tsc -b --noEmit`), `lint` (`vitest run --passWithNoTests src/shared/ui/tokens.lint.test.ts`), `test` (`vitest run --passWithNoTests`), `e2e` (`playwright test --pass-with-no-tests`), `ci` (`npm run typecheck && npm run lint && npm run test && npm run build`); cài runtime dependency pin chính xác: `react`, `react-dom`, `react-router`, `@supabase/supabase-js`, `zod`, `qrcode` 1.5.x, `@types/qrcode`; commit package-lock.json (research R-02; tech-stack §13). Tạo .github/workflows/ci.yml (người dùng duyệt nối CI 2026-10-30): mỗi push và pull request chạy trên Node.js 24 job `verify` (`npm ci`, `npm run ci`) và job `e2e` (`npx playwright install --with-deps chromium`, `npm run e2e` — chỉ các project dùng mock); không dùng secret thật, chỉ giá trị giả của `.env.e2e`/`.env.fake`; job Supabase local thêm ở T198
- [X] T003 Cài dev dependency pin chính xác vào package.json: `typescript`, `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test`. Không thêm thư viện state, form, kéo-thả, UI framework hay linter ngoài tech-stack (research R-02, R-20, R-21); ghi phiên bản đã cài thật vào bảng "Phiên bản đã cài" mới ở cuối specs/003-m03-operations-content-administration/research.md R-02
- [X] T004 [P] Tạo tsconfig.json, tsconfig.app.json (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, jsx react-jsx, include `src`) và tsconfig.node.json (cho vite/vitest/playwright config)
- [X] T005 [P] Tạo vite.config.ts: `@vitejs/plugin-react`; `vite-plugin-pwa` kiểu prompt (không tự reload), Workbox **không** runtime-cache Supabase API, Auth, response quản trị hay media đã ký (research R-22; constitution VI); `define.__IS_PRODUCTION_BUILD__ = process.env.VERCEL_ENV === 'production'` (research R-13, fail-safe); khai báo kiểu trong src/vite-env.d.ts; đặt `VITE_APP_VERSION` lúc build từ `version` của package.json khi biến chưa có (src/shared/config/env.ts bắt buộc biến này)
- [X] T006 [P] Tạo vitest.config.ts (environment jsdom, setupFiles src/test/setup.ts, include `src/**/*.test.ts?(x)`) và src/test/setup.ts (cleanup Testing Library, polyfill tối thiểu cho jsdom); đặt sẵn biến `VITE_*` giả an toàn cho Vitest qua `test.env`, để src/shared/config/env.ts không làm hỏng mọi test có import nó
- [X] T007 [P] Tạo playwright.config.ts: `webServer` là **mảng** cấp cao nhất (Playwright không có webServer theo project), mỗi server một cổng: `npm run dev:fake` (5174) và `npm run dev` (5173, cho các project `*-local-stack`); project `m03` (testDir `e2e/m03`, baseURL `http://localhost:5174`) và `m03-local-stack` (testDir `e2e/m03`, baseURL `http://localhost:5173`, giai đoạn B); project `*-local-stack` chỉ được đưa vào danh sách khi biến môi trường `PW_LOCAL_STACK=1` — mặc định `npm run e2e` (và CI) chỉ chạy project dùng mock; M01/M02 thêm server và project của mình vào cùng file. Tạo e2e/m03/fixtures.ts (đăng nhập giả theo role qua fake auth, dữ liệu synthetic email `*@example.test`). Tạo src/shared/testing/e2eHooks.ts: chỉ khi `import.meta.env.MODE` là `e2e` hoặc `fake` mới gắn `window.__cpqTestHooks` (namespace `m01`/`m02`/`m03` do từng module đăng ký: nạp dữ liệu IndexedDB, tiêm lỗi theo tên), nạp bằng `import()` động trong nhánh MODE để không vào bundle production; gọi từ src/app/App.tsx
- [X] T008 [P] Tạo .env.example chỉ chứa tên biến + placeholder: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_VERSION`, `VITE_QR_PUBLIC_BASE_URL` (research R-14); tạo .env.fake chỉ chứa giá trị giả an toàn cho `npm run dev:fake` (`VITE_QR_PUBLIC_BASE_URL=http://localhost:5174`); cập nhật .gitignore cho `.env.local`, `node_modules/`, `dist/`, `test-results/`, `playwright-report/`, `e2e/.local-fixture.json`, và thêm ngoại lệ `!.env.fake`, `!.env.e2e` (.gitignore hiện bỏ qua mọi `.env.*` trừ `.env.example`; thiếu ngoại lệ thì hai file giá trị giả này không được commit và job CI của T002 không có cấu hình). Không có secret nào mang tiền tố `VITE_`
- [X] T009 [P] Tạo supabase/config.toml **chỉ cho local**: tắt self sign-up (`[auth] enable_signup = false`), `site_url = "http://localhost:5173"`, `additional_redirect_urls` gồm `/admin/invitation` và `/admin/recovery`, bật Inbucket/Mailpit thay SMTP thật (auth-account §4; quickstart §5); `[api] schemas = ["api"]` để Data API chỉ mở schema `api` (Physical §3, §9) — thiếu dòng này thì mọi đọc và RPC của M01/M02/M03 trên stack local đều lỗi. Không chạy `supabase link`/`db push`
- [X] T010 Tạo index.html và src/main.tsx (mount `<App/>`, import src/shared/ui/tokens.css) nếu chưa có package nào tạo trước (plan.md "Source Code")

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng dùng chung mà mọi user story cần (plan.md bước 2–5)

**⚠️ CRITICAL**: Không bắt đầu user story nào trước khi phase này xong

### Shared: cấu hình, Supabase client, UI nền, shell

- [X] T011 [P] Viết test src/shared/config/env.test.ts: base URL không có `/` cuối; bắt buộc HTTPS khi `IS_PRODUCTION_BUILD`; `http://localhost…` chỉ nhận ở build không phải Production; thiếu biến → lỗi khởi động rõ ràng (research R-14)
- [X] T012 [P] Cài đặt src/shared/config/env.ts: đọc và validate bằng Zod các biến `VITE_*` của T008, xuất `env` đã kiểm, `IS_PRODUCTION_BUILD` (từ `__IS_PRODUCTION_BUILD__`) và hằng công khai `MEDIA_BUCKET = 'quest-media'` (dùng chung với M01 R-06, M02 R-16)
- [X] T013 [P] Cài đặt src/shared/supabase/client.ts: factory `createSupabaseClient()` dùng publishable key từ src/shared/config/env.ts; không bao giờ nhận secret key
- [X] T014 [P] Tạo src/shared/ui/tokens.css (CSS custom properties đúng tên của design-system §2.2, §3, §4: `--color-*`, `--font-*`, `--space-*`, `--radius-*`, đổ bóng, chuyển động) và src/shared/ui/global.css (reset tối thiểu, font nền, focus ring)
- [X] T015 [P] Viết test quét token src/shared/ui/tokens.lint.test.ts: báo lỗi khi `src/**/*.module.css` hoặc `src/**/*.tsx` chứa literal màu (`#hex`, `rgb(`, `hsl(`) hay khoảng cách px ngoài src/shared/ui/tokens.css; báo lỗi khi tên biến `VITE_*` chứa `SECRET`/`SERVICE`. Script `lint` (khai báo ở T002) chạy test này (CLAUDE.md; tech-stack không chọn linter)
- [X] T016 [P] Dựng control form nền trong src/shared/ui/ (Button.tsx, TextField.tsx, TextArea.tsx, Select.tsx, Checkbox.tsx, RadioGroup.tsx + `*.module.css`): nhãn tiếng Việt, khe lỗi dưới trường nối `aria-describedby`, đếm ký tự tùy chọn, WCAG 2.1 AA (design-system §6). Dùng skill `frontend-design`
- [X] T017 [P] Dựng src/shared/ui/Dialog.tsx (focus trap, đúng hai nút, Esc = nút an toàn), src/shared/ui/Banner.tsx (info/success/warning/error) và src/shared/ui/Icon.tsx (chỉ tải ảnh từ `assets/icons/`), kèm `*.module.css`
- [X] T018 Tạo shell src/app/App.tsx, src/app/router.tsx (React Router data mode: `createBrowserRouter(createRoutesFromElements(...))` + `RouterProvider` — đổi từ declarative mode 2026-10-31 để dùng được `useBlocker` (T050) và `errorElement` (T046); **chưa** đăng ký route của module nào — mỗi module tự đăng ký ở task routes của mình: M01 T032, M02 T024, M03 T046 — để shell build được khi module khác chưa có) và src/app/paths.ts (hằng path dùng chung, gồm `PATHS.m02SessionEntry = '/trip'`) nếu package 001/002 chưa tạo; nếu đã có thì bỏ qua (plan M01 "Source Code")
- [X] T019 Viết test src/app/pwa/updateCoordinator.test.ts rồi cài đặt src/app/pwa/updateCoordinator.ts nếu package 001/002 chưa tạo: cập nhật kiểu prompt; chỉ áp bản mới khi người dùng đồng ý, lấy được lock exclusive `cpq:busy` (`ifAvailable: true`) **và** mọi hàm `registerBusyCheck(fn)` trả `false`. Thêm phần của M03: `registerUnsavedForm(id)`/`unregisterUnsavedForm(id)` giữ lock **shared** `cpq:busy` trong lúc còn form chưa lưu (research R-22; plan M01 R-14, D-02)

### Shared contracts cross-module (R-04) — test trước

- [X] T020 [P] Viết contract test src/shared/contracts/publishedRoute.test.ts với fixture synthetic hợp lệ/không hợp lệ cho mọi field Required/Optional của publication-public-contract §2: `timeTags` đúng một giá trị, both-or-none cho `participationRequirements`/`preparation`/`bestTime`/`safetyWarning`, `groupTags`/`experienceTags` ≥ 1 và phân biệt, `distanceKm` một chữ số thập phân, `checkpointSummaries` chỉ rỗng khi `status ≠ HOAT_DONG`; identifier là chuỗi không rỗng, không kiểm định dạng (constitution: identifier opaque) — fixture dùng id ngắn phải qua
- [X] T021 [P] Viết contract test src/shared/contracts/journeySnapshot.test.ts: `previousContentVersion` vắng ở version 1 và bằng `contentVersion - 1` khi có; `offlineResources` chỉ có và đủ một phần tử mỗi identifier khi `OFFLINE_REQUIRED`; `qrIdentifiers` không rỗng; `estimatedOfflineSizeBytes`/`offlineRouteMap` tùy chọn; không có trường audio/video (publication-public §3; SC-M03-024)
- [X] T022 [P] Viết contract test src/shared/contracts/liveQrLookup.test.ts: `content` chỉ khi `VALID`; `closedScope` chỉ khi `TEMPORARILY_CLOSED`; `mediaResources` rỗng khi `OFFLINE_REQUIRED`; `spokenLanguage` ∈ `vi`/`en`/`NONE`; không có field route; `qrIdentifier`, `checkpointId` là chuỗi không rỗng, không kiểm `^[A-Za-z0-9]{16,}$` (ràng buộc đó chỉ ở DB phía producer; constitution: identifier opaque) (live-qr-lookup §2; BR-M03-I03; SC-M03-025, 039)
- [X] T023 [P] Viết contract test src/shared/contracts/sessionSyncRecord.test.ts: `.strict()` ở gốc và phần tử (khóa `deviceId` → lỗi); `status` chỉ `HOAN_TAT`/`BO_DO`; `endedAt >= startedAt`; `checkpointId` duy nhất; `checkedInAt` trong `[startedAt, endedAt]` (session-intake §1; BR-M03-J01)
- [X] T024 [P] Cài đặt src/shared/contracts/publishedRoute.ts (Zod + kiểu suy ra `PublishedRoute`) cho T020 qua
- [X] T025 [P] Cài đặt src/shared/contracts/journeySnapshot.ts (Zod + kiểu `JourneySnapshot`) cho T021 qua
- [X] T026 [P] Cài đặt src/shared/contracts/liveQrLookup.ts (Zod + kiểu `LiveQrLookupResult`, `LiveStationContent`) cho T022 qua
- [X] T027 [P] Cài đặt src/shared/contracts/sessionSyncRecord.ts (Zod strict + kiểu `SessionSyncRecord`) cho T023 qua
- [X] T028 Tạo src/shared/contracts/index.ts xuất bốn schema; ghi chú đầu file: M01/M02 phải import từ đây, không định nghĩa lại (plan.md "Downstream References")

### M03 core: giới hạn, danh mục thông báo, contract quản trị

- [X] T029 [P] Viết test src/modules/m03/config/limits.test.ts so từng hằng với bảng giá trị chép từ spec-M03 §5.3 (tên, ký tự, số lượng, MB = 1 048 576 byte, `OFFLINE_PACKAGE_MAX_MB`, `REPORT_MAX_SPAN_DAYS`, thông số in QR, MIME hỗ trợ)
- [X] T030 [P] Cài đặt src/modules/m03/config/limits.ts: mọi hằng §5.3, mỗi hằng có chú thích **provisional** + tham chiếu §5.3; nơi duy nhất phía client giữ giới hạn (research R-19)
- [X] T031 [P] Viết test src/modules/m03/messages/catalog.test.ts: danh sách khóa bằng đúng danh sách MSG-* của spec-M03 §5.6 (chép vào test); `formatMessage` điền placeholder; khóa lạ → MSG-GENERIC (BR-M03-L13)
- [X] T032 [P] Cài đặt src/modules/m03/messages/catalog.ts: mọi khóa MSG-* với đúng câu chữ §5.6, union `MessageKey` khép kín, `formatMessage(key, values)` (research R-18)
- [X] T033 [P] Cài đặt src/modules/m03/messages/displayNames.ts (tên hiển thị §5.4 cho trạng thái, role, mode, readiness, upload state, kết quả audit; danh sách "Words never shown to staff") kèm src/modules/m03/messages/displayNames.test.ts (mọi giá trị enum có tên hiển thị)
- [X] T034 [P] Cài đặt src/modules/m03/messages/hints.ts (chỉ các câu gợi ý §5.5, một dòng) kèm src/modules/m03/messages/hints.test.ts (BR-M03-L12)
- [X] T035 [P] Cài đặt src/modules/m03/messages/format.ts: `formatDate` dd/mm/yyyy, `formatTime` hh:mm bằng `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })`, `formatBytes` (MB kèm đơn vị), `qrSuffix(id)` = `QR_CODE_DISPLAY_SUFFIX_CHARS` ký tự cuối; test src/modules/m03/messages/format.test.ts độc lập múi giờ máy (research R-17)
- [X] T036 [P] Cài đặt src/modules/m03/messages/Message.tsx: component duy nhất render thông báo theo `messageKey` + `values` thường; không nhận chuỗi tự do (BR-M03-L10, L13)
- [X] T037 [P] Cài đặt src/modules/m03/messages/fieldLabels.ts: ánh xạ `targetFieldKey` → nhãn tiếng Việt trên editor (tuyến, điểm dừng, điểm tham quan) để `ValidationIssue.fieldLabel` và lịch sử trước/sau dùng chung (BR-M03-L04)
- [X] T038 [P] Viết test rồi cài đặt src/modules/m03/contracts/validationIssue.ts, src/modules/m03/contracts/publicationReview.ts, src/modules/m03/contracts/commandResult.ts (Zod + kiểu theo admin-command-contract §2–§4) và src/modules/m03/contracts/reportOutputs.ts (RPT-01, RPT-02 theo spec-M03 §5.1 "Report outputs"); test ở src/modules/m03/contracts/contracts.test.ts phủ từng nhánh của union `CommandResult` và luật Required/Conditional/Optional của `ValidationIssue`, `PublicationReview`, RPT-01, RPT-02 (constitution "Testing & Validation")
- [X] T039 Cài đặt src/modules/m03/contracts/adminDtos.ts: kiểu content của Revision (Route/Checkpoint/QR object, camelCase theo S4 §4) và DTO input/output cho C-01…C-19, Q-01…Q-14 (admin-command §5–§6)

### M03 API adapter (R-05, R-06)

- [X] T040 Cài đặt src/modules/m03/api/AdminApi.ts (interface có kiểu cho C-01…C-19, Q-01…Q-14, action Edge `admin-accounts`, upload Storage `uploadMedia`, URL đọc media `getMediaUrl`) và src/modules/m03/api/rpcNames.ts (bảng ánh xạ một chỗ từ command logic → tên `api.*` đề xuất; Physical §7.3 "Names are proposals")
- [X] T041 [P] Viết test src/modules/m03/api/errors.test.ts rồi cài đặt src/modules/m03/api/errors.ts: mất mạng/timeout → MSG-NETWORK-FAILED; JWT hết hạn/phiên bị thu hồi → MSG-SESSION-EXPIRED; không quyền → MSG-NO-PERMISSION; còn lại → MSG-GENERIC; chi tiết kỹ thuật chỉ vào `console`/log, không vào UI (research R-06; BR-M03-L10)
- [X] T042 Cài đặt src/modules/m03/api/supabaseAdminApi.ts: gọi `supabase.rpc` theo src/modules/m03/api/rpcNames.ts, ánh xạ camelCase ↔ tham số `p_*`, parse response bằng Zod của T038, đăng ký mọi request vào src/modules/m03/api/inflight.ts (`AbortController`, `abortAll()` cho đăng xuất)
- [X] T043 Cài đặt lõi adapter giả src/modules/m03/api/fake/store.ts và src/modules/m03/api/fake/fixtures.ts: store in-memory synthetic; kiểm `expectedConcurrencyRevision` → STALE kèm email + thời điểm; kiểm role theo admin-command §7 → FORBIDDEN; ghi đúng một dòng audit mỗi command (kể cả thất bại); hook tiêm lỗi (`failNext`) và giả lập khóa tập (`holdLock`) cho test; sinh id ngẫu nhiên. Viết trước bộ test hành vi **dùng chung cho mọi adapter**: src/modules/m03/api/contract/harness.ts (`describeAdminApiContract(name, makeApi)`; ca cần tiêm lỗi hoặc khóa đánh dấu `fakeOnly`) và src/modules/m03/api/contract/store.contract.ts (STALE, FORBIDDEN, đúng một dòng audit mỗi command), chạy với adapter giả qua src/modules/m03/api/fake/fakeAdminApi.contract.test.ts. Mọi test hành vi adapter của các story viết thành `src/modules/m03/api/contract/*.contract.ts` để T197 chạy lại y nguyên với adapter Supabase — fake và SQL bị kiểm bằng cùng một bộ test, tránh lệch khi chuyển sang backend thật
- [X] T044 Cài đặt src/modules/m03/api/fake/fakeAdminApi.ts (ghép các module fake theo khu vực: accounts, checkpoints, routes, publish, operations, history, reports, media) và src/modules/m03/api/AdminApiProvider.tsx (context chọn adapter và AuthService: `import.meta.env.MODE === 'fake'` → bản giả nạp bằng `import()` động để không vào bundle production, ngược lại Supabase; test inject fake trực tiếp); đăng ký namespace `m03` vào src/shared/testing/e2eHooks.ts (`failNext`, `holdLock`, nạp dữ liệu) để E2E giả lập lỗi dựng snapshot, BUSY và lỗi đóng điểm dừng (Q13, Q16, Q20)
- [X] T045 [P] Cài đặt src/modules/m03/api/fake/media.ts (C-04 `register_media`: kiểm MIME/kích thước theo loại, owner, usage; sinh `mediaId`; `usageRightsConfirmed = false`) kèm test hành vi src/modules/m03/api/contract/media.contract.ts (harness T043)

### M03 khung route, layout, editor dùng chung

- [X] T046 Cài đặt src/modules/m03/routes.tsx: cây `/admin/*` lazy theo admin-ui-flow §1 với trang placeholder cho mọi path; `errorElement` hiện MSG-NETWORK-FAILED khi chunk không tải được (M03 chỉ online); đăng ký cây vào src/app/router.tsx; mỗi story thay placeholder bằng màn thật
- [X] T047 Dựng src/modules/m03/layout/AdminLayout.tsx + AdminLayout.module.css: header, điều hướng Tuyến / Điểm dừng / Báo cáo / Tài khoản (R) / Nhật ký (R), khe cho nút đăng xuất (US1 nối), vùng banner thông báo
- [X] T048 [P] Viết test rồi cài đặt src/modules/m03/editor/FieldError.tsx và src/modules/m03/editor/useFieldIssues.ts: gắn `ValidationIssue` vào đúng trường theo `targetFieldKey`, hiện `message` qua src/modules/m03/messages/Message.tsx (BR-M03-L02)
- [X] T049 [P] Viết test rồi cài đặt src/modules/m03/editor/MissingToPublishPanel.tsx: luôn hiện, liệt kê issue `BLOCKS_PUBLISH`, bấm một dòng thì chuyển bước (nếu có) và focus `targetFieldKey` (BR-M03-L03)
- [X] T050 [P] Viết test rồi cài đặt src/modules/m03/editor/useUnsavedChangesGuard.ts: `useBlocker` cho điều hướng trong app, `beforeunload` cho đóng tab, đăng ký với `registerUnsavedForm` của src/app/pwa/updateCoordinator.ts; dialog MSG-UNSAVED-CHANGES hai nút (research R-20)
- [X] T051 [P] Viết test rồi cài đặt src/modules/m03/editor/CommandOutcome.tsx: render `CommandResult` theo admin-command §8 (STALE với email + hh:mm và nút "Tải lại"; BUSY với tên mục, không tự thử lại; BLOCKED; FAILED; FORBIDDEN; lỗi transport)
- [X] T052 Viết test src/modules/m03/editor/useDraftForm.test.tsx rồi cài đặt src/modules/m03/editor/useDraftForm.ts: một state form duy nhất (hai ngôn ngữ, media có thứ tự kèm tick quyền/ngôn ngữ nói, ghi chú nội bộ), theo dõi dirty, "Lưu bản nháp" gửi toàn bộ trong một command với `expectedConcurrencyRevision`, không autosave, không reset state khi lỗi/stale, MSG-SAVED chỉ khi `ok` (BR-M03-F11, L06; research R-20)
- [X] T053 [P] Viết test rồi cài đặt src/modules/m03/validation/common.ts: độ dài sau trim, chặn CR/LF ở trường một dòng, both-or-none song ngữ, bộ tạo `ValidationIssue` (severity, fieldLabel từ fieldLabels.ts, message từ catalog) với đúng các khóa MSG-LIMIT-TEXT, MSG-NUMBER-POSITIVE, MSG-NUMBER-TOO-BIG, MSG-NUMBER-DECIMALS, MSG-MISSING-FIELD, MSG-MISSING-LANGUAGE của §5.6 (research R-19)
- [X] T054 Viết test src/modules/m03/media/useUploadQueue.test.ts rồi cài đặt src/modules/m03/media/useUploadQueue.ts và src/modules/m03/media/MediaUploader.tsx: chọn nhiều tệp, mỗi tệp kiểm trước MIME/kích thước/số lượng/AV theo mode, tải riêng qua `AdminApi.uploadMedia` (bản Supabase: Storage `uploads/{ownerType}/{ownerId}/{uploadKey}` với `upsert: false`; bản giả: giữ Blob trong bộ nhớ), rồi C-04; trạng thái "Đang tải"/"Đã tải"/"Không tải được"; tệp lỗi không ảnh hưởng tệp khác; MSG-UPLOAD-SUMMARY, MSG-UPLOADED-NOT-SAVED (media-storage §1; BR-M03-E14)
- [X] T055 [P] Cài đặt src/modules/m03/media/signedUrl.ts: lấy URL đọc media qua `AdminApi.getMediaUrl(sourceRef)` (bản Supabase: signed URL của bucket `MEDIA_BUCKET`; bản giả: object URL) cho thumbnail editor và xem trước (research R-12); không cache

**Checkpoint**: Nền sẵn sàng — các user story có thể bắt đầu

---

## Phase 3: User Story 1 - Manage administrative access — US-M03-05 (Priority: P1) 🎯 MVP

**Goal**: Đăng nhập chỉ khi có `AdminAccount` ACTIVE; Reviewer mời, gửi lại, đổi role, khóa/mở khóa; nhận lời mời, khôi phục mật khẩu, đăng xuất (FR-M03-013; BR-M03-A01–A04, K01–K06)

**Independent Test**: Quickstart Q1–Q5 trên adapter giả: đăng nhập với/không có tài khoản active; mời và gửi lại; khôi phục mật khẩu với email có/không có; vô hiệu Reviewer cuối; đăng xuất từ form chưa lưu

### Tests for User Story 1 ⚠️

- [X] T056 [P] [US1] Viết test src/modules/m03/auth/LoginPage.test.tsx: không có tài khoản, `INVITATION_PENDING`, `DEACTIVATED` → `signOut({scope:'local'})` + MSG-LOGIN-DENIED; provider lỗi → MSG-LOGIN-FAILED; ACTIVE → `/admin/routes` (BR-M03-A04, K05; SC-M03-009)
- [X] T057 [P] [US1] Viết test src/modules/m03/auth/RequireAdmin.test.tsx: chưa đăng nhập → `/admin/login`; `CONTENT_STAFF` mở `/admin/accounts` hoặc `/admin/audit` → MSG-NO-PERMISSION (BR-M03-A02, A03)
- [X] T058 [P] [US1] Viết test src/modules/m03/auth/InvitationPage.test.tsx và src/modules/m03/auth/RecoveryPage.test.tsx: link sai/hết hạn → MSG-LINK-INVALID; mật khẩu không khớp → MSG-PASSWORD-MISMATCH; provider từ chối → MSG-PASSWORD-REJECTED; yêu cầu khôi phục luôn MSG-RECOVERY-SENT cho email có và không có; không lệnh gọi nào chạm `AdminAccount` (BR-M03-K01, K02; SC-M03-011)
- [X] T059 [P] [US1] Viết test src/modules/m03/accounts/AccountsPage.test.tsx: mời → MSG-INVITE-SENT; mời email đã ACTIVE → MSG-EMAIL-TAKEN; gửi lại không tạo bản sao; đổi role/khóa Reviewer cuối → MSG-LAST-REVIEWER; email sai → MSG-EMAIL-INVALID (BR-M03-K01, K03; SC-M03-008)
- [X] T060 [P] [US1] Viết test src/modules/m03/auth/useSignOut.test.tsx: có form chưa lưu → MSG-UNSAVED-CHANGES trước; gọi `abortAll()`; `signOut({scope:'local'})`; về `/admin/login`; không gọi command audit nào (BR-M03-K06; SC-M03-040)
- [X] T061 [P] [US1] Viết test hành vi src/modules/m03/api/contract/accounts.contract.ts (harness T043): hai thao tác đồng thời khóa và hạ role Reviewer cuối → cả hai BLOCKED; mỗi thay đổi có một dòng audit; `CONTENT_STAFF` gọi C-18/C-19/Q-14 → FORBIDDEN (BR-M03-K03, A03)
- [X] T062 [P] [US1] Viết E2E e2e/m03/auth.spec.ts cho quickstart Q1–Q5 trên project `m03`

### Implementation for User Story 1

- [X] T063 [US1] Cài đặt src/modules/m03/api/fake/accounts.ts: Q-01, Q-14, C-18, C-19 và mô phỏng Edge `admin-accounts` (`invite`/`resend`/`link`) theo auth-account §2.2–2.5, guard Reviewer cuối, audit `ACCOUNT_*`
- [X] T064 [P] [US1] Cài đặt src/modules/m03/api/adminAccountsEdge.ts: client Edge `admin-accounts` (`supabase.functions.invoke`), ánh xạ HTTP/`result` → messageKey theo auth-account §3; body không bao giờ được hiển thị thô
- [X] T065 [US1] Cài đặt src/modules/m03/auth/authService.ts (interface), bản Supabase src/modules/m03/auth/session.ts, bản giả src/modules/m03/auth/fakeAuthService.ts (MODE fake: tài khoản synthetic theo role, link mời và khôi phục giả, token bị từ chối sau đăng xuất — để Q1–Q5 chạy được trên adapter giả) và src/modules/m03/auth/CurrentAdminContext.tsx: bọc `signInWithPassword`, `signOut({scope:'local'})`, `resetPasswordForEmail` (redirect `/admin/recovery`), `updateUser`, `onAuthStateChange`; nạp Q-01 sau đăng nhập; role/status không đọc từ JWT metadata (research R-15)
- [X] T066 [US1] Cài đặt src/modules/m03/auth/RequireAdmin.tsx và src/modules/m03/auth/RequireReviewer.tsx (guard route; hiện MSG-NO-PERMISSION cho route chỉ Reviewer)
- [X] T067 [P] [US1] Dựng màn SCR-M03-000 src/modules/m03/auth/LoginPage.tsx + LoginPage.module.css theo screen-spec SCR-M03-000 (dùng `frontend-design`)
- [X] T068 [P] [US1] Dựng màn SCR-M03-007 src/modules/m03/auth/InvitationPage.tsx và src/modules/m03/auth/RecoveryPage.tsx (+ form yêu cầu khôi phục, `*.module.css`) theo auth-account §2.3–2.4 và screen-spec SCR-M03-007
- [X] T069 [US1] Cài đặt src/modules/m03/auth/useSignOut.ts và src/modules/m03/auth/SignOutButton.tsx; gắn nút vào header của src/modules/m03/layout/AdminLayout.tsx (auth-account §2.6)
- [X] T070 [US1] Cài đặt src/modules/m03/auth/useSessionExpiry.ts: khi adapter trả MSG-SESSION-EXPIRED, giữ state form, hiện thông báo, đưa về đăng nhập rồi quay lại (auth-account §2.7)
- [X] T071 [US1] Dựng màn SCR-M03-006 src/modules/m03/accounts/AccountsPage.tsx + AccountsPage.module.css: danh sách email/role/trạng thái bằng tên hiển thị §5.4; hộp mời (email + role); gửi lại; đổi role; khóa/mở khóa không có hộp xác nhận (BR-M03-L12 chỉ cho hộp xác nhận khi đóng, mở lại, lưu trữ, thu hồi, hủy, xuất bản và rời editor); chặn Quản lý cuối bằng MSG-LAST-REVIEWER
- [X] T072 [US1] Đăng ký `/admin/login`, `/admin/invitation`, `/admin/recovery`, `/admin/accounts` (RequireReviewer) và bọc mọi route còn lại bằng RequireAdmin trong src/modules/m03/routes.tsx

**Checkpoint**: US1 chạy độc lập trên adapter giả

---

## Phase 4: User Story 2 - Create and manage checkpoints and visit points — US-M03-03 (Priority: P1)

**Goal**: Thư viện điểm dừng dùng chung, điểm tham quan có QR với nội dung song ngữ, media nhiều tệp, ảnh in QR, xuất bản điểm dừng qua màn review (FR-M03-002, 003, 004; BR-M03-B01–B05, D01–D12, E01–E17 (E08 đã retire), F11, F12)

**Independent Test**: Quickstart Q6–Q10: tạo điểm dừng `OFFLINE_REQUIRED`/`ONLINE_AVAILABLE`, thêm điểm tham quan, upload nhiều tệp, xuất bản lần đầu, tải ảnh in, thu hồi QR cuối

### Tests for User Story 2 ⚠️

- [X] T073 [P] [US2] Viết test src/modules/m03/validation/checkpoint.test.ts: độ dài tên vi/en; mode bắt buộc, không mặc định; `ONLINE_AVAILABLE` cần tick khảo sát (MSG-ONLINE-NOT-VERIFIED); đổi sang `OFFLINE_REQUIRED` khi còn AV → MSG-MODE-HAS-AV (BR-M03-D01–D03, D11; SC-M03-025)
- [X] T074 [P] [US2] Viết test src/modules/m03/validation/visitPoint.test.ts: tên ≤ `NAME_MAX_CHARS`; giới thiệu `QR_INTRO_MIN_CHARS`…`QR_INTRO_MAX_CHARS`; ảnh ≤ 5, AV ≤ 3 (MSG-COUNT-IMAGES/MSG-COUNT-AV); AV ở điểm dừng offline → MSG-AV-OFFLINE; khoảng trống xuất bản: thiếu song ngữ, chưa tick quyền, AV thiếu `spokenLanguage` (BR-M03-E02–E06, E17; SC-M03-039)
- [X] T075 [P] [US2] Viết test src/modules/m03/checkpoint-library/CheckpointEditorPage.test.tsx: "Thêm điểm tham quan" tắt + MSG-MODE-REQUIRED-FIRST cho tới khi mode đã lưu; tên trùng (không phân biệt hoa/thường, so bản nháp và bản xuất bản) → MSG-CHECKPOINT-NAME-TAKEN; danh sách điểm tham quan hiện tên hoặc "chưa đặt tên {số}", trạng thái, readiness, "Mã …xxxxxx"; hủy điểm dừng chưa từng xuất bản cần lý do và hộp xác nhận MSG-CONFIRM-DISCARD-CHECKPOINT → `LUU_TRU`, điểm tham quan `NHAP` → `THU_HOI` (BR-M03-E15, E16, D03, D09; SC-M03-034)
- [X] T076 [P] [US2] Viết test src/modules/m03/visit-points/VisitPointEditorPage.test.tsx: không có QR trước lần lưu đầu; lần đầu MSG-QR-CREATED + "Thêm điểm tham quan khác"; tiêu đề "Đang sửa: {tên}" + MSG-VERSION-DRAFT/PUBLISHED; tick quyền từng tệp; lưu lỗi không xóa tệp đã tải; không có ô nhập identifier (BR-M03-E14–E16, F11, B01; SC-M03-013, 033)
- [X] T077 [P] [US2] Viết test src/modules/m03/visit-points/qr-print/renderQr.test.ts: chuỗi truyền vào `qrcode` đúng `{VITE_QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`, mức `Q`, margin 4; PNG ≥ `QR_PRINT_PNG_MIN_PX`; có "Mã …{6 ký tự}"; dòng cảnh báo song ngữ khi `OFFLINE_REQUIRED`; dấu "BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA" khi `!IS_PRODUCTION_BUILD`; QR chưa `HOAT_DONG` → MSG-QR-PRINT-UNPUBLISHED (BR-M03-B04, B05; SC-M03-036, 037). Decode ảnh thật trong E2E Q9 bằng `@zxing/browser` (đã có trong tech-stack, do M02 T003 cài); chưa cài thì ghi `NOT RUN`
- [X] T078 [P] [US2] Viết test src/modules/m03/visit-points/VisitPointLifecycle.test.tsx: in lại chỉ gọi C-17; thu hồi cần lý do + MSG-CONFIRM-REVOKE-QR; QR hoạt động cuối của điểm dừng hoạt động → MSG-LAST-QR; hủy QR `NHAP` lý do tùy chọn, có hộp xác nhận MSG-CONFIRM-DISCARD-QR (BR-M03-E07, E09–E11; SC-M03-004)
- [X] T079 [P] [US2] Viết test src/modules/m03/visit-points/preview/VisitorPreview.test.tsx: chuyển Tiếng Việt/English; AV chỉ ngôn ngữ đang chọn + "Không lời"; nhãn MSG-PREVIEW-DRAFT; không phát request ghi và không gọi `lookup_qr` (BR-M03-F12; SC-M03-032)
- [X] T080 [P] [US2] Viết test src/modules/m03/publication-review/PublicationReviewPage.checkpoint.test.tsx: `CHECKPOINT_FIRST_PUBLICATION` liệt kê điểm tham quan chưa sẵn sàng (MSG-QR-LEFT-OUT); xác nhận một lần MSG-CONFIRM-PUBLISH; sau xuất bản điểm dừng + điểm tham quan sẵn sàng `HOAT_DONG`, điểm chưa sẵn sàng giữ `NHAP`; `QR_OBJECT` xuất bản riêng; không cần người thứ hai; điểm dừng chưa sẵn sàng theo bốn điều kiện D04 (kể cả ảnh không đọc được ở `OFFLINE_REQUIRED` → MSG-IMAGE-NOT-READABLE) thì không xuất bản gì và liệt kê thiếu sót (BR-M03-D04, D05, D06, E13, A05, F01)
- [X] T081 [P] [US2] Viết test hành vi src/modules/m03/api/contract/checkpoints.contract.ts (harness T043): `qrIdentifier` ≥ 16 ký tự `[A-Za-z0-9]`, va chạm tự sinh lại không lộ lỗi; > 20 QR không `THU_HOI` → MSG-LIMIT-QR; điểm dừng hoạt động luôn ≥ 1 QR hoạt động (BR-M03-B02, B03, E02, E11)
- [X] T082 [P] [US2] Viết E2E e2e/m03/checkpoints.spec.ts cho quickstart Q6–Q10 trên project `m03`

### Implementation for User Story 2

- [X] T083 [US2] Cài đặt src/modules/m03/api/fake/checkpoints.ts: C-02, C-03 (lần lưu đầu tạo QRCode `NHAP` + `qrIdentifier` + revision 1 cùng lúc), C-07 cho điểm dừng/QR, C-16, C-17, Q-05, Q-06, Q-07; readiness tính trên dữ liệu đã lưu (BR-M03-D04, E05)
- [X] T084 [US2] Cài đặt src/modules/m03/api/fake/publish.ts phần Q-08 và C-05 cho `CHECKPOINT_FIRST_PUBLICATION`, `QR_OBJECT` (không tạo snapshot cho điểm dừng lần đầu; chạy lại guard; so `reviewedConcurrencyRevision`)
- [X] T085 [P] [US2] Cài đặt src/modules/m03/validation/checkpoint.ts cho T073 qua
- [X] T086 [P] [US2] Cài đặt src/modules/m03/validation/visitPoint.ts cho T074 qua
- [X] T087 [P] [US2] Dựng danh sách SCR-M03-008 src/modules/m03/checkpoint-library/CheckpointListPage.tsx + `.module.css`: trạng thái, mode, số điểm tham quan, tuyến đang dùng, Sẵn sàng/Chưa đủ (SF-M03-002-11)
- [X] T088 [US2] Dựng editor SCR-M03-008 src/modules/m03/checkpoint-library/CheckpointEditorPage.tsx + `.module.css`: tên vi/en, mode bắt buộc chọn, tick khảo sát khi `ONLINE_AVAILABLE`, ghi chú vị trí; panel thiếu; danh sách điểm tham quan theo BR-M03-E16 (mục vừa lưu tô sáng); nút Xuất bản (→ review), Hủy (C-07, lý do, hộp xác nhận MSG-CONFIRM-DISCARD-CHECKPOINT); dùng useDraftForm, useUnsavedChangesGuard
- [X] T089 [US2] Dựng SCR-M03-003 src/modules/m03/visit-points/VisitPointEditorPage.tsx + `.module.css`: thứ tự form tên → giới thiệu → ảnh → AV (chỉ `ONLINE_AVAILABLE`) → ghi chú lắp đặt; MediaUploader cho ảnh và AV, tick quyền từng tệp, chọn ngôn ngữ nói (Tiếng Việt/Tiếng Anh/Không lời); nút lưu tắt khi form mới còn rỗng (BR-M03-E15)
- [X] T090 [P] [US2] Cài đặt src/modules/m03/visit-points/qr-print/renderQr.ts (lazy `import('qrcode')`, SVG `toString({type:'svg', errorCorrectionLevel:'Q', margin:4})`, PNG qua canvas, vẽ nhãn, cảnh báo offline, dấu bản thử) và src/modules/m03/visit-points/qr-print/QrPrintPanel.tsx (tải SVG/PNG, ghi độ rộng in tối thiểu `QR_PRINT_MIN_SIZE_CM`) (research R-13; admin-ui-flow §4)
- [X] T091 [P] [US2] Cài đặt src/modules/m03/visit-points/VisitPointLifecycle.tsx: In lại (C-17), Thu hồi (C-16, lý do, xác nhận), Hủy (C-07, hộp xác nhận MSG-CONFIRM-DISCARD-QR)
- [X] T092 [P] [US2] Cài đặt src/modules/m03/visit-points/preview/VisitorPreview.tsx (Should): render client từ bản nháp đã nạp, media nháp qua src/modules/m03/media/signedUrl.ts (admin-ui-flow §5)
- [X] T093 [US2] Dựng SCR-M03-004 src/modules/m03/publication-review/PublicationReviewPage.tsx + `.module.css` cho đơn vị điểm dừng/QR: so sánh trước/sau, mục bị loại, xem trước từng điểm tham quan, "Quay lại sửa"/"Xuất bản" (C-05 với `reviewedConcurrencyRevision`), STALE thì mở lại review (BR-M03-F02)
- [X] T094 [US2] Đăng ký `/admin/checkpoints`, `/admin/checkpoints/new`, `/admin/checkpoints/:checkpointId`, `…/visit-points/new`, `…/visit-points/:qrIdentifier`, `/admin/review/:unitType/:subjectId` trong src/modules/m03/routes.tsx

**Checkpoint**: US1 và US2 chạy độc lập

---

## Phase 5: User Story 3 - Create and publish a route — US-M03-01 (Priority: P1)

**Goal**: Editor tuyến 4 bước, chọn/sắp xếp điểm dừng đã xuất bản, tự xuất bản qua review; lần đầu atomic với journey version 1 (FR-M03-001, 005, 006, 008; BR-M03-C01–C17 (C13 đã retire), T01–T09, F01–F04, G01–G03)

**Independent Test**: Quickstart Q11–Q13: lưu tuyến thiếu nội dung và xem panel; xuất bản tuyến đủ điều kiện; giả lập lỗi xuất bản

### Tests for User Story 3 ⚠️

- [X] T095 [P] [US3] Viết test src/modules/m03/validation/route.test.ts: độ dài mọi trường §5.3; `distanceKm` > 0, ≤ 100, một chữ số thập phân; `durationMin` ≤ 1440; `KHO` + `GROUP_GIA_DINH_CO_TRE`/`GROUP_CAN_DE_DANG` → MSG-TAG-CONFLICT; tag phân biệt; trùng điểm dừng → MSG-CHECKPOINT-DUPLICATE; > 30 → MSG-LIMIT-CHECKPOINTS; gallery ≤ 8; điểm nhấn 5 × 80; CR/LF ở trường một dòng (BR-M03-C02, C03, C05, C12, T03, T09; SC-M03-015)
- [X] T096 [P] [US3] Viết test src/modules/m03/validation/routeDerived.test.ts: `timeTags` ngưỡng 90/91/180/181; số điểm dừng và cờ offline suy ra; không bao giờ là input (BR-M03-C11, T08)
- [X] T097 [P] [US3] Viết test src/modules/m03/validation/publishGaps.test.ts: panel tuyến liệt kê thiếu song ngữ, both-or-none dở dang, thiếu thumbnail, chưa tick quyền media, không có điểm dừng hoạt động, cảnh báo an toàn trống cần tick (BR-M03-C04, C06, C09, C14, T04, T05, L03; SC-M03-001)
- [X] T098 [P] [US3] Viết test src/modules/m03/route-admin/RouteEditorPage.test.tsx: lưu thiếu nội dung vẫn được; không có ô identifier; bước 4 chỉ hiện điểm dừng `HOAT_DONG` kèm tên, mode, số điểm tham quan, tuyến khác; sắp xếp bằng nút lên/xuống và kéo-thả; xóa sơ đồ khi tick offline bật → tick tự bỏ + MSG-MAP-TICK-CLEARED; nhãn thời gian chỉ đọc; điểm dừng đóng giữ vị trí và được đánh dấu; câu gợi ý dưới các trường theo §5.5; hủy tuyến chưa từng xuất bản cần lý do và hộp xác nhận MSG-CONFIRM-DISCARD-ROUTE → `LUU_TRU`, điểm dừng nó liệt kê không đổi (BR-M03-B01, C01, C07, C08, C16, T01, T02, L01)
- [X] T099 [P] [US3] Viết test src/modules/m03/publication-review/PublicationReviewPage.route.test.tsx: thay đổi nhạy cảm được tô sáng; tick "không có cảnh báo an toàn" bắt buộc khi `noSafetyWarningConfirmationRequired`; ước tính dung lượng gói offline; điểm dừng đóng bị loại (MSG-CHECKPOINT-LEFT-OUT); FAILED → MSG-PUBLISH-FAILED và dữ liệu công khai không đổi; còn thiếu sót thì không xuất bản gì (BR-M03-F01, F02, C09, C10, F03, G07; SC-M03-002)
- [X] T100 [P] [US3] Viết test hành vi src/modules/m03/api/contract/publish-route.contract.ts (harness T043): xuất bản lần đầu tạo `HOAT_DONG` + snapshot version 1 hợp lệ theo src/shared/contracts/journeySnapshot.ts; `sequence` là vị trí trong danh sách và có khoảng trống khi điểm dừng không hoạt động; ước tính dung lượng không tính audio/video; lỗi giữa chừng không để lại trạng thái nửa vời; xuất bản tuyến không bao giờ xuất bản điểm dừng (BR-M03-C17, F04, G01, G02, G03, G10, X01; SC-M03-002, 024, 030)
- [X] T101 [P] [US3] Viết E2E e2e/m03/routes.spec.ts cho quickstart Q11–Q13 trên project `m03`

### Implementation for User Story 3

- [X] T102 [US3] Cài đặt src/modules/m03/api/fake/routes.ts: C-01 (lần đầu tạo Route `NHAP`), C-07 cho tuyến (lý do bắt buộc), Q-02, Q-03, Q-04
- [X] T103 [US3] Mở rộng src/modules/m03/api/fake/publish.ts cho `ROUTE_FIRST_PUBLICATION`: dựng snapshot từ dữ liệu live (mọi và chỉ điểm dừng hoạt động theo thứ tự), ước tính dung lượng theo research R-10, chặn khi vượt `OFFLINE_PACKAGE_MAX_MB`, rollback khi tiêm lỗi, audit FAILURE
- [X] T104 [P] [US3] Cài đặt src/modules/m03/validation/route.ts cho T095 qua
- [X] T105 [P] [US3] Cài đặt src/modules/m03/validation/routeDerived.ts cho T096 qua
- [X] T106 [P] [US3] Cài đặt src/modules/m03/validation/publishGaps.ts (gộp khoảng trống của tuyến, điểm dừng, điểm tham quan cho MissingToPublishPanel) cho T097 qua
- [X] T107 [P] [US3] Dựng SCR-M03-001 src/modules/m03/route-admin/RouteListPage.tsx + `.module.css`: tìm/lọc, tên vi (bản nháp nếu có), trạng thái bằng tên hiển thị, dấu "có bản nháp chờ", lần sửa cuối; Hủy tuyến chưa từng xuất bản (C-07, lý do, hộp xác nhận MSG-CONFIRM-DISCARD-ROUTE)
- [X] T108 [US3] Dựng khung SCR-M03-002 src/modules/m03/route-admin/RouteEditorPage.tsx + `.module.css`: điều hướng 4 bước, panel thiếu luôn hiện, một nút "Lưu bản nháp", nút Xuất bản → `/admin/review/ROUTE_FIRST_PUBLICATION|ROUTE_INFORMATION/:routeId`
- [X] T109 [P] [US3] Dựng bước 1 src/modules/m03/route-admin/steps/CardStep.tsx (thumbnail, tên, mô tả ngắn, quãng đường, thời lượng, độ khó)
- [X] T110 [P] [US3] Dựng bước 2 src/modules/m03/route-admin/steps/DetailsStep.tsx (mô tả, điểm xuất phát, yêu cầu tham gia, chuẩn bị, thời điểm phù hợp, cảnh báo an toàn với câu gợi ý C07/C08, gallery 0–8, sơ đồ 0–1 + tick offline, điểm nhấn 0–5)
- [X] T111 [P] [US3] Dựng bước 3 src/modules/m03/route-admin/steps/TagsStep.tsx (nhãn nhóm, nhãn trải nghiệm, nhãn thời gian chỉ đọc)
- [X] T112 [P] [US3] Dựng bước 4 src/modules/m03/route-admin/steps/CheckpointsStep.tsx và src/modules/m03/route-admin/steps/CheckpointPicker.tsx: tìm Q-04, thêm/bỏ, kéo-thả HTML5 + nút lên/xuống dùng bàn phím (research R-21), link "Tạo điểm dừng mới" sang SCR-M03-008 và quay lại giữ state
- [X] T113 [US3] Mở rộng src/modules/m03/publication-review/PublicationReviewPage.tsx cho đơn vị tuyến: `sensitiveChanges` tô sáng, tick an toàn, `affectedRoutes[].estimatedOfflineSizeBytes`, `leftOutCheckpoints`
- [X] T114 [US3] Đăng ký `/admin/routes`, `/admin/routes/new`, `/admin/routes/:routeId` trong src/modules/m03/routes.tsx

**Checkpoint**: US1–US3 chạy độc lập; có thể tạo điểm dừng → tuyến → xuất bản trên adapter giả

---

## Phase 6: User Story 4 - Revise published data (Priority: P1)

**Goal**: Sửa dữ liệu đã xuất bản qua một bản nháp chờ chung; stale bị từ chối; snapshot mới cho mọi tuyến bị ảnh hưởng, chuyển cùng lúc; tuần tự hóa trên tập kết nối (FR-M03-007, 009; BR-M03-F02–F07, F10, X01–X03, G04–G07, G10)

**Independent Test**: Quickstart Q14–Q17: hai phiên sửa cùng tuyến; sửa điểm dừng dùng chung bởi hai tuyến; hai lệnh xuất bản đồng thời; vượt trần offline

### Tests for User Story 4 ⚠️

- [X] T115 [P] [US4] Viết test src/modules/m03/editor/useDraftForm.stale.test.tsx: STALE hiện MSG-STALE với email và hh:mm, nút "Tải lại", chữ đang gõ còn nguyên, không ghi đè (BR-M03-F06, L05; SC-M03-005)
- [X] T116 [P] [US4] Viết test hành vi src/modules/m03/api/contract/publish-revise.contract.ts (harness T043): sửa bản đã xuất bản tạo/tiếp tục đúng một bản nháp chờ, bản công khai không đổi; đổi tên điểm dừng được 2 tuyến liệt kê → cả 2 có version mới cùng lúc, snapshot cũ nguyên; thay đổi không đổi hành trình không tạo version; đổi thứ tự điểm dừng chỉ tạo version cho tuyến đó; bật/tắt hoặc đổi sơ đồ offline tạo version mới, sơ đồ không đánh dấu không vào snapshot; đổi thông tin tuyến khác không tạo version; version liên tục (BR-M03-F06, X02, G03–G05, T06, C15, C16, D06; SC-M03-003, 022, 028, 029)
- [X] T117 [P] [US4] Viết test src/modules/m03/publication-review/PublicationReviewPage.revision.test.tsx: `CHECKPOINT_REVISION` liệt kê mọi tuyến bị ảnh hưởng với `createsNewJourneyVersion`, `closesAutomatically`, ghi chú tác động dùng từ vựng §5.4; MSG-REPRINT-MODE-CHANGED khi đổi mode; BUSY → MSG-ROUTE-BUSY không tự thử lại (BR-M03-L07); MSG-OFFLINE-TOO-BIG nêu tên tuyến và ảnh nặng nhất (BR-M03-F05, G10, X03; SC-M03-020)
- [X] T118 [P] [US4] Viết E2E e2e/m03/revise.spec.ts cho quickstart Q14–Q17 trên project `m03`

### Implementation for User Story 4

- [X] T119 [US4] Mở rộng src/modules/m03/api/fake/publish.ts cho `ROUTE_INFORMATION`, `CHECKPOINT_REVISION`, `QR_OBJECT` ở điểm dừng đang hoạt động: tính tuyến bị ảnh hưởng (`HOAT_DONG`/`TAM_DONG` có danh sách đã xuất bản chứa điểm dừng), dựng và so sánh snapshot, chỉ tạo version khi khác, chuyển tất cả cùng lúc; tập kết nối theo research R-08 qua `holdLock` → BUSY
- [X] T120 [US4] Mở rộng src/modules/m03/editor/useDraftForm.ts: luồng "Tải lại" sau STALE (nạp lại bản mới nhất sau xác nhận), chỉ báo đang hiện bản nháp hay bản đã xuất bản (MSG-VERSION-DRAFT/PUBLISHED) dùng chung cho ba editor
- [X] T121 [US4] Mở rộng src/modules/m03/publication-review/PublicationReviewPage.tsx: bảng tuyến bị ảnh hưởng, hậu quả ("gói tải trước của du khách cần cập nhật", "tuyến sẽ tự đóng tạm"), MSG-AFFECTED-ROUTES (ghi chú tác động), MSG-AV-ONE-LANGUAGE (chỉ cảnh báo), MSG-REPRINT-MODE-CHANGED
- [X] T122 [P] [US4] Cập nhật src/modules/m03/route-admin/RouteEditorPage.tsx và src/modules/m03/checkpoint-library/CheckpointEditorPage.tsx để mở bản nháp chờ nếu có, ngược lại bản đã xuất bản; dấu "có bản nháp chờ" ở danh sách

**Checkpoint**: US1–US4 chạy độc lập

---

## Phase 7: User Story 5 - Clear validation feedback — US-M03-09 (Priority: P1)

**Goal**: Phần lớn hành vi (FieldError, panel, useDraftForm, Message, catalog) đã có ở Phase 2; story này chốt các điểm còn lại và kiểm chứng xuyên màn hình (FR-M03-005, 019; BR-M03-L01–L13)

**Independent Test**: Quickstart Q18 và các test dưới đây: nhập giá trị sai, để thiếu, lưu lỗi/stale, quét DOM không có thuật ngữ kỹ thuật hay dữ liệu thô

### Tests for User Story 5 ⚠️

- [ ] T123 [P] [US5] Viết E2E e2e/m03/forbidden-words.spec.ts (quickstart Q18): duyệt mọi màn `/admin/*` với dữ liệu fake, quét DOM tìm từ cấm của src/modules/m03/messages/displayNames.ts, mã enum, `null`, `undefined`, `{`, mã HTTP, id nội bộ (trừ 6 ký tự cuối mã QR) (BR-M03-L09, L10, L11; SC-M03-026)
- [ ] T124 [P] [US5] Viết test src/modules/m03/editor/serverIssueMapping.test.tsx: issue `VALIDATION` từ server rơi đúng trường ở cả ba editor; issue chặn xuất bản phát hiện được khi lưu hiện ngay; lưu lỗi giữ state (BR-M03-L02, L04, L06; SC-M03-016)
- [ ] T125 [P] [US5] Viết test src/modules/m03/editor/noAutosave.test.tsx: không có command nào nếu không bấm "Lưu bản nháp"; MSG-SAVED chỉ sau khi cả form và media được lưu (BR-M03-F11; SC-M03-033)
- [ ] T126 [P] [US5] Viết test src/modules/m03/editor/confirmations.test.ts: mỗi hộp xác nhận dùng đúng khóa §5.6 + hai nút: MSG-CONFIRM-CLOSE-ROUTE, MSG-CONFIRM-REOPEN-ROUTE, MSG-CONFIRM-ARCHIVE-ROUTE, MSG-CONFIRM-DISCARD-ROUTE, MSG-CONFIRM-REOPEN-CHECKPOINT, MSG-CONFIRM-ARCHIVE-CHECKPOINT, MSG-CONFIRM-DISCARD-CHECKPOINT, MSG-CONFIRM-REVOKE-QR, MSG-CONFIRM-DISCARD-QR, MSG-CONFIRM-PUBLISH, MSG-UNSAVED-CHANGES; đóng điểm dừng dùng MSG-CLOSE-AFFECTS-ROUTES và MSG-CLOSE-ROUTE-AUTO; không có hộp xác nhận nào ngoài danh sách (BR-M03-L12; spec-M03 3.7 clarification 7 thêm Hủy mục chưa từng xuất bản)

### Implementation for User Story 5

- [ ] T127 [US5] Cài đặt src/modules/m03/editor/confirmations.ts (danh sách khép kín loại xác nhận → messageKey) và chuyển mọi hộp xác nhận hiện có trong src/modules/m03/** sang dùng nó
- [ ] T128 [US5] Rà soát src/modules/m03/** để mọi chữ thông báo đi qua src/modules/m03/messages/Message.tsx và mọi trạng thái/role/mode đi qua src/modules/m03/messages/displayNames.ts; sửa chỗ còn render giá trị thô cho T123 qua
- [ ] T129 [US5] Bổ sung `fieldLabel` còn thiếu trong src/modules/m03/messages/fieldLabels.ts cho mọi `targetFieldKey` mà validation client và server trả về (test so khớp trong src/modules/m03/messages/fieldLabels.test.ts)

**Checkpoint**: US1–US5 chạy độc lập

---

## Phase 8: User Story 6 - Close and reopen — US-M03-04 (Priority: P1)

**Goal**: Đóng khẩn cấp tuyến/điểm dừng (cả hai role), mở lại và lưu trữ (Reviewer), kết quả tất định, có audit (FR-M03-011; BR-M03-H01–H09, D09, D10)

**Independent Test**: Quickstart Q19–Q21: đóng điểm dừng chia sẻ; điểm dừng cuối của tuyến; giả lập lỗi đóng; mở lại theo từng role

### Tests for User Story 6 ⚠️

- [ ] T130 [P] [US6] Viết test src/modules/m03/operations/CloseDialog.test.tsx: lý do bắt buộc ≤ `NOTE_MAX_CHARS`; hiện MSG-CLOSE-AFFECTS-ROUTES và MSG-CLOSE-ROUTE-AUTO từ Q-09; FAILED → MSG-CLOSE-FAILED + nút "Đóng tạm các tuyến liên quan" gọi C-11; không bao giờ báo thành công giả (BR-M03-H01, H04)
- [ ] T131 [P] [US6] Viết test src/modules/m03/operations/ReopenDialog.test.tsx: chỉ Reviewer; ghi chú an toàn bắt buộc; MSG-REOPEN-BLOCKED kèm danh sách cần sửa; MSG-OFFLINE-TOO-BIG; Nhân viên → MSG-NO-PERMISSION (BR-M03-H06, H07, A03, G10)
- [ ] T132 [P] [US6] Viết test src/modules/m03/operations/ArchiveDialog.test.tsx: lưu trữ tuyến chỉ khi `TAM_DONG`, terminal, không đổi điểm dừng nó liệt kê (BR-M03-T07); lưu trữ điểm dừng bị MSG-CHECKPOINT-IN-USE nêu tên tuyến (BR-M03-H09, D10; SC-M03-031)
- [ ] T133 [P] [US6] Viết test hành vi src/modules/m03/api/contract/operations.contract.ts (harness T043): đóng điểm dừng hoạt động cuối của tuyến A và được tuyến B liệt kê → A `TAM_DONG` `AUTO_NO_ACTIVE_CHECKPOINT` có audit riêng, B có version mới, không bị trần chặn; mở lại điểm dừng không mở lại tuyến đã tự đóng; đóng tuyến không tạo version (BR-M03-H02, H03, H07, T05, G10; SC-M03-006, 019)
- [ ] T134 [P] [US6] Viết E2E e2e/m03/operations.spec.ts cho quickstart Q19–Q21 trên project `m03`

### Implementation for User Story 6

- [ ] T135 [US6] Cài đặt src/modules/m03/api/fake/operations.ts: C-09…C-15 và Q-09 theo admin-command §5 và data-model §8 (khóa tập, snapshot thay thế, tự đóng, lưu trữ điểm dừng thu hồi QR)
- [ ] T136 [P] [US6] Cài đặt src/modules/m03/operations/useOperationImpact.ts (Q-09) và src/modules/m03/operations/OperationDialog.tsx (khung chung: câu hậu quả, ô lý do/ghi chú, hai nút)
- [ ] T137 [P] [US6] Cài đặt src/modules/m03/operations/CloseDialog.tsx (C-09/C-10, lối thoát C-11)
- [ ] T138 [P] [US6] Cài đặt src/modules/m03/operations/ReopenDialog.tsx (C-12/C-13, kết quả kiểm tra kỹ thuật)
- [ ] T139 [P] [US6] Cài đặt src/modules/m03/operations/ArchiveDialog.tsx (C-14/C-15)
- [ ] T140 [US6] Gắn hộp thoại vào src/modules/m03/route-admin/RouteListPage.tsx (Đóng tạm, Mở lại (R), Lưu trữ (R)) và src/modules/m03/checkpoint-library/CheckpointEditorPage.tsx + CheckpointListPage.tsx (Đóng tạm, Mở lại (R), Lưu trữ (R)); ẩn nút theo role chỉ là tiện ích

**Checkpoint**: US1–US6 chạy độc lập

---

## Phase 9: User Story 7 - Live QR lookup — FR-M03-012 (Priority: P1)

**Goal**: Producer `LiveQrLookupResult`/`LiveStationContent` cho M02. Producer thật là `api.lookup_qr` (giai đoạn B, T190–T191); giai đoạn A chỉ chốt schema (T022/T026) và bảng sự thật làm oracle (FR-M03-012; BR-M03-I01–I06)

**Independent Test**: Bảng sự thật 6 bước I02 có/không `routeId` hợp lệ theo schema; ở giai đoạn B, quickstart Q22 trên stack local

### Tests for User Story 7 ⚠️

- [ ] T141 [P] [US7] Viết test src/shared/contracts/liveQrLookup.cases.test.ts: mọi output kỳ vọng trong bảng sự thật qua Zod của src/shared/contracts/liveQrLookup.ts; ca `OFFLINE_REQUIRED` có `mediaResources` rỗng; hai QR của cùng điểm dừng có nội dung khác nhau (BR-M03-I02, I03, E01; SC-M03-012, 017, 023)

### Implementation for User Story 7

- [ ] T142 [US7] Tạo src/shared/contracts/liveQrLookup.cases.ts: các ca synthetic (trạng thái QR/điểm dừng/tuyến, có/không `routeId`, `qrIdentifier` rỗng sau trim) → `outcome`/`closedScope` kỳ vọng theo live-qr-lookup §3; ghi chú: dùng làm oracle cho pgTAP/E2E giai đoạn B và cho test consumer của M02

**Checkpoint**: Schema và oracle lookup sẵn sàng cho M02 và giai đoạn B

---

## Phase 10: User Story 8 - History, restore and audit — US-M03-08 (Priority: P1; nhật ký toàn hệ thống: P2)

**Goal**: Lịch sử xuất bản từng mục, khôi phục thành bản nháp, bỏ bản nháp, audit một dòng mỗi thao tác, nhật ký toàn hệ thống cho Reviewer (FR-M03-007, 018; BR-M03-A05, F07–F10)

**Independent Test**: Quickstart Q23–Q24: xuất bản hai lần, khôi phục bản đầu, khôi phục khi đã có bản nháp, bỏ bản nháp, khôi phục bản vi phạm giới hạn mới, Nhân viên mở `/admin/audit`

### Tests for User Story 8 ⚠️

- [ ] T143 [P] [US8] Viết test src/modules/m03/history/ItemHistoryPanel.test.tsx: danh sách revision đã xuất bản (số, email người, thời gian, dấu "tự xuất bản"); trước/sau render dạng "{nhãn}: {trước} → {sau}", không JSON (BR-M03-F09, L10)
- [ ] T144 [P] [US8] Viết test src/modules/m03/history/RestoreAndDiscard.test.tsx: khôi phục tạo bản nháp `basedOnRevisionNumber`; đã có bản nháp → MSG-DRAFT-EXISTS; vi phạm giới hạn hiện hành → MSG-RESTORE-BLOCKED kèm chỗ cần sửa, không tạo gì; "Bỏ thay đổi" → `DA_BO`, bản xuất bản không đổi (BR-M03-F07, F10; SC-M03-021)
- [ ] T145 [P] [US8] Viết test src/modules/m03/history/AuditLogPage.test.tsx: chỉ Reviewer; lọc thời gian/người/loại mục; Thành công/Không thành công; tên hành động hiển thị; dấu tự xuất bản không thành dòng thứ hai (BR-M03-F08, F09, A03)
- [ ] T146 [P] [US8] Viết test hành vi src/modules/m03/api/contract/audit.contract.ts (harness T043): mọi command fake (C-01…C-19, invite/resend/link) ghi đúng một dòng audit kể cả khi thất bại; xuất bản bản nháp của chính mình có `selfPublished = true`; không có mật khẩu/token trong `beforeState`/`afterState`; mọi thao tác trên điểm dừng ghi audit nêu tên các tuyến bị ảnh hưởng (BR-M03-F08, A05, X06; SC-M03-014)
- [ ] T147 [P] [US8] Viết E2E e2e/m03/history.spec.ts cho quickstart Q23–Q24 trên project `m03`

### Implementation for User Story 8

- [ ] T148 [US8] Cài đặt src/modules/m03/api/fake/history.ts: C-06, C-08 (kiểm giới hạn hiện hành của src/modules/m03/config/limits.ts), Q-10, Q-11 (phân trang, lọc)
- [ ] T149 [P] [US8] Cài đặt src/modules/m03/history/auditFormat.ts: ánh xạ giá trị `action` của admin-command §5 → tên hiển thị; render trước/sau bằng src/modules/m03/messages/fieldLabels.ts và displayNames.ts
- [ ] T150 [P] [US8] Cài đặt src/modules/m03/history/ItemHistoryPanel.tsx, src/modules/m03/history/RestoreButton.tsx, src/modules/m03/history/DiscardDraftButton.tsx; gắn vào RouteEditorPage.tsx, CheckpointEditorPage.tsx, VisitPointEditorPage.tsx
- [ ] T151 [US8] Dựng SCR-M03-009 src/modules/m03/history/AuditLogPage.tsx + `.module.css` (Should) và đăng ký `/admin/audit` (RequireReviewer) trong src/modules/m03/routes.tsx

**Checkpoint**: US1–US8 chạy độc lập

---

## Phase 11: User Story 9 - Ingest sessions and report — US-M03-06 (Priority: P2)

**Goal**: Nhận `SessionSyncRecord` thành `SessionRecord` (giai đoạn B) và hai báo cáo RPT-01/RPT-02 (FR-M03-014, 015, 016; BR-M03-J01–J08)

**Independent Test**: Quickstart Q26 trên adapter giả (báo cáo); Q25 (intake) ở giai đoạn B

### Tests for User Story 9 ⚠️

- [ ] T152 [P] [US9] Viết test src/modules/m03/reports/reportInput.test.ts: mặc định 30 ngày lịch kết thúc hôm nay tại `Asia/Ho_Chi_Minh`; chỉ một ngày → MSG-REPORT-DATES-INVALID; `fromDate > toDate` bị từ chối; khoảng > 366 ngày → MSG-REPORT-SPAN; nhập dd/mm/yyyy → `YYYY-MM-DD` (BR-M03-J05; research R-17)
- [ ] T153 [P] [US9] Viết test src/modules/m03/reports/ReportsPage.test.tsx: ghi chú một dòng MSG-REPORT-UPDATED hoặc MSG-REPORT-NO-DATA-YET, MSG-REPORT-SCOPE, MSG-REPORT-VISIT-MEANING dưới RPT-02; không có phiên → MSG-REPORT-EMPTY; chỉ lỗi tải dùng kiểu cảnh báo với MSG-GENERIC; "Chuyến đi", "Hoàn thành"/"Bỏ dở"; RPT-02 có tên tuyến (BR-M03-J06–J08; SC-M03-035)
- [ ] T154 [P] [US9] Viết test src/shared/contracts/sessionSyncRecord.cases.test.ts: các ca intake kỳ vọng qua/không qua Zod đúng như bảng (BR-M03-J01–J03; SC-M03-007, 038)
- [ ] T155 [P] [US9] Viết E2E e2e/m03/reports.spec.ts cho quickstart Q26 trên project `m03`

### Implementation for User Story 9

- [ ] T156 [US9] Tạo src/shared/contracts/sessionSyncRecord.cases.ts: ca synthetic `ACCEPTED`, `IDENTICAL` (đổi thứ tự visits và khóa), `CONFLICT`, `INVALID` (sai `sequence`, sai tên, khóa `deviceId`, `DANG_DIEN_RA`, tuyến/version không có) làm oracle cho giai đoạn B
- [ ] T157 [US9] Cài đặt src/modules/m03/api/fake/reports.ts: Q-12, Q-13 trên `SessionRecord` synthetic; lọc `endedAt` theo `[fromDate 00:00, toDate+1 00:00)` giờ `Asia/Ho_Chi_Minh`; RPT-02 đếm `sessionId` phân biệt theo `(routeId, checkpointId)` (admin-command §6)
- [ ] T158 [P] [US9] Cài đặt src/modules/m03/reports/reportInput.ts cho T152 qua
- [ ] T159 [US9] Dựng SCR-M03-005 src/modules/m03/reports/ReportsPage.tsx + `.module.css`: lọc tuyến (tùy chọn) và khoảng ngày, bảng RPT-01, bảng RPT-02, ghi chú một dòng; không biểu đồ/export/real-time; đăng ký `/admin/reports` trong src/modules/m03/routes.tsx

**Checkpoint**: Mọi user story của giai đoạn A chạy độc lập trên adapter giả

---

## Phase 12: Polish & kiểm chứng giai đoạn A

**Purpose**: Việc xuyên story và bằng chứng cho giai đoạn A

- [ ] T160 [P] Rà soát WCAG 2.1 AA (bàn phím, focus, tương phản theo token, nhãn trường, thông báo `aria-live`) trên mọi màn src/modules/m03/** theo design-system §6; sửa chỗ thiếu
- [ ] T161 [P] Chạy `npm run build`; xác nhận cây `/admin/*` và `qrcode` nằm ở chunk lazy riêng; xác nhận bundle trong dist/ không chứa `APP_BACKEND_SECRET_KEY` hay service key (research R-24; constitution V). Ghi kết quả vào specs/003-m03-operations-content-administration/validation-report.md
- [ ] T162 Tạo specs/003-m03-operations-content-administration/checklists/br-test-coverage.md: bảng mọi BR-M03 còn hiệu lực (trừ C13, E08 đã retire) → file test giai đoạn A và (để trống, điền ở T200) giai đoạn B; BR nào chưa có test thì thêm test vào story tương ứng trước khi đóng phase; BR hành vi của consumer (BR-M03-I05, I06) ghi package M01/M02 chịu test; BR chỉ trỏ sang nhóm khác ghi test của nhóm đích: BR-M03-D07 → test nhóm E (T074, T078, T081), BR-M03-D08 → test của H01, H02, H04, H06 và D10 (T130–T133) (constitution "Testing & Validation")
- [ ] T163 Chạy `npm run ci` (script và workflow CI có từ T002), xác nhận lần chạy CI gần nhất trên nhánh thành công, và `npm run typecheck`, `npm run lint`, `npm run test`, `npm run e2e -- --project=m03`; ghi lệnh, mã thoát và số test vào specs/003-m03-operations-content-administration/validation-report.md; phần không chạy được ghi `NOT RUN` kèm lý do. Không tuyên bố PASS khi chưa chạy (AGENTS.md §6)
- [ ] T164 Chạy `git diff --check` và kiểm tra link tương đối trong các file đã thêm ở specs/003-m03-operations-content-administration/
- [ ] T165 Ghi danh sách artifact upstream có nguy cơ stale phát sinh trong lúc code (nếu có) vào specs/003-m03-operations-content-administration/validation-report.md; không tự sửa spec/architecture (AGENTS.md §4)

**Checkpoint**: Giai đoạn A hoàn tất. Dừng lại; giai đoạn B chỉ bắt đầu khi T167 xong

---

## Phase 13: Giai đoạn B — Nền backend (mở theo CHG-M03-2026-10-30-01, chỉ stack local)

**Purpose**: Migration bước 1, 2, 5 và helper chung của bước 3–4 (Physical Schema §13; plan.md bước 11, 13)

**Change brief backend**: CHG-M03-2026-10-30-01 — APPROVED 2026-10-30 (chủ dự án). Phạm vi: migration, function và view `api.*`, Edge Function `session-intake`/`admin-accounts`, script cấp Reviewer đầu tiên, pgTAP, seed và E2E local-stack, job CI `local-stack` — **chỉ stack Supabase local**; không `supabase link`, `db push` hay deploy (change brief §4, §7). Phase 13 bắt đầu khi Phase 2 xong; backend từng story ở Phase 14 làm song song với UI cùng story (change brief §8)

- [X] T166 Chờ người dùng duyệt change brief backend (bản nháp: specs/003-m03-operations-content-administration/change-brief-CHG-M03-2026-10-30-01-backend.md) mở phạm vi SQL migration, RPC, Edge Function, pgTAP và script operator (AGENTS.md §2; plan.md Complexity Tracking #1)
- [X] T167 Ghi tham chiếu change brief backend (ID, ngày, phạm vi) vào đầu file specs/003-m03-operations-content-administration/tasks.md (mục này) và vào cột cuối Complexity Tracking #1 của specs/003-m03-operations-content-administration/plan.md
- [ ] T168 Tạo supabase/migrations/<ts>_m03_01_schema_tables.sql: schema `app`, `api`; `app.new_id()`; `app.limit(name)` với giá trị khớp src/modules/m03/config/limits.ts; 9 bảng đúng cột, kiểu, null, PK/FK/UNIQUE/CHECK của data-model §2 (Physical §5); trigger `BEFORE UPDATE` đặt `updated_at` và yêu cầu `concurrency_revision = old + 1`; trigger từ chối `DELETE`/`TRUNCATE` (DEC-S6-002); các index của Physical §10: `revisions (subject_type, subject_id, status)`, GIN partial trên `content -> 'checkpointList'` cho revision tuyến `NHAP`/`PHAT_HANH`, `qr_codes (checkpoint_id, status)`, `media (owner_type, owner_id)`, `session_records (ended_at, route_id)` và `(route_id, ended_at)`, `audit_records (occurred_at desc)`, `(entity_type, entity_id)`, `(actor_user_id)`; không GIN-index JSON của snapshot; `ALTER DEFAULT PRIVILEGES IN SCHEMA app, api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC` (Physical §9: function thu hồi EXECUTE khỏi PUBLIC, cấp rõ từng role)
- [ ] T169 Tạo supabase/migrations/<ts>_m03_02_validation_triggers.sql: `app.revision_content_ok`, `app.snapshot_checkpoints_ok`, `app.visits_ok`; trigger `BEFORE INSERT OR UPDATE OF content` trên revisions (research R-27); trigger tham chiếu đa hình (REL-004/023/024–027); chuyển trạng thái hợp lệ (S4 §8); partial UNIQUE `NHAP`/`PHAT_HANH`; bất biến revision `PHAT_HANH`, snapshot, session, audit; QR: ≥ 1 QR hoạt động cho điểm dừng hoạt động, ≤ `CHECKPOINT_QR_MAX_ITEMS`; trigger cấp câu lệnh chặn 0 Reviewer hoạt động; deferred check snapshot active (DAC-M03-061–067)
- [ ] T170 Tạo supabase/migrations/<ts>_m03_03a_command_helpers.sql: `app.current_admin()` (`auth.uid()`, `ACTIVE`, `session_id` còn trong `auth.sessions` — research R-15); bộ dựng `CommandResult` jsonb; khung khối ngoài/khối trong ghi audit FAILURE sau rollback (research R-07); `app.lock_connected_set(ids)` với `pg_try_advisory_xact_lock` theo thứ tự id (research R-08); `app.stale_result(...)` trả email + thời điểm người sửa sau cùng (research R-09); mọi function `SECURITY DEFINER`, `search_path = ''`, `REVOKE EXECUTE … FROM PUBLIC` rồi `GRANT EXECUTE` đúng role theo Physical §7, §9 — quy ước áp cho mọi migration tạo function ở Phase 14
- [ ] T171 Tạo supabase/migrations/<ts>_m03_04a_rls_grants.sql: bật RLS mọi bảng `app`; thu hồi DML của `anon`/`authenticated`; chỉ mở schema `api` cho Data API; policy `SELECT` gọi `app.current_admin()` (Physical §9); cấp `USAGE ON SCHEMA app` và `EXECUTE` trên `app.current_admin()` cho `anon`/`authenticated` để policy Storage gọi được (hàm kiểm tham chiếu media được tạo và cấp quyền ở T172, vì migration 05 chạy sau) — schema `app` vẫn không nằm trong `[api] schemas`
- [ ] T172 [P] Tạo supabase/migrations/<ts>_m03_05_storage.sql: bucket private `quest-media`; admin ACTIVE insert trong `uploads/` không upsert; đọc công khai chỉ object được revision `PHAT_HANH` hoặc snapshot còn giữ tham chiếu; admin ACTIVE đọc mọi object (research R-12); không policy update/xóa cho client (media-storage §4); hàm kiểm tham chiếu media (object được revision `PHAT_HANH` hoặc snapshot còn giữ dùng) tạo trong cùng migration, `SECURITY DEFINER`, cấp `EXECUTE` cho `anon`/`authenticated`
- [ ] T173 [P] Viết pgTAP supabase/tests/m03_01_schema.test.sql: CHECK, khóa, update guard, từ chối DELETE/TRUNCATE, bất biến cột identity kể cả `qr_codes.checkpoint_id`; không xóa vật lý bản ghi hay snapshot nào (data-model §9; BR-M03-D12, E12, G08; FR-M03-010); đủ các index của Physical §10 (`has_index`)
- [ ] T174 [P] Viết pgTAP supabase/tests/m03_02_triggers.test.sql: `revision_content_ok` theo DAC; chuyển trạng thái sai bị chặn; đổi trạng thái revision cũ sang `LUU_TRU` không bị kiểm lại theo giới hạn mới; Reviewer cuối; QR hoạt động cuối
- [ ] T175 [P] Viết pgTAP supabase/tests/m03_03_access.test.sql: `anon`/`authenticated` không có DML; `app.current_admin()` từ chối tài khoản không ACTIVE và token của phiên đã đăng xuất (SC-M03-009, 040); policy Storage cho object nháp (`anon` không đọc được); quyền function (`function_privs_are`): `anon` không EXECUTE được command hay query quản trị nào, `authenticated` chỉ các function của admin-command §7, `api.ingest_session` chỉ `service_role`, `api.lookup_qr` cho `anon` và `authenticated`
- [ ] T176 Tạo supabase/seed.sql chỉ synthetic, chỉ local: người dùng Auth giả (`auth.users` + `auth.identities`, email `*@example.test`, mật khẩu giả) và dòng `app.admin_accounts` ACTIVE cho một `REVIEWER` và một `CONTENT_STAFF`. Không chèn tuyến hay điểm dừng bằng SQL tay (trigger và guard sẽ chặn); dữ liệu nội dung được dựng qua RPC ở T198. Không bao giờ seed lên cloud (AGENTS.md §4)

**Checkpoint**: `supabase db reset` local áp được migration 1, 2, 3a, 4a, 5 và pgTAP nền chạy

---

## Phase 14: Giai đoạn B — Backend theo user story

**Purpose**: Command/query/Edge cho từng story (plan.md bước 12–14). Mỗi story backend kiểm chứng độc lập bằng pgTAP của nó

### US1 backend

- [ ] T177 [US1] Tạo supabase/migrations/<ts>_m03_03b_accounts.sql: `api.get_current_admin`, `api.list_accounts`, `api.change_account_role`, `api.set_account_status` (khóa bảng, MSG-LAST-REVIEWER), function nội bộ tạo/giữ `INVITATION_PENDING` và nối `user_id` (chỉ `service_role`), `app.provision_initial_reviewer(email)` (chỉ khi bảng rỗng, idempotent, audit `actorUserId` trống, không có trong schema `api`)
- [ ] T178 [P] [US1] Cài đặt Edge supabase/functions/admin-accounts/index.ts: `invite`/`resend`/`link` theo auth-account §2.2–2.3, xác minh JWT + Reviewer, chuẩn hóa email, Auth Admin `inviteUserByEmail` với `redirectTo`, response theo auth-account §3, không lộ token/user id; xử lý preflight `OPTIONS` trước mọi kiểm tra và thêm header CORS vào mọi response qua supabase/functions/_shared/cors.ts (`authorization, x-client-info, apikey, content-type`); khai báo `[functions.admin-accounts] verify_jwt = false` trong supabase/config.toml và tự xác minh JWT người gọi trong function (publishable key không phải JWT); test Deno supabase/functions/admin-accounts/index.test.ts gồm người gọi không phải Reviewer → 403, thiếu/hết hạn JWT → 401, `link` với email không khớp → 422
- [ ] T179 [P] [US1] Tạo script operator supabase/scripts/provision-initial-reviewer.ts: đọc `APP_BACKEND_SECRET_KEY` từ shell, gọi `inviteUserByEmail` rồi `app.provision_initial_reviewer`; không deploy, không vào bundle (research R-16)
- [ ] T180 [US1] Viết pgTAP supabase/tests/m03_us1_accounts.test.sql: Reviewer cuối bị chặn kể cả đồng thời; `CONTENT_STAFF` gọi C-18/C-19/Q-14 → FORBIDDEN; cấp đầu tiên chỉ khi rỗng, lần hai no-op, không grant cho `anon`/`authenticated`; mỗi thay đổi một dòng audit; stack local có `enable_signup = false` (BR-M03-A01, K03, K04; SC-M03-008, 010, 011)

### US2 backend

- [ ] T181 [US2] Tạo supabase/migrations/<ts>_m03_03c_checkpoints_visit_points.sql: `api.save_checkpoint_draft` (khóa tên chuẩn hóa — Physical §14 O-1), `api.save_visit_point_draft` (sinh `qrIdentifier` ≥ 16 ký tự từ nguồn ngẫu nhiên an toàn, tự sinh lại khi va chạm), `api.register_media` (xác minh `storage.objects`, `metadata.size`, `mimetype`), `api.discard_unpublished`, `api.revoke_visit_point`, `api.record_reprint`, `api.list_checkpoints`, `api.get_checkpoint_editor`, `api.get_visit_point_editor`
- [ ] T182 [US2] Viết pgTAP supabase/tests/m03_us2_checkpoints.test.sql: tên trùng không phân biệt hoa/thường; MSG-MODE-HAS-AV; AV ở điểm dừng offline bị từ chối; QR không có trước lần lưu đầu; MSG-LIMIT-QR; MSG-LAST-QR; `register_media` từ chối object không tồn tại/sai MIME/quá cỡ; lưu một lần all-or-nothing; hủy điểm dừng chưa xuất bản thu hồi QR `NHAP`; xuất bản điểm dừng `OFFLINE_REQUIRED` có ảnh không đọc được bị chặn (BR-M03-D02, D03, D04, D09, E02, E04, E09, E14, F11)

### US3 backend

- [ ] T183 [US3] Tạo supabase/migrations/<ts>_m03_03d_routes_publish.sql: `api.save_route_draft`, `api.list_routes`, `api.get_route_editor`, `api.list_selectable_checkpoints`, `app.build_snapshot(route_id)` + chuẩn hóa/so sánh `jsonb` + ước tính dung lượng (research R-10), `api.open_publication_review` (chỉ đọc), `api.publish_unit` cho `ROUTE_FIRST_PUBLICATION`, `CHECKPOINT_FIRST_PUBLICATION`, `QR_OBJECT` với guard Physical §8 và audit `selfPublished`
- [ ] T184 [US3] Tạo supabase/migrations/<ts>_m03_04b_public_views.sql: view `api.published_routes` và `api.active_journey_snapshots` (owner-executed, `security_barrier`, field whitelist; giá trị suy ra `timeTags`, `checkpointCount`, `hasOfflineRequiredCheckpoint`, `hasOfflineRouteMap`, `checkpointSummaries`); grant `SELECT` cho `anon`, `authenticated`. Tên cột theo Physical §3 và đúng danh sách cột trong src/shared/contracts/publicationRowMapping.ts (M01 T014): cột là `snake_case` của key cấp cao nhất của contract, giá trị lồng (song ngữ, mảng, object) là `jsonb` giữ key `camelCase`, trường Optional là cột nullable
- [ ] T185 [US3] Viết pgTAP supabase/tests/m03_us3_publish.test.sql: xuất bản lần đầu atomic với version 1; lỗi dựng snapshot → rollback toàn bộ + audit FAILURE; tuyến chưa xuất bản vắng khỏi view; view không lộ `closureReason`, user id, bản nháp; output view qua được fixture của src/shared/contracts (so khớp key) (BR-M03-C17, F03, F04, G06, G07, G09; SC-M03-001, 002)

### US4 backend

- [ ] T186 [US4] Mở rộng bằng migration mới supabase/migrations/<ts>_m03_03e_publish_revisions.sql: `api.publish_unit` cho `ROUTE_INFORMATION`, `CHECKPOINT_REVISION` và QR ở điểm dừng đang hoạt động: tuyến bị ảnh hưởng, khóa tập kết nối, version liên tục chỉ khi snapshot khác, trần `OFFLINE_PACKAGE_MAX_MB`; viết pgTAP supabase/tests/m03_us4_revise.test.sql: stale không ghi đè; hai tập giao nhau → một BUSY, tập rời nhau → cả hai chạy; 2 tuyến chung điểm dừng nhận version cùng lúc; không đổi hành trình → không version (BR-M03-F05, F06, G03–G05, G10, X02; SC-M03-003, 005, 020, 029)

### US5 backend

- [ ] T187 [US5] Viết pgTAP supabase/tests/m03_us5_messages.test.sql: mọi nhánh từ chối của command trả `messageKey` có trong danh mục §5.6 (danh sách chép từ src/modules/m03/messages/catalog.ts) và `ValidationIssue` có `targetFieldKey` được src/modules/m03/messages/fieldLabels.ts biết; không có text lỗi Postgres nào lọt ra `CommandResult` (BR-M03-L08, L10, L13)

### US6 backend

- [ ] T188 [US6] Tạo supabase/migrations/<ts>_m03_03f_operations.sql: `api.close_route`, `api.close_checkpoint` (snapshot thay thế, tự đóng `AUTO_NO_ACTIVE_CHECKPOINT` có audit riêng, miễn trần), `api.close_routes_listing_checkpoint`, `api.reopen_route`, `api.reopen_checkpoint` (kiểm tra H06, trần), `api.archive_route`, `api.archive_checkpoint` (thu hồi QR, MSG-CHECKPOINT-IN-USE), `api.get_operation_impact`
- [ ] T189 [US6] Viết pgTAP supabase/tests/m03_us6_operations.test.sql: đóng điểm dừng atomic với mọi snapshot; lỗi → không đổi gì, MSG-CLOSE-FAILED; tuyến không bao giờ tự mở lại; trần không chặn đóng/thu hồi; `CONTENT_STAFF` gọi C-12…C-15 → FORBIDDEN; mỗi thao tác trên điểm dừng ghi audit nêu tên tuyến (BR-M03-H01–H09, D10, X06, X07; SC-M03-006, 019, 031)

### US7 backend

- [ ] T190 [US7] Tạo supabase/migrations/<ts>_m03_04c_lookup_qr.sql: `api.lookup_qr(p_qr_identifier text, p_route_id text default null)` `STABLE`, `SECURITY DEFINER` (`anon` không có quyền trên bảng `app`), `search_path = ''`, chỉ đọc, trả một `jsonb` đúng shape `LiveQrLookupResult` (key `camelCase`, trường vắng thì không có key), thứ tự đánh giá I02, chỉ nội dung `PHAT_HANH`, `mediaResources` rỗng khi `OFFLINE_REQUIRED`, lỗi không kết luận được thì raise; `EXECUTE` cho `anon`, `authenticated`
- [ ] T191 [US7] Viết pgTAP supabase/tests/m03_us7_lookup.test.sql theo src/shared/contracts/liveQrLookup.cases.ts (bảng sự thật 6 bước, có/không `routeId`, bản nháp không lộ, đếm dòng trước/sau = không ghi) và E2E e2e/m03/lookup.local.spec.ts gọi RPC trên stack local, parse bằng Zod (quickstart Q22; BR-M03-I01–I04, X04; SC-M03-012, 017, 023)

### US8 backend

- [ ] T192 [US8] Tạo supabase/migrations/<ts>_m03_03g_history.sql: `api.discard_draft`, `api.restore_revision` (savepoint, bắt lỗi trigger → MSG-RESTORE-BLOCKED, MSG-DRAFT-EXISTS), `api.get_item_history`, `api.list_audit_log` (chỉ Reviewer, phân trang, lọc)
- [ ] T193 [US8] Viết pgTAP supabase/tests/m03_us8_history.test.sql: mỗi command đúng một dòng audit kể cả thất bại; tự xuất bản có cờ; audit thao tác điểm dừng nêu tên tuyến bị ảnh hưởng (BR-M03-X06); khôi phục chặn khi có bản nháp; khôi phục bản vi phạm giới hạn đã siết → không tạo gì; lịch sử không bị xóa (BR-M03-F07–F10; SC-M03-014, 021)

### US9 backend

- [ ] T194 [US9] Tạo supabase/migrations/<ts>_m03_04d_ingest_reports.sql: `api.ingest_session(p_record jsonb)` (chỉ `service_role`; kiểm lại allowlist, snapshot tồn tại bất kể trạng thái tuyến, visit khớp `checkpointId`/tên vi/`sequence`, so sánh chuẩn hóa Physical §14 O-3 → trả `jsonb` `{ result: ACCEPTED | IDENTICAL | CONFLICT }`; bản ghi không hợp lệ thì raise lỗi validation để Edge trả `INVALID` — Physical §7.2), `api.report_rpt01`, `api.report_rpt02` (theo yêu cầu, `ended_at`, `Asia/Ho_Chi_Minh`, mặc định 30 ngày, ≤ `REPORT_MAX_SPAN_DAYS`)
- [ ] T195 [P] [US9] Cài đặt Edge supabase/functions/session-intake/index.ts: chỉ POST, body > 64 KiB → 413, allowlist khóa, xử lý preflight `OPTIONS` và CORS qua supabase/functions/_shared/cors.ts (chỉ POST cho request thật); `[functions.session-intake] verify_jwt = false` trong supabase/config.toml (du khách gọi bằng publishable key — không phải JWT; bật verify sẽ làm mọi bản ghi bị 401 và kẹt `PENDING` ở M02); Zod strict dùng bản sao supabase/functions/_shared/sessionSyncRecord.ts (Edge chỉ import được code trong `supabase/functions`) kèm test Vitest src/shared/contracts/sessionSyncRecord.parity.test.ts bảo đảm hai file giống hệt ngoài dòng import `zod` (import map `zod` → `npm:zod@<cùng phiên bản>` trong supabase/functions/deno.json), gọi `api.ingest_session`, response theo session-intake §3; test Deno supabase/functions/session-intake/index.test.ts theo src/shared/contracts/sessionSyncRecord.cases.ts; E2E e2e/m03/intake.local.spec.ts cho quickstart Q25
- [ ] T196 [US9] Viết pgTAP supabase/tests/m03_us9_ingest_reports.test.sql: retry giống hệt → `IDENTICAL`, một dòng; khác nội dung → `CONFLICT`, bản đầu nguyên; visit không khớp → `INVALID`, không lưu, không vào báo cáo; tuyến `TAM_DONG`/`LUU_TRU` vẫn nhận; `anon` gọi thẳng `api.ingest_session` bị từ chối; báo cáo đếm theo `ended_at` + múi giờ, 367 ngày bị từ chối; điểm dừng chung hai tuyến được đếm riêng theo từng tuyến (BR-M03-J01–J07, X05; SC-M03-007, 038)

---

## Phase 15: Polish & kiểm chứng giai đoạn B

**Purpose**: Nối adapter thật và chạy toàn bộ kịch bản quickstart trên stack local (plan.md bước 15)

- [ ] T197 Cập nhật src/modules/m03/api/rpcNames.ts theo tên function đã chốt ở migration bước 3–4; chạy toàn bộ src/modules/m03/api/contract/*.contract.ts với adapter Supabase trên stack local qua src/modules/m03/api/supabaseAdminApi.contract.local.test.ts (đăng nhập tài khoản seed của T176; ca `fakeOnly` đã được pgTAP rollback của Phase 14 phủ). Ca nào lệch giữa fake và SQL thì sửa bên sai so với contract
- [ ] T198 Viết e2e/local-stack/global-setup.ts: đăng nhập tài khoản seed (T176), dựng fixture qua RPC và Storage local (tuyến A–D của src/shared/contracts/__fixtures__/publication.ts; tuyến và điểm tham quan của quickstart M02 §4), ghi `routeId`/`qrIdentifier` thật vào e2e/.local-fixture.json cho các project `m01-local-stack`, `m02-local-stack`, `m03-local-stack` (identifier do hệ thống sinh — BR-M03-B01 — nên test local không hard-code `Q1a`). Sau đó chạy `supabase start`, `supabase db reset` (chỉ local), `supabase test db`, `supabase functions serve session-intake admin-accounts`, `PW_LOCAL_STACK=1 npm run e2e -- --project=m03-local-stack` cho Q1–Q26; thêm job `local-stack` vào .github/workflows/ci.yml (Supabase CLI trong runner: `supabase start`, `supabase db reset`, `supabase test db`, E2E `*-local-stack`; chỉ local, không link cloud); ghi kết quả vào specs/003-m03-operations-content-administration/validation-report.md; phần không chạy được (ví dụ SMTP thật) ghi `NOT RUN` kèm lý do
- [ ] T199 [P] Viết và chạy e2e/m03/perf.local.spec.ts: publish/close/reopen ≤ 5 s p95 với fixture 30 điểm dừng/tuyến, 20 QR/điểm dừng, 10 tuyến chung một điểm dừng; `api.lookup_qr` ≤ 300 ms p95; không đạt thì ghi là rủi ro trong validation-report.md, không chặn release (research R-24)
- [ ] T200 Điền cột giai đoạn B trong specs/003-m03-operations-content-administration/checklists/br-test-coverage.md; xác nhận mọi BR-M03 còn hiệu lực có ít nhất một test đã chạy; chạy `git diff --check`

---

## Phase 16: Kích hoạt môi trường cloud và phát hành (⛔ BLOCKED: cần change brief triển khai)

**Purpose**: Đưa sản phẩm lên Single Vercel Project và Single Supabase Cloud Project theo environment.md §10–11. AGENTS.md §2 chưa mở phạm vi cấu hình cloud và deploy; mọi task dưới đây chỉ chạy khi có change brief triển khai, và mọi lệnh tác động cloud cần người dùng duyệt

- [ ] T201 Chờ change brief triển khai (link project cloud, apply migration, deploy Edge Function, cấu hình Vercel, domain Production); ghi tham chiếu vào specs/003-m03-operations-content-administration/validation-report.md
- [ ] T202 [P] Tạo vercel.json: rewrite mọi đường dẫn không khớp file tĩnh về `/index.html` để `/q/{qrIdentifier}`, `/routes/{routeId}`, `/trip`, `/admin/*` mở được ngay lần đầu (thiếu rewrite thì mã QR quét bằng camera điện thoại trên máy chưa từng mở app trả 404 — SC-M02-017); header `Cache-Control: no-cache` cho `index.html`, `sw.js`, `registerSW.js`, `manifest.webmanifest`; asset có hash được cache dài (environment.md §5)
- [ ] T203 Cấu hình Supabase cloud sau khi kiểm project ref: Data API chỉ mở schema `api`; Auth tắt đăng ký công khai, `site_url` là origin HTTPS Production, redirect URL `/admin/invitation` và `/admin/recovery`; SMTP riêng cho email mời và khôi phục (dịch vụ email mặc định của Supabase chỉ dành cho thử nghiệm và bị giới hạn tần suất) (environment.md §5, §10; auth-account §4)
- [ ] T204 Apply migration vào Single Supabase Cloud Project theo environment.md §11: kiểm project ref, xem danh sách migration, dry-run nếu CLI hỗ trợ, kiểm sẵn sàng backup; không seed, không reset, không chạy test phá hủy trên cloud
- [ ] T205 Đặt secret `APP_BACKEND_SECRET_KEY` trong Supabase Edge secrets; deploy `session-intake` và `admin-accounts` với cùng cấu hình `verify_jwt = false` như local (T178, T195)
- [ ] T206 Cấu hình biến môi trường của Single Vercel Project: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_QR_PUBLIC_BASE_URL` = domain HTTPS Production cố định (release gate: chốt trước khi in tem thật — spec-M03 §9; spec.md Open clarifications); xác nhận build Production không còn dấu "BẢN THỬ" (research R-13)
- [ ] T207 Operator chạy supabase/scripts/provision-initial-reviewer.ts (T179) một lần cho môi trường trống; Reviewer đầu tiên mời ít nhất một Reviewer dự phòng (BR-M03-K03, K04)
- [ ] T208 Smoke check không phá hủy trên website đã deploy (environment.md §11): đọc công khai, đăng nhập và phân quyền M03, đọc media, đường offline, gửi phiên terminal; ghi kết quả vào specs/003-m03-operations-content-administration/validation-report.md
- [ ] T209 Release gate trước lần phát hành thật đầu tiên: chủ dự án kiểm chứng trên thiết bị thật các giá trị provisional (`SOURCE_REQUEST_TIMEOUT_SECONDS`, `LOOKUP_TIMEOUT_SECONDS`, giới hạn §5.3 của M03) và chạy checklist thủ công M01 T100, M02 T100; ghi kết quả vào specs/003-m03-operations-content-administration/validation-report.md

**Checkpoint**: Sản phẩm chạy trên môi trường cloud; tem QR thật chỉ được in sau T206 và T209

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: bắt đầu ngay; T001 chặn T002 trở đi
- **Foundational (Phase 2)**: sau Setup — CHẶN mọi user story
- **User Stories giai đoạn A (Phase 3–11)**: sau Foundational
- **Polish giai đoạn A (Phase 12)**: sau các story muốn giao
- **Giai đoạn B (Phase 13–15)**: đã mở (T166–T167 xong, CHG-M03-2026-10-30-01); Phase 13 sau Phase 2 (Foundational); Phase 13 trước Phase 14; Phase 15 sau Phase 14
- **Phase 16 (kích hoạt cloud)**: ⛔ sau Phase 15 và change brief triển khai (T201)

### User Story Dependencies

- **US1 (P1)**: sau Foundational; không phụ thuộc story khác
- **US2 (P1)**: sau Foundational; độc lập với US1 trên adapter giả (test inject tài khoản giả). Tạo màn review dùng chung (T093)
- **US3 (P1)**: cần màn review của US2 (T093) và điểm dừng đã xuất bản (fixture fake đủ để test độc lập)
- **US4 (P1)**: mở rộng publish/review của US2–US3 (T084, T103, T113)
- **US5 (P1)**: kiểm chứng xuyên màn hình; nên làm sau US1–US4 để T123 phủ đủ màn
- **US6 (P1)**: cần danh sách tuyến (T107) và editor điểm dừng (T088) để gắn hộp thoại; logic fake độc lập
- **US7 (P1)**: chỉ cần T026; phần producer thật ở T190–T191
- **US8 (P1/P2)**: gắn panel vào editor của US2–US3; logic fake độc lập
- **US9 (P2)**: chỉ cần Foundational; intake thật ở T194–T196
- **Giai đoạn B**: T177–T196 theo story; mỗi migration phụ thuộc T168–T171; T183 cần T181; T186 cần T183; T188 cần T183

### Within Each User Story

- Test viết trước và FAIL trước khi cài đặt
- Fake adapter → validation → component/màn hình → đăng ký route
- Story xong và qua checkpoint trước khi sang story kế

### Parallel Opportunities

- Setup: T004–T009 song song
- Foundational: T011–T017, T020–T027, T029–T038, T048–T051, T053, T055 song song theo nhóm
- Trong mỗi story: mọi task test có [P] song song; validation và màn hình khác file có [P] song song
- Giai đoạn B: T172–T175 song song; Edge Function (T178, T195) và script (T179) song song với migration cùng story

---

## Parallel Example: User Story 2

```bash
# Viết toàn bộ test của US2 cùng lúc:
Task: "T073 Test validation điểm dừng in src/modules/m03/validation/checkpoint.test.ts"
Task: "T074 Test validation điểm tham quan in src/modules/m03/validation/visitPoint.test.ts"
Task: "T077 Test ảnh in QR in src/modules/m03/visit-points/qr-print/renderQr.test.ts"
Task: "T079 Test xem trước in src/modules/m03/visit-points/preview/VisitorPreview.test.tsx"

# Sau T083–T084, cài đặt song song:
Task: "T085 validation/checkpoint.ts"
Task: "T086 validation/visitPoint.ts"
Task: "T090 qr-print/renderQr.ts + QrPrintPanel.tsx"
Task: "T091 VisitPointLifecycle.tsx"
Task: "T092 preview/VisitorPreview.tsx"
```

## Parallel Example: User Story 3

```bash
# Bốn bước editor là bốn file độc lập:
Task: "T109 steps/CardStep.tsx"
Task: "T110 steps/DetailsStep.tsx"
Task: "T111 steps/TagsStep.tsx"
Task: "T112 steps/CheckpointsStep.tsx + CheckpointPicker.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup (sau khi T001 được xác nhận)
2. Phase 2 Foundational
3. Phase 3 US1 → **DỪNG và KIỂM CHỨNG** Q1–Q5 trên adapter giả
4. Demo đăng nhập/tài khoản

MVP có giá trị nghiệp vụ đầu tiên cho M01 là **US1 + US2 + US3** (tạo điểm dừng → tuyến → xuất bản `JourneySnapshot` version 1), nhưng chỉ thành dữ liệu thật khi giai đoạn B (T168–T185) được mở.

### Incremental Delivery

1. Setup + Foundational → nền sẵn sàng
2. US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8 → US9, mỗi story qua checkpoint của nó trên adapter giả
3. Phase 12 → bằng chứng giai đoạn A
4. Giai đoạn B (change brief backend đã duyệt 2026-10-30): Phase 13 → Phase 14 theo cùng thứ tự story → Phase 15
5. Khi có change brief triển khai: Phase 16 (vercel.json, Supabase cloud, smoke check, release gate)

### Parallel Team Strategy

1. Cả nhóm làm Setup + Foundational
2. Sau đó: Dev A US1 → US8; Dev B US2 → US3 → US4; Dev C US6 → US9 → US7; US5 cuối cùng
3. Giai đoạn B chia theo cùng ranh giới story

---

## Notes

- [P] = khác file, không phụ thuộc
- [Story] gắn task với user story để truy vết (spec.md Traceability)
- Không commit, push, cài dependency ngoài T002–T003, hay gọi dịch vụ cloud nếu người dùng chưa yêu cầu (AGENTS.md §6)
- Không dùng dữ liệu thật; không chạy gì trên Shared Backend; không `supabase link`/`db push`
- Mọi giới hạn số là provisional; đổi giá trị thì đổi đồng thời src/modules/m03/config/limits.ts và `app.limit`
- CI: workflow .github/workflows/ci.yml tạo ở T002 (người dùng duyệt 2026-10-30); job Supabase local thêm ở T198 (plan.md Complexity #3)
- Nếu file này quá lớn khi thực thi, có thể tách Phase 1–12 (giai đoạn A) và Phase 13–15 (giai đoạn B) mà không đổi plan (plan.md Implementation Sequence)
