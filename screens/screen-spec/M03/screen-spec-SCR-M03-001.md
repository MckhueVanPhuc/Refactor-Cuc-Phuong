# Screen Spec: Quản trị tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-001` |
| Screen name | Quản trị tuyến |
| Module | `M03` |
| Actor | Nhân viên nội dung, Quản lý |
| Priority | Must |
| Mockup | [mockup-SCR-M03-001.html](../../html/mockup-SCR-M03-001.html) (HTML tĩnh, chỉ để xem tham khảo, không phải thiết kế chính thức; chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-01/02/04/08, BR-M03-C01, H01 đến H09, F07, F10). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Giao diện quản trị chỉ dùng tên hiển thị của §5.4 và thông báo từ danh mục §5.6; mã trạng thái không hiện trên màn hình.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Sau SCR-M03-000 và kiểm tra server-side identity, vai trò, trạng thái tài khoản; hoặc khi quay về từ các màn M03 khác.

**The user leaves when:** Mở hoặc tạo tuyến (SCR-M03-002); mở thư viện điểm dừng (SCR-M03-008), báo cáo (SCR-M03-005), tài khoản (SCR-M03-006, Quản lý), nhật ký hệ thống (SCR-M03-009, Quản lý).

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M03-001.html](../../html/mockup-SCR-M03-001.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-001-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-001-02 | Screen title | Header text | "Quản trị tuyến" | Yes | Non-empty |
| 3 | E-SCR-M03-001-03 | Menu M03 | Navigation | Tuyến, Thư viện điểm dừng, Báo cáo, Tài khoản (Quản lý), Nhật ký hệ thống (Quản lý) | Yes | Mục chỉ dành Quản lý ẩn/vô hiệu với Nhân viên nội dung; quyền vẫn do server kiểm tra (BR-M03-A04) |
| 4 | E-SCR-M03-001-04 | Route search | Input | Tìm theo tên tuyến | No | None |
| 5 | E-SCR-M03-001-05 | Route status filter | Selector | Nháp / Đang hoạt động / Tạm đóng / Đã lưu trữ | No | Chỉ tên hiển thị §5.4 |
| 6 | E-SCR-M03-001-06 | Route list | Table/List | Tuyến: tên (tiếng Việt), trạng thái (tên hiển thị) | Yes | Mỗi tuyến một dòng |
| 7 | E-SCR-M03-001-07 | Pending-draft mark | Badge | Dấu "có bản nháp chưa xuất bản" | Conditional | Hiện khi tuyến có bản nháp `NHAP` đang chờ |
| 8 | E-SCR-M03-001-08 | Closure info | Text | Nguồn đóng ("Đóng thủ công" / "Tự đóng vì không còn điểm dừng hoạt động"), lý do, thời điểm | Conditional | Chỉ khi tuyến Tạm đóng; lý do là nội bộ, không lộ cho du khách |
| 9 | E-SCR-M03-001-09 | Action: Tạo tuyến | Button | Tạo tuyến mới và mở editor | Yes | Mã tuyến do hệ thống sinh, không có ô nhập (BR-M03-B01) |
| 10 | E-SCR-M03-001-10 | Action: Mở tuyến | Row action | Mở SCR-M03-002 | Yes | None |
| 11 | E-SCR-M03-001-11 | Action: Đóng tạm | Row action | Đóng tuyến đang hoạt động | Conditional | Cả hai role; chỉ tuyến Đang hoạt động; cần lý do |
| 12 | E-SCR-M03-001-12 | Action: Mở lại | Row action | Mở lại tuyến Tạm đóng | Conditional | Chỉ Quản lý; cần ghi chú xác nhận an toàn và đạt kiểm tra kỹ thuật |
| 13 | E-SCR-M03-001-13 | Action: Lưu trữ | Row action | Lưu trữ tuyến Tạm đóng | Conditional | Chỉ Quản lý; chỉ khi Tạm đóng; không thể hoàn tác |
| 14 | E-SCR-M03-001-14 | Action: Hủy | Row action | Hủy tuyến chưa từng xuất bản | Conditional | Cả hai role; tuyến Nháp chưa từng xuất bản; cần lý do |
| 15 | E-SCR-M03-001-15 | Close dialog | Dialog | MSG-CONFIRM-CLOSE-ROUTE: "Tuyến \"{tên}\" sẽ ẩn khỏi lựa chọn của du khách; các chuyến đang đi không bị dừng." và hai nút; ô lý do | Conditional | Lý do bắt buộc, không rỗng, tối đa 300 ký tự (`NOTE_MAX_CHARS`); không qua màn xem lại xuất bản (BR-M03-H01) |
| 16 | E-SCR-M03-001-16 | Reopen dialog | Dialog | MSG-CONFIRM-REOPEN-ROUTE: "Tuyến \"{tên}\" sẽ lại hiện cho du khách chọn." và hai nút; ô ghi chú xác nhận an toàn và kết quả kiểm tra | Conditional | Ghi chú bắt buộc, tối đa 300 ký tự; kiểm tra lỗi thì hiện MSG-REOPEN-BLOCKED kèm danh sách cần xử lý |
| 17 | E-SCR-M03-001-17 | Archive dialog | Dialog | MSG-CONFIRM-ARCHIVE-ROUTE: "Lưu trữ tuyến \"{tên}\" không thể hoàn tác; dữ liệu vẫn được giữ cho lịch sử và báo cáo." và hai nút; ô lý do | Conditional | Lý do bắt buộc, tối đa 300 ký tự |
| 18 | E-SCR-M03-001-18 | Discard dialog | Dialog | MSG-CONFIRM-DISCARD-ROUTE: "Hủy tuyến \"{tên}\": tuyến chưa từng xuất bản này sẽ không dùng được nữa." và hai nút; ô lý do | Conditional | Lý do bắt buộc, tối đa 300 ký tự; tuyến chuyển sang Đã lưu trữ; không ảnh hưởng điểm dừng đã liệt kê (BR-M03-C01) |
| 19 | E-SCR-M03-001-19 | History panel | Panel | Lịch sử các bản đã xuất bản của tuyến | Conditional | Mọi quản trị viên xem được (BR-M03-F09) |
| 20 | E-SCR-M03-001-20 | Action: Khôi phục bản đã xuất bản trước đó | Button | Sao chép bản cũ thành bản nháp mới | Conditional | Bị chặn khi đang có bản nháp: MSG-DRAFT-EXISTS; bị từ chối với MSG-RESTORE-BLOCKED khi bản cũ vi phạm giới hạn hiện hành (BR-M03-F07) |
| 21 | E-SCR-M03-001-21 | Action: Bỏ thay đổi | Button | Bỏ bản nháp đang chờ | Conditional | Bản đã xuất bản giữ nguyên (BR-M03-F10) |
| 22 | E-SCR-M03-001-22 | Busy / stale / permission feedback | Banner | MSG-ROUTE-BUSY, MSG-STALE, MSG-NO-PERMISSION, MSG-GENERIC | Conditional | Hiện khi thao tác bị từ chối; không hiện mã kỹ thuật |
| 23 | E-SCR-M03-001-23 | Empty / loading / error states | Panel | Chưa có tuyến, đang tải, lỗi mạng | Conditional | Lỗi bất ngờ dùng MSG-GENERIC |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading | Spinner | Đang tải danh sách |
| Empty | Chưa có tuyến, có Tạo tuyến | Không có tuyến |
| Has routes | Danh sách tuyến, trạng thái, dấu bản nháp | Tải thành công |
| Closing | Dialog đóng tạm | Chọn Đóng tạm |
| Reopening | Dialog mở lại, kết quả kiểm tra | Quản lý chọn Mở lại |
| Reopen blocked | MSG-REOPEN-BLOCKED kèm danh sách | Kiểm tra mở lại không đạt |
| Archiving | Dialog lưu trữ | Quản lý chọn Lưu trữ |
| Discarding | Dialog hủy | Chọn Hủy tuyến chưa từng xuất bản |
| Operation busy | MSG-ROUTE-BUSY | Có thao tác khác trên tuyến/điểm dừng liên quan |
| Permission denied | MSG-NO-PERMISSION | Hành động Quản lý do Nhân viên nội dung thực hiện |
| Network error | MSG-GENERIC; không mất nội dung | Lỗi mạng/hệ thống |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Tìm/Lọc | Nhập/chọn | Lọc danh sách | State update |
| 2 | Tạo tuyến | Tap | Mở editor tuyến mới | `SCR-M03-002` |
| 3 | Mở tuyến | Tap | Mở editor | `SCR-M03-002` |
| 4 | Đóng tạm | Xác nhận | Tuyến thành Tạm đóng ngay; không qua màn xem lại; ghi nhật ký | State update |
| 5 | Mở lại | Xác nhận (Quản lý) | Kiểm tra kỹ thuật; đạt thì mở lại; không đạt thì MSG-REOPEN-BLOCKED | State update |
| 6 | Lưu trữ | Xác nhận (Quản lý) | Tuyến Đã lưu trữ; không ảnh hưởng điểm dừng | State update |
| 7 | Hủy | Xác nhận | Tuyến chưa từng xuất bản thành Đã lưu trữ | State update |
| 8 | Khôi phục | Tap | Tạo bản nháp từ bản cũ | `SCR-M03-002` |
| 9 | Bỏ thay đổi | Tap | Bản nháp thành Đã bỏ | State update |
| 10 | Menu | Chọn | Mở màn tương ứng | `SCR-M03-008` / `SCR-M03-005` / `SCR-M03-006` / `SCR-M03-009` |
| 11 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-001-001 | Vòng đời tuyến: Nháp → Đang hoạt động → Tạm đóng → Đã lưu trữ; tuyến chưa từng xuất bản có thể Hủy trực tiếp; không có trạng thái chờ duyệt | BR-M03-C01, A05 |
| SR-SCR-M03-001-002 | Cả hai role đóng tạm, hủy tuyến chưa xuất bản và khôi phục; chỉ Quản lý mở lại và lưu trữ | BR-M03-A02, A03, H06 đến H09 |
| SR-SCR-M03-001-003 | Đóng tạm là thao tác khẩn: không màn xem lại, có hiệu lực khi hoàn tất, lý do bắt buộc | BR-M03-H01, H03 |
| SR-SCR-M03-001-004 | Tuyến không bao giờ tự mở lại, kể cả khi điểm dừng được mở lại; mở lại cần tuyến còn trường bắt buộc hợp lệ và ít nhất một điểm dừng hoạt động | BR-M03-H07, SC-M03-019 |
| SR-SCR-M03-001-005 | Đóng tuyến không dừng hay báo cho phiên M02 đang chạy; Ban Quản lý xử lý cảnh báo tại chỗ | BR-M03-H05 |
| SR-SCR-M03-001-006 | Hủy hoặc lưu trữ tuyến không ảnh hưởng điểm dừng mà tuyến liệt kê | BR-M03-C01, T07 |
| SR-SCR-M03-001-007 | Khôi phục bị chặn khi đang có bản nháp (MSG-DRAFT-EXISTS) hoặc khi bản cũ vi phạm giới hạn hiện hành (MSG-RESTORE-BLOCKED, không tạo bản nháp); lịch sử không bị xóa | BR-M03-F07, SC-M03-021 |
| SR-SCR-M03-001-008 | Thao tác trên một tập kết nối chạy tuần tự; thao tác thứ hai bị từ chối bằng MSG-ROUTE-BUSY | BR-M03-F05 |
| SR-SCR-M03-001-009 | Mỗi thao tác quản trị ghi đúng một dòng nhật ký; mọi trạng thái hiện bằng tên hiển thị | BR-M03-F08, L11 |
| SR-SCR-M03-001-010 | Không có xóa vật lý bản ghi nào | BR-M03-D12 |
| SR-SCR-M03-001-011 | Hộp thoại xác nhận chỉ gồm một câu hệ quả và hai nút | BR-M03-L12 |
| SR-SCR-M03-001-012 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-001 | Tạo/mở tuyến, trạng thái tuyến |
| FR-M03-007 | Một bản nháp, khôi phục, bỏ thay đổi, từ chối stale, thao tác tuần tự |
| FR-M03-011 | Đóng tạm, mở lại, lưu trữ tuyến |
| FR-M03-018 | Lịch sử từng mục; ghi nhật ký mọi thao tác |
| FR-M03-019 | Tên hiển thị và thông báo từ danh mục |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lỗi liên kết với ô nhập, trạng thái không chỉ biểu đạt bằng màu, focus được quản lý trong dialog và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-001-003 | Các cột và tiêu chí lọc của danh sách tuyến ngoài trạng thái | No | Resolved | Cột: tên tuyến, trạng thái, dấu bản nháp, số điểm dừng đang hoạt động, ngày xuất bản gần nhất; lọc theo trạng thái và tìm theo tên. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
