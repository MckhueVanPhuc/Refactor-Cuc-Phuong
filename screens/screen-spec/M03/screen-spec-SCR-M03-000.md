# Screen Spec: Đăng nhập quản trị

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-000` |
| Screen name | Đăng nhập quản trị |
| Module | `M03` |
| Actor | Nhân viên nội dung, Quản lý |
| Priority | Must |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-05, BR-M03-A04, K02, K05). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Giao diện quản trị chỉ dùng tiếng Việt dễ hiểu; tên mã (code name) của trạng thái/vai trò không bao giờ hiện trên màn hình (BR-M03-L10, L11).

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Màn vào chính khi mở M03 mà chưa có provider session hợp lệ hoặc session đã hết hạn. Visitor M01/M02 không dùng màn này. M03 không có đăng ký công khai.

**The user leaves when:** Đăng nhập thành công và backend xác nhận `AdminAccount` đang hoạt động với vai trò hợp lệ (vào SCR-M03-001 hoặc đích được bảo vệ ban đầu); hoặc chọn "Quên mật khẩu" (mở SCR-M03-007 ở chế độ khôi phục).

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-000-01 | Screen title | Header text | "Đăng nhập" (tiếng Việt) | Yes | Non-empty |
| 2 | E-SCR-M03-000-02 | Email input | Input | Email của tài khoản quản trị, gửi trực tiếp cho authentication provider | Yes | Không bị M03 lưu; M03 không kiểm tra định dạng thay provider [xem OQ-SCR-M03-000-002] |
| 3 | E-SCR-M03-000-03 | Password input | Input (ẩn ký tự) | Mật khẩu, gửi trực tiếp cho provider | Yes | M03 không lưu mật khẩu (Screen list M03) |
| 4 | E-SCR-M03-000-04 | Action: Đăng nhập | Button | Gửi thông tin cho provider, rồi M03 kiểm tra quyền | Yes | Vô hiệu khi đang xử lý; đăng nhập chỉ thành công khi có provider identity **và** `AdminAccount` `ACTIVE` với vai trò hợp lệ (BR-M03-K05) |
| 5 | E-SCR-M03-000-05 | Action: Quên mật khẩu | Link | Mở SCR-M03-007 ở chế độ khôi phục | Yes | Không tiết lộ email có tồn tại hay không (xem SCR-M03-007) |
| 6 | E-SCR-M03-000-06 | Submitting state | Spinner | Đang đăng nhập | Conditional | Hiện khi đang xử lý |
| 7 | E-SCR-M03-000-07 | Credential error | Text | MSG-LOGIN-FAILED: "Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại." | Conditional | Hiện khi provider từ chối; không nói rõ sai email hay sai mật khẩu |
| 8 | E-SCR-M03-000-08 | Network / provider error | Text | MSG-NETWORK-FAILED: "Chưa kết nối được. Hãy kiểm tra mạng rồi thử lại." | Conditional | Mất mạng hoặc không tới được server; lỗi bất ngờ khác dùng MSG-GENERIC; không hiện mã kỹ thuật |
| 9 | E-SCR-M03-000-09 | Session expired notice | Text | MSG-SESSION-EXPIRED: "Phiên làm việc đã hết hạn. Hãy đăng nhập lại." | Conditional | Hiện khi mở lại sau khi session hết hạn |
| 10 | E-SCR-M03-000-10 | Access denied | Text | MSG-LOGIN-DENIED: "Tài khoản này chưa được phép vào hệ thống. Hãy nhờ quản lý." (tài khoản bị khóa, không có tài khoản ứng dụng hoặc không có vai trò hợp lệ) | Conditional | Provider identity đơn lẻ không cấp quyền M03 (BR-M03-K05); tài khoản `DEACTIVATED` luôn bị từ chối kể cả sau khôi phục mật khẩu (BR-M03-K02) |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Form đăng nhập | Mở M03 chưa có session |
| Submitting | Spinner, nút vô hiệu | Đang gửi |
| Credential error | Thông báo sai thông tin | Provider từ chối |
| Network error | Thông báo lỗi mạng/hệ thống | Mất mạng hoặc lỗi provider |
| Session expired | Thông báo hết phiên trước form | Mở lại sau khi hết session |
| Access denied | Thông báo không có quyền | Không có `AdminAccount` `ACTIVE` với vai trò hợp lệ |
| Success | Chuyển vào SCR-M03-001 hoặc đích ban đầu | Authorization server-side thành công |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Form | Nhập email/mật khẩu | Cập nhật local state | State update |
| 2 | Đăng nhập | Tap | Provider xác thực; M03 kiểm tra `AdminAccount` `ACTIVE` và vai trò | `SCR-M03-001` hoặc protected destination ban đầu |
| 3 | Quên mật khẩu | Tap | Mở yêu cầu khôi phục | `SCR-M03-007` (recovery) |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-000-001 | M03 không có đăng ký công khai; chỉ vào bằng tài khoản được Quản lý mời | BR-M03-A01, US-M03-05 |
| SR-SCR-M03-000-002 | Mọi request được bảo vệ phải xác thực cả provider identity và `AdminAccount` `ACTIVE` với vai trò `CONTENT_STAFF`/`REVIEWER`; provider token đơn lẻ không cấp quyền | BR-M03-A04, K05, SC-M03-009 |
| SR-SCR-M03-000-003 | Quyền do server kiểm tra; kiểm tra phía trình duyệt chỉ để tiện giao diện | BR-M03-A04 |
| SR-SCR-M03-000-004 | Khôi phục mật khẩu không tạo tài khoản, không đổi vai trò/trạng thái và không vượt qua kiểm tra quyền | BR-M03-K02, SC-M03-011 |
| SR-SCR-M03-000-005 | Màn hình không hiện JSON, mã trạng thái HTTP, mã kỹ thuật; lỗi bất ngờ dùng MSG-GENERIC | BR-M03-L10 |
| SR-SCR-M03-000-006 | Khởi tạo Quản lý đầu tiên không có màn trình duyệt; chỉ làm phía server | US-M03-05 mục 9, SC-M03-010 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-013 | Đăng nhập, kiểm tra tài khoản ứng dụng và vai trò, lối vào khôi phục mật khẩu |
| FR-M03-019 | Chỉ tiếng Việt dễ hiểu, không dữ liệu thô |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lỗi liên kết với ô nhập, trạng thái không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-000-002 | Quy tắc định dạng email/mật khẩu ở form đăng nhập | No | Resolved | M03 chỉ kiểm tra hai ô không rỗng trước khi gửi; định dạng email và mật khẩu do nhà cung cấp xác thực kiểm tra, sai thì hiện MSG-LOGIN-FAILED. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
