# Research — M02 Field Quest Experience

**Package**: `specs/002-m02-field-quest-experience` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

Tài liệu Phase 0 của `/speckit-plan`. Mỗi mục ghi **Decision / Rationale / Alternatives considered**. Đây là quyết định kỹ thuật (Layer 3), không phải requirement: hành vi lấy từ [spec-M02 v3.3](../../docs/spec/spec-M02.md); lựa chọn công nghệ lấy từ [tech-stack.md](../../docs/architecture/tech-stack.md), cấu hình từ [environment.md](../../docs/architecture/environment.md), runtime placement từ [system-configuration.md](../../docs/architecture/system-configuration.md); store trình duyệt từ [Physical Schema](../../data/06-physical-schema.md) §11. Producer đầu vào: plan M01 đã duyệt ([specs/001](../001-m01-route-planning-preparation/plan.md)) và plan M03 đã duyệt ([specs/003](../003-m03-operations-content-administration/plan.md)). Nếu một mục dưới đây mâu thuẫn với các nguồn đó, nguồn thắng.

Phân loại trạng thái (giống research M01, M03): **Approved upstream** — đã chốt ở architecture, Physical Schema hoặc plan producer; **Plan decision** — quyết định kỹ thuật của plan này; **Provisional** — giá trị provisional của spec, giữ nguyên nhãn.

## 1. Technical Context — các mục cần làm rõ và cách giải quyết

| # | Mục ban đầu là NEEDS CLARIFICATION | Giải quyết tại |
|---|---|---|
| 1 | M02 có backend riêng không; phụ thuộc vào M01 và giai đoạn B của M03 | R-01 |
| 2 | Phiên bản dependency; decoder QR; thư viện test IndexedDB | R-02, R-19 |
| 3 | Path của các màn M02 và `PATHS.m02SessionEntry` mà M01 chờ | R-03 |
| 4 | Ai sở hữu schema `sessionSyncRecord.ts`; phạm vi kiểm tra phía consumer | R-04 |
| 5 | Đọc dữ liệu M01 (ngôn ngữ, context, gói) mà vẫn chỉ-đọc; phân biệt "không có context" với "context không hợp lệ" | R-05, §5 D-01 |
| 6 | Thứ tự xử lý khi vào phiên: tự đóng, khôi phục, tạo mới, thay thế; một transaction | R-06 |
| 7 | Phân tích link QR và so base `QR_PUBLIC_BASE_URL` | R-07 |
| 8 | Bảng quyết định ghi lượt ghé / chọn nguồn nội dung; `LOOKUP_TIMEOUT_SECONDS` (provisional 8 s) | R-08 |
| 9 | Tự đóng phiên quá 24 giờ: thời điểm kiểm, tính idempotent | R-09 |
| 10 | `endedAt`/`checkedInAt` khi đồng hồ thiết bị lùi (giữ contract hợp lệ) | R-10 |
| 11 | Gửi `SessionSyncRecord`: transport, ánh xạ response, khi nào thử lại, một người gửi giữa nhiều tab | R-11 |
| 12 | Hiển thị media online, lọc audio/video theo ngôn ngữ, ảnh offline từ `Blob` | R-12 |
| 13 | Scanner: thư viện, quyền camera, lazy-load | R-13 |
| 14 | Hoãn cập nhật service worker khi có phiên đang chạy (kể cả khi không có tab M02 mở) | R-15 |
| 15 | Hiệu năng trang `/q/…` và dung lượng lưu cục bộ (spec-M02 §10: "left to technical design"; checklist CHK025) | R-17 |
| 16 | Giữ hay xóa mục hàng đợi `SYNCED`, phiên terminal cũ | R-18 |

Sau Phase 0 không còn mục `NEEDS CLARIFICATION` mở. Điểm phối hợp ở §4; điểm lệch/cần chốt với M01 và M03 ở §5.

## 2. Quyết định

### R-01 — Phạm vi code và phụ thuộc

- **Decision (Plan decision):** M02 không có backend riêng. Toàn bộ M02 nằm trong `src/modules/m02/` (UI, scanner, Dexie cho 3 store của M02, adapter, contract). M02 không tạo migration, RPC, Edge Function hay policy. Ba phụ thuộc bên ngoài:
  - **M03 giai đoạn B (bị chặn):** `api.lookup_qr`, Edge `session-intake`, policy đọc Storage (Physical §7.1, §7.2, §9). Trước khi mở, M02 chạy với adapter giả và network mock.
  - **M01 (package 001):** `src/shared/db/visitorDb.ts`, bề mặt đọc `src/modules/m01/index.ts`, `LanguageControl`, app shell/PWA (`navigateFallback` cho `/q/*`, precache chunk scanner) — plan M01 R-07, R-12, R-14.
  - **Shell dùng chung:** `src/app/paths.ts`, update coordinator.
- **Rationale:** spec-M02 §1 "Dependencies"; AGENTS.md §2 chưa mở backend.
- **Alternatives considered:** M02 tự giả lập lookup trong client lâu dài — không đáp ứng FR-M02-011, FR-M02-018.

### R-02 — Toolchain và dependency

- **Decision (Approved upstream + Plan decision):** như M01 (Node.js 24 LTS, React, React Router data mode, supabase-js, Zod, Dexie, Vite, `vite-plugin-pwa`, Vitest, Testing Library, jsdom, Playwright) cộng `@zxing/browser` + `@zxing/library` cho decode QR (tech-stack §3, chỉ M02). Không thêm thư viện state, i18n, media player. Phiên bản pin khi task setup cài thật (tech-stack §13). `fake-indexeddb` (dev) dùng chung đề xuất của plan M01 Complexity #4.
- **Alternatives considered:** Chỉ dùng `BarcodeDetector` của trình duyệt — tech-stack loại vì không có trên mọi trình duyệt (iOS Safari).

### R-03 — Kiến trúc frontend và path

- **Decision (Plan decision):**

  | Path | Màn hình | Ghi chú |
  |---|---|---|
  | `/trip` | SCR-M02-001 Phiên trải nghiệm & Quét QR | `PATHS.m02SessionEntry = '/trip'` (điểm M01 điều hướng tới sau khi commit context); khi không có phiên: chế độ khách tự do với nút Quét |
  | `/trip/qr/:qrIdentifier` | SCR-M02-002 Nội dung điểm tham quan | nhận kết quả xử lý quét qua router state; tải lại trang → chế độ xem (R-08 §"Xem lại") |
  | `/trip/end` | SCR-M02-003 Kết thúc phiên | dialog xác nhận và màn kết quả |
  | `/q/:qrIdentifier` | SCR-M02-004 Trang mở từ mã QR | không qua guard ngôn ngữ, không bước chặn (BR-M02-024) |

  Scanner là lớp toàn màn hình mở trên `/trip` (OQ-SCR-M02-001-002), không có path riêng. M02 nằm trọn trong `src/modules/m02/`; không import file nội bộ của M01 hay M03 — chỉ `src/modules/m01/index.ts` và `src/shared/*`. Style: CSS Modules + token của design-system (nhóm `--color-m02-scanner-*` cho scanner, nhóm chung cho màn đọc); icon chỉ từ `assets/icons/`; dùng skill `frontend-design` khi implement (CLAUDE.md).
- **Rationale:** tech-stack §2–§3; constitution II.
- **Alternatives considered:** Gộp nội dung vào `/trip` bằng state — mất khả năng mở lại một điểm đã quét bằng đường dẫn và nút Back của trình duyệt.

### R-04 — Contract dùng chung

- **Decision (Approved upstream: tech-stack §6, research M03 R-04, plan M01 R-04; Plan decision về sở hữu):**
  - **Consume từ M01:** `languagePreference.ts`, `selectedRouteContext.ts` (`SelectedRouteContextV3`), `offlinePackage.ts` — qua các hàm đọc của M01, không đọc thẳng store.
  - **Consume từ M03:** `liveQrLookup.ts` (`LiveQrLookupResult`, `LiveStationContent`).
  - **Produce:** `sessionSyncRecord.ts` (`SessionSyncRecord`, Zod `.strict()`). Plan M03 liệt kê file này trong 4 schema dùng chung và Edge `session-intake` import nó; spec-M02 §5.1 và spec-M03 §5.1 có cùng shape. Quyết định: file **đồng sở hữu**; package nào code trước tạo theo spec; mọi thay đổi cần cả hai spec đổi trước (§5 L-01).
  - **Transport ≠ canonical:** `PendingSyncItem.record` chứa đúng giá trị `SessionSyncRecord`; `PlaySession`, `CheckpointVisit` có kiểu dòng Dexie riêng trong `src/modules/m02/storage/`. `LiveQrLookupResult` không bao giờ được lưu (spec-M02 §5.1).
  - Phía consumer không kiểm giới hạn độ dài/số phần tử (spec-M03 §5.3, câu cuối; giống M01 R-04). Body lookup không qua schema = lỗi nguồn, không phải `INVALID` (contract M03 live-qr-lookup §4).
- **Alternatives considered:** M02 tự khai báo kiểu lookup — hai định nghĩa dễ lệch (constitution "Contract & Traceability").

### R-05 — Đọc dữ liệu M01 (chỉ-đọc)

- **Decision (Approved upstream: plan M01 R-07, R-12):** M02 dùng `readLanguagePreference()`/`useLanguagePreference()`, `resolveDisplayLanguage()`, `LanguageControl`, `readSelectedRouteContext()`, `readActiveOfflinePackage(routeId)`, `findOfflineResource(routeId, qrIdentifier)`, `readPackageImage(routeId, contentVersion, sourceRef)`. M02 không có hàm ghi nào vào store M01 (FR-M02-020). M02 bỏ qua `offlineRouteMap` và `routeEssentials` của gói (spec-M02 §5.1).
  - M02 cần phân biệt "không có context" (khôi phục phiên hoặc chế độ khách tự do) với "context có nhưng không hợp lệ, ví dụ version 2" (thông báo rõ, FR-M02-001). Plan M01 (R-07; contract `selected-route-context-v3` §3) đã chốt `readSelectedRouteContext()` trả kết quả phân biệt `{ kind: 'NONE' } | { kind: 'INVALID' } | { kind: 'OK', value }` (§5 D-01).
  - Việc đọc context khi tạo phiên chạy **bên trong** transaction tạo phiên của M02 (Dexie dùng lại transaction bao ngoài khi store `selectedRouteContext` nằm trong phạm vi), để kiểm "chưa dùng" và tạo phiên là nguyên tử (Physical §11 "M02 start or replacement").
- **Alternatives considered:** M02 đọc thẳng store `selectedRouteContext` — bỏ qua kiểm tra contract ở ranh giới M01.

### R-06 — Vào phiên: tự đóng, khôi phục, tạo, thay thế

- **Decision (Approved upstream: Physical §11; Plan decision về thứ tự):** Khi vào `/trip`:
  1. Áp tự đóng phiên quá 24 giờ (R-09).
  2. Đọc context (R-05) và phiên `DANG_DIEN_RA` hiện có (nếu có).
  3. Quyết định:

  | Context | Phiên đang chạy | Kết quả |
  |---|---|---|
  | `OK`, `handoffId` = `sourceHandoffId` của phiên đang chạy | có | khôi phục (US-M02-01 mục 4) |
  | `OK`, `handoffId` đã là `sourceHandoffId` của một phiên terminal | bất kỳ | từ chối: "bắt đầu lại từ M01"; phiên đang chạy (nếu có) vẫn mở được |
  | `OK`, `REVOKED` hoặc giờ thiết bị ≥ `expiresAt` | bất kỳ | từ chối như trên (BR-M02-017) |
  | `OK`, `AUTHORIZED`, chưa dùng, giờ thiết bị < `expiresAt` | không | tạo phiên |
  | như trên | có (handoff khác) | thay phiên (FR-M02-017) |
  | `INVALID` (gồm version 2) | bất kỳ | từ chối với thông báo rõ; không chuyển đổi (FR-M02-001) |
  | `NONE` | có | khôi phục |
  | `NONE` | không | chế độ khách tự do (nút Quét, SF-M02-008-01) |

  - **Tạo/thay thế = một Dexie transaction** `rw` trên `playSessions`, `checkpointVisits`, `pendingSyncItems` và đọc `selectedRouteContext`: đọc lại context và kiểm lại mọi điều kiện; kiểm `sourceHandoffId` chưa dùng (unique index là hàng rào cuối giữa các tab — `ConstraintError` = đã dùng); nếu có phiên đang chạy: đặt `BO_DO`, `endedAt` (R-10), dựng và xếp `SessionSyncRecord` của phiên cũ; thêm phiên mới (`sessionId = crypto.randomUUID()`, `startedAt` = giờ thiết bị, `journeyCheckpoints` = bản sao giá trị của `routeJourneyManifest.checkpoints`). Lỗi bất kỳ → rollback, phiên cũ vẫn chạy (BR-M02-013).
  - Mọi chuyển sang `DANG_DIEN_RA` chỉ xảy ra trong transaction có kiểm phiên đang chạy, nên tối đa một phiên mỗi trình duyệt (FR-M02-002; transaction `rw` trên cùng store được IndexedDB tuần tự hóa giữa các tab).
  - Sau khi có phiên: hiện câu gợi ý bắt đầu phiên (spec-M02 §5.1 "Session start hint"; SF-M02-001-07).
- **Rationale:** FR-M02-001…005, 017; BR-M02-001, 002, 003, 013, 017.
- **Alternatives considered:** Tạo phiên mới rồi mới đóng phiên cũ ở transaction thứ hai — vi phạm all-or-nothing.

### R-07 — Phân tích link QR

- **Decision (Approved upstream: BR-M02-023, M03 BR-M03-B04; Plan decision về cách so):**
  - `QR_PUBLIC_BASE_URL` đọc từ `VITE_QR_PUBLIC_BASE_URL` (tên do research M03 R-14 chốt; validate ở `src/shared/config/`: không có `/` cuối, HTTPS khi build Production).
  - **Trình quét trong app:** chuỗi decode được chấp nhận khi `new URL(text)` thành công, `origin` và phần path gốc trùng đúng với base, path còn lại đúng là `/q/{segment}` với một đoạn không rỗng, không có query và fragment. `qrIdentifier = decodeURIComponent(segment)`. Mọi trường hợp khác → thông báo `INVALID` của §5.1, **không** lookup (FR-M02-026, DAC-M02-011). M02 không kiểm định dạng identifier (chuỗi opaque).
  - **Trang `/q/:qrIdentifier`:** identifier lấy từ đoạn path cuối; trang luôn chạy trên origin hiện tại nên không có so base.
- **Rationale:** link in trên tem chỉ có đúng một tham số đường dẫn (contract M03 live-qr-lookup §5).
- **Alternatives considered:** So khớp bằng `startsWith` chuỗi — chấp nhận nhầm `https://example.vn.evil/…`; cho phép query — link in ra không bao giờ có query.

### R-08 — Xử lý một lần quét: ghi lượt ghé và chọn nguồn nội dung

- **Decision (Approved upstream: BR-M02-005, 008, 009, 015, 018, 020; Provisional: `LOOKUP_TIMEOUT_SECONDS` = 8, spec-M02 §9):** Hàm `processScan(qrIdentifier, origin: 'scanner' | 'link')`:
  1. Đọc lại phiên đang chạy từ Dexie (tab khác có thể đã đổi, BR-M02-002). Tìm `journeyCheckpoint` có `qrIdentifiers ∋ qrIdentifier`.
  2. Nếu `navigator.onLine !== false`: gọi lookup (`routeId` của phiên nếu có, không gửi khi khách tự do — BR-M02-019) với `AbortController` 8 s (**provisional**). Response lỗi, timeout hoặc body không qua schema = **lỗi nguồn**.
  3. Bảng quyết định ([contracts/scan-resolution-contract.md](contracts/scan-resolution-contract.md) §2 là bản đầy đủ):

     | Đường | Kết quả | Ghi lượt ghé | Nội dung |
     |---|---|---|---|
     | online | `VALID`, có phiên, checkpoint (theo mã đóng băng hoặc `content.checkpointId`) thuộc journey | có (nếu chưa có) | live |
     | online | `VALID`, không thuộc journey hoặc không có phiên | không | live (+ gợi ý khách tự do nếu không phiên) |
     | online | `TEMPORARILY_CLOSED` | không | thông báo tạm đóng |
     | online | `INVALID` | không | thông báo mã không hợp lệ |
     | offline / lỗi nguồn | có phiên, mã trong journey đóng băng | có (nếu chưa có) | gói (`OFFLINE_REQUIRED`) hoặc "không có nội dung" |
     | offline / lỗi nguồn | còn lại | không | "Cần có kết nối mạng…" |

  4. **Ghi lượt ghé** là một transaction: thêm `CheckpointVisit { sessionId, checkpointId, qrIdentifier, checkedInAt }` nếu `[sessionId+checkpointId]` chưa có; trả về `{ created, visit }`. Lượt ghé được commit **trước** khi điều hướng sang nội dung; lỗi hiển thị sau đó không gỡ nó (SC-M02-004). `created = true` cho checkpoint có `sequence` lớn nhất → mở câu hỏi kết thúc một lần (BR-M02-021).
  5. Lỗi nguồn với mã trong journey: hiện thông báo "Chưa tải được nội dung mới…" của §5.1 rồi nội dung gói nếu có. `navigator.onLine === false` được xử lý như lỗi nguồn (cùng nhánh).
  - **Gói thiếu resource khi online:** nhánh online luôn lookup trước nên đã "hỏi M03 riêng mã này"; gói chỉ được dùng khi lookup lỗi, và khi đó hành xử như offline (BR-M02-018). Gói không bao giờ bị đổi.
  - **Xem lại** (chạm điểm đã quét, hoặc tải lại `/trip/qr/:id`): chọn nguồn nội dung như bước 2–3 nhưng **không** ghi lượt ghé; hiện `checkedInAt` gốc (FR-M02-009).
- **Rationale:** FR-M02-006…013, 021, 022; SC-M02-002, 004, 008, 009, 012, 014.
- **Alternatives considered:** Ghi lượt ghé sau khi nội dung tải xong — vi phạm "before the content is shown" và SC-M02-004.

### R-09 — Tự đóng phiên quá 24 giờ

- **Decision (Approved upstream: BR-M02-022; Plan decision về trigger):** `autoEndForgottenSession()` chạy khi shell khởi động, khi `document.visibilityState` chuyển sang `visible`, và luôn trước khi xử lý handoff ở `/trip` hoặc lần quét ở `/q/…`. Một transaction: nếu phiên còn `DANG_DIEN_RA` và `now − startedAt > 24 h` (giờ thiết bị, nghiêm ngặt "more than") → `HOAN_TAT` nếu checkpoint `sequence` lớn nhất đã có lượt ghé, ngược lại `BO_DO`; `endedAt` = `checkedInAt` mới nhất hoặc `startedAt`; dựng và xếp `SessionSyncRecord`. Kiểm lại trạng thái trong transaction nên chạy lặp vô hại. Thông báo của §5.1 hiện một lần trên màn đang mở.
- **Rationale:** FR-M02-024; SC-M02-016; checklist CHK008.
- **Alternatives considered:** Hẹn giờ chạy nền — không có trên trình duyệt đã đóng và trái constitution VII.

### R-10 — Thời điểm khi đồng hồ thiết bị lùi

- **Decision (Plan decision, kỹ thuật):** Để contract luôn hợp lệ (`endedAt ≥ startedAt`, `checkedInAt` trong khoảng phiên — spec-M02 §5.1, M03 BR-M03-J02):
  - `checkedInAt = max(now, startedAt)`.
  - Kết thúc bằng xác nhận hoặc thay phiên: `endedAt = max(now, checkedInAt mới nhất, startedAt)`.
  - Tự đóng: đúng quy tắc BR-M02-022 (đã thỏa sẵn).
  - Mọi DateTime lưu dạng ISO-8601 UTC (`toISOString()`).
- **Rationale:** M03 từ chối bản ghi sai khoảng thời gian thành `INVALID` → `CONFLICT` vĩnh viễn; kẹp giá trị chỉ xảy ra khi đồng hồ lùi, không đổi hành vi khi đồng hồ đúng (spec-M02 §9 giả định đồng hồ đủ chính xác).
- **Alternatives considered:** Không kẹp — một lần chỉnh giờ làm mất vĩnh viễn bản ghi báo cáo.

### R-11 — Đồng bộ terminal

- **Decision (Approved upstream: contract M03 session-intake; Plan decision về lịch gửi và ánh xạ ngoài bảng của M03):**
  - **Dựng bản ghi:** trong chính transaction chuyển terminal (Physical §11 "Terminal transition"): `visitedCheckpoints` = mọi lượt ghé của phiên, nối với journey đóng băng để lấy `checkpointName.vi` (chuỗi) và `sequence`, sắp theo `sequence`; validate bằng schema strict; ghi `PendingSyncItem { sessionId, record, syncStatus: 'PENDING' }`. Không có tên, tài khoản, định danh thiết bị, GPS (SC-M02-007).
  - **Transport:** `supabase.functions.invoke('session-intake', { body: record })` (POST tới Edge, publishable key). Timeout kỹ thuật `SYNC_REQUEST_TIMEOUT_SECONDS` = 30 (**hằng kỹ thuật của plan, không phải business rule**).
  - **Ánh xạ:** body `result` là `ACCEPTED` hoặc `IDENTICAL` → `SYNCED`; `CONFLICT` hoặc `INVALID` (HTTP 409/422/413 theo M03) → `CONFLICT`, dừng tự gửi. **Mọi trường hợp khác** (mạng, timeout, 5xx, 429, 4xx không có `result` hợp lệ, body không đọc được) → giữ `PENDING` (§5 L-02). Chỉ `syncStatus` được cập nhật; `record` không bao giờ bị ghi lại (BR-M02-010).
  - **Khi gửi:** khi shell khởi động, khi trang hiện lại, khi có sự kiện `online`, ngay sau commit terminal, và khi trang đang hiện: thử lại với giãn cách 30 s → 1 → 2 → 5 phút (giữ 5 phút). Không background sync sau khi đóng trình duyệt (constitution VI).
  - **Một người gửi:** Web Lock `cpq:m02:sync` exclusive với `ifAvailable: true`; gửi tuần tự từng mục `PENDING`.
  - **Hiển thị:** SCR-M02-003 hiện chờ gửi/đã gửi/lỗi; SCR-M02-001 hiện một dòng E-SCR-M02-001-22 khi mục của chuyến kết thúc gần nhất là `CONFLICT` và chưa có chuyến mới (OQ-SCR-M02-003-002). Không có thao tác của du khách để thử lại, sửa hay xóa (BR-M02-011).
- **Rationale:** FR-M02-018; BR-M02-010, 011; SC-M02-006, 007.
- **Alternatives considered:** Coi mọi 4xx là `CONFLICT` — lỗi cấu hình/triển khai tạm thời (401, 404) sẽ khóa vĩnh viễn bản ghi hợp lệ. Background Sync API — không có trên iOS và trái constitution VI.

### R-12 — Nội dung và media

- **Decision (Approved upstream: BR-M02-009, 016, 026; Physical §9; Plan decision về hiển thị):**
  - **Online (`VALID`):** ảnh và audio/video qua signed URL tạo bằng `anon` từ `sourceRef` (bucket `MEDIA_BUCKET`, hằng của `src/shared/config/`; giống M01 R-06). Audio/video dùng `<audio>`/`<video controls preload="none">`, không autoplay (FR-M02-011). Danh sách hiển thị = các `mediaResources` có `spokenLanguage` bằng ngôn ngữ hiện tại cộng `NONE`, theo thứ tự nhận; nhãn "Âm thanh {n}"/"Audio {n}", "Video {n}" đánh số trong từng loại (OQ-SCR-M02-002-002). Đổi VI/EN tính lại danh sách; phần tử không còn trong danh sách bị gỡ nên dừng phát. Không có tệp khớp → không có điều khiển media.
  - **Gói (offline/lỗi nguồn):** text từ `OfflineResource`; ảnh từ `readPackageImage` → `URL.createObjectURL(blob)`, thu hồi khi rời màn. Không bao giờ có điều khiển media cho nội dung gói (SC-M02-011). Cảnh báo gói cũ khi `versionStatus = OUTDATED` hoặc `package.contentVersion < session.contentVersion` (spec-M02 §5.1 "must show the outdated warning when known").
  - Ảnh lỗi → placeholder trung tính; media lỗi → thông báo lỗi tệp, chữ và ảnh vẫn hiện (SCR-M02-002 "Media error").
  - Workbox không cache response media đã ký (constitution VI; cấu hình PWA của M01).
- **Alternatives considered:** Tải trước audio/video (`preload="auto"`) — tốn dữ liệu di động, và spec chỉ phát khi bấm.

### R-13 — Scanner

- **Decision (Approved upstream: tech-stack §3–§4; Plan decision về cách dùng):** `@zxing/browser` (`BrowserQRCodeReader`) trong chunk lazy `m02-scanner`, được precache (plan M01 R-14). Lớp toàn màn hình, nút đóng; `getUserMedia` với `facingMode: 'environment'`; dừng stream khi decode được mã đầu tiên hoặc khi đóng; bỏ qua decode lặp trong 1,5 s. `NotAllowedError`/`NotFoundError`/không có `mediaDevices` → thông báo camera cố định của §5.1 (BR-M02-023). Cần secure context.
- **Alternatives considered:** Quét liên tục không dừng — tốn pin và dễ ghi nhầm lần quét thứ hai.

### R-14 — Ngôn ngữ

- **Decision (Approved upstream: BR-M02-024, BR-M01-001; plan M01 R-12):** Mọi màn M02 hiển thị theo `resolveDisplayLanguage(stored, navigator.language)` và đặt `LanguageControl` của M01 (header; ở `/q/…` góc phải theo OQ-SCR-M02-004-002). M02 không có bước chọn ngôn ngữ và không ghi preference. Chữ cố định của M02 nằm trong `src/modules/m02/i18n/vi.ts`, `en.ts`, chép đúng §5.1 spec-M02 và bảng copy screen spec; test so khớp tập khóa và kiểm không có từ "đã đến", "có mặt", "arrived" (SC-M02-013). Tên checkpoint trong journey hiển thị nhánh của ngôn ngữ hiện tại; đổi ngôn ngữ đổi ngay (SC-M02-019).

### R-15 — PWA và hoãn cập nhật

- **Decision (Approved upstream: constitution VI, plan M01 R-14; Plan decision về đăng ký phía M02):** M02 không cấu hình service worker riêng; dùng cấu hình của shell (precache chunk M02, `navigateFallback` cho `/q/*`). Với update coordinator: (a) tab M02 giữ lock shared `cpq:busy` trong lúc hiển thị phiên đang chạy hoặc đang xử lý quét/đồng bộ; (b) vì phiên là trạng thái lưu bền, có thể tồn tại khi không có tab M02 nào mở, M02 đăng ký một hàm kiểm `hasRunningSession()` (đọc `playSessions` theo index `status`) để coordinator gọi trước khi áp dụng bản mới. Mục (b) dùng `registerBusyCheck` của coordinator (plan M01 R-14; §5 D-02).
- **Alternatives considered:** Chỉ dựa vào lock — tab M01 có thể áp bản mới và tải lại khi phiên vẫn đang chạy.

### R-16 — Cấu hình

- **Decision (Approved upstream: environment.md §4; research M03 R-14):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_VERSION`, `VITE_QR_PUBLIC_BASE_URL`; `MEDIA_BUCKET` (hằng công khai). `LOOKUP_TIMEOUT_SECONDS` = 8 (**provisional**, spec-M02 §9) và các hằng kỹ thuật (R-11, R-13) trong `src/modules/m02/config/limits.ts`, có chú thích phân loại. Không secret.

### R-17 — Hiệu năng và dung lượng (spec-M02 §10: để thiết kế kỹ thuật)

- **Decision (Plan decision; mục tiêu kỹ thuật, không phải requirement):**
  - Trang `/q/…` không tải chunk scanner hay chunk màn M01/M03; chỉ shell + chunk `m02-qr-link` + chunk nội dung. Mục tiêu đo trên build preview với lookup giả: LCP ≤ 2,5 s ở profile di động của Lighthouse. Không đạt thì ghi rủi ro, không chặn phát hành.
  - Mở scanner: chunk `m02-scanner` lazy, đã precache.
  - Dung lượng lưu: mỗi phiên vài KB (≤ 30 checkpoint theo giới hạn provisional của M03, mỗi lượt ghé bốn trường); không đặt quota riêng.
- **Rationale:** checklist CHK025 giao cho plan; spec không có requirement.

### R-18 — Giữ dữ liệu cục bộ

- **Decision (Plan decision trong phạm vi AGENTS.md §5):** Không xóa phiên terminal, lượt ghé hay mục `SYNCED`: spec không có requirement xóa, và AGENTS.md §5 cấm suy ra delete. Dữ liệu chỉ mất khi trình duyệt xóa (spec-M02 §6.4). Ghi nhận như điểm mở cho chủ sản phẩm nếu sau này cần dọn.
- **Alternatives considered:** Xóa mục `SYNCED` sau khi gửi — tạo hành vi delete không có nguồn.

### R-19 — Test

- **Decision (Approved upstream: tech-stack §8, §13; giống plan M01 R-16):** Vitest + Testing Library cạnh mã nguồn; contract test cho `SessionSyncRecord` (strict, Required/Conditional, allowlist) và fixture consumer cho `LiveQrLookupResult`; test transaction Dexie (tạo/thay phiên, ghi lượt ghé, terminal + hàng đợi, tự đóng) cần `fake-indexeddb` (Complexity #4 của M01, dùng chung) hoặc Playwright. E2E trong `e2e/m02/`: `page.route()` giả lập `/rest/v1/rpc/lookup_qr`, `/functions/v1/session-intake`, Storage; `context.setOffline(true)`; scanner bằng Chromium `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=<file .y4m chứa ảnh QR synthetic>`; quyền camera bị từ chối bằng `context` không cấp quyền. Kiểm thủ công trên Android/iOS thật cho camera, quyền và offline (tech-stack §13). Không test trên Shared Backend.

## 3. Best practices áp dụng (tóm tắt)

| Công nghệ | Thực hành | Nguồn |
|---|---|---|
| Dexie | Mỗi bước nghiệp vụ một transaction ngắn; network ngoài transaction; unique index là hàng rào giữa các tab; `liveQuery` để tab khác thấy thay đổi | tech-stack §4; Physical §11; BR-M02-002 |
| `@zxing/browser` | Lazy-load; dừng stream sau decode; xử lý lỗi quyền rõ ràng | tech-stack §3 |
| supabase-js | `schema('api').rpc('lookup_qr', …)` + `abortSignal`; `functions.invoke` cho intake; signed URL cho media | Physical §7.1, §7.2, §9 |
| Zod | Parse lookup trước khi dùng `outcome`; schema strict cho bản ghi gửi đi | contract M03 live-qr-lookup §4, session-intake §1 |
| Web Locks | Một người gửi đồng bộ; lock shared `cpq:busy` | R-11, R-15 |
| Media HTML | `preload="none"`, không autoplay | BR-M02-016 |

## 4. Điểm phối hợp với package khác

| # | Điểm | Package | Ghi chú |
|---|---|---|---|
| P-01 | Dùng `src/shared/db/visitorDb.ts` của M01; 3 store M02 đúng Physical §11 | 001 | không tạo database thứ hai |
| P-02 | `PATHS.m02SessionEntry = '/trip'` | 001 | M01 điều hướng sau khi commit context |
| P-03 | Đặt `LanguageControl` của M01 trên mọi màn M02 | 001 | M01 vẫn là writer duy nhất |
| P-04 | Liên kết "Chọn tuyến" về `/` (SCR-M01-001) | 001 | từ chế độ khách tự do |
| P-05 | `sessionSyncRecord.ts` đồng sở hữu | 003 | §5 L-01 |
| P-06 | File tooling gốc, `e2e/`, CI, `fake-indexeddb` | 001, 003 | cùng Complexity #2–#4 |

## 5. Đối chiếu contract với M01 và M03

Bảng field path đã được so bằng script (xem báo cáo validation): `SelectedRouteContext v3` của spec-M01 §5.3 và spec-M02 §5.1 trùng từng dòng (15 field path); `OfflinePackage` của spec-M02 §5.1 là tập con đúng của spec-M01 §5.3 (bỏ `offlineRouteMap`, `routeEssentials` như spec-M02 nêu); lookup input/output và `SessionSyncRecord` của spec-M02 §5.1 và spec-M03 §5.1 trùng từng dòng. Tên, version và hướng producer → consumer khớp AGENTS.md §3.2 ở cả ba plan.

**Với plan M01 — đã chốt và đưa vào plan M01 ngày 2026-10-29:**

| ID | Điểm ban đầu | Tác động nếu không sửa | Quyết định (đã áp dụng) |
|---|---|---|---|
| D-01 | `readSelectedRouteContext()` trả `null` cho cả "không có context" và "context không hợp lệ (v2, hỏng)" | M02 không phân biệt được "khách tự do/khôi phục" với "từ chối có thông báo rõ" (FR-M02-001, SC-M02-010) | Kiểu trả là `{ kind: 'NONE' } \| { kind: 'INVALID' } \| { kind: 'OK', value }` (plan M01 R-07; contract `selected-route-context-v3` §3) |
| D-02 | Update coordinator của M01 R-14 chỉ dựa vào Web Lock | Phiên đang chạy khi không có tab M02 mở không chặn được cập nhật (constitution VI) | Coordinator có `registerBusyCheck(fn)`; M02 đăng ký `hasRunningSession()` (plan M01 R-14; visitor-ui-flow §3) |

**Với plan M03 (đã duyệt, không sửa):**

| ID | Điểm | Tác động | Đề xuất |
|---|---|---|---|
| L-01 | Plan M03 xếp `src/shared/contracts/sessionSyncRecord.ts` vào schema của M03, trong khi producer theo spec là M02 | Mơ hồ ai sửa file | Đồng sở hữu; nội dung theo spec-M02 §5.1 = spec-M03 §5.1; đổi cần cả hai spec |
| L-02 | Bảng response của contract session-intake §3 không nêu 400/401/403/404/429 | Không rõ M02 xử lý thế nào | M02 chỉ chuyển `CONFLICT` khi body `result` là `CONFLICT`/`INVALID`; mọi trường hợp khác giữ `PENDING` (R-11) — nên ghi thêm vào contract M03 khi làm giai đoạn B |
| L-03 | Contract M03 live-qr-lookup ghi transport là RPC `api.lookup_qr(p_qr_identifier, p_route_id)` | Adapter M02 dùng đúng tên tham số này | Không cần làm gì; chốt cùng migration bước 4 |
