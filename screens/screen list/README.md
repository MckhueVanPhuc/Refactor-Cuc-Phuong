# Screen Inventory — Cúc Phương Quest

Cập nhật 2026-09-27 theo Spec M01–M03 v2.0 và function lists hiện hành. Đây là danh mục màn hình và coverage để làm screen specification; chưa phải mockup hoặc implementation.

| Danh mục | Screens | Coverage | Nội dung |
|---|---:|---|---|
| [M01 — Route Planning & Preparation](screen-list-M01.md) | 4 | 13/13 FR | Danh mục, gợi ý, chi tiết/chuẩn bị, package offline |
| [M02 — Field Quest Experience](screen-list-M02.md) | 3 | 20/20 FR | Session/scanner, content, Finish |
| [M03 — Operations & Content Administration](screen-list-M03.md) | 8 | 16/16 FR | Login, invitation/recovery, route, editor, checkpoint/QR/content, review, reports, accounts |

Tổng inventory: 15 module screens. Coverage 49/49 FR gồm cả embedded/background/backend behavior, không hàm ý 49 UI features đã triển khai. Các màn Should/Could có thể chưa có trong release tối thiểu theo [MVP Scope](../../MVP-Scope.md).

## Quy ước

- Giữ các ID SCR-M01/M02/M03 hiện hữu, cập nhật mapping theo FR/FN mới. Authentication bắt buộc của admin thuộc danh mục M03; không tạo namespace/module màn hình dùng chung riêng.
- Screen là user goal/navigation destination; tab/dialog/banner là embedded UI. Background job/data invariant được trace riêng, không biến thành screen.
- Tất cả FN/FR dùng ID đầy đủ trong inventory/coverage. Screen suffix trong coverage được giải thích tại từng file.
- Priority kế thừa function trong MVP Scope; screen Must có thể chứa action Should/Could. Không vì dùng chung screen mà nâng tất cả capability lên Must.
- M01–M02 không có tài khoản du khách. M03 bắt buộc authenticated role và online.
- Spec mới là baseline hành vi; layout/gộp màn và supporting UX là quyết định thiết kế ghi tại inventory này. Nội dung ngoài spec không được đưa vào FR coverage.
- Dùng [screen spec template](../../docs/templates/screen%20%20spec%20template.md) cho bước thiết kế chi tiết; target files ghi trong danh mục chưa được tạo.

## Luồng xuyên module

Visitor vào SCR-M01-001 → chọn/chuẩn bị tuyến tại SCR-M01-003 → handoff hợp lệ vào SCR-M02-001 → content tại SCR-M02-002 → Finish tại SCR-M02-003. Free visitor là mode tùy increment, không tạo session. Admin vào SCR-M03-000; invitation/password recovery dùng SCR-M03-007; sau authorization mới vào các màn M03 theo quyền.
