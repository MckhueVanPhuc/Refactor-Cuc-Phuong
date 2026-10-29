# Tech Stack — Cúc Phương Quest

## 1. Purpose

Tài liệu này là nguồn canonical cho các lựa chọn công nghệ của MVP Cúc Phương Quest. Runtime topology, component ownership và data flow nằm tại [System Configuration / Runtime Architecture](system-configuration.md); cấu hình theo từng environment nằm tại [Environment Configuration](environment.md).

Repository đã mở phạm vi code theo AGENTS.md §2, nhưng hiện chưa có application source, `package.json`, lockfile, SQL migration, Edge Function, test suite, Supabase/Vercel runtime configuration hoặc deployment evidence. Mọi lựa chọn trong tài liệu này là `Selected — not implemented` cho đến khi có artifact tương ứng. [Physical Schema](../../data/06-physical-schema.md) là documentation baseline, không phải implemented schema.

Status trong tài liệu này dùng nhất quán: **Selected — not implemented** cho technology/approach đã được chốt nhưng chưa có implementation artifact; **Present — documentation/tooling only** cho artifact quản trị thực sự có trong repository; **Not verified** cho trạng thái máy hoặc cloud cần evidence bên ngoài; **Excluded** cho lựa chọn ngoài MVP. Không suy ra hosted service đã tồn tại chỉ vì technology đã được chọn.

## 2. Architecture Profile

| Item | Decision | Status | Source |
|---|---|---|---|
| Application type | Browser-based Progressive Web App | Selected — not implemented | [System Configuration](system-configuration.md) |
| Architecture style | Modular Monolith | Selected — not implemented | Approved architecture decision; [System Configuration](system-configuration.md) |
| Frontend organization | Một shared frontend codebase và một website/PWA trong Single Vercel Project | Selected — not implemented | Approved architecture decision; [System Configuration](system-configuration.md) |
| Module boundary | M01, M02, M03 là logical modules, không phải ba service/deployment | Selected | [System Configuration](system-configuration.md), Module placement and ownership |
| Route exposure | M01/M02 dùng public routes; M03 dùng protected administration routes | Selected — not implemented | [System Configuration](system-configuration.md), Runtime components |
| Cloud environment | Single Cloud Application Environment | Selected — not implemented | [Environment Configuration](environment.md) §2 |
| Web hosting | Single Vercel Project | Selected — project/deployment state not verified | Approved architecture decision |
| Backend model | Single Supabase Cloud Project cung cấp PostgreSQL, Auth, RLS, Storage, Edge Functions, PostgreSQL RPC và Data API | Selected — not implemented | Approved architecture decision; [System Configuration](system-configuration.md) |
| Offline model | App shell/static resources trong Cache Storage; structured business data trong IndexedDB | Selected — not implemented | [System Configuration](system-configuration.md), Data placement and ownership |

## 3. Frontend Stack

| Technology | Responsibility | Used by | Why selected | Status |
|---|---|---|---|---|
| React | UI runtime và component model cho web client dùng chung | M01, M02, M03 | Frontend choice đã chốt | Selected — not implemented |
| TypeScript | Type safety cho UI, local data access và contract integration | M01, M02, M03 | Giữ typed boundaries giữa các logical modules | Selected — not implemented |
| Vite | Frontend development/build pipeline và public `VITE_*` configuration boundary | M01, M02, M03 | Build tool cho single frontend codebase | Selected — not implemented |

Các lựa chọn frontend bổ sung hiện hành (**Selected — not implemented**):

| Technology | Responsibility | Used by | Why selected | Status |
|---|---|---|---|---|
| React Router, declarative mode | Client-side routes và lazy route loading | M01–M03 | Phù hợp SPA; không cần framework server/SSR | Selected — not implemented |
| CSS Modules + CSS custom properties | Scoped styles và shared design tokens | M01–M03 | Tránh thêm UI framework trước khi có screen designs | Selected — not implemented |
| React state/hooks/context | UI state tạm thời, language/session view | M01–M03 | Dexie sở hữu persistent state theo target design; không thêm Redux/Zustand hoặc cache server thứ hai | Selected — not implemented |
| `@supabase/supabase-js` | Auth, Data API, Storage và function calls | M01–M03 | Một SDK cho platform đã chọn | Selected — not implemented |
| `@zxing/browser` + `@zxing/library` | Decode QR từ camera; lazy-load scanner | M02 | Không phụ thuộc duy nhất vào browser BarcodeDetector | Selected — not implemented |
| `qrcode` (node-qrcode) 1.5.x + `@types/qrcode` | Sinh ảnh mã QR để in chứa link `{QR_PUBLIC_BASE_URL}/q/{qrIdentifier}`: SVG qua `toString({ type: 'svg' })`, PNG qua `toDataURL`/canvas với `width` ≥ 1024, `errorCorrectionLevel: 'Q'`, `margin: 4`; dòng "Mã …{6 ký tự}", dòng cảnh báo offline và dấu bản thử do M03 vẽ thêm quanh mã | M03 | Spec M03 BR-M03-B04/B05; MIT, chạy trong trình duyệt (không cần server), có sẵn SVG và PNG với mức sửa lỗi và lề cấu hình được; chỉ lazy-load ở màn điểm tham quan của M03. Phiên bản kiểm tra trên npm registry ngày 2026-10-28: 1.5.4 | Selected — not implemented |

Dữ liệu domain bền vững nằm trong Dexie/Postgres; Context chỉ giữ UI state hoặc view của dữ liệu đó. Server calls dùng typed adapters với loading/error/retry rõ ràng.

## 4. PWA and Offline Stack

| Technology | Responsibility | Data/resources handled | Used by | Status |
|---|---|---|---|---|
| PWA | Cho phép web client tải app shell và tiếp tục các flow local đã hỗ trợ khi mất mạng | App shell, local application state | M01, M02 | Selected — not implemented |
| `vite-plugin-pwa` | Tích hợp PWA/service-worker generation vào Vite build | Build-time PWA configuration | Shared frontend | Selected — not implemented |
| Workbox | Precache app shell và resource i18n bằng revisioned assets | Static assets, app shell, i18n `vi/en` | M01/M02 visitor runtime | Selected — not implemented |
| Cache Storage | Browser storage cho app shell và static/i18n resources | App shell, bundled `vi/en` resources | M01/M02 visitor runtime | Selected browser API |
| IndexedDB | Structured local persistence cho application/offline data | Preference, handoff, package/staging, session, visits, pending sync | M01, M02 | Selected browser API |
| Dexie | Data-access wrapper và migration layer trên IndexedDB | M01 shared data và M02 local session data | M01, M02 | Selected — not implemented |

Cache Storage không lưu structured offline business data. IndexedDB không thay vai trò static asset cache. Offline package image phải được lưu dưới dạng local byte/blob; URL hoặc signed URL không được tính là resource đã tải.

### Offline implementation decisions

- `vite-plugin-pwa` dùng `generateSW`, update mode `prompt`; không tự reload hoặc force-activate service worker khi còn phiên M02, package operation hoặc form M03 chưa lưu. Apply update sau khi lưu local state và người dùng đồng ý; phối hợp các tab trước activation.
- Precache app shell, bundled i18n và các chunk cần cho M01/M02, gồm decoder QR. Lazy-loading scanner giảm startup cost nhưng chunk phải có local trước khi tuyên bố offline ready.
- Không runtime-cache Supabase API, Auth, admin responses hoặc signed media responses bằng Workbox. Package text/image bytes nằm trong IndexedDB; media online tải trực tiếp.
- Dexie dùng một database với các store theo ownership; transaction bảo vệ handoff, package active pointer và session replacement. Download/network work chạy ngoài IndexedDB transaction; final validation + pointer switch chạy trong transaction ngắn.
- Dexie schema version độc lập với app build version và `contentVersion`. Multi-tab writes phải giữ uniqueness/atomicity bằng database transaction; không dựa vào React state.
- Sync chỉ chạy khi ứng dụng mở/resume hoặc có cơ hội kết nối lại; không hứa retry khi browser đã đóng. Conflict dừng auto-retry; network failure giữ record local.
- UI vẫn có thể mất dữ liệu do eviction/browser clearing; có thể request persistent storage và kiểm tra quota nhưng không tuyên bố lưu trữ được bảo đảm.

## 5. Backend and Data Platform

| Technology / Service | Responsibility | Used by | Status |
|---|---|---|---|
| Supabase | Single Supabase Cloud Project — Shared Backend của MVP | M01, M02, M03 | Selected — not implemented |
| PostgreSQL | Source data, revisions/public state, immutable snapshots, persisted `SessionRecord` và report data | Primarily M03; M01/M02 through contracts | Selected — not implemented in this repository |
| Supabase Auth | Admin identity, invitation, credential và session lifecycle trong cùng backend project | M03 | Selected — runtime not verified |
| Row Level Security | Public-read và authenticated-write authorization boundary tại data layer | M01 public reads, M02 public reads/intake, M03 administration | Selected — policies/tests not present |
| Supabase Storage | Published image/audio/video object storage trong cùng backend project | M03 producer; M01/M02 consumers | Selected — bucket/policies/runtime not verified |
| Supabase Edge Functions (Deno runtime) | HTTP validation cho `SessionSyncRecord` intake và privileged Auth Admin operations | M02 sync, M03 account management | Selected — not implemented |
| PostgreSQL RPC/database functions | Atomic publication, concurrency, QR identity, close/reopen, roles, `SessionRecord` insert/compare và report query | M03; intake function calls RPC | Selected — not implemented |

Public reads đi qua Data API với RLS/safe projections; không bắt mọi read đi vòng qua Edge Function. Admin domain writes dùng authenticated RPC có role/status check. Edge terminal intake validate strict Zod schema rồi gọi một transactional RPC insert/compare immutable payload; không expose RPC ghi terminal cho anon trực tiếp. Auth Admin calls chỉ ở Edge sau khi xác thực Reviewer.

RPC mặc định security-invoker; chỉ dùng security-definer khi cần, với fixed search_path, explicit EXECUTE grants và permission checks. Elevated client bypass RLS nên phải kiểm tra quyền trước khi gọi. Auth Admin API và Postgres không chung transaction: bootstrap/invitation tạo `INVITATION_PENDING` account và retry idempotent; chỉ callback identity khớp mới chuyển account sang `ACTIVE`. Password recovery chỉ đổi credential ở Auth, không đổi application role/status. Last-active-Reviewer guard nằm trong transaction database.

Storage upload và Postgres publication cũng không chung transaction. Upload/verify object trước, publish immutable reference sau; upload lỗi không switch public state. Giữ object còn được retained snapshot tham chiếu; không overwrite media đã snapshot. Cleanup orphan là thao tác vận hành theo yêu cầu, không thêm scheduler.

Chống lạm dụng cho lookup QR công khai và terminal intake (Spec M03 §9): MVP dựa vào giới hạn mặc định của nền tảng Supabase, không có bộ đếm tần suất tự viết; Edge intake từ chối body quá 64 KiB và mọi khóa ngoài allowlist trước khi chạy Zod. Rủi ro bản ghi giả đúng định dạng vẫn được chấp nhận. Reviewer đầu tiên (BR-M03-K04) được cấp bằng script phía server do operator chạy từ máy của mình với `APP_BACKEND_SECRET_KEY` lấy từ môi trường shell; không có endpoint, route hay Edge Function công khai cho việc này.

## 6. Validation and Typed Contracts

| Technology | Responsibility | Scope | Status |
|---|---|---|---|
| TypeScript types | Compile-time representation của module và integration contracts | Frontend modules và shared contract package | Selected — not implemented |
| Zod | Runtime schema validation cho contract/payload | Client boundaries và Edge Functions | Selected — not implemented |
| Shared schema package/module | Dùng cùng logical schema ở client và server-side TypeScript boundary | Cross-module payloads và integration inputs | Selected — not implemented |

Database constraints và server-side authorization vẫn phải enforce invariant tại backend; client/Zod validation không thay thế các kiểm tra đó.

## 7. Hosting and Runtime Platforms

| Component | Platform | Responsibility | Status |
|---|---|---|---|
| Web client | Single Vercel Project | Một website/PWA chứa public và protected routes của M01/M02/M03 | Selected — project/deployment state not verified |
| Backend/data | Single Supabase Cloud Project | Shared PostgreSQL, Auth, RLS, Storage, Edge Functions, RPC và Data API | Selected — not implemented |
| Browser runtime | Standards-based browser/PWA platform | UI, Cache Storage, IndexedDB, camera/QR interaction và network access | Selected runtime |

## 8. Development Tooling

| Tool | Purpose | Runtime dependency? | Status |
|---|---|---:|---|
| Git | Version control | No | Present |
| GitHub | Remote source repository | No | Present (`origin`) |
| Node.js 24 LTS + npm | Frontend toolchain; exact dependency versions phải pin khi implementation được tạo | No | Selected — repository không có package/lockfile |
| Supabase CLI | Local Supabase testing khi được chọn; link/deploy chỉ tới một canonical cloud project | No | Selected — CLI/local harness/cloud link not verified |
| Vitest + Testing Library | Unit/component tests và contract validation | No | Selected — not implemented |
| Playwright | Browser E2E, offline/reload/multi-tab scenarios | No | Selected — not implemented |
| pgTAP / transactional database fixtures | Schema, grant và RLS assertions trên local/ephemeral target | No | Selected approach — exact harness not verified |
| Spec Kit 1.0.1 | Specification, planning and task workflow assets | No | Present in `.specify/` |
| Python scripts | Default Spec Kit script runner | No | Present in `.specify/scripts/python/` |
| PowerShell scripts | Windows-compatible Spec Kit workflow runner | No | Present in `.specify/scripts/powershell/` |

## 9. Stack by Module

| Module | Frontend | Local storage | Backend/data | Special responsibility |
|---|---|---|---|---|
| M01 — Route Planning & Preparation | Shared React/TypeScript/Vite PWA, public routes | Cache Storage; IndexedDB via Dexie | Public Published Route and `JourneySnapshot` reads from Supabase | Offline package staging/atomic activation and `SelectedRouteContext v3` publication |
| M02 — Field Quest Experience | Shared React/TypeScript/Vite PWA, public routes | IndexedDB via Dexie | Supabase `LiveQrLookupResult` reads and `SessionSyncRecord` intake | Frozen journey, local progress, online/offline content selection and retry queue |
| M03 — Operations & Content Administration | Shared React/TypeScript/Vite app, protected online-only routes | No offline draft store | Supabase Postgres/Auth/RLS/Storage plus server-side functions | Administration, review/publication, snapshots, `SessionSyncRecord` intake, `SessionRecord` persistence and reports |

Ba module dùng chung stack và codebase; bảng này mô tả responsibility khác nhau, không tạo ba technology stacks riêng.

## 10. Technology Responsibility Matrix

| Concern | Technology | Responsibility |
|---|---|---|
| UI | React | Shared browser UI for M01–M03 |
| Type safety | TypeScript | Compile-time types for modules and contracts |
| Build | Vite | Frontend development/build pipeline and public config injection |
| PWA integration | `vite-plugin-pwa` | Connect PWA/service-worker generation to Vite |
| Static cache | Workbox + Cache Storage | App shell and i18n/static resources |
| Structured local storage | IndexedDB | Offline packages, handoff, sessions, visits and pending sync |
| Local DB wrapper | Dexie | IndexedDB access and migrations |
| Database | Supabase PostgreSQL | Canonical backend application data |
| Authentication | Supabase Auth | Admin identity and credential/session lifecycle |
| Authorization | RLS + server-side permission checks | Public/admin data boundaries and role enforcement |
| Media storage | Supabase Storage | Published media objects |
| Server-side functions | Edge Functions + PostgreSQL RPC | Edge: HTTP/Auth Admin boundary; RPC: database transactions and reports |
| Schema validation | Zod | Runtime validation at TypeScript boundaries |
| Frontend hosting | Vercel | Static web deployment |
| Backend hosting | Supabase | Hosted backend/data services |

## 11. Explicit MVP Non-goals

| Excluded technology / pattern | Reason | Source |
|---|---|---|
| Microservices | MVP uses one Modular Monolith and one Shared Backend | Approved architecture decision; [System Configuration](system-configuration.md) |
| Message broker or backend job queue | Snapshot/publication are synchronous transactional operations; terminal retry is client-owned | [System Configuration](system-configuration.md), Runtime components |
| Cron/scheduler and report pre-aggregation | Reports query on demand; MVP defines no scheduled backend processing | [System Configuration](system-configuration.md), Runtime components; [Spec M03](../spec/spec-M03.md) §5.1 |
| Offline administration/draft synchronization | M03 is online-only | [MVP Scope](../../MVP-Scope.md) §5 |
| Dedicated observability vendor | No separate vendor is selected in the current architecture baseline | Approved architecture decision scope |
| Additional hosted application environments | MVP uses one Single Cloud Application Environment; local machine is a development workstation | Approved architecture decision; [Environment Configuration](environment.md) §2 |
| Additional Supabase or Vercel project for test isolation | Target topology fixes one project of each; isolation must be local or an explicit limitation | [Environment Configuration](environment.md) §§9–12 |

## 12. Dependency Rules

- Frontend code may receive only public `VITE_*` configuration; `APP_BACKEND_SECRET_KEY` is server-only and must never enter a browser bundle.
- Active frontend configuration points to the Single Supabase Cloud Project; generated deployment URLs must not introduce another backend/environment.
- Cache Storage is limited to app shell/static/i18n resources; structured application/offline data belongs in IndexedDB.
- M01, M02 and M03 keep logical ownership boundaries even though they share one codebase and deployment.
- M02 reads M01 shared contracts but never mutates M01 data; M01 never mutates M02 session/progress.
- Backend authorization and database constraints remain authoritative; hiding a UI action or validating only in the client is insufficient.
- New backend services, queues, schedulers or deployment units require an explicit architecture decision before addition.
- A dependency becomes implemented only when it is declared in package/config files and present in source; `Selected — not implemented` does not imply installation.

## 13. Decisions and Implementation Verification

Các technology choices ở §§2–8 là **Selected**. Repository hiện không có implementation artifact để xác nhận installation, runtime behavior hoặc hosted deployment; xem [Environment Configuration](environment.md) §§10–12.

- Khi implementation được tạo, pin exact dependency/CLI versions, commit lockfile và chỉ ghi version là verified sau khi cài/chạy thực tế.
- Browser runtime dependencies đã chọn: React, React Router, Dexie, Supabase JS, Zod và ZXing. TypeScript/Vite/plugin PWA/test tools là development dependencies; generated Workbox service worker chạy trong browser. Edge chạy Deno qua Supabase; kiến trúc này không thêm Node backend server trên Vercel.
- Release gate: build/typecheck; contract tests; RPC rollback/concurrency/RLS tests; browser offline start, cached scanner, reload recovery, update deferral và terminal retry/conflict tests.
- Kiểm tra camera + offline trên thiết bị Android/iOS thực tế; Playwright không thay thế kiểm tra permission/camera và browser eviction.
- Giữ SPA + BaaS vì hợp với local-first flow và admin online; chưa có requirement cần SSR, server riêng hoặc state/cache framework bổ sung. Đây là trade-off giảm complexity, không cam kết tối ưu hiệu năng trước đo đạc.

## 14. Official References

- [Node.js releases](https://nodejs.org/en/about/previous-releases): chọn nhánh LTS cho toolchain.
- [React Router declarative mode](https://reactrouter.com/start/declarative/installation), [ZXing browser](https://github.com/zxing-js/browser): routing và scanner adapters.
- [Vite PWA update prompt](https://vite-pwa-org.netlify.app/guide/prompt-for-update): cơ chế update có kiểm soát.
- [Supabase database functions](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): data transactions và authorization boundary.
- [Supabase CLI local development](https://supabase.com/docs/guides/local-development/cli/getting-started): local stack và hosted-project linking.
- [Supabase database migrations](https://supabase.com/docs/guides/local-development/database-migrations): local validation và deployment tới linked Cloud project.
- [Vercel Git deployments](https://vercel.com/docs/git): deployment behavior trong một Vercel Project.
- [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro): test tooling.
