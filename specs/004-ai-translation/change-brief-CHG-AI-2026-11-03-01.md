# Change Brief CHG-AI-2026-11-03-01 — Nút dịch vi → en cho editor M03 trên stack local

| Trường | Nội dung |
|---|---|
| Change ID | CHG-AI-2026-11-03-01 |
| Trạng thái | **APPROVED** (2026-11-03). Được tạo gói Spec-Kit và code trên stack local theo phạm vi §4 và non-goals §7. |
| Người duyệt | MckhueVanPhuc (chủ dự án) |
| Ngày duyệt | 2026-11-03 |
| Loại thay đổi (runbook §4) | Behavioral change mới (spec-AI_integration v1.0) cộng phạm vi code: một Edge Function mới và một secret local; không đổi hành vi, contract, entity hay dữ liệu của spec-M03 |
| Liên quan | [spec-AI_integration.md](../../docs/spec/spec-AI_integration.md) v1.0; [function-list-AI.md](../../docs/function%20list/function-list-AI.md); CHG-M03-2026-10-30-01 (backend M03 local); quyết định người dùng 2026-11-03 |

## 1. Source

[spec-AI_integration](../../docs/spec/spec-AI_integration.md) v1.0: FR-AI-001…005, BR-AI-01…12, contract `TranslationRequest` / `TranslationResult` (§5.2), message MSG-AI-TRANSLATING và MSG-AI-FAILED (§5.5). Các rule M03 được trích dẫn và giữ nguyên: BR-M03-A04, C06, F02, F11, L01, L12 và spec-M03 §5.3.

## 2. Current → New

| Hiện tại | Mong muốn |
|---|---|
| Admin gõ tay cả hai ô `vi`/`en` của 14 trường song ngữ trong editor tuyến, điểm dừng và điểm tham quan | Mỗi trường có nút "→" dịch ô tiếng Việt sang ô tiếng Anh khi bấm; ô tiếng Anh vẫn sửa tự do; không tự lưu |
| Không có dịch vụ bên ngoài nào được gọi từ M03 | Một Edge Function dịch, chỉ trên stack Supabase local, gọi dịch vụ dịch bằng secret phía server |

## 3. Rationale

- Giảm việc gõ hai lần cho mọi trường song ngữ bắt buộc khi xuất bản (spec-M03 §5.1, BR-M03-C06).
- Ưu tiên MVP: **Could** (MVP-Scope.md). Không chặn bất kỳ tính năng Must nào.

## 4. Phạm vi file được phép

| Đường dẫn | Nội dung |
|---|---|
| `specs/004-ai-translation/**` | Gói Spec-Kit (spec, plan, research, contracts, quickstart, tasks, checklists) |
| `supabase/functions/<function dịch>/**`, `supabase/functions/_shared/**` | Edge Function dịch; tên chốt trong plan |
| `supabase/config.toml` | Khai báo function dịch |
| `src/modules/m03/**` | Nút dịch trên các trường song ngữ, adapter dịch (thật + giả cho `dev:fake`), test |
| `src/shared/ui/**` | Chỉ khi plan cần một thành phần nút dùng chung |
| `e2e/**` | E2E cho nút dịch trên adapter giả và stack local |
| `.env.example` | Chỉ tên biến công khai nếu cần; **không** thêm secret với tiền tố `VITE_` |

## 5. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor/role | Không đổi; cả hai role dùng được nút trên item họ được sửa (BR-M03-A02) |
| Lifecycle/status | Không đổi |
| Field/type, DAC | Không đổi; không entity, cột hay migration mới (spec-AI §6) |
| Validation rule | Không đổi; bản dịch đi qua kiểm tra độ dài hiện có (BR-AI-06) |
| Cross-module contract | Thêm contract `TranslationRequest` / `TranslationResult` (AI Integration → M03 editor). Contract M01/M02 không đổi |
| Report | Không đổi |
| Screen | SCR-M03-002, 003, 008: thêm nút "→" và hai trạng thái "Đang dịch…" / lỗi kèm "Thử lại" |
| MVP priority | Could |
| Data retention | Không lưu gì về bản dịch; chỉ text nguồn được gửi cho nhà cung cấp (BR-AI-10) |
| Dịch vụ bên ngoài | Google Gemini (tech-stack.md); người dùng chấp nhận gửi bản nháp ở mọi gói dịch vụ (OD-AI-11) |

## 6. Expected consumers

Admin UI M03 (route editor, checkpoint editor, visit-point workspace). M01 và M02 không dùng.

## 7. Explicit non-goals

- Không `supabase link`, `db push`, deploy function hay đặt secret trên cloud. Việc đó cần change brief triển khai riêng.
- Không ghi API key vào repo, log, `.env*` được commit hay bundle frontend. Key chỉ đặt trong secret local của Edge runtime.
- Không đổi spec-M03, contract M01/M02, entity, DAC hay Physical Schema.
- Không hộp xác nhận mới (BR-M03-L12 giữ nguyên); không file icon mới (nút dùng ký tự "→").
- Không thêm dependency runtime frontend ngoài tech-stack; phía Edge Function gọi API bằng HTTP, không bắt buộc SDK.

## 8. Thứ tự đề xuất sau khi duyệt

1. Ghi AGENTS.md §2: function dịch thuộc phạm vi code local theo brief này.
2. Chạy chuỗi Spec-Kit cho `specs/004-ai-translation/`: specify → clarify → plan → tasks → analyze.
3. Code theo tasks: adapter giả và UI trước (chạy được trên `dev:fake`), sau đó Edge Function và chạy thật trên stack local.

## 9. Validation gates

- `npm run ci` pass (typecheck, lint token, unit test, build).
- E2E trên `dev:fake`: SC-AI-001, 002, 003, 005, 006.
- Stack local (cần Docker và Supabase CLI): gọi function với key thật trong secret local; SC-AI-004 (không admin thì bị từ chối; key không xuất hiện trong bundle `dist/`).
- Phần không chạy được ghi `NOT RUN` kèm lý do.

## 10. Open questions

Không có câu hỏi nghiệp vụ chặn (spec-AI §10 đã chốt hết). Điểm kỹ thuật để plan chốt: model Gemini cụ thể, timeout `AI_TRANSLATE_TIMEOUT_MS`, prompt giữ nguyên tên riêng, cách xác minh người gọi giống `admin-accounts`.

## 11. Khi duyệt

Người duyệt điền "Người duyệt", "Ngày duyệt" và đổi trạng thái thành **APPROVED**. Sau đó agent thực hiện bước 1 của §8.
