# Screen Spec: Checkpoint, QR & Nội dung

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-003` |
| Screen name | Checkpoint, QR & Nội dung |
| Module | `M03` |
| Actor | Content Staff, Reviewer |
| Priority | Must; emergency actions Should |
| Mockup | `screens/M03/mockups/SCR-M03-003-checkpoint.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Mở hoặc tạo checkpoint thuộc route từ SCR-M03-002; từ SCR-M03-001 chọn tuyến rồi vào workspace của checkpoint.

**The user leaves when:** Quay lại SCR-M03-002 (route editor), hoặc submit revision.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-003-checkpoint.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-003-01 | User info | Header | Email, role, logout | Yes | None |
| 2 | E-SCR-M03-003-02 | Screen title | Header text | Tên checkpoint hiện có hoặc "Checkpoint mới" | Yes | Draft incomplete không yêu cầu tên giả |
| 3 | E-SCR-M03-003-03 | Checkpoint ID | Text (readonly) | checkpointId ổn định khi checkpoint đã được tạo | Conditional | Route phải tồn tại; không thay identity khi sửa |
| 4 | E-SCR-M03-003-04 | Revision indicator | Badge | concurrencyRevision hiện tại | Yes | None |
| 5 | E-SCR-M03-003-05 | Checkpoint name input | Input | checkpointName | Yes | Draft có thể thiếu; non-empty trước activation/publication |
| 6 | E-SCR-M03-003-06 | Sequence input | Input | sequence number; unique per route | Yes | Draft có thể thiếu; nếu có phải integer/unique cho non-archived points; required trước activation |
| 7 | E-SCR-M03-003-07 | Connectivity mode selector | Selector | ONLINE_AVAILABLE / OFFLINE_REQUIRED | Yes | Draft có thể thiếu; required trước activation; ONLINE_AVAILABLE cần field verification |
| 8 | E-SCR-M03-003-08 | Field verification toggle | Toggle | fieldVerificationConfirmed; required cho ONLINE_AVAILABLE | Conditional | Must be true trước khi ONLINE_AVAILABLE |
| 9 | E-SCR-M03-003-09 | QR list | List | Published QR set và pending draft changes hiển thị phân biệt, kèm installationLabel | Yes | Ít nhất 1 active QR cho public HOAT_DONG checkpoint; draft mới có thể chưa có QR |
| 10 | E-SCR-M03-003-10 | QR item | List item | qrIdentifier, installationLabel, status badge | Yes | None |
| 11 | E-SCR-M03-003-11 | Action: In lại QR | Button | Reprint QR giữ nguyên identity | Conditional | Disabled khi no active QR |
| 12 | E-SCR-M03-003-12 | Action: Thay QR | Button | Submit identity replacement vào review; old public QR vẫn active khi pending | Conditional | Reviewer khác submitter duyệt; atomic publish new active QR + old DA_THAY |
| 13 | E-SCR-M03-003-13 | Action: Thu hồi QR | Button | Withdrawal revision: THU_HOI terminal sau approved publication; DA_THAY chỉ dành cho replacement | Conditional | Server authorization/last active QR guard; pending draft không đổi public QR set |
| 14 | E-SCR-M03-003-14 | QR replacement reason input | Input | replacementReason; required khi thay QR | Conditional | Required khi thay QR |
| 15 | E-SCR-M03-003-15 | Content (VN) section | Section | CheckpointContent revision cho tiếng Việt | Yes | None |
| 16 | E-SCR-M03-003-16 | Content (VN) textarea | Textarea | introductionText tiếng Việt trong language-specific revision | Yes | Draft có thể thiếu; non-empty khi submit revision tiếng Việt; publication cần cả vi/en |
| 17 | E-SCR-M03-003-17 | Content (EN) section | Section | CheckpointContent revision cho tiếng Anh | Yes | None |
| 18 | E-SCR-M03-003-18 | Content (EN) textarea | Textarea | introductionText tiếng Anh trong language-specific revision | Yes | Draft có thể thiếu; non-empty khi submit revision tiếng Anh; publication cần cả vi/en |
| 19 | E-SCR-M03-003-19 | Media section | Section | Media list cho checkpoint | Yes | None |
| 20 | E-SCR-M03-003-20 | Media item | List item | mediaId, type, sourceRef, usageRightsConfirmed, isPublished | Yes | None |
| 21 | E-SCR-M03-003-21 | Action: Thêm media | Button | Upload byte vào Storage và lưu Media metadata/sourceRef theo adapter hiện hành | Yes | Kiểm tra upload/reference/rights trước publication; upload lỗi không đổi public state |
| 22 | E-SCR-M03-003-22 | Rights confirmation toggle | Toggle | usageRightsConfirmed; required cho publication | Conditional | Must be true để include trong published output |
| 23 | E-SCR-M03-003-23 | Action: Submit revision | Button | Submit revision theo loại thay đổi; route/journey revision và content language streams được phân biệt | Yes | Server submission guard; không áp full bilingual publication guard cho mọi draft submit |
| 24 | E-SCR-M03-003-25 | Action: Quay lại | Button | Quay về SCR-M03-002 | Yes | None |
| 25 | E-SCR-M03-003-26 | Validation gaps panel | Panel | Danh sách trường thiếu | Conditional | Hiển thị khi submit blocked |
| 27 | E-SCR-M03-003-27 | Stale write error | Banner | "Dữ liệu đã thay đổi" khi save fails | Conditional | Hiển thị khi concurrencyRevision mismatch |
| 28 | E-SCR-M03-003-28 | QR reprint preview | Dialog/panel | Preview QR code trước khi in | Conditional | Hiển thị trước reprint |
| 29 | E-SCR-M03-003-29 | Missing active QR warning | Banner | "Checkpoint cần ít nhất 1 QR hoạt động" | Conditional | Hiển thị khi 0 active QR |
| 30 | E-SCR-M03-003-30 | ONLINE_AVAILABLE guard | Banner | "Cần xác nhận kiểm tra thực địa" khi toggle lên | Conditional | Hiển thị khi connectivity changed to ONLINE_AVAILABLE |
| 31 | E-SCR-M03-003-31 | Action: Lưu draft | Button | Lưu checkpoint/content draft chưa hoàn chỉnh | Yes | Server domain validation/revision guard; không thay current public version |
| 32 | E-SCR-M03-003-32 | Action: Tạo / Thêm QR | Button | Sinh QR identity unique cho checkpoint, kèm installationLabel; hỗ trợ nhiều QR | Yes | Draft/new QR không mặc nhiên public; active QR set đổi phải có publication/snapshot tương ứng |
| 33 | E-SCR-M03-003-33 | QR creation / confirmation panel | Panel/control | installationLabel cho QR mới; Confirm/Cancel cho replacement hoặc withdrawal | Conditional | installationLabel required; không implicit operation; replacementReason required khi thay identity |
| 34 | E-SCR-M03-003-34 | Action: Đóng / Mở lại checkpoint | Button | HOAT_DONG → TAM_DONG cho cả hai role; TAM_DONG → HOAT_DONG chỉ Reviewer | Conditional | Đóng cần reason; mở lại cần safety/completeness/revision validation |
| 35 | E-SCR-M03-003-35 | Close/reopen confirmation | Panel/input | Lý do đóng hoặc safety acknowledgment, Confirm/Cancel | Conditional | Emergency close không vào normal review queue; đợi atomic public-state/snapshot result |
| 36 | E-SCR-M03-003-36 | Mutation / media feedback và reload | Panel/button | Loading, save success, network/permission/lifecycle/stale/last-QR/media errors; thử lại/tải lại | Conditional | Không báo thành công trước server result; không overwrite stale data |
| 37 | E-SCR-M03-003-37 | Action: Lưu trữ checkpoint | Button/control | Submit removal để checkpoint chuyển LUU_TRU sau approved publication | Conditional | Server lifecycle/authorization; replacement journey khi cần; không hard-delete |
| 38 | E-SCR-M03-003-38 | Media draft controls | Form | IMAGE/AUDIO/VIDEO, file upload, verified sourceRef và rights confirmation; published status chỉ phản ánh server result | Conditional | Allowed type và valid storage reference; rights phải true trước publication; không trực tiếp toggle public isPublished |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Form với checkpoint data; QR list; content sections | Checkpoint loaded |
| QR replacement confirmation | Panel với reason input, Confirm/Cancel | Tap Thay QR |
| QR replacement pending review | Draft replacement chờ Reviewer; old public QR vẫn active | Submit replacement succeeds |
| QR withdrawal pending | Pending withdrawal phân biệt với public QR vẫn active | Withdrawal revision submitted |
| QR withdrawn | Public status THU_HOI; QR removed from current public active set | Approved withdrawal published successfully |
| Validation gaps | Panel trường thiếu; Submit disabled | Submit blocked |
| Ready to submit | Minimum của revision type hợp lệ; full publication gaps hiển thị riêng | Server submission validation passes |
| Submitting | Spinner; buttons disabled | Submit in progress |
| Submit success | Banner "Đã gửi để duyệt" | Submit succeeds |
| Stale write | Banner lỗi; requires reload | concurrencyRevision mismatch |
| Missing QR warning | Draft cần QR trước activation hoặc operation bị block vì mất last active QR | Draft thiếu QR / mutation guard fails |
| ONLINE_AVAILABLE warning | Banner khi toggle lên mà chưa xác nhận thực địa | Connectivity changed |
| New/incomplete draft | Form checkpoint/content có thể chưa đầy đủ; QR list có thể rỗng; có lưu draft/tạo QR | New checkpoint hoặc incomplete draft |
| Last active QR blocked | Báo operation không được áp dụng; active QR/public state giữ nguyên | Withdrawal/removal vi phạm last-active-QR guard |
| Closing/reopening | Đang xử lý; chỉ cập nhật public state sau server success | Emergency/safety operation in progress |
| Closed / archived | TAM_DONG hoặc LUU_TRU; chỉ action phù hợp lifecycle/role | Server returns lifecycle state |
| Save/publication/media failure | Báo lỗi riêng, giữ published data cũ và local form khi có thể | Operation failed |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Form fields | Type/edit | Cập nhật local state | State update |
| 2 | Field verification toggle | Toggle | Update fieldVerificationConfirmed | State update |
| 3 | In lại QR | Tap | Hiện reprint preview; in QR | Show preview |
| 4 | Thay QR | Tap | Hiện QR replacement dialog với reason input | Show dialog |
| 5 | Confirm QR replacement | Tap | Submit draft replacement; old public QR giữ nguyên đến Reviewer approval và atomic publication | Show pending replacement |
| 6 | Thu hồi QR | Tap | Hiện confirmation dialog | Show dialog |
| 7 | Confirm withdrawal | Tap | Submit withdrawal revision; current public QR giữ nguyên khi pending; chỉ approved publication đổi QR set/snapshot nguyên tử sau last-active-QR validation | Pending withdrawal / THU_HOI sau publication / error |
| 8 | Add media | Tap | Mở upload/metadata controls; xác nhận upload thành công trước publication | Media draft hoặc upload error |
| 9 | Rights toggle | Toggle | Update usageRightsConfirmed | State update |
| 10 | Submit revision | Tap | Submit checkpoint revision; disable editing | Show success; state update |
| 11 | Quay lại | Tap | Quay về SCR-M03-002 | `SCR-M03-002` |
| 12 | Lưu draft | Tap | Save incomplete checkpoint/content draft với concurrencyRevision | Saved hoặc gaps/stale/error |
| 13 | Tạo / Thêm QR | Tap/confirm | Sinh stable globally unique identity và installationLabel trong draft; không tự publish live QR set | Update draft QR list |
| 14 | Đóng checkpoint | Tap/confirm | Validate reason/revision; atomic close và replacement snapshot; auto-close route chỉ nếu không còn active checkpoint | Updated checkpoint/route hoặc error |
| 15 | Mở lại checkpoint | Tap/confirm | Reviewer validate safety/completeness và publish replacement journey | Updated public state hoặc gaps/error |
| 16 | Tải lại | Tap | Đọc current revision; cảnh báo local unsaved changes trước thay form | Reload workspace |
| 17 | Lưu trữ checkpoint | Tap/submit | Submit removal revision; chỉ archive sau approval/publication | Pending removal / published LUU_TRU |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-003-001 | Active checkpoint phải có ít nhất 1 active QR; thay đổi bị block nếu active QR = 0 sau operation | BR-M03-010 |
| SR-SCR-M03-003-002 | In lại QR giữ nguyên qrIdentifier | BR-M03-009 |
| SR-SCR-M03-003-003 | Replacement pending không retire old public QR; Reviewer approval atomically publish new active QR, old DA_THAY và journey version tương ứng | FR-M03-003, BR-M03-001, BR-M03-006, BR-M03-009 |
| SR-SCR-M03-003-004 | ONLINE_AVAILABLE yêu cầu fieldVerificationConfirmed = true | BR-M03-013 |
| SR-SCR-M03-003-005 | Content revision submission cần non-empty introductionText của language stream; publication cần vi/en approved, active QR và media rights. Draft save không dùng publication guard | FR-M03-004, FR-M03-005; spec-M03 §6 |
| SR-SCR-M03-003-006 | Stale save rejected; no auto-merge | BR-M03-014, FR-M03-007 |
| SR-SCR-M03-003-007 | Editing published content tạo NHAP revision mới; approved offline-resource/journey changes tạo snapshot mới; current live content chỉ đổi sau successful publication | FR-M03-004, FR-M03-009, BR-M03-001, BR-M03-006 |
| SR-SCR-M03-003-008 | Đóng checkpoint emergency với reason cho cả hai role; publish state/snapshot nguyên tử; chỉ Reviewer mở lại sau safety/completeness; không ngắt session đang chạy | FR-M03-011, BR-M03-011, BR-M03-012 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-002 | Checkpoint stable identity/order/connectivity |
| FR-M03-003 | QR lifecycle và identity replacement approval |
| FR-M03-004 | Bilingual content revisions/media |
| FR-M03-005 | Submit/publication completeness gaps |
| FR-M03-006 | Server permissions và submitter/approver separation |
| FR-M03-007 | Reject stale writes |
| FR-M03-009 | Journey-affecting change cần immutable snapshot mới, không sửa published snapshot |
| FR-M03-011 | Close/reopen checkpoint theo role và deterministic route outcome |
| FR-M03-012 | Nội dung/QR đã published là source cho live service; consumer tại SCR-M02-001/002, không thêm admin lookup screen |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-003-001 | QR replacement approval: screen hay background? | No | Confirmed | Identity replacement vào normal review workflow SCR-M03-004; pending không đổi current public QR. Reviewer khác submitter duyệt, publish QR set và journey atomically (FR-M03-003, FR-M03-006, FR-M03-009, BR-M03-001). |
| OQ-SCR-M03-003-002 | Media upload: local storage hay cloud storage? | No | Confirmed | Theo [environment.md §11](../../../docs/architecture/environment.md#11-development-and-preview-workflow) và [physical schema](../../../data/06-physical-schema.md): quest-media private; sourceRef là bucket-relative object path, adapter resolve URL. Upload/verify bytes trước publication; không dùng public URL làm canonical Media.sourceRef. |
| OQ-SCR-M03-003-003 | Field verification confirmation: checklist hay text acknowledgment? | No | Proposed | Đề xuất checkbox/text acknowledgment; confirmation cho ONLINE_AVAILABLE là baseline BR-M03-013, cách trình bày và wording còn chờ UX review. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
