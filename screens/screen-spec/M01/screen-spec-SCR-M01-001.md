# Screen Spec: Danh mục tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M01-001` |
| Screen name | Danh mục tuyến |
| Module | `M01` |
| Actor | Visitor |
| Priority | Must |
| Mockup | `screens/M01/mockups/SCR-M01-001-catalog.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M01](../../../docs/spec/spec-M01.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Visitor mở ứng dụng hoặc chọn mục "Danh mục tuyến" từ navigation. Nếu chưa có LanguagePreference, yêu cầu chọn `vi` hoặc `en` trước khi tiếp tục vào catalog.

**The user leaves when:** Chọn một tuyến để xem chi tiết, chọn "Gợi ý tuyến", mở "Tài nguyên offline", hoặc đổi ngôn ngữ.

## 2. Mockup

Mockup: `screens/M01/mockups/SCR-M01-001-catalog.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M01-001-01 | Language selector | Header control | `vi` / `en`; đọc từ LanguagePreference; đổi được khi offline | Yes | Chỉ chấp nhận `vi` hoặc `en` |
| 2 | E-SCR-M01-001-02 | Screen title | Header text | "Danh mục tuyến" / "Route Catalog" theo ngôn ngữ | Yes | None |
| 3 | E-SCR-M01-001-03 | Route list | List | Published Route từ M03; chỉ tuyến `HOAT_DONG` có snapshot đã phát hành hợp lệ | Yes | Không coi cached view là xác nhận current; kiểm tra source trước online Start |
| 4 | E-SCR-M01-001-04 | Route card | List item | Tên tuyến (name.vi/en), mô tả (description.vi/en), khoảng cách, thời lượng, độ khó, nhãn tags | Yes | Hiển thị đúng ngôn ngữ đã chọn |
| 5 | E-SCR-M01-001-05 | Offline indicator | Badge | Suy ra từ JourneySnapshot/package manifest nếu có; Published Route không chứa connectivity của checkpoint | No | Không suy đoán khi chưa đọc được manifest |
| 6 | E-SCR-M01-001-06 | Stale data label | Banner | "Dữ liệu cũ" khi source unavailable nhưng có local view; giải thích ngay trong nội dung banner | Conditional | Bao gồm source failure dù browser báo online |
| 7 | E-SCR-M01-001-07 | Action: Gợi ý tuyến | Button | Chuyển đến SCR-M01-002 | Yes | None |
| 8 | E-SCR-M01-001-08 | Action: Xem chi tiết | List item tap | Mở SCR-M01-003 cho tuyến đã chọn | Yes | Chỉ mở tuyến hợp lệ |
| 9 | E-SCR-M01-001-09 | Action: Tài nguyên offline | Button | Mở SCR-M01-004 | Yes | None |
| 10 | E-SCR-M01-001-10 | Action: Làm mới / Thử lại | Button | Refresh published catalog; pull-to-refresh là cách tương tác bổ sung nếu được chọn | Yes | Không xóa local view khi request lỗi |
| 11 | E-SCR-M01-001-11 | Action: Xem nội dung QR | Button | Mở SCR-M02-001 ở free visitor mode nếu capability được phát hành | Conditional | Không tạo handoff/session/visit; FR-M02-019 |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Danh sách tuyến HOAT_DONG đầy đủ, ngôn ngữ đã chọn | Source available, preference set |
| Language required | Selector `vi`/`en`; chưa tiếp tục vào catalog | Chưa có LanguagePreference |
| Empty | Thông báo "Không có tuyến nào đang hoạt động" / "No active routes" | Không có tuyến HOAT_DONG |
| Loading | Skeleton hoặc spinner tại danh sách tuyến | Đang tải dữ liệu từ M03 |
| Error | Thông báo lỗi kết nối; giữ local view nếu có | Source unavailable, network failure |
| Stale | Banner "Dữ liệu cũ" trên local view; không claim dữ liệu current | Source unavailable và có cached route list |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Language selector | Tap / change | Cập nhật LanguagePreference, chuyển ngôn ngữ UI ngay lập tức, không thay đổi package/session | Stays; label/state update |
| 2 | Route card | Tap | Chọn tuyến, mở chi tiết với route đó | `SCR-M01-003` |
| 3 | Gợi ý tuyến button | Tap | Chuyển đến màn gợi ý | `SCR-M01-002` |
| 4 | Tài nguyên offline button | Tap | Chuyển đến quản lý offline | `SCR-M01-004` |
| 5 | Làm mới / Thử lại | Tap; pull-to-refresh nếu được chọn | Refresh danh sách từ M03; giữ local view và báo lỗi nếu source unavailable | Reload list |
| 6 | Stale data label | Read | Giải thích dữ liệu cũ ngay trong banner, không phụ thuộc tooltip | Stays |
| 7 | Xem nội dung QR | Tap | Mở scanner free visitor khi capability được phát hành | `SCR-M02-001` (free mode) |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M01-001-001 | Chỉ hiển thị tuyến có `status = HOAT_DONG` và `activeContentVersion` không null | FR-M01-002 |
| SR-SCR-M01-001-002 | Khi source unavailable, giữ local view cũ và hiển thị nhãn "dữ liệu cũ"; không tự động claim dữ liệu là current | FR-M01-002 |
| SR-SCR-M01-001-003 | Language change không thay đổi package state hoặc session state | BR-M01-001 |
| SR-SCR-M01-001-004 | Chỉ active route mới xuất hiện trong danh sách; route đã đóng/archived không hiển thị | BR-M01-002 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M01-001 | Language selector là control gốc trong shell M01; visitor chọn/đổi `vi`/`en` |
| FR-M01-002 | Catalog hiển thị route HOAT_DONG; source refresh loại bỏ tuyến không khả dụng |
| FR-M01-003 | Route metadata hiển thị theo ngôn ngữ đã chọn |
| FR-M01-012 | Khi refresh thành công phát hiện closure, revoke current context của tuyến; không cần biết M02 đã consumed hay chưa, không ngắt session đã tạo |
| FR-M02-019 | Entry tùy chọn cho free visitor; không tạo progress/reporting data |

## 8. Responsive and accessibility notes

- Định hướng mobile-first: ưu tiên nội dung/action chính, wrap text/tags và stack panels theo chiều rộng thực tế; tránh chiều rộng cố định gây tràn ngang. 360px, 768px và 1280px là kích thước tham khảo để review, không phải hard breakpoint hoặc điều kiện bật/tắt tính năng.
- Review text dài vi/en, loading/empty/error, phóng to chữ, focus và thao tác một tay trên điện thoại. Bố cục cuối cùng cần prototype/usability review trước sign-off.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M01-001-001 | Cơ chế pull-to-refresh và cache invalidation cụ thể | No | Proposed | Có thể dùng cache display với background refresh và action làm mới rõ ràng. FR-M01-002 bắt buộc giữ local view khi source unavailable, ghi stale và chỉ xử lý closure sau successful refresh; cache policy cụ thể chưa chốt. |
| OQ-SCR-M01-001-002 | Kích thước trang tối thiểu cho mobile breakpoint | No | Proposed | Mobile-first, co giãn theo content; kích thước review tham khảo tại §8, chưa chốt minimum/breakpoints. |
| OQ-SCR-M01-001-003 | Chiến lược i18n cho static strings (không phải content tuyến) | No | Proposed | LanguagePreference vi/en là baseline (FR-M01-001). Đề xuất bundle static locale strings; fallback và cấu trúc locale cần xác nhận, không tự synthesize public content thiếu. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
