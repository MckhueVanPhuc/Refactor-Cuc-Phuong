# Research — M01 Route Planning & Preparation

**Package**: `specs/001-m01-route-planning-preparation` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

Tài liệu Phase 0 của `/speckit-plan`. Mỗi mục ghi **Decision / Rationale / Alternatives considered**. Đây là quyết định kỹ thuật (Layer 3), không phải requirement: hành vi lấy từ [spec-M01 v3.2](../../docs/spec/spec-M01.md); lựa chọn công nghệ lấy từ [tech-stack.md](../../docs/architecture/tech-stack.md), cấu hình từ [environment.md](../../docs/architecture/environment.md), runtime placement từ [system-configuration.md](../../docs/architecture/system-configuration.md); store trình duyệt từ [Physical Schema](../../data/06-physical-schema.md) §11. Phía producer M03 lấy từ plan đã duyệt [specs/003](../003-m03-operations-content-administration/plan.md). Nếu một mục dưới đây mâu thuẫn với các nguồn đó, nguồn thắng.

Phân loại trạng thái dùng trong file này (giống research M03):

- **Approved upstream** — đã chốt trong architecture, Physical Schema hoặc plan M03; ở đây chỉ trích lại.
- **Plan decision** — quyết định kỹ thuật của plan này cho chỗ nguồn để trống; có thể đổi mà không đổi behavior.
- **Provisional** — giá trị provisional của spec; giữ nguyên nhãn, chưa xác nhận trên thiết bị thật.

## 1. Technical Context — các mục cần làm rõ và cách giải quyết

| # | Mục ban đầu là NEEDS CLARIFICATION | Giải quyết tại |
|---|---|---|
| 1 | M01 có backend riêng không; phụ thuộc thế nào vào giai đoạn B (bị chặn) của M03 | R-01 |
| 2 | Phiên bản dependency chính xác; thư viện test IndexedDB (không có trong tech-stack) | R-02, R-16 |
| 3 | Vị trí schema contract cross-module; phạm vi kiểm tra phía consumer (có kiểm giới hạn độ dài không) | R-04 |
| 4 | Cách đọc Published Route/`JourneySnapshot`; cách áp `SOURCE_REQUEST_TIMEOUT_SECONDS` (provisional 8 s) | R-05 |
| 5 | Cách lấy byte ảnh từ bucket private; "ảnh đọc được" nghĩa là gì; timeout khi tải ảnh | R-06 |
| 6 | Ai khai báo schema Dexie khi một database chứa store của cả M01 và M02 | R-07 |
| 7 | Nội dung các store kỹ thuật (`packageCandidates`, `activePackages`, `imageBytes`); nơi giữ `DANG_TAI`/`CHUA_HOAN_TAT` | R-08 |
| 8 | Tuần tự hóa thao tác gói theo tuyến và chặn Start lặp, kể cả giữa nhiều tab (FR-M01-009, FR-M01-012) | R-09 |
| 9 | Khi nào đánh dấu `OUTDATED`, khi nào dựng candidate mới, khi nào làm mới essential texts (FR-M01-010, FR-M01-014) | R-10 |
| 10 | Chọn đường online/offline khi Start; sinh `handoffId`, `authorizedAt`, `expiresAt`; thu hồi context | R-11 |
| 11 | Control ngôn ngữ dùng lại trên trang link QR của M02; ngôn ngữ thiết bị; i18n không có thư viện | R-12 |
| 12 | "Local view gần nhất" của danh mục khi offline: lưu ở đâu khi Physical §11 không có store danh mục | R-13 |
| 13 | Cấu hình PWA/app shell và điều phối cập nhật service worker khi đang có thao tác gói | R-14 |
| 14 | Mục tiêu hiệu năng (spec-M01 §10.2: deferred) | R-17 |
| 15 | Định dạng dung lượng ước tính và thời điểm lưu (spec-M01 §10.2: deferred) | R-18 |

Sau Phase 0 không còn mục `NEEDS CLARIFICATION` mở trong plan. Các điểm cần phối hợp với package khác được liệt kê ở §4; các điểm lệch với phía M03 ở §5.

## 2. Quyết định

### R-01 — Phạm vi code và phụ thuộc vào giai đoạn B của M03

- **Decision (Plan decision):** M01 không có backend riêng. Toàn bộ M01 nằm trong `src/` (frontend, Dexie, adapter, contract) và cấu hình Vite/PWA — đều trong phạm vi code đã mở (AGENTS.md §2). M01 không tạo SQL migration, RPC, Edge Function hay policy Storage nào. Nguồn dữ liệu của M01 là view `api.published_routes`, `api.active_journey_snapshots` và policy đọc Storage do **giai đoạn B của M03** tạo (Physical §7.1, §9; plan M03 Complexity #1). Trong lúc giai đoạn B còn bị chặn, M01 chạy với adapter giả (unit/component) và network mock (E2E); tích hợp thật với stack Supabase local là bước cuối, chỉ chạy được sau khi M03 giai đoạn B được mở.
- **Rationale:** spec-M01 §9.3: "Guest access to M03 data is read-only and enforced server-side"; M01 chỉ đọc. Không có lý do để M01 mở rộng phạm vi backend.
- **Alternatives considered:** Tự viết view tạm phía M01 — vi phạm AGENTS.md §2 và ownership (M03 sở hữu projection). Chờ M03 giai đoạn B rồi mới bắt đầu M01 — chặn toàn bộ M01 không cần thiết, vì contract đã cố định.

### R-02 — Toolchain và dependency

- **Decision (Approved upstream + Plan decision):** Node.js 24 LTS + npm (tech-stack §8). Runtime dependency M01 dùng: `react`, `react-dom`, `react-router` (data mode), `@supabase/supabase-js`, `zod`, `dexie` (tech-stack §3–§4). Dev: `typescript`, `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa` (Workbox `generateSW`), `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test` — giống M03 (R-02 của M03). M01 không dùng `qrcode`, `@zxing/*`. Không thêm thư viện state, i18n, form hay `dexie-react-hooks`: hook đọc dữ liệu dùng `liveQuery` có sẵn trong `dexie` + `useSyncExternalStore` của React. Phiên bản chính xác được **pin khi task setup cài đặt thật**; lockfile được commit; plan không ghi số phiên bản chưa cài (tech-stack §13). Dev dependency `fake-indexeddb` xem R-16 (cần duyệt).
- **Rationale:** tech-stack §3 "không thêm Redux/Zustand hoặc cache server thứ hai"; tech-stack §13 "chỉ ghi version là verified sau khi cài/chạy thực tế"; người dùng cấm cài dependency ở bước plan.
- **Alternatives considered:** `dexie-react-hooks` (`useLiveQuery`) — tiện nhưng là dependency chưa có trong tech-stack; `liveQuery` của Dexie core làm được việc tương đương. `i18next` — tech-stack không chọn; hai từ điển có kiểu là đủ cho hai ngôn ngữ cố định.

### R-03 — Kiến trúc frontend của M01

- **Decision (Approved upstream: tech-stack §2–§3; Plan decision về đường dẫn và cấu trúc):**
  - SPA React + TypeScript, React Router data mode. M01 là các route công khai, lazy-load theo màn hình:

    | Path | Màn hình | Ghi chú |
    |---|---|---|
    | `/` | SCR-M01-001 Danh mục tuyến | gồm bước chọn ngôn ngữ (panel chặn toàn trang, OQ-SCR-M01-001-003) |
    | `/recommend` | SCR-M01-002 Gợi ý tuyến | Should |
    | `/routes/:routeId` | SCR-M01-003 Chi tiết tuyến & Chuẩn bị | dialog quyết định offline (OQ-SCR-M01-003-004) |
    | `/offline` | SCR-M01-004 Quản lý tài nguyên offline | |

    `/q/:qrIdentifier` và các route phiên thực địa thuộc M02 (package 002). M01 điều hướng sang M02 qua hằng `PATHS.m02SessionEntry` khai báo trong shell `src/app/paths.ts`; giá trị do package 002 chốt.
  - M01 nằm trọn trong `src/modules/m01/`. M02 chỉ được dùng **bề mặt công khai** `src/modules/m01/index.ts` (control ngôn ngữ, hook đọc ngôn ngữ, các hàm đọc dữ liệu dùng chung đã validate — xem R-07, R-12); không import file nội bộ của M01. M01 không import gì từ `src/modules/m02|m03`.
  - Style: CSS Modules + CSS custom properties lấy từ token của [design-system.md](../../docs/design/design-system.md) (nhóm `--color-m01-*`, typography, spacing); không hard-code màu/khoảng cách; icon chỉ lấy từ `assets/icons/` (CLAUDE.md). Khi dựng UI ở bước implement phải dùng skill `frontend-design`.
- **Rationale:** spec-M01 BR-M01-001 và BR-M02-024 yêu cầu control ngôn ngữ của M01 được dùng lại trên trang link QR, nên cần một bề mặt công khai có chủ đích thay vì để M02 với vào nội bộ M01 (constitution II, "Module Ownership Boundaries" mục 1, 4).
- **Alternatives considered:** Đặt control ngôn ngữ trong `src/shared/` — làm mờ chủ sở hữu duy nhất của `LanguagePreference` (BR-M01-001). Đường dẫn tiếng Việt (`/goi-y`) — không có nguồn yêu cầu; path chỉ là chi tiết kỹ thuật.

### R-04 — Contract dùng chung và phạm vi kiểm tra phía consumer

- **Decision (Approved upstream: tech-stack §6, research M03 R-04; Plan decision về file và phạm vi kiểm tra):**
  - **Consume (M03 sở hữu file):** `src/shared/contracts/publishedRoute.ts`, `src/shared/contracts/journeySnapshot.ts`. M01 import đúng hai schema này, không định nghĩa lại (constitution "Contract & Traceability").
  - **Produce (M01 sở hữu file):** `src/shared/contracts/languagePreference.ts`, `src/shared/contracts/selectedRouteContext.ts` (`SelectedRouteContextV3`, `contractVersion` literal `3`), `src/shared/contracts/offlinePackage.ts` (`OfflinePackage`, `OfflineResource`). M02 import cùng các schema này.
  - **Transport ≠ canonical:** schema contract mô tả đúng shape của spec-M01 §5.3. Kiểu dòng Dexie (`*Row`) là kiểu riêng trong `src/modules/m01/storage/` (thêm `slot`, tách `resources[]` ra store `offlineResources`, byte ảnh ở `imageBytes`). Hàm đọc lắp các dòng lại thành giá trị contract rồi validate bằng schema contract trước khi trả cho M02 (xem [data-model.md](data-model.md) §5).
  - **Phạm vi kiểm tra phía consumer:** schema kiểm tra kiểu, presence Required/Conditional/Optional, enum, non-empty, both-or-none, các ràng buộc chéo của contract (ID và `sequence` duy nhất, `offlineResources` có đúng khi `OFFLINE_REQUIRED`, một resource cho mỗi `qrIdentifier`, `timeTags` đúng một giá trị, `distanceKm`/`durationMin` > 0, tag phân biệt). Schema **không** kiểm tra giới hạn độ dài, số phần tử hay khoảng giá trị số (100/160/2000 ký tự, 8 ảnh, 100 km, 1440 phút…): spec-M03 §5.3 ghi rõ "the numeric, list-size and report-span limits below are authoring and query limits enforced by M03; the M01 and M02 contracts do not validate them", và các giá trị đó là **provisional** (spec-M03 §5.3). Một dòng Published Route hoặc snapshot không qua schema được coi là không hợp lệ: không chọn được, không dùng để tải hay Start; M01 không sửa dữ liệu (spec-M01 §5.4, §11.2).
- **Rationale:** Constitution yêu cầu consumer đọc đúng shape và không mở rộng cục bộ; spec-M03 §5.3 quy định consumer không kiểm giới hạn provisional, nên một thay đổi provisional ở M03 không làm M01 từ chối dữ liệu hợp lệ.
- **Alternatives considered:** M01 tự kiểm giới hạn độ dài theo bảng spec-M01 §5.3 — trái câu cuối spec-M03 §5.3 và tạo hai nơi giữ hằng provisional. Dùng chung một kiểu cho dòng Dexie và contract — hợp nhất transport shape với canonical entity (AGENTS.md §3.2, §5).

### R-05 — Đọc nguồn M03 và timeout provisional

- **Decision (Approved upstream: Physical §7.1, tech-stack §5; Provisional: spec-M01 §9.3; Plan decision về adapter):**
  - Adapter `src/modules/m01/api/` dùng client supabase-js của `src/shared/supabase/` (publishable key), đọc `supabase.schema('api').from('published_routes')` và `.from('active_journey_snapshots')` qua Data API. Ba loại đọc: danh mục (mọi dòng), một tuyến (`route_id = :routeId`), snapshot active của một tuyến. Ánh xạ tên cột ↔ key camelCase của contract chỉ xảy ra trong adapter (Physical §3); xem điểm phối hợp §5 mục L-01.
  - Mỗi lần đọc danh mục, chi tiết tuyến và Start có `AbortController` với `SOURCE_REQUEST_TIMEOUT_SECONDS` = **8 (provisional**, spec-M01 §9.3), khai báo một lần trong `src/modules/m01/config/limits.ts` có chú thích provisional và tham chiếu §9.3. Lần đọc snapshot khi tải gói cũng dùng hằng này (đó là một lần đọc nguồn trước khi dựng gói).
  - **Nguồn khả dụng = request thành công.** Response lỗi, timeout, hoặc response không qua schema contract đều là nguồn không khả dụng cho thao tác đó. `navigator.onLine === false` cho phép bỏ qua request và đi thẳng nhánh offline (không thể thành công); `navigator.onLine === true` không bao giờ đủ để coi là online.
  - Online Start đọc dòng tuyến và snapshot active trong cùng thao tác; nếu `snapshot.contentVersion ≠ activeContentVersion` (đọc giữa lúc M03 đang chuyển version) thì đọc lại một lần; vẫn lệch thì coi như nguồn không khả dụng cho lần Start đó.
- **Rationale:** spec-M01 §9.3 và §5.4 "Browser reports online but source request fails or times out… treat source as unavailable".
- **Alternatives considered:** Gọi qua Edge Function — tech-stack §5 "không bắt mọi read đi vòng qua Edge Function". Đặt timeout trong supabase client toàn cục — ảnh hưởng M03; timeout là quy tắc riêng của M01.

### R-06 — Media: hiển thị online và tải byte cho gói

- **Decision (Approved upstream: Physical §9, media-storage-contract M03 §4; Plan decision về cách kiểm tra):**
  - Contract chỉ mang `sourceRef` (đường dẫn tương đối trong bucket private `quest-media`), không mang URL. M01 tạo signed URL bằng `supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, expiresIn)` với quyền `anon`; Physical §9 cho phép đọc object được revision `PHAT_HANH` hoặc snapshot còn giữ tham chiếu. Tên bucket là hằng cấu hình `MEDIA_BUCKET` trong `src/shared/config/` (environment.md §4: không hard-code bucket trong business logic).
  - **Online (thumbnail, gallery, sơ đồ tuyến):** `<img src={signedUrl}>`; lỗi tải → placeholder trung tính (FR-M01-002, SF-M01-002-07). Ảnh bìa và gallery không bao giờ vào gói (BR-M01-013). Workbox không cache response media đã ký (constitution VI).
  - **Gói offline:** mỗi ảnh khai báo (`offlineResources[].staticImages[]` và `offlineRouteMap.sourceRef`) được tải bằng `fetch(signedUrl)` thành `Blob`. Ảnh được coi là **đọc được** khi: HTTP 2xx, `blob.size > 0`, `blob.type` bắt đầu bằng `image/`. Mỗi `sourceRef` phân biệt chỉ tải một lần trong một gói. URL hay signed URL không bao giờ được tính là đã tải (constitution VI; FR-M01-008).
  - Mỗi request byte ảnh có timeout kỹ thuật `PACKAGE_IMAGE_REQUEST_TIMEOUT_SECONDS` = 60. Đây là **hằng kỹ thuật của plan, không phải business rule và không phải hằng provisional của spec**; nó chỉ để một request treo không giữ gói ở `DANG_TAI` mãi (MVP không có Cancel, spec-M01 §4.4). Hết thời gian = tải lỗi, xử lý như mọi lỗi tải.
- **Rationale:** BR-M01-013, spec-M01 §9.3 "Declared offline images… require actual local bytes"; Physical §9.
- **Alternatives considered:** Kiểm tra bằng giải mã ảnh (`createImageBitmap`) — tốn bộ nhớ với gói đến 50 MB (provisional), và spec chỉ đòi byte có mặt và đọc được. Bucket public — trái quyết định private bucket của M03 (R-12 M03).

### R-07 — Database Dexie dùng chung và ranh giới store

- **Decision (Approved upstream: Physical §11; Plan decision về vị trí khai báo và bề mặt đọc):**
  - Một database `cuc-phuong-quest`. Toàn bộ chuỗi `version(n).stores({...})` (cả 10 store của Physical §11, gồm 3 store M02) được khai báo **một nơi**: `src/shared/db/visitorDb.ts`, vì Dexie yêu cầu một chuỗi version duy nhất cho mỗi database. Version 1 khai báo đúng key/index của Physical §11 ([data-model.md](data-model.md) §4). Dexie schema version độc lập với `VITE_APP_VERSION` và `contentVersion` (environment.md §8).
  - **Ghi:** chỉ code trong `src/modules/m01/storage/` ghi 4 store M01 + 3 store kỹ thuật. Không export hàm ghi nào ra ngoài M01.
  - **Đọc cho M02:** M01 export qua `src/modules/m01/index.ts` các hàm đọc chỉ-đọc, mỗi hàm lắp và validate đúng contract rồi trả giá trị hoặc `null`: `readLanguagePreference()`, `readSelectedRouteContext()`, `readActiveOfflinePackage(routeId)`, `findOfflineResource(routeId, qrIdentifier)`, `readPackageImage(routeId, contentVersion, sourceRef)`. Giá trị không qua schema hoặc thiếu byte ảnh → `null` (gói không đọc được = chưa sẵn sàng, FR-M01-005). Riêng `readSelectedRouteContext()` trả kết quả phân biệt `{ kind: 'NONE' } | { kind: 'INVALID' } | { kind: 'OK', value }`, để M02 tách "không có handoff" (khôi phục phiên hoặc khách tự do) khỏi "handoff hỏng hoặc version 2" (thông báo rõ, FR-M02-001) — quyết định D-01, 2026-10-29. Chi tiết ở các file contract.
- **Rationale:** Constitution "Module Ownership Boundaries" mục 1 (M01 ghi store dùng chung, M02 chỉ đọc) và mục 4 (typed adapter + Zod tại ranh giới); FR-M01-013 "never expose staging/partial values".
- **Alternatives considered:** Hai database riêng cho M01 và M02 — trái Physical §11 (một database). M02 đọc thẳng bảng Dexie của M01 — mất kiểm tra contract tại ranh giới và có thể đọc `packageCandidates`.

### R-08 — Pipeline gói offline: staging, kích hoạt nguyên tử, lỗi

- **Decision (Approved upstream: Physical §11 "Package preparation", tech-stack §4; Plan decision về nội dung store kỹ thuật):**
  1. Bắt đầu (trong lock của tuyến, R-09): một transaction ghi `packageCandidates[routeId] = { operationToken (UUID mới), targetContentVersion?, phase: 'DANG_TAI', startedAt }`. UI hiển thị `DANG_TAI` từ dòng này.
  2. Ngoài transaction: đọc dòng tuyến + snapshot active (R-05); xác định checkpoint `OFFLINE_REQUIRED` và `offlineRouteMap` từ **snapshot** (snapshot thắng cờ, BR-M01-012); tải byte mọi ảnh khai báo (R-06); dựng `manifest`, `resources[]`, `offlineRouteMap`, `routeEssentials` (`capturedAt` = thời điểm đọc dòng tuyến).
  3. Kiểm tra candidate trong bộ nhớ theo spec-M01 §5.4 (Snapshot, Offline resource, Offline route map, Essential texts, Package) — chi tiết ở [contracts/offline-package-contract.md](contracts/offline-package-contract.md) §4.
  4. Staging: một transaction ghi bundle đã kiểm tra (giá trị package, resources, danh sách `Blob`) vào `packageCandidates[routeId]`, chỉ khi `operationToken` còn khớp.
  5. Kích hoạt: **một** transaction trên `packageCandidates`, `offlinePackages`, `offlineResources`, `imageBytes`, `activePackages`: kiểm token; ghi package (`status = SAN_SANG`, `versionStatus = CURRENT`, `downloadedAt`), resources, byte; chuyển con trỏ `activePackages[routeId]`; xóa phiên bản cũ của tuyến (package, resources, byte); xóa candidate. Lỗi bất kỳ (kể cả `QuotaExceededError`) → transaction rollback, gói cũ nguyên vẹn.
  6. Lỗi ở bước 2–5: có gói `SAN_SANG` cũ → xóa candidate, gói cũ giữ nguyên `SAN_SANG` (+ `OUTDATED` nếu đã biết) (BR-M01-006); không có gói cũ → thay candidate bằng `{ phase: 'CHUA_HOAN_TAT', failedAt }` không còn dữ liệu staged (SF-M01-005-05). Du khách được báo tải chưa hoàn tất và có thể thử lại (spec-M01 §5.4).
  - **Biểu diễn trạng thái:** dòng `offlinePackages` chỉ tồn tại cho gói `SAN_SANG` (đúng một gói active mỗi tuyến; phiên bản cũ bị xóa khi chuyển, SF-M01-005-09). `DANG_TAI` và `CHUA_HOAN_TAT` chỉ nằm ở `packageCandidates`, store mà M02 không đọc. `CHUA_TAI` = không có dòng nào (spec-M01 §5.3 cho phép).
  - **Khôi phục khi mở app:** dòng candidate `DANG_TAI` mà lock của tuyến đang trống (tab tải đã đóng) là candidate mồ côi → xử lý như lỗi ở bước 6.
  - **Lưu trữ:** trước lần tải đầu tiên gọi `navigator.storage.persist()` (không bắt buộc thành công) và không tuyên bố lưu trữ được bảo đảm (tech-stack §4).
- **Rationale:** FR-M01-007, FR-M01-008, BR-M01-004…006, constitution IV/VI; Physical §11: "Activation is one transaction over candidate, package, resources, bytes and `activePackages`, accepted only for the current token".
- **Alternatives considered:** Ghi byte thẳng vào `imageBytes` trong lúc tải — candidate cùng version với gói không đọc được có thể đè key của nhau, và byte dở dang nằm trong store mà M02 đọc. Giữ dòng `offlinePackages` cho `DANG_TAI` — M02 phải tự lọc trạng thái, dễ lộ dữ liệu dở dang (FR-M01-013).

### R-09 — Tuần tự hóa thao tác gói và Start (nhiều tab)

- **Decision (Plan decision):** Dùng Web Locks API của trình duyệt (`navigator.locks`, không phải dependency):
  - `cpq:m01:package:{routeId}` (exclusive) bao trọn một thao tác Download/Update/Delete của tuyến. Yêu cầu với `ifAvailable: true`: nếu đang bận thì không bắt đầu việc thứ hai, UI giữ trạng thái đang chạy (FR-M01-009 "Repeated action must not create concurrent work"; SF-M01-005-11). Lock tự nhả khi tab đóng, nên R-08 dùng nó để nhận ra candidate mồ côi.
  - `cpq:m01:start` (exclusive, `ifAvailable: true`) bao một lần Start; lần bấm thứ hai khi Start đang chạy bị bỏ qua (FR-M01-012 "A repeated Start while one is in progress creates no second context"). Nút Start cũng bị vô hiệu trong lúc chạy, nhưng tính đúng không dựa vào React state (tech-stack §4).
  - Token trong transaction kích hoạt (R-08) vẫn là hàng rào cuối nếu hai tab cùng chạy.
  - Trình duyệt không có `navigator.locks`: dùng mutex trong tab + token; ghi rủi ro cho hai tab cùng lúc trên trình duyệt cũ.
- **Rationale:** tech-stack §4 "Multi-tab writes phải giữ uniqueness/atomicity bằng database transaction; không dựa vào React state"; MVP không có Cancel.
- **Alternatives considered:** Cờ "đang chạy" trong Dexie — không tự nhả khi tab bị đóng giữa chừng. `BroadcastChannel` tự viết — phải tự làm bầu chọn và phát hiện tab chết.

### R-10 — Cập nhật lười, `OUTDATED` và làm mới essential texts

- **Decision (Plan decision trong phạm vi FR-M01-010, FR-M01-014, SF-M01-005-08…14):**
  - **Phát hiện phiên bản mới:** mỗi lần đọc nguồn thành công (danh mục hoặc chi tiết) có dòng tuyến với `activeContentVersion` lớn hơn `contentVersion` của gói active → đặt `versionStatus = OUTDATED` cho gói đó (một transaction). Đây chỉ là biết sớm hơn để "display warning when known".
  - **Dựng candidate mới:** chỉ khi tuyến có gói được **mở** online (SCR-M01-003, hoặc bấm cập nhật ở SCR-M01-004), tuyến `HOAT_DONG`, và version nguồn lớn hơn version gói → chạy pipeline R-08 với gói cũ vẫn active. Tuyến không `HOAT_DONG` thì không dựng candidate (không chọn được, BR-M01-002).
  - **Essential texts:** mỗi lần đọc nguồn thành công có dòng tuyến hợp lệ của một tuyến đang có gói `SAN_SANG` → thay `routeEssentials` (name, startingPoint, participationRequirements?, safetyWarning?, `capturedAt` = thời điểm đọc) trong một transaction, chỉ khi gói active vẫn là gói đó. Đọc lỗi hoặc dòng không hợp lệ → giữ bản cũ và `capturedAt` cũ (FR-M01-010, FR-M01-014). Không bao giờ để gói sẵn sàng thiếu essentials (spec-M01 §6.4).
  - Đổi ngôn ngữ trong lúc tải không ảnh hưởng candidate: gói luôn chứa cả `vi` và `en` (BR-M01-001; checklist CHK023).
- **Rationale:** spec-M01 §4.4 "The saved essential texts are refreshed independently of the package version"; §4.8 state machine.
- **Alternatives considered:** Kiểm tra version định kỳ trong nền — trái "lazy update" và constitution VII (không có scheduler). Chỉ làm mới essentials khi mở chi tiết — bỏ qua dữ liệu đã đọc thành công ở danh mục, mà FR-M01-014 đòi làm mới "after a source read succeeds".

### R-11 — Start, handoff và thu hồi

- **Decision (Approved upstream: spec-M01 §4.5, Physical §11 "M01"; Plan decision về thứ tự bước):**
  1. Bấm "Bắt đầu" trên SCR-M01-003. Nếu tuyến cần gói (cờ của dòng tuyến đã biết, BR-M01-012) mà chưa có gói `SAN_SANG` → mở dialog quyết định offline (Tải / Tiếp tục không tải / Quay lại). Không chọn ngầm (FR-M01-006).
  2. Trong lock `cpq:m01:start`: thử đường online (R-05). Thành công và tuyến `HOAT_DONG` + snapshot hợp lệ → manifest lấy từ snapshot. Thành công nhưng tuyến `TAM_DONG`/`LUU_TRU` → thu hồi context hiện tại nếu cùng tuyến, chặn Start (US-M01-05). Nguồn không khả dụng → đường offline: gói active `SAN_SANG` (kể cả `OUTDATED`, SF-M01-006-03) của tuyến → manifest của gói; không có → chặn Start (FR-M01-011).
  3. Dựng context: `contractVersion = 3`; `handoffId = crypto.randomUUID()`; `authorizedAt` = giờ thiết bị lúc ghi, ISO-8601 UTC; `expiresAt = authorizedAt + 86 400 000 ms` đúng tuyệt đối; `authorizationStatus = AUTHORIZED`; `routeJourneyManifest` là bản sao giá trị của manifest (không chứa text/ảnh offline).
  4. Validate bằng schema `SelectedRouteContextV3`, rồi **một** transaction `put` vào `selectedRouteContext` slot `current`. Lỗi → context cũ nguyên vẹn (FR-M01-012).
  5. Chỉ sau khi commit mới điều hướng sang M02 (SF-M01-006-08).
  - **Thu hồi:** bất kỳ lần đọc nguồn thành công nào (danh mục, chi tiết, Start) thấy tuyến `TAM_DONG`/`LUU_TRU` → một transaction: nếu context hiện tại có `routeId` đó và `AUTHORIZED` thì đặt `REVOKED`, giữ nguyên các trường khác. Không đụng gói hay dữ liệu M02 (BR-M01-010, BR-M01-011). M01 không bao giờ đổi `authorizationStatus` vì thời gian trôi qua (BR-M01-015).
- **Rationale:** FR-M01-011, FR-M01-012, BR-M01-008, BR-M01-009, BR-M01-011, BR-M01-015, SC-M01-005, SC-M01-006.
- **Alternatives considered:** Sinh `handoffId` bằng thư viện UUID — `crypto.randomUUID()` có sẵn trong secure context (HTTPS và localhost). Dùng đồng hồ server cho `authorizedAt` — offline Start không có server; M02 so hạn bằng đồng hồ thiết bị (spec-M02 §5.1).

### R-12 — Ngôn ngữ và i18n

- **Decision (Approved upstream: spec-M01 BR-M01-001, spec-M02 BR-M02-024, tech-stack §4; Plan decision về cách làm):**
  - `LanguagePreference` lưu ở store `languagePreference` slot `current`; ghi bằng một transaction mỗi khi du khách chọn (FR-M01-001). Hook `useLanguagePreference()` dùng `liveQuery` của Dexie nên đổi ngay trong mọi tab.
  - **Ngôn ngữ hiển thị** = giá trị đã lưu; nếu chưa có: entry thường (route của M01) hiện panel chọn ngôn ngữ chặn toàn trang; entry link QR (trang của M02) dùng ngôn ngữ thiết bị: `navigator.language` bắt đầu bằng `vi` → `vi`, ngược lại `en`, và **không ghi** gì cho tới khi du khách bấm VI/EN (BR-M02-024).
  - `LanguageControl` (component VI/EN) và `resolveDisplayLanguage()` được export qua `src/modules/m01/index.ts` để M02 đặt trên trang link QR; mọi lần ghi vẫn đi qua code của M01, nên M01 vẫn là writer duy nhất.
  - Chữ giao diện M01 nằm trong hai từ điển có kiểu `src/modules/m01/i18n/vi.ts`, `en.ts` (cùng tập khóa, có test so khớp), câu chữ lấy từ bảng copy của screen spec SCR-M01-001…004. Từ điển được bundle vào JS, nên app shell precache đã chứa i18n (spec-M01 §9.3).
- **Rationale:** US-M01-01, FR-M01-001, SF-M01-001-01…04.
- **Alternatives considered:** Đọc `navigator.languages` toàn bộ danh sách — spec nói "the device language"; dùng ngôn ngữ chính là cách đọc trực tiếp nhất. Lưu ngôn ngữ thiết bị ngay khi vào bằng link QR — trái "until the visitor switches".

### R-13 — Danh mục, local view khi offline, gợi ý

- **Decision (Plan decision):**
  - **Local view gần nhất** = danh mục đọc thành công lần cuối trong phiên chạy hiện tại của app, giữ trong bộ nhớ (module state của M01). Physical §11 không có store danh mục và constitution VI cấm Workbox runtime-cache Data API, nên danh mục không được lưu bền. Khi mở app lạnh mà không có nguồn: trạng thái "Source unavailable" của SCR-M01-001; du khách vẫn mở được SCR-M01-004 (gói đã tải) và chi tiết tuyến từ gói (essentials + manifest, OQ-SCR-M01-003-002). Local view luôn mang nhãn dữ liệu cũ, không khẳng định là mới nhất (FR-M01-002).
  - Thứ tự thẻ và kết quả gợi ý: tên tuyến A→Z theo ngôn ngữ đang chọn bằng `Intl.Collator(languageCode)` (OQ-SCR-M01-001-001, OQ-SCR-M01-002-003); không chấm điểm.
  - Gợi ý: hàm thuần trên các tuyến chọn được: `timeTags ∋ t && groupTags ∋ g && experienceTags ∋ e`; thiếu hoặc sai enum ở bất kỳ nhóm nào → không chạy so khớp; 0 kết quả là hợp lệ, không nới tiêu chí (FR-M01-004, BR-M01-003, DAC-M01-018). `RecommendationContext` là state tạm (HC-007), không lưu.
- **Rationale:** FR-M01-002, FR-M01-004; giữ đúng store của Physical §11.
- **Alternatives considered:** Thêm store `catalogCache` trong Dexie — thêm cấu trúc lưu trữ mà Physical Schema không có (cần sửa Physical trước). Runtime-cache response Data API bằng Workbox — cấm bởi constitution VI.

### R-14 — PWA, app shell và điều phối cập nhật

- **Decision (Approved upstream: tech-stack §4, constitution VI, research M03 R-22; Plan decision về cấu hình):**
  - `vite-plugin-pwa` với `strategies: 'generateSW'`, `registerType: 'prompt'`. Precache (`globPatterns`) mọi JS/CSS/HTML/font/icon của build, gồm chunk lazy của M01 và M02 (cả chunk decoder QR của M02) để "offline ready" thật sự đúng (tech-stack §4). `navigateFallback: '/index.html'` để mọi route SPA, kể cả `/q/{qrIdentifier}`, mở được từ app shell khi offline nếu trình duyệt đã từng mở app (spec-M01 §9.3; BR-M02-025). `runtimeCaching` để trống: không cache Supabase API, Auth, response quản trị hay signed media.
  - **Điều phối cập nhật** (`src/app/pwa/updateCoordinator.ts`, shell dùng chung): mỗi việc "đang bận" giữ một Web Lock **shared** `cpq:busy` trong suốt thời gian bận: M01 giữ khi có thao tác gói chạy (`registerPackageOperation`), M03 qua `registerUnsavedForm(id)` (tên của R-22 M03), M02 khi có phiên đang chạy (package 002). Khi có bản mới, coordinator chỉ gọi `updateSW(true)` sau khi người dùng đồng ý **và** lấy được lock exclusive `cpq:busy` với `ifAvailable: true`; không lấy được thì hoãn và giữ lời nhắc. Cách này phối hợp mọi tab trước activation (tech-stack §4). Ngoài lock, coordinator có `registerBusyCheck(fn: () => Promise<boolean>)` cho trạng thái bận được **lưu bền** mà có thể không có tab nào giữ lock, ví dụ phiên M02 `DANG_DIEN_RA` khi chỉ mở tab M01: trước khi áp dụng, coordinator gọi mọi hàm đã đăng ký; một hàm trả `true` (hoặc lỗi) → hoãn — quyết định D-02, 2026-10-29.
- **Rationale:** constitution VI "PWA update mode is prompt; the service worker MUST NOT auto-reload when an M02 session, package operation, or unsaved M03 form is active".
- **Alternatives considered:** `injectManifest` với service worker tự viết — không cần cho phạm vi precache-only. Chỉ kiểm tra trong tab hiện tại — tab khác có thể đang tải gói.

### R-15 — Cấu hình công khai

- **Decision (Approved upstream: environment.md §4, §7; research M03 R-14):** M01 chỉ dùng `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (qua `src/shared/supabase/`) và `VITE_APP_VERSION`; không cần `QR_PUBLIC_BASE_URL`. Hằng `MEDIA_BUCKET` (R-06) là cấu hình công khai, không phải secret. Không biến `VITE_*` mới. Không có secret nào trong M01.
- **Alternatives considered:** Biến `VITE_DATA_SOURCE=fake` cho E2E — tạo biến cấu hình mới; network mock của Playwright làm được việc tương đương (R-16).

### R-16 — Chiến lược test và vị trí file

- **Decision (Approved upstream: tech-stack §8, §13, environment.md §11; Plan decision về vị trí, giống research M03 R-23):**
  - Unit, contract, component (Vitest + Testing Library, jsdom): `*.test.ts(x)` đặt cạnh mã nguồn trong `src/`. Contract test: fixture synthetic hợp lệ/không hợp lệ cho 3 schema M01 sản xuất (Required/Conditional/Optional của spec-M01 §5.3), và fixture consumer cho 2 schema M03 (khớp test M03).
  - **Test Dexie (transaction kích hoạt gói, ghi context, thu hồi, xóa gói):** jsdom không có IndexedDB. Đề xuất dev dependency `fake-indexeddb` (chỉ dùng trong test, không vào bundle) để chạy các test này trong Vitest. **Chưa có trong tech-stack → cần người duyệt plan xác nhận** (Complexity Tracking #4). Nếu không được duyệt: các test này chuyển sang Playwright (trình duyệt thật), chậm hơn nhưng không cần dependency mới.
  - E2E (Playwright) trong `e2e/m01/`: build `vite build --mode e2e` + `vite preview` (có service worker); `page.route()` giả lập Data API (`/rest/v1/published_routes`, `/rest/v1/active_journey_snapshots`) và Storage (`/storage/v1/object/sign/…`, URL đã ký) bằng fixture synthetic; `context.setOffline(true)` cho các kịch bản offline. File `.env.e2e` chỉ chứa giá trị giả an toàn (URL `http://127.0.0.1:54321`, key giả).
  - Tích hợp thật với stack Supabase local: chỉ sau khi M03 giai đoạn B có migration (R-01); trước đó ghi `NOT RUN`.
  - Kiểm tra trên thiết bị thật (Android/iOS: offline, eviction, ứng xử trình duyệt) là thủ công; Playwright không thay thế (tech-stack §13). Không test trên Shared Backend; không dữ liệu thật.
- **Alternatives considered:** Vitest browser mode — cần thêm `@vitest/browser` và provider, cũng là dependency mới. Thư mục `tests/` gốc — runbook §1.2 xếp `tests/**` là chưa mở (lý do giống R-23 M03).

### R-17 — Mục tiêu hiệu năng

- **Decision (Plan decision):** Không đặt mục tiêu hiệu năng: spec-M01 §10.2 ghi "Performance targets (catalog open time, Start time); the MVP specification sets none" (checklist CHK024). Chỉ giữ các ràng buộc kỹ thuật không đổi hành vi: lazy-load từng màn M01; danh mục chỉ một request; ảnh thẻ dùng `loading="lazy"`; tải byte ảnh của gói tuần tự theo lô nhỏ (tối đa 4 request song song) để không làm nghẽn thiết bị yếu. Con số 4 là lựa chọn kỹ thuật, có thể đổi.
- **Alternatives considered:** Đặt mục tiêu như M03 R-24 — M03 có BR-M03-G07 giao cho thiết kế kỹ thuật; M01 thì spec nói rõ không có mục tiêu.

### R-18 — Định dạng hiển thị (deferred design work của spec-M01 §10.2)

- **Decision (Plan decision, theo bảng copy của SCR-M01-003):** Dung lượng ước tính = `estimatedOfflineSizeBytes / 1 048 576` (1 MB = 1 048 576 byte như spec-M03 §5.3), làm tròn lên một chữ số thập phân, tối thiểu `0.1`; hiển thị theo câu copy "Dung lượng ước tính: khoảng {số} MB." / "Estimated size: about {n} MB."; vắng → "Chưa có thông tin dung lượng." / "Size not available.". Thời điểm lưu (`routeEssentials.capturedAt`) hiển thị bằng `Intl.DateTimeFormat(languageCode, { dateStyle: 'short', timeStyle: 'short' })` theo múi giờ của thiết bị. Tiến độ tải: chỉ hiện trạng thái `DANG_TAI` (spec-M01 §10.2 "at least the package state"); có thể thêm "n/N ảnh" như chi tiết trình bày, không bắt buộc.
- **Alternatives considered:** Hiển thị theo múi giờ `Asia/Ho_Chi_Minh` cố định — đó là hằng báo cáo của M03 (environment.md §8), không phải quy tắc hiển thị cho du khách.

### R-19 — Accessibility và design system

- **Decision (Approved upstream: CLAUDE.md, design-system.md; deferred theo spec-M01 §10.2):** Token, font, khoảng cách, bo góc từ design-system; icon từ `assets/icons/`. Mục tiêu review (không phải requirement đã đạt): WCAG 2.1 AA, vùng chạm ~44×44 px, tương phản 4.5:1, focus nhìn thấy, chip gợi ý dùng được như radio group (OQ-SCR-M01-002-002), trạng thái gói không chỉ biểu đạt bằng màu (screen spec §8). Kiểm chứng bằng review thủ công và kiểm tra tự động trong component test (role/label); không tuyên bố đạt chuẩn khi chưa đo.

## 3. Best practices áp dụng (tóm tắt)

| Công nghệ | Thực hành giữ trong plan | Nguồn |
|---|---|---|
| Dexie / IndexedDB | Một database, một chuỗi version; network ngoài transaction; kiểm tra cuối + chuyển con trỏ trong transaction ngắn; `Blob` cho byte ảnh | tech-stack §4; Physical §11 |
| Web Locks | Lock exclusive theo tuyến và cho Start; lock shared cho "đang bận" khi cập nhật service worker; lock tự nhả khi tab đóng | R-09, R-14 |
| Workbox (`generateSW`) | Precache app shell + i18n + chunk; `navigateFallback`; không `runtimeCaching` cho API/Auth/media đã ký; cập nhật kiểu prompt | tech-stack §4; constitution VI |
| supabase-js | Một client dùng chung (publishable key); `schema('api')`; `abortSignal` cho timeout; signed URL cho bucket private | Physical §7.1, §9 |
| Zod | Schema contract dùng chung cho producer và consumer; validate khi đọc và khi ghi | tech-stack §6; Physical §11 "Validation" |
| React Router | Route lazy; điều hướng sang M02 chỉ sau commit | tech-stack §3; SF-M01-006-08 |
| Test | Fixture synthetic; network mock; `NOT RUN` khi không chạy được | environment.md §11 |

## 4. Điểm phối hợp với package khác

| # | Điểm | Package liên quan | Ghi chú |
|---|---|---|---|
| P-01 | `src/shared/db/visitorDb.ts` khai báo cả 3 store M02 (key/index đúng Physical §11) | 002 | 002 dùng lại khai báo này, không tạo database thứ hai; đổi schema phải tăng version chung |
| P-02 | Bề mặt công khai `src/modules/m01/index.ts` (control ngôn ngữ, hàm đọc dữ liệu dùng chung) | 002 | 002 chỉ import từ đây (R-07, R-12) |
| P-03 | `PATHS.m02SessionEntry` trong `src/app/paths.ts` | 002 | 002 đã chốt `/trip`; M01 chỉ dùng hằng |
| P-04 | Update coordinator, lock `cpq:busy` và `registerBusyCheck` | 002, 003 | 003 đã đặt tên `registerUnsavedForm(id)` (R-22 M03); 002 đăng ký `hasRunningSession()` qua `registerBusyCheck` (D-02) |
| P-05 | Cấu hình PWA trong `vite.config.ts` (precache gồm chunk M02, `navigateFallback` cho `/q/*`) | 002, 003 | Package nào code shell trước thì tạo; nội dung theo R-14 |
| P-06 | File tooling gốc và `e2e/` | 003 | Cùng quyết định với Complexity #2 của plan M03 |

## 5. Đối chiếu contract với phía M03

Đối chiếu [plan M03](../003-m03-operations-content-administration/plan.md), [data-model M03](../003-m03-operations-content-administration/data-model.md) §3, §10, [publication-public-contract](../003-m03-operations-content-administration/contracts/publication-public-contract.md) và [media-storage-contract](../003-m03-operations-content-administration/contracts/media-storage-contract.md) với spec-M01 §5.3 và spec-M03 §5.1.

- **Tên, version, ranh giới:** khớp. Hai bên dùng đúng "Published Route projection" và `JourneySnapshot`; M03 là producer, M01 là consumer chỉ đọc; M02 nhận gián tiếp qua `SelectedRouteContext v3`; không có hậu tố version cho hai contract này ở cả hai phía. Bảng field path của spec-M01 §5.3 và spec-M03 §5.1 trùng khớp từng dòng: Published Route 47 field path (25 field cấp trên cùng), `JourneySnapshot` 28 field path (8 field cấp trên cùng); contract M03 §2–§3 có đủ các field này với cùng presence.
- **Điểm cần lưu ý (không phải lệch tên/version/ranh giới; plan M03 không bị sửa):**

| ID | Điểm | Tác động | Đề xuất |
|---|---|---|---|
| L-01 | Physical §7.1 và contract M03 §2 không cố định tên cột của view `api.published_routes`/`api.active_journey_snapshots` (snake_case cột + camelCase trong `jsonb`, hay camelCase toàn bộ) | Adapter M01 phải ánh xạ đúng; sai thì mọi dòng bị coi là không hợp lệ | Đặt hàm ánh xạ dòng → contract cạnh schema dùng chung (`src/shared/contracts/publishedRoute.ts`, `journeySnapshot.ts`, file do M03 sở hữu) để producer và consumer dùng một hàm. **Đã chốt 2026-10-30** theo Physical §3: cột `snake_case` của key cấp cao nhất, giá trị lồng `jsonb` giữ `camelCase`, cột nullable của trường Optional → bỏ property khi `null` (tasks M01 T014, M03 T184) |
| L-02 | Contract M03 §2 ghi giới hạn `≤ NAME_MAX_CHARS`… ở cột ghi chú; spec-M03 §5.3 nói consumer không kiểm các giới hạn này | Nếu schema dùng chung kiểm giới hạn, M01 sẽ từ chối dữ liệu khi M03 nới hằng provisional | Schema dùng chung chỉ kiểm shape/presence/enum/ràng buộc chéo; giới hạn nằm ở `src/modules/m03/config/limits.ts` (R-19 M03) — khớp R-04 ở đây |
| L-03 | spec-M01 §5.3 gọi `sourceRef` là "public image resource reference"; phía M03 là bucket private + signed URL cho `anon` (Physical §9, media-storage §4) | Không đổi hành vi; M01 phải tạo signed URL, và chỉ hoạt động khi policy Storage của M03 giai đoạn B có mặt | Giữ như R-06; ghi phụ thuộc vào M03 giai đoạn B (Complexity #1) |
| L-04 | Contract M03 §2 viết ngưỡng `timeTags` là "91–180", spec ghi "> 90–180" | Tương đương vì `durationMin` là Integer; M01 không tính lại `timeTags` (spec-M01 §4.2) | Không cần làm gì |
