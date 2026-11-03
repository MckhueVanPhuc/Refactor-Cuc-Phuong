# Screen Spec: Biên tập tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-002` |
| Screen name | Biên tập tuyến |
| Module | `M03` |
| Actor | Nhân viên nội dung, Quản lý |
| Priority | Must |
| Mockup | [mockup-SCR-M03-002.html](../../html/mockup-SCR-M03-002.html) (HTML tĩnh, chỉ để xem tham khảo, không phải thiết kế chính thức; chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) và [Spec AI Integration v1.0](../../../docs/spec/spec-AI_integration.md); mockup chưa có nút dịch |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-01/02/09, BR-M03-C02 đến C17, T01 đến T09, E14, F06, F07, F10, F11, L01 đến L13; giới hạn §5.3; thông báo §5.6) và [Spec AI Integration](../../../docs/spec/spec-AI_integration.md) v1.0 cho nút dịch (BR-AI-01 đến BR-AI-12, §5.5). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Giao diện chỉ dùng tên hiển thị và thông báo từ danh mục; mã trạng thái, tên trường nội bộ và định danh không hiện trên màn hình.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Tạo tuyến mới hoặc mở một tuyến từ SCR-M03-001; quay lại từ SCR-M03-004 ("Quay lại sửa") hoặc từ SCR-M03-008 sau "Tạo điểm dừng mới".

**The user leaves when:** Chọn "Xuất bản" (mở SCR-M03-004); mở "Tạo điểm dừng mới" (SCR-M03-008, rồi quay lại); hoặc quay về SCR-M03-001. Rời trang khi còn thay đổi chưa lưu hiện MSG-UNSAVED-CHANGES với lựa chọn ở lại hoặc rời.

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M03-002.html](../../html/mockup-SCR-M03-002.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-002-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-002-02 | Screen title | Header text | "Biên tập tuyến" | Yes | Non-empty |
| 3 | E-SCR-M03-002-03 | Step navigation | Tabs/Stepper | Bốn bước: 1 Thẻ tuyến; 2 Chi tiết; 3 Nhóm đối tượng và trải nghiệm; 4 Điểm dừng | Yes | Chuyển bước không mất dữ liệu đang nhập |
| 4 | E-SCR-M03-002-04 | Missing-for-publication panel | Panel | "Còn thiếu để xuất bản": mỗi dòng nhảy tới ô cần sửa | Yes | Luôn hiển thị; cập nhật sau mỗi lần lưu; dùng MSG-MISSING-FIELD, MSG-MISSING-LANGUAGE, MSG-NO-ACTIVE-CHECKPOINT, MSG-SAFETY-CONFIRM, MSG-RIGHTS-NOT-CONFIRMED (BR-M03-L03) |
| 5 | E-SCR-M03-002-05 | Thumbnail upload | File input | Ảnh đại diện (1 ảnh) | Yes (xuất bản) | Một ảnh, tối đa 2 MB, JPEG/PNG/WebP; MSG-FILE-TOO-BIG, MSG-FILE-TYPE; cần xác nhận quyền sử dụng; trạng thái "Đang tải"/"Đã tải"/"Không tải được"; MSG-UPLOADED-NOT-SAVED cho đến khi lưu |
| 6 | E-SCR-M03-002-06 | Route name (vi/en) | Input ×2 | Tên tuyến | Yes (xuất bản) | Một dòng, tối đa 100 ký tự mỗi ngôn ngữ (`NAME_MAX_CHARS`); dài quá → MSG-LIMIT-TEXT; thiếu một ngôn ngữ → MSG-MISSING-LANGUAGE khi xuất bản |
| 7 | E-SCR-M03-002-07 | Short description (vi/en) | Input ×2 | Mô tả ngắn hiện trên thẻ tuyến M01 | Yes (xuất bản) | Một dòng, tối đa 160 ký tự; MSG-LIMIT-TEXT |
| 8 | E-SCR-M03-002-08 | Distance input | Input số | Quãng đường (km) | Yes (xuất bản) | Phải > 0 (MSG-NUMBER-POSITIVE); không lớn hơn 100 km (MSG-NUMBER-TOO-BIG); tối đa 1 chữ số sau dấu phẩy (MSG-NUMBER-DECIMALS); chặn khi lưu bản nháp (BR-M03-L01) |
| 9 | E-SCR-M03-002-09 | Duration input | Input số nguyên | Thời lượng dự kiến (phút) | Yes (xuất bản) | Phải > 0 (MSG-NUMBER-POSITIVE); không lớn hơn 1440 phút (MSG-NUMBER-TOO-BIG); chặn khi lưu |
| 10 | E-SCR-M03-002-10 | Difficulty selector | Selector | Nhẹ / Trung bình / Khó | Yes (xuất bản) | Chỉ giá trị cho phép; kết hợp mâu thuẫn với nhãn → MSG-TAG-CONFLICT khi lưu |
| 11 | E-SCR-M03-002-11 | Full description (vi/en) | Textarea ×2 | Mô tả đầy đủ | Yes (xuất bản) | Tối đa 2000 ký tự; cho phép xuống dòng; văn bản thuần; MSG-LIMIT-TEXT |
| 12 | E-SCR-M03-002-12 | Starting point (vi/en) | Textarea ×2 | Điểm xuất phát và cách đến | Yes (xuất bản) | Tối đa 500 ký tự; MSG-LIMIT-TEXT |
| 13 | E-SCR-M03-002-13 | Participation requirements (vi/en) | Textarea ×2 | Yêu cầu và điều kiện tham gia | No | Cả hai ngôn ngữ hoặc không có ngôn ngữ nào; tối đa 300 ký tự; hint: "Ai đi được và điều kiện để đi: thể lực, hướng dẫn viên, đăng ký trước, giờ hoặc khu vực giới hạn." |
| 14 | E-SCR-M03-002-14 | Preparation (vi/en) | Textarea ×2 | Cần chuẩn bị | No | Cả hai ngôn ngữ hoặc không; tối đa 500 ký tự; hint: "Vật dụng và trang phục nên mang." |
| 15 | E-SCR-M03-002-15 | Best time (vi/en) | Textarea ×2 | Thời điểm phù hợp | No | Cả hai ngôn ngữ hoặc không; tối đa 200 ký tự; hint: "Gợi ý mùa hoặc buổi trong ngày, không phải giờ được phép đi." |
| 16 | E-SCR-M03-002-16 | Safety warning (vi/en) | Textarea ×2 | Cảnh báo an toàn | No (nếu để trống, màn xem lại SCR-M03-004 đòi tick xác nhận không có cảnh báo) | Cả hai ngôn ngữ hoặc không; tối đa 500 ký tự; hint: "Rủi ro và cách phòng tránh khi tuyến vẫn mở. Nếu có đoạn không còn an toàn, hãy dùng Đóng tạm." (BR-M03-C07, C08); thiếu một bản hiện ngay dưới ô (ví dụ "Cảnh báo an toàn: còn thiếu bản tiếng Anh", MSG-MISSING-LANGUAGE) |
| 17 | E-SCR-M03-002-17 | Detail gallery upload | File input (nhiều tệp) | Ảnh chi tiết 0–8, ảnh đầu là ảnh bìa, chú thích tùy chọn vi/en | No | Tối đa 8 ảnh (MSG-COUNT-IMAGES); mỗi tệp ≤ 2 MB (MSG-FILE-TOO-BIG), JPEG/PNG/WebP (MSG-FILE-TYPE); mỗi tệp kiểm tra và tải riêng, hiện trạng thái riêng; tệp lỗi không xóa tệp đã tải; MSG-UPLOAD-SUMMARY sau khi chọn nhiều tệp; MSG-UPLOADED-NOT-SAVED; quyền sử dụng xác nhận từng tệp |
| 18 | E-SCR-M03-002-18 | Image caption (vi/en) | Input ×2 | Chú thích ảnh | No | Cả hai ngôn ngữ hoặc không; một dòng, tối đa 200 ký tự |
| 19 | E-SCR-M03-002-19 | Route map upload + caption | File input | Ảnh sơ đồ tuyến (0–1) và chú thích vi/en | No | ≤ 2 MB; chú thích cả hai ngôn ngữ hoặc không, tối đa 200 ký tự; quyền sử dụng |
| 20 | E-SCR-M03-002-20 | Offline route-map tick | Checkbox | "Sơ đồ này cần để định hướng khi không có mạng" | No | Mặc định tắt; chỉ chọn được khi tuyến có ảnh sơ đồ; gỡ ảnh khi đang chọn → tự bỏ chọn và hiện MSG-MAP-TICK-CLEARED lúc lưu; thay đổi được tô sáng ở màn xem lại |
| 21 | E-SCR-M03-002-21 | Highlights (vi/en) | List nhập | Điểm nổi bật, mỗi mục có đủ vi và en | No | Tối đa 5 mục, mỗi ngôn ngữ ≤ 80 ký tự, một dòng; một mục cần cả hai ngôn ngữ |
| 22 | E-SCR-M03-002-22 | Group tags | Multi-selector | Cá nhân/người lớn; Gia đình có trẻ nhỏ; Cần đi dễ dàng | Yes (xuất bản) | Ít nhất 1 khi xuất bản; không chọn trùng giá trị; không kết hợp mâu thuẫn với độ khó "Khó" (MSG-TAG-CONFLICT khi lưu) |
| 23 | E-SCR-M03-002-23 | Experience tags | Multi-selector | Thiên nhiên, chụp ảnh; Tìm hiểu; Khám phá | Yes (xuất bản) | Ít nhất 1 khi xuất bản; không chọn trùng giá trị |
| 24 | E-SCR-M03-002-24 | Time tag (derived) | Text (chỉ đọc) | Ngắn (≤ 90 phút) / Vừa (> 90–180) / Dài (> 180), tính từ thời lượng | Yes | Nhân viên không chọn được (BR-M03-C11, SC-M03-015) |
| 25 | E-SCR-M03-002-25 | Checkpoint picker | Searchable list | Điểm dừng Đang hoạt động trong thư viện: tên, loại kết nối (tên hiển thị), số điểm tham quan, các tuyến khác đang dùng | Yes (bước 4) | Chỉ điểm dừng đang hoạt động được thêm (BR-M03-T01) |
| 26 | E-SCR-M03-002-26 | Route checkpoint list | Ordered list (kéo thả) | Điểm dừng của tuyến theo thứ tự thăm; vị trí trong danh sách là thứ tự của tuyến | Yes (xuất bản) | Mỗi điểm dừng tối đa một lần (MSG-CHECKPOINT-DUPLICATE); tối đa 30 mục kể cả điểm đã đóng (MSG-LIMIT-CHECKPOINTS); bỏ điểm dừng khỏi bản nháp luôn được phép; cần ít nhất một điểm dừng đang hoạt động khi xuất bản (MSG-NO-ACTIVE-CHECKPOINT) |
| 27 | E-SCR-M03-002-27 | Closed checkpoint marker | Badge | Điểm dừng Tạm đóng vẫn giữ chỗ trong danh sách nhưng không thuộc hành trình | Conditional | Mở lại điểm dừng thì trở về đúng vị trí cũ (BR-M03-T02) |
| 28 | E-SCR-M03-002-28 | Action: Tạo điểm dừng mới | Link | Mở SCR-M03-008 để tạo rồi quay lại | Yes | Điểm dừng mới chỉ chọn được sau khi đã xuất bản |
| 29 | E-SCR-M03-002-29 | Action: Lưu bản nháp | Button | Lưu cả editor (mọi ngôn ngữ, danh sách ảnh với quyền sử dụng, danh sách điểm dừng) hoặc không gì cả | Yes | MSG-SAVED chỉ hiện khi toàn bộ đã lưu; chặn khi giá trị rõ ràng không hợp lệ; thiếu nội dung không chặn lưu (BR-M03-C03, F11) |
| 30 | E-SCR-M03-002-30 | Action: Xuất bản | Button | Mở SCR-M03-004 | Yes | Kiểm tra đầy đủ trước; thiếu gì thì liệt kê và không xuất bản (BR-M03-F01) |
| 31 | E-SCR-M03-002-31 | Version / history panel | Panel | Lịch sử bản đã xuất bản; nhãn bản đang xem | Conditional | Cả hai role xem được |
| 32 | E-SCR-M03-002-32 | Action: Khôi phục bản đã xuất bản trước đó | Button | Tạo bản nháp từ bản cũ; từ chối với MSG-RESTORE-BLOCKED nếu bản cũ vi phạm giới hạn hiện hành | Conditional | Chặn khi đã có bản nháp: MSG-DRAFT-EXISTS |
| 33 | E-SCR-M03-002-33 | Action: Bỏ thay đổi | Button | Bỏ bản nháp | Conditional | Bản đã xuất bản giữ nguyên |
| 34 | E-SCR-M03-002-34 | Stale banner + Tải lại | Banner + Button | MSG-STALE nêu ai sửa và lúc nào | Conditional | Nội dung đang gõ vẫn giữ trên màn hình để sao chép; không tự gộp |
| 35 | E-SCR-M03-002-35 | Unsaved-changes dialog | Dialog | MSG-UNSAVED-CHANGES, chọn ở lại hoặc rời | Conditional | Một câu và hai nút (BR-M03-L12) |
| 36 | E-SCR-M03-002-36 | Busy / permission / failure feedback | Banner | MSG-ROUTE-BUSY, MSG-NO-PERMISSION, MSG-GENERIC | Conditional | Lưu lỗi không làm mất nội dung đã gõ (BR-M03-L06) |
| 37 | E-SCR-M03-002-37 | Translate button | Button nhỏ (ký tự "→", tên truy cập "Dịch sang tiếng Anh") | Một nút cho mỗi trường song ngữ #6, #7, #11–#16, mỗi chú thích ảnh #18, chú thích sơ đồ #19 và mỗi mục điểm nổi bật #21; đặt giữa ô tiếng Việt và ô tiếng Anh | Could (MVP-Scope §3.5) | Không bấm được khi ô tiếng Việt trống/chỉ khoảng trắng, khi trường đó đang dịch, hoặc khi form chỉ đọc (BR-AI-01, BR-AI-07). Bấm thì thay ô tiếng Anh bằng bản dịch, không hỏi xác nhận (BR-AI-02); không lưu gì (BR-AI-06) |
| 38 | E-SCR-M03-002-38 | Translate status | Text dưới ô tiếng Anh | MSG-AI-TRANSLATING khi đang dịch; MSG-AI-FAILED kèm nút "Thử lại" khi lỗi | Conditional | Lỗi giữ nguyên ô tiếng Anh; thông báo mất khi bấm "Thử lại", gõ vào ô tiếng Anh hoặc bấm "→" lại (BR-AI-09) |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| New route | Form trống, panel "Còn thiếu để xuất bản" đầy đủ | Tạo tuyến mới |
| Editing draft | Form với dữ liệu bản nháp | Mở tuyến đang có bản nháp |
| Editing published | Form từ bản đã xuất bản; bản công khai giữ nguyên đến khi xuất bản | Sửa tuyến đã xuất bản (tạo/tiếp tục bản nháp) |
| Field error | Lỗi ngay dưới ô | Rời ô hoặc bấm Lưu với giá trị rõ ràng không hợp lệ |
| Upload in progress | Trạng thái từng tệp | Đang tải ảnh |
| Upload not saved | MSG-UPLOADED-NOT-SAVED | Tệp đã tải nhưng chưa lưu |
| Save success | MSG-SAVED | Toàn bộ lưu thành công |
| Stale write | MSG-STALE, nút Tải lại | Giá trị `concurrencyRevision` lỗi thời |
| Unsaved changes | MSG-UNSAVED-CHANGES | Rời trang khi còn thay đổi chưa lưu |
| Operation busy | MSG-ROUTE-BUSY | Có thao tác khác trên tuyến hoặc điểm dừng liên quan |
| Restore blocked | MSG-DRAFT-EXISTS | Khôi phục khi đang có bản nháp |
| Restore refused | MSG-RESTORE-BLOCKED | Bản cũ vi phạm giới hạn hiện hành |
| Archived | Chỉ đọc | Tuyến Đã lưu trữ |
| Permission denied | MSG-NO-PERMISSION | Không đủ quyền |
| Translating | "Đang dịch…" dưới ô tiếng Anh của trường đó; nút "→" của trường đó không bấm được | Bấm "→" |
| Translation failed | MSG-AI-FAILED kèm "Thử lại"; ô tiếng Anh giữ nguyên | Dịch vụ dịch lỗi, quá thời gian hoặc từ chối |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Ô nhập | Gõ/rời ô | Kiểm tra giá trị rõ ràng không hợp lệ (độ dài, số, chữ số thập phân, nhãn mâu thuẫn); báo ngay dưới ô | State update |
| 2 | Độ khó / nhãn | Chọn | Chặn kết hợp mâu thuẫn khi lưu; nhãn thời gian cập nhật từ thời lượng | State update |
| 3 | Tải ảnh (chọn nhiều tệp) | Chọn | Mỗi tệp kiểm tra và tải riêng, hiện trạng thái riêng; MSG-UPLOAD-SUMMARY | State update |
| 4 | Thêm điểm dừng từ danh sách chọn | Tap | Chặn trùng và vượt 30 mục khi lưu | Update list |
| 5 | Kéo thả điểm dừng | Kéo | Đổi thứ tự trong bản nháp; vị trí là thứ tự của tuyến | Update list |
| 6 | Bỏ điểm dừng | Tap | Bỏ khỏi danh sách bản nháp | Update list |
| 7 | Tạo điểm dừng mới | Tap | Mở thư viện điểm dừng | `SCR-M03-008` |
| 8 | Lưu bản nháp | Tap | Lưu toàn bộ hoặc không; MSG-SAVED khi xong | Show success |
| 9 | Xuất bản | Tap | Kiểm tra đầy đủ; đủ điều kiện thì mở màn xem lại | `SCR-M03-004` |
| 10 | Tải lại | Tap | Lấy bản mới nhất; cảnh báo nội dung chưa lưu | Reload form |
| 11 | Quay lại | Tap | Về danh sách tuyến; có thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES | `SCR-M03-001` |
| 12 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |
| 13 | "→" của một trường song ngữ | Tap | Hiện "Đang dịch…"; gửi ô tiếng Việt đi dịch; thành công thì thay ô tiếng Anh (bỏ kết quả nếu ô tiếng Việt đã đổi hoặc người dùng đã gõ vào ô tiếng Anh từ lúc bấm); lỗi thì hiện MSG-AI-FAILED kèm "Thử lại". Bản dịch dài quá giới hạn vẫn điền đủ, bộ đếm ký tự báo đỏ như khi tự gõ | State update (chưa lưu) |
| 14 | "Thử lại" | Tap | Gửi lại yêu cầu dịch của trường đó | State update |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-002-001 | Chỉ giá trị rõ ràng không hợp lệ mới chặn lưu: khoảng cách/thời lượng ≤ 0, quá giới hạn hoặc khoảng cách quá 1 chữ số thập phân, văn bản vượt giới hạn, danh sách điểm dừng vượt số lượng, tệp vượt giới hạn hoặc sai loại, nhãn mâu thuẫn, điểm dừng trùng trong một tuyến; thiếu nội dung không chặn lưu | BR-M03-L01, C03 |
| SR-SCR-M03-002-002 | Giới hạn số: quãng đường tối đa 100 km (1 chữ số thập phân), thời lượng tối đa 1440 phút; vi phạm dùng MSG-NUMBER-POSITIVE, MSG-NUMBER-TOO-BIG, MSG-NUMBER-DECIMALS | §5.3, BR-M03-L01 |
| SR-SCR-M03-002-003 | Danh sách điểm dừng tối đa 30 mục (kể cả điểm đã đóng); thêm quá chặn bằng MSG-LIMIT-CHECKPOINTS; một điểm dừng chỉ xuất hiện một lần (MSG-CHECKPOINT-DUPLICATE); luôn được bỏ khỏi bản nháp | BR-M03-T09 |
| SR-SCR-M03-002-004 | Mỗi nhóm nhãn là một tập giá trị không trùng; nhóm đối tượng và trải nghiệm đều chọn được nhiều giá trị; không thêm nhóm nhãn mới | BR-M03-C12 |
| SR-SCR-M03-002-005 | Nhãn thời gian chỉ đọc, tính từ thời lượng (Ngắn ≤ 90, Vừa > 90–180, Dài > 180 phút) | BR-M03-C11 |
| SR-SCR-M03-002-006 | Trường song ngữ tùy chọn phải đủ hai ngôn ngữ hoặc để trống cả hai; một ngôn ngữ vẫn lưu được bản nháp nhưng chặn xuất bản, báo ngay dưới ô | BR-M03-C06 |
| SR-SCR-M03-002-007 | Chỉ điểm dừng Đang hoạt động được thêm vào danh sách; điểm dừng Tạm đóng giữ vị trí nhưng không thuộc hành trình; thứ tự thuộc về tuyến | BR-M03-T01, T02, C17 |
| SR-SCR-M03-002-008 | Thêm, bỏ, đổi thứ tự điểm dừng chỉ là sửa bản nháp và có hiệu lực khi xuất bản; xuất bản tuyến không bao giờ xuất bản điểm dừng | BR-M03-T03, C17 |
| SR-SCR-M03-002-009 | Một nút "Lưu bản nháp" lưu cả form nguyên tử; tệp đã tải chỉ vào bản nháp khi lưu; không tự lưu | BR-M03-F11, E14 |
| SR-SCR-M03-002-010 | Tick sơ đồ offline chỉ khi có ảnh sơ đồ; gỡ ảnh thì tự bỏ tick và báo MSG-MAP-TICK-CLEARED | BR-M03-C16 |
| SR-SCR-M03-002-011 | Mỗi tệp ảnh cần xác nhận quyền sử dụng riêng trước khi xuất bản | BR-M03-C14, E14 |
| SR-SCR-M03-002-012 | Dưới mỗi ô chỉ hiện đúng hint cố định của §5.5; không có hint khác | BR-M03-L12 |
| SR-SCR-M03-002-013 | Lưu hoặc xuất bản dữ liệu lỗi thời bị từ chối bằng MSG-STALE; không tự gộp; nội dung đang gõ giữ nguyên | BR-M03-F06, L05, SC-M03-005 |
| SR-SCR-M03-002-014 | Quản trị viên nào cũng xuất bản được bản nháp của mình, chỉ qua màn xem lại; không có hàng đợi duyệt hay trạng thái chờ duyệt | BR-M03-A05, F01 |
| SR-SCR-M03-002-015 | Thay đổi thông tin tuyến (không phải danh sách, thứ tự, sơ đồ offline) không tạo phiên bản hành trình mới | BR-M03-C15, G05 |
| SR-SCR-M03-002-016 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |
| SR-SCR-M03-002-017 | Chỉ bấm "→" mới dịch; gõ, rời ô, mở form, xóa ô tiếng Anh hay đổi ô tiếng Việt không tự dịch và không đổi ô tiếng Anh. Ô tiếng Anh luôn sửa được. Bản dịch chỉ điền form; lưu, kiểm tra và xuất bản giữ nguyên quy tắc M03; không có hộp xác nhận mới | BR-AI-01 đến BR-AI-06, BR-M03-F11, L12 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-001 | Thông tin tuyến, ảnh, nhãn, nhãn thời gian dẫn xuất, tick sơ đồ offline, danh sách và thứ tự điểm dừng |
| FR-M03-005 | Kiểm tra hai mức, lỗi tại ô, panel "Còn thiếu để xuất bản" |
| FR-M03-006 | Xuất bản đi qua màn xem lại; quyền kiểm tra phía server |
| FR-M03-007 | Một bản nháp, lưu một lần, từ chối stale write, khôi phục, bỏ thay đổi |
| FR-M03-019 | Tiếng Việt dễ hiểu, tên hiển thị, thông báo từ danh mục |
| FR-AI-001 đến FR-AI-004 | Nút "→" từng trường song ngữ, điền ô tiếng Anh không lưu, ô tiếng Anh luôn sửa được, lỗi kèm "Thử lại" |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access (kể cả cách sắp xếp thay thế kéo thả), visible focus, semantic labels, lỗi liên kết với ô nhập, trạng thái không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-002-001 | Cách sắp xếp bằng bàn phím thay cho kéo thả | No | Resolved | Ngoài kéo thả, mỗi dòng có nút "Lên" / "Xuống" dùng được bằng bàn phím; hành vi giống kéo thả. |
| OQ-SCR-M03-002-002 | Nhãn hiển thị của các ô và bước chính xác | No | Resolved | Nhãn bước: "1. Thẻ tuyến", "2. Chi tiết", "3. Nhóm khách và trải nghiệm", "4. Điểm dừng". Nhãn ô: "Ảnh đại diện", "Tên tuyến", "Mô tả ngắn", "Quãng đường (km)", "Thời lượng dự kiến (phút)", "Độ khó", "Mô tả đầy đủ", "Điểm xuất phát và cách đến", "Yêu cầu và điều kiện tham gia", "Cần chuẩn bị", "Thời điểm phù hợp", "Cảnh báo an toàn", "Ảnh chi tiết", "Sơ đồ tuyến", "Điểm nổi bật", "Nhóm khách", "Trải nghiệm", "Nhãn thời gian", "Danh sách điểm dừng của tuyến"; ô song ngữ thêm "(tiếng Việt)" / "(tiếng Anh)". Các nhãn này là `{Tên ô}` trong thông báo. |
| OQ-SCR-M03-002-003 | Cách hiển thị MSG-LIMIT-TEXT khi cần số ký tự hiện có và tên ô | No | Resolved | Điền placeholder theo BR-M03-L13: tên ô như nhãn trên giao diện, số kèm đơn vị. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
