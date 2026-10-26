# Screen Spec: Biên tập tuyến & Thứ tự checkpoint

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-002` |
| Screen name | Biên tập tuyến & Thứ tự checkpoint |
| Module | `M03` |
| Actor | Content Staff, Reviewer |
| Priority | Must |
| Mockup | `screens/M03/mockups/SCR-M03-002-route-editor.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Tạo route mới hoặc mở revision từ SCR-M03-001.

**The user leaves when:** Quay lại SCR-M03-001 (sau khi save hoặc cancel), hoặc mở checkpoint workspace (SCR-M03-003) để biên tập checkpoint.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-002-route-editor.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-002-01 | User info | Header | Email, role, logout | Yes | None |
| 2 | E-SCR-M03-002-02 | Screen title | Header text | "Biên tập tuyến" / "Route Editor" | Yes | Non-empty |
| 3 | E-SCR-M03-002-03 | Route ID | Text (readonly) | routeId (nếu đã tồn tại) | Conditional | Hiển thị khi editing existing |
| 4 | E-SCR-M03-002-04 | Revision indicator | Badge | concurrencyRevision hiện tại | Yes | None |
| 5 | E-SCR-M03-002-05 | Name (VN) input | Input | Tên tiếng Việt; route.name.vi | Yes | Có thể thiếu trong draft; bilingual completeness bắt buộc khi publish |
| 6 | E-SCR-M03-002-06 | Name (EN) input | Input | Tên tiếng Anh; route.name.en | Yes | Có thể thiếu trong draft; bilingual completeness bắt buộc khi publish |
| 7 | E-SCR-M03-002-07 | Description (VN) input | Textarea | Mô tả tiếng Việt; route.description.vi | Yes | Có thể thiếu trong draft; non-empty khi publish |
| 8 | E-SCR-M03-002-08 | Description (EN) input | Textarea | Mô tả tiếng Anh; route.description.en | Yes | Có thể thiếu trong draft; non-empty khi publish |
| 9 | E-SCR-M03-002-09 | Safety Warning (VN) input | Input | Cảnh báo an toàn tiếng Việt (optional) | No | Both-or-none với EN |
| 10 | E-SCR-M03-002-10 | Safety Warning (EN) input | Input | Cảnh báo an toàn tiếng Anh (optional) | No | Both-or-none với VN |
| 11 | E-SCR-M03-002-11 | Distance input | Input | Khoảng cách (km); distanceKm | Yes | Draft có thể thiếu; khi có phải > 0, đầy đủ trước publish |
| 12 | E-SCR-M03-002-12 | Duration input | Input | Thời lượng (phút); durationMin | Yes | Draft có thể thiếu; khi có phải integer > 0, đầy đủ trước publish |
| 13 | E-SCR-M03-002-13 | Difficulty selector | Selector | NHE / TRUNG_BINH / KHO | Yes | Draft có thể chưa chọn; nếu có chỉ allowed enum, required khi publish |
| 14 | E-SCR-M03-002-14 | Time tags | Multi-selector | TIME_NGAN / TIME_VUA / TIME_DAI | Yes | Chỉ allowed enums; ít nhất 1 khi publish, draft có thể thiếu |
| 15 | E-SCR-M03-002-15 | Group tags | Multi-selector | GROUP_CA_NHAN_NGUOI_LON / GROUP_GIA_DINH_CO_TRE / GROUP_CAN_DE_DANG | Yes | Chỉ allowed enums; ít nhất 1 khi publish, draft có thể thiếu |
| 16 | E-SCR-M03-002-16 | Experience tags | Multi-selector | INTEREST_THIEN_NHIEN_CHUP_ANH / INTEREST_TIM_HIEU / INTEREST_KHAM_PHA | Yes | Chỉ allowed enums; ít nhất 1 khi publish, draft có thể thiếu |
| 17 | E-SCR-M03-002-17 | Checkpoint list | List (sortable) | Danh sách checkpoints với sequence, checkpointName, connectivityMode | Yes | Ordered by sequence |
| 18 | E-SCR-M03-002-18 | Checkpoint item | List item | Sequence number, name, connectivity badge, tap to open | Yes | None |
| 19 | E-SCR-M03-002-19 | Action: Thêm checkpoint | Button | Tạo checkpoint mới và mở SCR-M03-003 | Yes | None |
| 20 | E-SCR-M03-002-20 | Action: Sắp xếp checkpoint | Reorder control | Sửa sequence trong revision; number input hoặc drag UI còn là đề xuất | Yes | Integer và unique trong route cho non-archived checkpoints; không mutate published snapshot |
| 21 | E-SCR-M03-002-21 | Action: Mở checkpoint | Tap item | Mở SCR-M03-003 với checkpoint đã chọn | Yes | None |
| 22 | E-SCR-M03-002-23 | Action: Lưu draft | Button | Save route draft (có thể incomplete) | Yes | Disabled khi concurrent operation |
| 23 | E-SCR-M03-002-24 | Action: Submit | Button | Submit revision để duyệt theo submission minimum từ server | Yes | Không đồng nhất incomplete publication với failed submission; ít nhất 1 checkpoint và minimum draft fields |
| 24 | E-SCR-M03-002-25 | Action: Quay lại | Button | Quay về SCR-M03-001; có thể mất unsaved changes | Yes | Confirm if unsaved |
| 25 | E-SCR-M03-002-26 | Validation gaps panel | Panel | Gaps từ server; phân biệt submission blockers và publication gaps | Conditional | Không tự thêm required fields vào submission minimum |
| 27 | E-SCR-M03-002-27 | Stale write error | Banner | "Dữ liệu đã thay đổi, vui lòng tải lại" khi save fails | Conditional | Hiển thị khi concurrencyRevision mismatch |
| 28 | E-SCR-M03-002-28 | Submit confirmation | Dialog | "Gửi để duyệt?" kèm summary | Conditional | Hiển thị trước submit |
| 29 | E-SCR-M03-002-29 | Action: Tải lại | Button | Fetch current revision sau stale write | Conditional | Cảnh báo unsaved changes trước khi thay local form |
| 30 | E-SCR-M03-002-30 | Loading / network / permission feedback | Panel | Đang đọc/ghi, lỗi mạng hoặc action bị từ chối | Conditional | Không báo saved/submitted nếu server chưa xác nhận |
| 31 | E-SCR-M03-002-31 | Review outcome | Panel | Rejection reviewReason và revision NHAP được trả về để sửa | Conditional | Dùng persisted review outcome; không giả định notification service |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Form với route data (nếu existing) hoặc trống (new); checkpoint list | Route loaded |
| Draft | Form có thể incomplete; nút Lưu draft enabled | Saving as draft |
| Validation gaps | Panel liệt kê trường thiếu; nút Submit disabled | Submit blocked |
| Ready to submit | Đủ minimum draft fields và ít nhất 1 checkpoint; publication gaps có thể vẫn tồn tại | Submission validation passes |
| Submitting | Spinner; buttons disabled | Submit in progress |
| Submit success | Banner "Đã gửi để duyệt"; chuyển sang read-only | Submit succeeds |
| Save success | Toast "Đã lưu"; revision updated | Save succeeds |
| Stale write | Banner lỗi; requires reload | concurrencyRevision mismatch |
| Pending review | Read-only view với nhãn "Đang chờ duyệt" | Submitted successfully |
| Checkpoint editing | Navigating to SCR-M03-003 | Tap checkpoint item |
| Rejected / returned for edit | Draft NHAP và reviewReason; public version giữ nguyên | Reviewer rejects submitted revision |
| Loading/error/permission denied | Phản hồi tương ứng; local form còn trong memory khi save lỗi | Fetch/save/submit fails hoặc access denied |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Form fields | Type/edit | Cập nhật local state | State update |
| 2 | Time/Group/Experience tags | Toggle | Update tag selection | State update |
| 3 | Sắp xếp checkpoint | Edit sequence; drag nếu được chọn | Sửa local revision; validate uniqueness trước lưu/submit | Update draft order |
| 4 | Thêm checkpoint | Tap | Tạo checkpoint mới và mở SCR-M03-003 | `SCR-M03-003` (new) |
| 5 | Mở checkpoint | Tap item | Mở SCR-M03-003 với checkpoint đó | `SCR-M03-003` |
| 6 | Lưu draft | Tap | Save incomplete route; update revision | Show success toast |
| 7 | Submit | Tap | Hiện confirmation; submit revision | Show confirmation |
| 8 | Confirm submit | Tap | Submit revision → CHO_DUYET; disable editing | Show success; state update |
| 9 | Quay lại | Tap | Quay về SCR-M03-001 | `SCR-M03-001` |
| 10 | Reload (stale) | Tap | Tải lại route data với current revision | Reload form |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-002-001 | Staff có thể lưu incomplete draft; submit bị blocked khi thiếu required fields | BR-M03-001, FR-M03-005 |
| SR-SCR-M03-002-002 | Submission dùng minimum draft fields + ít nhất 1 checkpoint; approval/publication mới yêu cầu bilingual route fields, valid tags và publishable checkpoint(s). UI hiển thị guard/gap từ server | FR-M03-005; spec-M03 US-M03-01 |
| SR-SCR-M03-002-003 | Submit tạo revision với concurrencyRevision tăng; stale write bị rejected | BR-M03-014, FR-M03-007 |
| SR-SCR-M03-002-004 | Public version giữ nguyên khi chờ duyệt; editing không affect published data | BR-M03-001 |
| SR-SCR-M03-002-005 | Thay đổi checkpoint sequence được phản ánh trong submitted revision | FR-M03-002 |
| SR-SCR-M03-002-006 | Approver phải khác với revision submitter | BR-M03-002 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-001 | Route drafts/metadata/lifecycle |
| FR-M03-002 | Checkpoint stable identity/order/connectivity |
| FR-M03-005 | Submit/publication completeness gaps |
| FR-M03-006 | Submitter/approver separation |
| FR-M03-007 | Reject stale writes |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-002-001 | Checkpoint reorder: drag-drop UI hay stepper/edit number? | No | Proposed | Đề xuất sequence number input có keyboard support; drag/drop tùy chọn. Validate integer/unique sequence trong revision; không mutate published journey. |
| OQ-SCR-M03-002-002 | Validation feedback: inline vs. summary panel? | No | Proposed | Đề xuất inline errors và gaps summary; phân biệt submission minimum với full publication guard, không tự thêm field bắt buộc. |
| OQ-SCR-M03-002-003 | Unsaved changes confirmation khi navigate away | No | Proposed | Đề xuất in-app unsaved-changes guard; beforeunload chỉ bổ sung theo browser support. Không cam kết custom CTA/text của browser-native dialog hoặc khôi phục draft qua reload. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
