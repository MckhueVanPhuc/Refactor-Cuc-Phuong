# Contract — LiveQrLookupResult với LiveStationContent (M03 → M02)

| Mục | Giá trị |
|---|---|
| Producer | M03 (FN-M03-009; FR-M03-012; BR-M03-I01…I06) |
| Consumer | M02 (quét trong app và trang link công khai `/q/{qrIdentifier}`), kể cả khách tự do |
| Tên contract | **`LiveQrLookupResult`** với **`LiveStationContent`** (AGENTS.md §3.2; constitution II). Liên quan: **link QR công khai in trên tem** (system-configuration "Integration contracts") |
| Nguồn hình dạng | [spec-M03](../../../docs/spec/spec-M03.md) §5.1 "Live QR lookup output"; §5.2.I. Spec thắng nếu lệch |
| Transport | RPC Data API `api.lookup_qr(p_qr_identifier text, p_route_id text default null)` (Physical §7.1); `EXECUTE` cho `anon` và `authenticated` |
| Schema dùng chung | `src/shared/contracts/liveQrLookup.ts` (Zod) |

## 1. Input

| Field | Kiểu | Presence | Ràng buộc |
|---|---|---|---|
| `qrIdentifier` | String | Required | lấy từ đoạn cuối của link `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`; khớp chính xác sau khi trim khoảng trắng hai đầu |
| `routeId` | String | Optional | tuyến mà người gọi đang đi; khách tự do không gửi. M03 **không** kiểm tra tuyến này có liệt kê điểm dừng hay không |

## 2. Output

| Field | Kiểu | Presence | Ràng buộc |
|---|---|---|---|
| `outcome` | Enum(`VALID`, `TEMPORARILY_CLOSED`, `INVALID`) | Required | theo thứ tự đánh giá ở §3 |
| `content` | `LiveStationContent` | Conditional | **chỉ** khi `outcome = VALID` |
| `closedScope` | Enum(`ROUTE`, `CHECKPOINT`) | Conditional | **chỉ** khi `outcome = TEMPORARILY_CLOSED` |

`LiveStationContent`:

| Field | Kiểu | Presence | Nguồn |
|---|---|---|---|
| `qrIdentifier` | String | Required | `qr_codes.qr_identifier` |
| `checkpointId` | String | Required | `qr_codes.checkpoint_id` |
| `checkpointName.vi/.en` | String | Required, không rỗng | revision `PHAT_HANH` của điểm dừng |
| `connectivityMode` | Enum(`ONLINE_AVAILABLE`, `OFFLINE_REQUIRED`) | Required | revision `PHAT_HANH` của điểm dừng |
| `objectName.vi/.en` | String | Required, không rỗng | revision `PHAT_HANH` của QR |
| `localizedContent.vi.introductionText`, `localizedContent.en.introductionText` | String | Required, không rỗng | revision `PHAT_HANH` của QR |
| `staticImages` | Array String | Required (có thể rỗng) | `sourceRef` của media `IMAGE` trong `content.mediaItems` |
| `mediaResources[]` (`type` ∈ `AUDIO`/`VIDEO`, `sourceRef`, `spokenLanguage` ∈ `vi`/`en`/`NONE`) | Array | Required (có thể rỗng) | media AV trong `content.mediaItems`; **luôn rỗng** khi `OFFLINE_REQUIRED` |

Không có dữ liệu route trong output (BR-M03-I03). Không lộ bản nháp (BR-M03-I04).

## 3. Thứ tự đánh giá (BR-M03-I02) — tất định

1. Không tìm thấy QR, hoặc QR không `HOAT_DONG` (`NHAP`, `THU_HOI`) → `INVALID`.
2. Điểm dừng `NHAP` hoặc `LUU_TRU` → `INVALID`.
3. Có `routeId`, và tuyến không tồn tại hoặc đang `NHAP` → `INVALID`.
4. Có `routeId`, và tuyến `TAM_DONG` hoặc `LUU_TRU` → `TEMPORARILY_CLOSED`, `closedScope = ROUTE` (kể cả khi điểm dừng vẫn hoạt động).
5. Điểm dừng `TAM_DONG` → `TEMPORARILY_CLOSED`, `closedScope = CHECKPOINT`.
6. Còn lại → `VALID`.

Lookup dùng dữ liệu công khai hiện hành, không dùng snapshot, áp dụng cho cả hai connectivity mode (BR-M03-I01). Lookup **không ghi** gì: function là `STABLE`, chỉ đọc, không ghi audit và không ghi dữ liệu du khách (BR-M03-I04).

## 4. Lỗi nguồn (tín hiệu riêng)

| Tình huống | Producer làm | Consumer thấy |
|---|---|---|
| DB hoặc function lỗi, không kết luận được | raise error (không trả `outcome`) — Physical §7.1 | lỗi transport/RPC của supabase-js; M02 coi là "tra cứu lỗi", **không bao giờ** là `INVALID` (SC-M03-017) |
| Request không tới được server hoặc hết thời gian chờ | — | M02 áp `LOOKUP_TIMEOUT_SECONDS` của nó (spec-M02) |
| `qrIdentifier` rỗng sau khi trim | trả `INVALID` (bước 1) | `INVALID` |

Adapter phía M02 phân biệt: có body hợp lệ theo Zod → dùng `outcome`; mọi trường hợp khác → tín hiệu lỗi nguồn. Một body không qua Zod cũng được coi là lỗi nguồn, không phải `INVALID`.

## 5. Link QR công khai (liên quan)

- Nội dung in trên tem: đúng `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`; không có ngôn ngữ, tuyến, version hay tham số theo dõi nào (BR-M03-B04). `QR_PUBLIC_BASE_URL` là cấu hình môi trường (`VITE_QR_PUBLIC_BASE_URL`, [research.md](../research.md) R-14).
- `qrIdentifier`: ít nhất 16 ký tự `[A-Za-z0-9]` từ nguồn ngẫu nhiên an toàn, không mang nghĩa, duy nhất toàn hệ thống (BR-M03-B02; `qr_codes` CHECK).
- Link không mang trạng thái; hợp lệ hay đã đóng do lookup quyết định lúc quét.
- Ảnh in và nhãn bản thử: [admin-ui-flow-contract.md](admin-ui-flow-contract.md) §4.

## 6. Media trong output

`sourceRef` là đường dẫn trong bucket `quest-media` (private). Consumer tạo signed URL; policy Storage cho phép đọc object được tham chiếu bởi revision `PHAT_HANH` hoặc snapshot còn giữ ([media-storage-contract.md](media-storage-contract.md) §4). Workbox không cache response media đã ký (constitution VI).

## 7. Versioning

Hình dạng không đổi kể từ v3.6 (spec-M03 change notes). Thêm hoặc đổi trường cần spec-M03 §5.1 đổi trước và M02 được đồng bộ (§11 của spec).

## 8. Truy vết test

| Kiểm thử | BR / SC |
|---|---|
| Hai QR khác nhau của cùng điểm dừng trả hai nội dung khác nhau | SC-M03-012, BR-M03-E01 |
| Bảng sự thật cho 6 bước I02 (QR `NHAP`/`THU_HOI`/không tồn tại; điểm dừng `NHAP`/`LUU_TRU`/`TAM_DONG`; tuyến không tồn tại/`NHAP`/`TAM_DONG`/`LUU_TRU`; có/không `routeId`) | SC-M03-017, 023 |
| Lỗi nguồn không bao giờ là `INVALID` | SC-M03-017 |
| `OFFLINE_REQUIRED` → `mediaResources` rỗng; AV mang `spokenLanguage` | SC-M03-025, 039 |
| Bản nháp không lộ; lookup không ghi dòng nào (đếm dòng trước/sau trong transaction rollback) | BR-M03-I04 |
| Link chỉ có đúng một tham số đường dẫn | SC-M03-036 |
