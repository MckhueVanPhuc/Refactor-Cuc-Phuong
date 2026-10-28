# Demo tương tác M03

Bản demo để thử luồng giữa 10 màn M03. Đây là mockup tham chiếu, không phải code ứng dụng (xem CLAUDE.md).
Các mockup tĩnh theo trạng thái vẫn ở `../mockup-SCR-M03-*.html`.

## Chạy

Mở `index.html` bằng trình duyệt (không cần server). Tài khoản demo có mật khẩu `demo1234`:
`quanly@example.org` (Quản lý), `bientap.vien@example.org` (Nhân viên nội dung).

## Dữ liệu và chia sẻ

- `seed.js` là dữ liệu mẫu, được commit trong repo. Lần đầu mở (hoặc bấm "Đặt lại dữ liệu"), dữ liệu được nạp vào `localStorage` của trình duyệt.
- `localStorage` nằm trong từng trình duyệt nên **không push lên GitHub được**. Mỗi người thử có bản dữ liệu riêng.
- Muốn chia sẻ một trạng thái cụ thể: "Xuất JSON" rồi gửi tệp cho người khác, họ bấm "Nhập JSON".
- Muốn người khác mở bằng link: bật GitHub Pages cho repo (Settings → Pages), rồi mở `.../screens/html/interactive/index.html`.

## Quy tắc được mô phỏng

Tuyến tự đóng khi hết điểm dừng hoạt động (không tự mở lại); chặn khóa/hạ quyền Quản lý cuối cùng; tối đa 20 điểm tham quan chưa thu hồi mỗi điểm dừng; không lưu trữ điểm dừng khi còn tuyến liệt kê; chỉ lưu trữ khi Tạm đóng; Nhân viên không mở lại/lưu trữ và không vào Tài khoản, Nhật ký; xuất bản tuyến/điểm dừng/điểm tham quan tạo bản hành trình mới cho các tuyến liên quan; kiểm tra điều kiện xuất bản, trần tải trước 50 MB, tên điểm dừng không trùng, tối đa 30 điểm dừng mỗi tuyến, nhật ký mọi thao tác.

Không mô phỏng: upload media, phát hiện ghi cũ (stale write), mật khẩu thật.
