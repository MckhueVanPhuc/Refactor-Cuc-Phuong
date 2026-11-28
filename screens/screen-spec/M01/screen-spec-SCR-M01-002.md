# Screen Spec: Gợi ý tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-002` |
| Screen name | Gợi ý tuyến |
| Module | `M01` |
| Actor | Visitor |
| Priority | Should |
| Mockup | Chưa có |
| Status | Draft — đồng bộ [Spec M01 v3.3](../../../docs/spec/spec-M01.md) và [Spec Mascot v1.11](../../../docs/spec/spec-Mascot.md) cho Mila (CHG-REC-2026-11-28-01) |

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu. Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline. Mascot Mila theo [Spec Mascot](../../../docs/spec/spec-Mascot.md) v1.0 (slot §5.1, BR-MAS-01 đến BR-MAS-19, câu §5.6); Mila không thay, không che câu nào của màn này.

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
| 3 | E-SCR-M01-002-03 | Time tag selector | Selector (chọn nhiều, v3.3) | `TIME_NGAN` (≤ 90 phút), `TIME_VUA` (> 90–180 phút), `TIME_DAI` (> 180 phút) | Yes | 0..3 giá trị khác nhau |
| 4 | E-SCR-M01-002-04 | Group tag selector | Selector (chọn nhiều, v3.3) | `GROUP_CA_NHAN_NGUOI_LON`, `GROUP_GIA_DINH_CO_TRE`, `GROUP_DI_THEO_DOAN` (đi theo đoàn) | Yes | 0..3 giá trị khác nhau |
| 5 | E-SCR-M01-002-05 | Experience tag selector | Selector (chọn nhiều, v3.3) | `INTEREST_THIEN_NHIEN_CHUP_ANH`, `INTEREST_TIM_HIEU`, `INTEREST_KHAM_PHA` | Yes | 0..3 giá trị khác nhau |
| 6 | E-SCR-M01-002-06 | Action: Xem tuyến phù hợp | Button | Chạy lọc xác định trên tuyến đang chọn được | Yes | Luôn bật; không chọn gì thì trả mọi tuyến chọn được (FR-M01-004, v3.3) |
| 7 | E-SCR-M01-002-07 | Criteria summary | Text | Mọi ý đã chọn, theo thứ tự nhóm rồi thứ tự ý | Conditional | Hiện trên trang kết quả; nhóm bỏ trống không có chip |
| 8 | E-SCR-M01-002-08 | Result list | List | Mọi tuyến chọn được mà ở mỗi nhóm có ý được chọn, tag của tuyến chứa ít nhất một ý đã chọn | Conditional | HOẶC trong nhóm, VÀ giữa các nhóm, nhóm bỏ trống không lọc; 0..N kết quả; không chấm điểm, không sắp theo độ phù hợp, không giới hạn số lượng (BR-M01-003) |
| 9 | E-SCR-M01-002-09 | Result route card | List item | Cùng trường với thẻ tuyến của SCR-M01-001 (ảnh, tên, mô tả ngắn, quãng đường, thời lượng, độ khó, số điểm dừng, dấu cần tải trước) | Conditional | Như SCR-M01-001; ảnh lỗi → placeholder |
| 10 | E-SCR-M01-002-10 | Zero-result state | Text + action | Thông báo không có tuyến phù hợp, kèm hành động đổi tiêu chí hoặc về danh mục | Conditional | Không nới lỏng tiêu chí (US-M01-02 mục 3) |
| 11 | E-SCR-M01-002-11 | Action: Đổi tiêu chí | Button | Quay lại form bốn selector, giữ lựa chọn hiện tại | Conditional | None |
| 12 | E-SCR-M01-002-12 | Action: Về danh mục | Button | Mở SCR-M01-001 | Yes | None |
| 13 | E-SCR-M01-002-13 | Loading / source unavailable | Panel | Đang đọc nguồn, hoặc không đọc được nguồn | Conditional | Không báo "không có tuyến" khi thực chất nguồn không đọc được |
| 14 | E-SCR-M01-002-14 | Tab bar | Thanh tab cố định ở đáy (design-system §5.2; 2026-11-21) | Như E-SCR-M01-001-20: Tuyến · Quét QR · Tài nguyên | Yes | Tab của màn đang mở được đánh dấu, không chỉ bằng màu |
| 15 | E-SCR-M01-002-15 | Mascot Mila | Ảnh + bong bóng trong slot (Spec Mascot §5.1) | Đầu màn (DOCK cạnh tiêu đề, v1.5: luôn có ở form, ở kết quả khi có tuyến phù hợp; slot trống không chiếm chỗ); kết quả rỗng (INLINE). Câu: bảng copy bên dưới | Conditional (Could, MVP-Scope §3.6) | Chỉ trong slot, không chiếm focus, ảnh `alt=""`; bong bóng ≤ 90 ký tự, có nút đóng; không có nút ẩn Mila; tôn trọng giảm chuyển động (BR-MAS-11, BR-MAS-17); v1.1: cỡ theo design-system §9.2, bong bóng kiểu "Giấy dã ngoại" §9.3, chạm theo ngữ cảnh và chạm nhiều lần (BR-MAS-12, 22), cử chỉ tự động ở màn Mila đứng chờ (BR-MAS-21), công tắc chuyển động ở SCR-M01-004 (v1.3) |
| 17 | E-SCR-M01-002-17 | Guide tag selector (v3.3) | Selector (chọn nhiều) | `GUIDE_CO_HUONG_DAN_VIEN`, `GUIDE_TU_THAM_QUAN` | Yes | 0..2 giá trị khác nhau; nhóm thứ tư, sau Trải nghiệm |
| 18 | E-SCR-M01-002-18 | Action: Bỏ chọn tất cả (v3.3) | Nút chữ phụ, ngay trên Xem tuyến phù hợp | Bỏ mọi ý đã chọn ở cả bốn nhóm | Conditional | Chỉ hiện khi có ít nhất một ý được chọn |
| 16 | E-SCR-M01-002-16 | Công tắc "Chuyển động" của Mila | **Bỏ ở v1.3**: thanh đầu trang không còn nút chuyển động; công tắc duy nhất ở màn Tài nguyên SCR-M01-004 (Spec Mascot BR-MAS-21) | — | — | — |

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
| `GROUP_DI_THEO_DOAN` | Đi theo đoàn | With a tour group |
| `INTEREST_THIEN_NHIEN_CHUP_ANH` | Thiên nhiên, chụp ảnh | Nature and photography |
| `INTEREST_TIM_HIEU` | Tìm hiểu | Learning |
| `INTEREST_KHAM_PHA` | Khám phá | Exploration |
| `GUIDE_CO_HUONG_DAN_VIEN` | Cần hướng dẫn viên | With a guide |
| `GUIDE_TU_THAM_QUAN` | Tự tham quan | Self-guided |

Chữ cố định khác của màn này:

| Tình huống | Tiếng Việt | English |
|---|---|---|
| Tiêu đề màn | Gợi ý tuyến | Route suggestions |
| Tiêu đề trang kết quả | Tuyến phù hợp | Matching routes |
| Nút lọc | Xem tuyến phù hợp | Show matching routes |
| Không có tuyến khớp | Chưa có tuyến phù hợp với lựa chọn của bạn. Bạn có thể đổi tiêu chí hoặc xem tất cả tuyến. | No route matches your choices. You can change them or see all routes. |
| Hành động khi 0 kết quả | Đổi tiêu chí · Xem tất cả tuyến | Change choices · See all routes |
| Không đọc được nguồn | Chưa tải được danh sách tuyến. Hãy kiểm tra kết nối và thử lại. | Could not load the routes. Check your connection and try again. |
| Tiêu đề nhóm | Thời gian · Đối tượng · Trải nghiệm · Hướng dẫn viên | Time · Who is going · Experience · Guide |
| Nút bỏ chọn | Bỏ chọn tất cả | Clear all |
| Mila khi mở Gợi ý tuyến (MSG-MAS-010; không nói khi quay lại từ trang kết quả, v1.11) | Bạn có bao lâu, đi cùng ai, thích gì? Để mình gợi ý cho nhé! | How long do you have, who's coming, what do you enjoy? Let me suggest some routes! |
| Mila khi có kết quả gợi ý (MSG-MAS-011) | Đây là những tuyến hợp với bạn! | Here are the routes that suit you! |
| Mila sau 2 lần không có kết quả (nút "Xem tất cả tuyến") (MSG-MAS-013) | — (chỉ minh họa từ v1.2) | — (illustration only since v1.2) |
| Chạm Mila ở form (MSG-MAS-010, spec-Mascot v1.6) | Bạn có bao lâu, đi cùng ai, thích gì? Để mình gợi ý cho nhé! | How long do you have, who's coming, what do you enjoy? Let me suggest some routes! |
| Chạm Mila lần nữa ở form (MSG-MAS-015) | Chọn xong các mục rồi bấm "Xem tuyến phù hợp" nhé! | Done choosing? Tap "Show matching routes"! |
| Chạm Mila ở trang kết quả (MSG-MAS-016) | Chạm vào một tuyến để xem chi tiết, hoặc bấm Đổi tiêu chí. | Tap a route for details, or tap Change choices. |
| Tên truy cập khi chạm Mila | Hỏi Mila | Ask Mila |
| Nút đóng bong bóng của Mila | Đóng lời nhắn | Dismiss message |
| Mila khi bị chạm liên tục (MSG-MAS-085) | Ui, chóng mặt quá! | Whoa, I'm dizzy! |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Bốn selector trống, "Xem tuyến phù hợp" bật, "Bỏ chọn tất cả" ẩn | Mở màn hình, chưa chọn |
| Selected | Có ít nhất một ý được chọn ở bất kỳ nhóm nào; "Bỏ chọn tất cả" hiện | Chạm một ý |
| Results | Trang kết quả riêng: danh sách tuyến khớp kèm tóm tắt các ý đã chọn | Lọc có ít nhất một tuyến |
| Zero result | Trang kết quả riêng: thông báo rỗng với lựa chọn đổi tiêu chí hoặc về danh mục | Lọc không có tuyến |
| Source unavailable | Thông báo không đọc được nguồn | Request nguồn lỗi |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Time/Group/Experience/Guide selector | Chạm một ý | Ý chưa chọn: thêm; ý đang chọn: bỏ. Cập nhật `RecommendationContext` local; mỗi nhóm 0..N giá trị | State update |
| 1a | Bỏ chọn tất cả | Tap | Bỏ mọi ý ở cả bốn nhóm | Form trống, focus về ý đầu tiên của nhóm Thời gian |
| 2 | Xem tuyến phù hợp | Tap | Lọc tuyến chọn được: HOẶC trong nhóm, VÀ giữa các nhóm có ý được chọn | Mở trang kết quả riêng (Results hoặc Zero result); không cuộn xuống dưới form |
| 3 | Result route card | Tap | Mở chi tiết tuyến | `SCR-M01-003` |
| 4 | Đổi tiêu chí | Tap | Quay về form, giữ lựa chọn hiện tại | Form của màn này |
| 5 | Về danh mục | Tap | Quay về danh mục | `SCR-M01-001` |
| 6 | Thanh tab | Tap Tuyến / Quét QR / Tài nguyên | Mở màn tương ứng; Quét QR bật camera ngay | `SCR-M01-001` / `SCR-M02-005` / `SCR-M01-004` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-002-001 | Mỗi nhóm `timeTag`, `groupTag`, `experienceTag`, `guideTag` nhận 0..N giá trị hợp lệ khác nhau; không chọn gì vẫn lọc được (trả mọi tuyến chọn được) | FR-M01-004, BR-M01-003 |
| SR-SCR-M01-002-002 | Ở mỗi nhóm có ý được chọn, tag của tuyến chứa ít nhất một ý đã chọn (HOẶC trong nhóm, VÀ giữa nhóm); nhóm bỏ trống không lọc | BR-M01-003, SC-M01-002 |
| SR-SCR-M01-002-003 | `timeTags` của tuyến luôn đúng một giá trị do M03 suy ra từ thời lượng; M01 dùng nguyên giá trị, không tính lại | Spec M01 §4.2 |
| SR-SCR-M01-002-004 | Không có kết quả thì hiển thị rỗng; không tự nới tiêu chí | BR-M01-003 |
| SR-SCR-M01-002-005 | Chỉ tuyến `HOAT_DONG` có `activeContentVersion` hợp lệ được xét | BR-M01-002 |
| SR-SCR-M01-002-006 | Mila chỉ hiện trong slot của màn và không che nút, vùng thông báo, toast, dialog hay nội dung; câu cố định của màn giữ nguyên; Mila không đổi hành vi hay dữ liệu của màn và không có nút ẩn | BR-MAS-01, BR-MAS-02, BR-MAS-03, BR-MAS-08, BR-MAS-11 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-004 | 0..N ý mỗi nhóm trong bốn nhóm → mọi tuyến khớp (HOẶC trong nhóm, VÀ giữa nhóm); hỗ trợ 0 kết quả; giá trị lạ bị bỏ qua |
| FR-M01-001 | Control ngôn ngữ dùng chung |
| FR-MAS-001, FR-MAS-002, FR-MAS-003, FR-MAS-009 | Mascot Mila: slot, phản ứng theo sự kiện, lời thoại theo ngôn ngữ, không đổi hành vi của màn (Spec Mascot) |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, lựa chọn đã chọn không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-002-002 | UI pattern cho selector (radio, chip, dropdown) | No | Resolved | Mỗi nhóm là một hàng chip chọn nhiều (v3.3): chạm để chọn, chạm lại để bỏ; mỗi chip là nhãn của một ô chọn (checkbox) thật trong một nhóm có tên (`role="group"`), dùng được bằng bàn phím (Space bật/tắt). |
| OQ-SCR-M01-002-003 | Thứ tự hiển thị kết quả | No | Resolved | Kết quả sắp theo tên tuyến A→Z theo ngôn ngữ đang chọn; không chấm điểm, không giới hạn số lượng (BR-M01-003). |
| OQ-SCR-M01-002-004 | Kết quả hiện ngay dưới form hay trên trang riêng | No | Resolved | Trang riêng (người dùng duyệt 2026-11-21). Vẫn là màn này, không phải màn mới. Tiêu chí chỉ ở bộ nhớ (`RecommendationContext`, HC-007): không đưa lên URL, không lưu; mở thẳng hoặc tải lại trang kết quả khi chưa đủ tiêu chí thì về form. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
