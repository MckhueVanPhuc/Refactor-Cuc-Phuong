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
