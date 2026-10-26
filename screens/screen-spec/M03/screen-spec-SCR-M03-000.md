# Screen Spec: Đăng nhập quản trị

| Field | Value |
|---|---|
| Screen ID | `SCR-M03-000` |
| Screen name | Đăng nhập quản trị |
| Module | `M03` |
| Actor | Content Staff, Reviewer |
| Priority | Must |
| Mockup | `screens/M03/mockups/SCR-M03-000-login.png` |
| Status | Draft |

Nguồn hành vi/contract: [Spec M03](../../../docs/spec/spec-M03.md). Priority do [MVP Scope](../../../MVP-Scope.md) sở hữu; bố cục/visual direction tham khảo [DESIGN.md](../../../DESIGN.md). Screen là tài liệu dẫn xuất, không thêm field, permission hoặc transition vào baseline.

Các Type/pattern trong inventory và §8 là đề xuất trình bày; control có thể gộp/tách khi thiết kế nhưng phải giữ hành vi, dữ liệu và guard. Trong §9: **Confirmed** có nguồn baseline, **Proposed** chờ UX review, **Open** có clarification chưa được nguồn xác nhận. Draft không đồng nghĩa frontend/prototype đã được nghiệm thu.

## 1. Purpose

**Shown when:** Mở M03 mà chưa có provider session hợp lệ; HOẶC không thể duy trì/refresh session hợp lệ; HOẶC chọn "Đăng nhập" từ protected destination. Access token hết hạn đơn lẻ không đồng nghĩa phải logout.

**The user leaves when:** Đăng nhập thành công chuyển đến SCR-M03-001 (hoặc protected destination ban đầu); HOẶC chọn "Quên mật khẩu" chuyển đến SCR-M03-007.

## 2. Mockup

Mockup: `screens/M03/mockups/SCR-M03-000-login.png`. Đây là target asset tham khảo; cần kiểm tra asset và design sign-off, không dùng ảnh mockup để suy ngược business rule.

## 3. Element inventory

| # | Element ID | Element | Type | Content / data source | Required | Validation |
|---|---|---|---|---|---|---|
| 1 | E-SCR-M03-000-01 | Screen title | Header text | "Đăng nhập quản trị" / "Administrative Login" | Yes | Non-empty |
| 2 | E-SCR-M03-000-02 | Email input | Input | Email address; gửi trực tiếp vào Supabase Auth | Yes | Valid email format |
| 3 | E-SCR-M03-000-03 | Password input | Input | Password; gửi trực tiếp vào Supabase Auth | Yes | Non-empty |
| 4 | E-SCR-M03-000-04 | Action: Đăng nhập | Button | Submit credentials vào Supabase Auth | Yes | Disabled khi form invalid |
| 5 | E-SCR-M03-000-05 | Action: Quên mật khẩu | Button | Mở SCR-M03-007 ở mode quên mật khẩu | Yes | None |
| 6 | E-SCR-M03-000-06 | Loading state | Spinner | "Đang đăng nhập..." khi submitting | Conditional | Hiển thị khi submitting |
| 7 | E-SCR-M03-000-07 | Credential error | Banner | "Email hoặc mật khẩu không đúng" khi auth fails | Conditional | Hiển thị khi credential error |
| 8 | E-SCR-M03-000-08 | Network error | Banner | "Lỗi kết nối, vui lòng thử lại" khi network fails | Conditional | Hiển thị khi network error |
| 9 | E-SCR-M03-000-09 | Permission denied | Banner | "Tài khoản không có quyền truy cập" khi identity valid nhưng không có active AdminAccount với role hợp lệ | Conditional | Hiển thị khi account inactive/missing role |
| 10 | E-SCR-M03-000-10 | Session expired | Banner | "Phiên đã hết hạn, vui lòng đăng nhập lại" | Conditional | Hiển thị khi session expired |
| 11 | E-SCR-M03-000-11 | M03 branding | Logo/Image | Cúc Phương Quest branding | Yes | None |
| 12 | E-SCR-M03-000-12 | Action: Thử lại | Button | Retry login với input hợp lệ sau credential/network error | Conditional | Không retry tự động credentials; permission denied không được bỏ qua |

## 4. States

| State | What the user sees | Trigger |
|---|---|---|
| Default | Form đăng nhập; các trường trống | Initial load |
| Form filled | Fields có giá trị; nút Đăng nhập enabled khi valid | User nhập dữ liệu |
| Submitting | Spinner; các nút disabled | Credential submitted |
| Credential error | Banner lỗi; form giữ nguyên giá trị | Supabase Auth credential error |
| Network error | Banner lỗi mạng | Network failure |
| Permission denied | Banner "Không có quyền truy cập" | Identity valid nhưng no active AdminAccount/role |
| Session expired | Banner cần đăng nhập lại | Không còn provider session hợp lệ sau xử lý refresh/session của provider |
| Login success | Redirect đến SCR-M03-001 hoặc destination ban đầu | Login success + AdminAccount validated |

## 5. Interactions and navigation

| # | Element | User action | System response | Destination screen / result |
|---|---|---|---|---|
| 1 | Email input | Type | Cập nhật giá trị | State update |
| 2 | Password input | Type | Cập nhật giá trị | State update |
| 3 | Đăng nhập | Tap | Submit credentials → Supabase Auth; validate AdminAccount server-side | Navigate to SCR-M03-001 or error |
| 4 | Quên mật khẩu | Tap | Mở SCR-M03-007 mode recovery | `SCR-M03-007` |
| 5 | Thử lại | Tap button | Submit lại qua provider khi form hợp lệ; giữ server authorization guard | Submitting hoặc error |

## 6. Screen-level rules

| Rule ID | Rule | Related requirement |
|---|---|---|
| SR-SCR-M03-000-001 | Email và password được gửi trực tiếp vào Supabase Auth; M03 không lưu password | FN-M03-008 |
| SR-SCR-M03-000-002 | Thành công chỉ khi: provider identity hợp lệ + active AdminAccount + role CONTENT_STAFF hoặc REVIEWER | BR-M03-018, FR-M03-013 |
| SR-SCR-M03-000-003 | Provider identity đơn lẻ KHÔNG cấp quyền M03; cần active AdminAccount với role | BR-M03-018 |
| SR-SCR-M03-000-004 | Không có public sign-up; account thông thường qua Reviewer invitation, initial Reviewer qua server provisioning; cả hai phải hoàn tất matching provider identity | FR-M03-013; spec-M03 US-M03-05 |
| SR-SCR-M03-000-005 | Form được giữ trong memory khi save lỗi; không cam kết khôi phục draft qua reload | FN-M03-008 |

## 7. Linked requirements

| FR ID | How the screen supports it |
|---|---|
| FR-M03-013 | Authenticate administrative access; valid provider identity + active AdminAccount + role |
| FR-M03-006 | Server-side permissions enforced |

## 8. Responsive and accessibility notes

- Form login/invitation/recovery cần co giãn trên điện thoại, tablet và desktop vì entry/callback có thể mở từ email trên nhiều thiết bị. Tránh fixed-width card, giữ fields và CTA đọc/nhấn được khi bàn phím mở; breakpoint theo content.
- Review text dài vi/en, zoom, focus, provider errors và callback states; bố cục cuối cùng còn chờ UX review.
- Mục tiêu review accessibility: keyboard access, visible focus, semantic labels, error liên kết với field, status không chỉ biểu đạt bằng màu và reduced motion. Tham khảo WCAG 2.1 AA, touch target khoảng 44×44px và contrast 4.5:1 cho normal text; đây là định hướng cần kiểm chứng trên frontend, không phải tuyên bố đã đạt chuẩn.

## 9. Open questions

| ID | Question | Blocking | Status | Resolution |
|---|---|---|---|---|
| OQ-SCR-M03-000-001 | Session timeout cụ thể là bao lâu? | No | Open | Session do provider quản lý; access-token expiry có thể được xử lý bằng refresh, chỉ về login khi không còn session hợp lệ. [NEEDS CLARIFICATION: hosted Auth session policy theo từng environment chưa được xác nhận ở screen spec.] Không hardcode TTL access/refresh. |
| OQ-SCR-M03-000-002 | Redirect sau login: luôn đến SCR-M03-001 hay lưu intended destination? | No | Proposed | Đề xuất giữ intended destination thuộc M03 và role cho phép; fallback SCR-M03-001. Mọi protected destination vẫn validate active AdminAccount server-side. |
| OQ-SCR-M03-000-003 | Branding/logo assets và positioning | No | Proposed | Đề xuất branding Cúc Phương Quest; asset/quyền sử dụng và positioning cần design sign-off, không coi logo chính thức đã được cấp. |

## Completion checklist

- [x] Required behavioral controls and feedback are described in the inventory.
- [x] Each input has a validation rule or explicit `None`.
- [x] Behavioral success/failure states in this screen scope are described.
- [x] Navigation screen IDs and requirement references resolve; behavioral mappings follow canonical sources.
- [ ] Final layout, copy, assets and UX choices are signed off.
- [ ] Responsive/accessibility and real interactions are verified on the frontend.
