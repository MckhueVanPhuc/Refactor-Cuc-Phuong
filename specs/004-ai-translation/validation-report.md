# Validation report — 004 AI Integration (nút dịch vi → en cho editor M03)

Báo cáo kiểm chứng của đợt cài đặt T001–T034 (2026-11-03). Chỉ ghi lệnh đã chạy thật; phần chưa chạy ghi `NOT RUN` kèm lý do.

## 1. Bối cảnh

| Mục | Giá trị |
|---|---|
| Branch | `feat/ai-translation`, cắt từ `docs/ai-translation` (PR #23, chưa merge) |
| Máy cài đặt | Windows 11, Node v24.16.0; **không có** Docker, Supabase CLI, Deno |
| Change brief | CHG-AI-2026-11-03-01 (APPROVED 2026-11-03) |
| Checklist | `checklists/requirements.md` 16/16 |

## 2. Lệnh đã chạy

| Lệnh | Exit | Kết quả |
|---|---|---|
| `npm run ci` (typecheck → lint → test → build) | 0 | typecheck sạch; lint token 518 pass; test 113 file, 1714 pass, 133 skip (contract local-stack có sẵn); build PWA OK |
| `npx playwright test` (project `m03`, `m01`, adapter giả) | 0 | 111 test: 64 pass, 47 skip (ca chỉ chạy trên stack local), 0 fail; gồm toàn bộ E2E M03 có sẵn sau khi đổi DOM của `BilingualField` |
| `npx playwright test e2e/m03/translate.spec.ts --project=m03` | 0 | 11/11 pass (quickstart Q1–Q14) |
| Test handler Edge bằng Node 24 + shim `Deno.test → node:test` (file shim nằm ngoài repo) | 0 | `supabase/functions/translate/index.test.ts` 12/12 pass. **Không phải** `deno test`: xem §3 |
| Quét `dist/` tìm `GEMINI`, `generativelanguage`, `x-goog-api-key` (quickstart L4, SC-AI-004) | 1 (không thấy) | Không có; chunk dịch production chỉ có `supabaseTranslator`, không có bộ dịch giả |
| `git check-ignore -v supabase/functions/.env` | 0 | Bị `.gitignore` (mẫu `.env`) bỏ qua |
| `git diff --check` | 0 | Không lỗi khoảng trắng |

Test viết trước và chạy thấy fail (module chưa có) trước khi cài hook, `BilingualField`, handler và `supabaseTranslator`.

## 3. `NOT RUN` — chuyển cho máy có Docker + Supabase CLI

| Mục | Lệnh / bước | Lý do |
|---|---|---|
| `deno test supabase/functions/translate` | `deno test supabase/functions` | Máy không có Deno (đã chạy cùng file bằng shim Node, §2) |
| Quickstart L1 — dịch thật với khóa Gemini | `supabase start`, `supabase db reset`, tạo `supabase/functions/.env` chứa `GEMINI_API_KEY=…` (**không commit**), `.env.local` trỏ stack local, `npm run dev`, đăng nhập admin, bấm "→" ở Tên đối tượng | Không có Docker/Supabase CLI |
| Quickstart L2 — 401/403 | `curl -i -X POST http://127.0.0.1:54321/functions/v1/translate -H 'content-type: application/json' -d '{"sourceLanguage":"vi","targetLanguage":"en","text":"Cây","lineBreaks":"NOT_ALLOWED"}'` (không JWT → 401); thêm `-H "authorization: Bearer <JWT tài khoản bị khóa>"` → 403 | Như trên |
| Quickstart L3 — thiếu khóa | Xóa `GEMINI_API_KEY`, khởi động lại function, bấm "→" → "Chưa dịch được…" | Như trên |
| Quickstart L5 — log | Xem log function sau L1–L3: chỉ có `[translate] …` kèm mã, không có text, JWT hay khóa | Như trên |
| `supabase/config.toml` có `[functions.translate]` được CLI đọc | `supabase start` | Như trên |
| Model `gemini-3.5-flash-lite` trả lời đúng với khóa của dự án | L1 | Chưa gọi Gemini thật lần nào |

Khi chạy xong, đánh dấu T033 trong `tasks.md` và điền kết quả vào bảng này.

## 4. Độ phủ BR / SC

| BR | Test |
|---|---|
| BR-AI-01 chỉ bấm mới dịch; nút không bấm được khi trống/đang dịch | `useFieldTranslation.test.tsx`; `BilingualField.test.tsx`; E2E Q3, Q5, Q14 |
| BR-AI-02 thay ô tiếng Anh, không hỏi | `BilingualField.test.tsx`; E2E Q4 |
| BR-AI-03 không phản ứng khi đổi tiếng Việt / xóa tiếng Anh | hook test "không tự dịch"; E2E Q5 |
| BR-AI-04 bỏ kết quả trễ | hook test (nguồn đổi, gõ ô tiếng Anh, unmount); `BilingualField.test.tsx`; E2E Q6, Q7 |
| BR-AI-05 mở editor không dịch | hook test mount; E2E Q5 (`translationRequestCount`) |
| BR-AI-06 không lưu; kiểm tra độ dài hiện có | E2E Q10 (hộp chưa lưu), Q11 (103/100, MSG-LIMIT-TEXT); handler không cắt |
| BR-AI-07 chỉ đọc không có nút | `BilingualField.test.tsx`; E2E Q13 |
| BR-AI-08 server, admin ACTIVE, khóa phía server | `index.test.ts` (401, 403, auth trước body); quét bundle; L2 `NOT RUN` |
| BR-AI-09 lỗi + "Thử lại" | hook test; `BilingualField.test.tsx`; `supabaseTranslator.test.ts`; `index.test.ts` 502; E2E Q8, Q9 |
| BR-AI-10 chỉ gửi text nguồn | `index.test.ts` (dependency nhận đúng text đã trim; body lỗi không chứa text) |
| BR-AI-11 chữ thuần, bỏ xuống dòng trường một dòng | hook test; `index.test.ts` hậu xử lý; E2E Q12 |
| BR-AI-12 không lưu dấu máy dịch | Không có dữ liệu mới (data-model §1); không cần test riêng |

| SC | Kiểm |
|---|---|
| SC-AI-001 | E2E Q1, Q2 (đủ 14 trường; route editor đếm 13 lượt cho 11 trường gồm 2 điểm nổi bật, 2 chú thích ảnh) |
| SC-AI-002 | E2E Q5 |
| SC-AI-003 | E2E Q8, Q9 |
| SC-AI-004 | `index.test.ts`; quét bundle; L2 `NOT RUN` |
| SC-AI-005 | E2E Q10 |
| SC-AI-006 | E2E Q11 |

## 5. Quyết định khi cài đặt

| ID | Quyết định | Ghi ở |
|---|---|---|
| D-1 | Hai câu MSG-AI-* nằm trong `translation/translationMessages.ts`, không trong `messages/catalogText.ts`: danh mục M03 phải trùng từng chữ với spec-M03 §5.6 và `app.message_template` (`sqlCatalog.test.ts`); thêm vào đó cần migration, ngoài phạm vi brief | tasks T001, research R-10, plan |
| D-2 | Model `gemini-3.5-flash-lite` thay cho `gemini-2.5-flash` của plan: tài liệu Gemini API (kiểm 2026-11-03) ghi `gemini-2.5-flash` deprecated, chuyển hướng từ 2026-12-01 | research R-03, contract §4, tech-stack.md §5 |
| D-3 | Lỗi nội bộ của function (getUser/RPC throw) trả `502 FAILED` như lỗi dịch vụ; client gộp mọi lỗi nên không cần mã riêng | handler.ts |
| D-4 | Hook E2E thêm `translationRequestCount` (đếm lượt dịch của bộ dịch giả) để kiểm "chỉ bấm mới dịch" | fakeAdminApi.ts |

## 6. Ghi chú

- `screens/html/mockup-SCR-M03-002/003/008.html` chưa có nút dịch (người dùng loại khỏi phạm vi).
- Nút "→" có tên truy cập giống nhau ở mọi trường theo spec-AI §5.5; ngữ cảnh trường đến từ vị trí giữa hai ô có nhãn. Nếu cần tên riêng từng trường cho trình đọc màn hình thì phải sửa spec-AI trước.
