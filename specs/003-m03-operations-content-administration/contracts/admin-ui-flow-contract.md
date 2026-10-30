# Contract — Luồng giao diện quản trị M03 (màn hình → query/command → thông báo)

| Mục | Giá trị |
|---|---|
| Producer | Frontend M03 (`src/modules/m03/`) |
| Consumer | Nhân viên nội dung và Quản lý (người dùng); test E2E |
| Nguồn | [spec-M03](../../../docs/spec/spec-M03.md) §3 (US), §5.2.L, §5.4–5.6, §8; [screen list M03](../../../screens/screen%20list/screen-list-M03.md); [screen spec M03](../../../screens/screen-spec/M03/); [design-system.md](../../../docs/design/design-system.md). Screen spec và design system chỉ quyết định hình thức; hành vi lấy từ spec (CLAUDE.md) |
| Ràng buộc | Online-only, không có store offline; mọi chữ là tiếng Việt giản dị; không JSON, tên trường, mã trạng thái, HTTP, id nội bộ (trừ "Mã …{6 ký tự}") (BR-M03-L09–L13; FR-M03-019) |

## 1. Bản đồ route (React Router, lazy `/admin/*`)

| Path | Màn | Truy cập | Query/command chính ([admin-command-contract.md](admin-command-contract.md)) | Priority (MVP-Scope) |
|---|---|---|---|---|
| `/admin/login` | SCR-M03-000 Đăng nhập quản trị | công khai | Auth sign-in, Q-01 | Must |
| `/admin/invitation`, `/admin/recovery` | SCR-M03-007 Nhận lời mời & Khôi phục mật khẩu | link của provider | [auth-account-contract.md](auth-account-contract.md) §2.3–2.4 | Must |
| `/admin/routes` | SCR-M03-001 Quản trị tuyến | B | Q-02; C-09, C-12, C-14, C-07; Q-10 | Must |
| `/admin/routes/new`, `/admin/routes/:routeId` | SCR-M03-002 Biên tập tuyến (4 bước) | B | Q-03, Q-04; C-01, C-04, C-06, C-08 | Must |
| `/admin/checkpoints` | SCR-M03-008 Thư viện điểm dừng (danh sách) | B | Q-05; C-10, C-11, C-13, C-15, C-07 | Must |
| `/admin/checkpoints/new`, `/admin/checkpoints/:checkpointId` | SCR-M03-008 (editor điểm dừng + danh sách điểm tham quan) | B | Q-06; C-02, C-06, C-08 | Must |
| `/admin/checkpoints/:checkpointId/visit-points/new`, `…/visit-points/:qrIdentifier` | SCR-M03-003 Điểm tham quan (QR) & Nội dung | B | Q-07; C-03, C-04, C-16, C-17, C-07 | Must; xem trước: Should |
| `/admin/review/:unitType/:subjectId` | SCR-M03-004 Xem lại & Xuất bản | B | Q-08; C-05 | Must; xem trước: Should |
| `/admin/reports` | SCR-M03-005 Báo cáo vận hành | B | Q-12, Q-13 | Should |
| `/admin/accounts` | SCR-M03-006 Tài khoản & Vai trò | R | Q-14; C-18, C-19; Edge invite/resend | Must |
| `/admin/audit` | SCR-M03-009 Nhật ký hệ thống | R | Q-11 | Should |

Plan decision: path chứa id opaque để reload và deep link hoạt động. Id **không bao giờ** được render trong nội dung trang; thanh địa chỉ là chrome của trình duyệt, không phải UI của M03. Route chỉ dành cho Reviewer vẫn hiện MSG-NO-PERMISSION nếu Nhân viên mở thẳng bằng URL (server cũng từ chối).

Mọi màn đã đăng nhập có nút đăng xuất ở header ([auth-account-contract.md](auth-account-contract.md) §2.6; BR-M03-K06).

## 2. Hành vi chung của editor (SCR-M03-002, 003, 008)

| Hành vi | Quy tắc | BR |
|---|---|---|
| Một nút "Lưu bản nháp" cho toàn form; không autosave; nút tắt khi form điểm tham quan mới còn rỗng | C-01/C-02/C-03 | F11, E15 |
| Lỗi hiện dưới đúng trường khi rời trường hoặc khi lưu | `ValidationIssue` client + server | L02 |
| Panel "Còn thiếu để xuất bản" luôn hiện; bấm một dòng thì focus `targetFieldKey` | hàm thuần trên state form | L03 |
| Lưu lỗi / stale: không mất chữ; MSG-STALE + "Tải lại" | | F06, L05, L06 |
| MSG-SAVED chỉ sau khi lưu toàn bộ thành công | | F11 |
| Rời trang khi có thay đổi chưa lưu → MSG-UNSAVED-CHANGES (ở lại / rời đi) | `useBlocker` + `beforeunload`; đăng ký với registry của shell | F11; R-20, R-22 |
| Câu gợi ý chỉ theo danh sách §5.5, một dòng | `hints.ts` | L12 |
| Tên hiển thị trạng thái, role, mode chỉ theo §5.4 | `displayNames.ts` | L11 |
| Hộp xác nhận chỉ cho: đóng, mở lại, lưu trữ, thu hồi, hủy mục chưa từng xuất bản, xuất bản, rời trang có thay đổi chưa lưu; một câu hậu quả (MSG-CONFIRM-*) + hai nút | | L12 (spec-M03 3.7 clarification 7) |
| Thông báo: chọn bằng `messageKey`, điền placeholder bằng giá trị thường; khóa thiếu → MSG-GENERIC | `formatMessage` | L13 |

## 3. Luồng theo màn

### SCR-M03-002 Biên tập tuyến

- Bước 1 "Thẻ tuyến": ảnh thumbnail, tên, mô tả ngắn, quãng đường, thời lượng, độ khó. Bước 2 "Chi tiết": mô tả, điểm xuất phát, yêu cầu tham gia, chuẩn bị, thời điểm phù hợp, cảnh báo an toàn (câu gợi ý theo BR-M03-C07/C08), gallery 0–8, sơ đồ 0–1, tick "Sơ đồ này cần để định hướng khi không có mạng" (chỉ khi có sơ đồ; xóa sơ đồ thì tick tự bỏ và hiện MSG-MAP-TICK-CLEARED), điểm nhấn 0–5. Bước 3 "Nhãn": nhãn nhóm, nhãn trải nghiệm; nhãn thời gian chỉ đọc, suy từ thời lượng. Bước 4 "Điểm dừng": danh sách tìm kiếm Q-04 (chỉ `HOAT_DONG`, kèm tên, mode, số điểm tham quan, tuyến khác đang dùng); thêm, bỏ, kéo-thả hoặc nút lên/xuống ([research.md](../research.md) R-21); link "Tạo điểm dừng mới" mở SCR-M03-008 và quay lại (BR-M03-T01, T02). Điểm dừng đã đóng vẫn giữ vị trí và được đánh dấu.
- "Xuất bản" → `/admin/review/ROUTE_FIRST_PUBLICATION|ROUTE_INFORMATION/:routeId`.

### SCR-M03-008 Thư viện điểm dừng

- Danh sách: trạng thái, mode, số điểm tham quan, tuyến đang dùng, Sẵn sàng/Chưa đủ (SF-M03-002-11).
- Editor: tên vi/en, mode bắt buộc chọn (không có mặc định); chọn `ONLINE_AVAILABLE` cần tick "đã khảo sát thực địa, có sóng ổn định" (BR-M03-D02); ghi chú vị trí nội bộ. Danh sách điểm tham quan theo BR-M03-E16. "Thêm điểm tham quan" bị tắt và hiện MSG-MODE-REQUIRED-FIRST cho tới khi mode đã được lưu (BR-M03-E15).
- Các nút: Xuất bản (→ review `CHECKPOINT_FIRST_PUBLICATION`/`CHECKPOINT_REVISION`), Đóng tạm, Mở lại (R), Lưu trữ (R), Hủy.

### SCR-M03-003 Điểm tham quan (QR) & Nội dung

- Thứ tự form: tên vật (vi/en), giới thiệu (vi/en), ảnh, audio/video (chỉ khi `ONLINE_AVAILABLE`), ghi chú lắp đặt (BR-M03-E15). Tiêu đề "Đang sửa: {tên}" cùng MSG-VERSION-DRAFT hoặc MSG-VERSION-PUBLISHED (BR-M03-E16).
- Upload nhiều tệp theo [media-storage-contract.md](media-storage-contract.md) §1; tick quyền **từng tệp**; chọn ngôn ngữ nói từng tệp AV (Tiếng Việt / Tiếng Anh / Không lời).
- Sau lần lưu đầu: MSG-QR-CREATED với hành động "Thêm điểm tham quan khác"; mục vừa lưu được tô sáng trong danh sách; ảnh in có ngay từ lúc này (BR-M03-E16, B02).
- "Xem trước như du khách" (§5): Should.
- Vòng đời: In lại (C-17), Thu hồi (C-16, lý do, MSG-CONFIRM-REVOKE-QR), Hủy (C-07).

### SCR-M03-004 Xem lại & Xuất bản

Hiển thị `PublicationReview`: so sánh trước/sau; tô sáng thay đổi nhạy cảm; tuyến bị ảnh hưởng cùng hậu quả ("gói tải trước của du khách cần cập nhật", "tuyến sẽ tự đóng tạm"); mục bị loại (MSG-CHECKPOINT-LEFT-OUT, MSG-QR-LEFT-OUT); dung lượng ước tính mỗi tuyến; MSG-AV-ONE-LANGUAGE (chỉ cảnh báo); MSG-REPRINT-MODE-CHANGED khi mode đổi; tick "Tôi xác nhận tuyến không có cảnh báo an toàn cần nêu" khi `noSafetyWarningConfirmationRequired`; xem trước từng điểm tham quan trong đơn vị. "Quay lại sửa" hoặc "Xuất bản" (MSG-CONFIRM-PUBLISH, một lần) → C-05 với `reviewedConcurrencyRevision`. Nếu `STALE` thì mở lại review (BR-M03-F02).

### Hộp thoại đóng / mở lại / lưu trữ (SCR-M03-001, 008)

Q-09 cung cấp: các tuyến liệt kê (MSG-CLOSE-AFFECTS-ROUTES), các tuyến sẽ tự đóng (MSG-CLOSE-ROUTE-AUTO), kết quả kiểm tra kỹ thuật khi mở lại. Lý do (đóng, lưu trữ) hoặc ghi chú an toàn (mở lại) bắt buộc, ≤ `NOTE_MAX_CHARS`. Khi C-10 trả `FAILED`: MSG-CLOSE-FAILED kèm nút "Đóng tạm các tuyến liên quan" (C-11) (BR-M03-H04). Không bao giờ báo thành công giả.

### SCR-M03-005 Báo cáo vận hành

Lọc theo tuyến (tùy chọn) và khoảng ngày (dd/mm/yyyy; mặc định 30 ngày). Một dòng ghi chú dưới tiêu đề: MSG-REPORT-UPDATED với giờ cập nhật, hoặc MSG-REPORT-NO-DATA-YET; ngay dưới là MSG-REPORT-SCOPE; dưới bảng RPT-02 là MSG-REPORT-VISIT-MEANING. Không có phiên nào → MSG-REPORT-EMPTY. Chỉ lỗi tải báo cáo mới dùng kiểu cảnh báo, với MSG-GENERIC (BR-M03-J08). Không có biểu đồ, export hay real-time. Trạng thái phiên hiện là "Hoàn thành"/"Bỏ dở"; "phiên" hiện là "Chuyến đi" (§5.4).

### SCR-M03-006 Tài khoản & Vai trò; SCR-M03-009 Nhật ký hệ thống

- 006: danh sách (email, role "Quản lý"/"Nhân viên nội dung", trạng thái "Chờ nhận lời mời"/"Đang hoạt động"/"Đã khóa"); mời; gửi lại; đổi role; khóa/mở khóa; MSG-LAST-REVIEWER.
- 009: dòng audit bằng ngôn ngữ giản dị: ai (email), khi nào, mục nào (tên), hành động (tên hiển thị), kết quả Thành công/Không thành công, lý do, dấu "tự xuất bản" (không có dòng thứ hai). Không có JSON thô.

## 4. Ảnh mã QR để in (SCR-M03-003; BR-M03-B02, B04, B05)

| Thuộc tính | Giá trị |
|---|---|
| Nội dung mã | đúng `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`; không có tham số khác |
| Định dạng | SVG và PNG; PNG ≥ `QR_PRINT_PNG_MIN_PX` px (provisional 1024) |
| Mã hóa | mức sửa lỗi `QR_PRINT_ERROR_CORRECTION` (`Q`); quiet zone `QR_PRINT_QUIET_ZONE_MODULES` (4) module |
| Chữ dưới mã | "Mã …{6 ký tự cuối}" (`QR_CODE_DISPLAY_SUFFIX_CHARS` = 6) |
| Điểm dừng `OFFLINE_REQUIRED` | thêm dòng "Khu vực không có sóng — hãy tải dữ liệu tuyến trước khi đến / No signal here — download the route data before you come" |
| Ngoài Production | thêm dấu "BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA". Hiện khi `IS_PRODUCTION_BUILD` là false ([research.md](../research.md) R-13) |
| Màn tải xuống | ghi độ rộng in tối thiểu `QR_PRINT_MIN_SIZE_CM` (3 cm); QR chưa `HOAT_DONG` → MSG-QR-PRINT-UNPUBLISHED |
| Thư viện | `qrcode` 1.5.x, lazy-load chỉ ở màn này |

## 5. Xem trước như du khách (BR-M03-F12; Should)

Render ở client từ bản nháp đã nạp: tên điểm dừng, tên vật, giới thiệu, ảnh; với `ONLINE_AVAILABLE` thì có AV của ngôn ngữ đang chọn cộng tệp "Không lời"; nút chuyển Tiếng Việt / English; nhãn cố định MSG-PREVIEW-DRAFT. Không ghi gì, không gọi `api.lookup_qr`, không đổi contract nào với M02, không bao giờ hiện cho du khách (SC-M03-032). Media nháp đọc bằng signed URL của admin ([media-storage-contract.md](media-storage-contract.md) §4).

## 6. Hình thức

Token màu, font, khoảng cách, bo góc lấy từ [design-system.md](../../../docs/design/design-system.md) qua CSS custom properties; WCAG 2.1 AA (design-system §6); icon chỉ lấy từ `assets/icons/`. Khi dựng giao diện, dùng skill `frontend-design` (CLAUDE.md). HTML mockup trong `screens/html/` chỉ là tham chiếu hình ảnh.

## 7. Truy vết test

| Kiểm thử (E2E/component) | BR / SC |
|---|---|
| Quét toàn bộ DOM của mọi màn để tìm từ cấm (danh sách "Words never shown to staff" §5.4, mã enum, `null`, `undefined`, `{`, HTTP status) | SC-M03-026, BR-M03-L10 |
| Mọi `messageKey` được render đều có trong danh mục; khóa thiếu → MSG-GENERIC | L13 |
| Không có ô nhập identifier nào | SC-M03-013 |
| "Thêm điểm tham quan" chỉ có sau khi đã lưu mode; không có QR trước lần lưu đầu | SC-M03-034 |
| Báo cáo luôn có ghi chú một dòng | SC-M03-035 |
| Ảnh in: decode PNG/SVG ra đúng link; có dấu bản thử khi không phải Production; có dòng cảnh báo offline | SC-M03-036, 037 |
| Xem trước không phát request ghi nào hay request lookup | SC-M03-032 |
| Đăng xuất từ một form có thay đổi chưa lưu → hộp thoại; sau đó vào `/admin/*` thì bị đưa về đăng nhập | SC-M03-040 |
