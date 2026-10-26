# Screen Spec: Gợi ý tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-002` |
| Screen name | Gợi ý tuyến |
| Module | `M01` |
| Actor | Visitor |
| Priority | Should |
| Mockup | `screens/M01/mockups/SCR-M01-002-recommend.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Visitor chọn "Gợi ý tuyến" từ SCR-M01-001.

**The user leaves when:** Chọn một tuyến trong kết quả để xem chi tiết, hoặc quay lại danh mục tuyến.

## 2. Mockup

Mockup: `screens/M01/mockups/SCR-M01-002-recommend.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-002-01 | Language selector | Header control | `vi` / `en`; đọc từ LanguagePreference | Yes | Chỉ chấp nhận `vi` hoặc `en` |
| 2 | E-SCR-M01-002-02 | Screen title | Header text | "Gợi ý tuyến" / "Route Recommendations" theo ngôn ngữ | Yes | None |
| 3 | E-SCR-M01-002-03 | Time tag selector | Selector | Chọn 1 giá trị: `TIME_NGAN`, `TIME_VUA`, `TIME_DAI` | Yes | Exactly 1 selection required |
| 4 | E-SCR-M01-002-04 | Group tag selector | Selector | Chọn 1 giá trị: `GROUP_CA_NHAN_NGUOI_LON`, `GROUP_GIA_DINH_CO_TRE`, `GROUP_CAN_DE_DANG` | Yes | Exactly 1 selection required |
| 5 | E-SCR-M01-002-05 | Experience tag selector | Selector | Chọn 1 giá trị: `INTEREST_THIEN_NHIEN_CHUP_ANH`, `INTEREST_TIM_HIEU`, `INTEREST_KHAM_PHA` | Yes | Exactly 1 selection required |
| 6 | E-SCR-M01-002-06 | Action: Tìm tuyến | Button | Chạy deterministic filter trên active routes | Yes | Disabled khi thiếu tag |
| 7 | E-SCR-M01-002-07 | Action: Sửa tiêu chí | Button | Quay lại selectors, giữ lựa chọn để visitor sửa | Yes | Không tự nới lỏng tiêu chí |
| 8 | E-SCR-M01-002-08 | Result list | List | Tuyến khớp tất cả 3 tag đã chọn | Conditional | Hiển thị sau khi filter |
| 9 | E-SCR-M01-002-09 | Result card | List item | Tên tuyến, mô tả, thông tin cơ bản | Conditional | None |
| 10 | E-SCR-M01-002-10 | Action: Xem chi tiết | List item tap | Mở SCR-M01-003 cho tuyến đã chọn | Conditional | None |
| 11 | E-SCR-M01-002-11 | Action: Quay lại | Button | Trở về SCR-M01-001 | Yes | None |
| 12 | E-SCR-M01-002-12 | Zero result message | Text | "Không có tuyến nào phù hợp với tiêu chí của bạn" / "No routes match your criteria" | Conditional | Hiển thị khi 0 kết quả |
| 13 | E-SCR-M01-002-13 | Criteria summary | Text | Hiển thị 3 tag đã chọn dạng text | Conditional | Hiển thị sau khi filter |
| 14 | E-SCR-M01-002-14 | Source status / retry | Banner/control | Loading, source error hoặc local view cũ; action thử tải lại route source | Conditional | Không trình bày lỗi source như zero-result |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Ba selector trống, nút "Tìm tuyến" disabled | Chưa chọn đủ tag |
| Tag selected | Một hoặc nhiều tag đã chọn, hiển thị label | Visitor chọn ít nhất 1 tag |
| Ready | Tất cả 3 tag đã chọn, nút "Tìm tuyến" enabled | Đủ tag |
| Results | Danh sách tuyến khớp hoặc thông báo zero-result | Filter submitted |
| Zero result | Thông báo không tìm thấy kèm nút sửa tiêu chí | Filter submitted, 0 routes |
| Has results | Route cards với tên/mô tả | Filter submitted, N > 0 routes |
| Loading | Báo đang đọc route source; không hiển thị kết quả của tiêu chí cũ như kết quả mới | Source/filter đang xử lý |
| Source unavailable | Báo lỗi; nếu dùng local view thì ghi rõ dữ liệu cũ; có thử lại hoặc quay về catalog | Source request fails |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Time tag | Tap option | Select/deselect; exactly 1 required | State update |
| 2 | Group tag | Tap option | Select/deselect; exactly 1 required | State update |
| 3 | Experience tag | Tap option | Select/deselect; exactly 1 required | State update |
| 4 | Tìm tuyến | Tap | Filter active routes với exact match 3 tags | Show results or zero-result |
| 5 | Sửa tiêu chí | Tap | Quay lại selectors với lựa chọn cũ; kết quả chưa được tính lại | Return to criteria state |
| 6 | Result card | Tap | Chọn tuyến, mở chi tiết | `SCR-M01-003` |
| 7 | Quay lại | Tap | Trở về danh mục | `SCR-M01-001` |
| 8 | Language selector | Change | Cập nhật LanguagePreference qua control M01; đổi ngôn ngữ UI/content có sẵn | Stays |
| 9 | Thử lại source | Tap | Đọc lại route source; chỉ lọc khi đủ ba giá trị hợp lệ | Reload source/results |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-002-001 | Phải chọn đúng 1 giá trị từ mỗi nhóm tag (timeTag, groupTag, experienceTag) trước khi filter | FR-M01-004 |
| SR-SCR-M01-002-002 | Matching là set containment: route phải chứa TẤT CẢ 3 tag đã chọn | BR-M01-003 |
| SR-SCR-M01-002-003 | Zero-result KHÔNG tự động nới lỏng tiêu chí; visitor phải sửa thủ công | BR-M01-003 |
| SR-SCR-M01-002-004 | Không AI scoring/ranking hoặc sort theo relevance; trả về mọi tuyến khớp, 0..N, không business cap | FR-M01-004; spec-M01 §1.3, §4.2 |
| SR-SCR-M01-002-005 | Filter chỉ áp dụng trên routes có `status = HOAT_DONG` và `activeContentVersion` | BR-M01-002 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-004 | Exact-match filter trên 3 nhóm tag; zero-result được hiển thị mà không nới lỏng |
| FR-M01-002 | Filter áp dụng trên active routes |
| FR-M01-003 | Tên tuyến/description hiển thị theo ngôn ngữ đã chọn |
| FR-M01-001 | Language selector gọi LanguagePreference |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, loading/empty/error, phóng to chữ, focus và thao tác một tay trên điện thoại. Bố cục cuối cùng cần prototype/usability review trước sign-off.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-002-001 | UI pattern cho single-select tag groups (radio buttons, chips, dropdown?) | No | Proposed | Đề xuất single-select chips hoặc radio per group. Bắt buộc exactly one valid value mỗi nhóm trước matching; cách deselect còn chờ UX review. |
| OQ-SCR-M01-002-002 | Animation/transition khi hiển thị results | No | Proposed | Có thể dùng transition nhẹ, tôn trọng reduced motion; timing chưa chốt. Results chỉ đổi sau filter với đủ ba giá trị, không auto-run khi thiếu criteria. |
| OQ-SCR-M01-002-003 | Kích thước trang tối thiểu | No | Proposed | Mobile-first, co giãn theo content; xem §8, chưa chốt minimum/breakpoints. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
