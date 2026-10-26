# Screen Spec: Quản trị tuyến

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-001` |
| Screen name | Quản trị tuyến |
| Module | `M03` |
| Actor | Content Staff, Reviewer |
| Priority | Must; emergency actions Should |
| Mockup | `screens/M03/mockups/SCR-M03-001-route-admin.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Sau SCR-M03-000 khi identity + AdminAccount đã validated.

**The user leaves when:** Mở route editor (SCR-M03-002), mở checkpoint workspace (SCR-M03-003), mở review queue (SCR-M03-004, Reviewer), mở reports (SCR-M03-005), mở accounts (SCR-M03-006, Reviewer), hoặc đăng xuất.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-001-route-admin.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-001-01 | User info | Header | Email người dùng, role (CONTENT_STAFF / REVIEWER), logout | Yes | None |
| 2 | E-SCR-M03-001-02 | Screen title | Header text | "Quản trị tuyến" / "Route Administration" | Yes | None |
| 3 | E-SCR-M03-001-03 | Search/filter input | Input | Tìm tuyến theo tên | No | None |
| 4 | E-SCR-M03-001-04 | Status filter | Selector | Lọc theo status: Tất cả / NHAP / CHO_DUYET / HOAT_DONG / TAM_DONG / LUU_TRU | No | None |
| 5 | E-SCR-M03-001-05 | Route list | List | Danh sách routes với metadata, status, revision state | Yes | None |
| 6 | E-SCR-M03-001-06 | Route card | List item | Tên tuyến (name.vi/en), status badge, concurrencyRevision, thông tin lifecycle | Yes | None |
| 7 | E-SCR-M03-001-07 | Status badge | Badge | NHAP (draft xám), CHO_DUYET (vàng), HOAT_DONG (xanh), TAM_DONG (đỏ), LUU_TRU (xám) | Yes | None |
| 8 | E-SCR-M03-001-08 | Action: Tạo tuyến mới | Button | Tạo draft route mới | Yes | None |
| 9 | E-SCR-M03-001-09 | Action: Mở tuyến | List item tap | Mở SCR-M03-002 với route đã chọn | Yes | None |
| 10 | E-SCR-M03-001-10 | Action: Đóng tuyến | Button | Emergency close: HOAT_DONG → TAM_DONG; cả hai role được đóng với lý do | Conditional | Chỉ tuyến HOAT_DONG; server kiểm tra revision/lifecycle |
| 11 | E-SCR-M03-001-11 | Action: Mở lại tuyến | Button | Reopen: TAM_DONG → HOAT_DONG; CHỈ Reviewer | Conditional | Chỉ cho TAM_DONG và Reviewer |
| 12 | E-SCR-M03-001-12 | Action: Review queue | Button | Mở SCR-M03-004 | Conditional | Reviewer; Staff theo dõi draft/review outcome qua route editor |
| 13 | E-SCR-M03-001-13 | Action: Báo cáo | Button | Mở SCR-M03-005 | Yes | Hiển thị cho cả hai role |
| 14 | E-SCR-M03-001-14 | Action: Tài khoản | Button | Mở SCR-M03-006 | Conditional | CHỉ Reviewer |
| 15 | E-SCR-M03-001-15 | Loading state | Spinner | Loading khi fetch routes | Conditional | Hiển thị khi loading |
| 16 | E-SCR-M03-001-16 | Empty state | Text | "Chưa có tuyến nào" khi không có route | Conditional | Hiển thị khi empty |
| 17 | E-SCR-M03-001-17 | Permission denied | Banner | "Bạn không có quyền thực hiện thao tác này" khi action không thuộc role | Conditional | Hiển thị khi unauthorized action |
| 18 | E-SCR-M03-001-18 | Network error | Banner | "Lỗi kết nối" khi fetch fails | Conditional | Hiển thị khi network error |
| 19 | E-SCR-M03-001-19 | Close confirmation dialog | Dialog | "Xác nhận đóng tuyến" + reason input + confirmation | Conditional | Hiển thị trước khi đóng |
| 20 | E-SCR-M03-001-20 | Reopen confirmation dialog | Dialog | "Xác nhận mở lại tuyến" + safety confirmation | Conditional | Hiển thị trước khi reopen |
| 21 | E-SCR-M03-001-21 | Close reason / safety confirmation | Input/control | Lý do đóng hoặc xác nhận đã kiểm tra an toàn khi mở lại | Conditional | Lý do đóng non-empty; reopen cần safety confirmation và completeness validation |
| 22 | E-SCR-M03-001-22 | Mutation failure / reload | Banner/button | Lifecycle conflict, stale revision, publication failure; tải lại trước mutation mới | Conditional | Không update UI thành công trước server result |
| 23 | E-SCR-M03-001-23 | Action: Lưu trữ tuyến | Button/control | Chuyển TAM_DONG → LUU_TRU theo quyền backend; không hard-delete/history cleanup | Conditional | Lifecycle và authorization được kiểm tra server-side; xem OQ-SCR-M03-001-004 |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Route list đầy đủ; navigation actions visible | Authenticated + routes loaded |
| Loading | Spinner tại list | Đang fetch routes |
| Empty | "Chưa có tuyến nào" | Không có routes |
| Filtered | List đã lọc theo status/search | Filter applied |
| Close confirmation | Dialog yêu cầu reason và confirmation | Staff/Reviewer tap Đóng |
| Reopen confirmation | Dialog yêu cầu safety confirmation | Reviewer tap Mở lại |
| Close success | Banner "Tuyến đã được đóng" | Close completes |
| Reopen success | Banner "Tuyến đã được mở lại" | Reopen completes |
| Permission denied | Banner "Không có quyền" | Unauthorized action attempt |
| Network error | Báo lỗi và action thử tải lại; không cam kết dữ liệu admin current | Fetch/mutation request fails |
| Lifecycle/stale conflict | Báo không áp dụng thao tác; tải lại trạng thái/revision | Server rejects stale/lifecycle mutation |
| Close/reopen failure | Không báo thành công, public state cũ giữ nguyên | Atomic public-state publication fails |
| Archived | LUU_TRU; không có reopen/Start mới hoặc hard-delete action | Route đã lưu trữ |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Search input | Type | Filter routes by name | Update list |
| 2 | Status filter | Select | Filter routes by status | Update list |
| 3 | Tạo tuyến mới | Tap | Tạo route draft mới và mở SCR-M03-002 | `SCR-M03-002` (new) |
| 4 | Mở tuyến | Tap route card | Mở SCR-M03-002 với route đã chọn | `SCR-M03-002` |
| 5 | Đóng tuyến | Tap | Hiện close confirmation dialog | Show dialog |
| 6 | Confirm close | Tap | Server validate reason/revision; atomic publish TAM_DONG không qua normal review queue | Update card khi thành công, nếu lỗi giữ public state cũ |
| 7 | Mở lại tuyến | Tap | Hiện reopen confirmation dialog | Show dialog |
| 8 | Confirm reopen | Tap | Reviewer; validate safety/completeness/revision, publish HOAT_DONG | Update card khi thành công hoặc gaps/error |
| 9 | Review queue | Tap | Mở SCR-M03-004 | `SCR-M03-004` |
| 10 | Báo cáo | Tap | Mở SCR-M03-005 | `SCR-M03-005` |
| 11 | Tài khoản | Tap | Mở SCR-M03-006 (Reviewer only) | `SCR-M03-006` |
| 12 | Logout | Tap | Clear session, redirect to SCR-M03-000 | `SCR-M03-000` |
| 13 | Tải lại | Tap | Fetch current route state/revision trước thử mutation mới | Reload list |
| 14 | Lưu trữ tuyến | Tap/confirm | Yêu cầu transition TAM_DONG → LUU_TRU theo server authorization | Update card hoặc denied/conflict |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-001-001 | Route lifecycle: NHAP → CHO_DUYET → HOAT_DONG → TAM_DONG → LUU_TRU; reject returns CHO_DUYET → NHAP | BR-M03-001, Entity Route lifecycle |
| SR-SCR-M03-001-002 | Cả hai role đóng tuyến HOAT_DONG với reason; emergency operation không vào review queue, chỉ thành công sau atomic public publication | FR-M03-011; spec-M03 US-M03-04 |
| SR-SCR-M03-001-003 | Chỉ REVIEWER được reopen sau safety confirmation | BR-M03-012 |
| SR-SCR-M03-001-004 | Không action nào cố gắng stop hoặc notify running M02 sessions | BR-M03-012 |
| SR-SCR-M03-001-005 | Server-side permissions enforced trên mọi action; role UI không thay authorization | FR-M03-006; spec-M03 §2.1 |
| SR-SCR-M03-001-006 | Stale save bị rejected và requires reload; no auto-merge | BR-M03-014 |
| SR-SCR-M03-001-007 | Admin routes, lifecycle và revision state online (không có offline caching) | FN-M03-001 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-001 | Route drafts/metadata/lifecycle management |
| FR-M03-007 | Reject stale administrative writes |
| FR-M03-006 | Server permissions và submitter/approver separation |
| FR-M03-011 | Close/reopen theo role |
| FR-M03-013 | Account management và role display |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-001-001 | Close/reopen confirmation flow chi tiết (modal vs. step-by-step)? | No | Proposed | Đề xuất confirmation panel với reason khi đóng và safety acknowledgment khi mở lại; modal/inline còn chờ review. Emergency close không vào review queue, reopen chỉ Reviewer và cần completeness validation. |
| OQ-SCR-M03-001-002 | Safety confirmation cho reopen: checklist hay text acknowledgment? | No | Proposed | Đề xuất checkbox/text acknowledgment cho safety confirmation; nội dung và cách trình bày chưa chốt, không thay thế field verification ngoài ứng dụng. |
| OQ-SCR-M03-001-003 | Reviewer queue badge: số items pending | No | Proposed | Có thể hiển thị pending count nếu backend queue cung cấp; màu, refresh/polling và placement chưa chốt. Queue entry tại màn này dành cho Reviewer. |

| OQ-SCR-M03-001-004 | Role nào được archive route? | Yes, for archive UI | Open | [NEEDS CLARIFICATION: spec-M03 §6 cho TAM_DONG → LUU_TRU nhưng §2.1 chưa gán role cho archive; function-list-M03 SF-M03-001-06 ghi Reviewer.] Không tự canonicalize quyền từ screen; archive UI chỉ theo authorization đã xác nhận. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
