# Change Brief CHG-M03-2026-11-10-01 — Tem QR in tên điểm tham quan, bỏ "In lại", ẩn mục đã thu hồi

| Trường | Nội dung |
|---|---|
| Change ID | CHG-M03-2026-11-10-01 |
| Trạng thái | **Chờ chủ dự án duyệt**. Người vận hành cloud chốt nội dung ngày 2026-11-10; chủ dự án duyệt bằng việc merge PR mang commit này (PR #46 đã merge trước khi commit được đẩy lên) |
| Người đề xuất | Người vận hành cloud |
| Người duyệt | MckhueVanPhuc (chủ dự án) |
| Loại thay đổi | Đổi quy tắc giao diện M03 và nội dung ảnh tem. Không đổi dữ liệu, contract, quyền hay cơ chế định danh |
| Liên quan | [spec-M03](../../docs/spec/spec-M03.md) v3.7 clarification 11; PR #46 |

## 1. M03 source

[spec-M03](../../docs/spec/spec-M03.md): BR-M03-A02, B05, E07, E16, G05, SC-M03-026, §2 (vai trò), §3 (US-M03-03 mục 8), §5.3 (hằng số), §9, §10, §12. Danh mục thông báo §5.6 không đổi.

## 2. Current → New

| Hiện tại | Mới |
|---|---|
| Dưới mã QR trên tem in "Mã …{6 ký tự cuối}" | In **tên tiếng Việt** của điểm tham quan, tối đa 2 dòng, dài hơn thì cắt bằng "…" |
| Tên tệp tải về `ma-qr-{6 ký tự}` | `ma-qr-{tên bỏ dấu}`, ví dụ `ma-qr-ho-mac.svg` |
| Tải được ảnh ngay sau lần lưu đầu, kể cả khi chưa có tên | Hai nút tải bị tắt cho tới khi đã **lưu** tên tiếng Việt, kèm MSG-MISSING-FIELD ("Còn thiếu: Tên đối tượng (tiếng Việt).") |
| Màn tải ghi "Khi in, mã phải rộng ít nhất 3 cm." | Bỏ dòng này; bỏ hằng số `QR_PRINT_MIN_SIZE_CM` |
| Danh sách điểm tham quan và tiêu đề editor hiện "Mã …{6 ký tự}" | Không hiện phần nào của mã; bỏ hằng số `QR_CODE_DISPLAY_SUFFIX_CHARS` |
| Nút "In lại" ghi một dòng nhật ký (C-17) | Bỏ nút. In lại tem hỏng = tải lại ảnh; không ghi gì |
| Danh sách điểm tham quan hiện cả mục "Đã thu hồi" | Ẩn mặc định; nút "Hiện mục đã thu hồi ({số})" / "Ẩn mục đã thu hồi" |

## 3. Quyết định đã chốt (2026-11-10)

| Mục | Quyết định |
|---|---|
| Tên trên tem | Tên tiếng Việt đã lưu (bản nháp nếu có, không thì bản đã xuất bản), không lấy ô đang gõ chưa lưu |
| Snapshot tên | Tên tại lúc tải ảnh; tấm tem đã in là bản chụp. **Không lưu vào database**, không cảnh báo tem lệch tên |
| Mã định danh | Giữ nguyên `qrIdentifier` ngẫu nhiên ≥ 16 ký tự, link `/q/{qrIdentifier}`, tra cứu và bảo mật |
| In lại | Bỏ nút; chấp nhận không theo dõi việc thay tem |
| RPC `api.record_reprint` (C-17) | Giữ trên server, giao diện không gọi nữa, để không phải viết migration trên cloud. Các dòng "In lại mã QR" cũ trong nhật ký vẫn hiện đúng |
| Mục đã thu hồi | Chỉ ẩn trên giao diện; dữ liệu, giới hạn 20 mục và đánh số "chưa đặt tên" không đổi |
| Danh mục thông báo | Không thêm khóa mới, không đổi câu chữ: danh mục có bản sao trong SQL (`app.message_template`), đổi thì phải viết migration. Nút tải bị tắt dùng lại MSG-MISSING-FIELD; MSG-REPRINT-MODE-CHANGED giữ "in lại mã QR" (vẫn đúng nghĩa: tải lại ảnh và in) |

## 4. Rủi ro chấp nhận

- Hai điểm tham quan cùng tên trong một điểm dừng có tem trông giống nhau.
- Tem in trước khi đổi tên vẫn mang tên cũ, và giao diện không còn mã rút gọn để đối chiếu.
- Cách đối chiếu cho cả hai trường hợp: quét tem bằng điện thoại để mở đúng điểm tham quan. Chỉ dùng được với điểm đã xuất bản.

Thời điểm đổi: T209 chưa đạt, chưa in tem hàng loạt, nên không phải thay tem nào ngoài thực địa.

## 5. Không thay đổi

Schema, migration, RPC, Edge Function, contract M01/M02, live lookup, quyền, cơ chế sinh mã, nội dung mã QR (link công khai), mức sửa lỗi, kích thước PNG, dòng cảnh báo vùng không sóng, dấu "BẢN THỬ".

## 6. File đã sửa

- Code: `visit-points/qr-print/renderQr.ts` (tên, ngắt dòng, tên tệp), `QrPrintPanel.tsx`, `VisitPointLifecycle.tsx`, `VisitPointEditorPage.tsx`, `checkpoint-library/CheckpointEditorPage.tsx`, `config/limits.ts`, `messages/format.ts`, `messages/catalogText.ts`.
- Test: `renderQr.test.ts`, `VisitPointLifecycle.test.tsx`, `VisitPointEditorPage.test.tsx`, `CheckpointEditorPage.test.tsx`, `catalog.test.ts`, `limits.test.ts`, `format.test.ts`; e2e `m03/flows.ts`, `m03/checkpoints.spec.ts`, `m03/forbidden-words.spec.ts`.
- Tài liệu: spec-M03 (clarification 11), function-list-M03, screen-spec SCR-M03-003 và 008, spec gói 003, admin-command-contract (C-17), admin-ui-flow-contract §4, quickstart Q6/Q9.
- Không sửa: mockup HTML trong `screens/html/` (chỉ là tham chiếu), lịch sử trong `tasks.md` và `research.md`.

## 7. Kiểm chứng

| Kiểm | Kết quả |
|---|---|
| `npm run ci` | PASS (2146 test, 133 skipped), trên `main` sau #45, #46, #47 |
| `npx playwright test e2e/m03 e2e/m02` | PASS (84 test) |
| Tải tem thật trên Production và quét bằng điện thoại | Chờ deploy |
