# Data Model — M01 Route Planning & Preparation

**Package**: `specs/001-m01-route-planning-preparation` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

## 0. Nguồn và quy tắc

- **Nguồn chuẩn:** field logic, presence, quan hệ, lifecycle lấy từ [S4 Logical Data Model](../../data/04-data-model.md) §3–§9 (LanguagePreference, SelectedRouteContext, OfflinePackage, OfflineResource). Store, key, index và ánh xạ kiểu trình duyệt lấy từ [Physical Schema](../../data/06-physical-schema.md) §2, §3, §11. Ràng buộc lấy từ [DAC](../../data/08-data-acceptance-criteria.md) DAC-M01-001…018. Nếu file này lệch với ba nguồn đó, nguồn thắng.
- File này **không thêm** entity, field, kiểu, khóa, nullable, uniqueness hay quan hệ nào cho 4 entity canonical. Mỗi bảng dưới đây chép đúng S4 + Physical §11. Nội dung giá trị của 3 store kỹ thuật (Physical §11 chỉ nêu key và mục đích) là **plan decision** ([research.md](research.md) R-08), được đánh dấu rõ.
- Phân biệt năm loại: **canonical entity** (§1–§2), **store kỹ thuật** (§3), **contract/projection** không lưu như entity (§5), **transient UI state** (§6), và **store của module khác** (§4). Transport shape của contract (M01 → M02) không bị hợp nhất với dòng Dexie: hàm đọc lắp dòng thành giá trị contract (§5.2).
- Ánh xạ kiểu theo Physical §3: String → `string`; UUID → chuỗi UUID đã validate; Integer → số nguyên; DateTime (UTC) → chuỗi ISO-8601 UTC; Enum → Zod union; Object/Array nhúng → giá trị structured-clone; Required → property bắt buộc; Optional → property vắng; Conditional → kiểm tại ranh giới thao tác. Không có kiểu nào khác được suy ra.
- Giới hạn số và độ dài (`NAME_MAX_CHARS`…) là hằng **provisional** của spec-M03 §5.3; M01 không kiểm chúng (spec-M03 §5.3, câu cuối; [research.md](research.md) R-04). `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8 là **provisional** của spec-M01 §9.3 và không phải thuộc tính dữ liệu.

## 1. Danh sách entity M01 (4 / 16 canonical)

| Entity (S4) | ENT | Store Dexie (Physical §11) | Identity (S4) | Lifecycle (S4 §3, §8) | Bất biến / đóng băng (S4 §6) | Ghi bởi |
|---|---|---|---|---|---|---|
| LanguagePreference | ENT-DATA-009 | `languagePreference` | singleton slot | vắng trước khi chọn → tạo/thay giá trị hiện tại | — | chọn ngôn ngữ (FR-M01-001) |
| SelectedRouteContext | ENT-DATA-010 | `selectedRouteContext` | `handoffId` (unique); một context hiện tại | tạo `AUTHORIZED` → có thể `REVOKED`; Start sau thay context | `routeJourneyManifest` đóng băng khi commit | Start (FR-M01-012), thu hồi (BR-M01-011) |
| OfflinePackage | ENT-DATA-011 | `offlinePackages` (+ con trỏ `activePackages`) | `(routeId, contentVersion)` | `CHUA_TAI → DANG_TAI → SAN_SANG` hoặc `CHUA_HOAN_TAT`; `SAN_SANG` có `CURRENT`/`OUTDATED` | manifest, resources, `offlineRouteMap` đóng băng khi sẵn sàng; `routeEssentials` không đóng băng | pipeline gói (R-08), cập nhật lười (R-10), xóa |
| OfflineResource | ENT-DATA-012 | `offlineResources` (+ byte ở `imageBytes`) | `(routeId, contentVersion, qrIdentifier)` | nằm trong candidate; lộ ra cùng gói sẵn sàng; xóa cùng gói/candidate | giá trị gói bất biến | kích hoạt gói (R-08) |

ENT ID theo [S1 Entity Dictionary](../../data/01-entity-dictionary.md) baseline V2. `OfflineRouteMap` và `RouteEssentials` là giá trị nhúng của OfflinePackage, không phải entity (HC-005). `RecommendationContext` là transient context, không phải entity (HC-007).

## 2. Entity chi tiết

### 2.1 LanguagePreference — store `languagePreference` (Physical §11; S4 LanguagePreference)

| Field | S4 path | Kiểu logic | Kiểu trình duyệt | Presence | Constraint | DAC |
|---|---|---|---|---|---|---|
| `slot` | — (biểu diễn vật lý) | — | `'current'` | PK | singleton; không phải thuộc tính contract (Physical §11, đoạn cuối) | — |
| `languageCode` | `languageCode` | Enum(`vi`, `en`) | Zod union | Required | thay giá trị không đổi trạng thái gói hay phiên | DAC-M01-001 |

Không có quan hệ canonical nào (S4: "No canonical entity relationship is declared"). Không có giá trị = chưa chọn; trang link QR khi đó dùng ngôn ngữ thiết bị mà không ghi gì (BR-M02-024; [research.md](research.md) R-12).

### 2.2 SelectedRouteContext — store `selectedRouteContext` (Physical §11; S4 SelectedRouteContext)

| Field | S4 path | Kiểu logic | Presence | Constraint | DAC |
|---|---|---|---|---|---|
| `slot` | — | `'current'` | PK | một context hiện tại (Physical §11) | — |
| `contractVersion` | `contractVersion` | Integer | Required | đúng `3` | DAC-M01-002 |
| `handoffId` | `handoffId` | UUID | Required | unique index; mới cho mỗi Start; dùng cho tối đa một PlaySession | DAC-M01-003 |
| `routeId` | `routeId` | String | Required | = `routeJourneyManifest.routeId` | DAC-M01-004 |
| `authorizedAt` | `authorizedAt` | DateTime | Required | UTC | DAC-M01-005 |
| `expiresAt` | `expiresAt` | DateTime | Required | UTC; đúng `authorizedAt` + 24 giờ; M01 không gia hạn | DAC-M01-005 |
| `authorizationStatus` | `authorizationStatus` | Enum(`AUTHORIZED`, `REVOKED`) | Required | Start ghi `AUTHORIZED`; phát hiện đóng tuyến có thể đặt `REVOKED`; thời gian trôi không đổi giá trị | DAC-M01-006 |
| `routeJourneyManifest` | `routeJourneyManifest` | Object | Required | manifest hành trình đầy đủ, ghi nguyên tử | DAC-M01-007 |
| `routeJourneyManifest.routeId` | | String | Required | = `routeId` ngoài | DAC-M01-004 |
| `routeJourneyManifest.contentVersion` | | Integer | Required | version của snapshot/gói nguồn | DAC-M01-004 |
| `routeJourneyManifest.checkpoints[]` | | Array&lt;Object&gt; | Required | danh sách đầy đủ, đóng băng | DAC-M01-007 |
| `…checkpoints[].checkpointId` | | String | Required | duy nhất trong manifest | DAC-M01-007 |
| `…checkpoints[].sequence` | | Integer | Required | duy nhất; cho phép khoảng trống | DAC-M01-007 |
| `…checkpoints[].checkpointName.vi/.en` | | String | Required | không rỗng | DAC-M01-007 |
| `…checkpoints[].connectivityMode` | | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | chép, không phân loại lại | DAC-M01-007 |
| `…checkpoints[].qrIdentifiers` | | Array&lt;String&gt; | Required | không rỗng | DAC-M01-007 |

Quan hệ: REL-010 (`routeId → Route.routeId`), REL-014 (lineage: `PlaySession.sourceHandoffId` chép `handoffId`; không phải tham chiếu tiếp diễn). Không chứa text/ảnh offline (spec-M01 §5.3).

### 2.3 OfflinePackage — store `offlinePackages` (Physical §11; S4 OfflinePackage)

| Field | S4 path | Kiểu logic | Presence | Constraint | DAC |
|---|---|---|---|---|---|
| `routeId`, `contentVersion` | `routeId`, `contentVersion` | String, Integer | Required | PK `[routeId+contentVersion]`; index `routeId` | DAC-M01-008 |
| `status` | `status` | Enum(`CHUA_TAI`, `DANG_TAI`, `SAN_SANG`, `CHUA_HOAN_TAT`) | Required | dòng trong store này luôn là `SAN_SANG` (plan decision R-08: `DANG_TAI`/`CHUA_HOAN_TAT` nằm ở `packageCandidates`; `CHUA_TAI` = không có dòng, spec-M01 §5.3 cho phép) | DAC-M01-009 |
| `versionStatus` | `versionStatus` | Enum(`CURRENT`, `OUTDATED`) | Conditional | bắt buộc khi `SAN_SANG` | DAC-M01-009 |
| `manifest` (+ `.routeId`, `.contentVersion`, `.checkpoints[]` như §2.2) | `manifest.*` | Object | Required | `manifest.routeId` = `routeId`; `manifest.contentVersion` = `contentVersion` | DAC-M01-007, 008 |
| `offlineRouteMap` | `offlineRouteMap` | Object | Optional | chỉ có khi snapshot nguồn có `offlineRouteMap`; tối đa một | DAC-M01-010 |
| `offlineRouteMap.sourceRef` | | String | Conditional | bắt buộc khi có; byte có trong `imageBytes` | DAC-M01-010 |
| `offlineRouteMap.caption.vi/.en` | | String | Optional / Conditional | both-or-none | DAC-M01-010 |
| `routeEssentials` | `routeEssentials` | Object | Required | đúng một giá trị mỗi gói sẵn sàng; chỉ text | DAC-M01-011 |
| `routeEssentials.capturedAt` | | DateTime | Required | UTC; lần đọc M03 gần nhất | DAC-M01-011 |
| `routeEssentials.name.vi/.en`, `.startingPoint.vi/.en` | | String | Required | không rỗng | DAC-M01-011 |
| `routeEssentials.participationRequirements`, `.safetyWarning` | | Object | Optional | both-or-none `vi`/`en` | DAC-M01-011 |
| `downloadedAt` | `downloadedAt` | DateTime | Optional | UTC; ghi khi kích hoạt (R-08) | DAC-M01-012 |

`resources[]` **không** là thuộc tính lưu trên dòng này: S4 biểu diễn nó bằng quan hệ REL-012 tới OfflineResource (S4 §2, "Modeling Principles"). Quan hệ: REL-011 (`routeId → Route.routeId`), REL-012. Mỗi tuyến tối đa một gói `SAN_SANG` active (DAC-M01-008), do con trỏ `activePackages` (§3) và transaction kích hoạt bảo đảm.

### 2.4 OfflineResource — store `offlineResources` (Physical §11; S4 OfflineResource)

| Field | S4 path | Kiểu logic | Presence | Constraint | DAC |
|---|---|---|---|---|---|
| `routeId`, `contentVersion`, `qrIdentifier` | | String, Integer, String | Required | PK `[routeId+contentVersion+qrIdentifier]`; index `[routeId+contentVersion]`, `qrIdentifier`; `qrIdentifier` duy nhất trong gói và có trong `manifest` | DAC-M01-014 |
| `checkpointId` | `checkpointId` | String | Required | checkpoint `OFFLINE_REQUIRED` của manifest chứa QR; không phải identity | DAC-M01-014 |
| `objectName.vi/.en` | | String | Required | không rỗng | DAC-M01-015 |
| `localizedContent.vi.introductionText`, `localizedContent.en.introductionText` | | String | Required | không rỗng | DAC-M01-015 |
| `staticImages` | `staticImages` | Array&lt;String&gt; | Required | có thể rỗng; byte của mọi phần tử có trong `imageBytes` | DAC-M01-015 |

Đúng một resource cho mỗi QR của mỗi checkpoint `OFFLINE_REQUIRED` và không có cho `ONLINE_AVAILABLE` (DAC-M01-014). Quan hệ: REL-012, REL-028 (`qrIdentifier → QRCode`), REL-030 (`checkpointId → Checkpoint`, tham chiếu identity lịch sử, không FK xuyên store).

## 3. Store kỹ thuật (Physical §11: "physical representation; they add no entity or transport property")

Key theo Physical §11. Nội dung giá trị là **plan decision** ([research.md](research.md) R-08); không trường nào ở đây là thuộc tính contract hay entity.

| Store | Key / index (Physical §11) | Nội dung giá trị (plan decision) | Ai đọc |
|---|---|---|---|
| `activePackages` | PK `routeId` | `{ routeId, contentVersion }` — con trỏ tới gói `SAN_SANG` active duy nhất của tuyến | M01; hàm đọc công khai của M01 dùng nó khi M02 hỏi |
| `packageCandidates` | PK `routeId` | `{ routeId, operationToken, phase: 'DANG_TAI' \| 'CHUA_HOAN_TAT', targetContentVersion?, startedAt, failedAt?, staged? }`; `staged` = bundle đã kiểm tra (giá trị gói, resources, danh sách `{ sourceRef, blob }`) chỉ có giữa bước staging và kích hoạt | chỉ M01; không bao giờ lộ cho M02 |
| `imageBytes` | PK `[routeId+contentVersion+sourceRef]`; index `[routeId+contentVersion]` | `{ routeId, contentVersion, sourceRef, blob }` — byte ảnh khai báo và sơ đồ offline của gói active | M01; M02 qua `readPackageImage` |

`operationToken` là UUID do `crypto.randomUUID()` sinh; `startedAt`/`failedAt` là chuỗi ISO-8601 UTC. `phase` dùng lại hai giá trị enum của `OfflinePackage.status` để UI hiển thị trạng thái, nhưng dòng candidate không phải dòng OfflinePackage.

## 4. Schema Dexie version 1 (`src/shared/db/visitorDb.ts`)

Chép 1:1 từ Physical §11 (cú pháp Dexie: `&` = unique, `[a+b]` = compound). Store M02 được khai báo ở đây chỉ vì một database chỉ có một chuỗi version; nội dung của chúng thuộc package 002 ([research.md](research.md) R-07, P-01).

| Store | Chuỗi `stores()` | Chủ sở hữu |
|---|---|---|
| `languagePreference` | `slot` | M01 |
| `selectedRouteContext` | `slot, &handoffId` | M01 |
| `offlinePackages` | `[routeId+contentVersion], routeId` | M01 |
| `offlineResources` | `[routeId+contentVersion+qrIdentifier], [routeId+contentVersion], qrIdentifier` | M01 |
| `activePackages` | `routeId` | M01 (kỹ thuật) |
| `packageCandidates` | `routeId` | M01 (kỹ thuật) |
| `imageBytes` | `[routeId+contentVersion+sourceRef], [routeId+contentVersion]` | M01 (kỹ thuật) |
| `playSessions` | `sessionId, &sourceHandoffId, status` | M02 |
| `checkpointVisits` | `[sessionId+checkpointId], sessionId` | M02 |
| `pendingSyncItems` | `sessionId, syncStatus` | M02 |

## 5. Contract / projection (không lưu như entity riêng)

### 5.1 Đầu vào từ M03 (giữ trong bộ nhớ, không lưu)

| Tên (giữ nguyên) | Loại | Nơi giữ trong M01 | Contract file |
|---|---|---|---|
| Published Route projection | Projection công khai của M03 | bộ nhớ: danh mục đọc thành công lần cuối của phiên chạy (R-13); dòng của một tuyến khi xem chi tiết/Start | [m03-publication-consumer-contract.md](contracts/m03-publication-consumer-contract.md) |
| `JourneySnapshot` | Entity M03 được phát hành nguyên dạng | bộ nhớ trong một thao tác Start/tải gói; chỉ phần chiếu của nó được lưu (manifest, resources, `offlineRouteMap`) | [m03-publication-consumer-contract.md](contracts/m03-publication-consumer-contract.md) |

Physical §2: Published Route, `offlineRouteMap`, `routeEssentials` và mọi manifest đóng băng không lưu như entity riêng.

### 5.2 Đầu ra cho M02 (lắp từ store, validate khi đọc)

| Contract (giữ nguyên tên) | Lắp từ | Hàm đọc (bề mặt công khai M01) | Contract file |
|---|---|---|---|
| `LanguagePreference` | `languagePreference.current` bỏ `slot` | `readLanguagePreference()`, `useLanguagePreference()` | [language-preference-contract.md](contracts/language-preference-contract.md) |
| `SelectedRouteContext v3` | `selectedRouteContext.current` bỏ `slot` | `readSelectedRouteContext()` | [selected-route-context-v3-contract.md](contracts/selected-route-context-v3-contract.md) |
| ready `OfflinePackage` (+ `OfflineResource`) | `activePackages[routeId]` → dòng `offlinePackages` + mọi `offlineResources` cùng `[routeId+contentVersion]` thành `resources[]`; kiểm byte trong `imageBytes` | `readActiveOfflinePackage(routeId)`, `findOfflineResource(routeId, qrIdentifier)`, `readPackageImage(...)` | [offline-package-contract.md](contracts/offline-package-contract.md) |

Các manifest (`SelectedRouteContext v3.routeJourneyManifest`, `OfflinePackage.manifest`) là bản chiếu giá trị của `JourneySnapshot`, không phải entity M03 mới (spec-M01 §5.3). `OfflineStationContent` là view chỉ-đọc của M02 trên một `OfflineResource`, không lưu riêng (spec-M02 §5.1).

## 6. Transient UI state (không lưu, không phải contract)

| State | Nơi giữ | Ghi chú |
|---|---|---|
| `RecommendationContext` (một giá trị mỗi nhóm tag) | React state của SCR-M01-002 | HC-007; DAC-M01-018 |
| Local view danh mục gần nhất + cờ "dữ liệu cũ" | module state của M01 (bộ nhớ) | R-13; không lưu bền |
| Trạng thái nguồn (`đang đọc` / `khả dụng` / `không khả dụng`) | React state theo màn | R-05 |
| Dialog quyết định offline (mở/đóng, lựa chọn) | React state của SCR-M01-003 | FR-M01-006; không chọn ngầm |
| Start đang chạy | Web Lock `cpq:m01:start` + cờ nút | R-09 |
| Tiến độ tải (số ảnh đã tải) | React state, tùy chọn | spec-M01 §10.2 (deferred) |
| Signed URL hiển thị ảnh online | bộ nhớ; không lưu, không đưa vào gói | R-06 |

## 7. Chuyển trạng thái và thao tác (S4 §8; spec-M01 §4.8)

| Entity / store | Chuyển | Thao tác | Guard chính | FR / BR / SF |
|---|---|---|---|---|
| LanguagePreference | vắng → `vi`/`en`; `vi` ↔ `en` | chọn ngôn ngữ | chỉ `vi`/`en`; không đổi gói/phiên | FR-M01-001; BR-M01-001; SF-M01-001-01…04 |
| OfflinePackage | `CHUA_TAI`/`CHUA_HOAN_TAT` → `DANG_TAI` | Tải / Tải lại | lock tuyến rảnh; nguồn khả dụng; tuyến `HOAT_DONG` | FR-M01-007; SF-M01-004-05 |
| OfflinePackage | `DANG_TAI` → `SAN_SANG` + `CURRENT` | kích hoạt | candidate đủ theo spec-M01 §5.4; token khớp; một transaction | FR-M01-008; BR-M01-004, 005; SF-M01-005-03, 04 |
| OfflinePackage | `DANG_TAI` → `CHUA_HOAN_TAT` | lỗi khi chưa có gói cũ | bỏ dữ liệu staged | FR-M01-008; SF-M01-005-05 |
| OfflinePackage | `SAN_SANG CURRENT` → `SAN_SANG OUTDATED` | đọc nguồn thấy version lớn hơn | — | FR-M01-010; SF-M01-005-08 |
| OfflinePackage | `OUTDATED` → `CURRENT` (gói mới) / giữ `OUTDATED` (candidate lỗi) | cập nhật lười | gói cũ luôn đọc được | FR-M01-010; BR-M01-006; SF-M01-005-09, 10 |
| OfflinePackage | `SAN_SANG` → `CHUA_TAI` | Xóa (đã xác nhận) | lock tuyến rảnh; một transaction xóa gói, resources, byte, candidate, con trỏ; giữ context và dữ liệu M02 | FR-M01-009; SF-M01-005-07 |
| OfflinePackage.`routeEssentials` | thay giá trị | đọc nguồn thành công | gói active còn là gói đó; lỗi giữ bản cũ | FR-M01-014; SF-M01-005-13, 14 |
| SelectedRouteContext | (thay) → `AUTHORIZED` | Start | nguồn xác nhận tuyến/snapshot, hoặc offline có gói `SAN_SANG`; một transaction | FR-M01-011, 012; BR-M01-008, 009, 015; SF-M01-006-01…08 |
| SelectedRouteContext | `AUTHORIZED` → `REVOKED` | đọc nguồn thấy tuyến `TAM_DONG`/`LUU_TRU` | chỉ context hiện tại của đúng tuyến | BR-M01-011; SF-M01-006-07 |

## 8. Bất biến và giữ lại

- `routeJourneyManifest`, `manifest`, resources và `offlineRouteMap` của một gói không đổi sau khi commit; `routeEssentials` là bản sao theo thời điểm, được thay nguyên khối (S4 §6).
- Không bao giờ lộ candidate/staging cho M02: M02 chỉ đọc qua hàm của M01, các hàm đó đi qua `activePackages` và bỏ qua `packageCandidates` (FR-M01-013; constitution IV).
- Xóa gói không xóa `SelectedRouteContext` và không chạm store M02 (spec-M01 §6.4).
- Mất dữ liệu trình duyệt có thể làm mất preference, context, gói; không có khôi phục xuyên thiết bị (spec-M01 §5.4, §9.2).

## 9. Ánh xạ DAC-M01

| DAC | Thực thi trong M01 |
|---|---|
| DAC-M01-001 | schema `LanguagePreference`; ghi một transaction |
| DAC-M01-002–007 | schema `SelectedRouteContextV3` (literal `3`, UUID, bằng nhau `routeId`, `expiresAt − authorizedAt = 86 400 000 ms`, enum, manifest); unique index `handoffId`; ghi một transaction |
| DAC-M01-007, 008 | hàm dựng manifest từ snapshot; kiểm tra candidate; PK `[routeId+contentVersion]`; con trỏ `activePackages` |
| DAC-M01-009 | biểu diễn trạng thái (R-08); hàm đọc trả `null` nếu không `SAN_SANG` |
| DAC-M01-010, 015 | kiểm tra byte có trong `imageBytes` trước khi kích hoạt và khi đọc |
| DAC-M01-011 | kiểm tra essentials khi tạo gói và khi làm mới (R-10) |
| DAC-M01-012 | `downloadedAt` ghi khi kích hoạt |
| DAC-M01-013 | transaction kích hoạt + giữ gói cũ khi lỗi (R-08) |
| DAC-M01-014 | kiểm tra tập resource đúng bằng tập QR của checkpoint `OFFLINE_REQUIRED` |
| DAC-M01-016 | dialog quyết định offline không bao giờ khóa nút Tải khi thiếu ước tính |
| DAC-M01-017 | lọc danh mục: `HOAT_DONG` + `activeContentVersion` khác null + dòng qua schema; snapshot thắng cờ |
| DAC-M01-018 | hàm gợi ý: thiếu/sai enum → không so khớp; rỗng hợp lệ; không nới tiêu chí |

## 10. Phụ thuộc cross-module

| Hướng | Phụ thuộc | Điểm cần giữ |
|---|---|---|
| M03 → M01 | `api.published_routes`, `api.active_journey_snapshots`, signed URL cho `sourceRef` (bucket `quest-media`) | chỉ đọc; chỉ `HOAT_DONG` + `activeContentVersion` chọn được; snapshot bất biến; cần M03 giai đoạn B (R-01) |
| M01 → M02 | `LanguagePreference`, `SelectedRouteContext v3`, ready `OfflinePackage` qua hàm đọc của `src/modules/m01/index.ts` | M02 chỉ đọc; không thấy staging; M02 tự kiểm v3/`AUTHORIZED`/chưa dùng/chưa hết hạn (spec-M02 §5.1, BR-M02-017) |
| M01 ↔ M02 | database `cuc-phuong-quest` dùng chung, schema khai báo một nơi | 002 không tạo database thứ hai (R-07, P-01) |
