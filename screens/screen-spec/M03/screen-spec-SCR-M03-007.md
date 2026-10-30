# Screen Spec: Nhận lời mời & Khôi phục mật khẩu

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-007` |
| Screen name | Nhận lời mời & Khôi phục mật khẩu |
| Module | `M03` |
| Actor | Người được mời; Nhân viên nội dung; Quản lý |
| Priority | Must |
| Mockup | [mockup-SCR-M03-007.html](../../html/mockup-SCR-M03-007.html) (HTML tĩnh, chỉ để xem tham khảo, không phải thiết kế chính thức; chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-05, BR-M03-K01, K02, K04, K05; Administrative access flow §4.3). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Màn này là bước thông tin đăng nhập do nhà cung cấp xác thực quản lý: token lời mời/khôi phục và mật khẩu thuộc nhà cung cấp, M03 không lưu.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Người được mời mở link lời mời do nhà cung cấp gửi; người dùng chọn "Quên mật khẩu" từ SCR-M03-000; hoặc mở link khôi phục mật khẩu do nhà cung cấp gửi. Cả ba chế độ: nhận lời mời, yêu cầu khôi phục, hoàn tất khôi phục.

**The user leaves when:** Hoàn tất đặt mật khẩu (lời mời hoặc khôi phục) và quay về SCR-M03-000; hoặc quay về SCR-M03-000 sau khi gửi yêu cầu khôi phục.

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M03-007.html](../../html/mockup-SCR-M03-007.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-007-01 | Screen title | Header text | Tiêu đề theo chế độ: nhận lời mời / khôi phục mật khẩu | Yes | Non-empty |
| 2 | E-SCR-M03-007-02 | Invitation password input | Input (ẩn ký tự) | Mật khẩu người được mời tự đặt, gửi thẳng cho nhà cung cấp | Conditional | Chỉ ở chế độ nhận lời mời hợp lệ; quy tắc mật khẩu do nhà cung cấp quy định; M03 không lưu |
| 3 | E-SCR-M03-007-03 | Action: Hoàn tất lời mời | Button | Đặt thông tin đăng nhập; backend xác nhận danh tính nhà cung cấp khớp tài khoản Chờ nhận lời mời rồi kích hoạt | Conditional | Tài khoản chỉ thành Đang hoạt động khi khớp (US-M03-05 mục 4); sau đó về SCR-M03-000 |
| 4 | E-SCR-M03-007-04 | Recovery email input | Input | Email của tài khoản cần khôi phục | Conditional | Chỉ ở chế độ yêu cầu khôi phục |
| 5 | E-SCR-M03-007-05 | Action: Gửi yêu cầu khôi phục | Button | Gửi yêu cầu cho nhà cung cấp | Conditional | Phản hồi luôn chung, không tiết lộ email có tồn tại (BR-M03-K02) |
| 6 | E-SCR-M03-007-06 | Generic recovery response | Text | MSG-RECOVERY-SENT: "Nếu email này có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu." | Conditional | Giống nhau dù email có tồn tại hay không |
| 7 | E-SCR-M03-007-07 | New password input | Input (ẩn ký tự) | Mật khẩu mới ở chế độ hoàn tất khôi phục | Conditional | Chỉ khi callback khôi phục hợp lệ; gửi thẳng cho nhà cung cấp |
| 8 | E-SCR-M03-007-08 | Action: Đặt mật khẩu mới | Button | Hoàn tất khôi phục | Conditional | Không tạo tài khoản, không đổi vai trò/trạng thái; tài khoản Đã khóa vẫn bị từ chối sau khi khôi phục |
| 9 | E-SCR-M03-007-09 | Processing state | Spinner | Đang xử lý | Conditional | Hiện khi đang gửi |
| 10 | E-SCR-M03-007-10 | Invalid / expired link | Text | MSG-LINK-INVALID: "Liên kết này không dùng được hoặc đã hết hạn. Nếu là lời mời, hãy nhờ quản lý gửi lại; nếu là khôi phục mật khẩu, hãy yêu cầu lại." | Conditional | Lời mời hết hạn hoặc không hợp lệ không tạo quyền truy cập (BR-M03-K01) |
| 11 | E-SCR-M03-007-11 | Provider / network error | Text | MSG-NETWORK-FAILED "Chưa kết nối được. Hãy kiểm tra mạng rồi thử lại." hoặc MSG-GENERIC | Conditional | Lỗi bất ngờ dùng MSG-GENERIC; không hiện mã kỹ thuật |
| 12 | E-SCR-M03-007-12 | Action: Về đăng nhập | Link | Mở SCR-M03-000 | Yes | None |
| 13 | E-SCR-M03-007-13 | Confirm password input | Input (ẩn ký tự) | Nhập lại mật khẩu (chế độ nhận lời mời và hoàn tất khôi phục) | Conditional | Phải giống ô mật khẩu, nếu không thì MSG-PASSWORD-MISMATCH ("Hai lần nhập mật khẩu chưa giống nhau. Hãy nhập lại."), kiểm tra trước khi gửi cho nhà cung cấp |
| 14 | E-SCR-M03-007-14 | Password rejected | Text | MSG-PASSWORD-REJECTED ("Mật khẩu này chưa được chấp nhận. Hãy chọn mật khẩu khác dài hơn và khó đoán hơn.") | Conditional | Khi nhà cung cấp từ chối mật khẩu; M03 không tự đặt quy tắc độ mạnh, không hiện thông báo gốc của nhà cung cấp |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Invitation – valid | Form đặt mật khẩu | Link lời mời hợp lệ |
| Invitation – done | Chuyển về đăng nhập | Danh tính khớp tài khoản Chờ nhận lời mời, đã kích hoạt |
| Recovery request | Ô nhập email | Chọn "Quên mật khẩu" từ SCR-M03-000 |
| Recovery request accepted | Phản hồi chung | Đã gửi yêu cầu |
| Recovery callback – valid | Form đặt mật khẩu mới | Link khôi phục hợp lệ |
| Recovery done | Chuyển về đăng nhập | Đặt mật khẩu mới thành công |
| Processing | Spinner | Đang gửi cho nhà cung cấp |
| Invalid / expired link | Thông báo link không dùng được | Link sai hoặc hết hạn |
| Provider / network error | Thông báo lỗi | Lỗi nhà cung cấp hoặc mạng |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Hoàn tất lời mời | Tap | Nhà cung cấp lưu thông tin đăng nhập; backend xác nhận khớp tài khoản Chờ nhận lời mời rồi kích hoạt | `SCR-M03-000` |
| 2 | Gửi yêu cầu khôi phục | Tap | Nhà cung cấp xử lý; trả phản hồi chung | Recovery request accepted |
| 3 | Đặt mật khẩu mới | Tap | Nhà cung cấp đổi mật khẩu; không đổi trạng thái hay vai trò | `SCR-M03-000` |
| 4 | Về đăng nhập | Tap | Rời màn hình | `SCR-M03-000` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-007-001 | Mời và khôi phục mật khẩu là luồng thông tin đăng nhập do nhà cung cấp quản lý; không bao giờ gán, chọn hay đổi vai trò hoặc trạng thái ứng dụng | BR-M03-K02, SC-M03-011 |
| SR-SCR-M03-007-002 | Lời mời hợp lệ chỉ kích hoạt tài khoản khi danh tính nhà cung cấp hoàn tất và khớp tài khoản Chờ nhận lời mời | US-M03-05 mục 4, BR-M03-K01 |
| SR-SCR-M03-007-003 | Lời mời hết hạn hoặc không hợp lệ không tạo quyền truy cập; Quản lý có thể gửi lại cho cùng tài khoản đang chờ | BR-M03-K01, US-M03-05 mục 5 |
| SR-SCR-M03-007-004 | Yêu cầu khôi phục trả phản hồi chung, không tiết lộ email có tồn tại | BR-M03-K02, US-M03-05 mục 6 |
| SR-SCR-M03-007-005 | Màn hình không tạo tài khoản ứng dụng, không kích hoạt lại tài khoản đã khóa, không vượt qua kiểm tra quyền phía server | BR-M03-K02, K05, US-M03-05 mục 7 |
| SR-SCR-M03-007-006 | Mật khẩu và token chỉ đi giữa trình duyệt và nhà cung cấp; M03 không lưu và không ghi vào nhật ký | BR-M03-F08 |
| SR-SCR-M03-007-007 | Quản lý đầu tiên của môi trường đã được cấp phía server và chỉ ở trạng thái Chờ nhận lời mời; trở thành Đang hoạt động qua luồng lời mời của màn này, không có đường khôi phục khác | BR-M03-K04, US-M03-05 mục 9 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-013 | Nhận lời mời, khôi phục mật khẩu tự phục vụ, không đổi vai trò/trạng thái |
| FR-M03-019 | Tiếng Việt dễ hiểu, không dữ liệu thô |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lỗi liên kết với ô nhập, trạng thái không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-007-002 | Quy tắc độ mạnh mật khẩu và nhập lại mật khẩu | No | Resolved | Độ mạnh mật khẩu do nhà cung cấp quy định; form có ô nhập lại mật khẩu (E-SCR-M03-007-13, MSG-PASSWORD-MISMATCH) và hiện MSG-PASSWORD-REJECTED khi nhà cung cấp từ chối. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
