# Quickstart — Kiểm chứng M02 Field Quest Experience

**Package**: `specs/002-m02-field-quest-experience` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

> **Trạng thái: chưa chạy.** Repository chưa có `package.json`, `src/`, `e2e/` hay test. Mọi lệnh dưới đây là quy trình **dự kiến**. Cột "Kết quả mong đợi" là điều phải quan sát được, không phải kết quả đã ghi nhận. Không tuyên bố PASS cho tới khi lệnh thực sự chạy (constitution "Testing & Validation"; AGENTS.md §6).

## 1. Điều kiện tiên quyết

| Thứ cần có | Dùng cho | Khi nào |
|---|---|---|
| Node.js 24 LTS + npm | build, typecheck, Vitest, Playwright | luôn |
| Playwright Chromium (`npx playwright install chromium`) | E2E, offline, camera giả | luôn |
| File video `.y4m` chứa ảnh QR synthetic (link `http://localhost:4173/q/<id giả>`) | scanner trong E2E | tạo bằng task test, commit dưới `e2e/fixtures/` |
| Package M01 đã có `visitorDb`, bề mặt `index.ts`, app shell | mọi kịch bản | phụ thuộc 001 |
| Docker + Supabase CLI + migration và Edge của M03 giai đoạn B | tích hợp thật lookup/intake | chỉ khi M03 giai đoạn B mở |
| Một điện thoại Android và một iPhone | camera, quyền, offline, camera hệ thống mở link | trước lần phát hành thật |

Không dùng tài khoản cloud thật, secret thật, dữ liệu thật; không `supabase link`/`db push`/`--linked`.

## 2. Cấu hình

| File | Biến | Giá trị |
|---|---|---|
| `.env.e2e` (giá trị giả an toàn) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | `http://127.0.0.1:54321`, key giả; mọi request bị `page.route()` chặn |
| `.env.e2e` | `VITE_QR_PUBLIC_BASE_URL` | `http://localhost:4173` (origin của `vite preview`) |
| `.env.local` (ignore, chỉ tích hợp local) | như trên | giá trị `supabase start` in ra; base URL `http://localhost:5173` |

`LOOKUP_TIMEOUT_SECONDS` = 8 (**provisional**) và các hằng kỹ thuật nằm ở `src/modules/m02/config/limits.ts`, không phải biến môi trường.

## 3. Lệnh (dự kiến)

```powershell
npm ci
npm run typecheck
npm run lint
npm run test                   # Vitest: unit + contract + component (+ Dexie nếu fake-indexeddb được duyệt)
npm run build
npm run e2e -- --grep m02      # Playwright trên vite preview: network mock, offline, camera giả

# Chỉ khi M03 giai đoạn B đã có migration + Edge (ngoài phạm vi package này):
supabase start
supabase db reset              # CHỈ local
supabase functions serve session-intake
npm run e2e -- --project=local-stack --grep m02
```

## 4. Kịch bản kiểm chứng

Fixture synthetic: tuyến A, version 3, checkpoint `C1` (seq 1, `OFFLINE_REQUIRED`, mã `Q1a`, `Q1b`), `C2` (seq 3, `ONLINE_AVAILABLE`, mã `Q2`, có audio `vi`, `en`, `NONE`), `C3` (seq 5, cuối, `OFFLINE_REQUIRED`, mã `Q3`); mã `QX` thuộc checkpoint ngoài tuyến; mã `QN` được M03 thêm vào `C2` sau khi chuyến bắt đầu. Gói A v3 (hoặc v2 cũ hơn cho V11) từ fixture của M01.

| # | Story | Kịch bản | Kết quả mong đợi | Contract |
|---|---|---|---|---|
| V1 | Story 1 | Context v3 hợp lệ → vào `/trip` | Một phiên `DANG_DIEN_RA`, `sessionId` UUID, `sourceHandoffId` = `handoffId`; journey hiển thị 1, 2, 3 cho seq 1, 3, 5; gợi ý bắt đầu phiên | [field-ui-flow](contracts/field-ui-flow-contract.md) §2 |
| V2 | Story 1 | Context version 2; `REVOKED`; quá `expiresAt` 1 ms; handoff đã có phiên terminal | Không tạo phiên; thông báo bắt đầu lại từ M01 | [m01-shared-data-consumer](contracts/m01-shared-data-consumer-contract.md) §3 |
| V3 | Story 1 | Tải lại `/trip` giữa phiên, rồi offline và tải lại | Cùng phiên, cùng lượt ghé | field-ui-flow §5 |
| V4 | Story 1 | Hai tab cùng vào `/trip` với một handoff mới | Đúng một phiên | [research](research.md) R-06 |
| V5 | Story 2 | Online quét `Q1a` rồi `Q1b` | Một lượt ghé `C1` (`qrIdentifier = Q1a`); hai nội dung khác nhau; lần hai hiện giờ ghé cũ | [scan-resolution](contracts/scan-resolution-contract.md) §2 dòng 1 |
| V6 | Story 2 | Online quét `QN` | `VALID` với `checkpointId = C2` → lượt ghé `C2` (`qrIdentifier = QN`); journey không đổi | scan-resolution dòng 1 |
| V7 | Story 2 | Offline quét `QN` | "Cần có kết nối mạng…"; không lượt ghé | scan-resolution dòng 7 |
| V8 | Story 2 | Giả lập lỗi tải ảnh sau khi ghi lượt ghé | Lượt ghé còn sau khi tải lại | scan-resolution §3 |
| V9 | Story 3 | Online quét `Q2`, đổi VI ↔ EN khi audio `vi` đang phát | Danh sách đổi ngay; tệp `vi` dừng khi chuyển EN; `NONE` luôn có; không autoplay | [live-qr-lookup-consumer](contracts/live-qr-lookup-consumer-contract.md) §4 |
| V10 | Story 3 | Offline quét `Q1a` có gói; quét `Q2` offline | `Q1a`: chữ + ảnh từ gói, không media; `Q2` (`ONLINE_AVAILABLE`): "Điểm này cần có mạng để xem nội dung."; cả hai có lượt ghé. Gói thiếu resource của mã: "Chưa có nội dung offline cho điểm này." | scan-resolution dòng 6 |
| V11 | Story 3 | Gói A v2 (`OUTDATED`), phiên v3, offline quét `Q1a` | Nội dung gói + cảnh báo gói cũ | m01-shared-data-consumer §4 |
| V12 | Story 3 | Lookup không trả lời 8 s (provisional) với `Q1a` | Thông báo lỗi nguồn, lượt ghé, nội dung gói; không bao giờ "mã không hợp lệ" | live-qr-lookup-consumer §3 |
| V13 | Story 4 | Online quét `QX` | Nội dung live, không lượt ghé | scan-resolution dòng 2 |
| V14 | Story 4 | Lookup trả `TEMPORARILY_CLOSED` (`ROUTE`, rồi `CHECKPOINT`) và `INVALID` | Cùng thông báo tạm đóng cho hai scope; không nội dung; không lượt ghé | scan-resolution dòng 4, 5 |
| V15 | Story 4 | Scanner đọc `https://evil.example/q/Q1a`, chuỗi không phải URL, `…/q/Q1a?x=1` | Thông báo mã không hợp lệ; không có request lookup | live-qr-lookup-consumer §2 |
| V16 | Story 5 | Quét `Q3` lần đầu | Câu hỏi kết thúc một lần; [Đi tiếp] → Finish còn; quét lại `Q3` → không hỏi | scan-resolution §3 |
| V17 | Story 5 | [Kết thúc] khi chưa quét `C2` | `HOAN_TAT`; mục hàng đợi `PENDING` cùng transaction | [session-sync-record](contracts/session-sync-record-contract.md) §2 |
| V18 | Story 5 | Handoff mới khi đang có phiên; giả lập lỗi chèn phiên mới | Thành công: cũ `BO_DO` + mục hàng đợi, mới chạy; lỗi: phiên cũ vẫn chạy, không có mục hàng đợi | research R-06 |
| V19 | Story 5 | Đặt giờ thiết bị +24 h 1 ms rồi đưa trang hiện lại (có/không lượt ghé `C3`) | `HOAN_TAT` hoặc `BO_DO`; `endedAt` = `checkedInAt` mới nhất hoặc `startedAt`; thông báo tự kết thúc | research R-09 |
| V20 | Story 6 | `/q/Q1a` không có phiên, trình duyệt `vi-VN` chưa có preference | Nội dung ngay, tiếng Việt, gợi ý khách tự do + "Chọn tuyến"; request không có `routeId`; 3 store M02 rỗng | field-ui-flow §2 |
| V21 | Story 6 | `/q/Q1a` khi có phiên trong cùng trình duyệt | Như quét trong app (lượt ghé, câu hỏi kết thúc nếu là điểm cuối) | scan-resolution §1 |
| V22 | Story 6 | Offline, đã từng mở app: `/q/Q1a` có phiên và không phiên | Có phiên: như dòng 6; không phiên: "Cần có kết nối mạng…" + gợi ý | field-ui-flow §4 |
| V23 | Story 6 | Camera bị từ chối khi bấm "Quét" | Thông báo camera cố định | field-ui-flow §5 |
| V24 | Story 7 | Intake trả `ACCEPTED`; gửi lại (mất response) → `IDENTICAL` | `SYNCED`, một lần ghi phía mock | session-sync-record §4 |
| V25 | Story 7 | Intake trả 409, rồi một mục khác 422 | Cả hai `CONFLICT`; không gửi lại; dòng lỗi ở SCR-M02-001 | session-sync-record §4 |
| V26 | Story 7 | Intake trả 503, offline, 429 | `PENDING`; gửi lại khi trang hiện lại hoặc có mạng | session-sync-record §4 |
| V27 | — | Có phiên đang chạy, chỉ mở tab M01, có bản build mới | Bản mới không được áp dụng cho tới khi phiên kết thúc | field-ui-flow §4 |
| V28 | — | Quét DOM và từ điển tìm "đã đến", "có mặt", "arrived" | Không có | field-ui-flow §3; SC-M02-013 |
| V29 | — | Contract test `SessionSyncRecord` strict | Fixture hợp lệ qua; khóa lạ (`deviceId`), `status = DANG_DIEN_RA`, `checkpointName` dạng object bị từ chối | session-sync-record §1 |

## 5. Bằng chứng thành công mong đợi

- `npm run typecheck`, `lint`, `test`, `build` thoát mã 0; Vitest có test contract cho `SessionSyncRecord` và consumer cho `LiveQrLookupResult`, test cho mọi dòng của scan-resolution §2.
- `npm run e2e -- --grep m02`: V1–V29 pass trên network mock và camera giả.
- Tích hợp local (sau M03 giai đoạn B): V5, V14, V20, V24, V25 pass trên stack Supabase local; trước đó ghi `NOT RUN`.
- Kiểm thủ công trên thiết bị thật (camera, quyền, camera hệ thống mở link, offline): ghi riêng; Playwright không thay thế.

## 6. Giới hạn

- Lookup/intake/media thật phụ thuộc M03 giai đoạn B (bị chặn); dữ liệu M01 phụ thuộc package 001.
- `LOOKUP_TIMEOUT_SECONDS` = 8 là **provisional**; chủ dự án kiểm chứng trên thiết bị thật trước lần phát hành thật đầu tiên (spec-M02 §9).
- Camera giả của Chromium không đại diện cho iOS Safari; hành vi "app cài trên màn hình chính iPhone không nhận link" không kiểm tự động được.
- Đổi giờ thiết bị trong E2E dùng đồng hồ giả của Playwright (`page.clock`), không phải đồng hồ hệ thống.
