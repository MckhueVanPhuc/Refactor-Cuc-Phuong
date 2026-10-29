# Data Model — M02 Field Quest Experience

**Package**: `specs/002-m02-field-quest-experience` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

## 0. Nguồn và quy tắc

- **Nguồn chuẩn:** field logic, presence, quan hệ, lifecycle lấy từ [S4 Logical Data Model](../../data/04-data-model.md) (PlaySession, CheckpointVisit, PendingSyncItem). Store, key, index, ánh xạ kiểu và quy tắc transaction lấy từ [Physical Schema](../../data/06-physical-schema.md) §2, §3, §11. Ràng buộc lấy từ [DAC](../../data/08-data-acceptance-criteria.md) DAC-M02-001…011. Nếu file này lệch với ba nguồn đó, nguồn thắng.
- File này **không thêm** entity, field, kiểu, khóa, nullable, uniqueness hay quan hệ. Mọi bảng chép S4 + Physical §11.
- Phân biệt: **canonical entity** của M02 (§1–§2), **contract/transport** (§4: `SessionSyncRecord` nằm trong `PendingSyncItem.record`; `LiveQrLookupResult`/`LiveStationContent` không lưu), **view** (`RouteJourneyMap`, `OfflineStationContent`), **dữ liệu M01 chỉ đọc** (§5), **transient UI state** (§6). `SessionSyncRecord` (transport) không bao giờ hợp nhất với `SessionRecord` (entity M03) (AGENTS.md §5).
- Ánh xạ kiểu theo Physical §3 (UUID → chuỗi UUID đã validate; DateTime → ISO-8601 UTC; Enum → Zod union; Object/Array nhúng → giá trị structured-clone). `LOOKUP_TIMEOUT_SECONDS` = 8 là **provisional** (spec-M02 §9) và không phải thuộc tính dữ liệu.

## 1. Danh sách entity M02 (3 / 16 canonical)

| Entity (S4) | ENT | Store Dexie (Physical §11) | Identity (S4) | Lifecycle (S4) | Bất biến | Ghi bởi |
|---|---|---|---|---|---|---|
| PlaySession | ENT-DATA-013 | `playSessions` | `sessionId`; `sourceHandoffId` unique | `DANG_DIEN_RA → HOAN_TAT` hoặc `BO_DO` | `journeyCheckpoints` đóng băng khi tạo; trạng thái terminal bất biến | tạo/thay phiên, kết thúc, tự đóng |
| CheckpointVisit | ENT-DATA-014 | `checkpointVisits` | `(sessionId, checkpointId)` | chèn ở lần quét được chấp nhận đầu tiên | `checkedInAt` đầu tiên bất biến | ghi lượt ghé |
| PendingSyncItem | ENT-DATA-015 | `pendingSyncItems` | `sessionId` | `PENDING → SYNCED` hoặc `CONFLICT` | `record` bất biến; chỉ `syncStatus` đổi | chuyển terminal, đồng bộ |

ENT ID theo [S1 Entity Dictionary](../../data/01-entity-dictionary.md). `RouteJourneyMap` (view có thứ tự của `journeyCheckpoints`) và `OfflineStationContent` (view chỉ-đọc của một `OfflineResource` của M01) không phải entity và không lưu riêng (spec-M02 §6.3, §6.4).

## 2. Entity chi tiết

### 2.1 PlaySession — store `playSessions` (Physical §11: PK `sessionId`; unique `sourceHandoffId`; index `status`)

| Field | Kiểu logic | Presence | Constraint | DAC |
|---|---|---|---|---|
| `sessionId` | UUID | Required | PK; duy nhất toàn cục; `crypto.randomUUID()` | DAC-M02-001 |
| `sourceHandoffId` | UUID | Required | unique index; chép `handoffId` của handoff được chấp nhận | DAC-M02-001 |
| `routeId` | String | Required | chép từ handoff | DAC-M02-004 |
| `contentVersion` | Integer | Required | chép từ manifest | DAC-M02-004 |
| `journeyCheckpoints[]` | Array&lt;Object&gt; | Required | bản sao giá trị của `routeJourneyManifest.checkpoints`; không đổi sau khi tạo | DAC-M02-004 |
| `journeyCheckpoints[].checkpointId` | String | Required | duy nhất trong journey | DAC-M02-004 |
| `journeyCheckpoints[].sequence` | Integer | Required | duy nhất; cho phép khoảng trống | DAC-M02-004 |
| `journeyCheckpoints[].checkpointName.vi/.en` | String | Required | không rỗng | DAC-M02-004 |
| `journeyCheckpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | đóng băng | DAC-M02-004 |
| `journeyCheckpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | không rỗng; mã thêm sau không bao giờ được thêm | DAC-M02-004 |
| `status` | Enum(`DANG_DIEN_RA`, `HOAN_TAT`, `BO_DO`) | Required | tối đa một `DANG_DIEN_RA` mỗi trình duyệt | DAC-M02-002 |
| `startedAt` | DateTime | Required | UTC | DAC-M02-003 |
| `endedAt` | DateTime | Conditional | có khi `HOAN_TAT`/`BO_DO`, vắng khi `DANG_DIEN_RA`; tự đóng: `checkedInAt` mới nhất hoặc `startedAt` | DAC-M02-003 |

Quan hệ: REL-014 (lineage `sourceHandoffId` ← `handoffId`), REL-015 (`routeId`), REL-016 (CheckpointVisit), REL-018 (PendingSyncItem), REL-019 (lineage tới `SessionRecord` của M03 qua transport; không tham chiếu). Checkpoint cuối = phần tử `journeyCheckpoints` có `sequence` lớn nhất (spec-M02 §9).

### 2.2 CheckpointVisit — store `checkpointVisits` (Physical §11: PK `[sessionId+checkpointId]`; index `sessionId`)

| Field | Kiểu logic | Presence | Constraint | DAC |
|---|---|---|---|---|
| `sessionId` | UUID | Required | thuộc một PlaySession | DAC-M02-005 |
| `checkpointId` | String | Required | luôn là checkpoint của journey đóng băng | DAC-M02-005 |
| `qrIdentifier` | String | Required | mã của lần quét được chấp nhận đầu tiên; có thể là mã thêm sau (không có trong journey); không phải identity | DAC-M02-005 |
| `checkedInAt` | DateTime | Required | UTC; giá trị đầu bất biến; nghĩa là đã quét QR, không phải có mặt | DAC-M02-005 |

Chỉ chèn khi lần quét được chấp nhận (DAC-M02-006; [contracts/scan-resolution-contract.md](contracts/scan-resolution-contract.md)). Quan hệ: REL-016, REL-017.

### 2.3 PendingSyncItem — store `pendingSyncItems` (Physical §11: PK `sessionId`; index `syncStatus`)

| Field | Kiểu logic | Presence | Constraint | DAC |
|---|---|---|---|---|
| `sessionId` | UUID | Required | tối đa một mục mỗi phiên terminal; = `record.sessionId` | DAC-M02-007 |
| `record` | Object (`SessionSyncRecord`) | Required | giá trị transport bất biến; shape ở [contracts/session-sync-record-contract.md](contracts/session-sync-record-contract.md) | DAC-M02-007…009 |
| `syncStatus` | Enum(`PENDING`, `SYNCED`, `CONFLICT`) | Required | lỗi mạng/server giữ `PENDING`; xác nhận → `SYNCED`; conflict hoặc bị từ chối → `CONFLICT`, dừng tự gửi | DAC-M02-010 |

Quan hệ: REL-018.

## 3. Transaction (Physical §11; [research.md](research.md) R-06, R-08, R-09, R-11)

| Thao tác | Store trong transaction | Nội dung | Nguồn |
|---|---|---|---|
| Tạo / thay phiên | `rw`: `playSessions`, `checkpointVisits`, `pendingSyncItems`; đọc `selectedRouteContext` qua hàm của M01 | đọc lại context hợp lệ; kiểm `sourceHandoffId` chưa dùng; phiên cũ (nếu có) → `BO_DO` + `endedAt` + mục hàng đợi; chèn phiên mới | FR-M02-001…004, 017; BR-M02-013 |
| Ghi lượt ghé | `rw`: `checkpointVisits`; đọc `playSessions` | phiên còn `DANG_DIEN_RA`; chèn nếu `[sessionId+checkpointId]` chưa có | FR-M02-007, 009, 022 |
| Kết thúc (xác nhận) | `rw`: `playSessions`, `checkpointVisits`, `pendingSyncItems` | checkpoint cuối đã có lượt ghé; `HOAN_TAT` + `endedAt` + mục hàng đợi | FR-M02-016 |
| Tự đóng | như trên | `HOAN_TAT`/`BO_DO` theo BR-M02-022 | FR-M02-024 |
| Cập nhật đồng bộ | `rw`: `pendingSyncItems` | chỉ đổi `syncStatus` | FR-M02-018 |

Một phiên terminal không bao giờ tồn tại mà thiếu mục hàng đợi vì trạng thái, `endedAt` và mục hàng đợi được ghi cùng transaction (Physical §11 "Terminal transition").

## 4. Contract / transport (không lưu như entity riêng)

| Tên (giữ nguyên) | Loại | Nơi giữ | Contract file |
|---|---|---|---|
| `SessionSyncRecord` | Transport M02 → M03 | nhúng trong `PendingSyncItem.record` | [session-sync-record-contract.md](contracts/session-sync-record-contract.md) |
| `LiveQrLookupResult` với `LiveStationContent` | Transport M03 → M02 | bộ nhớ, trong một lần quét/xem; không bao giờ lưu | [live-qr-lookup-consumer-contract.md](contracts/live-qr-lookup-consumer-contract.md) |
| Link QR công khai `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` | Giá trị suy ra (M03 không lưu) | chỉ phân tích, không lưu | live-qr-lookup-consumer §2 |

`SessionRecord` là entity của M03 (ENT-DATA-016), không có trong trình duyệt.

## 5. Dữ liệu M01 mà M02 đọc (chỉ đọc)

| Contract (M01 sở hữu) | Cách đọc | M02 dùng | Contract file |
|---|---|---|---|
| `LanguagePreference` | `useLanguagePreference()`, `resolveDisplayLanguage()` | nhánh ngôn ngữ, lọc audio/video | [m01-shared-data-consumer-contract.md](contracts/m01-shared-data-consumer-contract.md) |
| `SelectedRouteContext v3` | `readSelectedRouteContext()` | tạo phiên | như trên |
| ready `OfflinePackage` / `OfflineResource` | `readActiveOfflinePackage()`, `findOfflineResource()`, `readPackageImage()` | nội dung offline, cảnh báo gói cũ (bỏ qua `offlineRouteMap`, `routeEssentials`) | như trên |

M02 không ghi store nào của M01 (FR-M02-020).

## 6. Transient UI state (không lưu)

| State | Nơi giữ | Ghi chú |
|---|---|---|
| Kết quả xử lý một lần quét (đường, kết quả lookup, lượt ghé mới hay cũ, nguồn nội dung) | bộ nhớ, truyền qua router state | R-08 |
| Câu hỏi kết thúc chuyến đang mở | React state | hiện một lần khi lượt ghé điểm cuối được tạo (BR-M02-021) |
| Thông báo "chuyến trước đã tự kết thúc" | React state | hiện một lần sau khi tự đóng (BR-M02-022) |
| Scanner mở/đóng, lỗi camera | React state | R-13 |
| Signed URL media, object URL ảnh gói | bộ nhớ | thu hồi object URL khi rời màn |
| Danh sách audio/video đang hiển thị | suy ra từ nội dung + ngôn ngữ | BR-M02-026 |
| Lịch thử lại đồng bộ | bộ nhớ của tab đang giữ lock | R-11 |

## 7. Chuyển trạng thái (spec-M02 §6.4; S4)

| Entity | Chuyển | Thao tác | Guard | FR / BR / SF |
|---|---|---|---|---|
| PlaySession | → `DANG_DIEN_RA` | tạo phiên | context v3 `AUTHORIZED`, chưa dùng, trước `expiresAt`; không có phiên chạy hoặc thay thế trong cùng transaction | FR-M02-001…004; BR-M02-001, 017; SF-M02-001-01…06 |
| PlaySession | `DANG_DIEN_RA → BO_DO` | thay phiên | cùng transaction với phiên mới | FR-M02-017; BR-M02-013; SF-M02-006-03, 04 |
| PlaySession | `DANG_DIEN_RA → HOAN_TAT` | xác nhận Finish / [Kết thúc] | checkpoint cuối đã có lượt ghé | FR-M02-015, 016, 023; BR-M02-007, 021; SF-M02-006-01, 02, 06 |
| PlaySession | `DANG_DIEN_RA → HOAN_TAT`/`BO_DO` | tự đóng | `now − startedAt > 24 h` | FR-M02-024; BR-M02-022; SF-M02-006-07 |
| CheckpointVisit | (không có) → có | quét được chấp nhận | `(sessionId, checkpointId)` chưa có | FR-M02-007; BR-M02-004, 005; SF-M02-004-03, 09 |
| PendingSyncItem | → `PENDING` | chuyển terminal | một mục mỗi phiên | FR-M02-018; SF-M02-006-05, 007-01, 02 |
| PendingSyncItem | `PENDING → SYNCED` | `ACCEPTED`/`IDENTICAL` | — | SF-M02-007-04 |
| PendingSyncItem | `PENDING → CONFLICT` | `CONFLICT`/`INVALID` | dừng tự gửi; không có thao tác của du khách | BR-M02-011; SF-M02-007-06 |

## 8. Bất biến và giữ lại

- `journeyCheckpoints` không đổi sau khi tạo; mã thêm sau được giải quyết qua lookup, không thêm vào journey (BR-M02-003, 020).
- `checkedInAt` đầu tiên không đổi; quét lặp không ghi gì (FR-M02-009).
- Phiên terminal, lượt ghé của nó và `record` bất biến (BR-M02-010).
- Không xóa phiên, lượt ghé hay mục hàng đợi: spec không có requirement xóa (AGENTS.md §5; [research.md](research.md) R-18). Dữ liệu có thể mất khi trình duyệt xóa dữ liệu.
- Khách tự do không tạo `PlaySession`, `CheckpointVisit`, `PendingSyncItem` (FR-M02-019; SC-M02-018).

## 9. Ánh xạ DAC-M02

| DAC | Thực thi trong M02 |
|---|---|
| DAC-M02-001 | `crypto.randomUUID()`; PK `sessionId`; unique index `sourceHandoffId` |
| DAC-M02-002 | kiểm phiên chạy trong transaction tạo/thay; terminal bất biến (writer chỉ cho phép chuyển từ `DANG_DIEN_RA`) |
| DAC-M02-003 | quy tắc `endedAt` (R-09, R-10); schema dòng: `endedAt` có ⇔ terminal |
| DAC-M02-004 | bản sao manifest; schema dòng kiểm ID/`sequence` duy nhất, `qrIdentifiers` không rỗng |
| DAC-M02-005 | PK compound; chèn-nếu-chưa-có |
| DAC-M02-006 | bảng quyết định của `processScan` (scan-resolution-contract §2) |
| DAC-M02-007–009 | dựng `record` trong transaction terminal; schema strict `SessionSyncRecord` |
| DAC-M02-010 | ánh xạ response của đồng bộ (session-sync-record-contract §4) |
| DAC-M02-011 | phân tích link và so base `QR_PUBLIC_BASE_URL`; `routeId` chỉ khi có phiên |
