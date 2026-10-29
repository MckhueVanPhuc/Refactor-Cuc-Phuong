# Contract — Published Route projection và JourneySnapshot (M03 → M01)

| Mục | Giá trị |
|---|---|
| Producer | M03 (FN-M03-001, FN-M03-006; FR-M03-008, 009, 010) |
| Consumer | M01 (đọc để browse, recommend, chuẩn bị gói offline, Start); M02 nhận gián tiếp qua `SelectedRouteContext v3` của M01, không đọc trực tiếp |
| Tên contract | **Published Route projection**, **`JourneySnapshot`** (AGENTS.md §3.2; giữ nguyên tên) |
| Nguồn hình dạng | [spec-M03](../../../docs/spec/spec-M03.md) §5.1 "Published Route projection", "JourneySnapshot output". Nếu file này lệch với spec, spec thắng. |
| Transport | Data API (PostgREST) đọc view `api.published_routes` và `api.active_journey_snapshots` (Physical §7.1); `anon` và `authenticated` đều được đọc |
| Schema dùng chung | `src/shared/contracts/publishedRoute.ts`, `src/shared/contracts/journeySnapshot.ts` (Zod; [research.md](../research.md) R-04) |

## 1. Mục đích và ranh giới

M03 công bố trạng thái công khai của tuyến và hành trình bất biến của từng phiên bản. M01 không ghi gì vào nguồn của M03. Lần đọc thành công thấy tuyến không còn khả dụng là cách duy nhất M01 biết tuyến đã đóng (system-configuration, "Module placement"). M03 không đẩy thông báo cho M01 hay M02 (BR-M03-H05).

## 2. Published Route projection

**Tồn tại khi:** tuyến đã được xuất bản ít nhất một lần, tức có revision `PHAT_HANH` và có `active_content_version`. Tuyến `NHAP` hoặc bị hủy thẳng sang `LUU_TRU` không có dòng (spec-M03 §5.1; Physical §7.1).

| Field | Kiểu | Presence | Nguồn trong M03 | Ghi chú |
|---|---|---|---|---|
| `routeId` | String | Required | `routes.route_id` | |
| `status` | Enum(`HOAT_DONG`, `TAM_DONG`, `LUU_TRU`) | Required | `routes.status` | chỉ `HOAT_DONG` là chọn được |
| `name.vi`, `name.en` | String | Required | revision `PHAT_HANH`, `content.name` | ≤ `NAME_MAX_CHARS` |
| `shortDescription.vi/.en` | String | Required | `content.shortDescription` | ≤ `ROUTE_SHORT_DESC_MAX_CHARS` |
| `description.vi/.en` | String | Required | `content.description` | ≤ `ROUTE_DESC_MAX_CHARS` |
| `startingPoint.vi/.en` | String | Required | `content.startingPoint` | ≤ `ROUTE_START_MAX_CHARS` |
| `thumbnail.sourceRef` | String | Required | `media.source_ref` của `content.thumbnailMediaId` | |
| `gallery[]` (`sourceRef`, `caption?{vi,en}`) | Array | Required (có thể rỗng) | `content.galleryItems` → media | ≤ `ROUTE_GALLERY_MAX_IMAGES`; phần tử đầu là ảnh bìa |
| `routeMap` (`sourceRef`, `caption?`) | Object | Optional | `content.routeMapMediaId`, `routeMapCaption` | sơ đồ tĩnh, không dẫn đường |
| `participationRequirements`, `preparation`, `bestTime`, `safetyWarning` | Object {vi,en} | Optional | `content.*` | cả hai ngôn ngữ hoặc không có (both-or-none) |
| `highlights[]` ({vi,en}) | Array | Required (có thể rỗng) | `content.highlights` | ≤ `ROUTE_HIGHLIGHTS_MAX_ITEMS` |
| `distanceKm` | Decimal | Required | `content.distanceKm` | > 0, ≤ `ROUTE_DISTANCE_MAX_KM`, tối đa một chữ số thập phân |
| `durationMin` | Integer | Required | `content.durationMin` | > 0, ≤ `ROUTE_DURATION_MAX_MIN` |
| `difficulty` | Enum(`NHE`, `TRUNG_BINH`, `KHO`) | Required | `content.difficulty` | |
| `timeTags` | Array của đúng một giá trị Enum(`TIME_NGAN`, `TIME_VUA`, `TIME_DAI`) | Required | **suy ra** từ `durationMin`: ≤ 90 → `TIME_NGAN`; 91–180 → `TIME_VUA`; > 180 → `TIME_DAI` (BR-M03-C11) | không bao giờ là input |
| `groupTags` | Array Enum | Required, ≥ 1, các giá trị phân biệt | `content.groupTags` | |
| `experienceTags` | Array Enum | Required, ≥ 1, các giá trị phân biệt | `content.experienceTags` | |
| `checkpointCount` | Integer ≥ 0 | Required | **suy ra** từ snapshot active | |
| `hasOfflineRequiredCheckpoint` | Boolean | Required | **suy ra** từ snapshot active | |
| `hasOfflineRouteMap` | Boolean | Required | **suy ra**: snapshot active có `offlineRouteMap` | |
| `checkpointSummaries[]` (`checkpointId`, `sequence`, `checkpointName{vi,en}`) | Array | Required | **suy ra** từ snapshot active, sắp theo `sequence` | chỉ được rỗng khi `status ≠ HOAT_DONG` |
| `activeContentVersion` | Integer | Required | `routes.active_content_version` | |

Quy tắc của view (Physical §7.1): owner-executed, `security_barrier`, field whitelist. Không lộ trường nội bộ: `closureReason`, `closedByUserId`, user id, ghi chú nội bộ, bản nháp. Giá trị suy ra đổi đúng khi version snapshot đổi (BR-M03-C11, T08). Văn bản thông tin tuyến không có version riêng: M01 tự lưu bản sao tại thời điểm tải (BR-M03-C15).

## 3. JourneySnapshot

**Tồn tại khi:** có ít nhất một snapshot `DA_CONG_BO`. View `api.active_journey_snapshots` chỉ trả snapshot active của mỗi tuyến; snapshot lịch sử không lộ ra (Physical §7.1).

| Field | Kiểu | Presence | Ràng buộc |
|---|---|---|---|
| `routeId` | String | Required | |
| `contentVersion` | Integer | Required | bắt đầu `1`, +1 mỗi snapshot, không bỏ số (BR-M03-G03) |
| `status` | Enum(`DA_CONG_BO`) | Required | |
| `publishedAt` | DateTime UTC | Required | |
| `previousContentVersion` | Integer | Optional | không có khi version 1; ngược lại bằng `contentVersion - 1` |
| `estimatedOfflineSizeBytes` | Integer | Optional | ước tính theo BR-M03-G10; consumer phải chấp nhận khi trường này vắng |
| `offlineRouteMap` (`sourceRef`, `caption?{vi,en}`) | Object | Optional | chỉ có khi nội dung đã xuất bản bật `offlineRouteMapRequired` (BR-M03-C16) |
| `checkpoints[]` | Array | Required | mọi và chỉ điểm dừng hoạt động của danh sách; id và `sequence` duy nhất; chỉ được rỗng khi tuyến không `HOAT_DONG` |
| `checkpoints[].checkpointId` | String | Required | |
| `checkpoints[].sequence` | Integer | Required | vị trí bắt đầu từ 1 trong danh sách; có thể có khoảng trống |
| `checkpoints[].checkpointName.vi/.en` | String | Required | không rỗng; đóng băng cho version này |
| `checkpoints[].connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | |
| `checkpoints[].qrIdentifiers` | Array String | Required, không rỗng | chỉ identifier đang hoạt động |
| `checkpoints[].offlineResources[]` | Array | Conditional | chỉ có với `OFFLINE_REQUIRED`; đúng một phần tử cho mỗi identifier |
| `…offlineResources[].qrIdentifier` | String | Conditional | duy nhất trong snapshot; thuộc cùng điểm dừng |
| `…offlineResources[].objectName.vi/.en` | String | Conditional | không rỗng |
| `…offlineResources[].localizedContent.{vi,en}.introductionText` | String | Conditional | không rỗng |
| `…offlineResources[].staticImages` | Array String | Conditional (có thể rỗng) | `sourceRef` ảnh của điểm tham quan đó |

Không có audio/video trong snapshot (spec-M03 §5.1; BR-M03-E04).

## 4. Khi nào có version mới (producer)

| Thay đổi | Version mới cho tuyến R? | BR |
|---|---|---|
| Xuất bản tuyến lần đầu | Có (version 1, atomic với `HOAT_DONG`) | C17, F04, G03 |
| Đổi danh sách hoặc thứ tự điểm dừng của R; bật/tắt sơ đồ offline hoặc đổi ảnh/chú thích của nó khi đang bật | Có, chỉ cho R | T06, C16, G04 |
| Đóng hoặc mở lại một điểm dừng mà R liệt kê | Có, cho mọi tuyến `HOAT_DONG`/`TAM_DONG` liệt kê nó, cùng lúc | H02, H06, X02 |
| Đổi tên hoặc mode của một điểm dừng đang hoạt động được liệt kê | Có, cho mọi tuyến liệt kê | G04 |
| Một điểm tham quan gia nhập hoặc bị thu hồi ở điểm dừng đang hoạt động | Có | E09, E13, G04 |
| Đổi tên, giới thiệu hoặc ảnh của điểm tham quan ở điểm dừng `OFFLINE_REQUIRED` đang hoạt động | Có | E06, G04 |
| Thông tin tuyến khác; nội dung ở điểm dừng `ONLINE_AVAILABLE`; audio/video; ghi chú nội bộ; in lại; lưu trữ điểm dừng đã đóng; xuất bản điểm dừng lần đầu | Không | G05 |
| Đóng tuyến | Không (version active giữ nguyên; `status = TAM_DONG`) | H03 |

Mọi snapshot thay thế của một thay đổi chuyển cùng lúc với chính thay đổi đó, trong một transaction; hoặc tất cả thành công, hoặc không gì đổi (BR-M03-F03, G06, X02). Snapshot ứng viên không bao giờ bị lộ (BR-M03-G09). Producer chỉ tạo version khi snapshot kết quả khác snapshot active ([research.md](../research.md) R-10).

## 5. Lỗi và tín hiệu với consumer

| Tình huống | M01 thấy |
|---|---|
| Mạng hoặc Data API lỗi | lỗi transport của supabase-js; M01 xử lý theo spec-M01 (không phải trách nhiệm của M03) |
| Tuyến `TAM_DONG`/`LUU_TRU` | dòng vẫn có, `status` tương ứng; M01 chặn Start mới (spec-M01) |
| Tuyến chưa từng xuất bản | không có dòng |
| Snapshot chưa từng tồn tại | không có dòng trong `api.active_journey_snapshots` |

## 6. Versioning và tương thích

- Tên contract và hình dạng chỉ đổi khi spec-M03 §5.1 đổi trước (constitution II). Thêm trường hiển thị chỉ được làm khi spec ghi rõ (ví dụ v3.7 clarification 4).
- `contentVersion` là version nội dung; không liên quan tới version build (`VITE_APP_VERSION`) hay version schema Dexie (environment.md §8).
- Snapshot được giữ lại, không có hard-delete (BR-M03-G08, DEC-S6-002); M01 không gửi xác nhận.

## 7. Truy vết test (dành cho tasks)

| Kiểm thử | BR / SC |
|---|---|
| Fixture Zod hợp lệ và không hợp lệ cho mọi field Required/Conditional/Optional | spec-M03 §5.1 |
| Tuyến chưa xuất bản vắng mặt; tuyến `TAM_DONG` có mặt nhưng không chọn được | SC-M03-001 |
| Không có trạng thái nửa vời khi publish lỗi (test rollback) | SC-M03-002, BR-M03-F03 |
| Version liên tục, snapshot cũ giữ nguyên | SC-M03-003 |
| Sơ đồ offline chỉ vào snapshot khi được đánh dấu | SC-M03-022 |
| Ước tính không tính audio/video; vắng ước tính không chặn | SC-M03-024 |
| Tuyến `HOAT_DONG` luôn có ≥ 1 điểm dừng hoạt động | SC-M03-030 |
