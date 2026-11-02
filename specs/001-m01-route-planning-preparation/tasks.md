---

description: "Danh sách task triển khai M01 — Route Planning & Preparation"
---

# Tasks: M01 — Route Planning & Preparation

**Input**: Tài liệu thiết kế trong `specs/001-m01-route-planning-preparation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: **Có.** Constitution "Testing & Validation" yêu cầu: mỗi BR-* có test; contract test phủ Required/Conditional/Optional; test rollback cho thao tác atomic (kích hoạt gói, ghi context); candidate `CHUA_HOAN_TAT` không bao giờ thành gói active. plan.md "Validation Strategy" yêu cầu mỗi BR-M01-001…016 có ít nhất một test. Test viết trước và phải FAIL trước khi cài đặt.

**Organization**: Task nhóm theo user story của [spec.md](spec.md) để mỗi story cài đặt và kiểm chứng độc lập.

> **Quy tắc dẫn xuất.** File này không tạo requirement. Hành vi lấy từ [spec-M01 v3.2](../../docs/spec/spec-M01.md); quyết định kỹ thuật lấy từ plan/research. Giữ nguyên tên contract (Published Route, `JourneySnapshot`, `LanguagePreference`, `SelectedRouteContext v3`, `OfflinePackage`) và mọi ID. `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8 là **provisional** (spec-M01 §9.3). Schema phía consumer không kiểm giới hạn độ dài/số phần tử provisional của M03 (spec-M03 §5.3; research R-04).
>
> **Vị trí của M01 giữa ba package.** M01 sở hữu phần lớn hạ tầng trình duyệt mà M02 dùng: `src/shared/db/visitorDb.ts` (cả 3 store M02), bề mặt đọc `src/modules/m01/index.ts`, ba schema produce, `src/app/paths.ts`, `src/app/pwa/updateCoordinator.ts` và cấu hình PWA (research R-07, R-14, §4). Nên làm M01 **trước** M02. Tooling gốc dùng chung với [tasks M03](../003-m03-operations-content-administration/tasks.md) Phase 1; package nào chạy trước thì tạo.
>
> **Nguồn dữ liệu.** View `api.published_routes`, `api.active_journey_snapshots` và policy đọc Storage thuộc **M03 giai đoạn B** (phạm vi local mở 2026-10-30 theo CHG-M03-2026-10-30-01; chưa cài đặt). Phase 3–9 chạy với adapter giả (Vitest) và network mock (Playwright); tích hợp thật ở T103–T106.
>
> **Giao diện.** Mọi task dựng màn hình dùng skill `frontend-design`; màu, font, khoảng cách chỉ lấy từ token ([design-system.md](../../docs/design/design-system.md), nhóm `--color-m01-*`); icon chỉ từ `assets/icons/`; hình thức tham chiếu `screens/screen-spec/M01/` và `screens/html/mockup-SCR-M01-*.html` (CLAUDE.md). Chữ hiển thị chỉ lấy từ `src/modules/m01/i18n/`, chép từ bảng copy screen spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story của task (US1…US7, theo spec.md)
- Mỗi task nêu đường dẫn file chính xác

## Path Conventions

- Web app modular monolith (plan.md "Project Structure"): M01 nằm trọn trong `src/modules/m01/`; không import `src/modules/m02|m03`. M02 chỉ dùng `src/modules/m01/index.ts`.
- Unit/contract/component test đặt cạnh mã nguồn dạng `*.test.ts(x)`; E2E ở `e2e/m01/`; fixture contract dùng chung ở `src/shared/contracts/__fixtures__/`.
- M01 không có file nào dưới `supabase/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tooling và cấu hình PWA (plan.md Implementation Sequence bước 1)

- [X] T001 Ghi quyết định Complexity Tracking #1–#4 ngay dưới bảng Complexity Tracking của specs/001-m01-route-planning-preparation/plan.md (#2 duyệt, #3 hoãn CI, #4 duyệt `fake-indexeddb` chỉ làm dev dependency)
- [X] T002 Kiểm tra tooling gốc đã có chưa (package.json, tsconfig*.json, vite.config.ts, vitest.config.ts, playwright.config.ts, .env.example). Chưa có thì thực hiện trước phần nền dùng chung trong specs/003-m03-operations-content-administration/tasks.md: Phase 1 (T002–T010) **và** phần dùng chung của Phase 2 (T011–T019: config, Supabase client, token, UI nền, shell App/router/paths, update coordinator; test hook E2E ở T007). Có rồi thì bỏ qua. Thiếu T011–T019 thì T029 (client), T032 (router), T050 (UI) của M01 không chạy được
- [X] T003 Bổ sung dependency của M01 vào package.json nếu chưa có, pin chính xác: runtime `dexie`; dev `fake-indexeddb`. Không thêm `dexie-react-hooks`, thư viện state, i18n hay form (research R-02). Cập nhật package-lock.json; ghi phiên bản đã cài thật vào specs/001-m01-route-planning-preparation/research.md R-02
- [X] T004 [P] Thêm `import 'fake-indexeddb/auto'` vào src/test/setup.ts nếu chưa có (plan.md Complexity #4)
- [X] T005 [P] Tạo .env.e2e nếu chưa có, chỉ giá trị giả an toàn (`VITE_SUPABASE_URL=http://127.0.0.1:54321`, key giả, `VITE_QR_PUBLIC_BASE_URL=http://localhost:4173`); thêm script `preview:e2e` (`vite build --mode e2e && vite preview --port 4173`) vào package.json nếu chưa có (research R-16)
- [X] T006 [P] Bổ sung vào playwright.config.ts: thêm `npm run preview:e2e` (cổng 4173) vào mảng `webServer` cấp cao nhất nếu chưa có; project `m01` (testDir `e2e/m01`, baseURL `http://localhost:4173`, có service worker) và `m01-local-stack` (testDir `e2e/m01`, baseURL `http://localhost:5173`, chỉ có khi `PW_LOCAL_STACK=1`, dùng ở T105)
- [X] T007 Cấu hình PWA trong vite.config.ts theo research R-14: `vite-plugin-pwa` `strategies: 'generateSW'`, `registerType: 'prompt'`; `globPatterns` precache mọi JS/CSS/HTML/font/icon của build gồm chunk lazy của M01 và M02 (cả `m02-scanner`); `navigateFallback: '/index.html'` để `/q/*` mở từ app shell khi offline; `runtimeCaching` để trống (không cache Supabase API, Auth, response quản trị, signed media); tên chunk `m01-catalog`, `m01-recommend`, `m01-route-detail`, `m01-offline`; `globIgnores` loại chunk của M03 (`/admin/*`, `qrcode`) khỏi precache vì M03 chỉ online (M03 R-24: không làm nặng phần du khách); manifest `name: 'Cúc Phương Quest'`, `start_url: '/'`, `icons` để trống cho tới khi chủ dự án cung cấp icon vuông 192/512 px (assets/icons/ hiện chỉ có icon.png 944×812; không tự tạo asset), favicon dùng assets/icons/icon.png. Nếu package khác đã cấu hình thì chỉ bổ sung phần thiếu

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shell, database, contract, adapter mà mọi story M01 (và M02) cần (plan.md bước 2–6)

**⚠️ CRITICAL**: Không bắt đầu user story nào trước khi phase này xong

### Shell dùng chung

- [X] T008 Tạo hoặc bổ sung src/app/paths.ts: `PATHS.catalog = '/'`, `PATHS.recommend = '/recommend'`, `PATHS.routeDetail(routeId)`, `PATHS.offline = '/offline'`, `PATHS.m02SessionEntry = '/trip'` (research R-03, P-03)
- [X] T009 Viết test src/app/pwa/updateCoordinator.test.ts rồi tạo hoặc bổ sung src/app/pwa/updateCoordinator.ts theo research R-14: khi có bản mới chỉ gọi `updateSW(true)` sau khi người dùng đồng ý, lấy được lock exclusive `cpq:busy` (`ifAvailable: true`) **và** mọi hàm `registerBusyCheck(fn)` trả `false` (hàm lỗi = bận); không lấy được thì hoãn và giữ lời nhắc. Thêm phần của M01: `registerPackageOperation()` giữ lock **shared** `cpq:busy` trong suốt một thao tác gói. Giữ nguyên `registerUnsavedForm` nếu package 003 đã thêm (D-02)

### Database dùng chung

- [X] T010 Viết test src/shared/db/visitorDb.test.ts rồi tạo src/shared/db/visitorDb.ts: Dexie database `cuc-phuong-quest`, `version(1).stores({...})` chép 1:1 mười store của data-model §4 (gồm `playSessions`, `checkpointVisits`, `pendingSyncItems` của M02); test so chuỗi `stores()` của từng store với bảng data-model §4. Ghi chú đầu file: đổi schema phải tăng version chung, M02 không tạo database thứ hai (research R-07, P-01)

### Contract dùng chung (R-04) — test trước

- [X] T011 [P] Tạo fixture synthetic src/shared/contracts/__fixtures__/publication.ts: tuyến A `HOAT_DONG` (2 checkpoint `OFFLINE_REQUIRED`, 3 QR, 4 ảnh, có `offlineRouteMap`), tuyến B `HOAT_DONG` chỉ `ONLINE_AVAILABLE` không sơ đồ, tuyến C `TAM_DONG`, tuyến D `LUU_TRU`, một dòng hỏng; snapshot tương ứng; tên giả (quickstart §4). Dùng chung với M03
- [X] T012 [P] Viết test consumer src/shared/contracts/publication.consumer.test.ts: fixture A, B qua `publishedRoute.ts`/`journeySnapshot.ts`; dòng hỏng bị từ chối; chuỗi dài hơn giới hạn provisional **không** bị từ chối; `offlineResources` chỉ có khi `OFFLINE_REQUIRED` (spec-M03 §5.3; research R-04, L-02)
- [X] T013 Kiểm tra src/shared/contracts/publishedRoute.ts và journeySnapshot.ts đã có (do package 003 sở hữu, tasks M03 T024–T025). Chưa có thì tạo đúng [publication-public-contract M03](../003-m03-operations-content-administration/contracts/publication-public-contract.md) §2–§3, chỉ kiểm shape/presence/enum/ràng buộc chéo, và ghi chú đầu file: bàn giao sở hữu cho 003 (plan.md bước 4)
- [X] T014 Viết test src/shared/contracts/publicationRowMapping.test.ts rồi tạo src/shared/contracts/publicationRowMapping.ts: hàm ánh xạ dòng view `api.published_routes`/`api.active_journey_snapshots` → giá trị contract camelCase, đặt cạnh schema để producer và consumer dùng một hàm. Chốt điểm L-01 theo Physical §3: cột là `snake_case` của key cấp cao nhất của contract (liệt kê tường minh trong file — M03 T184 dựng view đúng danh sách này); giá trị lồng là `jsonb` giữ key `camelCase`, giữ nguyên; cột nullable của trường Optional → **bỏ property** khi `null` (contract coi Optional là vắng mặt; để nguyên `null` thì Zod từ chối mọi dòng). Test phủ dòng có và không có trường Optional
- [X] T015 [P] Viết contract test src/shared/contracts/languagePreference.test.ts: chỉ `vi`/`en`; giá trị khác bị từ chối (DAC-M01-001; BR-M01-001)
- [X] T016 [P] Viết contract test src/shared/contracts/selectedRouteContext.test.ts: `contractVersion` literal `3` (2 bị từ chối); `handoffId` UUID; `routeId` = `routeJourneyManifest.routeId`; `expiresAt − authorizedAt` đúng 86 400 000 ms (lệch 1 ms bị từ chối); `authorizationStatus` ∈ `AUTHORIZED`/`REVOKED`; `checkpointId`/`sequence` duy nhất (cho phép khoảng trống); `qrIdentifiers` không rỗng; không có `resources`, `introductionText` hay byte ảnh; `routeId`, `checkpointId`, `qrIdentifiers[]` là chuỗi không rỗng, không kiểm định dạng (constitution: identifier opaque) (quickstart V26; DAC-M01-002–007)
- [X] T017 [P] Viết contract test src/shared/contracts/offlinePackage.test.ts: `versionStatus` bắt buộc khi `SAN_SANG`; `manifest.routeId/contentVersion` khớp; đúng một resource cho mỗi QR của checkpoint `OFFLINE_REQUIRED`, resource thừa cho `ONLINE_AVAILABLE` bị từ chối; `qrIdentifier` duy nhất; `offlineRouteMap.caption` both-or-none; `routeEssentials` có tên và điểm xuất phát đủ hai ngôn ngữ, text tùy chọn both-or-none, có `capturedAt` (quickstart V26; DAC-M01-008–015)
- [X] T018 [P] Cài đặt src/shared/contracts/languagePreference.ts (Zod + kiểu) cho T015 qua
- [X] T019 [P] Cài đặt src/shared/contracts/selectedRouteContext.ts (`SelectedRouteContextV3`) cho T016 qua
- [X] T020 [P] Cài đặt src/shared/contracts/offlinePackage.ts (`OfflinePackage`, `OfflineResource`) cho T017 qua

### M01 core: giới hạn, chữ, định dạng

- [X] T021 [P] Cài đặt src/modules/m01/config/limits.ts: `SOURCE_REQUEST_TIMEOUT_SECONDS = 8` có chú thích **provisional** + spec-M01 §9.3; hằng kỹ thuật `PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS = 60`, `PACKAGE_IMAGE_CONCURRENCY = 4`, `HANDOFF_VALIDITY_MS = 86_400_000`, mỗi hằng ghi rõ phân loại (research R-05, R-06, R-11, R-17); test src/modules/m01/config/limits.test.ts
- [X] T022 [P] Viết test src/modules/m01/i18n/i18n.test.ts rồi tạo src/modules/m01/i18n/vi.ts và src/modules/m01/i18n/en.ts: chép câu chữ từ bảng copy screen spec SCR-M01-001…004; hai từ điển cùng tập khóa; không chuỗi nào là mã enum (research R-12; visitor-ui-flow §4)
- [X] T023 [P] Viết test src/modules/m01/format.test.ts rồi tạo src/modules/m01/format.ts: `formatEstimatedSize(bytes?)` = `bytes / 1 048 576` làm tròn lên một chữ số thập phân, tối thiểu `0.1`, theo câu copy; vắng → "Chưa có thông tin dung lượng." / "Size not available."; `formatCapturedAt(iso, lang)` bằng `Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'short' })` theo múi giờ thiết bị (research R-18)

### M01 storage: dòng và hàm đọc

- [X] T024 [P] Cài đặt src/modules/m01/storage/rows.ts: kiểu dòng Dexie (`slot`, dòng `offlinePackages` không có `resources[]`, dòng `offlineResources`, `activePackages`, `packageCandidates` với `operationToken`, `phase`, `staged?`, `imageBytes`) đúng data-model §2–§3; transport ≠ canonical (research R-04)
- [X] T025 Viết test src/modules/m01/storage/readers.test.ts rồi cài đặt src/modules/m01/storage/readers.ts: `readLanguagePreference()`; `readSelectedRouteContext()` trả `NONE` (trống) / `INVALID` (không qua schema, gồm version 2) / `OK` (D-01); `readActiveOfflinePackage(routeId)` đi qua `activePackages`, lắp `resources[]`, validate, kiểm byte trong `imageBytes`, lỗi → `null`; `findOfflineResource(routeId, qrIdentifier)`; `readPackageImage(routeId, contentVersion, sourceRef)` → `Blob`; `listPackageEntries()` nội bộ cho SCR-M01-004. Mọi hàm đọc dùng bảng của `visitorDb` trực tiếp và không `await` thao tác ngoài Dexie, để chạy được **bên trong** transaction bao ngoài của M02 (M02 research R-05: kiểm "chưa dùng" và tạo phiên phải nguyên tử); export hằng `M01_HANDOFF_TABLES = ['selectedRouteContext']` để M02 đưa vào phạm vi transaction. Test thêm: gọi `readSelectedRouteContext()` trong transaction `rw` bao ngoài gồm store context và store M02 chạy đúng. Test: dòng `packageCandidates` không bao giờ được trả ra; gói hỏng → `null` (FR-M01-005, 013; DAC-M01-009, 015; data-model §5.2)
- [X] T026 Tạo src/modules/m01/index.ts: bề mặt công khai chỉ gồm các hàm đọc của T025 và hằng `M01_HANDOFF_TABLES` (phần ngôn ngữ thêm ở US1); không export hàm ghi nào (research R-07; P-02)
- [X] T027 [P] Viết test kiến trúc src/modules/m01/architecture.test.ts: src/modules/m01/** không import `src/modules/m02/**` hay `src/modules/m03/**`; src/modules/m01/index.ts không export hàm nào từ `storage/*Writer*`; chỉ `src/modules/m01/storage/` ghi vào bảy store của M01 (constitution II; FR-M01-013)

### M01 API adapter và bản giả

- [X] T028 [P] Viết test src/modules/m01/api/sourceClient.test.ts: đọc danh mục, một tuyến, snapshot active qua `supabase.schema('api')`; quá `SOURCE_REQUEST_TIMEOUT_SECONDS` → nguồn không khả dụng; response lỗi hoặc không qua schema → không khả dụng (dòng hỏng bị bỏ, không sửa); `navigator.onLine === false` → bỏ qua request; `onLine === true` không bao giờ đủ để coi là online (research R-05; spec-M01 §5.4, §9.3)
- [X] T029 Cài đặt src/modules/m01/api/sourceClient.ts: `fetchCatalog()`, `fetchRoute(routeId)`, `fetchActiveSnapshot(routeId)` dùng src/shared/supabase/client.ts, `AbortController`, src/shared/contracts/publicationRowMapping.ts và schema dùng chung; trả `{ kind: 'OK', … } | { kind: 'UNAVAILABLE' }`; mỗi lần đọc thành công gọi các hiệu ứng đăng ký ở src/modules/m01/api/onSourceRead.ts (registry; US5, US6 đăng ký thu hồi, `OUTDATED`, làm mới essentials)
- [X] T030 [P] Viết test src/modules/m01/api/mediaClient.test.ts rồi cài đặt src/modules/m01/api/mediaClient.ts: `createSignedUrls(sourceRefs)` trên bucket `MEDIA_BUCKET`; `fetchImageBlob(signedUrl)` với `PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS`, chỉ coi là đọc được khi HTTP 2xx, `blob.size > 0`, `blob.type` bắt đầu bằng `image/`; URL không bao giờ được tính là đã tải (research R-06; constitution VI)
- [X] T031 [P] Cài đặt src/modules/m01/api/fake/fakeSource.ts: adapter giả dùng fixture của T011, có hook đổi trạng thái tuyến (A → `TAM_DONG`), nâng version (A v1 → v2), trễ quá 8 s, lỗi ảnh 404/500, `estimatedOfflineSizeBytes` vắng; tạo src/modules/m01/testing/e2eHooks.ts đăng ký namespace `m01` vào src/shared/testing/e2eHooks.ts (`seedContext`, `seedPackage`, `failNextActivation` cho V12, V19 và cho E2E của M02)

### Khung route và layout

- [X] T032 Cài đặt src/modules/m01/routes.tsx: bốn route lazy `/`, `/recommend`, `/routes/:routeId`, `/offline` với trang placeholder (research R-03); đăng ký vào src/app/router.tsx
- [X] T033 Dựng src/modules/m01/layout/VisitorLayout.tsx + VisitorLayout.module.css: header với khe cho `LanguageControl` (US1), liên kết tới `/offline`, vùng thông báo nguồn

**Checkpoint**: Nền sẵn sàng; M02 đã có `visitorDb`, `paths.ts`, `updateCoordinator` và hàm đọc

---

## Phase 3: User Story 1 - Choose language — US-M01-01 (Priority: P1) 🎯 MVP

**Goal**: Chọn `vi`/`en`, lưu và công bố ngay cho mọi tab và cho M02; `LanguageControl` dùng lại trên trang link QR của M02 (FR-M01-001; BR-M01-001)

**Independent Test**: Quickstart V1–V3: mở `/` lần đầu và chọn English; mở `/q/{id}` lần đầu với `vi-VN` rồi `en-US`; đổi VI/EN khi offline

### Tests for User Story 1 ⚠️

- [ ] T034 [P] [US1] Viết test src/modules/m01/storage/languageWriter.test.ts: chỉ ghi `vi`/`en` trong một transaction; giá trị khác bị từ chối; ghi không đổi dòng gói hay context (BR-M01-001; DAC-M01-001; US-M01-01 mục 2)
- [ ] T035 [P] [US1] Viết test src/modules/m01/language/resolveDisplayLanguage.test.ts: giá trị đã lưu thắng; chưa lưu → `navigator.language` bắt đầu bằng `vi` → `vi`, ngược lại `en`; hàm không ghi gì (research R-12; BR-M02-024)
- [ ] T036 [P] [US1] Viết test src/modules/m01/language/LanguageGate.test.tsx: route thường chưa có ngôn ngữ → panel chọn chặn toàn trang; trang `/q/…` không có panel và không ghi gì cho tới khi bấm VI/EN (US-M01-01 mục 1)
- [ ] T037 [P] [US1] Viết test src/modules/m01/language/LanguageControl.test.tsx: bấm VI/EN cập nhật `LanguagePreference` ngay; tab khác thấy qua `liveQuery`; UI đổi ngay (US-M01-01 mục 3; FR-M01-001)
- [ ] T038 [P] [US1] Viết E2E e2e/m01/language.spec.ts cho quickstart V1–V3

### Implementation for User Story 1

- [ ] T039 [P] [US1] Cài đặt src/modules/m01/storage/languageWriter.ts cho T034 qua
- [ ] T040 [P] [US1] Cài đặt src/modules/m01/language/resolveDisplayLanguage.ts và src/modules/m01/language/useLanguagePreference.ts (`liveQuery` của Dexie + `useSyncExternalStore`)
- [ ] T041 [US1] Dựng src/modules/m01/language/LanguageControl.tsx + `.module.css` (nút VI/EN, ghi qua languageWriter) và src/modules/m01/language/LanguageGate.tsx (panel chọn ngôn ngữ của SCR-M01-001)
- [ ] T042 [US1] Export `LanguageControl`, `useLanguagePreference`, `resolveDisplayLanguage` qua src/modules/m01/index.ts; gắn LanguageControl vào src/modules/m01/layout/VisitorLayout.tsx; bọc bốn route M01 bằng LanguageGate trong src/modules/m01/routes.tsx (không bọc route của M02)

**Checkpoint**: US1 chạy độc lập; M02 dùng được `LanguageControl`

---

## Phase 4: User Story 2 - Browse routes — US-M01-02 phần duyệt (Priority: P1)

**Goal**: Danh mục chỉ tuyến `HOAT_DONG` có snapshot hợp lệ, thẻ đủ trường, local view khi offline (FR-M01-002; BR-M01-002, 012)

**Independent Test**: Quickstart V4–V7 với fixture A, B, C, D, dòng hỏng; ảnh 404; mất mạng; nguồn chậm quá 8 s

### Tests for User Story 2 ⚠️

- [ ] T043 [P] [US2] Viết test src/modules/m01/catalog/selectableRoutes.test.ts: chỉ `HOAT_DONG` + `activeContentVersion` khác null + qua schema; C, D, dòng hỏng bị loại; sắp A→Z bằng `Intl.Collator` theo ngôn ngữ đang chọn; dấu "cần tải trước" khi `hasOfflineRequiredCheckpoint` hoặc `hasOfflineRouteMap` là `true` (BR-M01-002, 012; SC-M01-001; DAC-M01-017)
- [ ] T044 [P] [US2] Viết test src/modules/m01/catalog/catalogStore.test.ts: lưu danh mục đọc thành công lần cuối trong bộ nhớ; làm mới lỗi → giữ local view kèm cờ dữ liệu cũ; mở lạnh khi không có nguồn → "Source unavailable"; không lưu bền (research R-13; FR-M01-002)
- [ ] T045 [P] [US2] Viết test src/modules/m01/catalog/CatalogPage.test.tsx: thẻ có thumbnail, tên và mô tả ngắn theo ngôn ngữ, quãng đường, thời lượng, độ khó, `checkpointCount`, dấu cần tải trước; ảnh lỗi → placeholder trung tính, thẻ vẫn bấm được; trạng thái Loading, Has routes, Empty, Stale/offline, Source unavailable; vẫn vào được `/offline` khi không có nguồn (US-M01-02; visitor-ui-flow §2)
- [ ] T046 [P] [US2] Viết E2E e2e/m01/catalog.spec.ts cho quickstart V4–V7 (`page.route()` giả Data API và Storage)

### Implementation for User Story 2

- [ ] T047 [P] [US2] Cài đặt src/modules/m01/catalog/selectableRoutes.ts cho T043 qua
- [ ] T048 [P] [US2] Cài đặt src/modules/m01/catalog/catalogStore.ts cho T044 qua
- [ ] T049 [P] [US2] Dựng src/modules/m01/catalog/RouteCard.tsx + `.module.css` (signed URL qua mediaClient, `loading="lazy"`, placeholder khi lỗi)
- [ ] T050 [US2] Dựng SCR-M01-001 src/modules/m01/catalog/CatalogPage.tsx + `.module.css` và đăng ký `/` trong src/modules/m01/routes.tsx

**Checkpoint**: US1 và US2 chạy độc lập

---

## Phase 5: User Story 3 - View route details — US-M01-06 (Priority: P1)

**Goal**: Trang chi tiết online đủ trường; offline hiện essential texts đã lưu kèm thời điểm lưu (FR-M01-003, 014; BR-M01-013, 014)

**Independent Test**: Quickstart V8 và kịch bản offline có gói (gói được nạp bằng fixture IndexedDB): so trường hiển thị và câu "Thông tin được lưu lúc …"

### Tests for User Story 3 ⚠️

- [ ] T051 [P] [US3] Viết test src/modules/m01/route-detail/detailView.test.ts: online → đủ trường bắt buộc theo ngôn ngữ; trường tùy chọn vắng thì không có mục và không có chữ thay thế; tên điểm dừng từ `checkpointSummaries`, đánh số liên tục 1, 2, 3…; offline có gói → essentials đã lưu + `capturedAt` + tên điểm dừng từ `manifest` gói; không có bản lưu → mở bằng thông tin hiện có, không khẳng định mới nhất; M01 không tự bổ sung ngôn ngữ thiếu (BR-M01-013, 014; FR-M01-003, 014; SC-M01-008)
- [ ] T052 [P] [US3] Viết test src/modules/m01/route-detail/RouteDetailPage.test.tsx: cảnh báo an toàn nổi bật; ảnh đầu gallery là ảnh bìa; sơ đồ tuyến online; offline ảnh chưa lưu → placeholder; câu "Thông tin được lưu lúc {thời điểm}, có thể không phải bản mới nhất"; trạng thái nguồn lỗi, tuyến không còn khả dụng (US-M01-06; visitor-ui-flow §2)
- [ ] T053 [P] [US3] Viết E2E e2e/m01/route-detail.spec.ts cho quickstart V8 và chi tiết tuyến A offline có gói (SC-M01-008)

### Implementation for User Story 3

- [ ] T054 [P] [US3] Cài đặt src/modules/m01/route-detail/detailView.ts (hàm thuần dựng view online/offline) cho T051 qua
- [ ] T055 [US3] Dựng SCR-M01-003 src/modules/m01/route-detail/RouteDetailPage.tsx + `.module.css` (đọc qua sourceClient, fallback gói qua readers; vùng nút "Bắt đầu" cho US4 và vùng trạng thái gói cho US6) và đăng ký `/routes/:routeId` trong src/modules/m01/routes.tsx

**Checkpoint**: US1–US3 chạy độc lập

---

## Phase 6: User Story 4 - Start a route — US-M01-04 (Priority: P1)

**Goal**: Start online từ snapshot hiện hành, offline từ manifest gói `SAN_SANG`; ghi `SelectedRouteContext v3` một transaction, hạn 24 giờ; chỉ điều hướng M02 sau commit (FR-M01-011, 012, 013; BR-M01-008, 009, 010, 015)

**Independent Test**: Quickstart V17–V21: Start B online; Start B lần hai; offline có gói A `OUTDATED`; offline không gói; bấm Start hai lần và giả lập lỗi ghi

### Tests for User Story 4 ⚠️

- [ ] T056 [P] [US4] Viết test src/modules/m01/start/buildContext.test.ts: `contractVersion = 3`; `handoffId` từ `crypto.randomUUID()`, mới mỗi lần; `authorizedAt` ISO-8601 UTC; `expiresAt = authorizedAt + 86 400 000 ms`; `AUTHORIZED`; `routeJourneyManifest` là bản sao giá trị của snapshot (online) hoặc `manifest` gói (offline); không có `resources`/text/ảnh; qua schema (SC-M01-005; DAC-M01-002–007; BR-M01-009, 015)
- [ ] T057 [P] [US4] Viết test src/modules/m01/start/chooseStartPath.test.ts: online + `HOAT_DONG` + snapshot hợp lệ → đường online; `snapshot.contentVersion ≠ activeContentVersion` → đọc lại một lần rồi coi là không khả dụng; nguồn không khả dụng → gói `SAN_SANG` (`CURRENT` và `OUTDATED`) → đường offline; không có gói → chặn; tuyến `TAM_DONG`/`LUU_TRU` → chặn; tuyến không cần gói Start online không cần gói (BR-M01-008, 011; FR-M01-011; SC-M01-006, 010)
- [ ] T058 [P] [US4] Viết test src/modules/m01/storage/contextWriter.test.ts: một transaction `put` vào slot `current`, thay context trước; transaction abort → context trước nguyên vẹn; unique index `handoffId` (FR-M01-012; DAC-M01-003)
- [ ] T059 [P] [US4] Viết test src/modules/m01/start/startRoute.test.ts: lock `cpq:m01:start` `ifAvailable` → lần bấm thứ hai (cùng tab và hai tab) không tạo context thứ hai; điều hướng `PATHS.m02SessionEntry` chỉ sau commit; Start lỗi không điều hướng; M01 không bao giờ đổi `authorizationStatus` vì thời gian (FR-M01-012, 013; BR-M01-010, 015)
- [ ] T060 [P] [US4] Viết E2E e2e/m01/start.spec.ts cho quickstart V17–V21 (V19 nạp gói A `OUTDATED` qua `window.__cpqTestHooks.m01.seedPackage`)

### Implementation for User Story 4

- [ ] T061 [P] [US4] Cài đặt src/modules/m01/start/buildContext.ts cho T056 qua
- [ ] T062 [P] [US4] Cài đặt src/modules/m01/start/chooseStartPath.ts cho T057 qua
- [ ] T063 [P] [US4] Cài đặt src/modules/m01/storage/contextWriter.ts cho T058 qua
- [ ] T064 [US4] Cài đặt src/modules/m01/start/startRoute.ts (lock, chọn đường, dựng, validate, ghi, điều hướng) cho T059 qua (research R-11)
- [ ] T065 [US4] Gắn nút "Bắt đầu" vào src/modules/m01/route-detail/RouteDetailPage.tsx (tắt trong lúc chạy; thông báo chặn khi không có nguồn lẫn gói). Nhánh "tuyến cần gói mà chưa có gói `SAN_SANG`" gọi hook `requestOfflineDecision` mà US6 cài (T096); trước khi có US6, hook mặc định đi thẳng Start theo điều kiện của chooseStartPath

**Checkpoint**: US1–US4 chạy độc lập; M02 nhận được handoff thật

---

## Phase 7: User Story 5 - Route becomes unavailable — US-M01-05 (Priority: P1)

**Goal**: Đọc nguồn thành công thấy tuyến `TAM_DONG`/`LUU_TRU` → tuyến biến mất khỏi lựa chọn mới, context cùng tuyến thành `REVOKED`, không đụng gói hay phiên M02 (BR-M01-011)

**Independent Test**: Quickstart V22: có context A `AUTHORIZED`; fixture chuyển A sang `TAM_DONG`; làm mới danh mục

### Tests for User Story 5 ⚠️

- [ ] T066 [P] [US5] Viết test src/modules/m01/storage/revokeContext.test.ts: chỉ context hiện tại có `routeId` đó và `AUTHORIZED` thành `REVOKED`, các trường khác giữ nguyên; context tuyến khác không đổi; một transaction (BR-M01-011; DAC-M01-006)
- [ ] T067 [P] [US5] Viết test src/modules/m01/start/revocationEffect.test.ts: mọi lần đọc nguồn thành công (danh mục, chi tiết, Start) thấy `TAM_DONG`/`LUU_TRU` đều kích hoạt thu hồi; gói của tuyến còn nguyên; ba store M02 không đổi (BR-M01-010, 011; US-M01-05 mục 2–3)
- [ ] T068 [P] [US5] Viết E2E e2e/m01/route-unavailable.spec.ts cho quickstart V22 (kiểm tuyến biến mất, Start bị chặn, context `REVOKED`, store M02 không đổi)

### Implementation for User Story 5

- [ ] T069 [P] [US5] Cài đặt src/modules/m01/storage/revokeContext.ts cho T066 qua
- [ ] T070 [US5] Cài đặt src/modules/m01/start/revocationEffect.ts và đăng ký vào src/modules/m01/api/onSourceRead.ts cho T067 qua
- [ ] T071 [US5] Thêm trạng thái "Route removed" vào src/modules/m01/catalog/CatalogPage.tsx và "tuyến không còn khả dụng" (chặn Start) vào src/modules/m01/route-detail/RouteDetailPage.tsx

**Checkpoint**: US1–US5 chạy độc lập

---

## Phase 8: User Story 6 - Prepare offline content — US-M01-03 (Priority: P1, nâng từ Should*)

**Goal**: Dialog quyết định offline; pipeline tải → kiểm tra → staging → kích hoạt atomic; cập nhật lười; làm mới essentials; xóa; SCR-M01-004 (FR-M01-005…010, 014; BR-M01-004, 005, 006, 007, 012, 013, 016)

**Independent Test**: Quickstart V9–V16: dialog; tải thành công; ảnh lỗi lần đầu; cập nhật lỗi do hết quota; cập nhật thành công; bấm Tải hai lần / hai tab; đóng tab giữa lúc tải; xóa gói

### Tests for User Story 6 ⚠️

- [ ] T072 [P] [US6] Viết test src/modules/m01/offline-package/needsPackage.test.ts: cần gói khi một trong hai cờ là `true`; snapshot thắng cờ; cờ nói cần mà snapshot không có `OFFLINE_REQUIRED` lẫn `offlineRouteMap` → gói vẫn `SAN_SANG` với `resources` rỗng (BR-M01-012; FR-M01-005; SC-M01-010)
- [ ] T073 [P] [US6] Viết test src/modules/m01/offline-package/buildCandidate.test.ts cho bảy kiểm tra của offline-package-contract §4: snapshot active của tuyến `HOAT_DONG`; manifest đủ checkpoint; đúng một resource mỗi QR `OFFLINE_REQUIRED`, không có cho `ONLINE_AVAILABLE`; mọi ảnh khai báo đọc được (thiếu một ảnh QR hoặc ảnh sơ đồ → hỏng; không khai báo ảnh nào → hợp lệ); essentials đủ; cùng `(routeId, contentVersion)`; mỗi `sourceRef` chỉ tải một lần; tối đa `PACKAGE_IMAGE_CONCURRENCY` request song song; ảnh bìa/gallery không vào gói (FR-M01-007, 008; BR-M01-004, 005, 013; SC-M01-003, 007; DAC-M01-010, 014, 015)
- [ ] T074 [P] [US6] Viết test src/modules/m01/storage/packageWriter.test.ts (fake-indexeddb): bắt đầu ghi candidate `DANG_TAI` với `operationToken`; staging chỉ khi token khớp; kích hoạt là **một** transaction (gói `SAN_SANG` + `CURRENT` + `downloadedAt`, resources, byte, con trỏ, xóa bản cũ, xóa candidate); `QuotaExceededError` lúc kích hoạt → rollback, gói cũ nguyên vẹn; lỗi lần đầu → `CHUA_HOAN_TAT`, không có dòng `offlinePackages`; candidate `CHUA_HOAN_TAT` không bao giờ thành active; trong lúc tải `readActiveOfflinePackage` không trả dữ liệu candidate; xóa gói xóa gói/resources/byte/candidate/con trỏ nhưng giữ context và store M02 (BR-M01-005, 006; FR-M01-008, 009, 013; SC-M01-003, 004; DAC-M01-009, 012, 013; constitution "Offline tests MUST…")
- [ ] T075 [P] [US6] Viết test src/modules/m01/offline-package/packageOps.test.ts: lock `cpq:m01:package:{routeId}` `ifAvailable` → bấm Tải hai lần, hai tab, Tải và Xóa đồng thời → một thao tác; `registerPackageOperation()` được giữ trong suốt thao tác; `navigator.storage.persist()` được gọi trước lần tải đầu (không bắt buộc thành công); candidate `DANG_TAI` mồ côi (lock trống) khi mở app → xử lý như lỗi (FR-M01-009; research R-08, R-09)
- [ ] T076 [P] [US6] Viết test src/modules/m01/offline-package/lazyUpdate.test.ts: đọc nguồn thành công có `activeContentVersion` lớn hơn version gói → `OUTDATED`; mở chi tiết online tuyến có gói, `HOAT_DONG`, version mới → dựng candidate khi gói cũ vẫn active; tuyến không `HOAT_DONG` → không dựng; essentials được thay sau mỗi lần đọc thành công chỉ khi gói active vẫn là gói đó; đọc lỗi → giữ essentials và `capturedAt` cũ; đổi ngôn ngữ trong lúc tải không ảnh hưởng candidate (BR-M01-006, 014; FR-M01-010, 014; SC-M01-004)
- [ ] T077 [P] [US6] Viết test src/modules/m01/route-detail/OfflineDecisionDialog.test.tsx: nêu tên các checkpoint `OFFLINE_REQUIRED` theo ngôn ngữ du khách; dung lượng ước tính hoặc "Chưa có thông tin dung lượng."; nút Tải luôn bật kể cả khi thiếu ước tính; một dòng hướng dẫn quét bằng nút Quét trong app; ba nút Tải / Tiếp tục không tải / Quay lại; không chọn ngầm; "Tiếp tục không tải" vẫn theo điều kiện Start (BR-M01-007, 016; FR-M01-006; SC-M01-009; DAC-M01-016)
- [ ] T078 [P] [US6] Viết test src/modules/m01/offline-package/OfflinePage.test.tsx: danh sách gói có tuyến, version, trạng thái (không chỉ bằng màu), thời điểm lưu essentials, có sơ đồ offline hay không, dòng hướng dẫn quét; gói không đọc được → "Gói tải trước không đọc được" với Tải lại / Xóa; Xóa cần xác nhận; không có nút Cancel khi đang tải (FR-M01-009; OQ-SCR-M01-004-003)
- [ ] T079 [P] [US6] Viết E2E e2e/m01/offline-package.spec.ts cho quickstart V9–V16 (giả lập hết quota qua `window.__cpqTestHooks.m01.failNextActivation`)

### Implementation for User Story 6

- [ ] T080 [P] [US6] Cài đặt src/modules/m01/offline-package/needsPackage.ts cho T072 qua
- [ ] T081 [US6] Cài đặt src/modules/m01/offline-package/buildCandidate.ts (đọc snapshot, tải byte qua mediaClient theo lô, dựng manifest/resources/`offlineRouteMap`/`routeEssentials`, kiểm tra trong bộ nhớ) cho T073 qua (research R-08 bước 2–3)
- [ ] T082 [US6] Cài đặt src/modules/m01/storage/packageWriter.ts: `beginCandidate`, `stageCandidate`, `activateCandidate`, `failCandidate`, `deletePackage`, `markOutdated`, `refreshEssentials` cho T074 qua (research R-08 bước 1, 4–6; R-10)
- [ ] T083 [US6] Cài đặt src/modules/m01/offline-package/packageOps.ts (`downloadPackage`, `updatePackage`, `removePackage`: lock theo tuyến, `registerPackageOperation`, `navigator.storage.persist()`) và src/modules/m01/offline-package/recoverOrphans.ts (chạy khi shell khởi động); gọi recoverOrphans từ src/app/App.tsx cho T075 qua
- [ ] T084 [US6] Cài đặt src/modules/m01/offline-package/lazyUpdate.ts và đăng ký vào src/modules/m01/api/onSourceRead.ts (`OUTDATED`, làm mới essentials); kích hoạt dựng candidate khi mở chi tiết online cho T076 qua
- [ ] T085 [P] [US6] Dựng src/modules/m01/route-detail/OfflineDecisionDialog.tsx + `.module.css` cho T077 qua
- [ ] T086 [US6] Cài hook `requestOfflineDecision` trong src/modules/m01/route-detail/RouteDetailPage.tsx: mở OfflineDecisionDialog khi tuyến cần gói mà chưa có gói `SAN_SANG` — trước khi mở, đọc snapshot active (`fetchActiveSnapshot`) vì tên checkpoint `OFFLINE_REQUIRED` và `estimatedOfflineSizeBytes` chỉ có trong `JourneySnapshot`, không có trong Published Route; nguồn không khả dụng thì không mở dialog mà áp điều kiện Start offline (chooseStartPath); thêm vùng trạng thái gói (`DANG_TAI`, `SAN_SANG` `CURRENT`/`OUTDATED`, `CHUA_HOAN_TAT`, lỗi lưu trữ) và nút Tải / Tải lại / Cập nhật; khi gói `SAN_SANG` hiện dòng hướng dẫn quét bằng nút Quét trong app (US-M01-03 mục 5)
- [ ] T087 [US6] Dựng SCR-M01-004 src/modules/m01/offline-package/OfflinePage.tsx + `.module.css` cho T078 qua và đăng ký `/offline` trong src/modules/m01/routes.tsx

**Checkpoint**: US1–US6 chạy độc lập; M02 đọc được gói `SAN_SANG` thật qua index.ts

---

## Phase 9: User Story 7 - Recommend routes — US-M01-02 phần gợi ý (Priority: P2)

**Goal**: Chọn một giá trị mỗi nhóm trong ba nhóm tag; trả mọi tuyến khớp cả ba (exact-match), `0..N` kết quả, không nới tiêu chí (FR-M01-004; BR-M01-002, 003)

**Independent Test**: Quickstart V23

### Tests for User Story 7 ⚠️

- [ ] T088 [P] [US7] Viết test src/modules/m01/recommendation/recommend.test.ts: mọi kết quả chứa cả `timeTags ∋ t`, `groupTags ∋ g`, `experienceTags ∋ e`; thiếu hoặc sai enum ở bất kỳ nhóm nào → không chạy so khớp; 0 kết quả hợp lệ, không nới; chỉ trên tuyến chọn được; sắp A→Z (FR-M01-004; BR-M01-002, 003; SC-M01-002; DAC-M01-018)
- [ ] T089 [P] [US7] Viết test src/modules/m01/recommendation/RecommendPage.test.tsx: mỗi nhóm là một radio group dùng được bằng bàn phím; trạng thái thiếu tiêu chí, 0 kết quả, có kết quả; `RecommendationContext` không được lưu (OQ-SCR-M01-002-002; HC-007)
- [ ] T090 [P] [US7] Viết E2E e2e/m01/recommend.spec.ts cho quickstart V23

### Implementation for User Story 7

- [ ] T091 [P] [US7] Cài đặt src/modules/m01/recommendation/recommend.ts cho T088 qua
- [ ] T092 [US7] Dựng SCR-M01-002 src/modules/m01/recommendation/RecommendPage.tsx + `.module.css`, đăng ký `/recommend` trong src/modules/m01/routes.tsx và thêm liên kết từ src/modules/m01/catalog/CatalogPage.tsx

**Checkpoint**: Mọi user story M01 chạy độc lập trên network mock

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: PWA, kiểm chứng xuyên story, bằng chứng

- [ ] T093 Dựng src/app/pwa/UpdatePrompt.tsx (lời nhắc cập nhật gọi updateCoordinator, gắn vào src/app/App.tsx), **chỉ hiện trên route du khách** (M01, M02): màn `/admin/*` chỉ được hiện thông báo của danh mục §5.6 (BR-M03-L13) nên không có lời nhắc — bản mới áp cho admin khi mọi tab đã đóng (vòng đời service worker chuẩn, không tự reload). Câu chữ lấy từ bảng copy cố định của screen spec SCR-M01-001 (dòng "Lời nhắc cập nhật ứng dụng", "Cập nhật", "Để sau" — quyết định người dùng 2026-10-30) qua src/modules/m01/i18n/; "Cập nhật" gọi coordinator áp bản mới (vẫn hoãn khi còn việc bận), "Để sau" đóng lời nhắc và giữ bản đang chờ
- [ ] T094 [P] Viết E2E e2e/m01/pwa-offline.spec.ts cho quickstart V24: offline sau khi đã mở app, tải lại `/`, `/routes/A`, `/q/{id}` từ app shell; đổi VI/EN được; không request `/rest/v1` hay `/storage/v1` nào được trả từ Cache Storage (constitution VI; spec-M01 §9.3)
- [ ] T095 [P] Viết E2E e2e/m01/pwa-update.spec.ts cho quickstart V25: có bản build mới khi tab khác đang tải gói → lời nhắc hiện nhưng chỉ áp dụng sau khi tải xong
- [ ] T096 [P] Viết E2E e2e/m01/no-raw-codes.spec.ts: duyệt mọi màn M01 ở vi/en, quét DOM không có mã enum (`HOAT_DONG`, `SAN_SANG`, `OFFLINE_REQUIRED`…), ID hay tên trường (visitor-ui-flow §4)
- [ ] T097 Rà soát WCAG 2.1 AA trên mọi màn src/modules/m01/** theo design-system §6 và research R-19 (vùng chạm ~44×44 px, tương phản 4.5:1, focus nhìn thấy, trạng thái gói không chỉ bằng màu); sửa chỗ thiếu; không tuyên bố đạt chuẩn khi chưa đo
- [ ] T098 Tạo specs/001-m01-route-planning-preparation/checklists/br-test-coverage.md: bảng BR-M01-001…016, SC-M01-001…010 và DAC-M01-001…018 → file test; mục nào thiếu test thì thêm test vào story tương ứng trước khi đóng phase (constitution "Testing & Validation")
- [ ] T099 Chạy `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run e2e -- --project=m01`; ghi lệnh, mã thoát, số test vào specs/001-m01-route-planning-preparation/validation-report.md; phần không chạy được ghi `NOT RUN` kèm lý do (AGENTS.md §6)
- [ ] T100 Lập checklist kiểm thủ công trên Android Chrome và iOS Safari thật (offline, eviction IndexedDB, quota, đổi ngôn ngữ offline, mở `/q/…` offline sau khi đã mở app) trong specs/001-m01-route-planning-preparation/validation-report.md; đánh dấu `NOT RUN` cho tới khi chủ dự án chạy (research R-16)
- [ ] T101 Chạy `git diff --check`; ghi artifact upstream có nguy cơ stale phát hiện lúc code vào specs/001-m01-route-planning-preparation/validation-report.md, không tự sửa spec (AGENTS.md §4)

---

## Phase 11: Tích hợp package khác

**Purpose**: Bàn giao cho M02 và thay network mock bằng nguồn thật

### Với package 002 (M02)

- [ ] T102 Xác nhận bề mặt src/modules/m01/index.ts khớp đúng danh sách mà src/modules/m02/m01Port.ts cần (specs/002-m02-field-quest-experience/tasks.md T016) và `registerBusyCheck` có trong src/app/pwa/updateCoordinator.ts; ghi kết quả vào specs/001-m01-route-planning-preparation/validation-report.md để package 002 chạy T102–T103 của nó

### Với M03 giai đoạn B (chờ M03 Phase 13–15 cài đặt xong; CHG-M03-2026-10-30-01 đã duyệt)

- [ ] T103 Chờ M03 giai đoạn B có view `api.published_routes`, `api.active_journey_snapshots` và policy đọc Storage trên stack local (specs/003-m03-operations-content-administration/tasks.md T184, T172) và fixture local-stack của M03 T198 (e2e/.local-fixture.json); không làm T104–T106 trước đó
- [ ] T104 Chạy lại T012, T014 với response thật từ view của M03 (T184); view lệch danh sách cột trong src/shared/contracts/publicationRowMapping.ts thì sửa view phía M03, không sửa mapping (mapping theo Physical §3)
- [ ] T105 Chạy `PW_LOCAL_STACK=1 npm run e2e -- --project=m01-local-stack` cho quickstart V4, V10, V17, V22 trên stack Supabase local, dùng `routeId` thật từ e2e/.local-fixture.json (M03 T198) (`supabase start`, `supabase db reset` chỉ local); ghi kết quả hoặc `NOT RUN` vào specs/001-m01-route-planning-preparation/validation-report.md
- [ ] T106 Điền cột "tích hợp thật" trong specs/001-m01-route-planning-preparation/checklists/br-test-coverage.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T002 dùng chung tooling với package 003 (cái nào chạy trước thì tạo)
- **Foundational (Phase 2)**: sau Setup — CHẶN mọi user story của M01 và cũng là tiền đề của M02 (`visitorDb`, `paths.ts`, `updateCoordinator`, hàm đọc)
- **User Stories (Phase 3–9)**: sau Foundational; chạy trên adapter giả và network mock
- **Polish (Phase 10)**: sau các story muốn giao
- **Tích hợp (Phase 11)**: T102 sau US1, US4, US6; T103–T106 ⛔ chờ M03 giai đoạn B

### User Story Dependencies

- **US1 (P1)**: sau Foundational; không phụ thuộc story khác
- **US2 (P1)**: sau Foundational; dùng ngôn ngữ của US1 để sắp A→Z và hiển thị
- **US3 (P1)**: mở từ thẻ của US2; nhánh offline đọc gói đã nạp bằng fixture (không cần US6)
- **US4 (P1)**: cần trang chi tiết của US3 (T055); đường offline đọc gói bằng fixture; dialog quyết định offline do US6 cài vào hook (T065 → T086)
- **US5 (P1)**: cần registry `onSourceRead` (T029) và context của US4 (T063)
- **US6 (P1)**: cần trang chi tiết (T055) và Start (T064); không cần US5
- **US7 (P2)**: cần `selectableRoutes` của US2 (T047)

### Within Each User Story

- Test viết trước và FAIL trước khi cài đặt
- Storage/hàm thuần → orchestration → màn hình → đăng ký route
- Story xong và qua checkpoint trước khi sang story kế

### Parallel Opportunities

- Setup: T004–T006 song song
- Foundational: T011–T012, T015–T020, T021–T024, T027, T028, T030–T031 song song theo nhóm
- Trong mỗi story: mọi task test có [P] song song; hàm thuần và component khác file có [P] song song
- US5 và US6 có thể làm song song sau US4; US7 song song với US3–US6 sau US2

---

## Parallel Example: User Story 4

```bash
# Viết test của US4 cùng lúc:
Task: "T056 start/buildContext.test.ts"
Task: "T057 start/chooseStartPath.test.ts"
Task: "T058 storage/contextWriter.test.ts"
Task: "T059 start/startRoute.test.ts"

# Cài đặt song song ba file độc lập, rồi ghép ở T064:
Task: "T061 start/buildContext.ts"
Task: "T062 start/chooseStartPath.ts"
Task: "T063 storage/contextWriter.ts"
```

## Parallel Example: User Story 6

```bash
Task: "T072 needsPackage.test.ts"
Task: "T073 buildCandidate.test.ts"
Task: "T074 storage/packageWriter.test.ts"
Task: "T077 OfflineDecisionDialog.test.tsx"
Task: "T078 OfflinePage.test.tsx"
```

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 Foundational (cũng mở đường cho M02)
2. US1 → **DỪNG và KIỂM CHỨNG** V1–V3
3. Đường đi tối thiểu có giá trị: **US1 + US2 + US3 + US4** (chọn ngôn ngữ → duyệt → xem chi tiết → Start sang M02). US6 cần cho tuyến có điểm dừng `OFFLINE_REQUIRED` (quyết định 2026-10-29: Must)

### Incremental Delivery

1. US1 → US2 → US3 → US4 → US5 → US6 → US7, mỗi story qua checkpoint của nó trên network mock
2. Phase 10 → bằng chứng tự động và checklist thủ công
3. T102 → bàn giao cho M02; khi M03 giai đoạn B mở: T103–T106

### Parallel Team Strategy

1. Cả nhóm làm Setup + Foundational
2. Dev A: US1 → US4 → US5; Dev B: US2 → US3 → US7; Dev C: US6 (sau T055, T064)
3. Phase 10 chia theo file E2E

---

## Notes

- [P] = khác file, không phụ thuộc
- [Story] gắn task với user story để truy vết (spec.md Traceability)
- M01 không ghi dữ liệu M03 hay store M02; không lộ candidate/staging cho M02 (FR-M01-013)
- Không thêm store danh mục; local view chỉ trong bộ nhớ (research R-13)
- Kích hoạt cloud và phát hành (vercel.json rewrite cho deep link, cấu hình Supabase cloud, smoke check, release gate) nằm ở Phase 16 của tasks M03, cần change brief triển khai
- Không commit, push, cài dependency ngoài T003 (và Phase 1 của tasks M03 nếu cần), hay gọi dịch vụ cloud nếu người dùng chưa yêu cầu (AGENTS.md §6); không dùng dữ liệu thật
- CI: workflow .github/workflows/ci.yml do tasks M03 T002 tạo (người dùng duyệt 2026-10-30) chạy `npm run ci` và E2E project mock của M01, M02, M03 trên mỗi push/PR (plan.md Complexity #3)
