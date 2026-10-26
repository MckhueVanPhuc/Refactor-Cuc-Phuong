# Screen Spec: Báo cáo vận hành

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-005` |
| Screen name | Báo cáo vận hành |
| Module | `M03` |
| Actor | Content Staff, Reviewer |
| Priority | Should |
| Mockup | `screens/M03/mockups/SCR-M03-005-reports.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Chọn "Báo cáo" từ SCR-M03-001 khi sync + intake/report increment được phát hành.

**The user leaves when:** Quay lại SCR-M03-001 hoặc thay đổi filters.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-005-reports.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-005-01 | User info | Header | Email, role, logout | Yes | None |
| 2 | E-SCR-M03-005-02 | Screen title | Header text | "Báo cáo vận hành" / "Operations Reports" | Yes | Non-empty |
| 3 | E-SCR-M03-005-03 | Report tab: RPT-01 | Tab | Session summary report tab | Yes | None |
| 4 | E-SCR-M03-005-04 | Report tab: RPT-02 | Tab | Checkpoint visit report tab | Yes | None |
| 5 | E-SCR-M03-005-05 | Date range input | Date picker | fromDate và toDate; mặc định 30 ngày | Yes | fromDate <= toDate |
| 6 | E-SCR-M03-005-06 | Route filter | Selector | Lọc theo route; "Tất cả" mặc định | No | None |
| 7 | E-SCR-M03-005-07 | Action: Áp dụng | Button | Refresh report với filters | Yes | None |
| 8 | E-SCR-M03-005-08 | RPT-01: Total sessions | Stat card | totalSessionCount | Yes | Integer >= 0 |
| 9 | E-SCR-M03-005-09 | RPT-01: Completed count | Stat card | completedCount | Yes | Integer >= 0 |
| 10 | E-SCR-M03-005-10 | RPT-01: Completion rate | Stat card | completedRate (0..1 displayed as %) | Yes | Decimal 0..1 |
| 11 | E-SCR-M03-005-11 | RPT-01: Abandoned count | Stat card | abandonedCount | Yes | Integer >= 0 |
| 12 | E-SCR-M03-005-12 | RPT-01: Abandonment rate | Stat card | abandonedRate (0..1 displayed as %) | Yes | Decimal 0..1 |
| 13 | E-SCR-M03-005-13 | RPT-01: Last updated | Text | Optional lastSuccessfulIngestionAt; thiếu thì ghi chưa có lần ingest thành công | Yes | Không fabricate timestamp; không đồng nhất với query time |
| 14 | E-SCR-M03-005-15 | RPT-02: Items list | List | items[] per (routeId, checkpointId) | Yes | None |
| 15 | E-SCR-M03-005-16 | RPT-02: Item row | List item | items[].routeId, checkpointId, checkpointName, sequence, uniqueSessionCount | Yes | Route name không nằm trong report contract; nếu enrich từ route metadata riêng phải giữ grouping ID và historical checkpoint label |
| 16 | E-SCR-M03-005-17 | RPT-02: Last updated | Text | Optional lastSuccessfulIngestionAt; thiếu thì ghi chưa có lần ingest thành công | Yes | Không fabricate timestamp |
| 18 | E-SCR-M03-005-18 | Zero counts | Text | "Không có dữ liệu trong kỳ này" | Conditional | Hiển thị khi results = 0 |
| 19 | E-SCR-M03-005-19 | Loading state | Spinner | "Đang tải báo cáo..." | Conditional | Hiển thị khi loading |
| 20 | E-SCR-M03-005-20 | Query failure | Banner | "Không thể tải báo cáo" khi query fails | Conditional | Hiển thị khi query fails |
| 21 | E-SCR-M03-005-21 | Invalid date range | Banner | "Khoảng ngày không hợp lệ" khi fromDate > toDate | Conditional | Hiển thị khi invalid date |
| 22 | E-SCR-M03-005-22 | Data pending note | Banner/footnote | "Báo cáo chỉ gồm phiên đã đồng bộ; dữ liệu còn trên thiết bị chưa được tính" | Yes | Giới hạn luôn được giải thích; server không biết số pending records trên điện thoại |
| 23 | E-SCR-M03-005-23 | Action: Quay lại | Button | Quay về SCR-M03-001 | Yes | None |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default (RPT-01) | Session summary với default 30-day range | Tab selected |
| Default (RPT-02) | Checkpoint visits với default 30-day range | Tab selected |
| Loading | Spinner tại report area | Query in progress |
| Has data | Report content với stats/items | Query succeeded with results |
| Zero counts | "Không có dữ liệu trong kỳ này" | Query succeeded, 0 sessions |
| Invalid date | Banner lỗi date range | fromDate > toDate |
| Query failure | Banner lỗi query | Query failed |
| Filtered by route | Report với route filter applied | Route selected in filter |
| No ingestion yet | Counts/rates bằng 0 hoặc items rỗng; chưa có last successful ingestion time | lastSuccessfulIngestionAt absent |
| Permission denied | Không hiển thị report data; yêu cầu quyền/session hợp lệ | Server authorization fails |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | RPT-01 tab | Tap | Switch to session summary report | Show RPT-01 |
| 2 | RPT-02 tab | Tap | Switch to checkpoint visit report | Show RPT-02 |
| 3 | Date picker | Select dates | Update date range | State update |
| 4 | Route filter | Select | Update route filter | State update |
| 5 | Áp dụng | Tap | Refresh report với current filters | Reload report |
| 6 | Quay lại | Tap | Quay về SCR-M03-001 | `SCR-M03-001` |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-005-001 | Reports sử dụng endedAt theo Asia/Ho_Chi_Minh timezone | BR-M03-017 |
| SR-SCR-M03-005-002 | Date range filter: fromDate và toDate supplied together; nếu absent thì mặc định 30 ngày | Report input contract |
| SR-SCR-M03-005-003 | Reports chỉ chứa synchronized sessions; unsynchronized excluded | BR-M03-017 |
| SR-SCR-M03-005-004 | RPT-02 groups by stable routeId/checkpointId; label/sequence từ record có endedAt mới nhất | BR-M03-017 |
| SR-SCR-M03-005-005 | lastSuccessfulIngestionAt optional; luôn giải thích chỉ có synchronized terminal sessions, không suy ra pending-device count từ timestamp | FR-M03-015, FR-M03-016; spec-M03 §5.1 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-015 | RPT-01 unique session counts/rates |
| FR-M03-016 | RPT-02 unique sessions per route/checkpoint |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-005-001 | Date picker: single range picker hay two separate inputs? | No | Proposed | Đề xuất from/to controls; một range picker hoặc hai inputs đều được. Pair supplied together, fromDate <= toDate; default recent 30 days theo report input contract. |
| OQ-SCR-M03-005-002 | RPT-02 display: table view hay card list? | No | Proposed | Đề xuất table hoặc cards chứa routeId/checkpointId, historical checkpointName/sequence và uniqueSessionCount; display sort không đổi stable grouping/report semantics. |
| OQ-SCR-M03-005-003 | Chart/graph visualization hay chỉ số thô? | No | Proposed | Có thể thêm chart phụ từ RPT-01 counts; có text/table tương đương. Chart type/library chưa chốt, không thêm dependency chỉ từ screen proposal. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
