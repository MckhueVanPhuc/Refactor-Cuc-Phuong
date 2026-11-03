# Screen Spec: Thư viện điểm dừng

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-008` |
| Screen name | Thư viện điểm dừng |
| Module | `M03` |
| Actor | Nhân viên nội dung, Quản lý |
| Priority | Must |
| Mockup | [mockup-SCR-M03-008.html](../../html/mockup-SCR-M03-008.html) (HTML tĩnh, chỉ để xem tham khảo, không phải thiết kế chính thức; chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) và [Spec AI Integration v1.0](../../../docs/spec/spec-AI_integration.md); mockup chưa có nút dịch |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-03/04, BR-M03-D01 đến D12, E15, E16, H01, H02, H04 đến H06, X01 đến X07, F11; giới hạn §5.3; thông báo §5.6) và [Spec AI Integration](../../../docs/spec/spec-AI_integration.md) v1.0 cho nút dịch (BR-AI-01 đến BR-AI-12, §5.5). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Điểm dừng là khu vực thực tế trong thư viện dùng chung, không thuộc tuyến nào; nhiều tuyến có thể liệt kê cùng một điểm dừng, nên mọi hộp thoại và màn xem lại đều nêu các tuyến bị ảnh hưởng.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Từ menu M03; hoặc từ "Tạo điểm dừng mới" trong SCR-M03-002; hoặc quay về từ SCR-M03-003/004.

**The user leaves when:** "Thêm điểm tham quan" hoặc mở một điểm tham quan (SCR-M03-003); "Xuất bản" (SCR-M03-004); quay lại tuyến (SCR-M03-002) nếu đến từ đó; hoặc về SCR-M03-001.

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M03-008.html](../../html/mockup-SCR-M03-008.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-008-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-008-02 | Screen title | Header text | "Thư viện điểm dừng" | Yes | Non-empty |
| 3 | E-SCR-M03-008-03 | Checkpoint search/filter | Input + Selector | Tìm theo tên; lọc theo trạng thái | No | Chỉ tên hiển thị §5.4 |
| 4 | E-SCR-M03-008-04 | Checkpoint list | Table | Mỗi điểm dừng: tên, trạng thái (Nháp / Đang hoạt động / Tạm đóng / Đã lưu trữ), loại kết nối ("Cần tải trước" / "Dùng được khi có mạng"), số điểm tham quan, các tuyến đang dùng | Yes | Không hiện định danh nội bộ |
| 5 | E-SCR-M03-008-05 | Action: Tạo điểm dừng | Button | Tạo điểm dừng mới | Yes | Mã điểm dừng do hệ thống sinh |
| 6 | E-SCR-M03-008-06 | Checkpoint name (vi/en) | Input ×2 | Tên điểm dừng | Yes (xuất bản) | Một dòng, tối đa 100 ký tự mỗi ngôn ngữ; MSG-LIMIT-TEXT; tên tiếng Việt không trùng điểm dừng chưa lưu trữ khác (không phân biệt hoa thường và khoảng trắng hai đầu), so với cả tên bản nháp lẫn tên đã xuất bản, trùng thì chặn lưu bằng MSG-CHECKPOINT-NAME-TAKEN |
| 7 | E-SCR-M03-008-07 | Connectivity mode selector | Selector | "Cần tải trước" / "Dùng được khi có mạng" | Yes | Không có mặc định, phải chọn rõ; đổi từ "Dùng được khi có mạng" sang "Cần tải trước" bị chặn khi điểm tham quan nào (đã xuất bản hoặc bản nháp) còn âm thanh/video: MSG-MODE-HAS-AV; chiều ngược lại luôn được phép (BR-M03-D02) |
| 8 | E-SCR-M03-008-08 | Field-verification tick | Checkbox | "Đã khảo sát thực địa, có sóng ổn định" | Conditional | Bắt buộc tick để chọn "Dùng được khi có mạng"; hệ thống ghi ai xác nhận và lúc nào; đổi khỏi chế độ này thì xóa xác nhận; thiếu → MSG-ONLINE-NOT-VERIFIED khi xuất bản |
| 9 | E-SCR-M03-008-09 | Location note | Textarea | Ghi chú vị trí nội bộ | No | Tối đa 300 ký tự; không bao giờ hiện cho du khách; lưu cùng form, không cần xuất bản, không tạo phiên bản hành trình |
| 10 | E-SCR-M03-008-10 | Visit point list | Table | Mỗi điểm tham quan: tên (hoặc "Điểm tham quan chưa đặt tên {số}"), trạng thái (Nháp / Đang hoạt động / Đã thu hồi), "Sẵn sàng" hoặc "Chưa đủ: …", "Mã …{6 ký tự}" | Yes (khi mở một điểm dừng) | Điểm vừa lưu được tô sáng (BR-M03-E16) |
| 11 | E-SCR-M03-008-11 | Action: Thêm điểm tham quan | Button | Mở form trống ở SCR-M03-003 | Yes | Chỉ sau khi điểm dừng đã lưu loại kết nối; chưa thì hiện MSG-MODE-REQUIRED-FIRST; đã đủ 20 điểm tham quan chưa thu hồi thì MSG-LIMIT-QR (BR-M03-E15, E02) |
| 12 | E-SCR-M03-008-12 | Action: Lưu bản nháp | Button | Lưu cả form điểm dừng (hai ngôn ngữ, loại kết nối và tick khảo sát, ghi chú vị trí) nguyên tử | Yes | MSG-SAVED chỉ khi toàn bộ đã lưu; thiếu nội dung không chặn lưu; giá trị rõ ràng không hợp lệ chặn lưu (BR-M03-F11, L01) |
| 13 | E-SCR-M03-008-13 | Action: Xuất bản | Button | Mở SCR-M03-004 cho đơn vị điểm dừng | Yes | Lần đầu cần tên hai ngôn ngữ, loại kết nối (kèm xác nhận khảo sát nếu cần), ít nhất một điểm tham quan sẵn sàng, và với "Cần tải trước" mọi ảnh của điểm tham quan sẵn sàng đã được lưu và đọc được (MSG-IMAGE-NOT-READABLE) |
| 14 | E-SCR-M03-008-14 | Routes-using panel | List | Các tuyến liệt kê điểm dừng này | Conditional | Dùng cho xác định tuyến bị ảnh hưởng |
| 15 | E-SCR-M03-008-15 | Action: Đóng tạm | Button | Đóng điểm dừng đang hoạt động | Conditional | Cả hai role; lý do bắt buộc ≤ 300 ký tự; không qua màn xem lại |
| 16 | E-SCR-M03-008-16 | Close dialog | Dialog | MSG-CLOSE-AFFECTS-ROUTES ("Điểm dừng này có trong {số} tuyến: {danh sách}.") và MSG-CLOSE-ROUTE-AUTO ("Các tuyến sau sẽ tự đóng tạm vì hết điểm dừng hoạt động: {danh sách}."); không tuyến nào liệt kê thì MSG-CLOSE-NO-ROUTES ("Điểm dừng này chưa có trong tuyến nào. Người quét mã QR tại đây sẽ thấy điểm dừng đang tạm đóng.") | Conditional | Nêu mọi tuyến liệt kê điểm dừng và tuyến sẽ tự đóng; ô lý do |
| 17 | E-SCR-M03-008-17 | Close failure message + action | Banner + Button | MSG-CLOSE-FAILED và nút "Đóng tạm các tuyến liên quan" | Conditional | Không xây được snapshot thì không đổi gì, không báo thành công giả; nút đóng trực tiếp các tuyến liệt kê điểm dừng, còn điểm dừng vẫn hoạt động |
| 18 | E-SCR-M03-008-18 | Action: Mở lại | Button + dialog | Mở lại điểm dừng Tạm đóng; dialog dùng MSG-CONFIRM-REOPEN-CHECKPOINT: "Mở lại điểm dừng \"{tên}\" sẽ đưa điểm dừng trở lại các tuyến: {danh sách}; gói tải trước của du khách ở các tuyến đó cần cập nhật." | Conditional | Chỉ Quản lý; ghi chú xác nhận an toàn bắt buộc ≤ 300 ký tự; kiểm tra: còn ít nhất một điểm tham quan hoạt động, tên và nội dung đủ hai ngôn ngữ, xác nhận khảo sát còn hiệu lực với chế độ có mạng, ảnh của chế độ "Cần tải trước" đã lưu, không tuyến nào vượt trần dung lượng; không đạt → MSG-REOPEN-BLOCKED |
| 19 | E-SCR-M03-008-19 | Action: Lưu trữ | Button + dialog | Lưu trữ điểm dừng; dialog dùng MSG-CONFIRM-ARCHIVE-CHECKPOINT: "Lưu trữ điểm dừng \"{tên}\" không thể hoàn tác; các điểm tham quan của điểm dừng này sẽ bị thu hồi." | Conditional | Chỉ Quản lý; chỉ khi Tạm đóng; không tuyến chưa lưu trữ nào liệt kê (kể cả trong bản nháp) nếu không thì MSG-CHECKPOINT-IN-USE nêu tuyến; không thể hoàn tác; điểm tham quan thành Đã thu hồi; lý do bắt buộc |
| 20 | E-SCR-M03-008-20 | Action: Hủy | Button + dialog | Hủy điểm dừng chưa từng xuất bản; dialog dùng MSG-CONFIRM-DISCARD-CHECKPOINT: "Hủy điểm dừng \"{tên}\": điểm dừng chưa từng xuất bản và các điểm tham quan nháp của nó sẽ không dùng được nữa." | Conditional | Cả hai role; lý do bắt buộc; điểm dừng thành Đã lưu trữ, điểm tham quan Nháp thành Đã thu hồi |
| 21 | E-SCR-M03-008-21 | Version / history panel | Panel | Lịch sử bản đã xuất bản của điểm dừng | Conditional | Cả hai role xem được |
| 22 | E-SCR-M03-008-22 | Action: Khôi phục bản đã xuất bản trước đó | Button | Tạo bản nháp từ bản cũ; từ chối với MSG-RESTORE-BLOCKED nếu bản cũ vi phạm giới hạn hiện hành | Conditional | Chặn khi đã có bản nháp: MSG-DRAFT-EXISTS |
| 23 | E-SCR-M03-008-23 | Action: Bỏ thay đổi | Button | Bỏ bản nháp đang chờ | Conditional | Bản đã xuất bản giữ nguyên |
| 24 | E-SCR-M03-008-24 | Stale banner + Tải lại | Banner + Button | MSG-STALE | Conditional | Nội dung đang gõ vẫn giữ |
| 25 | E-SCR-M03-008-25 | Unsaved-changes dialog | Dialog | MSG-UNSAVED-CHANGES | Conditional | Một câu và hai nút |
| 26 | E-SCR-M03-008-26 | Busy / permission / failure feedback | Banner | MSG-ROUTE-BUSY, MSG-NO-PERMISSION, MSG-GENERIC | Conditional | MSG-ROUTE-BUSY nêu tuyến hoặc điểm dừng đang bận |
| 27 | E-SCR-M03-008-27 | Translate button | Button nhỏ (ký tự "→", tên truy cập "Dịch sang tiếng Anh") | Một nút cho tên điểm dừng #6; đặt giữa ô tiếng Việt và ô tiếng Anh | Could (MVP-Scope §3.5) | Không bấm được khi ô tiếng Việt trống/chỉ khoảng trắng, khi đang dịch, hoặc khi form chỉ đọc (BR-AI-01, BR-AI-07). Bấm thì thay ô tiếng Anh bằng bản dịch, không hỏi xác nhận (BR-AI-02); không lưu gì (BR-AI-06) |
| 28 | E-SCR-M03-008-28 | Translate status | Text dưới ô tiếng Anh | MSG-AI-TRANSLATING khi đang dịch; MSG-AI-FAILED kèm nút "Thử lại" khi lỗi | Conditional | Lỗi giữ nguyên ô tiếng Anh; thông báo mất khi bấm "Thử lại", gõ vào ô tiếng Anh hoặc bấm "→" lại (BR-AI-09) |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading | Spinner | Đang tải |
| Empty | Chưa có điểm dừng, có Tạo điểm dừng | Thư viện trống |
| Has checkpoints | Danh sách điểm dừng | Tải thành công |
| New checkpoint | Form trống, chưa có loại kết nối | Tạo điểm dừng |
| Mode not saved | MSG-MODE-REQUIRED-FIRST khi bấm thêm điểm tham quan | Chưa lưu loại kết nối |
| Name taken | MSG-CHECKPOINT-NAME-TAKEN | Tên tiếng Việt trùng |
| Mode switch blocked | MSG-MODE-HAS-AV | Đổi sang "Cần tải trước" khi còn âm thanh/video |
| Visit point limit | MSG-LIMIT-QR | Đã đủ 20 điểm tham quan chưa thu hồi |
| Closing | Dialog đóng với danh sách tuyến bị ảnh hưởng | Chọn Đóng tạm |
| Close failed | MSG-CLOSE-FAILED + "Đóng tạm các tuyến liên quan" | Không hoàn tất đóng |
| Reopen blocked | MSG-REOPEN-BLOCKED + danh sách | Kiểm tra mở lại không đạt |
| Archive blocked | MSG-CHECKPOINT-IN-USE | Còn tuyến chưa lưu trữ liệt kê điểm dừng |
| Stale write | MSG-STALE | `concurrencyRevision` lỗi thời |
| Operation busy | MSG-ROUTE-BUSY | Có thao tác khác trên tập tuyến–điểm dừng |
| Archived | Chỉ đọc | Điểm dừng Đã lưu trữ |
| Translating | "Đang dịch…" dưới ô tên tiếng Anh; nút "→" không bấm được | Bấm "→" |
| Translation failed | MSG-AI-FAILED kèm "Thử lại"; ô tên tiếng Anh giữ nguyên | Dịch vụ dịch lỗi, quá thời gian hoặc từ chối |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Tạo điểm dừng | Tap | Mở form trống | State update |
| 2 | Chọn loại kết nối | Chọn | Chặn đổi sang "Cần tải trước" khi còn âm thanh/video; tick khảo sát cho chế độ có mạng | State update |
| 3 | Lưu bản nháp | Tap | Lưu nguyên tử; kiểm tra tên trùng | Show success |
| 4 | Thêm điểm tham quan | Tap | Kiểm tra đã lưu loại kết nối và giới hạn 20; mở form trống | `SCR-M03-003` (new) |
| 5 | Mở điểm tham quan | Tap | Mở workspace | `SCR-M03-003` |
| 6 | Xuất bản | Tap | Kiểm tra và mở màn xem lại, nêu tuyến bị ảnh hưởng | `SCR-M03-004` |
| 7 | Đóng tạm | Xác nhận | Xây snapshot mới cho mọi tuyến liệt kê; chuyển đổi nguyên tử; tuyến hết điểm dừng hoạt động tự đóng tạm; ghi nhật ký nêu các tuyến | State update / Close failed |
| 8 | Đóng tạm các tuyến liên quan | Tap | Đóng trực tiếp các tuyến liệt kê điểm dừng (không cần snapshot) | State update |
| 9 | Mở lại | Xác nhận (Quản lý) | Kiểm tra; đạt thì mở lại và tạo phiên bản hành trình mới cho các tuyến liên quan; tuyến đã tự đóng không tự mở lại | State update / Reopen blocked |
| 10 | Lưu trữ | Xác nhận (Quản lý) | Điểm dừng Đã lưu trữ; không tạo phiên bản hành trình | State update / Archive blocked |
| 11 | Hủy | Xác nhận | Điểm dừng chưa từng xuất bản thành Đã lưu trữ | State update |
| 12 | Quay lại | Tap | Về màn trước; có thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES | `SCR-M03-002` / `SCR-M03-001` |
| 13 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |
| 14 | "→" của tên điểm dừng | Tap | Hiện "Đang dịch…"; gửi tên tiếng Việt đi dịch; thành công thì thay ô tên tiếng Anh (bỏ kết quả nếu tên tiếng Việt đã đổi hoặc người dùng đã gõ vào ô tiếng Anh từ lúc bấm); lỗi thì hiện MSG-AI-FAILED kèm "Thử lại". Bản dịch quá 100 ký tự vẫn điền đủ, bộ đếm ký tự báo đỏ như khi tự gõ | State update (chưa lưu) |
| 15 | "Thử lại" | Tap | Gửi lại yêu cầu dịch | State update |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-008-001 | Điểm dừng được tạo, điền và xuất bản độc lập với tuyến; không có thứ tự và không có văn bản giới thiệu riêng; nội dung du khách nằm ở điểm tham quan | BR-M03-D01, SC-M03-028 |
| SR-SCR-M03-008-002 | Loại kết nối lưu trên điểm dừng, không có mặc định; quyết định điểm tham quan nhận gì | BR-M03-D02 |
| SR-SCR-M03-008-003 | Tên tiếng Việt duy nhất giữa các điểm dừng chưa lưu trữ, so cả bản nháp lẫn bản đã xuất bản; trùng chặn lưu bằng MSG-CHECKPOINT-NAME-TAKEN | BR-M03-D03, L01 |
| SR-SCR-M03-008-004 | Điểm dừng sẵn sàng khi có tên hai ngôn ngữ, loại kết nối (kèm xác nhận khảo sát nếu cần), ít nhất một điểm tham quan sẵn sàng, và với "Cần tải trước" mọi ảnh đã lưu và đọc được | BR-M03-D04 |
| SR-SCR-M03-008-005 | Xuất bản lần đầu làm điểm dừng và mọi điểm tham quan sẵn sàng Đang hoạt động cùng lúc; điểm chưa sẵn sàng ở lại Nháp và được liệt kê; không tạo phiên bản hành trình vì chưa tuyến nào liệt kê | BR-M03-D05 |
| SR-SCR-M03-008-006 | Mỗi điểm dừng có tối đa 20 điểm tham quan chưa thu hồi; điểm dừng đang hoạt động luôn có ít nhất một điểm tham quan hoạt động | BR-M03-E02, E11 |
| SR-SCR-M03-008-007 | Ghi chú vị trí là trường nội bộ lưu cùng form, không cần xuất bản | BR-M03-D11 |
| SR-SCR-M03-008-008 | Đóng điểm dừng rời hành trình của mọi tuyến liệt kê và tạo phiên bản mới cho tất cả trong cùng một thao tác nguyên tử; không bị chặn bởi trần dung lượng | BR-M03-H02, X02, SC-M03-006, SC-M03-029 |
| SR-SCR-M03-008-009 | Mỗi tuyến đang hoạt động hết điểm dừng hoạt động thì tự đóng tạm và không tự mở lại | BR-M03-H02, H07, SC-M03-019, SC-M03-030 |
| SR-SCR-M03-008-010 | Đóng lỗi thì giữ nguyên trạng thái, không báo thành công giả, và đề nghị "Đóng tạm các tuyến liên quan" | BR-M03-H04 |
| SR-SCR-M03-008-011 | Chỉ Quản lý mở lại, kèm ghi chú an toàn và kiểm tra kỹ thuật; không đạt thì liệt kê việc cần xử lý | BR-M03-H06 |
| SR-SCR-M03-008-012 | Chỉ Quản lý lưu trữ; điểm dừng phải đang Tạm đóng và không tuyến chưa lưu trữ nào liệt kê (kể cả bản nháp); không hoàn tác | BR-M03-D10, SC-M03-031 |
| SR-SCR-M03-008-013 | Đóng không dừng hay báo cho phiên M02 đang chạy; Ban Quản lý xử lý cảnh báo tại chỗ | BR-M03-H05 |
| SR-SCR-M03-008-014 | Mọi hộp thoại và màn xem lại cho điểm dừng nêu các tuyến bị ảnh hưởng và hệ quả từng tuyến | BR-M03-X03 |
| SR-SCR-M03-008-015 | Không có xóa vật lý nào; hủy và lưu trữ dùng trạng thái vòng đời | BR-M03-D12 |
| SR-SCR-M03-008-016 | Thao tác trên điểm dừng và các tuyến liệt kê nó chạy tuần tự (MSG-ROUTE-BUSY) | BR-M03-F05 |
| SR-SCR-M03-008-017 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |
| SR-SCR-M03-008-018 | Chỉ bấm "→" mới dịch; gõ, rời ô, mở form, xóa ô tiếng Anh hay đổi ô tiếng Việt không tự dịch và không đổi ô tiếng Anh. Ô tiếng Anh luôn sửa được. Bản dịch chỉ điền form; lưu, kiểm tra và xuất bản giữ nguyên quy tắc M03 (tên tiếng Việt duy nhất không bị ảnh hưởng); không có hộp xác nhận mới | BR-AI-01 đến BR-AI-06, BR-M03-D03, F11, L12 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-002 | Thư viện điểm dừng, tên duy nhất, loại kết nối |
| FR-M03-003 | Danh sách điểm tham quan, mã …6 ký tự, thêm điểm tham quan |
| FR-M03-005 | Sẵn sàng/Chưa đủ, kiểm tra hai mức |
| FR-M03-007 | Một bản nháp, stale write, khôi phục, thao tác tuần tự |
| FR-M03-008 | Xuất bản điểm dừng lần đầu độc lập với tuyến |
| FR-M03-011 | Đóng, mở lại, lưu trữ điểm dừng |
| FR-M03-018 | Nhật ký nêu các tuyến bị ảnh hưởng, lịch sử từng mục |
| FR-M03-019 | Tên hiển thị và thông báo từ danh mục |
| FR-AI-001 đến FR-AI-004 | Nút "→" cho tên điểm dừng, điền ô tiếng Anh không lưu, ô tiếng Anh luôn sửa được, lỗi kèm "Thử lại" |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lỗi liên kết với ô nhập, trạng thái và Sẵn sàng/Chưa đủ không chỉ biểu đạt bằng màu, focus trong dialog và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-008-002 | Bố cục danh sách và form (danh sách và form trên cùng màn hay hai vùng) | No | Resolved | Hai vùng: danh sách điểm dừng bên trái, form của điểm dừng đang chọn bên phải; màn hẹp thì xếp chồng. |
| OQ-SCR-M03-008-003 | Hiển thị lý do đóng, nguồn đóng của điểm dừng trong danh sách | No | Resolved | Có: dòng điểm dừng Tạm đóng hiện lý do đóng và thời điểm đóng (dd/mm/yyyy hh:mm); chỉ nhân viên thấy. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
