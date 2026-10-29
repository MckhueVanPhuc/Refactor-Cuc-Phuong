# Contract — ready OfflinePackage với OfflineResource (M01 → M02)

| Mục | Giá trị |
|---|---|
| Producer | M01 (FN-M01-004, FN-M01-005, FN-M01-007; FR-M01-005…010, 013, 014; BR-M01-004…007, 012…014, 016) |
| Consumer | M02 (spec-M02 §5.1 "Content inputs"); M01 (SCR-M01-003, SCR-M01-004, Start offline) |
| Tên contract | **`OfflinePackage`** ở trạng thái `SAN_SANG` ("ready `OfflinePackage`", AGENTS.md §3.2); entity con **`OfflineResource`**; M02 xem một resource qua view `OfflineStationContent` của M02 |
| Nguồn hình dạng | [spec-M01](../../../docs/spec/spec-M01.md) §5.3 "OfflinePackage output"; spec-M02 §5.1; S4 OfflinePackage, OfflineResource; DAC-M01-007…015 |
| Transport | giá trị dùng chung trong IndexedDB: `activePackages` → `offlinePackages` + `offlineResources` + `imageBytes` (Physical §11) |
| Schema dùng chung | `src/shared/contracts/offlinePackage.ts` — `OfflinePackage`, `OfflineResource` (Zod; M01 sở hữu) |

## 1. Hình dạng

Đúng bảng "OfflinePackage output" của spec-M01 §5.3 (spec-M02 §5.1 dùng cùng payload, bỏ qua `offlineRouteMap` và `routeEssentials`). Tóm tắt các nhóm:

| Nhóm | Field | Presence |
|---|---|---|
| Định danh | `routeId`, `contentVersion` | Required |
| Trạng thái | `status` Enum(`CHUA_TAI`, `DANG_TAI`, `SAN_SANG`, `CHUA_HOAN_TAT`); `versionStatus` Enum(`CURRENT`, `OUTDATED`) | Required; Conditional (khi `SAN_SANG`) |
| Manifest | `manifest.{routeId, contentVersion, checkpoints[].{checkpointId, sequence, checkpointName.{vi,en}, connectivityMode, qrIdentifiers}}` | Required |
| Resources | `resources[].{qrIdentifier, checkpointId, objectName.{vi,en}, localizedContent.{vi,en}.introductionText, staticImages[]}` | Required (có thể rỗng khi không có checkpoint `OFFLINE_REQUIRED`) |
| Sơ đồ offline | `offlineRouteMap.{sourceRef, caption?.{vi,en}}` | Optional (chỉ khi snapshot nguồn có) |
| Chữ cốt lõi | `routeEssentials.{capturedAt, name.{vi,en}, startingPoint.{vi,en}, participationRequirements?, safetyWarning?}` | Required |
| Thời điểm tải | `downloadedAt` | Optional |

Giá trị trả cho consumer luôn có `status = SAN_SANG`. Schema có `superRefine` cho: `manifest.routeId/contentVersion` bằng giá trị ngoài; `checkpointId`/`sequence` duy nhất; tập `resources[].qrIdentifier` **bằng đúng** hợp các `qrIdentifiers` của checkpoint `OFFLINE_REQUIRED`, không có cho `ONLINE_AVAILABLE`; `resources[].checkpointId` là checkpoint `OFFLINE_REQUIRED` chứa QR đó; `qrIdentifier` duy nhất trong gói; both-or-none cho caption và text tùy chọn.

## 2. Lắp giá trị từ store (transport ≠ canonical)

| Phần contract | Store | Ghi chú |
|---|---|---|
| gói nào là active | `activePackages[routeId]` → `{ routeId, contentVersion }` | không có → không có gói sẵn sàng |
| mọi field trừ `resources` | `offlinePackages[[routeId+contentVersion]]` | dòng chỉ tồn tại khi `SAN_SANG` |
| `resources[]` | mọi `offlineResources` có `[routeId+contentVersion]` | S4 REL-012: quan hệ, không phải mảng lưu trên dòng gói |
| byte của `staticImages[]`, `offlineRouteMap.sourceRef` | `imageBytes[[routeId+contentVersion+sourceRef]]` | không nằm trong giá trị contract; đọc riêng bằng `readPackageImage` |

## 3. Bề mặt cho M02 (`src/modules/m01/index.ts`)

| Export | Kiểu trả | Hành vi |
|---|---|---|
| `readActiveOfflinePackage(routeId)` | `Promise<OfflinePackage \| null>` | trong một transaction chỉ-đọc: theo con trỏ, lắp giá trị, kiểm mọi `sourceRef` khai báo có byte; validate schema. Không có con trỏ, không qua schema, thiếu byte → `null` (gói không đọc được = chưa sẵn sàng, FR-M01-005) |
| `findOfflineResource(routeId, qrIdentifier)` | `Promise<OfflineResource \| null>` | resource có `qrIdentifier` trong gói active của tuyến (một gói có thể cũ hơn manifest của phiên, spec-M02 §5.1) |
| `readPackageImage(routeId, contentVersion, sourceRef)` | `Promise<Blob \| null>` | byte ảnh của gói active; không phải gói active → `null` |

Không có hàm nào đọc `packageCandidates`. M02 không ghi bất kỳ store nào của M01 (FR-M01-013; constitution II).

## 4. Dựng gói (chỉ M01) — kiểm tra trước khi `SAN_SANG`

Pipeline ở [research.md](../research.md) R-08; tuần tự hóa ở R-09. Candidate chỉ được kích hoạt khi **tất cả** đúng (spec-M01 §5.4; BR-M01-004; SC-M01-003, SC-M01-007):

| # | Kiểm tra | Nguồn |
|---|---|---|
| 1 | Snapshot là snapshot active hiện hành của tuyến `HOAT_DONG`, qua schema dùng chung | FR-M01-007; spec-M01 §5.4 "Snapshot" |
| 2 | `manifest` chứa mọi checkpoint của snapshot, đúng thứ tự/giá trị | DAC-M01-007 |
| 3 | Đúng một resource cho mỗi QR của mỗi checkpoint `OFFLINE_REQUIRED`; không có cho `ONLINE_AVAILABLE`; cả hai ngôn ngữ | DAC-M01-014, 015 |
| 4 | Mọi ảnh khai báo của mọi resource đã tải và đọc được (HTTP 2xx, `size > 0`, `image/*`); không khai báo ảnh nào vẫn hợp lệ | DAC-M01-015; spec-M01 §5.4 edge cases |
| 5 | Khi snapshot có `offlineRouteMap`: ảnh đọc được và đã lưu | DAC-M01-010; SF-M01-005-12 |
| 6 | `routeEssentials`: tên và điểm xuất phát đủ hai ngôn ngữ; text tùy chọn both-or-none; có `capturedAt` | DAC-M01-011; SF-M01-005-13 |
| 7 | `manifest`/resources cùng `(routeId, contentVersion)` | DAC-M01-008 |

Sai bất kỳ mục nào, lỗi mạng, timeout, lỗi lưu trữ (kể cả hết quota) → bỏ candidate; gói `SAN_SANG` cũ (nếu có) giữ nguyên, ngược lại `CHUA_HOAN_TAT`; du khách được báo tải chưa hoàn tất và có thể thử lại (FR-M01-008; BR-M01-006; spec-M01 §5.4).

## 5. Vòng đời đã công bố

| Sự kiện | Ảnh hưởng tới giá trị M02 thấy | Nguồn |
|---|---|---|
| Kích hoạt candidate | con trỏ chuyển nguyên tử sang gói mới `CURRENT`; phiên bản cũ bị xóa cùng transaction | FR-M01-008, 010; SF-M01-005-09 |
| Phát hiện version mới | `versionStatus = OUTDATED`; gói vẫn dùng được; M02 hiện cảnh báo khi biết | FR-M01-010; constitution VI |
| Làm mới essentials | `routeEssentials` thay nguyên khối (M02 bỏ qua field này) | FR-M01-014 |
| Xóa (du khách xác nhận) | con trỏ, gói, resources, byte, candidate xóa trong một transaction; context và dữ liệu M02 giữ nguyên | FR-M01-009; spec-M01 §6.4 |
| Đổi ngôn ngữ | không ảnh hưởng (gói chứa cả hai ngôn ngữ) | BR-M01-001 |
| Tuyến đóng ở M03 | không xóa gói; Start offline vẫn có thể dùng gói | spec-M01 §5.4; BR-M01-011 |

## 6. Truy vết test

| Kiểm thử | BR / SC / DAC |
|---|---|
| Tải thành công → `SAN_SANG` + `CURRENT`, có essentials và `capturedAt` | US-M01-03 mục 2; SC-M01-003 |
| Thiếu một ảnh QR hoặc ảnh sơ đồ offline → không `SAN_SANG` | SC-M01-007; DAC-M01-010, 015 |
| Không khai báo ảnh nào → vẫn `SAN_SANG` | spec-M01 §5.4 |
| Cập nhật lỗi (mạng, schema, quota) → gói cũ `SAN_SANG` + `OUTDATED`, đọc được | SC-M01-004; BR-M01-006 |
| Lần tải đầu lỗi → `CHUA_HOAN_TAT`, không có dòng `offlinePackages` | SF-M01-005-05 |
| Trong lúc tải, `readActiveOfflinePackage` không bao giờ trả dữ liệu candidate | FR-M01-013; DAC-M01-009 |
| Bấm Tải hai lần / Tải và Xóa đồng thời (một và hai tab) → một thao tác | FR-M01-009; SF-M01-005-11 |
| Đóng tab giữa lúc tải → mở lại thấy candidate mồ côi được dọn | R-08 |
| Xóa gói → context còn nguyên; store M02 không đổi | spec-M01 §6.4 |
| Gói bị hỏng (sửa tay một dòng trong test) → `null`; SCR-M01-004 hiện "Gói tải trước không đọc được" với Tải lại/Xóa | FR-M01-005; OQ-SCR-M01-004-003 |
| `staticImages` chỉ trỏ tới byte có trong `imageBytes` của gói | DAC-M01-015 |
