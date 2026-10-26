# Screen Spec: Nhận lời mời & Khôi phục mật khẩu

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-007` |
| Screen name | Nhận lời mời & Khôi phục mật khẩu |
| Module | `M03` |
| Actor | Người được mời; Content Staff; Reviewer |
| Priority | Must |
| Mockup | `screens/M03/mockups/SCR-M03-007-invite-recover.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Link invitation từ provider gửi; HOẶC link recovery từ provider gửi; HOẶC "Quên mật khẩu" từ SCR-M03-000.

**The user leaves when:** Invitation/completion thành công quay về SCR-M03-000; HOẶC hủy quay về SCR-M03-000; HOẶC link hết hạn/invalid.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-007-invite-recover.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-007-01 | Screen title | Header text | "Hoàn tất lời mời" / "Set up your account" (invitation mode) HOẶC "Khôi phục mật khẩu" / "Reset password" (recovery mode) | Yes | Non-empty |
| 2 | E-SCR-M03-007-02 | Mode indicator | Badge | "Lời mời" / "Khôi phục mật khẩu" | Yes | None |
| 3 | E-SCR-M03-007-03 | Email display (invitation) | Text | Email đã được mời (readonly) | Conditional | Hiển thị khi invitation mode |
| 4 | E-SCR-M03-007-04 | Email input (recovery request) | Input | Email address để request recovery | Conditional | Hiển thị khi "forgot password" from SCR-M03-000 |
| 5 | E-SCR-M03-007-05 | Password input (invitation) | Input | Mật khẩu mới | Conditional | Hiển thị khi invitation callback valid |
| 6 | E-SCR-M03-007-06 | Confirm password input (invitation) | Input | Xác nhận mật khẩu mới | Conditional | Hiển thị khi invitation callback valid |
| 7 | E-SCR-M03-007-07 | Password input (recovery) | Input | Mật khẩu mới | Conditional | Hiển thị khi recovery callback valid |
| 8 | E-SCR-M03-007-08 | Confirm password input (recovery) | Input | Xác nhận mật khẩu mới | Conditional | Hiển thị khi recovery callback valid |
| 9 | E-SCR-M03-007-09 | Action: Hoàn tất lời mời | Button | Đặt credential và activate account | Conditional | Disabled khi form invalid |
| 10 | E-SCR-M03-007-10 | Action: Gửi yêu cầu | Button | Gửi recovery request | Conditional | Hiển thị khi "forgot password" mode |
| 11 | E-SCR-M03-007-11 | Action: Quay về đăng nhập | Button | Quay về SCR-M03-000 | Yes | None |
| 12 | E-SCR-M03-007-12 | Processing indicator | Spinner | "Đang xử lý..." | Conditional | Hiển thị khi processing |
| 13 | E-SCR-M03-007-13 | Request accepted | Banner | "Yêu cầu đã được chấp nhận. Kiểm tra email của bạn." (general response) | Conditional | Hiển thị khi recovery request accepted |
| 14 | E-SCR-M03-007-15 | Invalid link | Banner | "Liên kết không hợp lệ hoặc đã hết hạn" | Conditional | Hiển thị khi token invalid/expired |
| 15 | E-SCR-M03-007-16 | Provider error | Banner | "Lỗi từ dịch vụ, vui lòng thử lại sau" | Conditional | Hiển thị khi provider error |
| 16 | E-SCR-M03-007-17 | Network error | Banner | "Lỗi kết nối, vui lòng thử lại" | Conditional | Hiển thị khi network error |
| 17 | E-SCR-M03-007-18 | Identity mismatch | Banner | "Liên kết này không khớp với tài khoản của bạn" | Conditional | Hiển thị khi provider identity không khớp pending account |
| 18 | E-SCR-M03-007-19 | Account already active | Banner | "Tài khoản đã được kích hoạt trước đó" | Conditional | Hiển thị khi account đã ACTIVE |
| 19 | E-SCR-M03-007-20 | Deactivated account | Banner | "Tài khoản đã bị vô hiệu hóa" | Conditional | Hiển thị khi account DEACTIVATED |
| 20 | E-SCR-M03-007-21 | Completion success | Banner | "Tài khoản đã được kích hoạt. Vui lòng đăng nhập." | Conditional | Hiển thị khi invitation completed |
| 21 | E-SCR-M03-007-22 | Password reset success | Banner | "Mật khẩu đã được đặt lại. Vui lòng đăng nhập." | Conditional | Hiển thị khi recovery completed |
| 22 | E-SCR-M03-007-23 | Password mismatch error | Banner | "Mật khẩu xác nhận không khớp" | Conditional | Hiển thị khi password ≠ confirmPassword |
| 23 | E-SCR-M03-007-24 | Action: Đặt lại mật khẩu | Button | Submit password mới trực tiếp tới provider khi recovery callback hợp lệ | Conditional | Password/confirmation hợp lệ theo provider policy; không đổi AdminAccount role/status |
| 24 | E-SCR-M03-007-25 | Action: Thử lại | Button | Retry operation phù hợp mode sau network/provider error | Conditional | Token phải còn hợp lệ; invalid/expired link cần link hợp lệ mới, không loop callback cũ |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default (invitation link) | Form đặt password; email readonly | Valid invitation token |
| Default (recovery request) | Form nhập email để request recovery | "Forgot password" from SCR-M03-000 |
| Default (recovery link) | Form đặt password mới | Valid recovery token |
| Processing | Spinner; buttons disabled | Request in progress |
| Request accepted | Banner "Yêu cầu đã được chấp nhận" | Recovery request submitted |
| Invitation completed | Banner account activated sau backend match; action về đăng nhập; auto-redirect còn là đề xuất | Invitation completed |
| Password reset completed | Banner password reset; action về đăng nhập; auto-redirect còn là đề xuất | Provider recovery completed; không thay application status |
| Invalid link | Banner "Liên kết không hợp lệ" | Token invalid/expired |
| Identity mismatch | Banner "Liên kết không khớp" | Provider identity không khớp pending account |
| Account already active | Banner "Tài khoản đã kích hoạt" | Account đã ACTIVE |
| Account deactivated | Banner "Tài khoản đã bị vô hiệu hóa" | Account DEACTIVATED |
| Provider error | Banner lỗi provider | Provider error |
| Network error | Banner lỗi mạng | Network failure |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Email input (recovery) | Type | Cập nhật email value | State update |
| 2 | Password input | Type | Cập nhật password | State update |
| 3 | Confirm password input | Type | Cập nhật confirm password | State update |
| 4 | Hoàn tất lời mời | Tap | Gọi provider complete setup; validate AdminAccount match | Redirect to SCR-M03-000 |
| 5 | Gửi yêu cầu | Tap | Gửi recovery request vào provider; hiển thị general response | Show accepted message |
| 6 | Quay về đăng nhập | Tap | Quay về SCR-M03-000 | `SCR-M03-000` |
| 7 | Thử lại | Tap button | Retry đúng mode nếu token/inputs vẫn hợp lệ; không bypass identity/account guard | Retry flow hoặc invalid link |
| 8 | Đặt lại mật khẩu | Tap | Submit new password tới provider với recovery session hợp lệ; không gọi invitation activation | Reset success hoặc provider/network error |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-007-001 | Invitation hợp lệ: đặt credential → provider xác nhận identity → backend activate matching INVITATION_PENDING; không tự chọn/cấp role | FR-M03-013, BR-M03-018; spec-M03 US-M03-05 |
| SR-SCR-M03-007-002 | Provider invitation do Reviewer tại SCR-M03-006 hoặc initial server provisioning khởi tạo; recipient complete tại đây | FR-M03-013, BR-M03-019; spec-M03 US-M03-05 |
| SR-SCR-M03-007-003 | Recovery request: nhận email → gửi general response (không tiết lộ email tồn tại) | BR-M03-020 |
| SR-SCR-M03-007-004 | Recovery callback hợp lệ: đặt password → về SCR-M03-000 | BR-M03-020 |
| SR-SCR-M03-007-005 | Password recovery không tạo/thay đổi role/status | BR-M03-020 |
| SR-SCR-M03-007-006 | Invalid/expired link hiển thị thông báo; không redirect automatically | BR-M03-020 |
| SR-SCR-M03-007-007 | Không kích hoạt lại DEACTIVATED account qua recovery | BR-M03-020 |
| SR-SCR-M03-007-008 | Invitation completion chỉ activate account khớp identity; không tạo account mới | FR-M03-013, BR-M03-018; spec-M03 §6 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-013 | Authenticate; invitation, password recovery và fixed roles |

## 8. Responsive and accessibility notes

- Form login/invitation/recovery cần co giãn trên điện thoại, tablet và desktop vì entry/callback có thể mở từ email trên nhiều thiết bị. Tránh fixed-width card, giữ fields và CTA đọc/nhấn được khi bàn phím mở; breakpoint theo content.
- Review text dài vi/en, zoom, focus, provider errors và callback states; bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-007-001 | Auto-redirect delay sau completion: bao lâu? | No | Proposed | Đề xuất success banner và action về SCR-M03-000; auto-redirect/timing chưa chốt. Không chuyển trang trước người dùng đọc được kết quả. |
| OQ-SCR-M03-007-002 | Branding/logo positioning cho invitation/recovery page | No | Proposed | Đề xuất branding đồng nhất với login; asset/quyền sử dụng và positioning cần sign-off, form phải co giãn trên điện thoại. |
| OQ-SCR-M03-007-003 | Password strength requirements cụ thể | No | Open | Password policy do provider cấu hình/enforce; UI hiển thị policy/error được xác nhận. [NEEDS CLARIFICATION: password policy của hosted Auth từng environment chưa được xác nhận.] Không tự chốt độ dài hoặc chữ hoa/chữ số từ screen spec. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
