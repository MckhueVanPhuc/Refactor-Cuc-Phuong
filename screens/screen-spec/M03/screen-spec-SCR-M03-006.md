# Screen Spec: Tài khoản & Vai trò

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-006` |
| Screen name | Tài khoản & Vai trò |
| Module | `M03` |
| Actor | Quản lý |
| Priority | Must |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-05, BR-M03-A01, A03, A04, K01 đến K05; `AdminAccount` §6.4; thông báo §5.6). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Chỉ Quản lý dùng màn này; hai vai trò cố định là Quản lý và Nhân viên nội dung.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Quản lý đã đăng nhập mở "Tài khoản" từ SCR-M03-001.

**The user leaves when:** Quay về SCR-M03-001. Người được mời hoàn tất thông tin đăng nhập ở SCR-M03-007 (không phải ở màn này).

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-006-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-006-02 | Screen title | Header text | "Tài khoản & Vai trò" | Yes | Non-empty |
| 3 | E-SCR-M03-006-03 | Account list | Table | Mỗi tài khoản: email, vai trò (Quản lý / Nhân viên nội dung), trạng thái (Chờ nhận lời mời / Đang hoạt động / Đã khóa) | Yes | Chỉ tên hiển thị §5.4; không hiện mã vai trò hay trạng thái |
| 4 | E-SCR-M03-006-04 | Invite email input | Input | Email người được mời | Yes | Cắt khoảng trắng hai đầu và chuyển chữ thường trước khi lưu và so sánh; tối đa 254 ký tự sau chuẩn hóa; duy nhất trong hệ thống (BR-M03-K01) |
| 5 | E-SCR-M03-006-05 | Invite role selector | Selector | Nhân viên nội dung / Quản lý | Yes | Đúng một trong hai vai trò cố định |
| 6 | E-SCR-M03-006-06 | Action: Gửi lời mời | Button | Nhà cung cấp xác thực tạo và gửi lời mời; M03 tạo tài khoản Chờ nhận lời mời | Yes | Không có đăng ký công khai; lời mời không tự cấp hoặc đổi vai trò ngoài vai trò được chọn |
| 7 | E-SCR-M03-006-07 | Action: Gửi lại lời mời | Row action | Gửi lại cho tài khoản đang Chờ nhận lời mời | Conditional | Gửi lại cùng tài khoản không tạo bản ghi trùng (BR-M03-K01) |
| 8 | E-SCR-M03-006-08 | Action: Đổi vai trò | Row action | Đổi giữa hai vai trò | Conditional | Hạ quyền Quản lý cuối cùng bị chặn bằng MSG-LAST-REVIEWER |
| 9 | E-SCR-M03-006-09 | Action: Khóa | Row action | Khóa tài khoản Đang hoạt động | Conditional | Khóa Quản lý cuối cùng đang hoạt động bị chặn bằng MSG-LAST-REVIEWER |
| 10 | E-SCR-M03-006-10 | Action: Mở khóa | Row action | Mở khóa tài khoản Đã khóa | Conditional | Chỉ Quản lý |
| 11 | E-SCR-M03-006-11 | Invitation result | Text | MSG-INVITE-SENT "Đã gửi lời mời tới {email}."; MSG-INVITE-RESENT "Đã gửi lại lời mời tới {email}."; MSG-INVITE-FAILED "Chưa gửi được lời mời. Hãy thử lại sau ít phút." | Conditional | Lỗi bất ngờ dùng MSG-GENERIC |
| 12 | E-SCR-M03-006-12 | Duplicate / invalid input feedback | Text | MSG-EMAIL-TAKEN "Email {email} đã có tài khoản. Nếu tài khoản đang chờ nhận lời mời, hãy bấm Gửi lại lời mời."; MSG-EMAIL-INVALID "Email chưa đúng. Hãy kiểm tra lại."; vượt 254 ký tự dùng MSG-LIMIT-TEXT | Conditional | Hiện ngay dưới ô email |
| 13 | E-SCR-M03-006-13 | Stale / permission / busy feedback | Banner | MSG-STALE, MSG-NO-PERMISSION, MSG-GENERIC | Conditional | Nội dung đang nhập được giữ khi lỗi |
| 14 | E-SCR-M03-006-14 | Action: Quay lại | Button | Về SCR-M03-001 | Yes | None |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading | Spinner | Đang tải danh sách |
| Has accounts | Danh sách tài khoản | Tải thành công |
| Invitation sent | Kết quả đã gửi, tài khoản Chờ nhận lời mời | Gửi lời mời thành công |
| Invitation resent | Kết quả gửi lại, không tạo bản ghi mới | Gửi lại cho tài khoản đang chờ |
| Duplicate email | MSG-EMAIL-TAKEN | Email đã có tài khoản |
| Invalid input | MSG-EMAIL-INVALID | Email/vai trò không hợp lệ |
| Last Reviewer blocked | MSG-LAST-REVIEWER | Khóa hoặc hạ quyền Quản lý hoạt động cuối cùng |
| Permission denied | MSG-NO-PERMISSION | Người dùng không phải Quản lý |
| Stale write | MSG-STALE | `concurrencyRevision` lỗi thời |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Gửi lời mời | Tap | Chuẩn hóa email; kiểm tra trùng; nhà cung cấp gửi lời mời; tạo tài khoản Chờ nhận lời mời | State update |
| 2 | Gửi lại lời mời | Tap | Gửi lại; không tạo bản ghi trùng | State update |
| 3 | Đổi vai trò | Tap | Đổi vai trò; chặn nếu hạ quyền Quản lý cuối cùng; kiểm tra trong giao dịch cơ sở dữ liệu | State update |
| 4 | Khóa / Mở khóa | Tap | Đổi trạng thái; chặn nếu khóa Quản lý cuối cùng | State update |
| 5 | Quay lại | Tap | Về danh sách tuyến | `SCR-M03-001` |
| 6 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-006-001 | Chỉ Quản lý mời, đổi vai trò, khóa và mở khóa; quyền kiểm tra phía server | BR-M03-A03, A04, §2.1 |
| SR-SCR-M03-006-002 | Có đúng hai vai trò cố định; không vai trò tùy chỉnh, không quyền chi tiết hơn, không ủy quyền tạm thời | BR-M03-A01 |
| SR-SCR-M03-006-003 | Email được chuẩn hóa (bỏ khoảng trắng hai đầu, chữ thường) trước khi lưu và trước mọi so sánh; tối đa 254 ký tự; duy nhất | BR-M03-K01 |
| SR-SCR-M03-006-004 | Lời mời hết hạn hoặc không hợp lệ không tạo quyền truy cập; gửi lại cho cùng tài khoản đang chờ không tạo bản ghi trùng | BR-M03-K01 |
| SR-SCR-M03-006-005 | Không thể khóa hoặc hạ quyền Quản lý hoạt động cuối cùng; việc kiểm tra nằm trong giao dịch cơ sở dữ liệu | BR-M03-K03, SC-M03-008 |
| SR-SCR-M03-006-006 | Mời và khôi phục mật khẩu là luồng thông tin đăng nhập do nhà cung cấp quản lý và không bao giờ gán hay đổi vai trò/trạng thái ứng dụng | BR-M03-K02, SC-M03-011 |
| SR-SCR-M03-006-007 | Tài khoản chỉ thành Đang hoạt động sau khi danh tính từ nhà cung cấp hoàn tất và khớp tài khoản Chờ nhận lời mời | US-M03-05 mục 4 |
| SR-SCR-M03-006-008 | Sau lần truy cập đầu, Quản lý đầu tiên nên mời ít nhất một Quản lý dự phòng | BR-M03-K03, §9 |
| SR-SCR-M03-006-009 | Quản lý đầu tiên của môi trường được cấp phía server; màn này không có chức năng khởi tạo Quản lý đầu | BR-M03-K04, SC-M03-010 |
| SR-SCR-M03-006-010 | Mọi thao tác tài khoản ghi nhật ký; không bao giờ hiện hoặc lưu mật khẩu, token | BR-M03-F08 |
| SR-SCR-M03-006-011 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-013 | Mời, hai vai trò cố định, khóa/mở khóa, bảo vệ Quản lý cuối cùng |
| FR-M03-018 | Nhật ký thao tác tài khoản |
| FR-M03-019 | Tên hiển thị vai trò/trạng thái, thông báo từ danh mục |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lỗi liên kết với ô nhập, trạng thái tài khoản không chỉ biểu đạt bằng màu, focus trong dialog xác nhận và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-006-002 | Quy tắc định dạng email hợp lệ | No | Resolved | M03 chỉ chuẩn hóa, kiểm tra độ dài và tính duy nhất; email không hợp lệ được phát hiện khi nhà cung cấp từ chối lời mời và hiện MSG-EMAIL-INVALID. Không đặt thêm quy tắc định dạng riêng. |
| OQ-SCR-M03-006-003 | Có hộp thoại xác nhận cho đổi vai trò/khóa/mở khóa không | No | Resolved | Không có hộp thoại xác nhận: BR-M03-L12 chỉ cho phép hộp thoại cho đóng, mở lại, lưu trữ, thu hồi, xuất bản và rời trang khi chưa lưu. Việc chặn Quản lý cuối cùng do MSG-LAST-REVIEWER đảm nhận. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
