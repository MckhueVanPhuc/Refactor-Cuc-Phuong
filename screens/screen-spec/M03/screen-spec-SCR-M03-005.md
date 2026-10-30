# Screen Spec: Báo cáo vận hành

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-005` |
| Screen name | Báo cáo vận hành |
| Module | `M03` |
| Actor | Nhân viên nội dung, Quản lý |
| Priority | Should |
| Mockup | [mockup-SCR-M03-005.html](../../html/mockup-SCR-M03-005.html) (HTML tĩnh, chỉ để xem tham khảo, không phải thiết kế chính thức; chưa sign-off UX) |
| Status | Draft — đồng bộ [Spec M03 v3.7](../../../docs/spec/spec-M03.md) |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md) (US-M03-06, BR-M03-J05 đến J08, X05; đầu vào và đầu ra RPT-01/RPT-02 tại §5.1; giới hạn §5.3; thông báo §5.6). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Hai báo cáo chỉ đọc, không có biểu đồ, không xuất tệp, không thời gian thực.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Chọn "Báo cáo" từ SCR-M03-001. Cả hai role đều xem được.

**The user leaves when:** Quay về SCR-M03-001 hoặc đổi bộ lọc (ở lại màn này).

## 2. Mockup

Mockup HTML tĩnh: [mockup-SCR-M03-005.html](../../html/mockup-SCR-M03-005.html). Không dùng mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-005-01 | User info | Header | Email, vai trò (tên hiển thị) và nút "Đăng xuất" | Yes | Đăng xuất kết thúc phiên đăng nhập và về SCR-M03-000; còn thay đổi chưa lưu thì hiện MSG-UNSAVED-CHANGES trước (BR-M03-K06). Không hiện mã vai trò |
| 2 | E-SCR-M03-005-02 | Screen title | Header text | "Báo cáo vận hành" | Yes | Non-empty |
| 3 | E-SCR-M03-005-03 | Last-updated line | Text một dòng | MSG-REPORT-UPDATED: "Số liệu tính đến {giờ} ngày {ngày}." từ `lastSuccessfulIngestionAt` theo `Asia/Ho_Chi_Minh` (hh:mm, dd/mm/yyyy); chưa từng có chuyến đi nào thì MSG-REPORT-NO-DATA-YET ("Chưa có chuyến đi nào được gửi về hệ thống.") | Yes | Chữ thường một dòng, không banner, không màu cảnh báo; không bịa mốc thời gian, không lấy giờ truy vấn thay cho `lastSuccessfulIngestionAt` (BR-M03-J08) |
| 4 | E-SCR-M03-005-04 | Scope line | Text một dòng | MSG-REPORT-SCOPE: "Chỉ tính các chuyến đi đã kết thúc và đã gửi về hệ thống; số liệu không cập nhật tức thời." | Yes | Đặt ngay dưới dòng cập nhật |
| 5 | E-SCR-M03-005-05 | Report tab: RPT-01 | Tab | Tổng hợp chuyến đi | Yes | None |
| 6 | E-SCR-M03-005-06 | Report tab: RPT-02 | Tab | Lượt ghé theo điểm dừng | Yes | None |
| 7 | E-SCR-M03-005-07 | Date range input | Hai ô ngày (từ ngày, đến ngày) | `fromDate` và `toDate`, định dạng dd/mm/yyyy | Yes | Phải chọn cùng nhau; `fromDate` ≤ `toDate` (sai thì MSG-REPORT-DATES-INVALID: "Hãy chọn đủ ngày bắt đầu và ngày kết thúc, ngày bắt đầu không được sau ngày kết thúc."); khoảng chọn (tính cả hai đầu) tối đa 366 ngày, dài hơn bị từ chối bằng MSG-REPORT-SPAN ("Khoảng thời gian chọn quá dài. Hãy chọn tối đa 366 ngày."); mặc định 30 ngày lịch kết thúc hôm nay theo `Asia/Ho_Chi_Minh`, tính cả hai đầu; 30 ngày là mặc định, không phải mức tối đa |
| 8 | E-SCR-M03-005-08 | Route filter | Selector | Tuyến (tên tiếng Việt); mặc định tất cả tuyến | No | Lọc theo `routeId` ổn định; không hiện định danh |
| 9 | E-SCR-M03-005-09 | Action: Áp dụng | Button | Làm mới báo cáo theo bộ lọc | Yes | Không gửi truy vấn khi khoảng ngày không hợp lệ |
| 10 | E-SCR-M03-005-10 | RPT-01: totals | Stat | Tổng chuyến đi (`totalSessionCount`), số hoàn thành (`completedCount`), số bỏ dở (`abandonedCount`) | Yes | Số nguyên ≥ 0; "Hoàn thành" / "Bỏ dở" là tên hiển thị trạng thái |
| 11 | E-SCR-M03-005-11 | RPT-01: rates | Stat | Tỷ lệ hoàn thành (`completedRate`), tỷ lệ bỏ dở (`abandonedRate`) | Yes | Từ 0 đến 1 hiển thị dạng phần trăm; bằng 0 khi không có chuyến |
| 12 | E-SCR-M03-005-12 | RPT-02: table | Table | Mỗi dòng một cặp (tuyến, điểm dừng): tên tuyến (`routeName`: tên tiếng Việt của bản đang xuất bản tại thời điểm truy vấn), tên điểm dừng, thứ tự, số chuyến đi duy nhất (`uniqueSessionCount`) | Yes | Gom theo `routeId` và `checkpointId` ổn định, không gom theo tên; tên điểm dừng và thứ tự lấy từ bản ghi có `endedAt` mới nhất trong kỳ; tuyến đổi tên thì mọi kỳ hiện tên mới; báo cáo ở mức điểm dừng, không theo từng mã QR |
| 13 | E-SCR-M03-005-13 | RPT-02: visit meaning line | Text một dòng | MSG-REPORT-VISIT-MEANING: "Một lượt ghé là một lần quét mã QR, không chứng minh du khách đã có mặt tại chỗ." | Yes | Đặt dưới bảng RPT-02 |
| 14 | E-SCR-M03-005-14 | Empty-period line | Text | MSG-REPORT-EMPTY: "Không có chuyến đi nào trong khoảng thời gian đã chọn." | Conditional | Hiện ở vùng bảng khi bộ lọc không cho chuyến đi nào |
| 15 | E-SCR-M03-005-15 | Loading state | Spinner | Đang tải báo cáo | Conditional | Hiện khi đang truy vấn |
| 16 | E-SCR-M03-005-16 | Load failure | Cảnh báo | MSG-GENERIC ("Có lỗi xảy ra. Nội dung bạn nhập vẫn được giữ. Hãy thử lại, nếu vẫn lỗi hãy báo quản lý.") | Conditional | Chỉ lỗi tải mới dùng kiểu cảnh báo; các dòng ghi chú còn lại không dùng |
| 17 | E-SCR-M03-005-17 | Permission feedback | Text | MSG-NO-PERMISSION | Conditional | Hiện khi server từ chối |
| 18 | E-SCR-M03-005-18 | Action: Quay lại | Button | Về SCR-M03-001 | Yes | None |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default (RPT-01) | Tổng hợp chuyến đi cho 30 ngày lịch gần nhất | Mở tab RPT-01 |
| Default (RPT-02) | Bảng lượt ghé theo điểm dừng cho 30 ngày lịch gần nhất | Mở tab RPT-02 |
| Loading | Spinner | Đang truy vấn |
| Has data | Số liệu hoặc bảng | Có chuyến đi trong kỳ |
| Empty period | MSG-REPORT-EMPTY | Truy vấn thành công, không có chuyến đi |
| Span too long | MSG-REPORT-SPAN | Khoảng chọn dài hơn 366 ngày |
| Invalid dates | MSG-REPORT-DATES-INVALID | `fromDate` sau `toDate` hoặc chỉ chọn một ngày |
| No ingestion yet | MSG-REPORT-NO-DATA-YET; số 0 hoặc bảng rỗng | Chưa từng nhận chuyến đi |
| Load failure | MSG-GENERIC kiểu cảnh báo | Truy vấn lỗi |
| Filtered by route | Báo cáo theo tuyến đã chọn | Chọn tuyến |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Tab RPT-01/RPT-02 | Tap | Chuyển báo cáo | Show report |
| 2 | Hai ô ngày | Chọn | Kiểm tra cùng nhau, thứ tự và tối đa 366 ngày | State update / MSG-REPORT-SPAN |
| 3 | Bộ lọc tuyến | Chọn | Cập nhật bộ lọc | State update |
| 4 | Áp dụng | Tap | Truy vấn lại theo bộ lọc hiện tại | Reload report |
| 5 | Quay lại | Tap | Về danh sách tuyến | `SCR-M03-001` |
| 6 | Đăng xuất | Tap | Kết thúc phiên đăng nhập; không đổi vai trò hay trạng thái; không ghi nhật ký | `SCR-M03-000` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-005-001 | Báo cáo lọc và gom theo `endedAt` theo `Asia/Ho_Chi_Minh`; mặc định 30 ngày lịch kết thúc hôm nay, tính cả hai đầu | BR-M03-J05 |
| SR-SCR-M03-005-002 | `fromDate` và `toDate` luôn đi cùng nhau; `fromDate` ≤ `toDate`; khoảng chọn tối đa 366 ngày tính cả hai đầu, dài hơn bị từ chối bằng MSG-REPORT-SPAN | BR-M03-J05, §5.3 `REPORT_MAX_SPAN_DAYS` |
| SR-SCR-M03-005-003 | Chỉ tính phiên đã đồng bộ; phiên còn trên thiết bị chưa được tính và màn hình luôn nêu giới hạn này bằng MSG-REPORT-SCOPE | BR-M03-J05, J08, SC-M03-035 |
| SR-SCR-M03-005-004 | RPT-01: tổng, số và tỷ lệ Hoàn thành, số và tỷ lệ Bỏ dở; tỷ lệ bằng 0 khi không có chuyến | BR-M03-J06 |
| SR-SCR-M03-005-005 | RPT-02: số chuyến đi duy nhất theo cặp (tuyến, điểm dừng); nhóm theo định danh ổn định; tên và thứ tự từ bản ghi có `endedAt` mới nhất trong kỳ; không báo cáo theo từng mã QR | BR-M03-J07, X05 |
| SR-SCR-M03-005-006 | Một lượt ghé là một lần quét mã QR được ứng dụng ghi nhận, không phải bằng chứng có mặt tại chỗ; màn hình nêu điều này dưới bảng RPT-02 | BR-M03-J07, J08 |
| SR-SCR-M03-005-007 | Ghi chú báo cáo là chữ thường một dòng lấy từ danh mục, không banner, không màu cảnh báo; chỉ lỗi tải dùng kiểu cảnh báo | BR-M03-J08 |
| SR-SCR-M03-005-008 | Không biểu đồ, không xuất tệp, không thời gian thực | BR-M03-J05, Spec M03 §1 (Out of scope) |
| SR-SCR-M03-005-009 | Cả hai role xem được; báo cáo không chứa PII, định danh thiết bị hay GPS | BR-M03-J01, J05 |
| SR-SCR-M03-005-010 | Phiên của tuyến ở mọi trạng thái (kể cả Tạm đóng, Đã lưu trữ) đều được tính nếu đã đồng bộ | BR-M03-J04 |
| SR-SCR-M03-005-011 | Mọi màn đã đăng nhập có nút Đăng xuất; đăng xuất kết thúc phiên nhà cung cấp và không thay đổi vai trò/trạng thái; sau đó mọi request được bảo vệ cần đăng nhập lại | BR-M03-K06, SC-M03-040 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-015 | RPT-01: chuyến đi theo tuyến/trạng thái/ngày |
| FR-M03-016 | RPT-02: lượt ghé duy nhất theo điểm dừng và ngày |
| FR-M03-019 | Ghi chú một dòng từ danh mục thông báo |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lỗi liên kết với ô ngày, bảng có tiêu đề cột và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-005-003 | Thứ tự các dòng RPT-02 | No | Resolved | RPT-02 sắp theo tên tuyến A→Z, rồi theo thứ tự điểm dừng; không đổi cách gom nhóm. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
