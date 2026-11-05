# Cúc Phương Quest

Ứng dụng web (PWA) cho Vườn quốc gia Cúc Phương:

- **Du khách** chọn tuyến tham quan, tải trước nội dung cho khu vực không có sóng, rồi quét mã QR dọc đường để đọc giới thiệu về cây, con, địa điểm.
- **Nhân viên vườn** soạn và xuất bản tuyến, điểm dừng, mã QR, đóng/mở tuyến khi cần, quản lý tài khoản và xem báo cáo.

Repository làm theo hướng **spec-first**: đặc tả nghiệp vụ là nguồn sự thật, mọi tài liệu thiết kế, gói triển khai và code đều dẫn xuất từ đặc tả. Trước khi sửa bất kỳ thứ gì, đọc [AGENTS.md](AGENTS.md).

---

## 1. Trạng thái (cập nhật 2026-11-05)

Hệ thống là một modular monolith gồm ba module logic, chạy chung một website và một backend Supabase.

| Module | Làm gì | Đặc tả | Code |
|---|---|---|---|
| **M01 — Route Planning & Preparation** | Chọn ngôn ngữ, xem và gợi ý tuyến, tải gói offline, bắt đầu chuyến đi | [Spec v3.2](docs/spec/spec-M01.md) | ✅ Xong ([gói 001](specs/001-m01-route-planning-preparation/), 106/106 task) |
| **M02 — Field Quest Experience** | Phiên thực địa, quét QR, hiển thị nội dung, kết thúc chuyến, đồng bộ ẩn danh | [Spec v3.3](docs/spec/spec-M02.md) | ✅ Xong trên stack local ([gói 002](specs/002-m02-field-quest-experience/), 106/106 task); còn checklist trên thiết bị thật |
| **M03 — Operations & Content Administration** | Đăng nhập quản trị, tuyến, thư viện điểm dừng, mã QR, xem lại và xuất bản, đóng/mở, báo cáo, nhật ký | [Spec v3.7](docs/spec/spec-M03.md) | ✅ Frontend và backend xong trên stack local ([gói 003](specs/003-m03-operations-content-administration/), 201/210 task; còn lại là Phase 16) |

Ngoài ba module còn **AI Integration** — một năng lực dùng cho M03, không phải module thứ tư: nút "→" dịch ô tiếng Việt sang ô tiếng Anh trong các editor M03 ([Spec v1.0](docs/spec/spec-AI_integration.md), priority Could, [gói 004](specs/004-ai-translation/), 34/34 task).

**Đang làm:** đưa lên cloud (Vercel + Supabase Cloud) theo [change brief CHG-M03-2026-11-05-01](specs/003-m03-operations-content-administration/change-brief-CHG-M03-2026-11-05-01-deployment.md) (M03 Phase 16). Chưa có gì được deploy; hiện mọi thứ chạy trên máy local.

Phạm vi Must/Should/Could/Won't: [MVP-Scope.md](MVP-Scope.md).

---

## 2. Chạy thử trên máy

Mục này dành cho lập trình viên chạy app trên máy của mình, nên mọi địa chỉ đều là `localhost`. Mật khẩu và tài khoản dưới đây là dữ liệu giả, không tồn tại trên website thật. Địa chỉ website thật không ghi trong repo.

Yêu cầu: **Node.js 24** và npm. Sau khi clone:

```bash
npm ci
```

### 2.1 Không cần backend — trang quản trị M03 với dữ liệu giả

```bash
npm run dev:fake
```

Mở <http://localhost:5174/admin/login>. Mật khẩu chung `Matkhau-thu-123`:

| Tài khoản | Vai trò |
|---|---|
| `reviewer@example.test` | Quản lý (đủ quyền) |
| `staff@example.test` | Nhân viên nội dung |
| `locked@example.test` | Tài khoản bị khóa (để thử lỗi) |

Dữ liệu nằm trong bộ nhớ trình duyệt: lúc đầu chỉ có tài khoản, chưa có tuyến hay điểm dừng; tải lại trang là mất. Phần du khách (M01, M02) cần backend nên không có dữ liệu ở chế độ này.

### 2.2 Đầy đủ — stack Supabase local

Cần thêm **Docker Desktop** và **Supabase CLI**.

```bash
supabase start        # dựng Postgres, Auth, Storage, Edge Functions trong Docker
supabase db reset     # chạy 14 migration trong supabase/migrations và nạp supabase/seed.sql
supabase status       # lấy API URL và publishable key
```

Tạo `.env.local` (đã bị `.gitignore` bỏ qua) với giá trị từ `supabase status`, theo mẫu [.env.example](.env.example):

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key local>
VITE_QR_PUBLIC_BASE_URL=http://localhost:5173
```

Rồi `npm run dev` và mở <http://localhost:5173> (du khách) hoặc <http://localhost:5173/admin/login> (quản trị). Seed local tạo cùng ba tài khoản ở bảng trên; tuyến và điểm dừng tạo qua giao diện quản trị.

**Không** trỏ app local tới Supabase Cloud. `supabase link` và `db push` chỉ do người vận hành cloud chạy, theo change brief triển khai; không seed và không reset trên cloud.

### 2.3 Lệnh kiểm tra

| Lệnh | Việc |
|---|---|
| `npm run ci` | Typecheck, lint token (không màu/px viết tay ngoài `tokens.css`), unit test (Vitest), build |
| `npm run e2e` | E2E Playwright trên dữ liệu giả (project `m03`, `m01`, `m02`, `m02-cam-evil`); máy bị quá tải thì thêm `-- --workers=4` |
| `PW_LOCAL_STACK=1 npx playwright test --project=m03-local-stack --workers=1` | E2E M03 trên stack local |
| `supabase test db` | pgTAP trong `supabase/tests` trên stack local |

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) chạy `verify` (`npm run ci`) và `e2e` cho mọi push và pull request; job `local-stack` (Supabase trong runner, pgTAP, contract và E2E local) chỉ chạy khi push vào `main` hoặc chạy tay.

---

## 3. Công nghệ

React + TypeScript + Vite (PWA, React Router data mode, CSS Modules với design token), Dexie/IndexedDB cho dữ liệu offline của du khách, Supabase (Postgres với RPC và RLS, Auth, Storage, Edge Functions chạy Deno), Zod, Vitest + Testing Library, Playwright, pgTAP. Chi tiết và lý do: [tech-stack.md](docs/architecture/tech-stack.md).

---

## 4. Cấu trúc repository

| Đường dẫn | Nội dung |
|---|---|
| `docs/spec/` | **Đặc tả nghiệp vụ** — nguồn sự thật về hành vi và contract |
| `docs/function list/`, `docs/architecture/`, `docs/design/` | Function list, kiến trúc, design system (dẫn xuất từ spec) |
| `screens/` | Danh mục màn hình, đặc tả từng màn, mockup HTML tĩnh và demo tương tác M03 |
| `data/` | Mô hình dữ liệu S1 → S4, tiêu chí chấp nhận dữ liệu (DAC), review gate, Physical Schema |
| `specs/` | Gói triển khai Spec-Kit theo module: spec, plan, research, contracts, tasks, validation report |
| `src/app/` | Khung ứng dụng: router, PWA, cập nhật service worker |
| `src/modules/m01/`, `src/modules/m02/`, `src/modules/m03/` | Code của từng module |
| `src/shared/` | UI dùng chung, design token, cấu hình, Supabase client, contract dùng chung, IndexedDB |
| `supabase/` | Migration, seed local, Edge Functions (`admin-accounts`, `session-intake`, `translate`), pgTAP, script cấp Quản lý đầu tiên |
| `e2e/` | Test Playwright của M01, M02 và M03 |
| `.specify/`, `.claude/skills/` | Constitution và skill Spec-Kit |

---

## 5. Bản đồ tài liệu

### A. Đặc tả (nguồn sự thật)
- [Spec M01 — Route Planning & Preparation](docs/spec/spec-M01.md)
- [Spec M02 — Field Quest Experience](docs/spec/spec-M02.md)
- [Spec M03 — Operations & Content Administration](docs/spec/spec-M03.md)
- [Spec AI Integration — dịch theo yêu cầu cho M03](docs/spec/spec-AI_integration.md)
- [MVP Scope](MVP-Scope.md)

### B. Function list
- [M01](docs/function%20list/function-list-M01.md) · [M02](docs/function%20list/function-list-M02.md) · [M03](docs/function%20list/function-list-M03.md) · [AI](docs/function%20list/function-list-AI.md)

### C. Kiến trúc
- [Tổng quan kiến trúc](docs/architecture/README.md)
- [Context diagram](docs/architecture/context-diagram.md) · [Usage flow](docs/architecture/usage-flow.md) · [Sequence diagrams](docs/architecture/sequence-diagrams.md)
- [System configuration](docs/architecture/system-configuration.md) · [Tech stack](docs/architecture/tech-stack.md) · [Environment](docs/architecture/environment.md)

### D. Màn hình và giao diện
- [Danh mục màn hình và quy ước](screens/screen%20list/README.md)
- Screen list: [M01](screens/screen%20list/screen-list-M01.md) · [M02](screens/screen%20list/screen-list-M02.md) · [M03](screens/screen%20list/screen-list-M03.md)
- Screen spec: [M01](screens/screen-spec/M01/) · [M02](screens/screen-spec/M02/) · [M03](screens/screen-spec/M03/)
- [Mockup HTML](screens/html/) · [Demo tương tác M03](screens/html/interactive/README.md)
- [Design system](docs/design/design-system.md)

### E. Dữ liệu
- [S1 — Entity Dictionary](data/01-entity-dictionary.md) (16 entity) · [S2 — CRUD Matrix](data/02-crud-matrix.md)
- [S3 — ERD](data/03-erd.mmd) · [ERD preview](data/03-erd-preview.md) · [ERD review](data/03-erd-review.md)
- [S4 — Logical Data Model](data/04-data-model.md) · [DBML](data/04-data-model.dbml)
- [Data Acceptance Criteria](data/08-data-acceptance-criteria.md) (118 tiêu chí) · [Review gate](data/05-review.md) (PASS 2026-10-28)
- [Physical Schema](data/06-physical-schema.md) — thiết kế; đã hiện thực bằng migration trên stack local, chưa áp lên cloud

### F. Gói triển khai (Spec-Kit)
- [001 — M01](specs/001-m01-route-planning-preparation/) · [002 — M02](specs/002-m02-field-quest-experience/) · [003 — M03](specs/003-m03-operations-content-administration/) · [004 — AI Integration](specs/004-ai-translation/)
- Mỗi gói có `validation-report.md` ghi lệnh đã chạy thật và phần `NOT RUN`.

---

## 6. Quy tắc làm việc

1. **Spec trước.** Thay đổi hành vi hay contract thì sửa spec trước, rồi mới đồng bộ tài liệu dẫn xuất và code. Không tự thêm requirement.
2. **Quy tắc repo:** [AGENTS.md](AGENTS.md) (chính), [CLAUDE.md](CLAUDE.md) (frontend: token, icon từ `assets/icons/`), [constitution](.specify/memory/constitution.md) 2.1.0.
3. **Code** chỉ trong phạm vi change brief và plan đã duyệt. Thao tác trên cloud chỉ do người vận hành cloud chạy, theo change brief triển khai.
4. **Git:** mỗi phase hoặc user story một branch, pull request vào `main`.
5. **Không** commit secret, `.env.local`, dữ liệu thật hay định danh production.

Lịch sử rebaseline tài liệu V2 (P0–P11): [M03 Documentation Refactor Runbook v2](M03_Documentation_Refactor_Runbook_v2.md).
