# Screen Spec: Nhật ký hệ thống

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-009` |
| Screen name | Nhật ký hệ thống |
| Module | `M03` |
| Actor | Quản lý |
| Priority | Should |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-08, BR-M03-A03, F08, F09, L10, L11; `AuditRecord` §6.4). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Chỉ Quản lý xem được nhật ký toàn hệ thống; lịch sử từng mục nằm trong panel của các màn biên tập, không phải ở đây.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Quản lý mở "Nhật ký hệ thống" từ menu M03.

**The user leaves when:** Quay về SCR-M03-001 hoặc mở mục liên quan (tuyến, điểm dừng, điểm tham quan) ở màn tương ứng.

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-009-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-009-02 | Screen title | Header text | "Nhật ký hệ thống" | Yes | Non-empty |
| 3 | E-SCR-M03-009-03 | Filters | Input/Selector | Lọc dòng nhật ký (ví dụ theo người, mục, kết quả, khoảng thời gian) | No | Xem OQ-SCR-M03-009-001 |
| 4 | E-SCR-M03-009-04 | Audit list | Table | Mỗi dòng: ai, lúc nào (dd/mm/yyyy hh:mm), mục nào, nội dung trước và sau, kết quả (Thành công / Không thành công), lý do | Yes | Chỉ đọc; thêm vào cuối, không sửa hay xóa; không hiện mật khẩu, token hay mã lỗi nội bộ |
| 5 | E-SCR-M03-009-05 | Self-publish mark | Badge | Dấu "tự xuất bản" | Conditional | Hiện trên dòng xuất bản mà người xuất bản cũng là người sửa cuối; không tạo dòng thứ hai |
| 6 | E-SCR-M03-009-06 | Affected routes | Text | Các tuyến bị ảnh hưởng của thao tác trên điểm dừng | Conditional | Mọi thao tác trên điểm dừng nêu các tuyến bị ảnh hưởng (BR-M03-X06) |
| 7 | E-SCR-M03-009-07 | Reason | Text | Lý do (đóng, mở lại, lưu trữ, hủy tuyến hoặc điểm dừng; thu hồi điểm tham quan) | Conditional | Tối đa 300 ký tự |
| 8 | E-SCR-M03-009-08 | Action: Mở mục liên quan | Link | Mở tuyến, điểm dừng hoặc điểm tham quan liên quan | Conditional | Đến màn tương ứng theo quyền |
| 9 | E-SCR-M03-009-09 | Empty / loading / error states | Panel | Chưa có dòng nhật ký, đang tải, lỗi | Conditional | Lỗi bất ngờ dùng MSG-GENERIC |
| 10 | E-SCR-M03-009-10 | Permission feedback | Text | MSG-NO-PERMISSION | Conditional | Hiện nếu Nhân viên nội dung truy cập |
| 11 | E-SCR-M03-009-11 | Action: Quay lại | Button | Về SCR-M03-001 | Yes | None |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading | Spinner | Đang tải |
| Has entries | Danh sách dòng nhật ký | Có dòng nhật ký |
| Empty | Không có dòng khớp bộ lọc | Không dòng nào |
| Filtered | Danh sách đã lọc | Áp dụng bộ lọc |
| Permission denied | MSG-NO-PERMISSION | Không phải Quản lý |
| Error | MSG-GENERIC | Lỗi tải |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Bộ lọc | Chọn/nhập | Lọc danh sách | State update |
| 2 | Mở mục liên quan | Tap | Mở màn của mục | `SCR-M03-001` / `SCR-M03-002` / `SCR-M03-003` / `SCR-M03-008` |
| 3 | Quay lại | Tap | Về danh sách tuyến | `SCR-M03-001` |
| 4 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-009-001 | Chỉ Quản lý xem nhật ký toàn hệ thống; quyền kiểm tra phía server | BR-M03-A03, F09 |
| SR-SCR-M03-009-002 | Mỗi thao tác quản trị ghi đúng một dòng nhật ký gồm người thực hiện, thời điểm, mục, trước/sau, kết quả và lý do khi bắt buộc; thao tác thất bại cũng được ghi | BR-M03-F08 |
| SR-SCR-M03-009-003 | Nhật ký chỉ thêm vào, không sửa hay xóa; không chứa mật khẩu hoặc bí mật | BR-M03-F08, SC-M03-014 |
| SR-SCR-M03-009-004 | Xuất bản do chính người sửa cuối thực hiện được đánh dấu "tự xuất bản", không ghi dòng thứ hai | BR-M03-F08, SC-M03-014 |
| SR-SCR-M03-009-005 | Nhật ký thao tác điểm dừng nêu các tuyến bị ảnh hưởng | BR-M03-X06 |
| SR-SCR-M03-009-006 | Diễn đạt bằng tiếng Việt dễ hiểu, tên hiển thị cho trạng thái/vai trò/kết quả, không mã lỗi nội bộ, không định danh nội bộ | BR-M03-L10, L11, SC-M03-026 |
| SR-SCR-M03-009-007 | Màn hình chỉ đọc, không có thao tác sửa dữ liệu | BR-M03-F08 |
| SR-SCR-M03-009-008 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-018 | Nhật ký toàn hệ thống cho Quản lý (lịch sử từng mục ở các màn biên tập) |
| FR-M03-019 | Tiếng Việt dễ hiểu, không dữ liệu thô |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, bảng có tiêu đề cột, trạng thái (Thành công/Không thành công) không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-009-001 | Tiêu chí lọc cụ thể của nhật ký | No | Resolved | Lọc theo người thực hiện, loại mục (Tuyến / Điểm dừng / Điểm tham quan / Tài khoản), kết quả (Thành công / Không thành công) và khoảng ngày. |
| OQ-SCR-M03-009-002 | Phân trang/sắp xếp dòng nhật ký | No | Resolved | Mới nhất trước; 50 dòng mỗi trang với nút "Trang trước" / "Trang sau". |
| OQ-SCR-M03-009-003 | Cách hiển thị trước/sau với nội dung dài hoặc ảnh | No | Resolved | Tóm tắt bằng chữ: tên ô và giá trị trước → sau; văn bản dài cắt ở 200 ký tự kèm "Xem đầy đủ"; ảnh hiện tên tệp. Không JSON hay dữ liệu thô (BR-M03-L10). |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
