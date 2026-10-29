# Contract — SelectedRouteContext v3 (M01 → M02)

| Mục | Giá trị |
|---|---|
| Producer | M01 (FN-M01-006, FN-M01-007; FR-M01-011, 012, 013; BR-M01-008, 009, 011, 015) |
| Consumer | M02 (spec-M02 §5.1 "SelectedRouteContext v3 input"; BR-M02-017) |
| Tên contract | **`SelectedRouteContext v3`** (AGENTS.md §3.2; giữ nguyên tên và version) |
| Nguồn hình dạng | [spec-M01](../../../docs/spec/spec-M01.md) §5.3 "SelectedRouteContext v3 output" = spec-M02 §5.1 (cùng payload); S4 SelectedRouteContext; DAC-M01-002…007 |
| Transport | giá trị nguyên tử trong IndexedDB, store `selectedRouteContext`, slot `current`, unique `handoffId` (Physical §11) |
| Schema dùng chung | `src/shared/contracts/selectedRouteContext.ts` — `SelectedRouteContextV3` (Zod; M01 sở hữu) |

## 1. Hình dạng

| Field path | Logical type | Presence | Constraints |
|---|---|---|---|
| `contractVersion` | Integer | Required | Đúng `3` (Zod literal) |
| `handoffId` | UUID | Required | Duy nhất toàn cục; dùng cho tối đa một phiên M02 |
| `routeId` | String | Required | = `routeJourneyManifest.routeId` |
| `authorizedAt` | DateTime | Required | UTC |
| `expiresAt` | DateTime | Required | UTC; đúng `authorizedAt` + 24 giờ |
| `authorizationStatus` | Enum(`AUTHORIZED`, `REVOKED`) | Required | Start ghi `AUTHORIZED`; phát hiện đóng tuyến có thể đặt `REVOKED` |
| `routeJourneyManifest` | Object | Required | Manifest hành trình đầy đủ, ghi nguyên tử |
| `routeJourneyManifest.routeId` | String | Required | = `routeId` ngoài |
| `routeJourneyManifest.contentVersion` | Integer | Required | Version của snapshot/gói nguồn |
| `routeJourneyManifest.checkpoints` | Array&lt;Object&gt; | Required | Danh sách đầy đủ, đóng băng |
| `routeJourneyManifest.checkpoints[].checkpointId` | String | Required | Duy nhất trong manifest |
| `routeJourneyManifest.checkpoints[].sequence` | Integer | Required | Duy nhất trong manifest; cho phép khoảng trống |
| `routeJourneyManifest.checkpoints[].checkpointName` | Object | Required | `vi`, `en` đều Required, không rỗng |
| `routeJourneyManifest.checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | Chép, không phân loại lại |
| `routeJourneyManifest.checkpoints[].qrIdentifiers` | Array&lt;String&gt; | Required | Không rỗng |

Context chỉ chứa metadata hành trình; text/ảnh offline ở `OfflinePackage` (spec-M01 §5.3). Schema có `superRefine` cho: `routeId` bằng nhau, `expiresAt − authorizedAt = 86 400 000 ms` đúng tuyệt đối, `checkpointId` và `sequence` duy nhất. Dòng Dexie = contract + `slot: 'current'`; hàm đọc bỏ `slot`.

## 2. Ghi (chỉ M01)

| Thao tác | Bước | Lỗi |
|---|---|---|
| **Start** (SCR-M01-003) | Trong Web Lock `cpq:m01:start` (lần bấm lặp bị bỏ qua): chọn nguồn manifest — online: dòng tuyến `HOAT_DONG` + snapshot active hợp lệ; offline/nguồn không khả dụng: gói active `SAN_SANG` của tuyến (kể cả `OUTDATED`). Dựng giá trị: `handoffId = crypto.randomUUID()`, `authorizedAt` = giờ thiết bị (ISO-8601 UTC), `expiresAt` = +24 h, `AUTHORIZED`, manifest chép giá trị. Validate schema → **một** transaction `put` slot `current` → chỉ sau commit mới mở M02 | không có nguồn lẫn gói `SAN_SANG` → chặn Start; lỗi ghi → context trước giữ nguyên; tuyến `TAM_DONG`/`LUU_TRU` → chặn và thu hồi (FR-M01-011, 012; SF-M01-006-01…08) |
| **Thu hồi** | Đọc nguồn thành công (danh mục, chi tiết, Start) thấy tuyến `TAM_DONG`/`LUU_TRU` → một transaction: nếu context hiện tại có `routeId` đó và `AUTHORIZED` thì đặt `REVOKED`, giữ các trường khác | không đụng gói, phiên M02 (BR-M01-010, 011; SF-M01-006-07) |

M01 không bao giờ gia hạn `expiresAt` và không đổi `authorizationStatus` vì thời gian trôi qua; hạn do M02 thực thi (BR-M01-015). Start mới thay toàn bộ context cũ (BR-M01-009).

## 3. Bề mặt cho M02 (`src/modules/m01/index.ts`)

| Export | Kiểu trả | Hành vi |
|---|---|---|
| `readSelectedRouteContext()` | `Promise<{ kind: 'NONE' } \| { kind: 'INVALID' } \| { kind: 'OK', value: SelectedRouteContextV3 }>` | đọc slot `current`, validate bằng schema: không có dòng → `NONE`; có dòng nhưng không qua schema (gồm `contractVersion ≠ 3`) → `INVALID`; hợp lệ → `OK` (quyết định D-01, 2026-10-29) |

M02 tự kiểm `AUTHORIZED`, chưa dùng (`handoffId` chưa là `sourceHandoffId` của phiên nào) và chưa quá `expiresAt` theo đồng hồ thiết bị trước khi tạo phiên; M02 từ chối version 2 mà không chuyển đổi (spec-M02 §5.1, BR-M02-017). M02 không ghi store này.

## 4. Truy vết test

| Kiểm thử | BR / SC / DAC |
|---|---|
| Start online thành công → đúng một context v3, `handoffId` mới, `expiresAt − authorizedAt` = 24 h | SC-M01-005; DAC-M01-002…005 |
| Start lần hai → `handoffId` khác, context cũ bị thay | BR-M01-009; DAC-M01-003 |
| Lỗi ghi giữa chừng (transaction abort) → context trước nguyên vẹn | FR-M01-012 |
| Bấm Start hai lần khi lần đầu chưa xong (cùng tab và hai tab) → chỉ một context | FR-M01-012; CHK004 |
| Offline + gói `SAN_SANG` (`CURRENT` và `OUTDATED`) → manifest = manifest gói | SC-M01-006; SF-M01-006-02, 03 |
| Offline không có gói `SAN_SANG` → chặn | SC-M01-006 |
| Tuyến không cần gói, online → Start không cần gói | SC-M01-010 |
| Đọc nguồn thấy `TAM_DONG` → context cùng tuyến thành `REVOKED`; context tuyến khác không đổi | BR-M01-011; DAC-M01-006 |
| Context không bao giờ chứa `resources`, `introductionText`, byte ảnh | spec-M01 §5.3 |
| Schema từ chối `contractVersion = 2` | DAC-M01-002 |
| `readSelectedRouteContext()`: store trống → `NONE`; dòng version 2 hoặc hỏng → `INVALID`; dòng hợp lệ → `OK` | DAC-M01-002; FR-M02-001 |
