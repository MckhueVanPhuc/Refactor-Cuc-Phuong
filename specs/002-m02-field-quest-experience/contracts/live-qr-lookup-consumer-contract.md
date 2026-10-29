# Contract — LiveQrLookupResult với LiveStationContent và link QR công khai (M03 → M02, phía consumer)

| Mục | Giá trị |
|---|---|
| Producer | M03 (plan đã duyệt: [live-qr-lookup-contract.md](../../003-m03-operations-content-administration/contracts/live-qr-lookup-contract.md)) |
| Consumer | M02 (FN-M02-004, 005, 008; FR-M02-006, 011, 012, 013, 021, 022, 025, 026), cả khi có phiên và khách tự do |
| Tên contract | **`LiveQrLookupResult`** với **`LiveStationContent`** (AGENTS.md §3.2; constitution II) |
| Nguồn hình dạng | [spec-M02](../../../docs/spec/spec-M02.md) §5.1 "Live QR lookup" = spec-M03 §5.1 "Live QR lookup output". Field table không chép lại; spec thắng nếu lệch |
| Transport | `supabase.schema('api').rpc('lookup_qr', { p_qr_identifier, p_route_id? })` qua Data API (Physical §7.1), role `anon`; media qua signed URL bucket private (Physical §9) |
| Schema dùng chung | `src/shared/contracts/liveQrLookup.ts` — **package 003 sở hữu**; M02 import |
| Timeout | `LOOKUP_TIMEOUT_SECONDS` = 8 (**provisional**, spec-M02 BR-M02-005, §9) |

## 1. Request

| Field | Giá trị M02 gửi | Nguồn |
|---|---|---|
| `qrIdentifier` (`p_qr_identifier`) | đoạn path cuối của link (§2) | BR-M02-023; DAC-M02-011 |
| `routeId` (`p_route_id`) | `routeId` của phiên đang chạy; **không gửi** khi không có phiên | BR-M02-019; SC-M02-018 |

## 2. Link QR công khai

| Nguồn mã | Quy tắc | Khi sai |
|---|---|---|
| Trình quét trong app | chỉ nhận đúng `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`: cùng origin và path gốc với `VITE_QR_PUBLIC_BASE_URL`, đúng một đoạn sau `/q/`, không query, không fragment ([research.md](../research.md) R-07) | thông báo mã không hợp lệ, **không** lookup (FR-M02-026) |
| Trang `/q/:qrIdentifier` | identifier = tham số path | — |

M02 không kiểm định dạng identifier (chuỗi opaque). Link của môi trường khác (ví dụ mã BẢN THỬ in từ máy local khi đang chạy Production) bị coi là mã không hợp lệ.

## 3. Phân loại response

| Response | M02 coi là | Nguồn |
|---|---|---|
| Body qua schema, `outcome = VALID` (có `content`) | `VALID` | spec-M02 §5.1 |
| Body qua schema, `outcome = TEMPORARILY_CLOSED` (có `closedScope`) | `TEMPORARILY_CLOSED`; cùng một thông báo cho `ROUTE` và `CHECKPOINT` | BR-M02-015 |
| Body qua schema, `outcome = INVALID` | `INVALID` | — |
| Lỗi mạng, lỗi RPC, HTTP lỗi, quá 8 s, body không qua schema, `navigator.onLine === false` | **lỗi nguồn** — không bao giờ là `INVALID` | FR-M02-013; contract M03 §4 |

Kết quả lookup chỉ sống trong bộ nhớ của một lần quét/xem; không bao giờ lưu (spec-M02 §5.1).

## 4. Dùng `LiveStationContent`

| Field | M02 dùng cho |
|---|---|
| `checkpointId` | xác định checkpoint thuộc journey khi mã không có trong journey đóng băng (BR-M02-020) |
| `checkpointName`, `objectName`, `localizedContent.*.introductionText` | hiển thị theo ngôn ngữ hiện tại |
| `staticImages[]` | signed URL; lỗi → placeholder |
| `mediaResources[]` | lọc theo `spokenLanguage` = ngôn ngữ hiện tại hoặc `NONE`; phát khi bấm (BR-M02-016, 026) |
| `connectivityMode` | không dùng để quyết định nguồn nội dung (online luôn dùng nội dung live, BR-M02-009) |
| `qrIdentifier` | đối chiếu với mã đã quét |

Kết quả không mang `routeId`; M02 biết tuyến từ phiên của mình.

## 5. Truy vết test

| Kiểm thử | FR / BR / SC |
|---|---|
| Có phiên → request có `routeId`; khách tự do → không có | BR-M02-019; DAC-M02-011 |
| Mã không phải link, link sai base, link có query → `INVALID` không gọi mạng | FR-M02-026 |
| RPC lỗi 500, timeout 8 s, body hỏng → lỗi nguồn, không hiện "mã không hợp lệ" | FR-M02-013 |
| `TEMPORARILY_CLOSED` `ROUTE` và `CHECKPOINT` → cùng thông báo, không nội dung | BR-M02-015; SC-M02-009 |
| `mediaResources` có `vi`, `en`, `NONE` → hiện đúng tập theo ngôn ngữ; đổi ngôn ngữ đổi ngay và dừng tệp bị bỏ | BR-M02-026; SC-M02-019 |
| Hai mã của cùng checkpoint → hai nội dung | SC-M02-008 |
