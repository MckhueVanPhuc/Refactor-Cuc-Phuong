# Contract — Luồng giao diện thực địa M02 (màn hình → route → thao tác → trạng thái)

| Mục | Giá trị |
|---|---|
| Phạm vi | SCR-M02-001…004 |
| Nguồn hành vi | [spec-M02](../../../docs/spec/spec-M02.md) §3, §4, §5.1 "Fixed visitor messages", §7; [screen list M02](../../../screens/screen%20list/screen-list-M02.md); [screen spec M02](../../../screens/screen-spec/M02/) (bảng copy và trạng thái) |
| Hình thức | [design-system.md](../../../docs/design/design-system.md) (`--color-m02-scanner-*` cho scanner); icon chỉ từ `assets/icons/` |

File này không tạo màn hình, trường hay trạng thái mới; mỗi dòng trỏ tới screen spec hoặc FR/BR.

## 1. Route

| Path | Màn hình | Lazy chunk | Guard |
|---|---|---|---|
| `/trip` (= `PATHS.m02SessionEntry`) | SCR-M02-001 | `m02-trip` (+ `m02-scanner` khi mở scanner) | tự đóng phiên quá 24 giờ, rồi quyết định vào phiên ([research.md](../research.md) R-06) |
| `/trip/qr/:qrIdentifier` | SCR-M02-002 | `m02-content` | nhận kết quả quét qua router state; không có → xem lại (scan-resolution §4) |
| `/trip/end` | SCR-M02-003 | `m02-end` | chỉ khi có phiên vừa kết thúc hoặc đang chờ xác nhận |
| `/q/:qrIdentifier` | SCR-M02-004 | `m02-qr-link` | không guard ngôn ngữ; tự đóng phiên quá 24 giờ trước (BR-M02-024) |

Không màn M02 nào có bước chọn ngôn ngữ; mọi màn đặt `LanguageControl` của M01.

## 2. Màn hình → thao tác → trạng thái

| Màn | Thao tác | Thực hiện | Trạng thái (screen spec §4) | FR / BR |
|---|---|---|---|---|
| 001 | vào `/trip` | R-06: khôi phục / tạo / thay / từ chối / khách tự do | Handoff rejected, Session started, Session restored, Previous session auto-ended | FR-M02-001…005, 017, 024 |
| 001 | xem journey | `RouteJourneyMap`: sắp theo `sequence`, đánh số liên tục 1, 2, 3…; tên theo ngôn ngữ; điểm đã quét ghi "Đã quét QR"; số đã quét/tổng | — | FR-M02-008; BR-M02-006; SC-M02-013 |
| 001 | "Quét" | mở scanner toàn màn hình; decode → `processScan(…, 'scanner')` | Scanning, Camera denied/unavailable, Looking up, Visit recorded, Closure notice, Invalid QR, Connection needed, Out of journey, Free-visitor | FR-M02-006, 026; BR-M02-023 |
| 001 | chạm điểm đã quét | `viewScannedPoint` | — | FR-M02-009 |
| 001 | Finish (sau khi điểm cuối có lượt ghé) | mở xác nhận ở 003 | Final checkpoint visited | FR-M02-015 |
| 001 | — | một dòng lỗi đồng bộ của chuyến trước khi mục là `CONFLICT` và chưa có chuyến mới | Sync error visible (E-SCR-M02-001-22) | BR-M02-011 |
| 002 | hiển thị | nguồn theo scan-resolution §2; ảnh (signed URL hoặc object URL); media lọc theo ngôn ngữ, bấm mới phát | Loading, Live content, Package content, Package outdated, No offline content, Unavailable, Source failure, Media error, Closure, Free-visitor | FR-M02-010, 011, 014; BR-M02-016, 026 |
| 003 | câu hỏi kết thúc / Finish | [Kết thúc] → `HOAN_TAT` + mục hàng đợi; [Đi tiếp] → về 001, Finish còn | Confirmation, Continue, Completed – pending sync, Completed – synced, Conflict/rejected, Offline | FR-M02-016, 018, 023 |
| 003 | sau khi hoàn tất | danh sách điểm đã quét; về danh mục `/` | — | spec-M02 §7 |
| 004 | mở link | tự đóng → có phiên: `processScan(…, 'link')`; không phiên: chế độ khách tự do | Loading, Free-visitor content, Session scan, Out of journey, Closure notice, Invalid, Connection needed, Previous session auto-ended | FR-M02-025; BR-M02-024, 025 |
| 004 | "Chọn tuyến" | điều hướng `/` (SCR-M01-001) | — | US-M02-09 mục 4 |

Không có nút "Dừng chuyến đi"; không có trang hàng đợi đồng bộ (screen list §2, §4).

## 3. Chữ cố định

Mọi thông báo du khách của spec-M02 §5.1 "Fixed visitor messages" và bảng copy của screen spec được chép đúng vào `src/modules/m02/i18n/vi.ts`, `en.ts`. Test bắt buộc: tập khóa hai ngôn ngữ bằng nhau; không có "đã đến", "có mặt", "arrived" trong mọi chuỗi và trong DOM (SC-M02-013); mã enum và ID không bao giờ hiện trên giao diện.

## 4. Offline và PWA

| Mục | Quy tắc | Nguồn |
|---|---|---|
| Trang `/q/…` offline | mở từ app shell nếu trình duyệt từng mở app (`navigateFallback` của M01); hành xử như quét offline (dòng 6–8 của scan-resolution §2) | BR-M02-025 |
| Scanner offline | chunk `m02-scanner` đã precache | tech-stack §4 |
| Cập nhật service worker | không áp dụng khi có phiên `DANG_DIEN_RA` (lock `cpq:busy` + `hasRunningSession()`) | constitution VI; [research.md](../research.md) R-15 |
| Runtime cache | không cache lookup, intake, signed media | constitution VI |

## 5. Truy vết test (E2E)

| Kiểm thử | FR / SC |
|---|---|
| Từ M01 Start → `/trip` → phiên mới, gợi ý bắt đầu phiên | US-M02-01 |
| Tải lại giữa phiên (online và offline) → cùng phiên, cùng lượt ghé | SC-M02-003 |
| Hai tab: quét ở tab A, tab B thấy lượt ghé khi đọc lại | BR-M02-002 |
| `/q/{id}` lần đầu, chưa từng chọn ngôn ngữ → nội dung ngay, theo ngôn ngữ thiết bị | SC-M02-017 |
| `/q/{id}` không phiên → không có dòng nào trong store M02 | SC-M02-018 |
| Camera bị từ chối → thông báo camera cố định | BR-M02-023 |
| Đổi VI/EN trên 002 khi có audio `vi`, `en`, `NONE` | SC-M02-019 |
