# Screen Spec: Điểm tham quan (QR) & Nội dung

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-003` |
| Screen name | Điểm tham quan (QR) & Nội dung |
| Module | `M03` |
| Actor | Nhân viên nội dung, Quản lý |
| Priority | Must; xem trước như du khách Should |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-03, BR-M03-B02 đến B05, E01 đến E17, F11, F12; giới hạn §5.3; thông báo §5.6). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. "Điểm tham quan" là tên hiển thị của QR object; mã nội bộ không hiện trên màn hình, ngoại lệ duy nhất là 6 ký tự cuối của mã QR (BR-M03-E16).

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Từ SCR-M03-008, chọn "Thêm điểm tham quan" (mở form trống; chỉ khi điểm dừng đã lưu loại kết nối) hoặc mở một điểm tham quan đã có.

**The user leaves when:** Quay về điểm dừng (SCR-M03-008); chọn "Xuất bản" (mở SCR-M03-004); sau khi lưu lần đầu, thêm điểm tham quan khác (form trống mới).

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-003-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-003-02 | Editor heading | Header text | "Đang sửa: {tên}" (hoặc "Điểm tham quan chưa đặt tên {số}" khi chưa có tên, đánh số theo thứ tự tạo trong điểm dừng) | Yes | Nêu đúng điểm tham quan đang sửa (BR-M03-E16) |
| 3 | E-SCR-M03-003-03 | Version label | Text | MSG-VERSION-DRAFT ("Bản nháp — du khách chưa thấy.") hoặc MSG-VERSION-PUBLISHED ("Đang hiển thị cho du khách.") | Yes | Luôn nêu bản nào đang trên màn hình |
| 4 | E-SCR-M03-003-04 | Status and readiness | Text | Trạng thái (Nháp / Đang hoạt động / Đã thu hồi) và "Sẵn sàng" hoặc "Chưa đủ: {điều còn thiếu}" | Yes | Tên hiển thị §5.4; sẵn sàng khi đủ tên, giới thiệu hai ngôn ngữ, media trong giới hạn và đúng loại kết nối, đã xác nhận quyền, mọi audio/video đã chọn ngôn ngữ nói (BR-M03-E05) |
| 5 | E-SCR-M03-003-05 | Code suffix | Text | "Mã …{6 ký tự}" (6 ký tự cuối của mã QR) | Conditional | Hiện sau lần lưu đầu; không hiện mã đầy đủ hay định danh nào khác |
| 6 | E-SCR-M03-003-06 | Object name (vi/en) | Input ×2 | Tên đối tượng | Yes (xuất bản) | Một dòng, tối đa 100 ký tự mỗi ngôn ngữ; MSG-LIMIT-TEXT; thiếu một ngôn ngữ → MSG-MISSING-LANGUAGE khi xuất bản |
| 7 | E-SCR-M03-003-07 | Introduction (vi/en) | Textarea ×2 | Giới thiệu hiện cho du khách | Yes (xuất bản) | 30 đến 2000 ký tự mỗi ngôn ngữ sau khi cắt khoảng trắng đầu/cuối; cho phép xuống dòng; MSG-LIMIT-TEXT khi vượt tối đa |
| 8 | E-SCR-M03-003-08 | Image upload | File input (nhiều tệp) | Ảnh của điểm tham quan | No | Tối đa 5 ảnh (MSG-COUNT-IMAGES), mỗi ảnh ≤ 2 MB (MSG-FILE-TOO-BIG), JPEG/PNG/WebP (MSG-FILE-TYPE); xác nhận quyền sử dụng từng ảnh |
| 9 | E-SCR-M03-003-09 | Audio/video upload | File input (nhiều tệp) | Âm thanh (MP3/M4A, ≤ 5 MB) và video (MP4, ≤ 30 MB), tối đa 3 tệp âm thanh/video tổng cộng | Conditional | Chỉ hiện khi điểm dừng "Dùng được khi có mạng"; MSG-COUNT-AV, MSG-FILE-TOO-BIG, MSG-FILE-TYPE; điểm dừng "Cần tải trước" từ chối bằng MSG-AV-OFFLINE (BR-M03-E04) |
| 10 | E-SCR-M03-003-10 | Offline-checkpoint media hint | Hint | "Điểm dừng cần tải trước chỉ nhận chữ và ảnh." | Conditional | Hiện thay vùng audio/video khi điểm dừng "Cần tải trước" (§5.5) |
| 11 | E-SCR-M03-003-11 | Per-file state | Text | "Đang tải" / "Đã tải" / "Không tải được" kèm lý do từ danh mục | Conditional | Mỗi tệp kiểm tra và tải riêng; tệp lỗi không xóa tệp đã tải; sau khi chọn nhiều tệp hiện MSG-UPLOAD-SUMMARY (BR-M03-E14) |
| 12 | E-SCR-M03-003-12 | Upload-not-saved note | Text | MSG-UPLOADED-NOT-SAVED ("Đã tải lên — chưa lưu vào bản nháp.") | Conditional | Tệp chỉ vào bản nháp khi bấm Lưu bản nháp |
| 13 | E-SCR-M03-003-13 | Usage-rights tick (per file) | Checkbox ×N | Xác nhận quyền sử dụng từng tệp | Yes (xuất bản) | Không có một tick cho nhiều tệp; thiếu → MSG-RIGHTS-NOT-CONFIRMED khi xuất bản |
| 14 | E-SCR-M03-003-14 | Spoken-language choice (per audio/video) | Selector ×N | Tiếng Việt / Tiếng Anh / Không lời | Conditional (mỗi tệp âm thanh/video) | Bắt buộc để điểm tham quan sẵn sàng; thiếu → MSG-AV-LANGUAGE-MISSING; ảnh không có ô này |
| 15 | E-SCR-M03-003-15 | Installation note | Textarea | Ghi chú lắp đặt (nội bộ, không bao giờ hiện cho du khách) | No | Tối đa 300 ký tự (`NOTE_MAX_CHARS`) |
| 16 | E-SCR-M03-003-16 | Action: Lưu bản nháp | Button | Lưu cả form: hai ngôn ngữ, danh sách media thứ tự kèm tick quyền, ghi chú | Yes | Lần lưu đầu tạo điểm tham quan và mã QR; vô hiệu khi form còn trống; MSG-SAVED chỉ khi toàn bộ đã lưu; thêm vượt 20 điểm tham quan chưa thu hồi trong điểm dừng → chặn bằng MSG-LIMIT-QR |
| 17 | E-SCR-M03-003-17 | First-save message + action | Toast + Button | MSG-QR-CREATED ("Đã thêm điểm tham quan "{tên}"."), nút "Thêm điểm tham quan khác" | Conditional | Hiện sau lần lưu đầu; điểm vừa lưu được tô sáng trong danh sách |
| 18 | E-SCR-M03-003-18 | Action: Xem trước như du khách | Button | Xem bản nháp như du khách: tên điểm dừng, tên đối tượng, giới thiệu, ảnh, audio/video theo ngôn ngữ cộng tệp không lời (điểm dừng có mạng) | Yes (Should) | Có chuyển Tiếng Việt/Tiếng Anh và nhãn MSG-PREVIEW-DRAFT; không ghi gì, không dùng tra cứu live, không hiện cho du khách (BR-M03-F12) |
| 19 | E-SCR-M03-003-19 | Code image download | Buttons | Tải ảnh mã QR dạng SVG và PNG (≥ 1024 px, mức sửa lỗi Q, vùng trống 4 module) | Conditional | Tải được từ lần lưu đầu; màn hình nêu mã in phải rộng ít nhất 3 cm (BR-M03-B05) |
| 20 | E-SCR-M03-003-20 | Unpublished code warning | Text | MSG-QR-PRINT-UNPUBLISHED | Conditional | Hiện khi tải ảnh mã của điểm tham quan chưa xuất bản |
| 21 | E-SCR-M03-003-21 | Print-image notes | Text | Ảnh mã có dưới mã "Mã …{6 ký tự}"; với điểm dừng "Cần tải trước" có dòng "Khu vực không có sóng — hãy tải dữ liệu tuyến trước khi đến / No signal here — download the route data before you come"; ảnh tạo ngoài Production có "BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA" | Conditional | Theo BR-M03-B05; mã chứa liên kết công khai `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}` và không gì khác |
| 22 | E-SCR-M03-003-22 | Action: In lại | Button | In lại mã bị hỏng/phai | Conditional | Cả hai role; giữ nguyên mã và nội dung, chỉ ghi nhật ký (BR-M03-E07) |
| 23 | E-SCR-M03-003-23 | Action: Thu hồi mã QR | Button + dialog | Thu hồi điểm tham quan đang hoạt động; dialog dùng MSG-CONFIRM-REVOKE-QR: "Thu hồi mã QR của \"{tên}\": người quét mã này sẽ thấy mã không hợp lệ; gói tải trước của du khách ở các tuyến liên quan cần cập nhật." | Conditional | Cả hai role; lý do bắt buộc, tối đa 300 ký tự; chặn mã QR cuối của điểm dừng đang hoạt động bằng MSG-LAST-QR |
| 24 | E-SCR-M03-003-24 | Action: Hủy | Button + dialog | Hủy điểm tham quan chưa từng xuất bản; dialog dùng MSG-CONFIRM-DISCARD-QR: "Hủy điểm tham quan \"{tên}\": mã QR của nó sẽ không bao giờ được dùng lại." | Conditional | Cả hai role; lý do tùy chọn (tối đa 300 ký tự); điểm tham quan thành Đã thu hồi, mã không bao giờ dùng lại |
| 25 | E-SCR-M03-003-25 | Action: Xuất bản | Button | Mở SCR-M03-004 cho đơn vị "Điểm tham quan (một mã QR)" | Yes | Kiểm tra sẵn sàng trước; thiếu thì liệt kê |
| 26 | E-SCR-M03-003-26 | Version / history panel | Panel | Lịch sử bản đã xuất bản | Conditional | Cả hai role xem được |
| 27 | E-SCR-M03-003-27 | Action: Khôi phục bản đã xuất bản trước đó | Button | Tạo bản nháp từ bản cũ | Conditional | Chặn khi đã có bản nháp: MSG-DRAFT-EXISTS |
| 28 | E-SCR-M03-003-28 | Action: Bỏ thay đổi | Button | Bỏ bản nháp đang chờ | Conditional | Bản đã xuất bản giữ nguyên |
| 29 | E-SCR-M03-003-29 | Stale banner + Tải lại | Banner + Button | MSG-STALE | Conditional | Nội dung đang gõ và tệp đã tải vẫn giữ trên màn hình |
| 30 | E-SCR-M03-003-30 | Unsaved-changes dialog | Dialog | MSG-UNSAVED-CHANGES | Conditional | Một câu và hai nút |
| 31 | E-SCR-M03-003-31 | Busy / permission / failure feedback | Banner | MSG-ROUTE-BUSY, MSG-NO-PERMISSION, MSG-GENERIC | Conditional | Lưu lỗi không làm mất nội dung hoặc tệp đã tải |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| New (empty form) | Form trống, Lưu bản nháp vô hiệu | Chọn "Thêm điểm tham quan" |
| Mode missing | MSG-MODE-REQUIRED-FIRST (hiện ở SCR-M03-008, không mở form) | Điểm dừng chưa lưu loại kết nối |
| Draft saved | MSG-SAVED, MSG-QR-CREATED lần đầu, mã và ảnh mã khả dụng | Lưu thành công |
| Showing draft | MSG-VERSION-DRAFT | Đang xem bản nháp |
| Showing published | MSG-VERSION-PUBLISHED | Đang xem bản đã xuất bản |
| Not ready | "Chưa đủ: …" | Thiếu nội dung/quyền/ngôn ngữ nói |
| Ready | "Sẵn sàng" | Đủ điều kiện |
| Uploading | Trạng thái từng tệp | Đang tải tệp |
| Upload failed | "Không tải được" + lý do; tệp đã tải vẫn giữ | Một tệp lỗi |
| QR limit reached | MSG-LIMIT-QR | Điểm dừng đã có 20 điểm tham quan chưa thu hồi |
| Offline checkpoint | Không có ô audio/video; hint chữ và ảnh | Điểm dừng "Cần tải trước" |
| Stale write | MSG-STALE | `concurrencyRevision` lỗi thời |
| Revoke blocked | MSG-LAST-QR | Mã QR cuối của điểm dừng đang hoạt động |
| Preview | Bản xem trước với MSG-PREVIEW-DRAFT | Chọn xem trước |
| Revoked | Chỉ đọc | Điểm tham quan Đã thu hồi |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Ô nhập | Gõ/rời ô | Kiểm tra độ dài; báo dưới ô | State update |
| 2 | Chọn tệp (nhiều tệp) | Chọn | Kiểm tra từng tệp (loại, kích thước, số lượng, loại kết nối); MSG-UPLOAD-SUMMARY | State update |
| 3 | Lưu bản nháp | Tap | Lưu nguyên tử; lần đầu tạo mã QR và hiện MSG-QR-CREATED | Show success |
| 4 | Thêm điểm tham quan khác | Tap | Mở form trống mới (kiểm tra giới hạn 20) | `SCR-M03-003` (new) |
| 5 | Xem trước như du khách | Tap | Hiện bản xem trước hai ngôn ngữ | Preview |
| 6 | Tải ảnh mã QR | Tap | Tạo SVG/PNG theo cài đặt in; cảnh báo nếu chưa xuất bản | Download |
| 7 | In lại | Tap | Ghi nhật ký; mã không đổi | Audit only |
| 8 | Thu hồi mã QR | Xác nhận | Điểm tham quan Đã thu hồi; tạo phiên bản hành trình mới cho các tuyến liên quan; chặn nếu là mã cuối | State update |
| 9 | Hủy | Xác nhận | Điểm tham quan chưa xuất bản thành Đã thu hồi | State update |
| 10 | Xuất bản | Tap | Kiểm tra sẵn sàng; mở màn xem lại | `SCR-M03-004` |
| 11 | Quay lại | Tap | Về điểm dừng; có thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES | `SCR-M03-008` |
| 12 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-003-001 | Điểm tham quan chỉ thêm được sau khi điểm dừng đã lưu loại kết nối; mã QR và bản nháp đầu được tạo cùng lúc ở lần "Lưu bản nháp" đầu; trước đó không có định danh nào | BR-M03-E15, SC-M03-034 |
| SR-SCR-M03-003-002 | Mỗi điểm dừng có tối đa 20 điểm tham quan chưa thu hồi; thêm quá bị chặn bằng MSG-LIMIT-QR | BR-M03-E02, L01, §5.3 `CHECKPOINT_QR_MAX_ITEMS` |
| SR-SCR-M03-003-003 | Form chỉ hiện đầu vào mà loại kết nối của điểm dừng cho phép: "Cần tải trước" chỉ chữ và ảnh; "Dùng được khi có mạng" thêm âm thanh và video | BR-M03-D02, E02, E04, SC-M03-025 |
| SR-SCR-M03-003-004 | Tên đối tượng ≤ 100 ký tự; giới thiệu 30 đến 2000 ký tự mỗi ngôn ngữ; ảnh ≤ 5, âm thanh/video ≤ 3 tệp tổng cộng; ảnh ≤ 2 MB, âm thanh ≤ 5 MB, video ≤ 30 MB | BR-M03-E02, E03, E04, §5.3 |
| SR-SCR-M03-003-005 | Mỗi tệp âm thanh/video bắt buộc có ngôn ngữ nói (Tiếng Việt, Tiếng Anh, Không lời); thiếu thì chưa sẵn sàng | BR-M03-E17, SC-M03-039 |
| SR-SCR-M03-003-006 | Một lựa chọn nhiều tệp: mỗi tệp được kiểm tra và tải riêng; tệp lỗi không xóa tệp đã tải; quyền sử dụng xác nhận từng tệp | BR-M03-E14 |
| SR-SCR-M03-003-007 | Một "Lưu bản nháp" lưu cả form nguyên tử hoặc không gì cả; tệp đã tải chỉ thuộc bản nháp khi lưu | BR-M03-F11, SC-M03-033 |
| SR-SCR-M03-003-008 | Xem trước là bản dựng của M03 từ bản nháp: không ghi gì, không tra cứu live, không hiện cho du khách và luôn có nhãn MSG-PREVIEW-DRAFT | BR-M03-F12, SC-M03-032 |
| SR-SCR-M03-003-009 | Có thể tải ảnh mã bất cứ lúc nào; điểm tham quan chưa xuất bản kèm cảnh báo MSG-QR-PRINT-UNPUBLISHED | BR-M03-B02 |
| SR-SCR-M03-003-010 | Ảnh mã theo cài đặt cố định; điểm dừng "Cần tải trước" có dòng cảnh báo tải dữ liệu; ảnh ngoài Production có dấu bản thử | BR-M03-B05, SC-M03-037 |
| SR-SCR-M03-003-011 | Mã QR mã hóa duy nhất liên kết công khai và không đổi khi in lại | BR-M03-B04, E07, SC-M03-036 |
| SR-SCR-M03-003-012 | Không thu hồi được mã QR cuối cùng của điểm dừng đang hoạt động; điểm dừng đang hoạt động luôn còn ít nhất một điểm tham quan hoạt động | BR-M03-E09, E11, SC-M03-004 |
| SR-SCR-M03-003-013 | Điểm tham quan không chuyển sang điểm dừng khác; muốn chuyển thì tạo mới và thu hồi cũ | BR-M03-E12 |
| SR-SCR-M03-003-014 | Sửa điểm tham quan đã xuất bản tạo bản nháp; bản công khai giữ đến khi xuất bản; điểm dừng "Cần tải trước" đang hoạt động tạo phiên bản hành trình mới khi xuất bản | BR-M03-E06, G04 |
| SR-SCR-M03-003-015 | Điểm tham quan thêm vào điểm dừng đã hoạt động được xuất bản riêng từng cái; không xuất bản hàng loạt | BR-M03-E13 |
| SR-SCR-M03-003-016 | Nhận diện điểm tham quan bằng tên, trạng thái, sẵn sàng và 6 ký tự cuối mã; không hiện định danh khác | BR-M03-E16, L10 |
| SR-SCR-M03-003-017 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-003 | Mã QR, liên kết công khai, ảnh in, in lại, thu hồi |
| FR-M03-004 | Nội dung song ngữ từng mã, media, upload nhiều tệp, quyền sử dụng, ngôn ngữ nói |
| FR-M03-005 | Kiểm tra hai mức, lỗi tại ô, "Sẵn sàng"/"Chưa đủ" |
| FR-M03-007 | Một bản nháp, lưu một lần, stale write, khôi phục |
| FR-M03-011 | Thu hồi và in lại mã QR |
| FR-M03-018 | Nhật ký các thao tác thu hồi, in lại, hủy |
| FR-M03-019 | Tiếng Việt dễ hiểu, thông báo từ danh mục |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lỗi liên kết với ô nhập, trạng thái từng tệp và trạng thái Sẵn sàng/Chưa đủ không chỉ biểu đạt bằng màu, focus trong dialog và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-003-002 | Thứ tự hiển thị các tệp media trong form | No | Resolved | Media theo thứ tự đã lưu; mỗi dòng có nút "Lên" / "Xuống" để đổi thứ tự trong bản nháp. |
| OQ-SCR-M03-003-003 | Cách trình bày bản xem trước (cửa sổ riêng hay panel) | No | Resolved | Panel bên phải chiếm nửa màn hình, có nút chuyển "Tiếng Việt" / "Tiếng Anh" và nhãn MSG-PREVIEW-DRAFT ở đầu panel. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
