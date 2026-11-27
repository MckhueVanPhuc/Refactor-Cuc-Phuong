# Change Brief CHG-MASCOT-2026-11-27-09 — Thông báo khi không xem được nội dung và khi chưa kiểm tra được mã

| Trường | Nội dung |
|---|---|
| Change ID | CHG-MASCOT-2026-11-27-09 |
| Trạng thái | **APPROVED** (2026-11-27). Được sửa spec-Mascot lên v1.9, đồng bộ tài liệu dẫn xuất và code frontend theo §3 |
| Người duyệt | Chủ dự án (chat 2026-11-27: "BUG-031 … Ko phải bug, bỏ. Còn các bug còn lại bạn hãy xử lý"; giao agent tự quyết phần còn lại). *Chủ dự án điền tên tài khoản nếu cần* |
| Ngày duyệt | 2026-11-27 |
| Loại thay đổi (runbook §4) | Behavioral change nhỏ của [spec-Mascot](../../docs/spec/spec-Mascot.md) (v1.8 → v1.9: không còn hình Mila trong thông báo kết quả quét; ở SCR-M02-001 Mila đứng chờ đổi tư thế), cộng sửa hình thức ở screen spec SCR-M02-001, 002, 004, 005 và design-system. Chỉ frontend. Không đổi spec-M01, spec-M02 (các câu cố định §5.1 giữ nguyên chữ), spec-M03, contract, entity hay dữ liệu |
| Liên quan | [CHG-MASCOT-2026-11-27-08](change-brief-CHG-MASCOT-2026-11-27-08.md) (PR #87) |

## 1. Source

Bảng test của tester (chat 2026-11-27, 2 ảnh):

| Dòng | Lỗi / góp ý | Nguyên nhân |
|---|---|---|
| M02-31, M02-34 (BUG-028) | Hai thông báo mâu thuẫn: "Chưa tải được nội dung mới. Đang dùng nội dung đã lưu nếu có." cùng "Chưa có nội dung offline cho điểm này." | Câu nguồn dự phòng hiện ngay khi tra mã lỗi (`display = PACKAGE`), trước khi biết gói có nội dung cho mã đó |
| M02-31, M02-34 | Màn trống, chỉ có "Quay lại"; không nói cách tải gói, không có "Thử lại" | Thông báo không có hành động |
| M02-31, M02-34 (BUG-031) | Toast "Đã ghi nhận lượt quét." đè lên thông báo phía trên | **Chủ dự án: không phải lỗi, bỏ** |
| M02-23 | Thông báo "Cần có kết nối…" không có "Thử lại", không có nút đóng, không nói lượt quét có được tính | Thông báo chỉ có câu cố định |
| M02-23 | Hai Mila trên một màn: hình trong thông báo và Mila đứng chờ ở góc | Hình INLINE (MAS-B-046, 047) cộng DOCK; trái spec-Mascot §5.1 "tối đa một lần trên một màn" |
| M02-23 (giống BUG-026) | Mở bằng camera ngoài app thì cùng lỗi mà giao diện khác hẳn | Trang `/q/…` dùng thông báo không tiêu đề, không hành động |

## 2. Quyết định (agent, theo ủy quyền của chủ dự án 2026-11-27)

| # | Quyết định |
|---|---|
| D1 | Câu "Chưa tải được nội dung mới. Đang dùng nội dung đã lưu nếu có." chỉ hiện khi **thật sự** đang hiển thị nội dung từ gói (spec-M02 §5.1 "nếu có"; không đổi chữ) |
| D2 | Không xem được nội dung (SCR-M02-002/004): **một thẻ** có tên điểm và câu cố định. Điểm cần gói (`MISSING_RESOURCE`): thêm "Khi có mạng, mở Tài nguyên để tải gói của tuyến này." và nút **"Mở Tài nguyên"** (SCR-M01-004). Điểm cần mạng (`ONLINE_ONLY`): nút **"Thử lại"** (tra lại đúng mã). Nút "Quay lại" giữ nguyên |
| D3 | Chưa kiểm tra được mã (`CONNECTION_NEEDED`), mọi màn: tiêu đề **"Chưa kiểm tra được mã này"**, câu cố định, dòng **"Lượt quét chưa được tính."** (màn Chuyến đi: "Lượt quét chưa được tính. Hành trình bên dưới giữ nguyên."; khách tự do: không có dòng này vì không lượt nào được tính), nút **"Thử lại"**. SCR-M02-001 và SCR-M02-005: thêm nút **×** đóng thông báo. Trang `/q/…` dùng cùng thẻ, màu theo bề mặt |
| D4 | Một Mila trên màn: thông báo kết quả quét (`INVALID`, `CONNECTION_NEEDED`) **không còn hình Mila**. Ở SCR-M02-001, lần lỗi đầu Mila đứng chờ đổi sang tư thế bối rối (không lời); lần lỗi thứ hai giống nhau vẫn nói MSG-MAS-046/048 ở chỗ cũ. Khác đề xuất ban đầu (ẩn Mila ở góc) vì Mila ở góc là chỗ của câu giúp đỡ lần hai |
| D5 | BUG-031 bỏ (D của chủ dự án); toast xác nhận lượt quét giữ như cũ |
| D6 | M02-31 có thể là lỗi chức năng (tester ghi đã tải gói mà vẫn "Chưa có nội dung offline"): chờ tester xác nhận gói "Sẵn sàng" ở màn Tài nguyên rồi mới điều tra; không sửa trong đợt này |

## 3. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/spec-Mascot.md` | v1.9: §5.1, change notes |
| `docs/design/design-system.md` | §5 thẻ thông báo kết quả quét có tiêu đề và hành động |
| `docs/mascot/MASCOT_BEHAVIOR_MATRIX.md` | MAS-B-046, 047 |
| `screens/screen-spec/M02/screen-spec-SCR-M02-001.md`, `-002.md`, `-004.md`, `-005.md` | Phần tử, bảng copy |
| `specs/005-visitor-mascot/**` | Brief này, tasks Phase 23, validation report §23 |
| `src/modules/m02/{content,session,scan,qr-link,i18n}/**`, `src/shared/mascot/rules.ts` | Code và test |
| `e2e/**` | Test liên quan |

## 4. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor, field, DAC, contract, report | Không đổi |
| Lifecycle | Không đổi. "Thử lại" chạy lại đúng luồng quét/xem của mã đó; lượt ghé đã có không bị ghi lại |
| Screen | SCR-M02-001, 002, 004, 005: thông báo kết quả quét và thẻ không có nội dung |
| Câu chữ | Mới: "Chưa kiểm tra được mã này", "Lượt quét chưa được tính." (+ "Hành trình bên dưới giữ nguyên."), "Khi có mạng, mở Tài nguyên để tải gói của tuyến này.", "Mở Tài nguyên". Câu cố định của spec-M02 §5.1 giữ nguyên |
| Truy cập | Thẻ vẫn `role="alert"`; nút có tên bằng chữ; × có tên "Đóng thông báo" |
| Dependency, backend, dữ liệu | Không |

## 5. Non-goals

- Không đổi toast xác nhận lượt quét (BUG-031 bỏ).
- Không đổi điều kiện ghi lượt ghé hay cách tra cứu.
- Không điều tra M02-31 khi chưa có xác nhận của tester (D6).

## 6. Validation gates

- `npm run ci` PASS; `npx playwright test --project=m02 --project=m02-cam-evil` PASS.
- Chụp 390 px: trang nội dung điểm cần gói / điểm cần mạng khi offline; màn Chuyến đi khi chưa kiểm tra được mã; trang `/q/…` khi chưa kiểm tra được mã.

## 7. Tiến độ

| Ngày | Việc | Kết quả |
|---|---|---|
| 2026-11-27 | Phân tích, chủ dự án bỏ BUG-031 | Xong |
| 2026-11-27 | Tài liệu, code, test (tasks T133–T137; validation report §23) | Xong |
