# Validation report — 004 AI Integration (nút dịch vi → en cho editor M03)

Báo cáo kiểm chứng của đợt cài đặt T001–T034 (2026-11-03) và đợt kiểm trên stack local T033 (2026-11-04, §3). Chỉ ghi lệnh đã chạy thật; phần chưa chạy ghi `NOT RUN` kèm lý do.

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

## 3. Kiểm trên stack local (T033, 2026-11-04)

Máy: Windows 11, Docker 29.9.2, Supabase CLI 3.0.0 (`npx supabase`), Deno 2.9.8, edge-runtime 1.77.9. Các bước: `npx supabase start`; `npx supabase db reset --local` (seed `supabase/seed.sql`); `npx supabase functions serve --env-file supabase/functions/.env`, file có khóa Gemini thật và **không commit**; `.env.local` trỏ `http://127.0.0.1:54321`; `npm run dev`. Function được gọi bằng `curl.exe` với JWT của các tài khoản seed.

| Mục | Lệnh / bước | Kết quả |
|---|---|---|
| `deno test supabase/functions/translate` | `deno test supabase/functions/translate` | PASS: 12/12 |
| `supabase/config.toml` có `[functions.translate]` được CLI đọc | `npx supabase functions serve` | PASS: liệt kê `/functions/v1/translate`; `verify_jwt = false` nên lỗi xác thực do function trả |
| Quickstart L1: dịch thật với khóa Gemini (API) | `POST /functions/v1/translate` bằng JWT `staff@example.test` (CONTENT_STAFF, ACTIVE) | PASS: `200 { translatedText }`; text một dòng (`NOT_ALLOWED`) trả một dòng; đoạn hai dòng (`ALLOWED`) giữ đúng một xuống dòng |
| Quickstart L1: dịch thật trên giao diện | Người dùng đăng nhập `staff@example.test`, mở editor tuyến tab "1. Thẻ tuyến", bấm "→" ở Tên tuyến và Mô tả ngắn | PASS: bản dịch điền vào ô tiếng Anh; lưu bản nháp thành công ("Đã lưu bản nháp.") |
| Quickstart L2: 401/403 | Không `Bearer`; `Bearer` sai; JWT `locked@example.test` (DEACTIVATED); JWT `noaccount@example.test` (không có AdminAccount) | PASS: `401 {}`, `401 {}`, `403 {"result":"FORBIDDEN"}`, `403 {"result":"FORBIDDEN"}` |
| Quickstart L3: thiếu khóa | Chạy lại function với bản sao env không có `GEMINI_API_KEY`, gọi bằng JWT `staff@example.test` | PASS (API): `502 {"result":"FAILED"}`; client đổi mọi lỗi thành MSG-AI-FAILED (`supabaseTranslator.test.ts`); không bấm lại trên giao diện |
| Quickstart L5: log | Đọc log function sau L1–L3 | PASS: chỉ có `serving the request …` và `[translate] MISSING_KEY` / `[translate] FAILED`; không có text, JWT hay khóa |
| Model `gemini-3.5-flash-lite` trả lời đúng với khóa của dự án | L1 | PASS |

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
| BR-AI-08 server, admin ACTIVE, khóa phía server | `index.test.ts` (401, 403, auth trước body); quét bundle; L2 (§3) |
| BR-AI-09 lỗi + "Thử lại" | hook test; `BilingualField.test.tsx`; `supabaseTranslator.test.ts`; `index.test.ts` 502; E2E Q8, Q9 |
| BR-AI-10 chỉ gửi text nguồn | `index.test.ts` (dependency nhận đúng text đã trim; body lỗi không chứa text) |
| BR-AI-11 chữ thuần, bỏ xuống dòng trường một dòng | hook test; `index.test.ts` hậu xử lý; E2E Q12 |
| BR-AI-12 không lưu dấu máy dịch | Không có dữ liệu mới (data-model §1); không cần test riêng |

| SC | Kiểm |
|---|---|
| SC-AI-001 | E2E Q1, Q2 (đủ 14 trường; route editor đếm 13 lượt cho 11 trường gồm 2 điểm nổi bật, 2 chú thích ảnh) |
| SC-AI-002 | E2E Q5 |
| SC-AI-003 | E2E Q8, Q9 |
| SC-AI-004 | `index.test.ts`; quét bundle; L2 (§3) |
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
