# Screen Spec: Kiểm duyệt & Phát hành

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-004` |
| Screen name | Kiểm duyệt & Phát hành |
| Module | `M03` |
| Actor | Reviewer |
| Priority | Must |
| Mockup | `screens/M03/mockups/SCR-M03-004-review.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Reviewer mở revision CHO_DUYET từ queue/list; submit của Staff không cấp quyền vào màn này.

**The user leaves when:** Quay lại SCR-M03-001 sau approve/reject. "Yêu cầu sửa" là cách trình bày rejection kèm reviewReason; submitter mở lại draft NHAP qua SCR-M03-002/003, không có workflow state mới.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-004-review.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-004-01 | User info | Header | Email, role (REVIEWER), logout | Yes | None |
| 2 | E-SCR-M03-004-02 | Screen title | Header text | "Kiểm duyệt & Phát hành" / "Review & Publish" | Yes | Non-empty |
| 3 | E-SCR-M03-004-03 | Queue list | List | Revision queue: route/checkpoint revisions with status CHO_DUYET | Yes | None |
| 4 | E-SCR-M03-004-04 | Queue item | List item | Entity type, tên, submitted by, submitted at | Yes | None |
| 5 | E-SCR-M03-004-05 | Reviewer badge | Badge | "Reviewer" badge; xác nhận current user is Reviewer | Yes | None |
| 6 | E-SCR-M03-004-06 | Revision detail panel | Panel | Chi tiết revision: submitter identity, submitted at, completeness status | Yes | None |
| 7 | E-SCR-M03-004-07 | Diff view | Comparison view | So sánh current vs. submitted revision | Conditional | Hiển thị cho existing entities |
| 8 | E-SCR-M03-004-08 | Gaps panel | Panel | Danh sách completeness gaps | Conditional | Hiển thị khi có gaps |
| 9 | E-SCR-M03-004-09 | Action: Duyệt | Button | Approve revision; bắt đầu publication nếu cần | Yes | Disabled khi self-approval hoặc gaps |
| 10 | E-SCR-M03-004-11 | Action: Từ chối | Button | Reject revision với reason | Yes | Requires reason input |
| 12 | E-SCR-M03-004-12 | Rejection reason input | Textarea | Lí do từ chối; required | Yes | Non-empty khi reject |
| 13 | E-SCR-M03-004-13 | Action: Yêu cầu sửa | Button | Cách trình bày tùy chọn của rejection để submitter sửa NHAP draft | No | Cùng rejection guard/reviewReason, không thêm contract/state |
| 14 | E-SCR-M03-004-15 | Publish result panel | Panel | Kết quả publication: version, snapshot, success/failure | Conditional | Hiển thị sau approve |
| 15 | E-SCR-M03-004-16 | Action: Đóng | Button | Quay về SCR-M03-001 | Yes | None |
| 17 | E-SCR-M03-004-17 | Self-approval blocked | Banner | "Bạn không thể duyệt revision của chính mình" | Conditional | Hiển thị khi reviewer = submitter |
| 18 | E-SCR-M03-004-18 | Publishing indicator | Spinner | "Đang phát hành..." khi publishing | Conditional | Hiển thị khi publishing |
| 19 | E-SCR-M03-004-19 | Publish success | Banner | "Phát hành thành công" + version info | Conditional | Hiển thị khi published |
| 20 | E-SCR-M03-004-20 | Publish failure | Banner | "Phát hành thất bại" + giữ CHO_DUYET state | Conditional | Hiển thị khi publish fails |
| 21 | E-SCR-M03-004-21 | Empty queue | Text | "Không có revision nào cần duyệt" | Conditional | Hiển thị khi queue empty |
| 22 | E-SCR-M03-004-22 | Reject confirmation controls | Panel/buttons | Confirm/Cancel với reviewReason | Conditional | Không reject trước explicit confirmation và server validation |
| 23 | E-SCR-M03-004-23 | Loading / permission / network / stale feedback | Panel/button | Đọc queue, unauthorized, request fails hoặc stale revision; action tải lại | Conditional | Approve/reject luôn gửi current concurrencyRevision; không auto-merge |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Queue list với items; reviewer badge | Queue loaded |
| Selected revision | Detail panel + diff view + gaps | Tap queue item |
| Self-approval blocked | Banner "Không thể duyệt revision của mình" | Reviewer = submitter |
| Has gaps | Gaps panel visible; Duyệt disabled | Completeness gaps exist |
| Ready to approve | Duyệt enabled; no gaps; reviewer ≠ submitter | Valid for approval |
| Approving | Spinner; buttons disabled | Approve in progress |
| Publishing | "Đang phát hành..." indicator | Publication in progress |
| Publish success | "Phát hành thành công" banner + version info | Publication succeeded |
| Publish failure | "Phát hành thất bại" banner; giữ CHO_DUYET | Publication failed |
| Rejecting | Dialog với reason input | Tap Từ chối |
| Rejection processing | Đang gửi reviewReason; decision controls disabled | Confirm reject |
| Request edit | Reason panel của rejection; không workflow/state riêng | Tap optional Yêu cầu sửa |
| Empty queue | Thông báo không có revision cần duyệt | Successful query, zero items |
| Loading/error/stale/permission denied | Phản hồi tương ứng; public state giữ nguyên, tải lại revision trước decision mới | Queue/decision request fails hoặc current revision thay đổi |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Queue item | Tap | Hiển thị revision detail + diff + gaps | Update detail panel |
| 2 | Duyệt | Tap | Approve revision; run publication | Show publishing; update queue |
| 3 | Từ chối | Tap | Hiện reject dialog với reason input | Show dialog |
| 4 | Confirm reject | Tap | Reject với reason; revision returns to NHAP | Update queue |
| 5 | Yêu cầu sửa | Tap | Hiện dialog; gửi yêu cầu sửa | Show dialog |
| 6 | Confirm edit request | Tap | Reject theo cùng operation với reviewReason; trả revision NHAP cho submitter sửa | Update queue; persisted review outcome |
| 7 | Đóng | Tap | Quay về SCR-M03-001 | `SCR-M03-001` |
| 8 | Hủy rejection | Tap | Đóng reason panel, không ghi decision | Selected revision |
| 9 | Tải lại | Tap | Fetch queue/detail với current revision sau lỗi/stale | Reload queue/detail |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-004-001 | Approver phải khác với revision submitter; không phải original creator | BR-M03-002 |
| SR-SCR-M03-004-002 | Approval blocked khi có completeness gaps | FR-M03-005 |
| SR-SCR-M03-004-003 | First publication: atomic publish snapshot + set activeContentVersion + set HOAT_DONG | BR-M03-004 |
| SR-SCR-M03-004-004 | Journey-affecting change: tạo new snapshot candidate → publish atomically | BR-M03-006 |
| SR-SCR-M03-004-005 | Publication failure giữ CHO_DUYET; không có partial public state | FR-M03-008 |
| SR-SCR-M03-004-006 | Rejection requires reviewReason; revision returns to NHAP status | FN-M03-005 |
| SR-SCR-M03-004-007 | Snapshot retention: current + previous + replaced < 30 days | BR-M03-008 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-003 | QR replacement approval |
| FR-M03-004 | Bilingual content revisions approval |
| FR-M03-005 | Submission/publication completeness validation |
| FR-M03-006 | Submitter/approver separation |
| FR-M03-008 | First public state/snapshot atomic publish |
| FR-M03-009 | New immutable snapshot for journey changes |
| FR-M03-007 | Reject stale review decisions, requires reload |
| FR-M03-010 | Publication backend giữ required snapshot versions; không có UI purge/cleanup |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-004-001 | Diff view: side-by-side hay inline? | No | Proposed | Đề xuất comparison hai cột khi đủ chỗ, stack/inline trên màn hẹp; breakpoint chưa chốt. Phân biệt submitted revision với current public data. |
| OQ-SCR-M03-004-002 | Notification cho submitter khi reject/request-edit | No | Proposed | Đề xuất hiển thị persisted reviewReason khi submitter mở lại draft tại SCR-M03-002/003. Không thêm notification service, email/push hoặc state Request edit từ UI; Yêu cầu sửa dùng cùng rejection operation. |
| OQ-SCR-M03-004-003 | Publication progress: step indicator hay spinner? | No | Proposed | Đề xuất progress text/indicator trong lúc publication; spinner/steps chưa chốt. Chỉ success sau atomic server result; failure giữ current public state. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
