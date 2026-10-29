# Contract — Published Route projection và JourneySnapshot (M03 → M01, phía consumer)

| Mục | Giá trị |
|---|---|
| Producer | M03 (plan đã duyệt: [publication-public-contract.md](../../003-m03-operations-content-administration/contracts/publication-public-contract.md)) |
| Consumer | M01 (FN-M01-002…006; FR-M01-002, 003, 004, 005, 007, 010, 011, 014). M02 không đọc trực tiếp; nhận journey qua `SelectedRouteContext v3` |
| Tên contract | **Published Route projection**, **`JourneySnapshot`** (AGENTS.md §3.2; giữ nguyên tên, không hậu tố version) |
| Nguồn hình dạng | [spec-M01](../../../docs/spec/spec-M01.md) §5.3 "Published Route input", "JourneySnapshot input" = [spec-M03](../../../docs/spec/spec-M03.md) §5.1 (cùng shape, M03 v3.7 là producer baseline). Field table không chép lại ở đây để tránh lệch; nếu file này lệch với spec, spec thắng |
| Transport | Data API (PostgREST) đọc view `api.published_routes`, `api.active_journey_snapshots` (Physical §7.1), role `anon`; media qua signed URL của bucket private `quest-media` (Physical §9) |
| Schema dùng chung | `src/shared/contracts/publishedRoute.ts`, `src/shared/contracts/journeySnapshot.ts` — **do package 003 sở hữu**; M01 import, không định nghĩa lại ([research.md](../research.md) R-04) |
| Adapter M01 | `src/modules/m01/api/` (supabase + giả); timeout `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8, **provisional** (spec-M01 §9.3) |

## 1. Ranh giới

M01 chỉ đọc; không bao giờ ghi dữ liệu M03 (spec-M01 §1.4). M01 không sửa hoặc bổ sung dữ liệu công khai bị thiếu, và ẩn trường tùy chọn vắng (spec-M01 §11.2). Lần đọc thành công thấy tuyến không còn khả dụng là cách duy nhất M01 biết tuyến đã đóng; M03 không đẩy thông báo (contract M03 §1).

## 2. Ba lần đọc của M01

| Đọc | Truy vấn (logic) | Dùng cho | Timeout |
|---|---|---|---|
| R1 Danh mục | mọi dòng của `api.published_routes` | SCR-M01-001, SCR-M01-002; phát hiện đóng tuyến; `OUTDATED`; làm mới essentials | 8 s (provisional) |
| R2 Một tuyến | dòng `api.published_routes` có `routeId` | SCR-M01-003; Start online; tải gói | 8 s (provisional) |
| R3 Snapshot active | dòng `api.active_journey_snapshots` có `routeId` | Start online; tải gói | 8 s (provisional) |

Nguồn khả dụng chỉ khi request trả thành công trong thời hạn **và** dữ liệu qua schema (§3). `navigator.onLine` không bao giờ đủ để coi là online (spec-M01 §9.3). Ánh xạ tên cột ↔ key camelCase chỉ nằm trong adapter (Physical §3); xem điểm L-01 ở [research.md](../research.md) §5.

## 3. Kiểm tra phía consumer

Schema dùng chung kiểm **shape**: kiểu, presence Required/Conditional/Optional, enum, non-empty, both-or-none và các ràng buộc chéo của spec. Schema **không** kiểm giới hạn độ dài/số phần tử/khoảng số (spec-M03 §5.3, câu cuối; các giá trị đó là provisional). M01 thêm các kiểm tra consumer của spec-M01 §5.4:

| Mục | Kiểm tra | Hậu quả khi sai | Nguồn |
|---|---|---|---|
| Dòng tuyến chọn được | `status = HOAT_DONG` và `activeContentVersion` có giá trị và dòng qua schema | không hiện trong danh mục/gợi ý; không Start, không tải | BR-M01-002; DAC-M01-017; SC-M01-001 |
| Dòng tuyến `TAM_DONG`/`LUU_TRU` | — | bỏ khỏi lựa chọn mới; thu hồi context hiện tại cùng tuyến | BR-M01-011; US-M01-05 |
| Dòng không qua schema | — | coi là không hợp lệ; không sửa, không dùng | spec-M01 §5.4, §11.2 |
| Snapshot | `status = DA_CONG_BO`; `routeId` khớp; `contentVersion = activeContentVersion` của dòng tuyến cùng thao tác (lệch → đọc lại một lần, vẫn lệch → nguồn không khả dụng); ID/`sequence` duy nhất; tên song ngữ; `qrIdentifiers` không rỗng | không dùng cho Start/tải | spec-M01 §5.4 "Snapshot" |
| Offline resource | chỉ ở checkpoint `OFFLINE_REQUIRED`; đúng một mục cho mỗi `qrIdentifier`; đủ hai ngôn ngữ | candidate không được sẵn sàng | spec-M01 §5.4 "Offline resource"; DAC-M01-014 |
| Cờ vs snapshot | cờ `hasOfflineRequiredCheckpoint`/`hasOfflineRouteMap` chỉ để quyết định sớm | khi snapshot đã tải khác cờ, theo snapshot | BR-M01-012; FR-M01-005 |
| `estimatedOfflineSizeBytes` | Optional | vắng → "Chưa có thông tin dung lượng."; không bao giờ chặn Tải | BR-M01-016; DAC-M01-016; SC-M01-009 |
| `timeTags` | dùng nguyên giá trị M03 suy ra | M01 không tính lại | spec-M01 §4.2 |

## 4. Media

| Ảnh | Cách đọc | Lưu offline? | Nguồn |
|---|---|---|---|
| `thumbnail.sourceRef`, `gallery[].sourceRef`, `routeMap.sourceRef` | signed URL tạo bằng `anon`; lỗi tải → placeholder trung tính | không (chỉ online) | BR-M01-013; FR-M01-002, 003 |
| `offlineResources[].staticImages[]`, `offlineRouteMap.sourceRef` (snapshot) | signed URL → `fetch` → `Blob`; "đọc được" = HTTP 2xx, `size > 0`, `type` là `image/*`; timeout kỹ thuật 60 s mỗi ảnh | có, vào `imageBytes` | FR-M01-007, 008; [research.md](../research.md) R-06 |

Contract chỉ mang `sourceRef`; signed URL không bao giờ được lưu vào gói hay context, và không được tính là đã tải (constitution VI). Workbox không cache response media đã ký.

## 5. Ánh xạ sang dữ liệu M01

| Nguồn M03 | Đích M01 | Ghi chú |
|---|---|---|
| `JourneySnapshot.{routeId, contentVersion, checkpoints[].{checkpointId, sequence, checkpointName, connectivityMode, qrIdentifiers}}` | `SelectedRouteContext v3.routeJourneyManifest`, `OfflinePackage.manifest` | bản sao giá trị, không phân loại lại (DAC-M01-007) |
| `JourneySnapshot.checkpoints[].offlineResources[]` (+ `checkpointId` của checkpoint chứa nó) | `OfflinePackage.resources[]` / store `offlineResources` | một resource mỗi QR (BR-M01-004) |
| `JourneySnapshot.offlineRouteMap` | `OfflinePackage.offlineRouteMap` + byte | chỉ khi snapshot có (BR-M01-013) |
| Published Route `{name, startingPoint, participationRequirements?, safetyWarning?}` | `OfflinePackage.routeEssentials` + `capturedAt` | chỉ text; làm mới độc lập với version (BR-M01-014) |
| Published Route `activeContentVersion` | so với `OfflinePackage.contentVersion` | lớn hơn → `OUTDATED` (FR-M01-010) |

## 6. Lỗi và tín hiệu

| Tình huống | M01 làm |
|---|---|
| Lỗi mạng, lỗi Data API, quá 8 s (provisional) | nguồn không khả dụng: danh mục giữ local view có nhãn cũ (hoặc "Source unavailable"); chi tiết dùng essentials đã lưu nếu có gói; Start đi nhánh offline (FR-M01-002, 003, 011) |
| Tuyến chưa từng xuất bản | không có dòng → không xuất hiện |
| Không có snapshot active | không Start online, không tải |
| Lỗi tạo signed URL hoặc tải byte khi dựng gói | tải gói lỗi (R-08 bước 6) |

## 7. Truy vết test (dành cho tasks)

| Kiểm thử | BR / SC / DAC |
|---|---|
| Fixture consumer: tuyến `HOAT_DONG`, `TAM_DONG`, `LUU_TRU`, thiếu `activeContentVersion`, dòng hỏng → chỉ dòng hợp lệ `HOAT_DONG` hiện | BR-M01-002; SC-M01-001; DAC-M01-017 |
| Schema không từ chối chuỗi dài hơn giới hạn provisional | spec-M03 §5.3; R-04 |
| Snapshot lệch version với dòng tuyến → đọc lại một lần rồi coi là nguồn không khả dụng | spec-M01 §5.4 |
| Cờ nói cần gói nhưng snapshot không có `OFFLINE_REQUIRED` và không có `offlineRouteMap` → gói vẫn sẵn sàng với `resources` rỗng | BR-M01-012; SC-M01-010 |
| `estimatedOfflineSizeBytes` vắng → Tải vẫn bật | BR-M01-016; SC-M01-009 |
| Request treo quá 8 s → coi là lỗi | spec-M01 §9.3 |
