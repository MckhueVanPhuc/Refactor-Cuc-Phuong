# Implementation Plan: M03 — Operations & Content Administration

**Branch**: `003-m03-operations-content-administration` *(định danh thư mục; git branch cùng tên đã tạo)* | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification [specs/003-m03-operations-content-administration/spec.md](spec.md), bản dẫn xuất từ [spec-M03 v3.7](../../docs/spec/spec-M03.md) (Change Brief CHG-M03-2026-10-29-01).

**Note**: Plan này là bản dẫn xuất (Layer 3). Nó không tạo requirement, không đổi tên contract hay ID. Hành vi lấy từ spec-M03. Quyết định kỹ thuật lấy từ [tech-stack.md](../../docs/architecture/tech-stack.md), [environment.md](../../docs/architecture/environment.md), [system-configuration.md](../../docs/architecture/system-configuration.md) và [Physical Schema](../../data/06-physical-schema.md); phần nguồn để trống được quyết ở [research.md](research.md).

## Summary

M03 cho nhân viên Vườn quốc gia làm các việc sau: tạo và tự xuất bản tuyến, thư viện điểm dừng dùng chung, điểm tham quan có mã QR với nội dung song ngữ (qua màn review bắt buộc); đóng, mở lại và lưu trữ có kiểm soát; quản lý hai role cố định; xem lịch sử, khôi phục, audit; xem hai báo cáo. Đầu ra là ba contract cho module khác: **Published Route projection** và **`JourneySnapshot`** cho M01, **`LiveQrLookupResult`/`LiveStationContent`** cho M02. Đầu vào là **`SessionSyncRecord`** từ M02, được lưu thành **`SessionRecord`**.

Cách làm kỹ thuật:

- **Frontend:** SPA React + TypeScript + Vite trong website/PWA dùng chung. M03 là cây route `/admin/*` được bảo vệ, online-only, lazy-load.
- **Backend:** Supabase. Đọc công khai qua view/RPC trong schema `api`. Command quản trị là RPC `SECURITY DEFINER` có kiểm tra role, chạy một transaction, khóa tập kết nối, ghi đúng một dòng audit. Edge Function dùng cho intake phiên và Auth Admin.
- **Phân giai đoạn:** Giai đoạn A (frontend, adapter, contract, cấu hình local) nằm trong phạm vi code hiện tại. Giai đoạn B (migration, RPC, Edge, pgTAP) được mở **chỉ trên stack local** theo change brief backend CHG-M03-2026-10-30-01, duyệt 2026-10-30 (AGENTS.md §2; [research.md](research.md) R-01).

## Technical Context

**Language/Version**: TypeScript (strict) trên Node.js 24 LTS cho toolchain; React cho UI; SQL/PL/pgSQL trên PostgreSQL của Supabase (giai đoạn B); TypeScript trên Deno cho Edge Function (giai đoạn B). Phiên bản dependency chính xác được pin khi task setup cài đặt thật (R-02).

**Primary Dependencies**: `react`, `react-dom`, `react-router` (data mode), `@supabase/supabase-js`, `zod`, `qrcode` 1.5.x + `@types/qrcode` (lazy-load); dev: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa` (shell), `typescript`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test`; Supabase CLI. Không thêm thư viện state, form hay kéo-thả (R-03, R-20, R-21).

**Storage**: Supabase PostgreSQL, schema `app` (9 bảng M03, private) và `api` (view/function được mở cho Data API); Supabase Storage bucket private `quest-media`; Supabase Auth cho danh tính admin. M03 không có lưu trữ trên trình duyệt (online-only; MVP-Scope §5).

**Testing**: Vitest + Testing Library (unit, contract Zod, component; đặt cạnh mã nguồn trong `src/`); Playwright (E2E trong `e2e/`); pgTAP + `supabase test db` trên stack local (giai đoạn B). Chỉ dùng fixture synthetic; không test trên Shared Backend (R-23).

**Target Platform**: Trình duyệt hiện đại trên máy tính và máy tính bảng của nhân viên (web client dùng chung, Single Vercel Project); backend là Single Supabase Cloud Project; phát triển trên Local Development Workstation.

**Project Type**: Web application, modular monolith (một frontend codebase với 3 module logic + một BaaS backend).

**Performance Goals**: Mục tiêu kỹ thuật, không phải requirement (BR-M03-G07): publish/close/reopen ≤ 5 s p95 trên stack local với fixture ở giới hạn provisional; `api.lookup_qr` ≤ 300 ms p95 trên local; route `/admin/*` và `qrcode` được lazy-load (R-24).

**Constraints**: Online-only; tính atomic cho mọi thay đổi công khai (BR-M03-F03, X02); không có broker, queue, cron hay scheduler (constitution VII); không hard-delete (DEC-S6-002); không có secret trong `VITE_*`; giao diện tiếng Việt giản dị, không có dữ liệu thô (BR-M03-L09–L13); mọi giới hạn số là **provisional** (spec-M03 §5.3).

**Scale/Scope**: 10 màn hình (SCR-M03-000…009); 11 function (FN-M03-001…011); 18 FR còn hiệu lực (FR-M03-001…016, 018, 019); 9 entity canonical; 19 command, 14 query, 2 Edge Function. Nguồn không nêu số admin hay lưu lượng du khách; giới hạn nội dung theo §5.3 (30 điểm dừng/tuyến, 20 QR/điểm dừng — provisional).

Mọi mục `NEEDS CLARIFICATION` ban đầu đã được giải quyết ở [research.md](research.md) §1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Đối chiếu với [constitution](../../.specify/memory/constitution.md) v2.0.2.

| Nguyên tắc | Kiểm tra | Pre-Phase 0 | Post-Phase 1 | Bằng chứng |
|---|---|---|---|---|
| I. Spec-First Behavioral Authority | Không thêm behavior; mọi quy tắc trỏ tới spec-M03; phần trống được đánh dấu rồi giải quyết ở mức kỹ thuật | PASS | PASS | research §1; mọi contract có cột BR/FR; R-06 và R-09 ghi rõ cách đọc nguồn thay vì thêm quy tắc |
| II. Module Ownership Boundaries | M03 chỉ ghi 9 entity của nó; tên contract giữ nguyên (Published Route, `JourneySnapshot`, `LiveQrLookupResult`/`LiveStationContent`, `SessionSyncRecord`); `SessionSyncRecord` ≠ `SessionRecord`; không đọc giá trị staging của module khác | PASS | PASS | data-model §1, §3; [contracts/](contracts/) theo AGENTS.md §3.2; Zod schema dùng chung (R-04) |
| III. Minimal Diff & Traceability | Chỉ tạo file trong package; ID ổn định; artifact stale được ghi lại, không tự sửa | PASS | PASS | research §4 liệt kê 5 điểm upstream có nguy cơ stale |
| IV. Data Integrity & Immutability | Snapshot, revision `PHAT_HANH`, `SessionRecord`, audit là append-only; version liên tục; retry idempotent; media không bị ghi đè; không purge | PASS | PASS | data-model §9; publication-public §4; session-intake §2 |
| V. Security & Authorization | Phân quyền phía server (`app.current_admin()`, RLS, grant); Reviewer cuối được bảo vệ bằng transaction; lời mời và khôi phục không chạm role; cấp Reviewer đầu tiên chỉ phía server; `SECURITY DEFINER` có `search_path` cố định, `EXECUTE` cấp rõ, kiểm tra trong function; không secret trong `VITE_*`; không PII trong session; xác minh Storage trước khi tham chiếu | PASS | PASS | auth-account §1–§2; admin-command §7; media-storage §1, §4; R-05, R-15, R-16 |
| VI. Offline Integrity & PWA Contract | M03 online-only; Workbox không cache Supabase, Auth, response quản trị hay media đã ký; không tự cập nhật service worker khi còn form M03 chưa lưu | PASS | PASS | R-22; admin-ui-flow §2 |
| VII. Simplicity & MVP Scope | Không thêm role, khái niệm hay capability Won't; không broker, cron hay scheduler; báo cáo tính theo yêu cầu; mọi RPC trỏ tới FR/BR; không dependency mới ngoài tech-stack | PASS | PASS | admin-command §5–§6 (cột BR/FR); R-17, R-21, R-25 |
| Security Principles checklist | RLS cho read công khai; command có role check; Edge validate Zod; không secret trong `VITE_*`; audit không có token; guard Reviewer cuối trong DB; lời mời và khôi phục không đổi role/status | PASS (thiết kế) | PASS (thiết kế) | thực thi ở giai đoạn B; test có trong các bảng "Truy vết test" |
| Testing & Validation | Mỗi BR có test; contract test phủ Required/Conditional/Optional; test rollback; test bảo mật; không tuyên bố PASS khi chưa chạy | PASS có điều kiện | PASS có điều kiện | test map trong từng contract; việc nối CI được ghi ở Complexity Tracking #3 |

**Kết quả:** **PASS** cả trước Phase 0 và sau Phase 1. Không có vi phạm chưa được giải trình. Ba điểm ràng buộc phạm vi hoặc tiến trình (không phải vi phạm nguyên tắc) được ghi ở Complexity Tracking để người duyệt plan quyết.

## Project Structure

### Documentation (this feature)

```text
specs/003-m03-operations-content-administration/
├── spec.md                         # đầu vào (đã có)
├── checklists/requirements-quality.md   # đầu vào (đã có)
├── plan.md                         # file này
├── research.md                     # Phase 0
├── data-model.md                   # Phase 1
├── quickstart.md                   # Phase 1
├── contracts/                      # Phase 1
│   ├── publication-public-contract.md   # M03 → M01: Published Route projection, JourneySnapshot
│   ├── live-qr-lookup-contract.md       # M03 → M02: LiveQrLookupResult / LiveStationContent (+ link QR công khai)
│   ├── session-intake-contract.md       # M02 → M03: SessionSyncRecord → SessionRecord
│   ├── admin-command-contract.md        # M03 UI ↔ backend: command, query, ValidationIssue, PublicationReview, báo cáo
│   ├── auth-account-contract.md         # Auth provider ↔ M03: đăng nhập, lời mời, khôi phục, role, đăng xuất
│   ├── media-storage-contract.md        # upload, xác minh, quyền đọc media
│   └── admin-ui-flow-contract.md        # màn hình → route → command → thông báo; ảnh in QR; xem trước
└── tasks.md                        # Phase 2 (/speckit-tasks — KHÔNG tạo ở bước này)
```

### Source Code (repository root)

```text
src/
├── app/                              # shell dùng chung (router gốc, provider, update coordinator PWA)
│   └── (do package nào code trước tạo; M03 chỉ thêm route /admin/* và unsaved-form registry)
├── shared/
│   ├── contracts/                    # Zod + TS cho contract cross-module (R-04)
│   │   ├── publishedRoute.ts
│   │   ├── journeySnapshot.ts
│   │   ├── liveQrLookup.ts           # LiveQrLookupResult, LiveStationContent
│   │   └── sessionSyncRecord.ts
│   ├── config/                       # đọc + validate VITE_*; IS_PRODUCTION_BUILD (R-13, R-14)
│   ├── supabase/                     # client factory (publishable key)
│   ├── testing/                      # e2eHooks.ts: cầu nối test E2E, chỉ ở MODE e2e/fake (tasks M03 T007)
│   └── ui/                           # token CSS từ design-system, component nền, icon từ assets/icons/
└── modules/
    └── m03/
        ├── routes.tsx                # cây /admin/* lazy (admin-ui-flow §1)
        ├── api/                      # adapter có kiểu: command, query, Edge; ánh xạ lỗi → messageKey (R-05, R-06)
        │   ├── contract/             # bộ test hành vi dùng chung cho adapter giả và Supabase (tasks T043, T197)
        │   └── fake/                 # adapter giả in-memory cho test giai đoạn A
        ├── contracts/                # ValidationIssue, PublicationReview, CommandResult
        ├── config/limits.ts          # hằng §5.3 — provisional (R-19)
        ├── messages/                 # catalog.ts (§5.6), displayNames.ts (§5.4), hints.ts (§5.5) (R-18)
        ├── validation/               # kiểm tra lúc lưu + khoảng trống xuất bản (hàm thuần)
        ├── editor/                   # khung editor dùng chung: form nháp, lỗi trường, panel thiếu, chặn rời trang
        ├── layout/                   # AdminLayout: header, điều hướng, đăng xuất
        ├── auth/                     # SCR-M03-000, 007; guard; sign-out
        ├── accounts/                 # SCR-M03-006
        ├── route-admin/              # SCR-M03-001, 002
        ├── checkpoint-library/       # SCR-M03-008
        ├── visit-points/             # SCR-M03-003, qr-print/ (lazy qrcode), preview/
        ├── publication-review/       # SCR-M03-004
        ├── operations/               # hộp thoại đóng/mở lại/lưu trữ/thu hồi
        ├── history/                  # lịch sử, khôi phục, bỏ thay đổi; SCR-M03-009 nhật ký
        ├── reports/                  # SCR-M03-005
        └── media/                    # hàng đợi upload theo tệp

e2e/                                  # Playwright (cần xác nhận phạm vi — Complexity Tracking #2)

supabase/
├── config.toml                       # chỉ local (trong phạm vi)
├── seed.sql                          # synthetic, chỉ local (trong phạm vi)
├── migrations/                       # GIAI ĐOẠN B — chỉ local, CHG-M03-2026-10-30-01 (Physical §13 bước 1–5)
├── functions/
│   ├── _shared/                      # GIAI ĐOẠN B: cors.ts, bản sao sessionSyncRecord.ts (Edge chỉ import trong supabase/functions)
│   ├── session-intake/               # GIAI ĐOẠN B
│   └── admin-accounts/               # GIAI ĐOẠN B
├── scripts/provision-initial-reviewer.ts   # GIAI ĐOẠN B, chỉ cho operator (R-16)
└── tests/                            # GIAI ĐOẠN B, pgTAP

package.json, package-lock.json, tsconfig*.json, vite.config.ts, vitest.config.ts,
playwright.config.ts, .env.example    # tooling gốc (Complexity Tracking #2)
vercel.json                           # rewrite SPA + header cache — Phase 16, CHG-M03-2026-11-05-01
```

**Structure Decision**: Một web app (modular monolith). M03 nằm trọn trong `src/modules/m03/`. Phần dùng chung giữa các module chỉ có `src/shared/contracts` (schema contract), `src/shared/config`, `src/shared/supabase`, `src/shared/ui` và shell `src/app`. M03 không import gì từ `src/modules/m01|m02`, và ngược lại (constitution II). Backend nằm dưới `supabase/`, theo đúng thứ tự migration của Physical Schema §13.

## Component Responsibilities

| Thành phần | Trách nhiệm | FN / FR | Contract |
|---|---|---|---|
| `auth/` | Đăng nhập, kiểm tra tài khoản active, guard `/admin/*`, đăng xuất, nhận lời mời, khôi phục | FN-M03-008; FR-M03-013 | auth-account |
| `accounts/` | Mời, gửi lại, đổi role, khóa/mở khóa | FN-M03-008; FR-M03-013 | auth-account, admin-command C-18/19 |
| `route-admin/` | Danh sách tuyến; editor 4 bước; chọn và sắp xếp điểm dừng; đóng/mở lại/lưu trữ/hủy tuyến | FN-M03-001, 007; FR-M03-001, 011 | admin-command C-01, C-07, C-09, C-12, C-14 |
| `checkpoint-library/` | Thư viện; editor điểm dừng; mode + xác nhận khảo sát; danh sách điểm tham quan | FN-M03-002; FR-M03-002 | admin-command C-02, C-10, C-11, C-13, C-15 |
| `visit-points/` | Form điểm tham quan; media; ảnh in QR; xem trước; in lại/thu hồi/hủy | FN-M03-003, 004; FR-M03-003, 004 | admin-command C-03, C-16, C-17; media-storage; admin-ui-flow §4–5 |
| `publication-review/` | Mở `PublicationReview`, xác nhận một lần với revision đã xem lại | FN-M03-005, 006; FR-M03-006, 008, 009 | admin-command C-05, Q-08 |
| `operations/` | Hộp thoại đóng/mở lại/lưu trữ/thu hồi với tác động và lý do | FN-M03-007; FR-M03-011 | admin-command Q-09 |
| `history/` | Lịch sử từng mục; khôi phục; bỏ thay đổi; nhật ký toàn hệ thống | FN-M03-011; FR-M03-007, 018 | admin-command C-06, C-08, Q-10, Q-11 |
| `reports/` | RPT-01, RPT-02, ghi chú một dòng | FN-M03-010; FR-M03-015, 016 | admin-command Q-12, Q-13 |
| `messages/`, `validation/` | Danh mục thông báo, tên hiển thị, câu gợi ý; kiểm tra lúc lưu; panel thiếu | FN-M03-005; FR-M03-005, 019 | admin-command §3 |
| `api/` | Adapter có kiểu, Zod cho response, ánh xạ lỗi, AbortController | — | mọi contract |
| Backend `api.published_routes`, `api.active_journey_snapshots` | Projection công khai | FN-M03-001, 006; FR-M03-008–010 | publication-public |
| Backend `api.lookup_qr` | Lookup live, chỉ đọc | FN-M03-009; FR-M03-012 | live-qr-lookup |
| Backend command function | Lưu, xuất bản, snapshot, đóng/mở lại/lưu trữ, khôi phục, tài khoản, báo cáo | FN-M03-001…011 | admin-command |
| Edge `session-intake` | Zod strict + `api.ingest_session` | FN-M03-010; FR-M03-014 | session-intake |
| Edge `admin-accounts` | Auth Admin: mời, gửi lại, nối danh tính | FN-M03-008; FR-M03-013 | auth-account |

## Data Flow and Persistence Boundaries

- **Lưu nháp:** editor → `save_*_draft` (một transaction: thực thể + revision `NHAP` + ghi chú nội bộ + tick media + audit). Không đụng tới dữ liệu công khai.
- **Xuất bản:** review (đọc trên dữ liệu đã lưu) → `publish_unit` (khóa tập → kiểm tra revision → guard → promote revision → dựng và so sánh snapshot cho mọi tuyến bị ảnh hưởng → chèn version → chuyển `active_content_version` → audit). Lỗi thì rollback toàn bộ, kèm audit FAILURE (R-07, R-10).
- **Đóng/mở lại/thu hồi:** command → cùng một transaction với các snapshot thay thế. Đóng tuyến không cần snapshot.
- **Media:** client → Storage (upload) → `register_media` (xác minh) → lưu nháp (gắn) → xuất bản (guard). Xem [media-storage-contract.md](contracts/media-storage-contract.md).
- **Công khai:** M01/M02 đọc `api.*` qua Data API, có RLS và field whitelist; M03 không đẩy gì cho họ.
- **Intake:** M02 → Edge `session-intake` → `api.ingest_session` → `app.session_records`. Báo cáo đọc bảng này theo yêu cầu.
- **Trình duyệt:** M03 không lưu gì ngoài phiên Supabase Auth; không có IndexedDB hay Cache Storage cho dữ liệu quản trị.

## Integration Contracts

| Hướng (AGENTS.md §3.2) | Contract | File |
|---|---|---|
| M03 → M01 | Published Route projection, `JourneySnapshot` | [publication-public-contract.md](contracts/publication-public-contract.md) |
| M03 → M02 | `LiveQrLookupResult` với `LiveStationContent` (+ link QR công khai) | [live-qr-lookup-contract.md](contracts/live-qr-lookup-contract.md) |
| M02 → M03 | `SessionSyncRecord` → `SessionRecord` | [session-intake-contract.md](contracts/session-intake-contract.md) |
| M01 → M02 (`LanguagePreference`, `SelectedRouteContext v3`, ready `OfflinePackage`) | không thuộc M03 | package 001/002 |
| Nội bộ M03 | command/query; auth; media; UI flow | [admin-command](contracts/admin-command-contract.md), [auth-account](contracts/auth-account-contract.md), [media-storage](contracts/media-storage-contract.md), [admin-ui-flow](contracts/admin-ui-flow-contract.md) |

Phụ thuộc với package khác: shell `src/app` và cấu hình PWA dùng chung với 001/002. Schema trong `src/shared/contracts/` là nguồn chung: M01 và M02 phải import nó, không định nghĩa lại.

## Implementation Sequence (định hướng cho `/speckit-tasks`)

| Bước | Nội dung | Giai đoạn | Phụ thuộc |
|---|---|---|---|
| 1 | Tooling: `package.json`, TS strict, Vite, Vitest, Playwright, `.env.example`, `supabase/config.toml` local (tắt self sign-up) | A | xác nhận Complexity #2 |
| 2 | `src/shared/config`, `src/shared/supabase`, token UI từ design-system, shell tối thiểu nếu chưa có | A | 1 |
| 3 | `src/shared/contracts` (4 schema cross-module) + contract test bằng fixture synthetic | A | 1 |
| 4 | `m03/messages`, `m03/config/limits` (provisional), `m03/validation`, `m03/contracts` + test | A | 1 |
| 5 | `m03/api` (interface + adapter Supabase + adapter giả) | A | 3, 4 |
| 6 | Auth + guard + đăng xuất (SCR-M03-000, 007), accounts (SCR-M03-006) | A | 5 |
| 7 | Thư viện điểm dừng (SCR-M03-008) → điểm tham quan + media + ảnh in QR (SCR-M03-003) | A | 5 |
| 8 | Editor tuyến (SCR-M03-001, 002) | A | 7 |
| 9 | Review + xuất bản (SCR-M03-004); hộp thoại vận hành; lịch sử, khôi phục; nhật ký (SCR-M03-009) | A | 7, 8 |
| 10 | Báo cáo (SCR-M03-005); xem trước như du khách (Should) | A | 5 |
| 11 | Migration 1–2: schema, `app.new_id`, `app.limit`, 9 bảng, hàm validate, trigger | **B** | change brief backend (CHG-M03-2026-10-30-01, đã duyệt) |
| 12 | Migration 3: command function (lưu, xuất bản + snapshot, đóng/mở lại, khôi phục, media, tài khoản, báo cáo) | B | 11 |
| 13 | Migration 4–5: RLS, grant, view `api`, `lookup_qr`, `ingest_session`; bucket và policy Storage (gồm R-12) | B | 12 |
| 14 | Edge `session-intake`, `admin-accounts`; script cấp Reviewer đầu tiên | B | 13 |
| 15 | pgTAP + E2E trên stack local (Q1–Q26 của quickstart) | B | 11–14 |

M03 là một package theo quyết định của người dùng. Nếu tasks.md quá lớn, có thể tách theo bước 6–10 (giai đoạn A) và bước 11–15 (giai đoạn B) mà không đổi plan.

## Risks

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| Giai đoạn B không được mở | M03 không hoạt động thật; M01/M02 không có nguồn | Complexity #1; adapter giả giữ đúng contract để giai đoạn B cắm vào |
| Độ phức tạp khi dựng snapshot nhiều tuyến trong một transaction | Chậm hoặc dễ deadlock | khóa sắp theo id (R-08); mục tiêu hiệu năng (R-24); test đồng thời |
| Lệch giới hạn provisional giữa client và `app.limit` | Phản hồi trên UI khác kết quả server | một module hằng + test so khớp (R-19) |
| Dọn dẹp media mồ côi | Tốn dung lượng | chấp nhận; dọn theo yêu cầu (R-11) |
| Lạm dụng intake/lookup công khai | Báo cáo bị nhiễu | giới hạn của nền tảng + trần kích thước body; rủi ro đã chấp nhận ở spec §9 (R-25) |
| Địa chỉ Production `vercel.app` phụ thuộc Vercel project | Mất project thì tem đã dán hỏng | ràng buộc ở environment.md §4; rủi ro đã chấp nhận ở CHG-M03-2026-11-05-01 §9; dấu BẢN THỬ fail-safe (R-13) |
| Lệch nguồn upstream (research §4) | Tài liệu không đồng bộ | báo cáo; sửa bằng task riêng |

## Validation Strategy

- **Giai đoạn A:** typecheck, lint, unit, contract (Zod fixture), component, E2E trên adapter giả; quét từ cấm trong DOM; test so khớp danh mục thông báo và hằng provisional.
- **Giai đoạn B:** pgTAP (CHECK, trigger, lifecycle, immutability, RLS, grant, Reviewer cuối, khóa tập, rollback snapshot); E2E Q1–Q26 trên stack local; phần không chạy được ghi `NOT RUN`.
- **Ánh xạ BR → test:** nằm ở mục "Truy vết test" của từng contract; tasks.md phải tạo ít nhất một test cho mỗi BR-M03 còn hiệu lực (constitution "Testing & Validation").
- **Phát hành:** chỉ smoke check non-destructive trên cloud (environment.md §11), nằm ngoài package này.

## Downstream References

- `/speckit-tasks` đọc: plan.md, research.md, data-model.md, contracts/*.md, quickstart.md.
- Package 001 (M01) và 002 (M02) phải dùng `src/shared/contracts/*` cho Published Route, `JourneySnapshot`, `LiveQrLookupResult`/`LiveStationContent`, `SessionSyncRecord`.
- Artifact upstream có nguy cơ stale: [research.md](research.md) §4.

## Complexity Tracking

> Không có vi phạm nguyên tắc constitution. Các mục dưới đây là ràng buộc phạm vi hoặc tiến trình, cần người duyệt plan quyết.

| # | Mục | Vì sao cần | Phương án đơn giản hơn bị loại vì |
|---|---|---|---|
| 1 | Backend (SQL migration, RPC, Edge Function, pgTAP, script cấp Reviewer) được thiết kế nhưng **bị chặn** ở giai đoạn B; AGENTS.md §2 chưa mở phạm vi này | FR-M03-008/009/011/012/014 và constitution V cần giao dịch và phân quyền phía server | Làm backend ngay thì vi phạm AGENTS.md §2. Chỉ làm frontend thì không đáp ứng FR. **Cần:** một change brief code cho backend trước khi tasks giai đoạn B được thực thi |
| 2 | File tooling gốc (`package.json`, lockfile, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`) và thư mục `e2e/` không được AGENTS.md §2 nêu đích danh | Không có `package.json` thì không có code TypeScript/Vite nào chạy được; Playwright cần config và thư mục spec | Đặt E2E trong `src/` thì trộn test trình duyệt với mã ứng dụng. **Cần:** người dùng xác nhận các file này nằm trong "cấu hình Vite" khi duyệt plan |
| 3 | Constitution yêu cầu "Every BR-* rule MUST have a corresponding test executable in CI", nhưng repo chưa có CI config và CI không có trong phạm vi được mở | Test phải chạy tự động khi merge | Thêm workflow CI ngay thì mở thêm phạm vi mà chưa có phê duyệt. **Tạm thời:** mọi test chạy được bằng `npm run test` / `supabase test db`; việc nối CI cần một quyết định riêng |
| 4 | Command dùng `SECURITY DEFINER` thay vì security-invoker mặc định | `authenticated` không có DML trên bảng, nên command cần quyền của owner để giữ invariant giữa nhiều bảng (PT-07) | Security-invoker + DML cho `authenticated` thì RLS phải mã hóa toàn bộ invariant nhiều bảng và mở bề mặt tấn công. Constitution V cho phép definer với ba điều kiện, cả ba đều được áp |

**Quyết định (2026-10-30, người dùng ủy quyền cho agent quyết; tasks.md T001):**

- **#1:** đã giải quyết — change brief backend CHG-M03-2026-10-30-01 ([change-brief-CHG-M03-2026-10-30-01-backend.md](change-brief-CHG-M03-2026-10-30-01-backend.md)) được chủ dự án duyệt 2026-10-30 (tasks M03 T166–T167): giai đoạn B mở phạm vi chỉ trên stack Supabase local; cấu hình cloud và deploy mở theo change brief triển khai CHG-M03-2026-11-05-01 ([change-brief-CHG-M03-2026-11-05-01-deployment.md](change-brief-CHG-M03-2026-11-05-01-deployment.md), duyệt 2026-11-05; tasks M03 T201).
- **#2:** duyệt — các file tooling gốc nêu ở #2 và thư mục `e2e/` được coi là thuộc "cấu hình Vite".
- **#3:** duyệt nối CI (người dùng, 2026-10-30; thay quyết định hoãn trước đó): .github/workflows/ci.yml chạy `npm run ci` và E2E project mock trên mỗi push/PR (tasks M03 T002); job Supabase local thêm khi giai đoạn B mở (tasks M03 T198).
- **#4:** giữ thiết kế `SECURITY DEFINER` như đã giải trình.
