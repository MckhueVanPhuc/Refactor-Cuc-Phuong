# Change Brief CHG-M03-2026-10-30-01 — Mở phạm vi backend M03 trên stack local (giai đoạn B)

| Trường | Nội dung |
|---|---|
| Change ID | CHG-M03-2026-10-30-01 |
| Trạng thái | **DRAFT — chờ người dùng duyệt.** Chưa duyệt thì Phase 13–15 của [tasks M03](tasks.md) vẫn BLOCKED (T166). |
| Người duyệt | _(điền khi duyệt — chủ dự án)_ |
| Ngày duyệt | _(điền khi duyệt)_ |
| Loại thay đổi (runbook §4) | C6 — Runtime/Auth/environment, ở mức **phạm vi code**: không đổi hành vi, contract, entity hay dữ liệu đã đặc tả; chỉ cho phép hiện thực hóa thiết kế đã duyệt |
| Liên quan | CHG-M03-2026-10-29-01 (package code M03); [plan.md](plan.md) Complexity Tracking #1; [research.md](research.md) R-01; quyết định người dùng 2026-10-30 "soạn change brief backend" |

## 1. M03 source

[spec-M03](../../docs/spec/spec-M03.md) v3.7 (đến clarification 7): FR-M03-006…016, 018 và các nhóm BR-M03-A, F, G, H, I, J, K cần giao dịch và phân quyền phía server. Thiết kế đã duyệt: [Physical Schema](../../data/06-physical-schema.md) §5–§13; contract M03 trong [contracts/](contracts/) (admin-command, auth-account, live-qr-lookup, media-storage, publication-public, session-intake).

## 2. Current → New

| Hiện tại | Mong muốn |
|---|---|
| AGENTS.md §2: SQL migration, Edge Function/RPC chưa thuộc phạm vi. Tasks M03 Phase 13–15 (T166–T200) bị chặn. M01, M02 và admin M03 chỉ chạy trên dữ liệu giả và network mock | Được tạo và chạy **chỉ trên stack Supabase local**: migration bước 1–5 theo Physical §13, command/query `api.*`, view công khai, `api.lookup_qr`, `api.ingest_session`, Edge Function `session-intake` và `admin-accounts`, script operator cấp Reviewer đầu tiên, pgTAP, seed synthetic local, fixture E2E local-stack và job CI local-stack |

## 3. Rationale

- FR-M03-008/009/011/012/014 và constitution V đòi giao dịch và phân quyền phía server. Không có backend thì sản phẩm chỉ là giao diện trên dữ liệu giả (plan Complexity #1).
- M01 (Published Route, `JourneySnapshot`) và M02 (`LiveQrLookupResult`, `SessionSyncRecord`) phụ thuộc trực tiếp; tích hợp thật của cả ba module chờ phần này (tasks M01 T103–T106, M02 T104–T106).
- Mở sớm giảm phần logic phải viết hai lần (adapter giả bằng TypeScript và SQL). Bộ test hành vi dùng chung (tasks M03 T043, T197) kiểm cả hai bên.

## 4. Phạm vi file được phép

| Đường dẫn | Nội dung | Task |
|---|---|---|
| `supabase/migrations/**` | Migration theo Physical §13 bước 1–5 | M03 T168–T172, T177, T181, T183–T184, T186, T188, T190, T192, T194 |
| `supabase/functions/**` | `session-intake`, `admin-accounts`, `_shared/` | M03 T178, T195 |
| `supabase/scripts/provision-initial-reviewer.ts` | Script operator; không deploy, không vào bundle | M03 T179 |
| `supabase/tests/**` | pgTAP | M03 T173–T175, T180, T182, T185–T187, T189, T191, T193, T196 |
| `supabase/config.toml`, `supabase/seed.sql` | Cấu hình function, dữ liệu synthetic local | M03 T176, T178, T195 |
| `e2e/local-stack/**`, `e2e/m0*/*.local.spec.ts` | Fixture và E2E trên stack local | M03 T191, T195, T198, T199 |
| `src/modules/m03/api/**` | Nối adapter Supabase với tên function đã chốt | M03 T197 |
| `.github/workflows/ci.yml` | Job `local-stack` | M03 T198 |

## 5. Impact dimensions

| Chiều | Tác động |
|---|---|
| Actor/role | Không đổi: hai role cố định; quyền thực thi theo Physical §9 (EXECUTE thu hồi khỏi PUBLIC, cấp rõ từng role) |
| Lifecycle/status | Không đổi; trigger thực thi đúng S4 §8 |
| Field/type, DAC | Không đổi; hiện thực đúng Physical §5 và DAC đã duyệt |
| Validation rule | Không đổi; `app.revision_content_ok` và guard xuất bản theo Physical §5.4.1, §8 |
| Cross-module contract | Không đổi shape. View công khai đặt tên cột theo Physical §3 (cột `snake_case`, giá trị lồng `jsonb` giữ `camelCase`) — đóng điểm L-01 của research M01 |
| Report | Không đổi; RPT-01/RPT-02 tính theo yêu cầu |
| Screen | Không đổi |
| MVP priority | Không đổi |
| Data retention | Không đổi; không hard-delete (DEC-S6-002) |

## 6. Expected consumers

Admin UI M03 (adapter Supabase); M01 (view công khai, signed URL ảnh); M02 (lookup, intake, signed URL media); pgTAP và CI.

## 7. Explicit non-goals

- Không `supabase link`, không `db push`, không lệnh nào tác động Single Supabase Cloud Project; không cấu hình Vercel; không deploy. Các việc này thuộc change brief triển khai riêng (tasks M03 Phase 16, T201–T209).
- Không secret thật trong repo hay log; `APP_BACKEND_SECRET_KEY` chỉ ở secret local của Edge runtime hoặc shell của operator.
- Không dữ liệu thật; seed chỉ synthetic và chỉ local.
- Không đổi spec, contract, entity, DAC hay Physical Schema. Phát hiện lệch thì dừng và ghi `[NEEDS CLARIFICATION: …]`.
- Không thêm dependency runtime ngoài tech-stack.

## 8. Thứ tự đề xuất sau khi duyệt

1. Phase 13 (migration 1, 2, 3a, 4a, 5; pgTAP nền; seed) — bắt đầu khi Phase 2 của tasks M03 xong.
2. Backend từng story ở Phase 14 làm **song song** với UI cùng story ở giai đoạn A, để UI sớm chạy trên stack local thay vì chỉ trên adapter giả.
3. T197 chạy bộ test hành vi dùng chung với adapter Supabase; T198 dựng fixture local và chạy E2E local-stack; sau đó M01 T103–T106 và M02 T104–T106 tích hợp thật.

## 9. Validation gates

- `supabase db reset` local replay sạch toàn bộ migration.
- `supabase test db`: mọi pgTAP pass; phần không chạy được ghi `NOT RUN` kèm lý do.
- `src/modules/m03/api/contract/*.contract.ts` pass với cả adapter giả và adapter Supabase (T197).
- E2E local-stack: Q1–Q26 (M03), V4, V10, V17, V22 (M01), V5, V14, V20, V24, V25 (M02).

## 10. Open questions

Không có câu hỏi chặn. Các điểm kỹ thuật đã chốt trong tasks: `verify_jwt = false` cho cả hai Edge Function (publishable key không phải JWT; function tự xác minh người gọi); bản sao `_shared` cho schema intake; CORS và preflight `OPTIONS`; quyền function theo Physical §9.

## 11. Khi duyệt

Người duyệt điền "Người duyệt", "Ngày duyệt" và đổi trạng thái thành **APPROVED**. Sau đó agent thực hiện T167 (ghi tham chiếu vào tasks.md và plan.md Complexity #1) và cập nhật AGENTS.md §2, bỏ "SQL migrations, Edge Functions/RPC" khỏi danh sách chưa thuộc phạm vi, giới hạn ở stack local.
