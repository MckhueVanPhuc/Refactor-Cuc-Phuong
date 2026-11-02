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
