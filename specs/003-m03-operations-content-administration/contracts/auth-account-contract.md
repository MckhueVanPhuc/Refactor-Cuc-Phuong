# Contract — Xác thực và tài khoản quản trị (Auth provider ↔ M03)

| Mục | Giá trị |
|---|---|
| Bên tham gia | Supabase Auth (giữ credential, lời mời, token khôi phục, phiên); M03 (giữ `AdminAccount.role` và `status`) — system-configuration "Integration contracts: Auth provider ↔ M03" |
| Phạm vi | FN-M03-008; FR-M03-013; BR-M03-A01…A04, K01…K06; US-M03-05; SCR-M03-000, 006, 007 |
| Transport | Supabase JS Auth (trình duyệt); Edge Function `admin-accounts` (Auth Admin, giai đoạn B); RPC `api.get_current_admin`, `api.change_account_role`, `api.set_account_status`, `api.list_accounts` ([admin-command-contract.md](admin-command-contract.md)) |
| Nguyên tắc | Danh tính provider ≠ quyền M03. Truy cập cần **cả** danh tính đã xác thực **và** `AdminAccount` `ACTIVE` với role cố định; role và status không đọc từ JWT metadata (BR-M03-K05; Physical §9) |

## 1. `app.current_admin()` (server, mọi request được bảo vệ)

Trả tài khoản khi và chỉ khi **cả ba** điều kiện đúng: `auth.uid()::text = admin_accounts.user_id`; `status = 'ACTIVE'`; `auth.jwt()->>'session_id'` còn tồn tại trong `auth.sessions`. Function là `SECURITY DEFINER` với `search_path` cố định ([research.md](../research.md) R-15). Mọi command, query quản trị và policy `SELECT` của RLS đều gọi function này.

## 2. Luồng

### 2.1 Đăng nhập (SCR-M03-000)

1. `auth.signInWithPassword({ email, password })`. Provider lỗi → MSG-LOGIN-FAILED. Mạng lỗi → MSG-NETWORK-FAILED.
2. `rpc('get_current_admin')`. Kết quả rỗng (không có tài khoản, đang `INVITATION_PENDING` hoặc `DEACTIVATED`) → `auth.signOut({ scope: 'local' })` + MSG-LOGIN-DENIED (BR-M03-A04).
3. Thành công → vào `/admin`. Phần UI theo role chỉ là tiện ích; server vẫn kiểm tra quyền.
4. Đăng nhập và đăng xuất không ghi audit (BR-M03-K06).

### 2.2 Mời (SCR-M03-006, Reviewer)

`POST admin-accounts { action: 'invite', email, role }`

| Bước | Ai | Hành vi |
|---|---|---|
| 1 | Edge | Xác minh JWT; gọi `app.current_admin()` qua client có JWT người gọi; người gọi không phải `REVIEWER` → 403 `FORBIDDEN` |
| 2 | Edge | Chuẩn hóa email = `lower(trim(email))`, ≤ `EMAIL_MAX_CHARS` (provisional), dạng hợp lệ; sai → `INVALID_EMAIL` (MSG-EMAIL-INVALID) |
| 3 | Edge → DB (service role) | Tạo `AdminAccount { email, role, status: INVITATION_PENDING, user_id: null }` nếu chưa có. Đã có với `ACTIVE`/`DEACTIVATED` → `EMAIL_TAKEN` (MSG-EMAIL-TAKEN). Đã có `INVITATION_PENDING` → coi như gửi lại |
| 4 | Edge → Auth Admin | `inviteUserByEmail(email, { redirectTo: '<origin>/admin/invitation' })`. Lỗi → `INVITE_FAILED` (MSG-INVITE-FAILED). Tài khoản vẫn ở `INVITATION_PENDING`, retry là idempotent (tech-stack §5) |
| 5 | DB | Một dòng audit `ACCOUNT_INVITED` (actor = Reviewer) |

Kết quả: `{ result: 'SENT' }` → MSG-INVITE-SENT.

`POST admin-accounts { action: 'resend', email }`: chỉ cho tài khoản `INVITATION_PENDING`; gửi lại lời mời, không tạo bản sao (BR-M03-K01) → MSG-INVITE-RESENT; audit `ACCOUNT_INVITE_RESENT`.

### 2.3 Nhận lời mời (SCR-M03-007, người được mời)

1. Link mời của provider mở `/admin/invitation` và tạo phiên provider. Link sai hoặc hết hạn → MSG-LINK-INVALID; không có quyền nào được tạo.
2. Người nhận nhập mật khẩu hai lần. Không khớp → MSG-PASSWORD-MISMATCH. Gọi `auth.updateUser({ password })`; provider từ chối → MSG-PASSWORD-REJECTED.
3. `POST admin-accounts { action: 'link' }` với JWT của người nhận. Edge kiểm tra: email của provider user (chuẩn hóa) khớp với một tài khoản `INVITATION_PENDING`; khi đó đặt `user_id = auth user id`, `status = ACTIVE`, ghi audit `ACCOUNT_LINKED`. Không khớp → `LINK_REJECTED` → MSG-LINK-INVALID. Người nhận không chọn hay đổi được role.
4. Chuyển về màn đăng nhập (hoặc vào thẳng nếu bước 2.1.2 qua).

### 2.4 Khôi phục mật khẩu (SCR-M03-007)

- Yêu cầu: `auth.resetPasswordForEmail(email, { redirectTo: '<origin>/admin/recovery' })`; **luôn** hiện MSG-RECOVERY-SENT, bất kể email có tồn tại hay không (BR-M03-K02).
- Hoàn tất: link khôi phục mở `/admin/recovery` → `auth.updateUser({ password })` → về màn đăng nhập. Link sai hoặc hết hạn → MSG-LINK-INVALID.
- Không có lệnh gọi nào tạo hay đổi `AdminAccount`. Tài khoản `DEACTIVATED` vẫn bị từ chối ở 2.1.2.

### 2.5 Đổi role, khóa và mở khóa (SCR-M03-006, Reviewer)

RPC C-18/C-19 ([admin-command-contract.md](admin-command-contract.md) §5). Bảng `admin_accounts` bị khóa để tuần tự hóa. Trigger cấp câu lệnh từ chối mọi thay đổi để lại 0 `REVIEWER` `ACTIVE` → `BLOCKED` MSG-LAST-REVIEWER (BR-M03-K03, SC-M03-008). Mỗi lần đổi có một dòng audit.

### 2.6 Đăng xuất (mọi màn đã đăng nhập)

1. Nếu có form chưa lưu → MSG-UNSAVED-CHANGES (ở lại / rời đi).
2. Hủy mọi request quản trị đang bay (`AbortController`).
3. `auth.signOut({ scope: 'local' })`: phiên provider hiện tại kết thúc; dòng `auth.sessions` bị xóa, nên `app.current_admin()` từ chối token cũ.
4. Về `/admin/login`. Không ghi audit; không đổi role hay status (BR-M03-K06, SC-M03-040).

### 2.7 Phiên hết hạn

Bất kỳ RPC nào trả lỗi xác thực → MSG-SESSION-EXPIRED. Form giữ nguyên state; người dùng đăng nhập lại rồi lưu.

### 2.8 Cấp Reviewer đầu tiên (giai đoạn B, chỉ phía server)

Script cho operator ([research.md](../research.md) R-16), không có màn hình, route hay endpoint công khai. Script chỉ chạy khi `app.admin_accounts` rỗng; idempotent theo email chuẩn hóa; tạo `REVIEWER` `INVITATION_PENDING`, gửi lời mời qua Auth Admin, ghi audit `INITIAL_REVIEWER_PROVISIONED` với `actorUserId` để trống (BR-M03-K04, SC-M03-010). Sau lần truy cập đầu, Reviewer đầu tiên mời ít nhất một Reviewer dự phòng (BR-M03-K03). Đây là thủ tục vận hành, không phải tính năng của hệ thống.

## 3. Response của Edge `admin-accounts`

| HTTP | `result` | messageKey phía UI |
|---|---|---|
| 200 | `SENT` / `RESENT` / `LINKED` | MSG-INVITE-SENT / MSG-INVITE-RESENT / — |
| 400 | `INVALID_EMAIL` | MSG-EMAIL-INVALID |
| 409 | `EMAIL_TAKEN` | MSG-EMAIL-TAKEN |
| 403 | `FORBIDDEN` | MSG-NO-PERMISSION |
| 422 | `LINK_REJECTED` | MSG-LINK-INVALID |
| 502 | `INVITE_FAILED` | MSG-INVITE-FAILED |
| 401 | — | MSG-SESSION-EXPIRED |

Body không bao giờ chứa token, secret, user id hay mã lỗi thô của provider (BR-M03-L10; constitution V).

## 4. Cấu hình

- Callback/redirect URL dùng origin HTTPS đang hoạt động; URL callback local chỉ để phát triển (environment.md §5).
- `APP_BACKEND_SECRET_KEY` chỉ có trong secret của Edge và shell của operator; không bao giờ mang tiền tố `VITE_` (environment.md §4, §7).
- Không có đăng ký công khai: tắt self sign-up của provider trong cấu hình Auth (`supabase/config.toml` local; cài đặt cloud thuộc giai đoạn kích hoạt, environment.md §10).

## 5. Truy vết test

| Kiểm thử | BR / SC |
|---|---|
| Danh tính provider không có tài khoản active → không gọi được command nào | SC-M03-009 |
| Lời mời hoặc khôi phục mật khẩu không đổi role/status (so sánh dòng trước/sau) | SC-M03-011, BR-M03-K02 |
| Khôi phục mật khẩu không tiết lộ email (cùng response cho email có và không có) | BR-M03-K02 |
| Gửi lại không tạo bản sao | BR-M03-K01 |
| Reviewer cuối: hạ role hoặc khóa → BLOCKED, kể cả khi hai request chạy đồng thời | SC-M03-008, BR-M03-K03 |
| Cấp đầu tiên chỉ chạy khi môi trường rỗng; chạy lần hai với cùng email là no-op; không có grant cho `anon`/`authenticated` | SC-M03-010 |
| Sau đăng xuất, token cũ bị `app.current_admin()` từ chối | SC-M03-040 |
