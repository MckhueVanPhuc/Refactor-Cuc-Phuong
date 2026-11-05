# Screen Spec: Gợi ý tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-002` |
| Screen name | Gợi ý tuyến |
| Module | `M01` |
| Actor | Visitor |
| Priority | Should |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M01 v3.2](../../../docs/spec/spec-M01.md) |

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu. Chữ hiển thị cho người dùng chỉ là các câu trong ngoặc kép, câu của khóa MSG-* và bảng copy; tên trường, mã enum/trạng thái, định danh và khóa MSG-* trong tài liệu này chỉ để truy vết cho người phát triển, không bao giờ hiện trên giao diện.

## 1. Purpose

**Shown when:** Visitor mở "Gợi ý tuyến" từ SCR-M01-001.

**The user leaves when:** Chọn một tuyến trong kết quả để mở chi tiết (SCR-M01-003), hoặc quay về danh mục (SCR-M01-001).

## 2. Mockup

Chưa có mockup cho màn này. Không suy ngược business rule từ bất kỳ ảnh mockup nào về sau.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-002-01 | Language control VI/EN | Toggle (control dùng chung) | `LanguagePreference` | Yes | Như SCR-M01-001 |
| 2 | E-SCR-M01-002-02 | Screen title | Header text | Tên màn hình theo ngôn ngữ đã chọn | Yes | Non-empty |
| 3 | E-SCR-M01-002-03 | Time tag selector | Selector (chọn một) | `TIME_NGAN` (≤ 90 phút), `TIME_VUA` (> 90–180 phút), `TIME_DAI` (> 180 phút) | Yes | Đúng một giá trị hợp lệ |
| 4 | E-SCR-M01-002-04 | Group tag selector | Selector (chọn một) | `GROUP_CA_NHAN_NGUOI_LON`, `GROUP_GIA_DINH_CO_TRE`, `GROUP_CAN_DE_DANG` (cần một tuyến đi dễ dàng) | Yes | Đúng một giá trị hợp lệ |
| 5 | E-SCR-M01-002-05 | Experience tag selector | Selector (chọn một) | `INTEREST_THIEN_NHIEN_CHUP_ANH`, `INTEREST_TIM_HIEU`, `INTEREST_KHAM_PHA` | Yes | Đúng một giá trị hợp lệ |
| 6 | E-SCR-M01-002-06 | Action: Xem tuyến phù hợp | Button | Chạy lọc xác định trên tuyến đang chọn được | Yes | Vô hiệu khi thiếu một trong ba tiêu chí (FR-M01-004) |
| 7 | E-SCR-M01-002-07 | Criteria summary | Text | Ba tiêu chí đã chọn | Conditional | Hiện sau khi lọc |
| 8 | E-SCR-M01-002-08 | Result list | List | Mọi tuyến chọn được có `timeTags`, `groupTags` và `experienceTags` đều chứa giá trị đã chọn | Conditional | Khớp cả ba nhóm; 0..N kết quả; không chấm điểm, không sắp theo độ phù hợp, không giới hạn số lượng (BR-M01-003) |
| 9 | E-SCR-M01-002-09 | Result route card | List item | Cùng trường với thẻ tuyến của SCR-M01-001 (ảnh, tên, mô tả ngắn, quãng đường, thời lượng, độ khó, số điểm dừng, dấu cần tải trước) | Conditional | Như SCR-M01-001; ảnh lỗi → placeholder |
| 10 | E-SCR-M01-002-10 | Zero-result state | Text + action | Thông báo không có tuyến phù hợp, kèm hành động đổi tiêu chí hoặc về danh mục | Conditional | Không nới lỏng tiêu chí (US-M01-02 mục 3) |
| 11 | E-SCR-M01-002-11 | Action: Đổi tiêu chí | Button | Quay lại ba selector, giữ lựa chọn hiện tại | Conditional | None |
| 12 | E-SCR-M01-002-12 | Action: Về danh mục | Button | Mở SCR-M01-001 | Yes | None |
| 13 | E-SCR-M01-002-13 | Loading / source unavailable | Panel | Đang đọc nguồn, hoặc không đọc được nguồn | Conditional | Không báo "không có tuyến" khi thực chất nguồn không đọc được |

**Copy cố định (i18n vi/en).** Chuỗi hiển thị cho du khách là tài nguyên i18n đóng gói sẵn cùng ứng dụng (dùng được khi không có mạng), chọn theo `LanguagePreference`. Spec M01/M02 chỉ cố định một số câu; các câu còn lại dưới đây là chữ chốt ở mức screen spec, không thêm hành vi mới. Bảng nhãn dưới đây áp dụng cho mọi màn du khách của M01 (thẻ tuyến, chi tiết, gợi ý): nhãn tiếng Việt lấy theo tên hiển thị của Spec M03 §5.1/§5.4, nhãn tiếng Anh là bản dịch chốt tại đây; mã enum không bao giờ hiện cho du khách.

| Giá trị | Tiếng Việt | English |
|---|---|---|
| `NHE` | Nhẹ | Easy |
| `TRUNG_BINH` | Trung bình | Moderate |
| `KHO` | Khó | Hard |
| `TIME_NGAN` | Ngắn (đến 90 phút) | Short (up to 90 min) |
| `TIME_VUA` | Vừa (trên 90 đến 180 phút) | Medium (90–180 min) |
| `TIME_DAI` | Dài (trên 180 phút) | Long (over 180 min) |
| `GROUP_CA_NHAN_NGUOI_LON` | Cá nhân/người lớn | Individuals and adults |
| `GROUP_GIA_DINH_CO_TRE` | Gia đình có trẻ nhỏ | Family with young children |
| `GROUP_CAN_DE_DANG` | Cần đi dễ dàng | Need an easy route |
| `INTEREST_THIEN_NHIEN_CHUP_ANH` | Thiên nhiên, chụp ảnh | Nature and photography |
| `INTEREST_TIM_HIEU` | Tìm hiểu | Learning |
| `INTEREST_KHAM_PHA` | Khám phá | Exploration |

Chữ cố định khác của màn này:

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề màn | Gợi ý tuyến | Route suggestions |
| Nút lọc | Xem tuyến phù hợp | Show matching routes |
| Không có tuyến khớp | Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến. | No route matches your choices. You can change them or see all routes. |
| Hành động khi 0 kết quả | Đổi tiêu chí · Xem tất cả tuyến | Change choices · See all routes |
| Không đọc được nguồn | Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại. | Could not load the routes. Check your connection and try again. |
| Tiêu đề nhóm | Thời gian · Đối tượng · Trải nghiệm | Time · Who is going · Experience |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Ba selector trống, hành động xem tuyến bị vô hiệu | Mở màn hình, chưa chọn |
| Partially selected | Một hoặc hai nhóm đã chọn, hành động vẫn vô hiệu | Thiếu tiêu chí |
| Ready | Đủ ba tiêu chí, hành động được bật | Chọn đủ ba nhóm |
| Results | Danh sách tuyến khớp cả ba nhóm kèm tóm tắt tiêu chí | Lọc có ít nhất một tuyến |
| Zero result | Thông báo rỗng với lựa chọn đổi tiêu chí hoặc về danh mục | Lọc không có tuyến |
| Source unavailable | Thông báo không đọc được nguồn | Request nguồn lỗi |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Time/Group/Experience selector | Chọn một giá trị | Cập nhật `RecommendationContext` local; mỗi nhóm đúng một giá trị | State update |
| 2 | Xem tuyến phù hợp | Tap | Lọc tuyến chọn được theo cả ba nhóm | Show results or zero-result |
| 3 | Result route card | Tap | Mở chi tiết tuyến | `SCR-M01-003` |
| 4 | Đổi tiêu chí | Tap | Quay về selector | State update |
| 5 | Về danh mục | Tap | Quay về danh mục | `SCR-M01-001` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-002-001 | Cần đúng một giá trị hợp lệ ở mỗi nhóm `timeTag`, `groupTag`, `experienceTag` trước khi lọc | FR-M01-004, BR-M01-003 |
| SR-SCR-M01-002-002 | Khớp theo set containment ở cả ba nhóm; mỗi kết quả chứa cả ba tag đã chọn | BR-M01-003, SC-M01-002 |
| SR-SCR-M01-002-003 | `timeTags` của tuyến luôn đúng một giá trị do M03 suy ra từ thời lượng; M01 dùng nguyên giá trị, không tính lại | Spec M01 §4.2 |
| SR-SCR-M01-002-004 | Không có kết quả thì hiển thị rỗng; không tự nới tiêu chí | BR-M01-003 |
| SR-SCR-M01-002-005 | Chỉ tuyến `HOAT_DONG` có `activeContentVersion` hợp lệ được xét | BR-M01-002 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-004 | Ba tiêu chí hợp lệ → mọi tuyến khớp; hỗ trợ 0 kết quả; thiếu/không hợp lệ thì không lọc |
| FR-M01-001 | Control ngôn ngữ dùng chung |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lựa chọn đã chọn không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-002-002 | UI pattern cho selector một giá trị (radio, chip, dropdown) | No | Resolved | Mỗi nhóm là một hàng chip chọn một; bấm lại chip đang chọn để bỏ chọn; dùng được bằng bàn phím như radio group. |
| OQ-SCR-M01-002-003 | Thứ tự hiển thị kết quả | No | Resolved | Kết quả sắp theo tên tuyến A→Z theo ngôn ngữ đang chọn; không chấm điểm, không giới hạn số lượng (BR-M01-003). |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
