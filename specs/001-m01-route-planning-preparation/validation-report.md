# Validation report — 001 M01 Route Planning & Preparation

Báo cáo kiểm chứng của giai đoạn triển khai code (runbook §13.4). Chỉ ghi lệnh đã chạy thật; phần chưa chạy ghi `NOT RUN`. Evidence lịch sử của bộ tài liệu không được dùng làm PASS cho code (runbook §10.1).

Lệch so với tasks đánh số `DV-nn` để không trùng các quyết định `D-01`, `D-02` của [research.md](research.md) §5.

## 1. Đợt 2026-11-02 — Phase 1 Setup (T002–T007)

### 1.1 Baseline

| Mục | Giá trị |
|---|---|
| Starting commit | `main` @ `5d8ef189cb2f1cbc3b106e0e7c0ed22e29b4d4b6` (trùng `origin/main` sau `git pull`), worktree sạch |
| Branch làm việc | `feat/m01-setup` tạo từ `main` |
| Môi trường | Node.js v24.16.0, npm 11.13.0 |
| Tooling có sẵn từ M03 | `package.json`, `tsconfig*.json`, `vite.config.ts` (PWA khung), `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.env.fake`, `.github/workflows/ci.yml`; shell và nền dùng chung của tasks M03 T011–T019 (`src/app/`, `src/shared/config`, `src/shared/supabase`, `src/shared/ui`, `src/shared/testing/e2eHooks.ts`). T002 chỉ rà soát, không tạo lại |

### 1.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm install --save-exact dexie@4.4.7` | 0 | Phiên bản ghi ở research.md R-02 |
| `npm install --save-exact -D fake-indexeddb@6.2.7` | 0 | Chỉ dev dependency (plan.md Complexity #4) |
| `npm ls --depth=0 dexie fake-indexeddb` | 0 | `dexie@4.4.7`, `fake-indexeddb@6.2.7` |
| `npm audit` | — | 10 lỗi (2 low, 8 moderate), tất cả trong chuỗi `vite-plugin-pwa` → `workbox-build` (chỉ lúc build); không lỗi nào từ `dexie` hay `fake-indexeddb`; không áp `audit fix --force` |
| `npx vitest run src/test/tmpIsolation.test.ts` (test tạm, đã xóa) | 0 | 2/2 pass: Dexie khai báo ở cấp module thấy database trống ở ca thứ hai và vẫn ghi được sau khi `setup.ts` xóa database (DV-04) |
| `npx vite build` | 0 | Precache 30 mục (1234.35 KiB), trước thay đổi 40 mục; chunk màn của M03 mang tên `m03-*`, thư viện in QR `qrcode-*`, không có trong `dist/sw.js` (DV-02) |
| `npm run ci` (`typecheck` → `lint` → `test` → `build`) | 0 | typecheck sạch; lint 353 pass; test 68 file pass + 1 skipped, 1131 pass, 133 skipped (ca stack local của M03); build PWA `generateSW`, precache 30 mục |
| `npm run e2e` | 0 | 26 pass, 46 skipped (`intake.local`, `lookup.local`, `perf.local` của M03, chỉ chạy với `PW_LOCAL_STACK=1`). Server `preview:e2e` build và chạy ở cổng 4173; project `m01` chưa có spec (spec bắt đầu từ US1) |
| Quét `dist/` production tìm `__cpqTestHooks` | — | Không có |
| Quét `dist-e2e/` tìm `__cpqTestHooks` | — | Có chunk `e2eHooks-*.js` (đúng: build MODE `e2e`) |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 1.3 `NOT RUN`

| Mục | Lý do |
|---|---|
| Service worker cài và trả app shell khi offline trong trình duyệt | Chưa có spec E2E (`e2e/m01/pwa-offline.spec.ts`, T094 ở Phase 10) |
| Project `m01-local-stack` | Chưa có spec; tích hợp stack local ở Phase 11 (T103–T106) |
| Job CI trên GitHub | Chưa push |

### 1.4 Lệch so với tasks và quyết định

Mười hai đề xuất DV-01…DV-12 được người dùng duyệt 2026-11-02 trước khi code. DV-01…DV-05 áp ở Phase 1; DV-06…DV-12 áp ở Phase 2.

| # | Mục | Trạng thái |
|---|---|---|
| DV-01 | T005: `preview:e2e` build vào `dist-e2e/` (`vite build --mode e2e --outDir dist-e2e && vite preview --outDir dist-e2e --port 4173 --strictPort`), không ghi đè `dist/`, để phép quét bundle production không lẫn test hook. Thêm `dist-e2e/` vào `.gitignore`. Playwright khởi động mọi `webServer`, nên chạy riêng project `m03` cũng build thêm một lần | Áp dụng |
| DV-02 | T007: tên chunk lấy theo thư mục nguồn bằng `chunkFileNames`/`assetFileNames` (`m01-<thư mục>`, `m03-<thư mục>`; chunk màn lazy theo `facadeModuleId`), `globIgnores` loại `assets/m03-*` và `assets/qrcode-*`. Hệ quả: chunk M01 sẽ mang tên `m01-recommendation`, `m01-offline-package` (không phải `m01-recommend`, `m01-offline` như T007). Chunk dùng chung không có facade và lẫn module (`OperationLauncher`, `VisitorPreview`, `MissingToPublishPanel`, `Field`…) vẫn được precache dù hiện chỉ M03 dùng | Áp dụng |
| DV-03 | T007: manifest `icons: []`; favicon `assets/icons/icon.png` qua `<link rel="icon">` trong `index.html`. Không có icon manifest nên Chrome không coi app là installable (spec-M01 §9.2 không khuyến khích cài) | Áp dụng |
| DV-04 | T004: ngoài `import 'fake-indexeddb/auto'`, `afterEach` trong `src/test/setup.ts` xóa mọi database IndexedDB giả để dữ liệu không rò giữa các ca. Không thay `globalThis.indexedDB` vì Dexie giữ factory lúc tạo instance | Áp dụng |
| DV-05 | T003: phiên bản pin `dexie` 4.4.7, `fake-indexeddb` 6.2.7; ghi vào research.md R-02 theo yêu cầu của T003 | Áp dụng |
| DV-06 | T009: `registerBusyCheck` nhận `() => boolean \| Promise<boolean>` (research R-14 ghi `Promise<boolean>`; M02 `hasRunningSession()` đọc Dexie); hàm ném lỗi hoặc reject → bận. `registerPackageOperation()` trả hàm nhả lock; không có Web Locks thì đếm trong tab | Phase 2 |
| DV-07 | T018–T020: ba schema M01 không thêm vào barrel `src/shared/contracts/index.ts` (trùng tên `OfflineResource` với `journeySnapshot.ts`); import trực tiếp từ file; giữ nguyên cả hai tên theo spec | Phase 2 |
| DV-08 | T014: danh sách cột lấy từ migration `supabase/migrations/20261101170012_m03_04b_public_views.sql` (view đã có). Không refactor `camelKeys` trong test M03. T104 "view lệch thì sửa view phía M03" xung đột với quy tắc M01 không sửa `supabase/`: nếu lệch thì dừng và hỏi | Phase 2 |
| DV-09 | T029: M01 giữ một Supabase client singleton lười trong `src/modules/m01/api/`, nhận client qua tham số cho test; không sửa `src/shared/supabase/client.ts` | Phase 2 |
| DV-10 | T031: `src/app/App.tsx` nạp `modules/m01/testing/e2eHooks` bằng `import()` động trong nhánh MODE `e2e`/`fake`; `fakeSource.ts` chỉ cho Vitest, không nối vào `dev:fake` | Phase 2 |
| DV-11 | Số hiệu lệch trong báo cáo này dùng `DV-nn` | Áp dụng |
| DV-12 | Mỗi phase một branch từ `main` và một PR vào `main`; Phase 2 (`feat/m01-foundation`) bắt đầu sau khi PR Phase 1 merge | Áp dụng |

### 1.5 Checkpoint Phase 1

Phase 1 **đạt**: T001–T007 xong, bằng chứng ở §1.2. Còn mở: các mục `NOT RUN` ở §1.3.

## 2. Đợt 2026-11-02 — Phase 2 Foundational (T008–T033)

Branch `feat/m01-foundation`, làm tiếp từ `feat/m01-setup` @ `e20ae44` trong lúc PR #12 (Phase 1) chờ merge; rebase lên `main` sau khi #12 merge rồi mới mở PR vào `main` (DV-12, không xếp chồng PR).

Test viết trước và đã chạy thấy fail (không resolve được module, hoặc ca mới fail) trước khi cài đặt ở mỗi nhóm: T009, T010, T014, T015–T017, T022, T023, T025, T027, T028, T030, T031, T032. Ngoại lệ: T012 qua ngay vì hai schema producer đã có từ M03 (T013); T021 viết test và hằng cùng lúc, không chạy test trước.

### 2.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` (`typecheck` → `lint` → `test` → `build`) | 0 | typecheck sạch; lint 414 pass; test 84 file pass + 1 skipped, 1388 pass, 133 skipped (ca stack local của M03); build precache 36 mục, gồm `m01-catalog`, `m01-layout`, `m01-recommendation`, `m01-route-detail`, `m01-offline-package`; không có chunk `m03-*` nào trong `dist/sw.js` |
| `npm run e2e` | 0 | 26 pass, 46 skipped (spec `*.local` của M03); project `m01` chưa có spec |
| `npx playwright test --project=m01` với spec smoke tạm `e2e/m01/tmp-smoke.spec.ts` (đã xóa sau khi chạy) | 0 | 1 pass trên bản build MODE e2e: `/` hiện "Danh mục tuyến", liên kết "Tài nguyên offline" mở `/offline`; service worker đã đăng ký; hook `m01.seedPackage`/`seedContext` ghi vào IndexedDB thật: `offlinePackages` 1, `offlineResources` 3, `imageBytes` 5 (4 ảnh QR + sơ đồ offline), `activePackages` 1, `selectedRouteContext` 1 |
| Quét `dist/` production tìm `__cpqTestHooks`, `seedPackage`, `failNextActivation`, `registerM01TestHooks`, `fake://quest-media`, `example.test` | — | Không có |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

### 2.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| `sourceClient`/`mediaClient` gọi view `api.*` và Storage thật | Phase 11 (T103–T105) trên stack Supabase local |
| E2E M01 (V1–V26) | Spec bắt đầu từ US1 (T038) |
| Job CI trên GitHub | Chưa push |

### 2.3 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-06 | T009: `registerBusyCheck(fn: () => boolean \| Promise<boolean>)`; `applyUpdate` chờ mọi hàm, hàm ném lỗi hoặc reject → bận. `registerPackageOperation()` giữ lock shared `cpq:busy`, trả hàm nhả (gọi lại không tác dụng); không có Web Locks thì đếm trong tab. `registerUnsavedForm` giữ nguyên hành vi (D-02) | Áp dụng |
| DV-07 | T018–T020: ba schema M01 không vào barrel `contracts/index.ts`; import trực tiếp từ file | Áp dụng |
| DV-08 | T014: cột lấy từ migration `04b` và khớp: 25 cột `published_routes`, 8 cột `active_journey_snapshots`. Cột Required null hoặc cột lạ ngoài danh sách được để nguyên nên schema strict từ chối dòng (báo view lệch thay vì lặng lẽ bỏ qua). Không sửa `supabase/` | Áp dụng |
| DV-09 | T029: client du khách singleton lười `src/modules/m01/api/visitorSupabase.ts` qua factory dùng chung; adapter nhận Data API/Storage qua tham số cho test | Áp dụng |
| DV-10 | T031: `src/app/App.tsx` nạp `modules/m01/testing/e2eHooks` bằng `import()` động trong nhánh MODE `e2e`/`fake`; hook gồm `seedContext`, `seedPackage`, `failNextActivation`. Byte ảnh do hook sinh trong trình duyệt (PNG 1×1 synthetic) vì Playwright chỉ truyền JSON. `fakeSource.ts` chỉ dùng cho Vitest | Áp dụng |
| DV-13 | T022: bảng copy screen spec chỉ có câu cho các tình huống. Tên màn và nhãn điều hướng chỉ có tiếng Việt (screen-list-M01: "Danh mục tuyến", "Gợi ý tuyến", "Chi tiết tuyến & Chuẩn bị", "Quản lý tài nguyên offline"; mockup SCR-M01-003: "Ngôn ngữ"; element E-SCR-M01-001-16: "Tài nguyên offline"). Tiếng Anh do agent đề xuất: "Routes", "Route suggestions", "Route details & preparation", "Offline downloads", "Language". Nằm riêng trong nhóm `nav`, `screenTitle`, `language.groupLabel` của `src/modules/m01/i18n/` | Chủ dự án duyệt 2026-11-02 |
| DV-14 | `fake-indexeddb` trong jsdom không clone được `Blob` của jsdom (đọc lại thành object rỗng; đã thử). Test M01 tạo byte bằng `Blob` của `node:buffer` (clone đúng). Code thật không dùng `instanceof Blob`, chỉ kiểm `size`/`type` | Áp dụng |
| DV-15 | T030: signed URL thời hạn 3600 giây, cùng giá trị xem trước của M03 (research M03 R-12); hằng kỹ thuật trong `mediaClient.ts`. Tải byte dùng `cache: 'no-store'` để không đi qua cache HTTP. Thời hạn 60 s tính cho cả request lẫn đọc body | Áp dụng |
| DV-16 | Thêm `src/shared/contracts/journeyManifest.ts` (tasks không nêu): manifest dùng chung của `SelectedRouteContext v3.routeJourneyManifest` và `OfflinePackage.manifest` (spec-M01 §5.3 nói hai manifest là cùng một bản chiếu). `sequence`, `contentVersion` của manifest chỉ kiểm Integer, không kiểm > 0 (contract chỉ ghi Integer) | Áp dụng |
| DV-17 | T025, T031: thêm file ngoài danh sách task: `storage/tables.ts` (bảng có kiểu, chỉ `storage/` dùng), `storage/testSeed.ts` và `storage/faultInjection.ts` (nạp dữ liệu và tiêm lỗi cho hook E2E/test; nằm trong `storage/` vì chỉ thư mục này được ghi store M01), `testing/packageFixture.ts`, `testing/pngBytes.ts`. `visitorDb.ts` chỉ khai báo store; mỗi module lấy bảng có kiểu bằng `visitorDb.table<Row, Key>()` để `src/shared` không import ngược từ `src/modules` | Áp dụng |
| DV-18 | T029: `fetchCatalog` bỏ dòng không qua schema và vẫn là nguồn khả dụng; `fetchRoute`/`fetchActiveSnapshot`: không có dòng → `OK` với `null`, dòng không qua schema → `UNAVAILABLE`. Adapter chọn đúng danh sách cột (không `*`). Hiệu ứng `onSourceRead` chạy sau mỗi lần đọc tuyến thành công (danh mục và một tuyến; không chạy cho snapshot) và được chờ xong trước khi trả kết quả; lỗi của hiệu ứng không làm hỏng lần đọc | Áp dụng |
| DV-19 | T032–T033: bốn trang là placeholder chỉ có tiêu đề; ngôn ngữ tạm cố định `vi` qua `useM01Messages()` cho tới US1 (T040–T042). Layout có vùng thông báo `role="status"` mà màn đặt nội dung vào qua `SourceNotice` (portal). Chưa có `errorElement` cho route M01 (màn thật thêm ở story tương ứng). Không có skip link vì chưa có câu chữ nguồn | Áp dụng |

### 2.4 Checkpoint Phase 2

"Nền sẵn sàng" **đạt**: T008–T033 xong, bằng chứng ở §2.1. M02 đã có `visitorDb`, `paths.ts`, `updateCoordinator` (`registerBusyCheck`, `registerPackageOperation`) và hàm đọc qua `src/modules/m01/index.ts`. Còn mở: các mục `NOT RUN` ở §2.2.

## 3. Đợt 2026-11-02 — Phase 3 US1 Chọn ngôn ngữ (T034–T042)

Branch `feat/m01-us1`, tách từ `feat/m01-foundation` (PR #13 có CI xanh, chờ chủ dự án merge; agent không được merge, xem DV-20). Test T034–T037 viết trước và đã chạy thấy fail (không resolve được module) trước khi cài đặt.

### 3.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch (gồm `e2e/`); lint 429 pass; test 88 file pass + 1 skipped, 1430 pass, 133 skipped; build precache 35 mục |
| `npm run e2e` | 0 | 28 pass, 47 skipped: `m01` V1, V3 pass, V2 `fixme`; còn lại là spec `*.local` của M03 |
| `npx playwright test --project=m01` (chạy lại sau khi sửa kiểu trong `e2e/m01/helpers.ts`) | 0 | 2 pass, 1 skipped (V2) |
| Ảnh chụp 390×760 của panel chọn ngôn ngữ và thanh app (spec tạm, đã xóa; ảnh trong scratchpad của phiên, không commit) | 0 | Panel nền deep, tiêu đề serif, hai nút hổ phách 48px; thanh app: logo, "Tài nguyên offline", VI/EN với nút đang chọn nền hổ phách |
| Quét `dist/` production tìm `__cpqTestHooks`, `seedPackage`, `failNextActivation` | — | Không có |

### 3.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| V2 (`/q/{id}` lần đầu với `vi-VN` rồi `en-US`) | Trang `/q/{qrIdentifier}` thuộc M02 (SCR-M02-004) chưa có; `test.fixme` trong `e2e/m01/language.spec.ts`. Hành vi "không panel, hiển thị theo thiết bị, không ghi gì" đã kiểm ở `LanguageGate.test.tsx` và `LanguageControl.test.tsx` |
| Đổi ngôn ngữ giữa hai tab thật | Unit test kiểm `liveQuery` nhận thay đổi do nơi khác ghi vào cùng database; hai tab thật kiểm ở E2E Phase 10 hoặc thủ công |

### 3.3 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-20 | Agent không merge được PR (bộ kiểm tra an toàn chặn "merge không có review"); chủ dự án merge. Mỗi phase vẫn một branch, PR base `main` và ghi "merge sau #N"; branch kế tiếp tách từ branch trước khi PR trước chưa merge, rebase lên `main` khi có thể | Áp dụng |
| DV-21 | T040: thêm `useLanguagePreferenceState()` (trạng thái `loading`/`ready`) để LanguageGate không hiện panel thoáng qua khi IndexedDB chưa đọc xong; `useLanguagePreference()` công khai vẫn trả `LanguagePreference \| null` như contract. Một subscription `liveQuery` dùng chung cho mọi component | Áp dụng |
| DV-22 | T041: `LanguageControl` có prop `tone` (`onLight` mặc định cho trang M02, `onDark` trên thanh app M01): trên nền deep nút đang chọn nền hổ phách chữ ink (§5.3). Nhãn nút "VI"/"EN" như mockup; nút của panel là tên tự gọi "Tiếng Việt"/"English" lấy từ câu copy "Chọn ngôn ngữ (Tiếng Việt / English)". Tiêu đề panel theo ngôn ngữ thiết bị vì chưa có giá trị lưu | Áp dụng |
| DV-23 | T042: `VisitorLayout` đặt `document.documentElement.lang` theo ngôn ngữ hiển thị (trình đọc màn hình đọc đúng ngôn ngữ). `writeLanguagePreference` trả `false` thay vì ném lỗi khi giá trị ngoài `vi`/`en` | Áp dụng |

### 3.4 Checkpoint US1

US1 **đạt** trên network mock: V1, V3 pass; V2 chờ trang M02. M02 dùng được `LanguageControl`, `useLanguagePreference`, `resolveDisplayLanguage` qua `src/modules/m01/index.ts`.

## 4. Đợt 2026-11-02 — Phase 4 US2 Duyệt tuyến (T043–T050)

Branch `feat/m01-us2`, tách từ `feat/m01-us1` (PR #13, #14 chờ merge; DV-20). Test T043–T045 viết trước và đã chạy thấy fail (không resolve được module) trước khi cài đặt.

### 4.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` | 0 | typecheck sạch; lint 444 pass; test 91 file pass + 1 skipped, 1468 pass, 133 skipped; build precache 39 mục |
| `npx playwright test --project=m01` | 0 | 6 pass (V1, V3, V4, V5, V6, V7), 1 skipped (V2) |
| `npm run e2e` lần 1 | 1 | `m01` pass hết; `m03` 3 ca fail (Q18 không thấy nút "Đăng nhập" trong 5 s ở lần mở đầu `/admin/login` trên `dev:fake`, Q12…) |
| `npx playwright test --project=m03` chạy lại hai lần; `forbidden-words.spec.ts --repeat-each=3` | 0 / 0 | lần 1: 23 pass, 3 fail khác ca trước; lần 2 và repeat: không fail. Kết luận: chập chờn do máy tải nặng (10 worker + build preview), không do thay đổi của M01 (DV-29) |
| `npm run e2e` lần 2 | 0 | 32 pass, 47 skipped |
| Ảnh chụp 390 px danh mục (spec tạm, đã xóa) | 0 | Hero serif, liên kết "Gợi ý tuyến", hai thẻ dẫn bằng ảnh; ảnh A lỗi → khối placeholder trung tính |
| Quét `dist/` production tìm hook test, `fake://` | — | Không có |

### 4.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| V4 trên stack Supabase local | Phase 11 (T105) |
| Trạng thái "Route removed" | Thuộc US5 (T071); hiện tuyến `TAM_DONG` đã bị lọc khỏi danh mục sau lần đọc thành công |

### 4.3 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-24 | `vite.config.ts`: `workbox.clientsClaim: true`. Lý do: ở lần mở đầu, service worker đã cài nhưng chưa điều khiển trang, nên mất mạng ngay sau đó thì chunk lazy chưa nạp (ví dụ `/offline`) không lấy được dù đã precache (E2E V6 phát hiện). `skipWaiting` vẫn tắt: bản cập nhật chỉ áp khi người dùng đồng ý (prompt, constitution VI) | Áp dụng |
| DV-25 | `src/modules/m01/api/services.ts`: React context `M01Services` (`source`, `media`), mặc định adapter thật; test component bọc bằng adapter giả (`testing/renderM01.tsx`) | Áp dụng |
| DV-26 | Hook `media/useSignedUrls.ts` (signed URL chỉ trong bộ nhớ) dùng chung cho danh mục và sau này chi tiết tuyến | Áp dụng |
| DV-27 | T048: local view là một store cho mỗi adapter nguồn, sống suốt phiên chạy; mỗi lần màn danh mục được mở thì làm mới (screen spec §5 mục 6 "Mở/làm mới"); lần đọc trùng dùng chung một request. Trạng thái Loading hiện khối giữ chỗ thay cho spinner (design-system §5.2 "Progress/skeleton") và `aria-busy` trên danh sách | Áp dụng |
| DV-28 | T046: network mock `e2e/m01/network.ts` giả đúng hình dạng request/response của supabase-js (PostgREST mảng hoặc object theo `Accept`; `createSignedUrls` trả `signedURL` tương đối) | Áp dụng |
| DV-29 | E2E `m03` thỉnh thoảng hết thời gian chờ 5 s khi máy tải nặng; không đổi test M03 (ngoài phạm vi M01), ghi để theo dõi | Ghi nhận |

### 4.4 Checkpoint US2

US2 **đạt** trên network mock: V4–V7 pass.

## 5. Đợt 2026-11-02/03 — Phase 5 US3 Chi tiết tuyến (T051–T055)

Branch `feat/m01-us3`, tách từ `feat/m01-us2` (PR #13, #14, #15 chờ merge; DV-20). Test T051–T052 viết trước và đã chạy thấy fail trước khi cài đặt.

### 5.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` (lần đầu) | 1 | 1 ca M03 fail: `reports/ReportsPage.test.tsx` "ngày không hợp lệ…" (`reportRpt01` bị gọi). Chạy riêng 3 lần: fail 1 lần |
| Thử nghiệm: bỏ phần xóa IndexedDB trong `afterEach` của `src/test/setup.ts`, chạy `ReportsPage.test.tsx` 6 lần (đã khôi phục file sau đó) | 0 | 6/6 pass → nguyên nhân là `afterEach` bất đồng bộ của Phase 1 (DV-31) |
| Sau khi sửa DV-31: `ReportsPage.test.tsx` 6 lần; `npx vitest run src/modules/m01 src/shared` | 0 | 6/6 pass; 848 pass |
| `npm run ci` | 0 | typecheck sạch; lint 451 pass; test 93 file pass + 1 skipped, 1490 pass, 133 skipped; build precache 41 mục |
| `npm run e2e` | 0 | 34 pass, 47 skipped; `m01`: V1, V3–V8 và SC-M01-008 pass, V2 `fixme` |
| Ảnh chụp 390 px màn chi tiết A online (spec tạm, đã xóa) | 0 | Hero deep với tên serif và dấu "Cần tải trước"; gallery cuộn ngang; ba ô Quãng đường/Thời lượng/Độ khó; cảnh báo an toàn nền hổ phách; điểm dừng đánh số 1–3 |
| Quét `dist/` production tìm hook test, `fake://` | — | Không có |

### 5.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Nút "Bắt đầu", vùng trạng thái gói, dialog quyết định offline trên SCR-M01-003 | US4 (T065), US6 (T086) |

### 5.3 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-30 | Nhãn mục của SCR-M01-003 không có trong bảng copy. Tiếng Việt lấy từ mockup SCR-M01-003 ("Quãng đường", "Thời lượng", "Độ khó", "Cảnh báo an toàn", "Giới thiệu", "Điểm xuất phát", "Cần chuẩn bị", "Các điểm dừng") và tên trường M03 (`fieldLabels`: "Yêu cầu và điều kiện tham gia", "Thời điểm phù hợp", "Điểm nổi bật", "Sơ đồ tuyến"); tiếng Anh do agent đề xuất (Distance, Duration, Difficulty, Safety warning, About this route, Starting point, Requirements, What to bring, Best time to go, Highlights, Route map, Stops) theo ủy quyền của chủ dự án 2026-11-02 | Áp dụng, chủ dự án có thể sửa |
| DV-31 | `src/test/setup.ts`: chỉ xóa các database mà ca vừa mở (ghi tên đồng bộ khi `indexedDB.open` được gọi); ca không mở database nào kết thúc đồng bộ như trước Phase 1. Sửa lỗi chập chờn của test M03 do DV-04 gây ra | Áp dụng |
| DV-32 | T055: nguồn lỗi mà không có gói → hiện dòng tuyến trong local view danh mục kèm câu "Chưa tải được thông tin mới. Đang hiển thị thông tin đã lưu." (T051 "mở bằng thông tin hiện có, không khẳng định mới nhất"); không có cả local view → câu "Chưa tải được danh sách tuyến…" của bảng copy SCR-M01-001 (bảng copy SCR-M01-003 không có câu riêng cho trường hợp này). Tuyến không có dòng (chưa từng xuất bản) xử lý như tuyến không còn khả dụng | Áp dụng |
| DV-33 | T055: gallery là dải ảnh cuộn ngang (ảnh đầu là ảnh bìa); offline không có ảnh lưu nên hiện một khối trung tính. Sơ đồ offline của gói hiện từ byte đã lưu (`readPackageImage` → object URL). `formatDistanceKm` chuyển sang `format.ts` để danh mục và chi tiết dùng chung | Áp dụng |

### 5.4 Checkpoint US3

US3 **đạt** trên network mock: V8 và chi tiết A offline có gói (SC-M01-008) pass.

## 6. Đợt 2026-11-03 — Phase 6 US4 Bắt đầu tuyến (T056–T065)

Branch `feat/m01-us4`, tách từ `feat/m01-us3` (PR #13–#16 chờ merge; DV-20). Test T056–T059 và ca Start của `RouteDetailPage.test.tsx` viết trước và đã chạy thấy fail trước khi cài đặt.

### 6.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` (lần 1, 2) | 1 / 1 | lần 1: typecheck báo kiểu Web Lock giả trong `startRoute.test.ts`; lần 2: lint bắt "48px" trong comment `StartPanel.module.css`. Đã sửa cả hai |
| `npm run ci` | 0 | typecheck sạch; lint 465 pass; test 97 file pass + 1 skipped, 1535 pass, 133 skipped; build precache 41 mục |
| `npm run e2e` (trước hai sửa đổi trên, chỉ khác kiểu trong test và comment CSS) | 0 | 39 pass, 47 skipped; `m01`: V1, V3–V8, SC-M01-008, V17–V21 pass, V2 `fixme` |
| Quét `dist/` production tìm hook test (`failNextContextWrite`…), `fake://` | — | Không có |

### 6.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Màn M02 sau khi điều hướng `/trip` | Package 002 chưa có; E2E chỉ kiểm URL và context đã commit |
| Hai tab thật bấm Start cùng lúc | Unit test với Web Lock giả dùng chung; E2E kiểm double-click cùng tab |
| V17 trên stack Supabase local | Phase 11 (T105) |

### 6.3 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-34 | T062: "đọc lại một lần" đọc lại cả dòng tuyến lẫn snapshot (dòng tuyến có thể đã đổi version). Không có snapshot active → coi như nguồn không khả dụng và thử đường offline. Tuyến không có dòng → chặn như tuyến không còn khả dụng | Áp dụng |
| DV-35 | T064: ngoài Web Lock `cpq:m01:start` còn mutex trong tab (luôn bật), nên trình duyệt không có Web Locks vẫn bỏ qua lần bấm lặp trong cùng tab (research R-09). `createStartRoute` nhận nguồn, lock và đồng hồ qua tham số để test | Áp dụng |
| DV-36 | T058, T060: thêm tiêm lỗi `failNextContextWrite` (ném sau `put`, trong transaction) và hook E2E cùng tên cho V21 | Áp dụng |
| DV-37 | T065: nút "Bắt đầu" hiện ở mọi trạng thái trừ "tuyến không còn khả dụng"; đường đi do `chooseStartPath` quyết định. Gói `SAN_SANG + OUTDATED` → câu "Gói tải trước này đã cũ nhưng vẫn dùng được." trong vùng thông báo (V19 "cảnh báo cũ hiện"). Hook `requestOfflineDecision` mặc định đi thẳng Start (`offlineDecision.ts`); US6 thay bằng dialog. Hàm chiếu manifest chuyển sang `start/manifest.ts` (code thật dùng; helper test gọi lại) | Áp dụng |

### 6.4 Checkpoint US4

US4 **đạt** trên network mock: V17–V21 pass. M02 nhận được handoff v3 thật qua `readSelectedRouteContext()`.

## 7. Đợt 2026-11-03 — Phase 7 US5 Tuyến không còn khả dụng (T066–T071)

Branch `feat/m01-us5`, tách từ `feat/m01-us4` (PR #13–#17 chờ merge; DV-20). Test T066–T067 viết trước và đã chạy thấy fail (không resolve được module) trước khi cài đặt.

### 7.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` (lần 1) | 1 | typecheck: `e2e/m01/route-unavailable.spec.ts` destructure mảng có thể `undefined` (`noUncheckedIndexedAccess`); đã sửa |
| `npm run ci` | 0 | typecheck sạch; lint 470 pass; test 99 file pass + 1 skipped, 1551 pass, 133 skipped; build precache 41 mục |
| `npm run e2e` (trước sửa kiểu ở trên, logic test không đổi) | 0 | 40 pass, 47 skipped; `m01` thêm V22 pass |
| Quét `dist/` production tìm hook test, `fake://` | — | Không có |

### 7.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| V22 trên stack Supabase local | Phase 11 (T105) |

### 7.3 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-38 | T070: hiệu ứng đọc nguồn của M01 đăng ký một lần khi M01 được nạp (`routes.tsx` gọi `registerM01SourceEffects()` trong `api/sourceEffects.ts`, có đếm tham chiếu). US6 thêm `OUTDATED` và làm mới chữ cốt lõi vào cùng danh sách | Áp dụng |
| DV-39 | T071: "Route removed" của danh mục là việc tuyến biến mất sau lần làm mới thành công (lọc `HOAT_DONG`); không có câu copy riêng nên không thêm thông báo. Màn chi tiết đã có trạng thái "Tuyến này hiện không nhận chuyến mới." và không có nút "Bắt đầu" từ US3/US4 | Áp dụng |

### 7.4 Checkpoint US5

US5 **đạt** trên network mock: V22 pass (tuyến biến mất, Start bị chặn, context `REVOKED`, gói và store M02 không đổi).

## 8. Đợt 2026-11-03 — Phase 8 US6 Chuẩn bị gói offline (T072–T087)

Branch `feat/m01-us6`, tách từ `feat/m01-us5` (PR #13–#18 chờ merge; DV-20). Test T072–T078 và các ca gói của `RouteDetailPage.test.tsx` viết trước và đã chạy thấy fail trước khi cài đặt.

### 8.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run src/modules/m01` (trong lúc làm) | 0 | 260 pass sau khi sửa: Blob của jsdom từ `Response.blob()` không clone được (DV-44); test thu hồi của US5 so gói bằng đẳng thức tuyệt đối trong khi chữ cốt lõi nay được làm mới (DV-47); test bấm nhầm nút "Tải về" của vùng gói thay vì của dialog |
| `npx playwright test --project=m01` (lần đầu) | 1 | 4 ca fail, đều do test: V12 tải lại trang làm mất cờ tiêm lỗi trong bộ nhớ; V14 đếm cả lô ký URL của danh mục/gallery; V21 dùng tuyến A nay mở dialog quyết định offline; V22 bấm quay lại danh mục khi chunk `/offline` chưa nạp nên màn danh mục không mount lại (chỉ lộ ra khi cả bộ chạy song song). Đã sửa (DV-46); chạy lại hai lần liên tiếp: 22/22 |
| `npm run ci` | 0 | typecheck sạch; lint 493 pass; test 106 file pass + 1 skipped, 1632 pass, 133 skipped; build precache 49 mục |
| `npm run e2e` | 0 | 48 pass, 47 skipped; `m01`: V1, V3–V22 và SC-M01-008 pass, V2 `fixme` |
| Quét `dist/` production tìm hook test, `fake://`, `node:buffer` | — | Không có |

Một lần chạy `npm run ci` + `npm run e2e` ở phiên trước bị dừng khi phiên kết thúc (không có kết quả); hai lệnh trên là lần chạy lại hoàn chỉnh.

### 8.2 `NOT RUN`

| Mục | Lý do |
|---|---|
| Hết quota thật của trình duyệt, eviction | Mô phỏng bằng `failNextActivation`; kiểm thủ công trên thiết bị thật (T100) |
| V10 trên stack Supabase local (Storage thật, signed URL thật) | Phase 11 (T105) |
| Hai tab thật bấm Tải cùng lúc trên trình duyệt không có Web Locks | Chỉ kiểm mutex trong tab bằng unit test; rủi ro ghi ở research R-09 |

### 8.3 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-40 | Nhãn ngoài bảng copy: "Gói tải trước" (mockup SCR-M01-003) / "Offline download"; "Phiên bản {n}" / "Version {n}" (E-SCR-M01-004-05); "Xem" / "View" (E-SCR-M01-004-10); "Cập nhật" / "Update" (cùng chữ với lời nhắc cập nhật). Tiếng Anh do agent đề xuất theo ủy quyền 2026-11-02 | Áp dụng, chủ dự án có thể sửa |
| DV-41 | T082–T087: phân biệt "lỗi lưu trữ" với "cập nhật lỗi"/"tải chưa hoàn tất" bằng kết quả thao tác trong bộ nhớ của màn (`PackageOpResult`), không thêm trường nào vào dòng `packageCandidates` (data-model §3). Mở lại màn thì chỉ còn trạng thái lưu bền (`CHUA_HOAN_TAT` hoặc gói cũ) | Áp dụng |
| DV-42 | T085: "Quay lại" đóng dialog và ở lại màn chi tiết (màn trước của quyết định); không điều hướng lùi lịch sử. Esc = Quay lại, focus ban đầu ở Quay lại để không chọn ngầm | Áp dụng |
| DV-43 | T086: "Tải về" trong dialog chỉ tải gói, không tự Start sau khi tải xong (screen spec §5 mục 5: Tải → Downloading → Ready/Incomplete); du khách bấm "Bắt đầu" lại. Trước khi mở dialog đọc snapshot active; nguồn không khả dụng hoặc snapshot cho thấy không cần gói → không mở dialog | Áp dụng |
| DV-44 | `fakeSource.ts` (chỉ Vitest) trả byte ảnh bằng `Blob` của `node:buffer` vì `Response.blob()` trong jsdom tạo Blob của jsdom mà fake-indexeddb không clone được (cùng nguyên nhân DV-14) | Áp dụng |
| DV-45 | T083: `src/app/App.tsx` gọi `recoverM01Orphans()` (import động) khi shell khởi động. Không có Web Locks thì mọi candidate `DANG_TAI` còn lại coi là mồ côi | Áp dụng |
| DV-46 | E2E: chờ tiêu đề màn `/offline` trước khi quay lại danh mục (V22, V6); đặt lại bộ đếm ký URL trước khi bấm Tải (V14); V21 dùng tuyến B; V12 điều hướng trong app để giữ cờ tiêm lỗi | Áp dụng |
| DV-47 | T084: hiệu ứng sau đọc nguồn gồm thu hồi, `OUTDATED`, làm mới chữ cốt lõi (mọi dòng tuyến hợp lệ có gói active, kể cả tuyến đã đóng). Hệ quả: test "gói còn nguyên" của US5 (unit, V22) so gói trừ `routeEssentials` | Áp dụng |

### 8.4 Checkpoint US6

US6 **đạt** trên network mock: V9–V16 pass. M02 đọc được gói `SAN_SANG` thật qua `src/modules/m01/index.ts`.

## 9. Đợt 2026-11-03 — Phase 9 US7 Gợi ý tuyến (T088–T092)

Branch `feat/m01-us7`, tách từ `feat/m01-us6` (PR #13–#19 chờ merge; DV-20). Test T088–T089 viết trước và đã chạy thấy fail trước khi cài đặt.

### 9.1 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx playwright test --project=m01 e2e/m01/recommend.spec.ts` (lần 1) | 1 | Test bấm vào chữ của chip, nhưng radio trong suốt nằm đè lên chip (đúng thiết kế: người dùng bấm vào radio) nên Playwright báo bị chặn; test đổi sang `check()` trên radio |
| `npm run ci` | 0 | typecheck sạch; lint 498 pass; test 108 file pass + 1 skipped, 1651 pass, 133 skipped; build precache 51 mục |
| `npm run e2e` | 0 | 49 pass, 47 skipped; `m01` thêm V23 pass |
| Quét `dist/` production tìm hook test, `fake://`, `node:buffer` | — | Không có |

### 9.2 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-48 | T092: mỗi nhóm là `role="radiogroup"` chứa radio gốc (chip là nhãn), nên phím mũi tên và Space dùng được như radio chuẩn. Hành động "Về danh mục" (E-SCR-M01-002-12) dùng câu copy "Xem tất cả tuyến" / "See all routes" của bảng copy SCR-M01-002; tóm tắt tiêu chí ghép ba nhãn đã chọn. Nút lọc vô hiệu cả khi danh mục chưa đọc được | Áp dụng |
| DV-49 | T092: gợi ý dùng chung local view danh mục (catalogStore) nên mở màn gợi ý cũng làm mới nguồn và chạy hiệu ứng thu hồi/`OUTDATED`/chữ cốt lõi | Áp dụng |

### 9.3 Checkpoint US7

US7 **đạt** trên network mock: V23 pass. Mọi user story M01 chạy độc lập trên network mock.

## 10. Đợt 2026-11-03 — Phase 10 Polish (T093–T101)

Branch `feat/m01-polish`, tách từ `feat/m01-us7` (PR #13–#20 chờ merge; DV-20). Test `UpdatePrompt.test.tsx` viết trước và đã chạy thấy fail trước khi cài đặt.

### 10.1 Lệnh kiểm chứng (T099)

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run typecheck` (trong `npm run ci`) | 0 | Sạch (gồm `e2e/`) |
| `npm run lint` (trong `npm run ci`) | 0 | 503 pass |
| `npm run test` (trong `npm run ci`) | 0 | 109 file pass + 1 skipped; 1662 pass, 133 skipped (ca stack local của M03) |
| `npm run build` (trong `npm run ci`) | 0 | PWA `generateSW`, precache 50 mục; chunk `m01-*` có trong precache, chunk `m03-*` và `qrcode-*` không |
| `npm run e2e` (gồm project `m01`) | 0 | 53 pass, 47 skipped. `m01`: 27 pass (V1, V3–V25, SC-M01-008, quét mã thô vi/en), 1 `fixme` (V2) |
| `npx playwright test --project=m01` cho `pwa-offline`, `pwa-update`, `no-raw-codes` | 0 | 4 pass |
| Quét `dist/` production tìm `__cpqTestHooks`, `seedPackage`, `simulateAppUpdate`, `fake://`, `node:buffer` | — | Không có |
| `git diff --check` (T101, gồm file mới) | 0 | Không lỗi khoảng trắng |

### 10.2 Rà soát WCAG 2.1 AA (T097)

Rà soát thủ công theo design-system §6 và research R-19; **không tuyên bố đạt chuẩn** vì chưa đo bằng công cụ (repo không có axe; thêm dependency cần duyệt).

| Mục | Kết quả rà soát |
|---|---|
| Vùng chạm | Mọi nút, liên kết và radio dùng `--touch-target` (44px) hoặc `--touch-target-m01-primary` (48px). Khối cao 28px chỉ là chip trạng thái không bấm được |
| Focus nhìn thấy | `:focus-visible` toàn cục dùng `--focus-ring-*`; trên nền deep (thanh app, hero, panel ngôn ngữ, lời nhắc cập nhật) đổi sang amber (§5.3: 7.60:1); dialog có focus trap, Esc = lựa chọn an toàn |
| Tương phản | Chỉ dùng các cặp đã tính ở design-system §6.1 (ink/secondary trên paper/white, paper trên deep/forest, ink trên amber, success/warning/error trên white). Nút lọc ở trạng thái vô hiệu (secondary trên line) dưới 4.5:1 — thuộc ngoại lệ "thành phần không hoạt động" của tiêu chí 1.4.3 |
| Không chỉ bằng màu | Trạng thái gói, dấu "Cần tải trước", lựa chọn đang chọn (VI/EN, radio) luôn có chữ hoặc `aria-pressed`/`checked`, kèm viền dày cho radio |
| Ngữ nghĩa | `html lang` theo ngôn ngữ hiển thị; radio group có nhãn; danh sách điểm dừng có `aria-labelledby`; thông báo nguồn `role="status"`, lỗi `role="alert"`; ảnh trang trí `alt=""`, sơ đồ tuyến có `alt` |
| Chuyển động | Chỉ có pulse của khối giữ chỗ, dùng `--duration-pulse` (0 khi `prefers-reduced-motion`) |

### 10.3 Kiểm tra thủ công trên thiết bị thật (T100) — `NOT RUN`, chờ chủ dự án

| # | Kịch bản | Android Chrome | iOS Safari |
|---|---|---|---|
| 1 | Mở app có mạng, chọn ngôn ngữ, mở danh mục và một chi tiết; tắt mạng; tải lại `/`, `/routes/{id}` | NOT RUN | NOT RUN |
| 2 | Đã mở app trước đó, tắt mạng, mở link `/q/{id}` từ camera điện thoại | NOT RUN | NOT RUN |
| 3 | Đổi VI/EN khi offline trên SCR-M01-003 có gói | NOT RUN | NOT RUN |
| 4 | Tải gói tuyến cần tải trước; tắt mạng; Start offline | NOT RUN | NOT RUN |
| 5 | Dung lượng gần đầy (quota): tải gói, xác nhận "Không lưu được dữ liệu…" và gói cũ còn | NOT RUN | NOT RUN |
| 6 | Xóa dữ liệu trang/eviction: mở lại app, preference/context/gói mất, app không lỗi | NOT RUN | NOT RUN |
| 7 | Timeout 8 s (provisional) trên mạng yếu ngoài thực địa: nguồn chậm có bị coi nhầm là mất nguồn | NOT RUN | NOT RUN |
| 8 | Bản mới của app khi đang tải gói: lời nhắc hiện, chỉ áp sau khi tải xong | NOT RUN | NOT RUN |

### 10.4 Tài liệu upstream có nguy cơ cũ (T101; không tự sửa, AGENTS.md §4)

| Tài liệu | Điểm |
|---|---|
| `contracts/visitor-ui-flow-contract.md` §1 | Tên chunk `m01-recommend`, `m01-offline`; code dùng `m01-recommendation`, `m01-offline-package` (DV-02) |
| `screens/screen-spec/M01/*` bảng copy | Chưa có nhãn tên màn, điều hướng, nhãn mục chi tiết, "Phiên bản {n}", "Xem", "Gói tải trước" (DV-13, DV-30, DV-40 — tiếng Anh do agent đề xuất) |
| `screens/screen-spec/M01/SCR-M01-001` bảng copy | Chưa có câu báo khi cập nhật app bị hoãn (DV-57; câu VI/EN do agent đề xuất) |
| `research.md` R-14 | Ghi `registerBusyCheck(fn: () => Promise<boolean>)`; code nhận `boolean \| Promise<boolean>` (DV-06) |
| `quickstart.md` | Đầu file ghi "Trạng thái: chưa chạy" và lệnh `npm run e2e -- --grep m01` / `--project=local-stack`; thực tế dùng project `m01` / `m01-local-stack` |
| `tasks.md` T104 | "View lệch thì sửa view phía M03" xung đột với quy tắc M01 không sửa `supabase/` (DV-08) |
| `plan.md` Complexity #1, `tasks.md` header "Nguồn dữ liệu" | Ghi M03 giai đoạn B "chưa cài đặt"; nay đã có trên stack local |

### 10.5 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-50 | T093: `UpdatePrompt` gắn vào `src/app/App.tsx`, theo dõi đường dẫn bằng `router.subscribe`; ẩn trên `/admin` và `/admin/*`. Thanh cố định phía dưới, `role="status"` | Áp dụng |
| DV-51 | T095: bản build mới được giả lập bằng hook `simulateAppUpdate` (MODE e2e) gọi `updateCoordinator.notifyUpdateAvailable`; E2E kiểm "hoãn khi tab khác đang giữ thao tác gói, áp sau khi tải xong". Bước `updateSW(true)` thật của service worker không được kiểm bằng E2E | Áp dụng |
| DV-52 | T094: trang `/q/{id}` của M02 chưa có; V24 chỉ kiểm app shell được service worker phục vụ khi offline và Cache Storage không chứa URL `/rest/v1`, `/storage/v1`, `/auth/v1` | Áp dụng |

### 10.6 Checkpoint Phase 10

Phase 10 **đạt**: T093–T101 xong. Còn mở: T100 (thiết bị thật) và V2 chờ M02.

## 11. Đợt 2026-11-03 — Phase 11 Tích hợp (T102–T106)

Branch `feat/m01-integration`, tách từ `feat/m01-polish` (PR #13–#21 chờ merge; DV-20).

### 11.1 T102 — bề mặt cho package 002

`src/modules/m01/index.ts` export đúng danh sách mà `src/modules/m02/m01Port.ts` cần (tasks M02 T016): `useLanguagePreference`, `resolveDisplayLanguage`, `LanguageControl`, `readSelectedRouteContext` (kiểu `SelectedRouteContextReadResult` = `NONE` / `INVALID` / `OK`), `readActiveOfflinePackage`, `findOfflineResource`, `readPackageImage`, `M01_HANDOFF_TABLES`; thêm `readLanguagePreference`. Không export hàm ghi nào (`architecture.test.ts`). `registerBusyCheck` có trong `src/app/pwa/updateCoordinator.ts`, nhận `() => boolean | Promise<boolean>` (DV-06). Package 002 có thể chạy T102–T103 của nó.

### 11.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `docker info`, `supabase --version` (Git Bash và PowerShell) | — | Máy này không có Docker lẫn Supabase CLI → không chạy được stack local tại chỗ |
| `npx playwright test --list` | 0 | `m01` 28 ca (không gồm `*.local.spec.ts`); `m01-local-stack` 5 ca của `integration.local.spec.ts` |
| `npx playwright test --project=m01` | 0 | 27 pass, 1 skipped (V2) |
| `gh workflow run ci.yml --ref feat/m01-integration` → run 41562721605 (runner GitHub, stack Supabase local CLI 2.122.0 trong runner; không link, không cloud) | 1 | `verify` success (1662 test); `local-stack` success: pgTAP và contract M03 như trước, `m03-local-stack` 68 pass + 4 skipped, **`m01-local-stack` 5 pass** (T104, V4, V10, V17, V22); `e2e` failure: 1 ca `no-raw-codes` (English) — test điều hướng ngay sau khi bấm xác nhận xóa nên thao tác xóa có thể bị cắt ngang; đã sửa test cho chờ trạng thái "chưa có gói" (DV-56) |
| `npx playwright test --project=m01 e2e/m01/no-raw-codes.spec.ts` (hai lần, sau khi sửa) | 0 | 2 pass mỗi lần |

### 11.3 `NOT RUN`

| Mục | Lý do |
|---|---|
| Stack Supabase local trên máy phát triển này | Không có Docker và Supabase CLI; tích hợp thật chỉ chạy trong job CI `local-stack` |
| Tích hợp thật cho mục ngoài V4, V10, V17, V22 | Tasks T105 chỉ yêu cầu bốn kịch bản; phần còn lại chỉ có network mock (bảng `checklists/br-test-coverage.md`) |
| T100 thiết bị thật | Chờ chủ dự án |

### 11.4 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-53 | T103: M03 giai đoạn B đã có view, policy Storage và Edge trên stack local; không dùng `e2e/.local-fixture.json` (M03 không tạo file này). Dữ liệu dựng phía Node trong `beforeAll` bằng helper của M03 (`seedCloseScenario`: hai tuyến đã xuất bản qua adapter Supabase thật, ảnh thật trong Storage), theo hướng dẫn của chủ dự án | Áp dụng |
| DV-54 | T104: thay vì chạy lại T012/T014 trong Vitest, spec `integration.local.spec.ts` đọc dòng thật của `api.published_routes` / `api.active_journey_snapshots` bằng supabase-js (anon), cho qua `parsePublishedRouteRow` / `parseJourneySnapshotRow` và so với kết quả của M03 (`readPublicationLocal`). Không có lệch cột; không sửa `supabase/` | Áp dụng |
| DV-55 | T105: project `m01-local-stack` chỉ chạy `*.local.spec.ts`, project `m01` bỏ qua chúng; bước mới trong job CI `local-stack` (`.github/workflows/ci.yml`) chạy `m01-local-stack` sau `m03-local-stack`. V22 đóng tuyến bằng lệnh C-09 thật của tài khoản Quản lý synthetic | Áp dụng |
| DV-56 | E2E `no-raw-codes`: chờ câu "Bạn chưa tải tuyến nào." sau khi xóa gói rồi mới điều hướng | Áp dụng |

### 11.5 Checkpoint Phase 11

Phase 11 **đạt**: T102–T106 xong. Toàn bộ 106 task của package 001 đã đánh dấu. Còn mở: T100 (thiết bị thật), V2 (chờ trang `/q/{id}` của M02), các mục upstream ở §10.4.

## 12. Đợt 2026-11-03 — Sửa lỗi sau review PR #13–#22

Review gộp diff `main..feat/m01-integration` (`/code-review high`); người dùng duyệt sửa bốn lỗi đầu, các mục hiệu năng và dọn code để sau.

### 12.1 Lệch so với tasks và quyết định

| # | Mục | Trạng thái |
|---|---|---|
| DV-57 | `packageOps.ts`: ghi candidate lỗi ngay đầu (quota, IndexedDB bị chặn) trả `{ kind: 'failed', reason: 'storage' }` thay vì reject, để màn hiện câu `storageError`. `StartPanel.tsx`: nút Bắt đầu vô hiệu từ lúc bấm, gồm cả lúc đọc snapshot và chờ dialog quyết định offline; ref chặn bấm lặp trước khi kịp render. `UpdatePrompt.tsx`: `applyUpdate()` trả `deferred` thì hiện câu mới `update.deferred` (VI/EN do agent đề xuất, chưa có trong bảng copy SCR-M01-001 — xem §10.4); bản mới hơn tới sau `Để sau` thì lời nhắc hiện lại. `RecommendPage.tsx`: `Đổi tiêu chí` đưa focus về radio đang chọn | Áp dụng |

### 12.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npx vitest run` trên bốn file test bị ảnh hưởng, với code cũ (`git stash` phần `src` không phải test) | 1 | 5 ca mới fail đúng lỗi review |
| `npx vitest run src/app/pwa src/modules/m01/{offline-package/packageOps.test.ts,route-detail,recommendation,i18n}` | 0 | 80 pass |
| `npm run ci` | 0 | typecheck, lint sạch; 1665 pass, 133 skipped; build PWA precache 50 mục |
| `gh workflow run ci.yml --ref feat/m01-integration` → run 41576823462 | 1 | `verify`, `local-stack` success; `e2e` failure: V25 `pwa-update.spec.ts` lọc lời nhắc theo câu "Đã có phiên bản mới…", câu đổi sang câu báo hoãn nên mất locator. Sửa test cho lọc theo nút `Cập nhật` và kiểm thêm câu báo hoãn |
| `npx playwright test --project=m01` | 0 | 27 pass, 1 skipped (V2) |

## 13. Đợt 2026-11-05 — Hoàn tất V2 và V24 sau khi M02 có trang `/q/{id}`

Branch `test/m01-qr-link-followups`. Trang `/q/{qrIdentifier}` (SCR-M02-004) đã có từ package 002 (PR #32), nên hai mục chờ M02 được kiểm bằng E2E thật thay cho `fixme` / kiểm app shell.

### 13.1 Thay đổi

| # | Mục | Trạng thái |
|---|---|---|
| DV-58 | V2: thay `test.fixme` bằng hai ca (`vi-VN`, `en-US`), mỗi ca là một lần mở `/q/Q1a` đầu tiên trong context mới; lookup và Storage giả bằng `e2e/m02/network.ts`. Kiểm: nội dung theo ngôn ngữ thiết bị, không có panel chọn ngôn ngữ, `<html lang>` theo thiết bị, store `languagePreference` trống | Áp dụng; đóng mục V2 ở §3.2 |
| DV-59 | V24 (thay phần DV-52): offline, `/q/qr-a1-1` được service worker phục vụ và trang M02 render câu "Cần có kết nối mạng để kiểm tra mã QR này." (không phiên, như M02 V22), thay vì chỉ kiểm `#root` không rỗng. CI PR #38 (run 41940335653) từng fail: trang `/q/…` hiện tiếng Anh vì test bấm VI rồi chuyển trang ngay, lần ghi `languagePreference` bị cắt ngang; test nay chờ tiêu đề "Danh mục tuyến" (UI đổi sau khi ghi xong) rồi mới chuyển trang | Áp dụng |

### 13.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run typecheck` | 0 | sạch (gồm `e2e/` qua `tsconfig.node.json`) |
| `npx playwright test --project=m01 e2e/m01/language.spec.ts e2e/m01/pwa-offline.spec.ts --repeat-each=2` | 0 | 10 pass |
| `npx playwright test --project=m01` | 0 | 29 pass, 0 skipped |
| `npx playwright test --project=m01 e2e/m01/pwa-offline.spec.ts --repeat-each=10 --workers=4` (sau khi sửa V24) | 0 | 10 pass |
| `git diff --check` | 0 | không lỗi khoảng trắng |

### 13.3 Đồng bộ tài liệu upstream (§10.4; chủ dự án duyệt 2026-11-05)

| Tài liệu | Sửa |
|---|---|
| `contracts/visitor-ui-flow-contract.md` §1 | Tên chunk `m01-recommendation`, `m01-offline-package` (DV-02) |
| `screens/screen-spec/M01/*` bảng copy | Thêm các chữ đang dùng trong `src/modules/m01/i18n/` (DV-13, DV-30, DV-40, DV-57) |
| `research.md` R-14 | `registerBusyCheck(fn: () => boolean \| Promise<boolean>)` (DV-06) |
| `quickstart.md` | Trạng thái "đã chạy" (kết quả ở file này); lệnh dùng project `m01` / `m01-local-stack` |
| `tasks.md` T104 | View lệch thì dừng và báo M03, không sửa `supabase/` (DV-08) |
| `plan.md` Complexity #1, `tasks.md` header "Nguồn dữ liệu" | M03 giai đoạn B đã có trên stack local |

### 13.4 Còn mở

T100 (thiết bị thật).

## 14. Đợt 2026-11-08 — Làm lại giao diện bước chọn ngôn ngữ (SCR-M01-001, E-SCR-M01-001-01)

Chỉ đổi hình thức theo mockup người dùng đưa; luồng gate, `writeLanguagePreference` và `LanguagePreference` giữ nguyên.

### 14.1 Lệch và quyết định

| ID | Nội dung | Kết quả |
|---|---|---|
| DV-60 | Thay phần "Tiêu đề panel theo ngôn ngữ thiết bị" của DV-22: panel hiện cả tiêu đề lẫn lời dẫn bằng hai ngôn ngữ cùng lúc, tiếng Việt trước. Chữ mới đưa vào bảng copy SCR-M01-001 trước khi sửa `i18n/` (người dùng chọn 2026-11-08). Nút vẫn tên "Tiếng Việt"/"English" | Áp dụng |
| DV-61 | Cờ hai nút và hình núi ở đường phân cách do agent vẽ, đặt trong `assets/icons/` (người dùng duyệt ngoại lệ 2026-11-08; design-system §7). Ảnh nền `assets/background_mobile.jpg` do người dùng đưa; chỉ thiết kế cho mobile | Áp dụng |
| DV-62 | Màu chỉ dùng token sẵn có; lớp phủ trên ảnh pha từ `--color-m01-deep` bằng `color-mix`, không thêm token. Ảnh `.jpg` không nằm trong precache PWA (`globPatterns`), nên khi offline panel hiện trên nền deep | Áp dụng |
| DV-64 | `assets/icons/logo-emblem.png` là bản sạch của `icon.png` theo yêu cầu người dùng 2026-11-08: nền xám `#E6E6E6` thành trắng, cắt vạch đen ở mép trên, thu về 480 px (232 KB thay vì 568 KB). Theo yêu cầu người dùng, bản này thay `icon.png` ở mọi chỗ dùng: favicon (`index.html`), thanh app M01 (`VisitorLayout`), panel chọn ngôn ngữ và mockup SCR-M01-003. File `icon.png` gốc vẫn giữ trong repo làm nguồn. Manifest PWA vẫn chưa có icon (T007). Thẻ logo ở panel có vòng hổ phách. Không chuyển sang SVG: ảnh gốc là bản phóng to bị nhòe, tự dò nét sẽ làm méo chữ và hình voọc | Áp dụng |
| DV-65 | Icon cài đặt (yêu cầu người dùng 2026-11-08, thay chỗ trống `icons: []` của T007): `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png` (logo trong vòng an toàn 80%) và `apple-touch-icon.png` 180 px, dựng từ logo sạch trên nền trắng. Manifest cần URL cố định nên plugin `cuc-phuong:pwa-icons` trong `vite.config.ts` chép ba icon PWA từ `assets/icons/` vào `pwa/` của bản build; `pwa/**` không vào precache (trình duyệt tự tải lúc cài). `apple-touch-icon` đi qua `index.html` như favicon. Manifest đặt `theme_color` `#163c2d` (`--color-m01-deep`), thay mặc định `#42b883` của plugin, và `background_color` trắng. E2E `pwa-install.spec.ts` kiểm tra manifest và mọi icon trả 200 `image/png` | Áp dụng |
| DV-63 | Helper E2E `chooseLanguage` chờ panel biến mất sau khi bấm: trước đó `page.goto` ngay sau click có thể chạy trước khi IndexedDB ghi xong (V11, V12, V15, V21 lỗi chập chờn) | Áp dụng |

### 14.2 Lệnh kiểm chứng

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run typecheck` | 0 | sạch |
| `npm run lint` | 0 | 645 pass |
| `npm test` | 0 | 2128 pass, 133 skipped |
| `npx playwright test --project=m01` (sau DV-63) | 0 | 29 pass; một lượt `--repeat-each=2` có 1 lần V14 lỗi, chạy lại V14 `--repeat-each=10` 10 pass |
| `npx playwright test --project=m02` | 0 | 46 pass |
| `git diff --check` | 0 | không lỗi khoảng trắng |
