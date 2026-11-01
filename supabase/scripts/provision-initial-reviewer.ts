// Cấp Reviewer đầu tiên — bước 2: gửi lời mời (tasks M03 T179; research R-16; auth-account-contract §2.8;
// BR-M03-K04, SC-M03-010). Chỉ cho operator, chạy từ máy operator; không deploy, không vào bundle.
//
// Bước 1 (trước, trong SQL editor; local: psql trong container DB):
//   select app.provision_initial_reviewer('<email>');   -- CREATED | ALREADY_PROVISIONED | NOT_EMPTY | INVALID_EMAIL
// Bước 2 (script này, chỉ khi bước 1 trả CREATED hoặc ALREADY_PROVISIONED):
//   SUPABASE_URL=… APP_BACKEND_SECRET_KEY=… node supabase/scripts/provision-initial-reviewer.ts <email> <origin>
//   <origin> là origin HTTPS của website (local: http://localhost:5173); link mời mở <origin>/admin/invitation.
//
// Secret chỉ đọc từ biến môi trường của shell; không bao giờ in ra hay ghi file.
import { createClient } from '@supabase/supabase-js';

const [email, origin] = process.argv.slice(2);
const url = process.env.SUPABASE_URL;
const secretKey = process.env.APP_BACKEND_SECRET_KEY;

if (!email || !origin || !url || !secretKey) {
  console.error('Cách dùng: SUPABASE_URL=… APP_BACKEND_SECRET_KEY=… node supabase/scripts/provision-initial-reviewer.ts <email> <origin>');
  process.exit(2);
}

const normalized = email.trim().toLowerCase();
const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const { error } = await supabase.auth.admin.inviteUserByEmail(normalized, {
  redirectTo: `${origin.replace(/\/$/, '')}/admin/invitation`,
});
if (error) {
  // Không in chi tiết của provider (có thể chứa thông tin cấu hình); chạy lại là idempotent
  console.error(`Không gửi được lời mời cho ${normalized}. Kiểm tra URL, secret và bước 1, rồi chạy lại.`);
  process.exit(1);
}
console.log(`Đã gửi lời mời cho ${normalized}. Người nhận mở link, đặt mật khẩu, rồi mời ít nhất một Reviewer dự phòng (BR-M03-K03).`);
