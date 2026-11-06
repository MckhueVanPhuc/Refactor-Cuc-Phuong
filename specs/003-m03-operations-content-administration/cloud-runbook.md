# Runbook đưa Cúc Phương Quest lên cloud (T203–T209)

Chia việc (đổi 2026-11-06): **chủ dự án** giữ Vercel, làm phần Vercel của T203 và T206. **Người vận hành cloud** giữ owner trên Supabase và mọi secret, tự chạy các lệnh Supabase và tự kiểm trên thiết bị thật ở T209. Làm tuần tự, xong bước trước mới sang bước sau. Phạm vi và rủi ro đã chấp nhận: [change brief CHG-M03-2026-11-05-01](change-brief-CHG-M03-2026-11-05-01-deployment.md), nên đọc §4, §7.2 và §9 trước.

## Quy tắc không được phá

- **Repo là public.** Không commit, không dán vào issue hay PR: secret, mật khẩu, email thật, project ref, địa chỉ Production, file dump.
- **Cấm trên cloud:** `supabase db reset`, `supabase config push`, `supabase db push --include-seed`, chạy `supabase/seed.sql`, test phá hủy, tạo dữ liệu giả.
- **Dữ liệu không xóa được.** Database từ chối `DELETE` và `TRUNCATE`; nội dung và phiên thử sẽ ở lại vĩnh viễn.
- **Dừng lại và báo chủ dự án** nếu project ref không khớp, dry-run có migration ngoài dự kiến, hoặc một kết quả khác với mô tả.
- **Merge PR:** chỉ dùng **Create a merge commit**. Chủ dự án là người merge, vì Vercel project ở gói Hobby của chủ dự án.
- **Không xóa Vercel project và không đổi địa chỉ Production** khi tem QR còn dán.

## Chuẩn bị

Cài Node.js 24, Docker Desktop và [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). Clone repo và chạy `npm ci`.

Lệnh trong runbook viết theo cú pháp Bash, nên trên Windows hãy chạy bằng Git Bash.

| Cần có | Lấy ở đâu | Dùng ở bước |
|---|---|---|
| Địa chỉ Production `<ORIGIN>` | Chủ dự án gửi riêng | T203 |
| Tài khoản Gmail riêng của dự án, bật xác minh 2 bước, có [mật khẩu ứng dụng](https://support.google.com/accounts/answer/185833) | Tự tạo | T203 |
| Khóa Gemini gói miễn phí | [Google AI Studio](https://aistudio.google.com/apikey) | T205 |
| Email của hai Reviewer (chủ dự án và người vận hành cloud) | Tự chuẩn bị, không ghi vào repo | T207 |

Cất mọi giá trị bí mật trong trình quản lý mật khẩu. Thư mục backup phải nằm **ngoài** thư mục repo.

## T203 — Tạo project và cấu hình

### Vercel (chủ dự án)

Vercel chỉ cho nối repo của tài khoản GitHub mà người đó đăng nhập, nên project phải nằm ở tài khoản Vercel của chủ dự án; quyền collaborator không đủ.

1. Add New → Project → import repo → đặt tên project. Framework Preset: Vite. Ở màn Optional Integrations, **không** thêm Supabase, vì nó tạo project Supabase thứ hai. Chưa cần đặt biến môi trường.
2. Deploy. Lấy địa chỉ Production dạng `https://<tên>.vercel.app` ở thẻ Domains của trang Overview, sau đây gọi là `<ORIGIN>`, rồi gửi riêng cho người vận hành cloud.

Nếu Vercel báo chặn deploy vì tác giả commit: dừng lại, chọn deploy thủ công bằng Vercel CLI hoặc nâng Pro.

### Supabase (người vận hành cloud)

Tạo project gói Free, chọn region gần Việt Nam (ví dụ Singapore). Lưu mật khẩu database. Tên mục trên dashboard có thể khác đôi chút.

| Mục trên dashboard | Giá trị |
|---|---|
| Data API → Exposed schemas | Chỉ `api`, bỏ `public` |
| Data API → Extra search path | `api, extensions` |
| Data API → Max rows | `1000` |
| Auth → Allow new users to sign up | Tắt |
| Auth → Email provider | Bật |
| Auth → Confirm email | Tắt |
| Auth → Site URL | `<ORIGIN>` |
| Auth → Redirect URLs | `<ORIGIN>/admin/invitation` và `<ORIGIN>/admin/recovery` |
| Auth → SMTP: Enable custom SMTP | Bật |
| SMTP: Host, Port | `smtp.gmail.com`, `587` |
| SMTP: Username | Địa chỉ Gmail của dự án |
| SMTP: Password | Mật khẩu ứng dụng, không phải mật khẩu Gmail |
| SMTP: Sender email, Sender name | Địa chỉ Gmail của dự án, `Cúc Phương Quest` |

Đổi mật khẩu Gmail sẽ làm mật khẩu ứng dụng mất hiệu lực và email ngừng gửi; khi đó phải tạo mật khẩu ứng dụng mới và cập nhật lại ở đây.

Kiểm tra sau khi lưu; kết quả phải có `"disable_signup":true` và `"mailer_autoconfirm":true`:

```bash
curl -s -H "apikey: <PUBLISHABLE_KEY>" https://<PROJECT_REF>.supabase.co/auth/v1/settings
```

Sau đó gửi riêng cho chủ dự án URL project và publishable key `sb_publishable_…` cho T206. Không gửi `sb_secret_…`.

## T204 — Backup và apply migration

```bash
supabase login
supabase link --project-ref <PROJECT_REF>   # kiểm kỹ ref trên dashboard trước khi chạy
supabase migration list --linked            # phải thấy 14 migration chưa apply
supabase db push --linked --dry-run         # chỉ in, chưa apply; đối chiếu với supabase/migrations/
```

Dump đủ ba phần trước khi apply, vào thư mục ngoài repo. Lệnh dump cần Docker đang chạy. Lần đầu database còn trống, nhưng vẫn làm để kiểm tra cách dump chạy được.

```bash
BACKUP=<thư-mục-ngoài-repo>/$(date +%Y%m%d-%H%M)
mkdir -p "$BACKUP"
supabase db dump --linked -f "$BACKUP/roles.sql" --role-only
supabase db dump --linked -f "$BACKUP/schema.sql"
supabase db dump --linked -f "$BACKUP/data.sql" --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

Apply và kiểm tra:

```bash
supabase db push --linked
supabase migration list --linked            # cả 14 migration đã apply
```

Lặp lại phần dump trước mỗi lần apply sau này, và sau mỗi đợt nhập nội dung lớn. Dump không gồm file Storage, nên phải giữ bản gốc ảnh và media. Không sửa migration đã apply; lỗi thì viết migration mới.

## T205 — Secret và Edge Function

Lấy secret key `sb_secret_…` tại Project Settings → API Keys. Tạo một file env tạm **ngoài repo**:

```bash
APP_BACKEND_SECRET_KEY=<sb_secret_...>
GEMINI_API_KEY=<khóa Gemini>
```

```bash
supabase secrets set --env-file <đường-dẫn-file-env>
rm <đường-dẫn-file-env>
supabase functions deploy session-intake --no-verify-jwt
supabase functions deploy admin-accounts --no-verify-jwt
supabase functions deploy translate --no-verify-jwt
supabase functions list                     # ba function ở trạng thái ACTIVE
```

`--no-verify-jwt` là đúng thiết kế: các function tự xác minh người gọi.

## T206 — Biến môi trường Vercel (chủ dự án)

Project Settings → Environment Variables, Type **Config**, **chỉ chọn scope Production**. Giá trị không có khoảng trắng hay tab ở hai đầu, nên cẩn thận khi dán:

| Biến | Giá trị |
|---|---|
| `VITE_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co`, không có `/` ở cuối |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key `sb_publishable_…` |
| `VITE_QR_PUBLIC_BASE_URL` | `<ORIGIN>`, không có `/` ở cuối |

Bật **Analytics** trong tab của project, rồi Redeploy bản Production mới nhất, vì biến `VITE_*` được đọc lúc build. Không bật Speed Insights, vì dashboard yêu cầu trả phí (validation-report D-144).

Kiểm tra:

```bash
curl -sI <ORIGIN>/q/kiem-tra | head -1                    # 200, không phải 404
curl -sI <ORIGIN>/assets/khong-co.js | head -1            # 404
curl -sI <ORIGIN>/sw.js | grep -i cache-control           # no-cache
```

Mở `<ORIGIN>/q/kiem-tra`: không được hiện `Cấu hình ứng dụng không hợp lệ`. Chỉ mở trang chủ thì chưa đủ, vì màn chọn ngôn ngữ vẫn hiện khi cấu hình sai. Từ T207 trở đi, ảnh QR trong M03 phải không còn dấu "BẢN THỬ".

## T207 — Tạo Reviewer đầu tiên

Trong SQL Editor của Supabase:

```sql
select app.provision_initial_reviewer('<email-reviewer-dau-tien>');
```

Kết quả phải là `CREATED` hoặc `ALREADY_PROVISIONED`. Nếu là `NOT_EMPTY` hoặc `INVALID_EMAIL` thì dừng lại.

Gửi lời mời từ máy của bạn, tại thư mục repo:

```bash
SUPABASE_URL=https://<PROJECT_REF>.supabase.co APP_BACKEND_SECRET_KEY=<sb_secret_...> \
  node supabase/scripts/provision-initial-reviewer.ts <email-reviewer-dau-tien> <ORIGIN>
```

Người nhận mở link trong email (kiểm tra cả mục spam) và đặt mật khẩu. Sau đó đăng nhập `<ORIGIN>/admin/login` và mời Reviewer thứ hai từ màn quản lý tài khoản. Lúc này cả hai nên kiểm tra được chức năng khôi phục mật khẩu.

## T208 — Smoke check

Không tạo dữ liệu giả. Ghi kết quả qua PR vào [validation-report.md](validation-report.md); mục chưa chạy ghi `NOT RUN` kèm lý do.

**Đợt 1, sau T207:**
- Trang công khai mở được, danh sách tuyến trống và không lỗi.
- Đăng nhập M03; đổi vai trò hoặc dùng tài khoản khác để kiểm phân quyền.
- Đã mở app rồi tắt mạng: app vẫn mở được.
- Tab Network khi ở `/admin/*`: không có request gửi sự kiện tới `/_vercel/insights` hay `/_vercel/speed-insights`.
- Bấm nút "→" trong editor M03: có bản dịch.

**Đợt 2, sau khi Reviewer nhập và xuất bản tuyến thật đầu tiên:**
- Ảnh và media mở được.
- Chạy hết một chuyến, kết thúc và thấy "Đã gửi về hệ thống"; phiên hiện trong báo cáo.
- Dashboard Vercel Analytics có số liệu, `/q/{id}` hiện thành `/q/[id]`.

## T209 — Release gate

Người vận hành cloud kiểm trên Android Chrome và iOS Safari thật, trên tuyến thật đầu tiên:

- Checklist M01 T100 trong [validation-report M01](../001-m01-route-planning-preparation/validation-report.md).
- Checklist M1–M10 trong [validation-report M02](../002-m02-field-quest-experience/validation-report.md). Chỉ in số tem cần cho checklist.
- LCP của `/q/{id}` bằng Lighthouse profile di động, mục tiêu ≤ 2,5 s.
- Xác nhận timeout 8 s và các giới hạn §5.3 không gây chậm.

Icon app: manifest chưa có icon 192 và 512 px, nên Chrome không coi app là cài được (DV-03 trong validation-report M01). MVP không khuyến khích cài app (spec-M01 §9.2), nên việc này không chặn phát hành; khi chạy M7, ghi lại kết quả thực tế. Nếu muốn có icon, tự chuẩn bị hai file PNG vuông, khai báo trong `manifest.icons` ở `vite.config.ts` rồi mở PR.

Tem chỉ được in hàng loạt và dán ra thực địa sau khi T209 đạt.

## Sự cố thường gặp

| Dấu hiệu | Kiểm tra |
|---|---|
| App báo lỗi cấu hình và nêu tên biến | Biến thiếu, sai scope, có `/` ở cuối, có khoảng trắng hoặc tab ở hai đầu, hoặc chưa Redeploy |
| Website đột nhiên không tải được dữ liệu | Supabase Free tạm dừng sau 7 ngày ít hoạt động: vào dashboard và Restore. Kiểm tra trước mỗi buổi demo |
| Lời mời báo `INVITE_FAILED`, hoặc không nhận được email | Cấu hình SMTP, mật khẩu ứng dụng, mục spam; giới hạn mặc định của Supabase là 30 email/giờ, Gmail 500 email/ngày |
| Link trong email về sai địa chỉ | Site URL và Redirect URLs ở T203 |
| Nút "→" báo chưa dịch được | `GEMINI_API_KEY`, hoặc đã hết hạn mức miễn phí; xem log của function `translate` |
| Mời tài khoản lỗi `FAILED` | `APP_BACKEND_SECRET_KEY`; xem log của function `admin-accounts` |
| Quét QR ra 404 | `vercel.json` chưa có trong bản đã deploy |
