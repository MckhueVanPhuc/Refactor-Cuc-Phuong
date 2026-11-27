# Screen Spec: Quét QR

| Field | Value |
|---|---|
| Screen ID | `SCR-M02-005` |
| Screen name | Quét QR |
| Module | `M02` |
| Actor | Visitor có phiên; khách tự do |
| Priority | Must |
| Mockup | Canvas mockup được người dùng duyệt 2026-11-21 (artboard "SCR-M02-005 Quét QR"); không có file trong screens/html/ |
| Status | Draft — đồng bộ [Spec M02 v3.3](../../../docs/spec/spec-M02.md) |

Nguồn hành vi/contract: [Spec M02](../../../docs/spec/spec-M02.md) (US-M02-02, US-M02-07, FR-M02-006, 007, 019, 026, BR-M02-005, 012, 019, 022, 023). Màn này là một điểm vào mới cho trình quét trong app đã có ở SCR-M02-001, mở từ thanh tab của M01 (quyết định người dùng 2026-11-21); không thêm hành vi, field, permission hay transition nào vào baseline. Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép và câu của bảng copy; tên trường, mã enum/trạng thái và định danh trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Visitor bấm nút Quét QR ở giữa thanh tab của một màn M01 (SCR-M01-001…004). Camera bật ngay, không cần bấm thêm.

**The user leaves when:** Mã được chấp nhận và có nội dung → nội dung của mã (SCR-M02-002); bấm "Đóng camera" hoặc "Quay lại" → về màn M01 đã mở thanh tab.

## 2. Mockup

Không có mockup HTML trong repo. Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M02-005-01 | Language control VI/EN | Toggle (control của M01) | `LanguagePreference`; cũng ở hàng tiêu đề của trình quét (2026-11-27, BUG-020) | Yes | M01 là nơi ghi duy nhất (BR-M01-001) |
| 2 | E-SCR-M02-005-02 | Screen title | Header text | Như tiêu đề trình quét của SCR-M02-001 | Yes | Non-empty |
| 3 | E-SCR-M02-005-03 | Trình quét QR | Lớp camera toàn màn hình (như E-SCR-M02-001-10) | Camera sau của thiết bị | Yes | Mở ngay khi vào màn; quyền do trình duyệt cấp |
| 4 | E-SCR-M02-005-04 | Camera unavailable | Text + action | Câu cố định "Không dùng được camera…" và "Thử lại"; icon và các bước bật camera như E-SCR-M02-001-11 (2026-11-27) | Conditional | Như E-SCR-M02-001-11 (BR-M02-023) |
| 5 | E-SCR-M02-005-05 | Đang kiểm tra mã | Status text | "Đang kiểm tra mã QR…" | Conditional | Trong lúc tra cứu |
| 6 | E-SCR-M02-005-06 | Kết quả ở lại màn | Banner | Mã không hợp lệ; khu vực tạm đóng; cần kết nối mạng; kèm câu gợi ý khách tự do khi không có phiên | Conditional | Như thông báo cùng loại của SCR-M02-001 (FR-M02-013, 021) |
| 7 | E-SCR-M02-005-07 | Action: Quét QR | Button | Mở lại trình quét | Yes | Vô hiệu khi đang tra cứu |
| 8 | E-SCR-M02-005-08 | Action: Quay lại | Button | Về màn M01 đã mở thanh tab | Yes | None |

**Copy cố định (i18n vi/en).** Màn này dùng lại chữ của SCR-M02-001 (tiêu đề trình quét, "Quét QR", "Đóng camera", "Thử lại", "Đang kiểm tra mã QR…", các thông báo của spec-M02 §5.1) và "Quay lại" của SCR-M02-002; không có câu mới.

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Scanning | Trình quét toàn màn hình, camera đang chạy | Mở màn; bấm Quét QR |
| Camera unavailable | Câu cố định về camera và "Thử lại" | Quyền bị từ chối, không có camera |
| Looking up | "Đang kiểm tra mã QR…" | Đã đọc được mã, đang tra cứu |
| Content | Chuyển sang SCR-M02-002 | Mã được chấp nhận và có nội dung (online hoặc từ gói) |
| Stay notice | Thông báo ở lại màn này, nút Quét QR và Quay lại | Mã không hợp lệ, tạm đóng, cần kết nối mạng |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Màn hình | Mở từ thanh tab | Tự đóng phiên quá 24 giờ trước (BR-M02-022); bật trình quét | State: Scanning |
| 2 | Trình quét | Đọc được mã | Xử lý như trình quét trong app của SCR-M02-001: link sai môi trường → mã không hợp lệ, không tra cứu; có phiên → gửi `routeId`, ghi lượt ghé khi được chấp nhận rồi mới hiện nội dung; không có phiên → khách tự do, không gửi `routeId`, không ghi gì | `SCR-M02-002` hoặc Stay notice |
| 3 | Đóng camera / Quay lại | Tap | Tắt camera | Màn M01 đã mở thanh tab |
| 4 | Quét QR | Tap | Mở lại trình quét | State: Scanning |
| 5 | Nội dung (SCR-M02-002) | "Quay lại" | Có phiên → về hành trình; khách tự do → về màn M01 đã mở thanh tab | `SCR-M02-001` hoặc màn M01 |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M02-005-001 | Màn không bao giờ tạo phiên; khách tự do không tạo phiên, lượt ghé hay dữ liệu báo cáo | FR-M02-019, BR-M02-012, BR-M02-019 |
| SR-SCR-M02-005-002 | Có phiên đang chạy trong trình duyệt thì lần quét là lượt quét của phiên, kể cả khi mở từ màn M01 | BR-M02-005, BR-M02-023, FR-M02-007 |
| SR-SCR-M02-005-003 | Chỉ nhận link `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` của môi trường hiện tại; nội dung khác là mã không hợp lệ, không tra cứu | BR-M02-023, FR-M02-026 |
| SR-SCR-M02-005-004 | Mở màn là "quay lại màn hình": tự đóng phiên quá 24 giờ trước mọi xử lý | BR-M02-022, FR-M02-024 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M02-006 | Lấy `qrIdentifier` từ link đọc được |
| FR-M02-007 | Ghi lượt ghé trước khi hiển thị nội dung khi có phiên |
| FR-M02-013 | `INVALID`/`TEMPORARILY_CLOSED` khác lỗi nguồn |
| FR-M02-019 | Khách tự do không tạo dữ liệu |
| FR-M02-024 | Tự đóng phiên quá 24 giờ khi mở màn |
| FR-M02-026 | Link sai môi trường là mã không hợp lệ |

## 8. Responsive and accessibility notes

- Trình quét là dialog có tiêu đề; focus vào nút "Đóng camera" khi mở, Esc đóng như nút đó (như SCR-M02-001).
- Thông báo ở lại màn dùng `role="alert"`/`role="status"` theo loại; không dùng màu làm tín hiệu duy nhất.
- Nút Quét QR và Quay lại ở đáy màn, vùng chạm ≥ 44px.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M02-005-001 | Bấm tab Quét QR thì bật camera ngay hay qua màn giới thiệu | No | Resolved | Bật camera ngay (người dùng duyệt 2026-11-21). |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
