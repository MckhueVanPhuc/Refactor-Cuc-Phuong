# Contract — Luồng giao diện du khách M01 (màn hình → route → thao tác → trạng thái)

| Mục | Giá trị |
|---|---|
| Phạm vi | SCR-M01-001…004 và control ngôn ngữ dùng chung; app shell/PWA mà M01 quản lý phạm vi (system-configuration, "Runtime components") |
| Nguồn hành vi | [spec-M01](../../../docs/spec/spec-M01.md) §3, §4, §7; [screen list M01](../../../screens/screen%20list/screen-list-M01.md); [screen spec M01](../../../screens/screen-spec/M01/) (câu chữ lấy từ bảng copy ở đó) |
| Hình thức | [design-system.md](../../../docs/design/design-system.md) (token `--color-m01-*`, typography, spacing); icon chỉ từ `assets/icons/` |

File này không tạo màn hình, trường hay trạng thái mới: mỗi dòng trỏ tới screen spec hoặc FR/BR.

## 1. Route

| Path | Màn hình | Lazy chunk | Guard |
|---|---|---|---|
| `/` | SCR-M01-001 Danh mục tuyến | `m01-catalog` | chưa có `LanguagePreference` → panel chọn ngôn ngữ chặn toàn trang (SR-SCR-M01-001-002) |
| `/recommend` | SCR-M01-002 Gợi ý tuyến | `m01-recommend` | như trên |
| `/routes/:routeId` | SCR-M01-003 Chi tiết tuyến & Chuẩn bị | `m01-route-detail` | như trên |
| `/offline` | SCR-M01-004 Quản lý tài nguyên offline | `m01-offline` | như trên |
| `PATHS.m02SessionEntry` | SCR-M02-001 (package 002) | — | M01 chỉ điều hướng sau khi commit context (SF-M01-006-08) |

Trang `/q/{qrIdentifier}` thuộc M02 và không bao giờ qua guard ngôn ngữ (BR-M02-024); nó đặt `LanguageControl` của M01 ([language-preference-contract.md](language-preference-contract.md) §3).

## 2. Màn hình → thao tác → trạng thái

| Màn | Thao tác | Thực hiện | Trạng thái hiển thị (screen spec §4) | FR / BR |
|---|---|---|---|---|
| 001 | mở / làm mới | đọc R1 ([m03-publication-consumer-contract.md](m03-publication-consumer-contract.md) §2); lọc tuyến chọn được; sắp A→Z theo ngôn ngữ; cập nhật local view trong bộ nhớ; thu hồi/`OUTDATED`/essentials (R-10, R-11) | Language required, Loading, Has routes, Empty, Stale/offline, Source unavailable, Image failed, Route removed | FR-M01-002; BR-M01-002, 011 |
| 001 | thẻ tuyến | hiển thị thumbnail (signed URL), tên, mô tả ngắn, quãng đường, thời lượng, độ khó, `checkpointCount`, dấu "cần tải trước" khi một trong hai cờ là `true` | — | FR-M01-002; BR-M01-012 |
| 002 | chọn chip mỗi nhóm, chạy gợi ý | hàm thuần exact-match trên tuyến chọn được; A→Z | thiếu tiêu chí, 0 kết quả, có kết quả | FR-M01-004; BR-M01-003 |
| 003 | mở online | đọc R2; hiện đủ trường bắt buộc; ẩn trường tùy chọn vắng; tên điểm dừng theo `checkpointSummaries`, đánh số liên tục 1, 2, 3… (OQ-SCR-M01-003-003); có gói → làm mới essentials, có thể dựng candidate (R-10) | route unavailable/revoked, nguồn lỗi, thiếu gói, đang tải, ready/outdated, incomplete | FR-M01-003, 005, 010, 014 |
| 003 | mở offline có gói | essentials đã lưu + câu "Thông tin được lưu lúc {thời điểm}, có thể không phải bản mới nhất"; tên điểm dừng từ `manifest` của gói (OQ-SCR-M01-003-002); ảnh chưa lưu → placeholder | — | FR-M01-003, 014; SC-M01-008 |
| 003 | "Bắt đầu" khi cần gói mà chưa có gói `SAN_SANG` | dialog quyết định offline: tên các checkpoint `OFFLINE_REQUIRED` theo ngôn ngữ du khách, dung lượng ước tính hoặc "Chưa có thông tin dung lượng.", một dòng hướng dẫn quét bằng nút Quét trong app; ba nút Tải / Tiếp tục không tải / Quay lại | — | FR-M01-006; BR-M01-007, 016; SF-M01-004-04…08 |
| 003 | "Bắt đầu" | Start ([selected-route-context-v3-contract.md](selected-route-context-v3-contract.md) §2) | chặn khi không có nguồn lẫn gói; lỗi không thay context cũ | FR-M01-011, 012 |
| 003, 004 | Tải / Tải lại / Cập nhật | pipeline gói ([offline-package-contract.md](offline-package-contract.md) §4) | `DANG_TAI`, `SAN_SANG` `CURRENT`/`OUTDATED`, `CHUA_HOAN_TAT`, storage failure | FR-M01-007…010 |
| 004 | xem | danh sách gói có bản ghi: tuyến, version, trạng thái, thời điểm lưu essentials, có sơ đồ offline hay không; một dòng hướng dẫn quét | gói không đọc được → "Gói tải trước không đọc được" / "This download cannot be read" với Tải lại, Xóa (OQ-SCR-M01-004-003) | FR-M01-009; SF-M01-005-06 |
| 004 | Xóa | dialog xác nhận → transaction xóa | — | FR-M01-009; SF-M01-005-07 |
| mọi màn | VI/EN | ghi `LanguagePreference`; UI và nội dung có sẵn đổi ngay | — | FR-M01-001 |

Không có hành động Cancel khi đang tải (spec-M01 §4.4). Chữ hiển thị chỉ lấy từ bảng copy của screen spec qua từ điển `vi`/`en` ([research.md](../research.md) R-12); mã enum, ID và tên trường không bao giờ hiện trên giao diện (screen spec SCR-M01-003, đầu file).

## 3. App shell và PWA

| Mục | Quy tắc | Nguồn |
|---|---|---|
| Precache | app shell, từ điển `vi`/`en` (trong JS), mọi chunk lazy của M01/M02 (kể cả decoder QR của M02), icon | tech-stack §4; spec-M01 §9.3 |
| `navigateFallback` | `/index.html` cho mọi route SPA, gồm `/q/{qrIdentifier}` | spec-M01 §9.3; BR-M02-025 |
| Runtime cache | không có: không cache Supabase API, Auth, response quản trị, signed media | constitution VI |
| Cập nhật | prompt; chỉ áp dụng khi người dùng đồng ý, lấy được lock exclusive `cpq:busy` (không có thao tác gói M01, phiên M02, form M03 chưa lưu ở bất kỳ tab nào) **và** mọi hàm `registerBusyCheck` trả `false` (ví dụ không có phiên M02 `DANG_DIEN_RA`) | constitution VI; [research.md](../research.md) R-14 |
| Cài lên màn hình chính iPhone | không khuyến khích; không có lời nhắc cài đặt | spec-M01 §9.2 |

## 4. Truy vết test (E2E, dành cho tasks)

| Kiểm thử | FR / SC |
|---|---|
| Lần đầu vào `/` → panel ngôn ngữ; vào `/q/{id}` → không có panel | US-M01-01; BR-M02-024 |
| Offline, đã mở app trước đó: tải lại trang `/` và `/q/{id}` từ app shell; đổi VI/EN được | spec-M01 §9.3; US-M01-01 mục 2 |
| Không có request nào tới `/rest/v1` hay `/storage/v1` được trả từ Cache Storage | constitution VI |
| Có thao tác tải gói đang chạy ở tab khác → bản cập nhật service worker không được áp dụng | constitution VI |
| Mọi chuỗi hiển thị có khóa ở cả `vi` và `en`; không có mã enum trong DOM | R-12; screen spec |
