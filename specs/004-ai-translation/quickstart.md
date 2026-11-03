# Quickstart: kiểm chứng nút dịch "→"

**Feature**: [spec.md](spec.md) | Contract: [contracts/translate-contract.md](contracts/translate-contract.md) | Trạng thái: [data-model.md](data-model.md) §3

Mỗi kịch bản ghi SC/BR nó kiểm. Kịch bản không chạy được (ví dụ thiếu Docker) ghi `NOT RUN` kèm lý do, không ghi PASS.

## 0. Chuẩn bị

- Node 24, `npm ci`.
- Bản giả: `npm run dev:fake` → `http://localhost:5174/admin/login`, đăng nhập `reviewer@example.test` / mật khẩu fixture (`src/modules/m03/api/fake/fixtures.ts`).
- Stack local (chỉ cho §3): Docker Desktop + Supabase CLI; tạo `supabase/functions/.env` chứa `GEMINI_API_KEY=<khóa của bạn>` (file bị `.gitignore` bỏ qua — **không commit**); `supabase start`, `supabase db reset`; `.env.local` trỏ `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` tới stack local; `npm run dev`.

## 1. Kiểm tự động

| Lệnh | Kiểm |
|---|---|
| `npm run ci` | typecheck, lint token, unit/component (hook `useFieldTranslation`, `BilingualField`, ánh xạ lỗi của `supabaseTranslator`), build |
| `deno test supabase/functions/translate` | handler: 401/403/400/405/502/200, hậu xử lý, không lộ text/khóa trong body lỗi (SC-AI-004, BR-AI-08, BR-AI-11) |
| `npx playwright test e2e/m03/translate.spec.ts` | kịch bản §2 trên `dev:fake` |

## 2. Kịch bản trên `dev:fake`

| # | Bước | Kết quả mong đợi | Kiểm |
|---|---|---|---|
| Q1 | Tạo tuyến mới, gõ "Rừng nguyên sinh" vào Tên tuyến (tiếng Việt), bấm "→" | "Đang dịch…" rồi ô tiếng Anh = "Rừng nguyên sinh (en)" | SC-AI-001, BR-AI-01/02 |
| Q2 | Mỗi trường trong data-model §4 (gồm 2 điểm nổi bật, 2 chú thích ảnh, cảnh báo an toàn; tên điểm dừng; tên đối tượng và giới thiệu) | Mỗi trường có nút riêng, chỉ trường đã bấm đổi | SC-AI-001, BR-AI-01 |
| Q3 | Ô tiếng Việt trống hoặc chỉ khoảng trắng | Nút "→" không bấm được | BR-AI-01 |
| Q4 | Ô tiếng Anh đã có chữ, bấm "→" | Bị thay, không có hộp xác nhận | BR-AI-02 |
| Q5 | Sau khi ô tiếng Anh có chữ, sửa ô tiếng Việt; xóa trắng ô tiếng Anh; tải lại form | Ô tiếng Anh không bao giờ tự đổi | SC-AI-002, BR-AI-03/05 |
| Q6 | Chế độ `slow`: bấm "→", gõ vào ô tiếng Anh trước khi xong | Kết quả bị bỏ, giữ chữ đã gõ | BR-AI-04 |
| Q7 | Chế độ `slow`: bấm "→", sửa ô tiếng Việt trước khi xong | Kết quả bị bỏ | BR-AI-04 |
| Q8 | Chế độ `fail`: bấm "→" | MSG-AI-FAILED + "Thử lại"; ô tiếng Anh giữ nguyên; chuyển `ok`, bấm "Thử lại" → có bản dịch | SC-AI-003, BR-AI-09 |
| Q9 | Chế độ `fail`: điền tay, lưu, xuất bản một điểm dừng | Như spec-M03, không lỗi mới | SC-AI-003 |
| Q10 | Dịch xong, rời editor không lưu | Hộp thay đổi chưa lưu; bản nháp đã lưu không đổi | SC-AI-005, BR-AI-06 |
| Q11 | Tên tuyến tiếng Việt 98 ký tự (bản giả thêm " (en)" → 103) | Ô tiếng Anh đủ 103 ký tự, bộ đếm đỏ; Lưu → MSG-LIMIT-TEXT | SC-AI-006 |
| Q12 | Giới thiệu nhiều dòng; điểm nổi bật | Giới thiệu giữ xuống dòng; điểm nổi bật một dòng | BR-AI-11 |
| Q13 | Mục đã lưu trữ / chỉ đọc | Không có nút "→" | BR-AI-07 |
| Q14 | Bàn phím: Tab tới nút, Enter; trình đọc màn hình | Tên "Dịch sang tiếng Anh"; "Đang dịch…" được đọc; lỗi được đọc | design-system §5.3 |

## 3. Kịch bản trên stack local (khóa Gemini thật)

| # | Bước | Kết quả mong đợi | Kiểm |
|---|---|---|---|
| L1 | Đăng nhập admin `ACTIVE`, dịch "Cây chò ngàn năm" (Tên đối tượng) | Bản dịch tiếng Anh hợp lý, một dòng | SC-AI-001 |
| L2 | `curl` tới `/functions/v1/translate` không JWT; với JWT của tài khoản bị khóa | `401`; `403 { result: "FORBIDDEN" }`, không có text | SC-AI-004, BR-AI-08 |
| L3 | Xóa `GEMINI_API_KEY` khỏi `.env`, khởi động lại function, bấm "→" | MSG-AI-FAILED | BR-AI-09 |
| L4 | `npm run build`, rồi tìm `GEMINI`, `generativelanguage` và chuỗi khóa trong `dist/` | Không có kết quả | SC-AI-004 |
| L5 | Xem log của function sau L1–L3 | Không có text nguồn, bản dịch, JWT hay khóa | BR-AI-10, R-12 |
