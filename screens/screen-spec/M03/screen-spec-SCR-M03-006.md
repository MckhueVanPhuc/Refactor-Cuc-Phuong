# Screen Spec: Tài khoản & Vai trò

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-006` |
| Screen name | Tài khoản & Vai trò |
| Module | `M03` |
| Actor | Reviewer |
| Priority | Must |
| Mockup | `screens/M03/mockups/SCR-M03-006-accounts.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Reviewer đã đăng nhập mở quản lý tài khoản từ SCR-M03-001.

**The user leaves when:** Quay lại SCR-M03-001. Reviewer gửi invitation ngay trong workspace này; người nhận mở provider email link tại SCR-M03-007 để hoàn tất credential.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-006-accounts.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-006-01 | User info | Header | Email, role (REVIEWER), logout | Yes | None |
| 2 | E-SCR-M03-006-02 | Screen title | Header text | "Tài khoản & Vai trò" / "Accounts & Roles" | Yes | Non-empty |
| 3 | E-SCR-M03-006-03 | Account list | List | Danh sách AdminAccounts | Yes | None |
| 4 | E-SCR-M03-006-04 | Account item | List item | Email, role badge, status badge, created date | Yes | None |
| 5 | E-SCR-M03-006-05 | Role badge | Badge | CONTENT_STAFF (xám) / REVIEWER (xanh) | Yes | None |
| 6 | E-SCR-M03-006-06 | Status badge | Badge | INVITATION_PENDING (vàng) / ACTIVE (xanh) / DEACTIVATED (đỏ) | Yes | None |
| 7 | E-SCR-M03-006-07 | Current user indicator | Badge | "Tài khoản hiện tại" cho user đang logged in | Yes | None |
| 8 | E-SCR-M03-006-08 | Last Reviewer indicator | Badge | "Không thể thay đổi" khi là last active Reviewer | Conditional | Hiển thị khi deactivating last reviewer |
| 9 | E-SCR-M03-006-09 | Action: Mời tài khoản | Button | Mở invitation form trong SCR-M03-006 | Yes | Reviewer; email và một fixed role required |
| 10 | E-SCR-M03-006-10 | Action: Đổi vai trò | Button | Thay đổi application role qua backend | Conditional | Chỉ CONTENT_STAFF/REVIEWER; không demote last active Reviewer; không blanket-lock mọi self account |
| 11 | E-SCR-M03-006-11 | Action: Kích hoạt | Button | Activate deactivated account | Conditional | Disabled khi không có DEACTIVATED account |
| 12 | E-SCR-M03-006-12 | Action: Vô hiệu hóa | Button | ACTIVE → DEACTIVATED qua backend | Conditional | Không deactivate last active Reviewer; server kiểm tra trạng thái/quyền tại action |
| 13 | E-SCR-M03-006-13 | Role change dialog | Dialog | Chọn role mới CONTENT_STAFF / REVIEWER | Conditional | Hiển thị trước khi đổi role |
| 14 | E-SCR-M03-006-15 | Deactivate confirmation | Dialog | "Xác nhận vô hiệu hóa tài khoản?" | Conditional | Hiển thị trước khi deactivate |
| 16 | E-SCR-M03-006-16 | Activate confirmation | Dialog | "Xác nhận kích hoạt tài khoản?" | Conditional | Hiển thị trước khi activate |
| 17 | E-SCR-M03-006-17 | Retry invitation | Button | Retry invitation cho account INVITATION_PENDING | Conditional | Hiển thị cho pending accounts |
| 18 | E-SCR-M03-006-18 | Last Reviewer blocked | Banner | "Không thể vô hiệu hóa hoặc hạ quyền Reviewer hoạt động cuối cùng" | Conditional | Khi deactivate/demote vi phạm last active Reviewer guard |
| 19 | E-SCR-M03-006-19 | Duplicate email error | Banner | "Email đã tồn tại" khi invite duplicate | Conditional | Hiển thị khi duplicate |
| 20 | E-SCR-M03-006-21 | Network error | Banner | "Lỗi kết nối" khi operation fails | Conditional | Hiển thị khi network error |
| 22 | E-SCR-M03-006-22 | Permission denied | Banner | "Bạn không có quyền thực hiện thao tác này" | Conditional | Hiển thị khi unauthorized |
| 23 | E-SCR-M03-006-23 | Action: Quay lại | Button | Quay về SCR-M03-001 | Yes | None |
| 24 | E-SCR-M03-006-24 | Invitation email | Input | Email tài khoản được mời | Conditional | Valid email, normalize trước uniqueness check; không chọn account khác khi retry pending invitation |
| 25 | E-SCR-M03-006-25 | Invitation role | Selector | CONTENT_STAFF hoặc REVIEWER | Conditional | Exactly one fixed application role; provider callback không cấp/chọn role |
| 26 | E-SCR-M03-006-26 | Action: Gửi lời mời / Hủy | Buttons | Submit/cancel invitation form | Conditional | Disabled khi invalid/processing; error không tạo ACTIVE account |
| 27 | E-SCR-M03-006-27 | Loading / stale feedback và reload | Panel/button | Đọc account list, đang mutation, stale revision hoặc request failure; tải lại | Conditional | Gửi expected concurrencyRevision cho mutation tương ứng; không auto-merge |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Account list với all accounts; action buttons | List loaded |
| Role change dialog | Dialog với role selector | Tap Đổi vai trò |
| Deactivate confirmation | Dialog yêu cầu xác nhận | Tap Vô hiệu hóa |
| Activate confirmation | Dialog yêu cầu xác nhận | Tap Kích hoạt |
| Operation success | Toast "Thao tác thành công" | Operation completes |
| Last Reviewer blocked | Banner không thể vô hiệu hóa/hạ quyền Reviewer hoạt động cuối cùng | Attempt deactivate/demote last active Reviewer |
| Duplicate email | Banner "Email đã tồn tại" | Invite with existing email |
| Pending account | Account với status INVITATION_PENDING + retry button | Account pending |
| Self account | Mark tài khoản hiện tại; vẫn áp server role/status/last-active-Reviewer guards | Account = current user |
| Invitation form | Email, fixed role, Gửi/Hủy | Reviewer chọn Mời tài khoản |
| Invitation pending/sent | Account INVITATION_PENDING; provider đã nhận request gửi invitation, chưa có quyền đăng nhập M03 | Invitation request succeeds |
| Loading/invalid input/network/permission/stale | Phản hồi tương ứng; account state chỉ update sau backend success | Query/mutation validation fails |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Mời tài khoản | Tap | Mở email + fixed role form trong account workspace | Stays; invitation form |
| 2 | Đổi vai trò | Tap | Hiện dialog với role selector | Show dialog |
| 3 | Confirm role change | Tap | Backend kiểm tra quyền/revision/last Reviewer rồi update role; nếu tự đổi role thì protected destinations theo quyền mới | Updated account hoặc blocked/stale |
| 4 | Kích hoạt | Tap | Hiện confirmation dialog | Show dialog |
| 5 | Confirm activate | Tap | Chỉ reactivate DEACTIVATED → ACTIVE; pending account không được kích hoạt thủ công | Update account hoặc denied/conflict |
| 6 | Vô hiệu hóa | Tap | Hiện confirmation dialog | Show dialog |
| 7 | Confirm deactivate | Tap | Deactivate account (ACTIVE → DEACTIVATED); blocked for last reviewer | Update account status |
| 8 | Retry invitation | Tap | Resend invitation cho pending account | Show success toast |
| 9 | Quay lại | Tap | Quay về SCR-M03-001 | `SCR-M03-001` |
| 10 | Gửi lời mời | Tap | Backend validate unique normalized email/fixed role; tạo matching INVITATION_PENDING và yêu cầu provider gửi invitation | Pending account; recipient email link → `SCR-M03-007` |
| 11 | Hủy lời mời chưa gửi | Tap | Đóng local form; không tạo account | Account list |
| 12 | Tải lại | Tap | Fetch current accounts/revisions trước action mới | Reload list |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-006-001 | Chỉ REVIEWER có quyền invite/change/deactivate admin accounts | BR-M03-015 |
| SR-SCR-M03-006-002 | Last active Reviewer không thể deactivate hoặc demote | BR-M03-015, SC-M03-008 |
| SR-SCR-M03-006-003 | Retry invitation cùng pending account không tạo duplicate; không tự đổi email/role của invitation | FR-M03-013; spec-M03 US-M03-05 |
| SR-SCR-M03-006-004 | Deactivation chặn M03 access; chỉ matching completed provider identity kích hoạt INVITATION_PENDING tại SCR-M03-007; manual activation chỉ reactivate DEACTIVATED | BR-M03-018; spec-M03 US-M03-05, §6 |
| SR-SCR-M03-006-005 | Provider invitation/recovery không assign/change application role; Reviewer đổi role bằng account command riêng theo authorization | BR-M03-020, BR-M03-015 |
| SR-SCR-M03-006-006 | Không public sign-up; initial Reviewer là server provisioning trên environment trống, không có browser bootstrap action | FR-M03-013, BR-M03-019 |
| SR-SCR-M03-006-007 | Reviewer chọn normalized email và fixed role; provider gửi invitation, M03 tạo matching INVITATION_PENDING account | FR-M03-013; spec-M03 US-M03-05 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-013 | Authenticate; manage invitation, password recovery và fixed roles |
| FR-M03-006 | Server-side permissions enforced |
| FR-M03-007 | Reject stale account mutation; requires reload |

## 8. Responsive and accessibility notes

- Định hướng desktop workspace, đồng thời co giãn trên tablet và màn hẹp: stack form/detail panels, wrap action labels; bảng rộng chỉ scroll trong vùng bảng nếu cần. 768px/1024px là kích thước review tham khảo, không phải hard viewport minimum.
- Review text dài vi/en, zoom, keyboard/focus và error states; không ẩn action nghiệp vụ chỉ vì viewport nhỏ. Bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-006-001 | Role change: confirmation hay direct change? | No | Proposed | Đề xuất confirmation hiển thị target account và role cũ/mới; pattern còn chờ review. Backend kiểm tra role/revision và last active Reviewer transactionally. |
| OQ-SCR-M03-006-002 | Account list: pagination hay virtual scroll? | No | Proposed | Pagination hoặc danh sách thường tùy dữ liệu và backend contract; page size chưa chốt, không hardcode 20 thành requirement. |
| OQ-SCR-M03-006-003 | Last active reviewer detection: real-time hay refresh? | No | Confirmed | Server kiểm tra last active Reviewer tại deactivate/demote và reject transactionally (BR-M03-015, spec-M03 US-M03-05). UI indicator không thay guard và không blanket-lock mọi self account. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
