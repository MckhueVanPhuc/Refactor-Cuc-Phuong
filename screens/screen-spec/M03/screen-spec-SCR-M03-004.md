# Screen Spec: Xem lại & Xuất bản

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-004` |
| Screen name | Xem lại & Xuất bản |
| Module | `M03` |
| Actor | Nhân viên nội dung, Quản lý |
| Priority | Must; xem trước như du khách Should |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-01/02, BR-M03-A05, C04, C09, C10, D05, E17, F01 đến F05, F12, G03, G07, G10, X02, X03; `PublicationReview` §5.1; thông báo §5.6). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Không có hàng đợi duyệt, không có trạng thái chờ duyệt và không cần người thứ hai: bất kỳ quản trị viên nào cũng xuất bản được bản nháp của mình, nhưng chỉ qua màn này.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Chọn "Xuất bản" từ SCR-M03-002 (tuyến), SCR-M03-003 (điểm tham quan) hoặc SCR-M03-008 (điểm dừng). Bắt buộc trước mọi lần xuất bản.

**The user leaves when:** Quay lại sửa (về màn biên tập tương ứng); hoặc xác nhận xuất bản thành công và quay về màn nguồn.

## 2. Mockup

Chưa có mockup cho màn này. Không dùng ảnh mockup về sau để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-004-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-004-02 | Publication unit | Header text | Tên hiển thị của đơn vị: "Xuất bản tuyến lần đầu" / "Thông tin tuyến và danh sách điểm dừng" / "Xuất bản điểm dừng lần đầu" / "Thông tin điểm dừng" / "Điểm tham quan (một mã QR)" | Yes | Một xác nhận chỉ xuất bản một đơn vị (BR-M03-F04) |
| 3 | E-SCR-M03-004-03 | Blocking issues list | List | Mỗi lỗi chặn xuất bản nêu tên ô và cách sửa, kèm liên kết đến vị trí sửa | Conditional | Dùng thông báo từ danh mục: MSG-MISSING-FIELD, MSG-MISSING-LANGUAGE, MSG-NO-ACTIVE-CHECKPOINT, MSG-ROUTE-LAST-CHECKPOINT, MSG-RIGHTS-NOT-CONFIRMED, MSG-ONLINE-NOT-VERIFIED, MSG-SAFETY-CONFIRM, MSG-OFFLINE-TOO-BIG, MSG-IMAGE-NOT-READABLE, MSG-AV-LANGUAGE-MISSING; còn lỗi thì không xuất bản (BR-M03-F01) |
| 4 | E-SCR-M03-004-04 | Changes comparison | Table | Từng thay đổi: tên ô, giá trị bản đang chạy và bản mới | Yes | So sánh bản đang chạy với bản mới (BR-M03-F02) |
| 5 | E-SCR-M03-004-05 | Sensitive changes highlight | Highlight | Tô sáng thay đổi ở cảnh báo an toàn, yêu cầu tham gia và tick sơ đồ offline | Conditional | Luôn tô sáng vì không có người duyệt thứ hai (BR-M03-C10) |
| 6 | E-SCR-M03-004-06 | Affected routes impact | List | Mọi tuyến bị ảnh hưởng: tên, trạng thái (Đang hoạt động / Tạm đóng), với tuyến có phiên bản hành trình mới (`createsNewJourneyVersion`) thì hiện câu "gói tải trước của du khách cần cập nhật", dung lượng tải trước ước tính | Conditional | Hiện MSG-AFFECTED-ROUTES; không bao giờ hiện chữ "phiên bản", "snapshot" hay số phiên bản (§5.4); rỗng với lần xuất bản điểm dừng đầu tiên (BR-M03-X03) |
| 7 | E-SCR-M03-004-07 | Offline size estimate | Text | Dung lượng tải trước ước tính của từng tuyến bị ảnh hưởng (MB) | Conditional | Vượt 50 MB chặn xuất bản bằng MSG-OFFLINE-TOO-BIG nêu tên tuyến và ảnh nặng nhất; đóng và thu hồi không bị chặn bởi trần (BR-M03-G10) |
| 8 | E-SCR-M03-004-08 | Left-out checkpoints notice | List | Điểm dừng trong danh sách đang tạm đóng nên chưa nằm trong hành trình | Conditional | Mỗi dòng dùng MSG-CHECKPOINT-LEFT-OUT (đơn vị tuyến) |
| 9 | E-SCR-M03-004-09 | Left-out visit points notice | List | Điểm tham quan chưa sẵn sàng, ở lại dạng bản nháp | Conditional | Mỗi dòng dùng MSG-QR-LEFT-OUT (đơn vị điểm dừng lần đầu); cần ít nhất một điểm tham quan sẵn sàng |
| 10 | E-SCR-M03-004-10 | Impact notes | List | Hệ quả bằng lời: tuyến bị ảnh hưởng, gói tải trước đã tải sẽ cũ, phiên đang chạy không bị đổi | Yes | Phiên M02 đang chạy không bao giờ bị đổi giữa chừng (BR-M03-F02) |
| 11 | E-SCR-M03-004-11 | Reprint notice | Text | MSG-REPRINT-MODE-CHANGED | Conditional | Hiện khi loại kết nối của điểm dừng đổi cùng lần xuất bản (BR-M03-B05) |
| 12 | E-SCR-M03-004-12 | One-language media warning | Text | MSG-AV-ONE-LANGUAGE | Conditional | Cảnh báo, không bao giờ chặn xuất bản (BR-M03-E17) |
| 13 | E-SCR-M03-004-13 | No-safety-warning checkbox | Checkbox | "Tôi xác nhận tuyến không có cảnh báo an toàn cần nêu" | Conditional | Chỉ hiện khi cảnh báo an toàn trống và xác nhận lưu là chưa; bắt buộc tick mới xuất bản (MSG-SAFETY-CONFIRM); đặt lại khi nhập cảnh báo (BR-M03-C09) |
| 14 | E-SCR-M03-004-14 | Action: Xem trước như du khách | Button (mỗi điểm tham quan trong đơn vị) | Xem bản nháp như du khách, hai ngôn ngữ, nhãn MSG-PREVIEW-DRAFT | Conditional (Should) | Không ghi gì, không tra cứu live (BR-M03-F12) |
| 15 | E-SCR-M03-004-15 | Action: Quay lại sửa | Button | Về màn biên tập, giữ nguyên bản nháp | Yes | None |
| 16 | E-SCR-M03-004-16 | Action: Xuất bản (xác nhận) | Button + dialog | Xác nhận một lần để xuất bản; dialog dùng MSG-CONFIRM-PUBLISH: "Xuất bản \"{tên mục}\": du khách sẽ thấy nội dung mới ngay sau khi xuất bản." | Yes | Vô hiệu khi còn lỗi chặn; gửi kèm phiên bản kiểm tra đồng thời đã xem; dialog gồm một câu hệ quả và hai nút (BR-M03-L12) |
| 17 | E-SCR-M03-004-17 | Success message | Toast | MSG-PUBLISHED ("Đã xuất bản. Du khách sẽ thấy nội dung mới.") | Conditional | Chỉ khi toàn bộ xuất bản nguyên tử thành công |
| 18 | E-SCR-M03-004-18 | Failure message | Banner | MSG-PUBLISH-FAILED ("Chưa xuất bản được. Những gì du khách đang thấy vẫn như cũ. Hãy thử lại sau ít phút.") | Conditional | Dữ liệu công khai giữ nguyên; không tự thử lại |
| 19 | E-SCR-M03-004-19 | Stale confirmation notice | Banner | MSG-STALE; màn xem lại mở lại | Conditional | Xác nhận bị từ chối nếu mục đã đổi kể từ khi xem lại |
| 20 | E-SCR-M03-004-20 | Busy notice | Banner | MSG-ROUTE-BUSY | Conditional | Có thao tác khác trên tuyến hoặc điểm dừng thuộc cùng tập kết nối; không xếp hàng |
| 21 | E-SCR-M03-004-21 | Permission / generic feedback | Banner | MSG-NO-PERMISSION, MSG-GENERIC | Conditional | Lỗi bất ngờ không làm mất bản nháp |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Loading review | Spinner | Đang tạo `PublicationReview` |
| Publishable | So sánh, tác động, dung lượng, các thông báo; nút Xuất bản bật | Không còn lỗi chặn |
| Blocked | Danh sách lỗi chặn kèm vị trí sửa; nút Xuất bản vô hiệu | Có `blockingIssues` |
| Safety confirmation required | Checkbox cảnh báo an toàn | Cảnh báo an toàn trống, chưa xác nhận |
| Over size ceiling | MSG-OFFLINE-TOO-BIG nêu tuyến và ảnh nặng nhất | Gói tải trước của một tuyến vượt 50 MB |
| Confirming | Dialog xác nhận | Chọn Xuất bản |
| Publishing | Spinner, nút vô hiệu | Đang xuất bản |
| Success | MSG-PUBLISHED | Xuất bản nguyên tử thành công |
| Failed | MSG-PUBLISH-FAILED; công khai không đổi | Không xây được snapshot hoặc chuyển đổi lỗi |
| Stale | MSG-STALE; mở lại màn xem lại | Mục đã đổi giữa lúc xem và xác nhận |
| Busy | MSG-ROUTE-BUSY | Có thao tác khác đang chạy |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Màn hình | Mở | Kiểm tra đầy đủ; dựng so sánh, tác động, dung lượng; nêu tuyến bị ảnh hưởng | Show review |
| 2 | Dòng lỗi chặn | Tap | Nhảy tới ô cần sửa | Màn biên tập tương ứng |
| 3 | Checkbox cảnh báo an toàn | Tick | Ghi xác nhận vào bản nháp; mở khóa nếu hết lỗi | State update |
| 4 | Xem trước như du khách | Tap | Hiện bản xem trước từng điểm tham quan | Preview |
| 5 | Quay lại sửa | Tap | Về màn biên tập | `SCR-M03-002` / `SCR-M03-003` / `SCR-M03-008` |
| 6 | Xuất bản | Tap, xác nhận | Kiểm tra lại phiên bản đồng thời; xây snapshot cho mọi tuyến bị ảnh hưởng; chuyển đổi nguyên tử; ghi nhật ký (đánh dấu "tự xuất bản" nếu người xuất bản là người sửa cuối) | Success / failure state |
| 7 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-004-001 | Màn xem lại là bắt buộc trước mọi đơn vị xuất bản; không có hàng đợi duyệt, không cần người duyệt khác người viết | BR-M03-A05, F01, F02, SC-M03-014 |
| SR-SCR-M03-004-002 | Một xác nhận xuất bản đúng một đơn vị; điểm dừng, điểm tham quan và tuyến xuất bản độc lập; xuất bản tuyến không xuất bản điểm dừng | BR-M03-F04, C17 |
| SR-SCR-M03-004-003 | Màn hình so sánh bản đang chạy với bản mới và nêu mọi tuyến bị ảnh hưởng cùng hệ quả cho từng tuyến | BR-M03-F02, X03, SC-M03-029 |
| SR-SCR-M03-004-004 | Thiếu gì thì liệt kê từng thiếu sót kèm vị trí sửa và không xuất bản gì | BR-M03-F01, C04, L03 |
| SR-SCR-M03-004-005 | Xuất bản nguyên tử: hoặc mọi thứ thành công (kể cả snapshot của mọi tuyến bị ảnh hưởng) hoặc dữ liệu công khai không đổi; người xem và M01/M02 không bao giờ thấy trạng thái nửa chừng | BR-M03-F03, G06, G07, SC-M03-002 |
| SR-SCR-M03-004-006 | Dung lượng tải trước ước tính hiển thị cho từng tuyến; vượt 50 MB (giá trị tạm thời) thì chặn và nêu tên tuyến cùng ảnh nặng nhất | BR-M03-G10, SC-M03-020 |
| SR-SCR-M03-004-007 | Xác nhận mang theo phiên bản đồng thời đã xem; lệch thì bị từ chối là lỗi thời và mở lại màn xem lại | BR-M03-F02, F06 |
| SR-SCR-M03-004-008 | Thay đổi ở cảnh báo an toàn, yêu cầu tham gia và tick sơ đồ offline luôn được tô sáng | BR-M03-C10 |
| SR-SCR-M03-004-009 | Checkbox "không có cảnh báo an toàn" chỉ hiện khi trường trống và xác nhận lưu là chưa | BR-M03-C09 |
| SR-SCR-M03-004-010 | Một phiên bản hành trình mới chỉ áp dụng cho chuyến bắt đầu sau khi xuất bản; chuyến đang chạy không bị đổi | BR-M03-F02, G04 |
| SR-SCR-M03-004-011 | Khôi phục bản cũ cũng phải qua màn này; quy tắc hiện hành áp dụng lúc xuất bản | BR-M03-F07, SC-M03-021 |
| SR-SCR-M03-004-012 | Mỗi lần xuất bản ghi đúng một dòng nhật ký với trước/sau, người xuất bản; đánh dấu "tự xuất bản" khi trùng người sửa cuối | BR-M03-F08, SC-M03-014 |
| SR-SCR-M03-004-013 | Thao tác trên cùng tập tuyến–điểm dừng chạy tuần tự; thao tác thứ hai bị từ chối bằng MSG-ROUTE-BUSY | BR-M03-F05 |
| SR-SCR-M03-004-014 | Cả hai role xuất bản được; Nhân viên nội dung không bị hạn chế đơn vị nào | BR-M03-A02, §2.1 |
| SR-SCR-M03-004-015 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-005 | Danh sách lỗi chặn kèm vị trí sửa |
| FR-M03-006 | Màn xem lại bắt buộc; mọi quản trị viên xuất bản; quyền kiểm tra phía server |
| FR-M03-008 | Xuất bản tuyến lần đầu cùng phiên bản hành trình 1; xuất bản điểm dừng độc lập |
| FR-M03-009 | Snapshot mới cho mọi tuyến bị ảnh hưởng, trần dung lượng, ước tính |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, thay đổi nhạy cảm tô sáng không chỉ bằng màu, focus được quản lý trong dialog xác nhận và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-004-002 | Cách hiển thị so sánh trước/sau cho ảnh và danh sách điểm dừng | No | Resolved | Ảnh: hai cột ảnh thu nhỏ trước/sau; danh sách điểm dừng: hai cột tên theo thứ tự, dòng thêm/bỏ/đổi chỗ được đánh dấu bằng chữ "Thêm", "Bỏ", "Đổi vị trí", không chỉ bằng màu. |
| OQ-SCR-M03-004-003 | Thông báo riêng cho việc tự xuất bản | No | Resolved | Không có thông báo riêng: tự xuất bản là cách làm bình thường của MVP; dấu "tự xuất bản" chỉ có trong nhật ký và lịch sử (BR-M03-F08). |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
