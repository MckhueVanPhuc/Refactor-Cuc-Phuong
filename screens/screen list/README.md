# Screen Inventory — Cúc Phương Quest

Cập nhật 2026-10-27 theo Spec M01 v3.2, M02 v3.2, M03 v3.6 và function lists hiện hành. Đây là danh mục màn hình và coverage để làm screen specification; chưa phải mockup hoặc implementation.

| Danh mục | Screens | Coverage | Nội dung |
|---|---:|---|---|
| [M01 — Route Planning & Preparation](screen-list-M01.md) | 4 | 14/14 FR | Danh mục thẻ tuyến, gợi ý, chi tiết/chuẩn bị, package offline |
| [M02 — Field Quest Experience](screen-list-M02.md) | 4 | 26/26 FR | Phiên/scanner, nội dung điểm tham quan, kết thúc phiên, trang mở từ mã QR |
| [M03 — Operations & Content Administration](screen-list-M03.md) | 10 | 18/18 FR | Đăng nhập, lời mời/khôi phục, tuyến, biên tập tuyến, thư viện điểm dừng, điểm tham quan & nội dung, xem lại & xuất bản, báo cáo, tài khoản, nhật ký hệ thống |

Tổng inventory: 18 module screens. Coverage 58/58 FR đang dùng gồm cả embedded/background/backend behavior, không hàm ý 58 UI features đã triển khai. Các màn Should có thể chưa có trong release tối thiểu theo [MVP Scope](../../MVP-Scope.md).

## Quy ước

- Giữ các ID SCR-M01/M02/M03 hiện hữu; ID không bao giờ được đánh lại hay dùng lại; màn mới nhận ID tiếp theo. Authentication bắt buộc của admin thuộc danh mục M03; không tạo namespace/module màn hình dùng chung riêng.
- Screen là user goal/navigation destination; tab/dialog/panel/banner là embedded UI. Background job/data invariant được trace riêng, không biến thành screen.
- Tất cả FN/FR dùng ID đầy đủ trong inventory/coverage. Screen suffix trong coverage được giải thích tại từng file.
- Priority kế thừa function trong MVP Scope; screen Must có thể chứa action Should. Không vì dùng chung screen mà nâng tất cả capability lên Must.
- M01–M02 không có tài khoản du khách. M03 bắt buộc authenticated role và online.
- Spec mới là baseline hành vi; layout/gộp màn và supporting UX là quyết định thiết kế ghi tại inventory này. Nội dung ngoài spec không được đưa vào FR coverage.
- Screen specification chi tiết nằm trong [screen-spec](../screen-spec/). Các file hiện có được viết theo baseline cũ (v2) và **đang lỗi thời** so với spec v3; SCR-M02-004, SCR-M03-008 và SCR-M03-009 chưa có file. Mục §7 của từng screen list ghi trạng thái từng file; việc cập nhật làm ở bước sau.

## Luồng xuyên module

Visitor vào SCR-M01-001 → chọn/chuẩn bị tuyến tại SCR-M01-003 → handoff v3 hợp lệ vào SCR-M02-001 → nội dung tại SCR-M02-002 → kết thúc tại SCR-M02-003. Bất kỳ ai quét mã QR bằng camera điện thoại đều vào SCR-M02-004: có phiên trong cùng trình duyệt thì xử lý như quét trong app, không có phiên thì xem nội dung ở chế độ khách tự do. Admin vào SCR-M03-000; lời mời/khôi phục mật khẩu dùng SCR-M03-007; sau authorization mới vào các màn M03 theo quyền.
