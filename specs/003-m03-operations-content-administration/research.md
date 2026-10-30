# Research — M03 Operations & Content Administration

**Package**: `specs/003-m03-operations-content-administration` | **Date**: 2026-10-29 | **Plan**: [plan.md](plan.md)

Tài liệu Phase 0 của `/speckit-plan`. Mỗi mục ghi **Decision / Rationale / Alternatives considered**. Đây là quyết định kỹ thuật (Layer 3), không phải requirement: hành vi lấy từ [spec-M03 v3.7](../../docs/spec/spec-M03.md); lựa chọn công nghệ lấy từ [tech-stack.md](../../docs/architecture/tech-stack.md), cấu hình từ [environment.md](../../docs/architecture/environment.md), runtime placement từ [system-configuration.md](../../docs/architecture/system-configuration.md); tên vật lý từ [Physical Schema](../../data/06-physical-schema.md). Nếu một mục dưới đây mâu thuẫn với các nguồn đó, nguồn thắng.

Phân loại trạng thái dùng trong file này:

- **Approved upstream** — đã chốt trong architecture/Physical Schema; ở đây chỉ trích lại.
- **Plan decision** — quyết định kỹ thuật của plan này cho chỗ nguồn để trống; có thể đổi mà không đổi behavior.
- **Provisional** — giá trị của spec-M03 §5.3; giữ nguyên nhãn, chưa xác nhận trên thiết bị thật.

## 1. Technical Context — các mục cần làm rõ và cách giải quyết

| # | Mục ban đầu là NEEDS CLARIFICATION | Giải quyết tại |
|---|---|---|
| 1 | Phạm vi code: backend (migration, RPC, Edge Function) có được làm trong package này không | R-01 |
| 2 | Phiên bản dependency chính xác (không có `package.json`/lockfile) | R-02 |
| 3 | Cách UI gọi command quản trị và hình dạng kết quả | R-05, R-06 |
| 4 | Ghi audit cho thao tác thất bại khi transaction bị rollback | R-07 |
| 5 | "Tập kết nối" của BR-M03-F05 gồm những id nào (checklist CHK007) | R-08 |
| 6 | `{Tên người}` trong MSG-STALE khi `AdminAccount` không có trường tên | R-09 |
| 7 | Upload media: đường dẫn object, xác minh, file mồ côi (checklist CHK022) | R-11 |
| 8 | Admin xem media nháp (BR-M03-F12) khi bucket private | R-12 |
| 9 | Nhãn "BẢN THỬ" ngoài Production và tên biến `QR_PUBLIC_BASE_URL` trong build | R-13, R-14 |
| 10 | Nối danh tính khi nhận lời mời; đăng xuất chặn request đang bay (checklist CHK004, CHK005) | R-15 |
| 11 | Thủ tục cấp Reviewer đầu tiên chạy ở đâu | R-16 |
| 12 | Chống lạm dụng lookup/intake công khai (spec-M03 §9 giao cho architecture, architecture chưa chốt) | R-25 |
| 13 | Mục tiêu hiệu năng dựng snapshot (BR-M03-G07: "performance target for later technical design") | R-24 |
| 14 | Thư viện kéo-thả sắp xếp điểm dừng (BR-M03-T02) không có trong tech-stack | R-21 |
| 15 | Vị trí test và file tooling gốc (`package.json`, config) khi AGENTS.md §2 chỉ nêu `src/`, `specs/`, Vite, Supabase local | R-23 |

Sau Phase 0 không còn mục `NEEDS CLARIFICATION` mở trong plan. Các điểm mà nguồn upstream có thể cần cập nhật được liệt kê ở §4.

## 2. Quyết định

### R-01 — Chia giai đoạn theo phạm vi code của AGENTS.md §2

- **Decision (Plan decision):** Chia việc thành hai giai đoạn.
  - **Giai đoạn A — trong phạm vi hiện tại:** frontend M03 trong `src/` (màn hình SCR-M03-000…009, adapter có kiểu, Zod schema của contract, danh mục thông báo, kiểm tra lúc lưu phía client), cấu hình Vite và `supabase/config.toml` + `supabase/seed.sql` (chỉ local, dữ liệu synthetic).
  - **Giai đoạn B — mở chỉ trên stack local theo change brief CHG-M03-2026-10-30-01 (duyệt 2026-10-30; trước đó bị chặn cho tới khi có change brief này):** SQL migration theo thứ tự 1–5 của Physical Schema §13, các command function, view `api.*`, RLS, policy Storage, Edge Function `session-intake` và `admin-accounts`, script cấp Reviewer đầu tiên, test pgTAP.
  - Trong giai đoạn A, adapter gọi đúng tên `api.*` đã thiết kế. Unit và component test dùng adapter giả (in-memory, synthetic) cài cùng interface.
- **Rationale:** AGENTS.md §2 nói rõ: "Vẫn chưa thuộc phạm vi nếu chưa có change brief riêng: SQL migrations, Edge Functions/RPC…". Hầu hết FR của M03 cần các phần đó (FR-M03-008/009/011/012/014 là giao dịch phía server). Plan vẫn thiết kế đủ để giai đoạn B có thể bắt đầu ngay khi được duyệt, mà không âm thầm mở rộng phạm vi.
- **Alternatives considered:** (a) Đưa backend vào ngay — vi phạm AGENTS.md §2. (b) Chỉ làm frontend, dùng adapter giả mãi mãi — không đáp ứng FR, và vi phạm constitution V (phân quyền phía server). (c) Tách thành hai package `specs/` — người dùng đã quyết giữ M03 là một package (spec.md, User Scenarios).

### R-02 — Toolchain và phiên bản

- **Decision (Approved upstream + Plan decision):** Node.js 24 LTS + npm (tech-stack §8). Runtime dependency: `react`, `react-dom`, `react-router` (declarative mode), `@supabase/supabase-js`, `zod`, `qrcode` 1.5.x + `@types/qrcode` (đã kiểm tra 1.5.4 ngày 2026-10-28, tech-stack §3). Dev dependency: `typescript`, `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa` (shell dùng chung), `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test`. Supabase CLI cho stack local. M03 không dùng `dexie`, `@zxing/*` (đó là của M01/M02). Phiên bản chính xác được **pin khi task setup chạy cài đặt thật**; lockfile được commit; plan không ghi số phiên bản chưa được cài (tech-stack §13).
- **Rationale:** tech-stack.md yêu cầu "pin exact dependency/CLI versions, commit lockfile và chỉ ghi version là verified sau khi cài/chạy thực tế". Lúc plan, không có cài đặt nào (người dùng cấm cài dependency).
- **Alternatives considered:** Ghi trước một bộ phiên bản — sẽ là phiên bản chưa được kiểm chứng. Thêm React Query/Zustand — bị loại theo tech-stack §3 ("không thêm Redux/Zustand hoặc cache server thứ hai").

### R-03 — Kiến trúc frontend của M03

- **Decision (Approved upstream):** SPA React + TypeScript build bằng Vite; React Router declarative mode với cây route `/admin/*` được bảo vệ và lazy-load (tech-stack §2–3, system-configuration "Route exposure"). Style dùng CSS Modules + CSS custom properties lấy từ token của [design-system.md](../../docs/design/design-system.md); không hard-code màu hay khoảng cách (CLAUDE.md). Icon chỉ lấy từ `assets/icons/`. UI state tạm dùng React state/context; M03 không có store offline.
- **Plan decision:** M03 là một module trong `src/modules/m03/`. Mỗi màn hình nằm trong thư mục tính năng tương ứng (bảng ở plan.md). App shell dùng chung (`src/app/`) do package nào code trước tạo ra; M03 chỉ đăng ký cây route của nó và một "unsaved-changes registry" để shell hoãn cập nhật service worker (R-22).
- **Rationale:** Đây là các quyết định đã chốt; M03 là route online-only, được bảo vệ (MVP-Scope §5).
- **Alternatives considered:** UI framework (MUI…) — tech-stack chọn CSS Modules "trước khi có screen designs"; design system đã có token riêng.

### R-04 — Module contract dùng chung

- **Decision (Approved upstream: tech-stack §6 "Shared schema package/module"; Plan decision về vị trí):** `src/shared/contracts/` giữ Zod schema và kiểu TypeScript suy ra cho đúng các contract cross-module, với tên giữ nguyên: `PublishedRoute` (Published Route projection), `JourneySnapshot`, `LiveQrLookupResult` + `LiveStationContent`, `SessionSyncRecord`. Phía M03 còn có `ValidationIssue` và `PublicationReview` (contract quản trị logic, spec-M03 §5.1) trong `src/modules/m03/contracts/`. Producer (M03 adapter, Edge intake) và consumer (M01/M02) import cùng một schema. JSON key giữ camelCase; ánh xạ snake_case ↔ camelCase chỉ xảy ra trong adapter (Physical Schema §3).
- **Rationale:** Constitution "Contract & Traceability": consumer phải đọc đúng hình dạng và không được mở rộng hay định nghĩa lại cục bộ. Một schema dùng chung loại bỏ việc định nghĩa trùng.
- **Alternatives considered:** Mỗi module tự khai báo kiểu — dễ lệch, vi phạm constitution II.

### R-05 — Bề mặt gọi backend

- **Decision (Approved upstream: tech-stack §5, Physical Schema §7, §9):**
  - Đọc công khai: Data API trên view `api.published_routes`, `api.active_journey_snapshots`; function `api.lookup_qr(p_qr_identifier, p_route_id)`. Chỉ schema `api` được mở cho Data API.
  - Command quản trị: `supabase.rpc('<command>')` tới các function `SECURITY DEFINER` trong schema `api`, với `search_path = ''` cố định, `EXECUTE` cấp rõ cho `authenticated`, và kiểm tra role trong function qua `app.current_admin()` (PT-07). Không client nào có DML trực tiếp trên bảng.
  - Edge Function: `session-intake` (validate Zod rồi gọi `api.ingest_session`, function chỉ `service_role` được chạy) và `admin-accounts` (gọi Auth Admin sau khi xác thực người gọi là Reviewer).
- **Plan decision:** Tên vật lý đề xuất cho các command nằm trong [contracts/admin-command-contract.md](contracts/admin-command-contract.md). Physical Schema §7.3 ghi "Names are proposals", nên migration bước 3 sẽ chốt tên; frontend chỉ thấy tên qua một bảng ánh xạ trong adapter.
- **Rationale:** RLS cộng command phía server là biên phân quyền (constitution V). Đọc công khai không cần đi qua Edge (system-configuration).
- **Alternatives considered:** Mọi thứ đi qua Edge Function — không cần thiết, và tạo thêm một proxy mà architecture đã loại bỏ. Dùng security-invoker có DML cho `authenticated` — mất khả năng kiểm soát invariant giữa nhiều bảng.

### R-06 — Hình dạng kết quả của command và ánh xạ lỗi

- **Decision (Plan decision):** Mọi command quản trị trả về một `CommandResult` ([admin-command-contract.md](contracts/admin-command-contract.md) §2): hoặc thành công kèm `messageKey` (ví dụ `MSG-SAVED`, `MSG-PUBLISHED`), hoặc bị từ chối với `reason` thuộc `VALIDATION | STALE | BUSY | FORBIDDEN | BLOCKED | FAILED`, một `messageKey` của §5.6, giá trị placeholder dạng thường, và `issues: ValidationIssue[]` khi `reason = VALIDATION`. Adapter ánh xạ lỗi transport: mất mạng hoặc timeout → `MSG-NETWORK-FAILED`; JWT hết hạn hoặc phiên đã bị thu hồi → `MSG-SESSION-EXPIRED`; không có quyền → `MSG-NO-PERMISSION`; mọi lỗi khác → `MSG-GENERIC`. Chi tiết kỹ thuật chỉ ghi vào log, không bao giờ hiện trên màn hình (BR-M03-L10).
- **Diễn giải BR-M03-L08:** `ValidationIssue` là hình dạng duy nhất cho **vấn đề cấp trường**. Kết quả cấp thao tác (stale, bận, không quyền, thất bại) là thông báo của danh mục (BR-M03-L13), không gắn trường. Cách đọc này không thêm behavior.
- **Rationale:** BR-M03-L10, L13: UI chọn thông báo theo `messageKey` và không bao giờ hiện dữ liệu thô.
- **Alternatives considered:** Ném exception PostgREST lên UI — sẽ lộ mã lỗi hoặc HTTP status.

### R-07 — Audit cho thao tác thất bại

- **Decision (Plan decision, hiện thực Physical Schema §7.3 "also on failure, written by the caller handler outside the rolled-back transaction"):** Mỗi command function có một khối ngoài và một khối nghiệp vụ bên trong (PL/pgSQL `BEGIN … EXCEPTION … END`, tức một savepoint). Khi khối trong lỗi, mọi thay đổi nghiệp vụ được rollback về savepoint; khối ngoài ghi đúng một dòng `audit_records` với `outcome = FAILURE` rồi trả `CommandResult` bị từ chối (không raise). Khi thành công, khối trong ghi dòng `SUCCESS`. Lỗi không lường trước ở khối ngoài thì raise, và client hiện `MSG-GENERIC`.
- **Rationale:** BR-M03-F08 (mỗi thao tác đúng một dòng audit, kể cả thất bại), BR-M03-G07 (lỗi dựng snapshot được audit). Không cần lệnh gọi thứ hai từ trình duyệt; client không đáng tin để tự ghi audit.
- **Alternatives considered:** Client gọi `record_failure` sau khi lỗi — giả mạo được và mất dòng khi rớt mạng. Edge Function bọc mọi command — thêm một tầng mà architecture không chọn.

### R-08 — Tuần tự hóa trên tập kết nối (BR-M03-F05, PT-06)

- **Decision (Approved upstream PT-06 + Plan decision về thành phần tập):** Command `publish`, `close`, `reopen` (và `archive`, `revoke` vì cũng đổi hành trình hoặc trạng thái) lấy `pg_try_advisory_xact_lock` trên khóa băm của từng id trong tập, theo thứ tự id đã sắp xếp. Chỉ cần một khóa không lấy được ngay là trả `BUSY` + `MSG-ROUTE-BUSY` với `{tên tuyến hoặc điểm dừng}` của id đó. Không xếp hàng.
  - Thao tác trên **điểm dừng** C: {C} ∪ mọi tuyến chưa lưu trữ liệt kê C trong danh sách đã xuất bản hoặc bản nháp chờ.
  - Thao tác trên **điểm tham quan** của C: giống thao tác trên C.
  - Thao tác trên **tuyến** R: {R} ∪ mọi điểm dừng trong danh sách đã xuất bản của R ∪ mọi điểm dừng trong bản nháp đang được xuất bản.
  - Tập **không bắc cầu** (tuyến → điểm dừng → tuyến khác). Hai thao tác xung đột khi và chỉ khi hai tập giao nhau, đúng như câu chữ của BR-M03-F05. Thứ tự id cố định ngăn deadlock.
  - Thao tác lưu nháp không lấy khóa tập; nó dựa vào `concurrencyRevision` (BR-M03-F06). Riêng kiểm tra tên điểm dừng trùng (BR-M03-D03, Physical §14 O-1) lấy khóa trên tên đã chuẩn hóa.
- **Rationale:** BR-M03-F05 định nghĩa tập theo hàng xóm trực tiếp. Bao gồm cả danh sách nháp là vì thao tác lưu trữ điểm dừng (BR-M03-D10) và xuất bản danh sách nháp đều đọc chúng.
- **Alternatives considered:** Khóa toàn bảng — làm tuần tự cả những thao tác độc lập. Khóa bắc cầu — rộng hơn spec. `SELECT … FOR UPDATE NOWAIT` trên từng dòng — được, nhưng advisory lock đã được chọn ở PT-06.

### R-09 — Ghi đè dữ liệu cũ (stale) và người sửa hiển thị

- **Decision (Plan decision):** Mọi command ghi nhận `expectedConcurrencyRevision`. Nếu giá trị khác với giá trị đang lưu, command trả `STALE` kèm `lastEditedAt` và **email đã chuẩn hóa** của người sửa sau cùng (tra `admin_accounts.user_id`). UI điền `{Tên người}` của MSG-STALE bằng email này và `{giờ}` bằng hh:mm theo `Asia/Ho_Chi_Minh`. Form giữ nguyên chữ người dùng đang gõ và có nút "Tải lại" (BR-M03-F06, L05, L06).
- **Rationale:** S4 `AdminAccount` chỉ có `userId`, `email`, `role`, `status` (data/04 §4). Thêm trường tên là thêm attribute khi chưa có nguồn (AGENTS.md §5). Email là thuộc tính hiển thị của tài khoản (SCR-M03-006 hiện email), không phải "internal identifier" theo BR-M03-L10; `userId` thì không bao giờ được hiện.
- **Alternatives considered:** Hiện `userId` — vi phạm L10. Thêm `displayName` — cần sửa spec-M03 §6.4 trước (ghi ở §4 như một đề xuất có thể làm sau, không chặn).

### R-10 — Dựng snapshot, so sánh và ước tính dung lượng

- **Decision (Approved upstream: Physical §5.6, §8; Plan decision về cách so sánh):** Trong cùng transaction của `publish` / `close checkpoint` / `reopen` / `revoke`: với mỗi tuyến bị ảnh hưởng (`HOAT_DONG` hoặc `TAM_DONG` có danh sách đã xuất bản chứa điểm dừng đó, BR-M03-X02), dựng snapshot ứng viên từ nguồn live (BR-M03-X01, G02). Snapshot được chuẩn hóa thành `jsonb` (bỏ `publishedAt`, `contentVersion`, `previousContentVersion`), rồi so sánh với snapshot đang active bằng phép bằng nhau của `jsonb`. Chỉ khi khác nhau mới chèn version `n+1` và chuyển `active_content_version` (BR-M03-G03, G04, G05). Ước tính dung lượng = tổng `file_size_bytes` của các ảnh *phân biệt* trong `offlineResources[].staticImages` + ảnh sơ đồ offline nếu có + `octet_length` UTF-8 của `objectName` và `introductionText` offline (BR-M03-G10). Dung lượng này so với `app.limit('OFFLINE_PACKAGE_MAX_MB') * 1048576` cho publish và reopen; close và revoke được miễn. Một tuyến dựng lỗi thì toàn bộ rollback, trả `FAILED` + `MSG-PUBLISH-FAILED` / `MSG-CLOSE-FAILED`, có audit (R-07), không tự thử lại.
- **Rationale:** Snapshot không đổi thì không có version mới (G04 "only when the resulting snapshot differs"). Phép bằng nhau của `jsonb` là tất định và đơn giản.
- **Alternatives considered:** Tính hash nội dung và lưu cột hash — thêm cột mà Physical Schema không có. So sánh theo từng trường — dễ sót trường.

### R-11 — Upload media, xác minh và file mồ côi

- **Decision (Approved upstream: tech-stack §5, Physical §5.5, §9; Plan decision về đường dẫn):** Bucket private `quest-media`. Mỗi tệp được tải riêng (BR-M03-E14) lên đường dẫn `uploads/{ownerType}/{ownerId}/{uploadKey}`, trong đó `uploadKey` là UUID ngẫu nhiên do client sinh, chỉ làm tên object, với `upsert: false` để không ghi đè. Sau đó gọi command `register_media`: server kiểm tra object có tồn tại, `metadata.size` và `mimetype` khớp giới hạn theo loại (DAC-M03-056–058), owner hợp lệ, usage/type hợp lệ; rồi chèn `app.media` với `media_id` do server sinh (`gen_random_uuid()`, BR-M03-B01), `source_ref` = đường dẫn object. Tệp chỉ thuộc bản nháp khi "Lưu bản nháp" thành công (BR-M03-F11). Lúc publish, ảnh của điểm dừng `OFFLINE_REQUIRED` được kiểm tra còn đọc được (BR-M03-D04 điều 4, H06). File đã đăng ký nhưng chưa bao giờ được tham chiếu, hoặc object chưa đăng ký, được để nguyên; dọn dẹp là thao tác vận hành theo yêu cầu, không có scheduler (tech-stack §5, constitution VII). Checklist CHK022 được xử lý như một rủi ro đã chấp nhận, không thêm behavior.
- **Rationale:** `mediaId` không bao giờ là input (BR-M03-B01), nên client chỉ đặt tên object. Storage và Postgres không chung transaction, nên phải xác minh trước, tham chiếu sau (constitution V).
- **Alternatives considered:** Signed upload URL do server cấp — thêm một vòng gọi mà policy insert của admin đã đủ. Dùng `mediaId` làm tên object — client sẽ phải sinh `mediaId`.

### R-12 — Đọc media: công khai và xem trước của admin

- **Decision:** (Approved upstream) Consumer đọc object được tham chiếu bởi một revision `PHAT_HANH` hoặc nằm trong một snapshot còn giữ, qua signed URL (Physical §9). (Plan decision) Thêm một policy `SELECT` trên `storage.objects` của `quest-media` cho người có `app.current_admin()` đang hoạt động, để editor hiện thumbnail của tệp vừa tải và để "Xem trước như du khách" (BR-M03-F12) hiện media nháp. Workbox không cache response media đã ký.
- **Rationale:** Physical §9 chỉ nêu quyền đọc media đã công khai. Nếu không có policy này, F12 và việc xem lại tệp vừa tải là không làm được. Quyền đọc này không mở gì cho du khách.
- **Alternatives considered:** Edge Function proxy media nháp — thêm một runtime path. Cho bucket là public — lộ media nháp, trái BR-M03-I04.
- **Upstream impact:** Physical Schema §9 cần thêm một dòng cho policy này (xem §4).

### R-13 — Ảnh mã QR để in

- **Decision (Approved upstream: tech-stack §3; Plan decision về việc phát hiện môi trường):** Thư viện `qrcode` chỉ được lazy-load trong SCR-M03-003. Nội dung mã là đúng chuỗi `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`, không có tham số nào khác (BR-M03-B04). SVG dùng `toString({ type: 'svg', errorCorrectionLevel: 'Q', margin: 4 })`; PNG vẽ trên canvas với độ rộng ≥ `QR_PRINT_PNG_MIN_PX` (1024, provisional). M03 tự vẽ quanh mã: dòng "Mã …{6 ký tự}", dòng cảnh báo song ngữ cho `OFFLINE_REQUIRED`, và dấu "BẢN THỬ — KHÔNG DÁN RA THỰC ĐỊA" (BR-M03-B05). Màn tải xuống ghi rõ độ rộng in tối thiểu `QR_PRINT_MIN_SIZE_CM` (3 cm, provisional).
  - **Nhận diện Production:** Một hằng build-time `IS_PRODUCTION_BUILD`, được Vite `define` thành `true` **chỉ khi** biến nền tảng `VERCEL_ENV === 'production'` lúc build. Mọi build khác (dev local, build tối ưu local, preview deployment) luôn có dấu bản thử (fail-safe).
- **Rationale:** environment.md §4 ánh xạ "Production" = Single Cloud Application Environment và "non-Production" = Local Development Workstation. Mặc định có dấu khi không chắc chắn chỉ tốn một nhãn thừa; ngược lại thì có nguy cơ dán mã thử ra thực địa.
- **Alternatives considered:** Suy ra từ `import.meta.env.PROD` — build tối ưu local cũng là PROD. Thêm biến `VITE_APP_ENVIRONMENT` — tạo biến cấu hình mới mà environment.md chưa có.

### R-14 — Biến cấu hình công khai của M03

- **Decision (environment.md §4 giao tên biến cho implementation):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_APP_VERSION` (như environment.md) và `VITE_QR_PUBLIC_BASE_URL` cho `QR_PUBLIC_BASE_URL`. `src/shared/config/` đọc và validate các biến này bằng Zod lúc khởi động: base URL không có dấu `/` ở cuối, là HTTPS khi `IS_PRODUCTION_BUILD`; `http://localhost…` chỉ được nhận ở build không phải Production. Không có secret nào mang tiền tố `VITE_`.
- **Rationale:** environment.md §4, §7; constitution V.
- **Alternatives considered:** Đọc base URL từ `window.location.origin` — một preview deployment sẽ in ra link sai domain.

### R-15 — Xác thực, lời mời, khôi phục mật khẩu, đăng xuất

- **Decision (Approved upstream: tech-stack §5, Physical §8–9; Plan decision về luồng chi tiết):**
  - **Đăng nhập (SCR-M03-000):** `auth.signInWithPassword`. Sau đó gọi query `get_current_admin`, đọc tài khoản của chính mình qua RLS và `app.current_admin()`. Không có tài khoản `ACTIVE` với role cố định → `auth.signOut` + MSG-LOGIN-DENIED (BR-M03-A04, K05). Role và status không bao giờ đọc từ JWT metadata (Physical §9).
  - **`app.current_admin()`** tìm tài khoản theo `auth.uid()::text = user_id` và `status = 'ACTIVE'`, **và** kiểm tra `auth.jwt()->>'session_id'` còn tồn tại trong `auth.sessions`. Nhờ đó access token của một phiên đã đăng xuất không còn qua được command nào, kể cả trước khi token hết hạn (BR-M03-K06, SC-M03-040).
  - **Mời (SCR-M03-006 → Edge `admin-accounts`, `action = invite`):** Edge xác minh JWT và người gọi là Reviewer đang hoạt động; chuẩn hóa email (trim + lowercase, ≤ `EMAIL_MAX_CHARS`). Edge gọi `auth.admin.inviteUserByEmail(email, { redirectTo: <origin>/admin/invitation })`, rồi gọi command server-side tạo hoặc giữ `AdminAccount` `INVITATION_PENDING` với role đã chọn. Gửi lại (`action = resend`) cho cùng tài khoản đang chờ là idempotent, không tạo bản sao (BR-M03-K01). Lời mời đã hết hạn để lại tài khoản ở `INVITATION_PENDING`; không xóa vật lý (BR-M03-D12, DEC-S6-002), nên checklist CHK004 không cần quy tắc mới.
  - **Nhận lời mời (SCR-M03-007):** Link mời mở phiên provider; người nhận đặt mật khẩu (`auth.updateUser({ password })`), rồi trang gọi Edge `admin-accounts` với `action = link`. Edge xác minh JWT, email của provider user trùng với email của một tài khoản `INVITATION_PENDING`, rồi đặt `user_id` và chuyển sang `ACTIVE`. Người nhận không chọn được role. Link hết hạn hoặc sai → MSG-LINK-INVALID.
  - **Khôi phục mật khẩu:** `auth.resetPasswordForEmail` luôn trả MSG-RECOVERY-SENT, bất kể email có tồn tại hay không; hoàn tất bằng `auth.updateUser({ password })`. Không có lệnh gọi nào chạm tới `AdminAccount` (BR-M03-K02). Tài khoản bị khóa vẫn bị từ chối ở bước kiểm tra sau đăng nhập.
  - **Đăng xuất:** Nếu form đang có thay đổi chưa lưu, hiện MSG-UNSAVED-CHANGES trước. Sau đó hủy (`AbortController`) mọi request quản trị đang bay ở client, rồi `auth.signOut({ scope: 'local' })` để kết thúc phiên hiện tại và quay về màn đăng nhập. Không ghi audit (BR-M03-K06). Command phía server là atomic: một request đã tới DB hoặc hoàn tất trọn vẹn, hoặc rollback; UI không hiện kết quả của nó (checklist CHK005).
- **Rationale:** Tách danh tính provider và quyền ứng dụng (BR-M03-K05); Auth Admin chỉ chạy ở Edge (tech-stack §5).
- **Alternatives considered:** Trigger trên `auth.users` để nối danh tính — chạy ngoài luồng xác minh và khó test cô lập. `scope: 'global'` — đăng xuất mọi thiết bị của người dùng, rộng hơn "phiên hiện tại".

### R-16 — Cấp Reviewer đầu tiên

- **Decision (Plan decision, giai đoạn B):** Đây là một script cho operator, chạy từ máy của operator, không deploy và không có trong bundle. Script đọc `APP_BACKEND_SECRET_KEY` từ biến môi trường của shell, gọi Auth Admin `inviteUserByEmail`, rồi gọi function DB `app.provision_initial_reviewer(email)` (không có trong schema `api`; `EXECUTE` chỉ cấp cho role của operator/`service_role`). Function chỉ tạo một `REVIEWER` `INVITATION_PENDING` khi `app.admin_accounts` rỗng, idempotent với cùng email đã chuẩn hóa, và ghi audit với `actorUserId` để trống. Không có trang, route hay Edge endpoint nào cho thao tác này (BR-M03-K04, SC-M03-010).
- **Rationale:** "unavailable from the browser or public API". Edge Function là một endpoint HTTP công khai, nên không dùng.
- **Alternatives considered:** Edge Function bảo vệ bằng secret header — vẫn là API công khai. Chèn tay bằng SQL — không gửi được lời mời qua provider.

### R-17 — Báo cáo

- **Decision (Approved upstream: Physical §7.3, §14 O-2):** Hai query function `report_rpt01` / `report_rpt02` được tính theo yêu cầu (không pre-aggregate, không cron). Input: `routeId?`, `fromDate?`, `toDate?` dạng `YYYY-MM-DD`. Server áp: cả hai ngày cùng có hoặc cùng không (thiếu một → MSG-REPORT-DATES-INVALID), `fromDate ≤ toDate`, khoảng ≤ `REPORT_MAX_SPAN_DAYS` (366, provisional; vượt → MSG-REPORT-SPAN), mặc định 30 ngày lịch kết thúc hôm nay tại `Asia/Ho_Chi_Minh`. Filter theo `ended_at` như Physical §7.3. `routeName` đọc `name.vi` của revision `PHAT_HANH` lúc query. UI định dạng ngày dd/mm/yyyy và giờ hh:mm bằng `Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })`.
- **Alternatives considered:** Tính ngày trên client — lệch múi giờ của máy; có thể dùng thư viện ngày, nhưng `Intl` là đủ.

### R-18 — Danh mục thông báo, tên hiển thị, câu gợi ý

- **Decision (Plan decision):** `src/modules/m03/messages/` chứa ba module hằng có kiểu: `catalog.ts` (mọi khóa MSG-* của spec-M03 §5.6 với đúng câu chữ), `displayNames.ts` (§5.4), `hints.ts` (§5.5). `MessageKey` là union khép kín; khóa không có trong danh mục rơi về `MSG-GENERIC` (BR-M03-L13). Hàm `formatMessage(key, values)` điền placeholder bằng giá trị thường (tên như trên UI, số kèm đơn vị, hh:mm, dd/mm/yyyy). Một test so khớp danh sách khóa với spec, để danh mục không bị lệch.
- **Rationale:** BR-M03-L09–L13, FR-M03-019. M03 chỉ có tiếng Việt, nên không cần thư viện i18n.
- **Alternatives considered:** Gửi câu thông báo từ server — câu chữ sẽ bị trùng ở hai nơi.

### R-19 — Kiểm tra phía client, giới hạn provisional

- **Decision (Plan decision):** `src/modules/m03/config/limits.ts` là nơi duy nhất phía client giữ các hằng của spec-M03 §5.3. Mọi hằng đều có chú thích **provisional** và tham chiếu §5.3; giá trị khớp `app.limit()` phía server (PT-02). Các hàm thuần trong `src/modules/m03/validation/` kiểm tra lúc lưu (BR-M03-L01) và tính khoảng trống xuất bản cho panel "Còn thiếu để xuất bản" (BR-M03-L03), với kết quả có hình dạng `ValidationIssue`. Kiểm tra phía server vẫn là chuẩn: lúc lưu, đó là `app.revision_content_ok` và trigger; lúc xuất bản, đó là guard của command publish (Physical §5.4.1, §8). Một test so sánh giá trị hằng giữa client và fixture lấy từ §5.3.
- **Rationale:** BR-M03-L02 yêu cầu báo ngay dưới trường. Constitution §6 nói kiểm tra phía client không thay thế được kiểm tra của DB.
- **Alternatives considered:** Gọi server cho mỗi lần rời khỏi một trường — chậm, và không cần thiết vì đây đều là quy tắc về hình dạng.

### R-20 — Form, đơn vị lưu và thay đổi chưa lưu

- **Decision (Plan decision):** Mỗi editor (tuyến, điểm dừng, điểm tham quan) giữ một state form duy nhất, gồm cả hai ngôn ngữ, danh sách media có thứ tự kèm tick quyền và ngôn ngữ nói, và ghi chú nội bộ. "Lưu bản nháp" gửi toàn bộ state trong một command với một `expectedConcurrencyRevision` (BR-M03-F11). Không autosave. Khi lưu lỗi hoặc stale, state không bao giờ bị reset (BR-M03-L06). MSG-SAVED chỉ hiện sau khi command thành công. Chặn rời trang khi có thay đổi chưa lưu: hook `useBlocker` của React Router cho điều hướng trong app, và `beforeunload` cho việc đóng tab; cả hai hiện MSG-UNSAVED-CHANGES (dialog hai nút, BR-M03-L12).
- **Alternatives considered:** Thư viện form — không cần cho các form có kích thước như thế này; tech-stack không có thư viện nào như vậy.

### R-21 — Kéo-thả thứ tự điểm dừng

- **Decision (Plan decision):** Dùng HTML5 drag-and-drop gốc, kèm hai nút di chuyển lên/xuống dùng được bằng bàn phím trên mỗi dòng (WCAG 2.1 AA của design-system §6). Không thêm dependency.
- **Rationale:** BR-M03-T02 chỉ yêu cầu kéo-thả; tech-stack §12 yêu cầu dependency phải được khai báo có chủ đích. Cách này giữ bề mặt dependency nhỏ.
- **Alternatives considered:** `dnd-kit` — tốt, nhưng là dependency mới chưa có trong tech-stack.

### R-22 — Phối hợp với PWA và service worker

- **Decision (Approved upstream: tech-stack §4, constitution VI):** Cấu hình Workbox của shell không runtime-cache Supabase API, Auth, response quản trị hay media đã ký. M03 xuất `registerUnsavedForm(id)` / `unregisterUnsavedForm(id)` để update coordinator của shell không kích hoạt service worker mới khi còn form M03 chưa lưu (cập nhật kiểu prompt, không tự reload).
- **Alternatives considered:** Không có — đây là quy tắc đã chốt.

### R-23 — Chiến lược test và vị trí file

- **Decision (Approved upstream: tech-stack §8, §13; Plan decision về vị trí):**
  - Unit, contract và component test (Vitest + Testing Library, jsdom) đặt cạnh mã nguồn dưới dạng `*.test.ts(x)` trong `src/`.
  - Contract test: các fixture synthetic hợp lệ và không hợp lệ cho mỗi Zod schema của `src/shared/contracts/`, phủ quy tắc Required/Conditional/Optional của spec-M03 §5.1 (constitution "Testing & Validation").
  - E2E (Playwright) đặt ở `e2e/` gốc repo. Chạy trên stack Supabase local (giai đoạn B) hoặc trên adapter giả (giai đoạn A).
  - Test DB (pgTAP: CHECK, trigger, RLS, grant, rollback, khóa tập kết nối, Reviewer cuối) thuộc giai đoạn B, đặt ở `supabase/tests/`, chạy bằng `supabase test db` trên stack local. Phần nào không chạy được thì ghi `NOT RUN` (environment.md §11).
  - Không có test nào chạy trên Shared Backend; không dùng dữ liệu thật.
- **Rationale:** AGENTS.md §2 mở `src/`, cấu hình Vite và Supabase local. Đặt test trong `src/` không cần mở thêm thư mục. `e2e/` và các file tooling gốc (`package.json`, lockfile, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`) là hệ quả tất yếu của "cấu hình Vite" nhưng không được nêu đích danh, nên được ghi vào Complexity Tracking để người duyệt plan xác nhận.
- **Alternatives considered:** Thư mục `tests/` gốc — runbook §1.2 (dòng "Code & tests") liệt kê `tests/**` là chưa mở trong change set tài liệu.

### R-24 — Mục tiêu hiệu năng (kỹ thuật, không phải requirement)

- **Decision (Plan decision):** Mục tiêu kỹ thuật cho giai đoạn B, **không phải business rule** (BR-M03-G07 giao cho thiết kế kỹ thuật): command publish/close/reopen dựng snapshot cho các tuyến bị ảnh hưởng xong trong ≤ 5 s p95 trên stack local, với fixture ở giới hạn provisional (30 điểm dừng/tuyến, 20 QR/điểm dừng). Fixture có 10 tuyến cùng liệt kê một điểm dừng; con số 10 là lựa chọn của bộ test, nguồn không có giới hạn số tuyến. `api.lookup_qr` ≤ 300 ms p95 trên stack local. UI: lazy-load cây `/admin/*` và thư viện `qrcode` để không làm nặng phần dành cho du khách. Không đạt mục tiêu thì ghi nhận là rủi ro, không chặn release, cho tới khi có quyết định khác.
- **Alternatives considered:** Không đặt mục tiêu nào — checklist CHK008 cần một mục tiêu có ghi rõ là kỹ thuật.

### R-25 — Chống lạm dụng lookup và intake công khai

- **Decision (Plan decision, vì architecture chưa chốt):** MVP dựa vào giới hạn mặc định của nền tảng Supabase (Auth, Data API, Edge) và không thêm bộ đếm tần suất tự viết. Edge `session-intake` từ chối body vượt 64 KiB (một trần kỹ thuật, không phải business rule) và từ chối mọi khóa ngoài allowlist trước khi chạy Zod. `api.lookup_qr` chỉ đọc, `STABLE`, không ghi gì. Rủi ro đã chấp nhận ở spec-M03 §9 vẫn còn: một bản ghi giả nhưng đúng định dạng vẫn có thể vào báo cáo.
- **Rationale:** spec.md (Open clarifications) giao việc này cho architecture. Đây là phương án tối thiểu không thêm hạ tầng mới (tech-stack §12 cấm thêm service khi chưa có quyết định).
- **Upstream impact:** Nên ghi một dòng vào tech-stack.md §5 hoặc system-configuration.md (xem §4).

### R-26 — Panel "Còn thiếu để xuất bản", readiness và màn review

- **Decision (Plan decision):** Panel tính bằng hàm thuần phía client trên state form hiện tại, để phản hồi ngay (BR-M03-L03). Readiness của điểm tham quan và điểm dừng (BR-M03-E05, D04) do server trả về trong query editor và query danh sách, tính trên dữ liệu đã lưu (D04 "runs on stored data"). Query `open_publication_review` trả `PublicationReview` (spec-M03 §5.1) tính trên dữ liệu đã lưu, gồm `reviewedConcurrencyRevision`. Command publish chạy lại guard và so sánh revision; khác thì trả `STALE`, và UI mở lại review (BR-M03-F02).
- **Alternatives considered:** Chỉ tính panel ở server — panel sẽ không phản ánh thứ người dùng đang gõ.

### R-27 — Kiểm tra nội dung revision bằng trigger và khôi phục bị từ chối (CHK021)

- **Decision (Plan decision, theo spec-M03 BR-M03-F07 clarification 6 và Physical §5.4.1):** `app.revision_content_ok` được gọi bởi trigger `BEFORE INSERT OR UPDATE OF content`, không phải CHECK của bảng. Command `restore_revision` chèn bản sao trong savepoint; nếu trigger từ chối thì trả `BLOCKED` + `MSG-RESTORE-BLOCKED` kèm danh sách chỗ cần sửa và không tạo gì.
- **Rationale:** CHECK được kiểm lại mỗi lần UPDATE; đổi trạng thái revision cũ sang `LUU_TRU` khi xuất bản bản mới sẽ thất bại nếu giới hạn provisional bị siết sau đó. Trigger chỉ chạy khi chèn hoặc khi `content` đổi.
- **Alternatives considered:** Cho khôi phục rồi chặn lúc xuất bản (cần tách kiểm tra hình dạng và giới hạn, sửa Physical lớn hơn) — chủ dự án chọn hướng từ chối khôi phục.

## 3. Best practices áp dụng (tóm tắt)

| Công nghệ | Thực hành giữ trong plan | Nguồn |
|---|---|---|
| Supabase RLS + function | RLS bật trên mọi bảng `app`; `anon`/`authenticated` không có DML; `SECURITY DEFINER` + `search_path = ''` + `EXECUTE` cấp rõ + kiểm tra quyền trong function | Physical §9, PT-07; tech-stack §5 |
| Supabase Storage | Bucket private; không cho client ghi đè/xóa; xác minh rồi mới tham chiếu | Physical §9; constitution V |
| Supabase Auth | Role/status không đọc từ JWT metadata; Auth Admin chỉ ở Edge | Physical §9; tech-stack §5 |
| Edge Function (Deno) | Zod strict, allowlist key, gọi RPC transactional; secret chỉ ở server | tech-stack §5; constitution §Security |
| Vite | Chỉ `VITE_*` công khai; không secret trong bundle | environment.md §4, §7 |
| React Router | Lazy route cho `/admin/*`; chặn rời trang khi có thay đổi chưa lưu | tech-stack §3; BR-M03-F11 |
| Test | Rollback/ephemeral DB; synthetic fixture; `NOT RUN` khi không chạy được | environment.md §11; Physical §13 |

## 4. Điểm upstream đã đồng bộ (2026-10-29)

| Nguồn | Điểm | Trạng thái |
|---|---|---|
| [spec.md](spec.md) Key Entities | Revision thiếu trạng thái `LUU_TRU` | **Đã sửa**: thêm `LUU_TRU` (bản cũ), khớp spec-M03 §6.3 và S4 |
| [Physical Schema](../../data/06-physical-schema.md) §9 | Quyền đọc Storage của admin với media nháp (R-12) | **Đã sửa**: thêm câu về quyền đọc của admin đang hoạt động |
| Physical Schema §9 | `app.current_admin()` kiểm tra `session_id` (R-15) | **Đã sửa** |
| [tech-stack.md](../../docs/architecture/tech-stack.md) §5 | Chống lạm dụng (R-25) và script cấp Reviewer đầu tiên (R-16) | **Đã sửa**: thêm đoạn cuối §5 |
| [environment.md](../../docs/architecture/environment.md) §4 | Nhận diện Production khi build bằng `VERCEL_ENV` (R-13) | **Đã sửa** |
| spec-M03 §6.4 | `AdminAccount` không có tên hiển thị; MSG-STALE dùng `{Tên người}` (R-09) | **Không sửa**: plan dùng email; chỉ đổi nếu chủ sản phẩm muốn có tên người (sửa spec trước) |
