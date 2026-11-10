# Quickstart — Kiểm chứng M03 Operations & Content Administration

**Package**: `specs/003-m03-operations-content-administration` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

> **Trạng thái: chưa chạy.** Repository chưa có `package.json`, `src/`, `supabase/` hay test. Mọi lệnh dưới đây là quy trình **dự kiến** cho lúc implementation đã có. Cột "Kết quả mong đợi" là điều phải quan sát được; nó không phải kết quả đã ghi nhận. Không tuyên bố PASS cho tới khi lệnh thực sự chạy (constitution "Testing & Validation"; AGENTS.md §6).

## 1. Điều kiện tiên quyết

| Thứ cần có | Dùng cho | Giai đoạn |
|---|---|---|
| Node.js 24 LTS + npm | build, typecheck, Vitest, Playwright | A |
| Trình duyệt cho Playwright (`npx playwright install`) | E2E | A |
| Docker + Supabase CLI | stack Supabase local (Postgres, Auth, Storage, Edge runtime) | B |
| Deno (đi kèm Supabase CLI khi chạy `functions serve`) | Edge Function local | B |

Không cần, và **không được dùng**: tài khoản cloud thật, secret thật, dữ liệu thật. Không chạy `supabase link`, `db push` hay `--linked` khi chưa có phê duyệt (AGENTS.md §4; environment.md §11).

## 2. Cấu hình local

Tạo `.env.local` (file này bị ignore; repository chỉ có `.env.example` với tên biến và placeholder):

| Biến | Giá trị local | Ghi chú |
|---|---|---|
| `VITE_SUPABASE_URL` | URL API mà `supabase start` in ra | công khai |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | publishable/anon key mà `supabase start` in ra | công khai; RLS vẫn bắt buộc |
| `VITE_QR_PUBLIC_BASE_URL` | `http://localhost:5173` | build local luôn có dấu "BẢN THỬ" ([research.md](research.md) R-13) |
| `VITE_APP_VERSION` | build sinh ra | |
| `APP_BACKEND_SECRET_KEY` | **chỉ** trong secret của Edge local / shell của operator; không bao giờ trong `.env.local` của Vite | giai đoạn B |

Múi giờ báo cáo cố định `Asia/Ho_Chi_Minh` (environment.md §8), không phụ thuộc múi giờ của máy.

## 3. Lệnh (dự kiến)

```powershell
# Giai đoạn A — frontend
npm ci
npm run typecheck        # tsc --noEmit
npm run lint
npm run test             # Vitest: unit + contract + component (adapter giả, fixture synthetic)
npm run build            # vite build
npm run e2e              # Playwright, chạy trên adapter giả hoặc stack local

# Giai đoạn B — backend local (change brief backend CHG-M03-2026-10-30-01 đã duyệt; chỉ local)
supabase start
supabase db reset        # CHỈ local: replay migration từ đầu; không bao giờ --linked
supabase test db         # pgTAP: CHECK, trigger, RLS, grant, rollback, khóa tập, Reviewer cuối
supabase functions serve session-intake admin-accounts
npm run e2e -- --project=local-stack
```

## 4. Kịch bản kiểm chứng

Mỗi kịch bản trỏ tới contract chứa chi tiết. Fixture là dữ liệu synthetic: tuyến/điểm dừng mang tên giả, email dạng `staff1@example.test`.

| # | User story | Kịch bản | Kết quả mong đợi | Contract |
|---|---|---|---|---|
| Q1 | US1 / US-M03-05 | Đăng nhập bằng user provider không có `AdminAccount`; rồi bằng tài khoản `DEACTIVATED`; rồi bằng tài khoản `ACTIVE` | Hai lần đầu hiện MSG-LOGIN-DENIED và không gọi được command nào; lần ba vào được `/admin/routes` | [auth-account](contracts/auth-account-contract.md) §2.1 |
| Q2 | US1 | Reviewer mời `staff1@…` làm Nhân viên nội dung, gửi lại, người được mời đặt mật khẩu và nối tài khoản | Một tài khoản `INVITATION_PENDING` duy nhất, rồi `ACTIVE`; role không đổi; mỗi bước có dòng audit | auth-account §2.2–2.3 |
| Q3 | US1 | Khôi phục mật khẩu với email có và không có | Cùng một MSG-RECOVERY-SENT; không có dòng `admin_accounts` nào đổi | auth-account §2.4 |
| Q4 | US1 | Hai request đồng thời: khóa Reviewer cuối và hạ role Reviewer cuối | Cả hai BLOCKED MSG-LAST-REVIEWER; vẫn còn 1 Reviewer hoạt động | auth-account §2.5 |
| Q5 | US1 | Đăng xuất từ một form có thay đổi chưa lưu, rồi gọi lại RPC bằng access token cũ | Hộp thoại MSG-UNSAVED-CHANGES; RPC bằng token cũ bị từ chối | auth-account §2.6 |
| Q6 | US2 / US-M03-03 | Tạo điểm dừng `OFFLINE_REQUIRED`, lưu; thêm hai điểm tham quan có ảnh; thử thêm AV | Không có QR trước lần lưu đầu; AV bị từ chối MSG-AV-OFFLINE; danh sách không hiện phần nào của mã | [admin-command](contracts/admin-command-contract.md) C-02, C-03; [media-storage](contracts/media-storage-contract.md) |
| Q7 | US2 | Chọn 4 tệp một lần, một tệp quá cỡ | 3 "Đã tải", 1 "Không tải được"; MSG-UPLOAD-SUMMARY; lưu nháp giữ cả 3 | media-storage §1 |
| Q8 | US2 | Xuất bản điểm dừng lần đầu khi một điểm tham quan chưa sẵn sàng | Điểm dừng + điểm tham quan sẵn sàng → `HOAT_DONG`; điểm chưa sẵn sàng giữ `NHAP` và được liệt kê ở review; không có snapshot | admin-command C-05; [publication-public](contracts/publication-public-contract.md) §4 |
| Q9 | US2 | Tải ảnh in SVG và PNG của một điểm tham quan trên build local | Decode ra đúng `http://localhost:5173/q/{id}`; có tên tiếng Việt của điểm tham quan, dòng cảnh báo offline, dấu BẢN THỬ; PNG ≥ 1024 px | [admin-ui-flow](contracts/admin-ui-flow-contract.md) §4 |
| Q10 | US2 | Thu hồi QR hoạt động cuối của điểm dừng hoạt động | BLOCKED MSG-LAST-QR | admin-command C-16 |
| Q11 | US3 / US-M03-01 | Lưu tuyến thiếu nội dung; xem panel; nhập tổ hợp `KHO` + "Gia đình có trẻ nhỏ" | Lưu được; panel liệt kê từng thiếu sót; tổ hợp tag bị chặn khi lưu (MSG-TAG-CONFLICT) | admin-command C-01 |
| Q12 | US3 | Xuất bản tuyến đủ điều kiện, cảnh báo an toàn trống | Review đòi tick xác nhận; sau khi xuất bản: `HOAT_DONG`, snapshot version 1, Published Route xuất hiện với `timeTags` đúng ngưỡng 90/180 | publication-public §2–§4 |
| Q13 | US3 | Giả lập lỗi dựng snapshot khi xuất bản lần đầu | MSG-PUBLISH-FAILED; không có dòng công khai nào đổi; có audit FAILURE | admin-command C-05, §8 |
| Q14 | US4 / US-M03-02 | Hai phiên cùng sửa một tuyến; phiên sau lưu | Phiên sau nhận MSG-STALE với email và giờ; chữ còn nguyên; không ghi đè | admin-command §8 |
| Q15 | US4 | Sửa tên một điểm dừng mà 2 tuyến đang liệt kê, rồi xuất bản | Review nêu cả 2 tuyến; cả 2 nhận version mới cùng lúc; snapshot cũ nguyên vẹn | publication-public §4 |
| Q16 | US4 | Hai lệnh xuất bản đồng thời trên hai tuyến có chung một điểm dừng | Một thành công, một BUSY MSG-ROUTE-BUSY | admin-command C-05; [research.md](research.md) R-08 |
| Q17 | US4 | Xuất bản làm ước tính offline vượt `OFFLINE_PACKAGE_MAX_MB` (provisional 50) | BLOCKED MSG-OFFLINE-TOO-BIG, nêu tên tuyến và các ảnh nặng nhất | admin-command C-05 |
| Q18 | US5 / US-M03-09 | Quét DOM mọi màn tìm từ cấm và mã thô | Không tìm thấy | admin-ui-flow §7 |
| Q19 | US6 / US-M03-04 | Đóng một điểm dừng là điểm dừng hoạt động cuối của tuyến A và được tuyến B (còn điểm dừng khác) liệt kê | A tự `TAM_DONG` (`AUTO_NO_ACTIVE_CHECKPOINT`); B có version mới; mọi thứ trong một transaction; không bị trần chặn | admin-command C-10 |
| Q20 | US6 | Giả lập lỗi khi đóng điểm dừng | MSG-CLOSE-FAILED + "Đóng tạm các tuyến liên quan"; bấm vào thì các tuyến `TAM_DONG`, điểm dừng vẫn hoạt động | admin-command C-10, C-11 |
| Q21 | US6 | Mở lại điểm dừng (Reviewer); Nhân viên thử mở lại | Tuyến đã tự đóng vẫn đóng; Nhân viên nhận MSG-NO-PERMISSION | admin-command C-12, C-13 |
| Q22 | US7 | `api.lookup_qr` theo bảng sự thật 6 bước I02, có và không có `routeId`; giả lập lỗi DB | Kết quả tất định; `TEMPORARILY_CLOSED` không có `content`; lỗi DB là error, không phải `INVALID`; không có dòng nào được ghi | [live-qr-lookup](contracts/live-qr-lookup-contract.md) §3–§4 |
| Q23 | US8 / US-M03-08 | Xuất bản hai lần, khôi phục bản 1, thử khôi phục khi đã có bản nháp, bỏ bản nháp; siết một giới hạn trong fixture rồi khôi phục bản vi phạm | Bản nháp mới có `basedOnRevisionNumber = 1`; lần thứ hai MSG-DRAFT-EXISTS; bỏ bản nháp → `DA_BO`; bản vi phạm giới hạn mới bị từ chối với MSG-RESTORE-BLOCKED và không tạo bản nháp; lịch sử đủ; audit tự xuất bản có cờ | admin-command C-06, C-08, Q-10 |
| Q24 | US8 | Nhân viên mở `/admin/audit` | MSG-NO-PERMISSION; Reviewer xem được | admin-ui-flow §1 |
| Q25 | US9 / US-M03-06 | POST tới `session-intake`: hợp lệ; gửi lại giống hệt (đổi thứ tự visits); khác nội dung; sai `sequence`; có khóa `deviceId` | `ACCEPTED`, `IDENTICAL`, `CONFLICT`, `INVALID`, `INVALID`; chỉ có 1 dòng `session_records` | [session-intake](contracts/session-intake-contract.md) §2–§3 |
| Q26 | US9 | RPT-01/RPT-02 mặc định; khoảng 367 ngày; chỉ có một ngày | Mặc định 30 ngày; MSG-REPORT-SPAN; MSG-REPORT-DATES-INVALID; ghi chú một dòng luôn hiện | admin-command Q-12, Q-13; admin-ui-flow §3 |

## 5. Bằng chứng thành công mong đợi

- `npm run typecheck`, `lint`, `test`, `build` thoát với mã 0. Báo cáo Vitest liệt kê test contract cho cả 4 contract cross-module.
- Giai đoạn B: `supabase test db` báo mọi test pgTAP pass; E2E Q1–Q26 pass trên stack local.
- Phần không chạy được cô lập (ví dụ gửi email lời mời thật qua SMTP) được ghi `NOT RUN` kèm lý do. Inbucket/Mailpit local của Supabase CLI dùng thay cho SMTP thật.

## 6. Giới hạn

- Giai đoạn B được mở chỉ trên stack local từ 2026-10-30 (CHG-M03-2026-10-30-01; AGENTS.md §2; [plan.md](plan.md) Complexity Tracking). Cho tới khi Phase 13–15 được cài đặt, Q2–Q5, Q8, Q12–Q17, Q19–Q26 chỉ chạy được trên adapter giả: chúng chứng minh UI và mapping, không chứng minh được giao dịch phía server.
- Mọi con số giới hạn là **provisional** (spec-M03 §5.3) và cần được kiểm chứng trên thiết bị thật.
- Smoke check trên cloud (environment.md §10–11) nằm ngoài quickstart này; chỉ được chạy non-destructive, có người chịu trách nhiệm, sau khi phát hành.
- Không có test camera hay offline ở M03 (M03 là online-only); các phần đó thuộc M01/M02.
