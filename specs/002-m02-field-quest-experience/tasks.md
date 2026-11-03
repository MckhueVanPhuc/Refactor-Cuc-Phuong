---

description: "Danh sách task triển khai M02 — Field Quest Experience"
---

# Tasks: M02 — Field Quest Experience

**Input**: Tài liệu thiết kế trong `specs/002-m02-field-quest-experience/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: **Có.** Constitution "Testing & Validation" yêu cầu: mỗi BR-* có test; contract test phủ Required/Conditional/Optional; test rollback cho thao tác atomic (thay phiên, chuyển terminal); đường khách tự do tạo 0 `PlaySession`/`CheckpointVisit`/`SessionSyncRecord`. plan.md "Validation Strategy" yêu cầu mỗi BR-M02-001…026 có ít nhất một test. Test viết trước và phải FAIL trước khi cài đặt.

**Organization**: Task nhóm theo user story của [spec.md](spec.md) để mỗi story cài đặt và kiểm chứng độc lập.

> **Quy tắc dẫn xuất.** File này không tạo requirement. Hành vi lấy từ [spec-M02 v3.3](../../docs/spec/spec-M02.md); quyết định kỹ thuật lấy từ plan/research. Giữ nguyên tên contract (`LanguagePreference`, `SelectedRouteContext v3`, `OfflinePackage`, `LiveQrLookupResult`, `LiveStationContent`, `SessionSyncRecord`) và mọi ID. `SessionSyncRecord` (transport) không bao giờ hợp nhất với `SessionRecord` (entity M03). `LOOKUP_TIMEOUT_SECONDS` = 8 là **provisional**.
>
> **Phụ thuộc package khác (research R-01).**
> - **Package 001 (M01)** sở hữu `src/shared/db/visitorDb.ts`, bề mặt đọc `src/modules/m01/index.ts`, ba schema M01 trong `src/shared/contracts/`, `LanguageControl` và cấu hình PWA. M02 chỉ đọc qua một cổng duy nhất `src/modules/m02/m01Port.ts` (T016). Khi 001 chưa xong, test M02 dùng bản giả của cổng đó; tích hợp thật với M01 nằm ở T102–T103.
> - **Package 003 (M03)** sở hữu `src/shared/contracts/liveQrLookup.ts`; `sessionSyncRecord.ts` là đồng sở hữu (research R-04, L-01). Lookup, intake và Storage thật thuộc **M03 giai đoạn B** (phạm vi local mở 2026-10-30 theo CHG-M03-2026-10-30-01; chưa cài đặt); phase cuối (T104–T106) chỉ chạy khi M03 Phase 13–15 xong.
> - **Tooling và shell dùng chung**: package nào code trước thì tạo. Nếu package 003 đã chạy Phase 1 của [tasks M03](../003-m03-operations-content-administration/tasks.md), Phase 1 dưới đây chỉ bổ sung phần riêng của M02.
>
> **Giao diện.** Mọi task dựng màn hình dùng skill `frontend-design`; màu, font, khoảng cách chỉ lấy từ token ([design-system.md](../../docs/design/design-system.md), nhóm `--color-m02-scanner-*` cho scanner); icon chỉ từ `assets/icons/`; hình thức tham chiếu `screens/screen-spec/M02/` và `screens/html/mockup-SCR-M02-*.html` (CLAUDE.md). Mọi chữ hiển thị lấy từ `src/modules/m02/i18n/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story của task (US1…US7, theo spec.md)
- Mỗi task nêu đường dẫn file chính xác

## Path Conventions

- Web app modular monolith (plan.md "Project Structure"): M02 nằm trọn trong `src/modules/m02/`; chỉ import `src/shared/*`, `src/app/*` và (qua `m01Port.ts`) `src/modules/m01/index.ts`. Không import từ `src/modules/m03/`.
- Unit/contract/component test đặt cạnh mã nguồn dạng `*.test.ts(x)`; E2E ở `e2e/m02/`, fixture ở `e2e/fixtures/`.
- M02 không có file nào dưới `supabase/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling cho M02 (plan.md Implementation Sequence bước 1)

- [X] T001 Ghi quyết định Complexity Tracking #1–#4 ngay dưới bảng Complexity Tracking của specs/002-m02-field-quest-experience/plan.md (#2 duyệt, #3 hoãn CI, #4 duyệt `fake-indexeddb` chỉ làm dev dependency)
- [X] T002 Kiểm tra tooling gốc đã có chưa (package.json, tsconfig*.json, vite.config.ts, vitest.config.ts, playwright.config.ts, .env.example). Chưa có thì thực hiện trước phần nền dùng chung trong specs/003-m03-operations-content-administration/tasks.md: Phase 1 (T002–T010) **và** phần dùng chung của Phase 2 (T011–T019: config, Supabase client, token, UI nền, shell App/router/paths, update coordinator; test hook E2E ở T007). Có rồi thì bỏ qua. Thiếu T011–T019 thì T021 (client), T024 (router), T025 (UI) của M02 không chạy được — đã có: Phase 1 và phần dùng chung Phase 2 của M03 (T002–T019) xong trước; bỏ qua (2026-11-04)
- [X] T003 Bổ sung dependency của M02 vào package.json, pin chính xác: runtime `dexie` (nếu 001 chưa thêm), `@zxing/browser`, `@zxing/library`; dev `fake-indexeddb`. Cập nhật package-lock.json; ghi phiên bản đã cài thật vào specs/002-m02-field-quest-experience/research.md R-02. Không thêm thư viện state, i18n hay media player (research R-02) — `@zxing/browser` 0.2.1, `@zxing/library` 0.23.0; `dexie`, `fake-indexeddb` đã có từ package 001
- [X] T004 [P] Thêm `import 'fake-indexeddb/auto'` vào src/test/setup.ts để test Dexie chạy trong Vitest (plan.md Complexity #4) — đã có từ package 001; không đổi
- [X] T005 [P] Tạo .env.e2e nếu chưa có (M01 T005 tạo cùng file và cùng script; có rồi thì chỉ đối chiếu giá trị) chỉ chứa giá trị giả an toàn: `VITE_SUPABASE_URL=http://127.0.0.1:54321`, key giả, `VITE_QR_PUBLIC_BASE_URL=http://localhost:4173` (quickstart §2); thêm script `preview:e2e` (`vite build --mode e2e && vite preview --port 4173`) vào package.json — đã có từ package 001: `.env.e2e` khớp quickstart §2; `preview:e2e` build vào `dist-e2e` với `--strictPort`; không đổi
- [X] T006 [P] Bổ sung vào playwright.config.ts: thêm `npm run preview:e2e` (cổng 4173) vào mảng `webServer` cấp cao nhất nếu chưa có; project `m02` (testDir `e2e/m02`, baseURL `http://localhost:4173`, `launchOptions.args`: `--use-fake-ui-for-media-stream`, `--use-fake-device-for-media-stream`, `--use-file-for-fake-video-capture=e2e/fixtures/qr-q1a.y4m`); project `m02-cam-evil` (chỉ e2e/m02/scan-evil.spec.ts, cùng cờ với file `qr-evil.y4m` — Chromium chỉ nhận một file video mỗi lần khởi chạy); project `m02-local-stack` (baseURL `http://localhost:5173`, chỉ có khi `PW_LOCAL_STACK=1`, dùng ở T105) — kiểm bằng spec tạm (đã xóa): camera giả ở `m02` và `m02-cam-evil` trả video 320×240 của file .y4m; `m02` bỏ qua scan-evil.spec.ts
- [X] T007 [P] Viết e2e/fixtures/make-qr-y4m.mjs (Node thuần, dùng `qrcode` đã có, không thêm dependency) sinh file YUV4MPEG2 chứa ảnh QR synthetic cho `http://localhost:4173/q/Q1a` và một QR sai base `https://evil.example/q/Q1a`; chạy để tạo e2e/fixtures/qr-q1a.y4m, qr-evil.y4m và commit (research R-19). Các mã khác trong E2E đi qua `window.__cpqTestHooks.m02.scan` (T023) — 320×240, 3 khung, xám 4:2:0; giải mã lại bằng `@zxing/library` ra đúng `http://localhost:4173/q/Q1a` và `https://evil.example/q/Q1a`; `*.y4m binary` trong .gitattributes
- [X] T008 [P] Bổ sung vào vite.config.ts tên chunk lazy `m02-trip`, `m02-content`, `m02-end`, `m02-qr-link`, `m02-scanner`; bảo đảm Workbox precache có `m02-scanner` và `navigateFallback` phủ `/q/*`. Không thêm runtime cache cho lookup, intake hay media đã ký (research R-13, R-15; constitution VI). Chỉ bổ sung vào cấu hình PWA của shell, không thay — tên chunk theo thư mục đã có từ package 001; bổ sung: `@zxing` tính vào `m02-scanner`, alias `m02-session` → `m02-trip`; precache và `navigateFallback: '/index.html'` đã phủ `/q/*`. Build tạm 2026-11-04: `m02-trip`, `m02-qr-link`, `m02-scanner` (có `@zxing`) đều trong precache

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng dùng chung mà mọi story M02 cần (plan.md bước 1–4)

**⚠️ CRITICAL**: Không bắt đầu user story nào trước khi phase này xong

### Shell, DB và contract dùng chung

- [X] T009 Tạo hoặc bổ sung src/app/paths.ts với `PATHS.m02SessionEntry = '/trip'` (research R-03; plan M01 P-03) — đã có từ package 001; không đổi
- [X] T010 Kiểm tra src/shared/db/visitorDb.ts đã khai báo đúng Physical §11 ba store M02: `playSessions` (PK `sessionId`, unique `&sourceHandoffId`, index `status`), `checkpointVisits` (PK `[sessionId+checkpointId]`, index `sessionId`), `pendingSyncItems` (PK `sessionId`, index `syncStatus`). Chưa có file thì tạo đúng Physical §11 version 1 (mọi store M01 + M02) và ghi chú đầu file: sở hữu thuộc package 001 (giống cách plan M01 bước 4 bàn giao schema cho 003) — đã có: version 1 khai báo đúng ba store M02 theo Physical §11; không đổi
- [X] T011 [P] Viết test src/shared/contracts/sessionSyncRecord.m02.test.ts theo spec-M02 §5.1: fixture hợp lệ qua; khóa lạ (`deviceId`) ở gốc hoặc phần tử, `status = DANG_DIEN_RA`, `checkpointName` dạng object, `endedAt < startedAt`, `checkpointId` trùng, `checkedInAt` ngoài khoảng đều bị từ chối (quickstart V29; DAC-M02-007–009; SC-M02-007) — chạy lại bảng `SESSION_INTAKE_CASES` của M03 và thêm ca riêng phía M02 (khóa PII, `checkpointName` object, thiếu từng trường Required)
- [X] T012 Tạo src/shared/contracts/sessionSyncRecord.ts (Zod `.strict()`) nếu package 003 chưa tạo; nếu đã có thì đối chiếu từng field với spec-M02 §5.1 và cho T011 qua mà không đổi shape. Ghi chú đầu file: đồng sở hữu M02/M03, đổi shape cần đổi cả hai spec (research L-01) — đã có từ package 003, khớp từng field với spec-M02 §5.1; ghi chú đồng sở hữu đặt ở đầu `sessionSyncRecord.m02.test.ts` vì `sessionSyncRecord.parity.test.ts` bắt file này giống hệt bản sao của Edge
- [X] T013 [P] Kiểm tra src/shared/config/env.ts đã có `MEDIA_BUCKET` (do tasks M03 T012 thêm) và `VITE_QR_PUBLIC_BASE_URL` đã được validate; thiếu thì bổ sung đúng như M03 T012 (research R-16) — đã có từ package 003 (`MEDIA_BUCKET` ở `config/storage.ts`, `VITE_QR_PUBLIC_BASE_URL` được validate); không đổi

### M02 core: giới hạn, chữ cố định, cổng M01, schema dòng

- [X] T014 [P] Cài đặt src/modules/m02/config/limits.ts: `LOOKUP_TIMEOUT_SECONDS = 8` có chú thích **provisional** (spec-M02 §9); hằng kỹ thuật `SYNC_REQUEST_TIMEOUT_SECONDS = 30`, `SYNC_RETRY_DELAYS_MS = [30s, 1, 2, 5 phút]`, `SCANNER_DUPLICATE_IGNORE_MS = 1500`, `AUTO_END_AFTER_MS = 24 h`, mỗi hằng ghi rõ "kỹ thuật, không phải business rule" (research R-11, R-13, R-16); test src/modules/m02/config/limits.test.ts
- [X] T015 [P] Viết test src/modules/m02/i18n/i18n.test.ts rồi tạo src/modules/m02/i18n/vi.ts và src/modules/m02/i18n/en.ts: chép đúng mọi thông báo của spec-M02 §5.1 "Fixed visitor messages" và bảng copy screen spec SCR-M02-001…004; test so tập khóa hai ngôn ngữ bằng nhau, so đúng câu thông báo tạm đóng song ngữ của US-M02-04 mục 3, và không chuỗi nào chứa "đã đến", "có mặt", "arrived" (SC-M02-013; field-ui-flow §3) — cùng `i18n/index.ts` (`messagesFor`) và `useM02Messages.ts`; bảng copy chưa có tiêu đề màn nên chưa có khóa tiêu đề, thêm khi dựng màn
- [X] T016 Cài đặt src/modules/m02/m01Port.ts: cổng duy nhất re-export các hàm **chỉ đọc** của src/modules/m01/index.ts (`useLanguagePreference`, `resolveDisplayLanguage`, `LanguageControl`, `readSelectedRouteContext`, `readActiveOfflinePackage`, `findOfflineResource`, `readPackageImage`) và kiểu kết quả `NONE | INVALID | OK` (research R-05, D-01); tạo src/modules/m02/testing/fakeM01Port.ts (bản giả có fixture synthetic: context v3 hợp lệ, v2, `REVOKED`, quá hạn; gói A v3 và v2 `OUTDATED` theo quickstart §4); re-export thêm hằng `M01_HANDOFF_TABLES` để transaction tạo phiên đưa store context của M01 vào phạm vi mà code M02 không ghi tên store của M01 — fixture synthetic nằm ở `api/fake/fixtures.ts` (dùng chung với T023); test thay cổng bằng `vi.mock('…/m01Port', () => import('…/testing/fakeM01Port'))`
- [X] T017 [P] Viết test kiến trúc src/modules/m02/architecture.test.ts: quét import trong src/modules/m02/** — chỉ m01Port.ts được import `src/modules/m01/index.ts`; không file nào import `src/modules/m01/**` khác, `src/modules/m03/**`, hay ghi vào store của M01 (`selectedRouteContext`, `offlinePackages`, `packageCandidates`, `languagePreference`…) (FR-M02-020; constitution II) — thêm ca: bản giả có đủ mọi export của m01Port.ts
- [X] T018 [P] Viết test src/modules/m02/storage/rows.test.ts rồi cài đặt src/modules/m02/storage/rows.ts: Zod cho dòng `PlaySession` (`endedAt` có ⇔ terminal; `journeyCheckpoints` có `checkpointId`/`sequence` duy nhất, `qrIdentifiers` không rỗng), `CheckpointVisit`, `PendingSyncItem` đúng data-model §2 (DAC-M02-001–005, 007, 010) — cùng `storage/tables.ts` (bảng có kiểu, `M02_SESSION_TABLES`)
- [X] T019 Cài đặt src/modules/m02/storage/readers.ts: `getRunningSession()` (đọc qua index `status`), `getSessionVisits(sessionId)`, `hasRunningSession()`, `getLatestTerminalSyncItem()`, cùng hook `useRunningSession()`/`useSessionVisits()` dùng `liveQuery` để tab khác thấy thay đổi (BR-M02-002); test src/modules/m02/storage/readers.test.ts — hàm đọc không validate lại dòng: chỉ writer M02 ghi ba store và writer validate trước khi ghi

### M02 API adapter (lookup, media) và bản giả

- [X] T020 [P] Viết test src/modules/m02/api/lookupClient.test.ts: có phiên → gửi `p_route_id`; không phiên → không gửi; body qua schema `liveQrLookup.ts` → `VALID`/`TEMPORARILY_CLOSED`/`INVALID`; lỗi RPC, HTTP lỗi, quá `LOOKUP_TIMEOUT_SECONDS`, body không qua schema, `navigator.onLine === false` → `SOURCE_ERROR`, không bao giờ `INVALID` (FR-M02-013; BR-M02-005, 019; DAC-M02-011)
- [X] T021 Cài đặt src/modules/m02/api/lookupClient.ts: `supabase.schema('api').rpc('lookup_qr', { p_qr_identifier, p_route_id? })` với `AbortController` theo `LOOKUP_TIMEOUT_SECONDS`, parse bằng src/shared/contracts/liveQrLookup.ts, trả union `{ kind: 'VALID', content } | { kind: 'TEMPORARILY_CLOSED', closedScope } | { kind: 'INVALID' } | { kind: 'SOURCE_ERROR' }`; kết quả không bao giờ được lưu (research R-08) — client Supabase riêng của M02 ở `api/visitorSupabase.ts` (không import client của M01)
- [X] T022 [P] Cài đặt src/modules/m02/api/mediaUrl.ts: tạo signed URL từ `sourceRef` trong bucket `MEDIA_BUCKET` bằng client `anon`; không cache (research R-12) — `signedUrls(sourceRefs)` ký cả lô như M01; mục lỗi không có trong Map
- [X] T023 [P] Cài đặt src/modules/m02/api/fake/fakeLookup.ts và src/modules/m02/api/fake/fixtures.ts: dữ liệu synthetic của quickstart §4 (tuyến A v3; `C1` seq 1 `OFFLINE_REQUIRED` mã `Q1a`,`Q1b`; `C2` seq 3 `ONLINE_AVAILABLE` mã `Q2` có audio `vi`/`en`/`NONE`; `C3` seq 5 cuối mã `Q3`; `QX` ngoài tuyến; `QN` thêm vào `C2` sau khi chuyến bắt đầu); hook đặt kết quả `TEMPORARILY_CLOSED`/`INVALID`/lỗi/trễ cho từng mã (dùng trong Vitest; E2E giả lập bằng `page.route()`); tạo src/modules/m02/testing/e2eHooks.ts đăng ký namespace `m02` vào src/shared/testing/e2eHooks.ts: `scan(text)` đưa chuỗi vào parseQrLink → processScan đúng như scanner, `failNextCreateSession` cho V18 — fixtures, `fakeLookup` (+ test) xong; namespace `m02` được đăng ký trong App.tsx, hook `failNextCreateSession` thêm ở T030 và `scan(text)` thêm ở US2 khi hàm tương ứng tồn tại

### Khung route và layout

- [X] T024 Cài đặt src/modules/m02/routes.tsx: bốn route lazy `/trip`, `/trip/qr/:qrIdentifier`, `/trip/end`, `/q/:qrIdentifier` với trang placeholder (field-ui-flow §1); `/q/:qrIdentifier` **không** đi qua guard ngôn ngữ của M01 (BR-M02-024); đăng ký vào src/app/router.tsx — trang placeholder ở `session/`, `content/`, `end/`, `qr-link/`; test ở `src/app/router.m02.test.tsx` (tầng app mới được import cả M01 và M02)
- [X] T025 Dựng src/modules/m02/layout/FieldLayout.tsx + FieldLayout.module.css: header có `LanguageControl` lấy từ m01Port.ts (M01 là writer duy nhất), vùng thông báo một lần; chữ theo `resolveDisplayLanguage(stored, navigator.language)` (research R-14) — hai bề mặt `scanner` (SCR-M02-001) và `reader` (SCR-M02-002…004); `FieldNotice` đặt thông báo vào vùng chung

**Checkpoint**: Nền sẵn sàng — các user story có thể bắt đầu

---

## Phase 3: User Story 1 - Start and restore a field session — US-M02-01 (Priority: P1) 🎯 MVP

**Goal**: Tạo đúng một phiên từ handoff v3 hợp lệ, từ chối handoff không dùng được, khôi phục phiên sau reload/offline (FR-M02-001…005; BR-M02-001, 002, 003, 017)

**Independent Test**: Quickstart V1–V4 với cổng M01 giả: context v3 hợp lệ, v2, `REVOKED`, quá hạn, đã dùng; reload giữa phiên; hai tab cùng handoff

### Tests for User Story 1 ⚠️

- [ ] T026 [P] [US1] Viết test src/modules/m02/session/decideEntry.test.ts cho bảng quyết định research R-06: `OK` trùng phiên đang chạy → khôi phục; handoff đã có phiên terminal, `REVOKED`, giờ ≥ `expiresAt` → từ chối; `OK` hợp lệ + không phiên → tạo; `OK` hợp lệ + phiên khác → thay; `INVALID` (gồm v2) → từ chối có thông báo, không chuyển đổi; `NONE` + có phiên → khôi phục; `NONE` + không phiên → khách tự do (BR-M02-001, 017; FR-M02-001; SC-M02-010)
- [ ] T027 [P] [US1] Viết test src/modules/m02/storage/createSession.test.ts (fake-indexeddb): một transaction đọc lại context và kiểm lại điều kiện; `sessionId` là UUID; `sourceHandoffId = handoffId`; `journeyCheckpoints` là bản sao sâu (sửa object nguồn không đổi phiên); `startedAt` UTC; hai lời gọi đồng thời cùng handoff → đúng một phiên, lời gọi sau nhận "đã dùng" (`ConstraintError`); không bao giờ có hai phiên `DANG_DIEN_RA` (BR-M02-001, 002, 003; FR-M02-002, 003, 004; SC-M02-001)
- [ ] T028 [P] [US1] Viết test src/modules/m02/session/TripPage.entry.test.tsx: trạng thái "Handoff rejected" (thông báo bắt đầu lại từ M01), "Session started" kèm câu gợi ý bắt đầu phiên của §5.1, "Session restored"; phiên đã có không bị kết thúc khi `expiresAt` qua (FR-M02-005; BR-M02-017; SC-M02-003, 010)
- [ ] T029 [P] [US1] Viết E2E e2e/m02/session-start.spec.ts cho quickstart V1–V4 (project `m02`; context M01 nạp qua `window.__cpqTestHooks.m01.seedContext` trước khi mở trang)

### Implementation for User Story 1

- [ ] T030 [US1] Cài đặt src/modules/m02/storage/createSession.ts: transaction `rw` trên `playSessions`, `checkpointVisits`, `pendingSyncItems` và các store trong `M01_HANDOFF_TABLES` (đọc context qua m01Port.ts bên trong cùng transaction); tạo phiên `DANG_DIEN_RA` với `crypto.randomUUID()`, bản sao `routeJourneyManifest.checkpoints`; để sẵn điểm mở rộng cho thay phiên (T071) (research R-05, R-06)
- [ ] T031 [US1] Cài đặt src/modules/m02/session/decideEntry.ts (hàm thuần theo bảng R-06) và src/modules/m02/session/enterTrip.ts (đọc context + phiên đang chạy, gọi decideEntry, thực hiện tạo/khôi phục/từ chối; chỗ gọi tự đóng 24 giờ để trống cho T072)
- [ ] T032 [US1] Dựng khung SCR-M02-001 src/modules/m02/session/TripPage.tsx + TripPage.module.css: gọi enterTrip khi vào `/trip`, hiện các trạng thái của T028, vùng dành cho journey (US2) và nút Quét (US2); đăng ký trang vào src/modules/m02/routes.tsx

**Checkpoint**: US1 chạy độc lập: vào `/trip` tạo/khôi phục/từ chối đúng

---

## Phase 4: User Story 2 - Scan and check in — US-M02-02 (Priority: P1)

**Goal**: Quét bằng nút Quét, ghi một lượt ghé mỗi `(sessionId, checkpointId)` cho lần quét được chấp nhận, trước khi hiện nội dung; journey map cố định với "Đã quét QR" (FR-M02-006…009, 022, 026; BR-M02-004, 005, 006, 014, 020, 023)

**Independent Test**: Quickstart V5–V8, V15, V23: quét mã trong hành trình online/offline, mã thứ hai cùng điểm dừng, mã thêm sau, link sai base, camera bị từ chối

### Tests for User Story 2 ⚠️

- [ ] T033 [P] [US2] Viết test src/modules/m02/scan/parseQrLink.test.ts: chỉ nhận đúng `{VITE_QR_PUBLIC_BASE_URL}/q/{segment}` (cùng origin và path gốc, một đoạn không rỗng, không query, không fragment); `https://evil.example/q/Q1a`, `https://example.vn.evil/…`, chuỗi không phải URL, `…/q/Q1a?x=1`, `…/q/Q1a#x`, `…/q/` → không hợp lệ; `qrIdentifier = decodeURIComponent(segment)`; không kiểm định dạng identifier (quickstart V15; FR-M02-026; BR-M02-023; DAC-M02-011)
- [ ] T034 [P] [US2] Viết test src/modules/m02/scan/resolveScan.test.ts cho dòng 1, 6 và R-INVALID-LINK của scan-resolution §2: online `VALID` thuộc journey (theo mã đóng băng hoặc `content.checkpointId` — BR-M02-020) → ghi lượt ghé, nội dung live; offline/lỗi nguồn với mã trong journey → ghi lượt ghé, nguồn gói; link sai → không mạng, không ghi (BR-M02-005, 020; DAC-M02-006)
- [ ] T035 [P] [US2] Viết test src/modules/m02/storage/recordVisit.test.ts: transaction chèn-nếu-chưa-có theo `[sessionId+checkpointId]`; `checkedInAt = max(now, startedAt)`; `checkedInAt` và `qrIdentifier` đầu tiên bất biến; quét mã thứ hai cùng điểm dừng không tạo bản ghi mới; phiên không còn `DANG_DIEN_RA` → không ghi; trả `{ created, visit }` (BR-M02-004, 014; FR-M02-007, 009; SC-M02-002; research R-10)
- [ ] T036 [P] [US2] Viết test src/modules/m02/scan/processScan.test.ts: đọc lại phiên từ Dexie (không dùng giá trị cũ); lượt ghé commit trước khi trả kết quả điều hướng; lỗi tải nội dung sau đó không gỡ lượt ghé; `QN` online `VALID` với `checkpointId = C2` → lượt ghé `C2` có `qrIdentifier = QN`, journey không đổi; `QN` offline → không lượt ghé; ghé theo thứ tự tùy ý được chấp nhận; lookup quá 8 s với mã trong journey → ghi lượt ghé (BR-M02-005, 006, 020; FR-M02-006, 008, 022; SC-M02-004, 014)
- [ ] T037 [P] [US2] Viết test src/modules/m02/journey/RouteJourneyMap.test.tsx: sắp theo `sequence`, đánh số liên tục 1, 2, 3 cho seq 1, 3, 5; tên theo ngôn ngữ hiện tại và đổi ngay khi đổi VI/EN; điểm đã quét ghi "Đã quét QR"/"Scanned"; hiện số đã quét/tổng; chạm điểm đã quét → xem lại (BR-M02-006; FR-M02-008, 009; SC-M02-013, 019)
- [ ] T038 [P] [US2] Viết test src/modules/m02/scanner/QrScanner.test.tsx (mock `@zxing/browser`, `getUserMedia`): `facingMode: 'environment'`; dừng stream sau mã đầu tiên hoặc khi đóng; bỏ qua mã lặp trong `SCANNER_DUPLICATE_IGNORE_MS`; `NotAllowedError`/`NotFoundError`/không có `mediaDevices` → thông báo camera cố định của §5.1 (BR-M02-023; research R-13)
- [ ] T039 [P] [US2] Viết E2E e2e/m02/scan.spec.ts cho quickstart V5–V8, V15, V23 (camera giả bằng `.y4m` cho lần quét đầu `Q1a` của V5 và cho V15 qua project `m02-cam-evil` — file e2e/m02/scan-evil.spec.ts; các mã còn lại, chuỗi không phải URL và link có query đi qua `window.__cpqTestHooks.m02.scan`; context không cấp quyền camera cho V23)

### Implementation for User Story 2

- [ ] T040 [P] [US2] Cài đặt src/modules/m02/scan/parseQrLink.ts cho T033 qua (research R-07)
- [ ] T041 [P] [US2] Cài đặt src/modules/m02/storage/recordVisit.ts cho T035 qua (research R-08 bước 4)
- [ ] T042 [US2] Cài đặt src/modules/m02/scan/resolveScan.ts: hàm thuần nhận `{ hasSession, journeyMatch, lookup }` trả `{ recordVisit, display, contentSource }` theo scan-resolution §2; giai đoạn này cài dòng 1, 6, R-INVALID-LINK, các dòng còn lại trả "không ghi lượt ghé" mặc định (US4, US6 hoàn thiện)
- [ ] T043 [US2] Cài đặt src/modules/m02/scan/processScan.ts: `processScan(qrIdentifier, origin)` — đọc phiên, tìm `J`, gọi lookupClient (khi online), resolveScan, recordVisit; trả kết quả cho router state gồm cờ `finalPromptNeeded = created && J là sequence lớn nhất` (BR-M02-021 dùng ở US5); chỗ gọi tự đóng 24 giờ khi `origin = 'link'` để trống cho T072
- [ ] T044 [P] [US2] Cài đặt src/modules/m02/scan/viewScannedPoint.ts: chọn nội dung như processScan nhưng không ghi lượt ghé; trả `checkedInAt` gốc (scan-resolution §4)
- [ ] T045 [P] [US2] Dựng src/modules/m02/journey/RouteJourneyMap.tsx + `.module.css` cho T037 qua
- [ ] T046 [US2] Dựng src/modules/m02/scanner/QrScanner.tsx + `.module.css` (lớp toàn màn hình, token `--color-m02-scanner-*`, lazy chunk `m02-scanner`, `BrowserQRCodeReader`) cho T038 qua; chuỗi đọc được đi qua parseQrLink rồi processScan(…, 'scanner')
- [ ] T047 [US2] Gắn RouteJourneyMap, nút "Quét" (mở QrScanner) và điều hướng sang `/trip/qr/:qrIdentifier` với kết quả quét trong router state vào src/modules/m02/session/TripPage.tsx; trạng thái "Looking up", "Visit recorded"

**Checkpoint**: US1 và US2 chạy độc lập; lượt ghé được ghi đúng

---

## Phase 5: User Story 3 - Read the content of the scanned QR — US-M02-03 (Priority: P1)

**Goal**: Hiện nội dung đúng mã đã quét từ nguồn đúng: live khi online `VALID`, gói khi offline hoặc lookup lỗi; audio/video chỉ phát khi bấm và lọc theo ngôn ngữ (FR-M02-010, 011, 014; BR-M02-009, 016, 018, 026)

**Independent Test**: Quickstart V9–V12: cùng một mã ở online `VALID`, offline có gói, offline thiếu resource, `ONLINE_AVAILABLE` offline; đổi VI/EN khi có media; gói cũ; lookup quá hạn

### Tests for User Story 3 ⚠️

- [ ] T048 [P] [US3] Viết test src/modules/m02/content/selectContentSource.test.ts: online `VALID` → nội dung live cho cả hai mode; offline/lỗi nguồn + `OFFLINE_REQUIRED` + có resource → nội dung gói; thiếu resource hoặc không có gói `SAN_SANG` → "Chưa có nội dung offline cho điểm này." (không bao giờ là mã không hợp lệ); `ONLINE_AVAILABLE` offline → không có nội dung; cảnh báo gói cũ khi `versionStatus = OUTDATED` hoặc `package.contentVersion < session.contentVersion`; ảnh của nội dung gói đọc bằng `readPackageImage(routeId, package.contentVersion, sourceRef)` — version của gói active, có thể khác version của phiên; gói không bao giờ bị đổi (BR-M02-009, 018; FR-M02-010; SC-M02-012)
- [ ] T049 [P] [US3] Viết test src/modules/m02/content/mediaFilter.test.ts: chỉ giữ `spokenLanguage` = ngôn ngữ hiện tại hoặc `NONE`, theo thứ tự nhận; nhãn "Âm thanh {n}"/"Audio {n}", "Video {n}" đánh số trong từng loại; đổi ngôn ngữ tính lại ngay; không có tệp khớp → danh sách rỗng (BR-M02-026; FR-M02-014; SC-M02-019)
- [ ] T050 [P] [US3] Viết test src/modules/m02/content/ContentPage.test.tsx: nội dung là của đúng mã (hai mã của `C1` hiện hai nội dung khác nhau); `<audio>`/`<video>` có `controls preload="none"`, không autoplay; tệp bị bỏ khi đổi ngôn ngữ thì dừng phát; nội dung gói không bao giờ có điều khiển media; ảnh lỗi → placeholder; media lỗi → thông báo lỗi tệp, chữ và ảnh còn; lỗi nguồn → thông báo "Chưa tải được nội dung mới…" rồi nội dung gói; object URL bị thu hồi khi rời màn; xem lại hiện `checkedInAt` gốc dạng hh:mm dd/mm/yyyy (BR-M02-014, 016; FR-M02-009, 011; SC-M02-008, 011)
- [ ] T051 [P] [US3] Viết E2E e2e/m02/content.spec.ts cho quickstart V9–V12 (`context.setOffline(true)`; `page.route()` trì hoãn lookup quá 8 s cho V12)

### Implementation for User Story 3

- [ ] T052 [P] [US3] Cài đặt src/modules/m02/content/selectContentSource.ts cho T048 qua (đọc gói qua m01Port.ts: `readActiveOfflinePackage`, `findOfflineResource`; bỏ qua `offlineRouteMap`, `routeEssentials`)
- [ ] T053 [P] [US3] Cài đặt src/modules/m02/content/mediaFilter.ts cho T049 qua
- [ ] T054 [P] [US3] Cài đặt src/modules/m02/content/usePackageImage.ts (`readPackageImage` → `URL.createObjectURL`, thu hồi khi unmount) và src/modules/m02/content/useSignedImage.ts (signed URL qua src/modules/m02/api/mediaUrl.ts)
- [ ] T055 [P] [US3] Dựng src/modules/m02/content/MediaList.tsx + `.module.css` (danh sách audio/video đã lọc, phát khi bấm)
- [ ] T056 [US3] Dựng SCR-M02-002 src/modules/m02/content/ContentPage.tsx + `.module.css`: nhận kết quả quét từ router state, không có thì gọi viewScannedPoint; trạng thái Loading, Live content, Package content, Package outdated, No offline content, Unavailable, Source failure, Media error; đăng ký `/trip/qr/:qrIdentifier` trong src/modules/m02/routes.tsx

**Checkpoint**: US1–US3 chạy độc lập

---

## Phase 6: User Story 4 - Scan outside the journey / closed area — US-M02-04, US-M02-08 (Priority: P1)

**Goal**: Mã ngoài hành trình hiện nội dung live nhưng không tạo lượt ghé; `TEMPORARILY_CLOSED` hiện thông báo đóng cố định; `INVALID` và lỗi kết nối được phân biệt (FR-M02-012, 013, 021; BR-M02-008, 015)

**Independent Test**: Quickstart V13–V14: lookup `VALID` ngoài hành trình, `INVALID`, `TEMPORARILY_CLOSED` (`ROUTE`, `CHECKPOINT`), lỗi mạng, offline với mã ngoài journey

### Tests for User Story 4 ⚠️

- [ ] T057 [P] [US4] Viết test src/modules/m02/scan/resolveScan.outside.test.ts cho dòng 2, 4, 5, 7 của scan-resolution §2: `VALID` ngoài journey → nội dung live, không lượt ghé, không đổi tuyến; `TEMPORARILY_CLOSED` (cả hai scope, mã trong hoặc ngoài journey) → không lượt ghé, không nội dung; `INVALID` → không lượt ghé; offline/lỗi nguồn với mã không có `J` → "Cần có kết nối mạng…", không lượt ghé (BR-M02-008, 015; FR-M02-012, 013, 021; SC-M02-009)
- [ ] T058 [P] [US4] Viết test src/modules/m02/content/ScanNotice.test.tsx: thông báo tạm đóng giống hệt cho `ROUTE` và `CHECKPOINT` ở cả vi/en (đúng câu của US-M02-04 mục 3); "Mã không còn hiệu lực hoặc không tồn tại"; lỗi kết nối không bao giờ hiện là mã không hợp lệ; offline không hiện thông báo đóng nào (BR-M02-015; FR-M02-013)
- [ ] T059 [P] [US4] Viết E2E e2e/m02/outside-closed.spec.ts cho quickstart V13–V14

### Implementation for User Story 4

- [ ] T060 [US4] Hoàn thiện dòng 2, 4, 5, 7 trong src/modules/m02/scan/resolveScan.ts cho T057 qua
- [ ] T061 [P] [US4] Dựng src/modules/m02/content/ScanNotice.tsx + `.module.css` (Closure notice, Invalid QR, Connection needed, Out of journey) cho T058 qua
- [ ] T062 [US4] Gắn ScanNotice vào src/modules/m02/content/ContentPage.tsx và src/modules/m02/session/TripPage.tsx theo `display` của resolveScan

**Checkpoint**: US1–US4 chạy độc lập

---

## Phase 7: User Story 5 - Complete or abandon a session — US-M02-05 (Priority: P1)

**Goal**: Hoàn tất bằng Finish hoặc câu hỏi cuối chuyến, thay phiên all-or-nothing, tự đóng phiên quá 24 giờ; mỗi chuyển terminal ghi mục hàng đợi trong cùng transaction (FR-M02-015, 016, 017, 023, 024; BR-M02-007, 010, 013, 021, 022)

**Independent Test**: Quickstart V16–V19: quét điểm cuối; chọn Kết thúc / Đi tiếp; Start handoff mới giữa phiên (và giả lập lỗi); mở lại sau hơn 24 giờ

### Tests for User Story 5 ⚠️

- [ ] T063 [P] [US5] Viết test src/modules/m02/sync/buildSyncRecord.test.ts: đúng 6 trường gốc + 4 trường mỗi lượt ghé; `checkpointName` là chuỗi `vi` của tên đóng băng; sắp theo `sequence`; `endedAt = max(now, checkedInAt mới nhất, startedAt)` cho xác nhận/thay phiên; đồng hồ lùi giữa chuyến vẫn cho `endedAt ≥ checkedInAt ≥ startedAt`; qua schema strict (DAC-M02-008, 009; SC-M02-007; research R-10)
- [ ] T064 [P] [US5] Viết test src/modules/m02/storage/terminalTransition.test.ts: Finish chỉ khi checkpoint `sequence` lớn nhất có lượt ghé; `HOAN_TAT` kể cả khi bỏ qua điểm trước; trạng thái + `endedAt` + `PendingSyncItem { PENDING }` trong cùng transaction; lỗi giữa chừng → rollback, phiên vẫn `DANG_DIEN_RA`, không có mục hàng đợi; phiên terminal không đổi được nữa (BR-M02-007, 010; FR-M02-015, 016; SC-M02-005)
- [ ] T065 [P] [US5] Viết test src/modules/m02/storage/replaceSession.test.ts: handoff mới khi có phiên → phiên cũ `BO_DO` + `endedAt` + mục hàng đợi, phiên mới `DANG_DIEN_RA`, trong một transaction; tiêm lỗi khi chèn phiên mới → phiên cũ vẫn chạy, không có mục hàng đợi (quickstart V18; BR-M02-013; FR-M02-017)
- [ ] T066 [P] [US5] Viết test src/modules/m02/session/autoEnd.test.ts: chỉ khi `now − startedAt > 24 h` (đúng 24 h chưa đóng); `HOAN_TAT` nếu đã ghé điểm cuối, ngược lại `BO_DO`; `endedAt` = `checkedInAt` mới nhất hoặc `startedAt`; xếp hàng đồng bộ cùng transaction; chạy lặp vô hại; thông báo hiện một lần (BR-M02-022; FR-M02-024; SC-M02-016)
- [ ] T067 [P] [US5] Viết test src/modules/m02/end/EndFlow.test.tsx: câu hỏi "Bạn đã quét điểm cuối. Kết thúc chuyến đi?" hiện đúng một lần khi lượt ghé điểm cuối được tạo lần đầu, quét lại không hỏi; [Kết thúc] → `HOAN_TAT`; [Đi tiếp] → giữ phiên, Finish còn; nút Finish chỉ bật sau khi điểm cuối có lượt ghé; màn kết quả liệt kê điểm đã quét và liên kết về `/`; không có nút "Dừng chuyến đi" (BR-M02-021; FR-M02-015, 023; SC-M02-015)
- [ ] T068 [P] [US5] Viết E2E e2e/m02/end.spec.ts cho quickstart V16–V19 (`page.clock` cho V19; nhánh lỗi của V18 qua `window.__cpqTestHooks.m02.failNextCreateSession`)

### Implementation for User Story 5

- [ ] T069 [P] [US5] Cài đặt src/modules/m02/sync/buildSyncRecord.ts cho T063 qua (session-sync-record §2)
- [ ] T070 [US5] Cài đặt src/modules/m02/storage/terminalTransition.ts: `finishSession(sessionId)` và `endSessionInTx(tx, session, status, endedAt)` dùng chung cho Finish, thay phiên, tự đóng; ghi trạng thái, `endedAt` và `PendingSyncItem` cùng transaction (Physical §11 "Terminal transition")
- [ ] T071 [US5] Mở rộng src/modules/m02/storage/createSession.ts cho thay phiên: trong cùng transaction gọi `endSessionInTx(…, 'BO_DO', …)` cho phiên đang chạy rồi chèn phiên mới (T065 qua; research R-06)
- [ ] T072 [US5] Cài đặt src/modules/m02/session/autoEnd.ts (`autoEndForgottenSession()`) và src/modules/m02/session/autoEndTriggers.ts (chạy khi shell khởi động và khi `visibilitychange` sang `visible`); gọi autoEnd trước quyết định vào phiên trong src/modules/m02/session/enterTrip.ts và trước `origin = 'link'` trong src/modules/m02/scan/processScan.ts (research R-09)
- [ ] T073 [P] [US5] Dựng src/modules/m02/end/FinalPrompt.tsx (dialog [Kết thúc]/[Đi tiếp], mở khi kết quả quét có `finalPromptNeeded`)
- [ ] T074 [US5] Dựng SCR-M02-003 src/modules/m02/end/EndPage.tsx + `.module.css`: xác nhận Finish, màn kết quả và danh sách điểm đã quét; chỗ hiện trạng thái đồng bộ để US7 gắn; đăng ký `/trip/end` trong src/modules/m02/routes.tsx
- [ ] T075 [US5] Gắn nút Finish, FinalPrompt và thông báo "chuyến trước đã tự kết thúc" vào src/modules/m02/session/TripPage.tsx và src/modules/m02/content/ContentPage.tsx

**Checkpoint**: US1–US5 chạy độc lập; mọi phiên terminal có mục hàng đợi `PENDING`

---

## Phase 8: User Story 6 - Free visitor scan and phone-camera link — US-M02-07, US-M02-09 (Priority: P1)

**Goal**: Trang `/q/{qrIdentifier}` mở ngay từ camera điện thoại, không bước chặn; có phiên cùng trình duyệt thì xử lý như quét trong app, không có thì chế độ khách tự do không ghi gì (FR-M02-019, 025; BR-M02-012, 019, 024, 025)

**Independent Test**: Quickstart V20–V22: mở link không phiên, có phiên, chưa chọn ngôn ngữ, offline đã/chưa từng mở app

### Tests for User Story 6 ⚠️

- [ ] T076 [P] [US6] Viết test src/modules/m02/scan/resolveScan.free.test.ts cho dòng 3, 8: không phiên + online `VALID` → nội dung live + gợi ý khách tự do + "Chọn tuyến"; không phiên + offline/lỗi nguồn → "Cần có kết nối mạng…" + gợi ý; gợi ý khách tự do hiện với **mọi** kết quả khi không phiên; request không có `routeId` (BR-M02-012, 019; FR-M02-019)
- [ ] T077 [P] [US6] Viết test src/modules/m02/qr-link/freeVisitor.zeroRecords.test.ts (fake-indexeddb): mở `/q/{id}` không phiên với mọi kết quả lookup (`VALID`, `TEMPORARILY_CLOSED`, `INVALID`, lỗi nguồn, offline) → `playSessions`, `checkpointVisits`, `pendingSyncItems` đều rỗng; không bao giờ tạo phiên (constitution "Free-visitor path MUST…"; SC-M02-018; BR-M02-012)
- [ ] T078 [P] [US6] Viết test src/modules/m02/qr-link/QrLinkPage.test.tsx: không có bước ngôn ngữ hay tuyến trước nội dung; chưa có preference → ngôn ngữ thiết bị (`vi-VN` → tiếng Việt, khác → tiếng Anh); `LanguageControl` có mặt và việc ghi đi qua M01; có phiên → gọi `processScan(id, 'link')` (lượt ghé, thông báo đóng, câu hỏi cuối chuyến như trong app); tự đóng 24 giờ chạy trước; "Chọn tuyến" điều hướng `/` (BR-M02-024; FR-M02-025; SC-M02-017)
- [ ] T079 [P] [US6] Viết E2E e2e/m02/qr-link.spec.ts cho quickstart V20–V22 (V22: mở app một lần để shell được cache, rồi `setOffline(true)`; BR-M02-025)

### Implementation for User Story 6

- [ ] T080 [US6] Hoàn thiện dòng 3, 8 và gợi ý khách tự do trong src/modules/m02/scan/resolveScan.ts cho T076 qua
- [ ] T081 [P] [US6] Dựng src/modules/m02/qr-link/FreeVisitorHint.tsx (gợi ý một dòng + liên kết "Chọn tuyến" tới `/`)
- [ ] T082 [US6] Dựng SCR-M02-004 src/modules/m02/qr-link/QrLinkPage.tsx + `.module.css`: tự đóng → có phiên: processScan(…, 'link'); không phiên: lookup không `routeId`, hiển thị qua ContentPage/ScanNotice và FreeVisitorHint; `LanguageControl` góc phải; đăng ký `/q/:qrIdentifier` (lazy `m02-qr-link`) trong src/modules/m02/routes.tsx
- [ ] T083 [US6] Thêm chế độ khách tự do cho src/modules/m02/session/TripPage.tsx khi `NONE` + không phiên: nút Quét, mọi lần quét đi theo dòng 3/8 (SF-M02-008-01)

**Checkpoint**: US1–US6 chạy độc lập

---

## Phase 9: User Story 7 - Synchronize terminal data — US-M02-06 (Priority: P2)

**Goal**: Gửi `SessionSyncRecord` của phiên terminal tới Edge `session-intake`; thử lại khi app mở; idempotent; conflict/từ chối dừng thử lại (FR-M02-018; BR-M02-010, 011)

**Independent Test**: Quickstart V24–V26 với `page.route()` giả intake: `ACCEPTED`, `IDENTICAL`, 409, 422, 503, offline, 429

### Tests for User Story 7 ⚠️

- [ ] T084 [P] [US7] Viết test src/modules/m02/api/intakeClient.test.ts cho bảng ánh xạ session-sync-record §4: `ACCEPTED`/`IDENTICAL` → `SYNCED`; `CONFLICT` (409), `INVALID` (422, 413) → `CONFLICT`; mạng lỗi, quá `SYNC_REQUEST_TIMEOUT_SECONDS`, 5xx, 429, 401, 404, body không đọc được → giữ `PENDING` (BR-M02-011; DAC-M02-010; research R-11, L-02)
- [ ] T085 [P] [US7] Viết test src/modules/m02/sync/syncRunner.test.ts: chỉ gửi mục `PENDING`, tuần tự; không bao giờ gửi phiên `DANG_DIEN_RA`, mục `SYNCED` hay `CONFLICT`; Web Lock `cpq:m02:sync` exclusive `ifAvailable` → hai runner chỉ một gửi; kích hoạt khi khởi động, khi trang hiện lại, khi `online`, ngay sau commit terminal; giãn cách 30 s → 1 → 2 → 5 phút rồi giữ 5 phút; `record` giữ nguyên từng byte sau mọi lần đổi `syncStatus` (BR-M02-010, 011; FR-M02-018; SC-M02-006)
- [ ] T086 [P] [US7] Viết test src/modules/m02/sync/SyncStatus.test.tsx: SCR-M02-003 hiện chờ gửi / đã gửi / lỗi / offline; SCR-M02-001 hiện một dòng lỗi E-SCR-M02-001-22 khi mục của chuyến gần nhất là `CONFLICT` và chưa có chuyến mới; không có nút thử lại, sửa hay xóa (BR-M02-011)
- [ ] T087 [P] [US7] Viết E2E e2e/m02/sync.spec.ts cho quickstart V24–V26 (mock `/functions/v1/session-intake`; đếm số lần ghi phía mock)

### Implementation for User Story 7

- [ ] T088 [P] [US7] Cài đặt src/modules/m02/api/intakeClient.ts: `supabase.functions.invoke('session-intake', { body: record })` với timeout `SYNC_REQUEST_TIMEOUT_SECONDS` (nếu phiên bản supabase-js đã pin không nhận AbortSignal cho `functions.invoke` thì gọi `fetch` tới `${VITE_SUPABASE_URL}/functions/v1/session-intake` với header `apikey`), ánh xạ response → `SYNCED | CONFLICT | KEEP_PENDING` cho T084 qua
- [ ] T089 [P] [US7] Cài đặt src/modules/m02/storage/updateSyncStatus.ts: transaction chỉ đổi `syncStatus` của `pendingSyncItems`, không bao giờ ghi `record`
- [ ] T090 [US7] Cài đặt src/modules/m02/sync/syncRunner.ts và src/modules/m02/sync/startSync.ts (đăng ký trigger khởi động, `visibilitychange`, `online`, sau commit terminal; lịch thử lại trong tab giữ lock; không background sync) cho T085 qua; gọi startSync từ shell (src/app/App.tsx) cùng autoEndTriggers
- [ ] T091 [US7] Cài đặt src/modules/m02/sync/useSyncStatus.ts và gắn trạng thái vào src/modules/m02/end/EndPage.tsx và dòng lỗi E-SCR-M02-001-22 vào src/modules/m02/session/TripPage.tsx cho T086 qua

**Checkpoint**: Mọi user story M02 chạy độc lập trên network mock

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: PWA, kiểm chứng xuyên story, bằng chứng

- [ ] T092 Viết test src/modules/m02/pwa/registerBusy.test.ts rồi cài đặt src/modules/m02/pwa/registerBusy.ts: đăng ký `hasRunningSession()` qua `registerBusyCheck` của src/app/pwa/updateCoordinator.ts; giữ lock shared `cpq:busy` khi tab đang hiện phiên chạy hoặc đang xử lý quét/đồng bộ (research R-15; constitution VI); gọi từ src/app/App.tsx
- [ ] T093 [P] Viết E2E e2e/m02/pwa-update.spec.ts cho quickstart V27: có phiên đang chạy, chỉ mở tab M01, có bản build mới → bản mới không được áp dụng cho tới khi phiên kết thúc
- [ ] T094 [P] Viết E2E e2e/m02/no-presence-words.spec.ts cho quickstart V28: duyệt mọi màn M02 ở cả vi/en, quét DOM không có "đã đến", "có mặt", "arrived", mã enum hay id thô (SC-M02-013)
- [ ] T095 [P] Viết E2E e2e/m02/cross-tab.spec.ts: hai tab cùng trình duyệt — quét ở tab A, tab B thấy lượt ghé; thay phiên ở tab A, tab B thấy phiên mới; không bao giờ có hai phiên `DANG_DIEN_RA` (BR-M02-002; field-ui-flow §5)
- [ ] T096 [P] Viết E2E e2e/m02/qr-link-chunks.spec.ts: mở `/q/Q1a` trên build preview, ghi lại request — không tải chunk `m02-scanner`, chunk màn M01 hay M03 (research R-17); đo LCP bằng Lighthouse profile di động thủ công, ghi kết quả hoặc `NOT RUN` vào specs/002-m02-field-quest-experience/validation-report.md
- [ ] T097 Rà soát WCAG 2.1 AA (bàn phím, focus, tương phản theo token, nhãn nút, `aria-live` cho thông báo quét) trên mọi màn src/modules/m02/** theo design-system §6; sửa chỗ thiếu
- [ ] T098 Tạo specs/002-m02-field-quest-experience/checklists/br-test-coverage.md: bảng BR-M02-001…026, SC-M02-001…019 và DAC-M02-001…011 → file test; mục nào thiếu test thì thêm test vào story tương ứng trước khi đóng phase (constitution "Testing & Validation")
- [ ] T099 Chạy `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run e2e -- --project=m02`; ghi lệnh, mã thoát, số test vào specs/002-m02-field-quest-experience/validation-report.md; phần không chạy được ghi `NOT RUN` kèm lý do (AGENTS.md §6)
- [ ] T100 Lập checklist kiểm thủ công trên Android Chrome và iOS Safari thật (camera, từ chối quyền, camera hệ thống mở link `/q/…`, offline giữa chuyến, app cài trên màn hình chính iPhone) trong specs/002-m02-field-quest-experience/validation-report.md; đánh dấu `NOT RUN` cho tới khi chủ dự án chạy (research R-19; quickstart §5)
- [ ] T101 Chạy `git diff --check`; ghi artifact upstream có nguy cơ stale phát hiện lúc code vào specs/002-m02-field-quest-experience/validation-report.md, không tự sửa spec (AGENTS.md §4)

---

## Phase 11: Tích hợp package khác

**Purpose**: Thay bản giả bằng producer thật khi package khác sẵn sàng

### Với package 001 (M01) — chờ package 001 xong bước 1–9 của plan M01

- [ ] T102 Xác nhận src/modules/m01/index.ts có đủ hàm mà src/modules/m02/m01Port.ts re-export với đúng chữ ký (gồm kết quả `NONE`/`INVALID`/`OK` của `readSelectedRouteContext()` — D-01) và `registerBusyCheck` có trong src/app/pwa/updateCoordinator.ts (D-02); lệch thì ghi vào validation-report.md và báo package 001, không sửa file của M01
- [ ] T103 Chạy lại toàn bộ test M02 và E2E project `m02` với m01Port thật (bỏ fakeM01Port trong E2E): luồng M01 Start → `/trip` → phiên mới; trang `/q/…` đổi ngôn ngữ ghi qua M01; ghi kết quả vào specs/002-m02-field-quest-experience/validation-report.md

### Với M03 giai đoạn B (chờ M03 Phase 13–15 cài đặt xong; CHG-M03-2026-10-30-01 đã duyệt)

- [ ] T104 Chờ M03 giai đoạn B hoàn tất `api.lookup_qr`, Edge `session-intake` và policy Storage trên stack local (specs/003-m03-operations-content-administration/tasks.md T190, T195, T172) và fixture local-stack của M03 T198 (e2e/.local-fixture.json); không làm T105–T106 trước đó
- [ ] T105 Chạy `PW_LOCAL_STACK=1 npm run e2e -- --project=m02-local-stack` cho quickstart V5, V14, V20, V24, V25 trên stack Supabase local, dùng `qrIdentifier`/`routeId` thật từ e2e/.local-fixture.json (M03 T198) (`supabase start`, `supabase db reset` chỉ local, `supabase functions serve session-intake`); ghi kết quả hoặc `NOT RUN` vào specs/002-m02-field-quest-experience/validation-report.md
- [ ] T106 Điền cột "tích hợp thật" trong specs/002-m02-field-quest-experience/checklists/br-test-coverage.md; nếu M03 trả mã HTTP ngoài bảng session-intake §3, xác nhận M02 giữ `PENDING` và ghi đề xuất L-02 cho package 003

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T002 phụ thuộc tooling của package 003 hoặc 001 (cái nào có trước)
- **Foundational (Phase 2)**: sau Setup — CHẶN mọi user story. T010 cần `visitorDb` của 001 (hoặc tạo theo Physical §11 và bàn giao)
- **User Stories (Phase 3–9)**: sau Foundational; chạy được với fakeM01Port và fakeLookup, không cần 001 hay M03 giai đoạn B
- **Polish (Phase 10)**: sau các story muốn giao
- **Tích hợp (Phase 11)**: T102–T103 chờ package 001; T104–T106 ⛔ chờ M03 giai đoạn B

### User Story Dependencies

- **US1 (P1)**: sau Foundational; không phụ thuộc story khác
- **US2 (P1)**: cần phiên của US1 (T030) để ghi lượt ghé
- **US3 (P1)**: cần kết quả quét của US2 (T043, T044)
- **US4 (P1)**: hoàn thiện resolveScan của US2 (T042); gắn vào màn của US2–US3
- **US5 (P1)**: cần lượt ghé của US2 (T041) và cờ `finalPromptNeeded` (T043); mở rộng createSession của US1 (T071)
- **US6 (P1)**: cần processScan (T043), ContentPage (T056), ScanNotice (T061); tự đóng của US5 (T072) chạy trước link
- **US7 (P2)**: cần mục hàng đợi do US5 tạo (T070); MVP-Scope §1 yêu cầu cùng increment với M03 Session Intake

### Within Each User Story

- Test viết trước và FAIL trước khi cài đặt
- Storage/hàm thuần → orchestration → màn hình → đăng ký route
- Story xong và qua checkpoint trước khi sang story kế

### Parallel Opportunities

- Setup: T004–T008 song song
- Foundational: T011, T013–T015, T017–T018, T020, T022–T023 song song
- Trong mỗi story: mọi task test có [P] song song; hàm thuần và component khác file có [P] song song
- US3 và US4 có thể làm song song sau US2 (khác file, trừ T062 gắn vào ContentPage)

---

## Parallel Example: User Story 2

```bash
# Viết toàn bộ test của US2 cùng lúc:
Task: "T033 parseQrLink.test.ts"
Task: "T034 resolveScan.test.ts"
Task: "T035 recordVisit.test.ts"
Task: "T037 RouteJourneyMap.test.tsx"
Task: "T038 QrScanner.test.tsx"

# Sau đó cài đặt song song các file độc lập:
Task: "T040 scan/parseQrLink.ts"
Task: "T041 storage/recordVisit.ts"
Task: "T044 scan/viewScannedPoint.ts"
Task: "T045 journey/RouteJourneyMap.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T052 content/selectContentSource.ts"
Task: "T053 content/mediaFilter.ts"
Task: "T054 content/usePackageImage.ts + useSignedImage.ts"
Task: "T055 content/MediaList.tsx"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 Foundational
2. US1 → **DỪNG và KIỂM CHỨNG** V1–V4
3. MVP thực địa tối thiểu là **US1 + US2 + US3** (vào phiên → quét → đọc nội dung), vì đường đi tối thiểu của MVP là quét và ghi lượt ghé (spec.md Story 2 "Why this priority")

### Incremental Delivery

1. US1 → US2 → US3 → US4 → US5 → US6 → US7, mỗi story qua checkpoint của nó trên bản giả
2. Phase 10 → bằng chứng tự động và checklist thủ công
3. Khi package 001 xong: T102–T103. Khi M03 giai đoạn B mở: T104–T106

### Parallel Team Strategy

1. Cả nhóm làm Setup + Foundational
2. Dev A: US1 → US5; Dev B: US2 → US4 → US6; Dev C: US3 → US7
3. Phase 10 chia theo file E2E

---

## Notes

- [P] = khác file, không phụ thuộc
- [Story] gắn task với user story để truy vết (spec.md Traceability)
- Không ghi store của M01 hay dữ liệu của M03 (FR-M02-020); không lưu kết quả lookup
- Không xóa phiên, lượt ghé hay mục hàng đợi: spec không có requirement xóa (research R-18)
- Kích hoạt cloud và phát hành (vercel.json rewrite để `/q/…` mở được lần đầu, cấu hình Supabase cloud, smoke check, release gate) nằm ở Phase 16 của tasks M03, cần change brief triển khai
- Không commit, push, cài dependency ngoài T003, hay gọi dịch vụ cloud nếu người dùng chưa yêu cầu (AGENTS.md §6); không dùng dữ liệu thật
- CI: workflow .github/workflows/ci.yml do tasks M03 T002 tạo (người dùng duyệt 2026-10-30) chạy `npm run ci` và E2E project mock của M01, M02, M03 trên mỗi push/PR (plan.md Complexity #3)
