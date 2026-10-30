# Implementation Plan: M01 — Route Planning & Preparation

**Branch**: `001-m01-route-planning-preparation` *(định danh thư mục; chưa tạo git branch)* | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification [specs/001-m01-route-planning-preparation/spec.md](spec.md), bản dẫn xuất từ [spec-M01 v3.2](../../docs/spec/spec-M01.md) (Change Brief CHG-M01-2026-10-29-01). Producer: plan đã duyệt [specs/003](../003-m03-operations-content-administration/plan.md). Consumer: package 002 ([specs/002](../002-m02-field-quest-experience/plan.md)).

**Note**: Plan này là bản dẫn xuất (Layer 3). Nó không tạo requirement, không đổi tên contract hay ID. Hành vi lấy từ spec-M01. Quyết định kỹ thuật lấy từ [tech-stack.md](../../docs/architecture/tech-stack.md), [environment.md](../../docs/architecture/environment.md), [system-configuration.md](../../docs/architecture/system-configuration.md) và [Physical Schema](../../data/06-physical-schema.md) §11; phần nguồn để trống được quyết ở [research.md](research.md).

## Summary

M01 cho du khách chọn ngôn ngữ `vi`/`en`, duyệt và xem chi tiết tuyến, nhận gợi ý exact-match theo ba nhóm tag, chuẩn bị gói offline (tải, kiểm tra, publish nguyên tử, cập nhật lười, xóa, giữ chữ cốt lõi kèm thời điểm lưu) và Start một tuyến để tạo handoff một lần dùng, hạn 24 giờ. Đầu vào là hai contract của M03: **Published Route projection** và **`JourneySnapshot`**. Đầu ra cho M02 là **`LanguagePreference`**, **`SelectedRouteContext v3`** và ready **`OfflinePackage`** (với `OfflineResource`).

Cách làm kỹ thuật:

- **Frontend:** SPA React + TypeScript + Vite trong website/PWA dùng chung. M01 là các route công khai `/`, `/recommend`, `/routes/:routeId`, `/offline`, lazy-load ([research.md](research.md) R-03).
- **Lưu trữ cục bộ:** Dexie trên IndexedDB, database `cuc-phuong-quest`, đúng store của Physical §11; byte ảnh là `Blob`; kích hoạt gói và ghi context trong một transaction ngắn, network ngoài transaction (R-07, R-08, R-11).
- **Nguồn:** chỉ đọc view `api.*` qua Data API và signed URL của bucket private; timeout `SOURCE_REQUEST_TIMEOUT_SECONDS` = 8 (**provisional**) (R-05, R-06).
- **App shell:** `vite-plugin-pwa` `generateSW`, cập nhật kiểu prompt, không runtime cache dữ liệu API (R-14).
- **Phạm vi:** M01 không có backend riêng; toàn bộ nằm trong phạm vi code đã mở. Tích hợp thật phụ thuộc M03 giai đoạn B (bị chặn); trước đó dùng adapter giả và network mock (R-01).

## Technical Context

**Language/Version**: TypeScript (strict) trên Node.js 24 LTS cho toolchain; React cho UI. Không có SQL hay Edge Function trong package này. Phiên bản dependency chính xác được pin khi task setup cài đặt thật (R-02).

**Primary Dependencies**: `react`, `react-dom`, `react-router` (declarative mode), `@supabase/supabase-js`, `zod`, `dexie`; dev: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `typescript`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test`. Đề xuất dev `fake-indexeddb` (cần duyệt, Complexity #4). Browser API: IndexedDB, Cache Storage, Web Locks, `crypto.randomUUID`, `navigator.storage`. Không thêm thư viện state, i18n, form (R-02, R-12).

**Storage**: IndexedDB qua Dexie — 4 store entity M01 (`languagePreference`, `selectedRouteContext`, `offlinePackages`, `offlineResources`) + 3 store kỹ thuật (`activePackages`, `packageCandidates`, `imageBytes`); Cache Storage chỉ cho app shell và i18n. Không có lưu trữ backend của M01 ([data-model.md](data-model.md)).

**Testing**: Vitest + Testing Library (unit, contract Zod, component; cạnh mã nguồn trong `src/`); Playwright (E2E, offline, service worker, nhiều tab) trong `e2e/m01/` với network mock; tích hợp stack Supabase local chỉ sau M03 giai đoạn B; kiểm tra thủ công trên thiết bị thật (R-16).

**Target Platform**: Trình duyệt di động hiện đại (Android Chrome, iOS Safari) của du khách, dùng trong trình duyệt (không khuyến khích cài lên màn hình chính iPhone, spec-M01 §9.2); secure context (HTTPS hoặc localhost). Single Vercel Project; backend Single Supabase Cloud Project.

**Project Type**: Web application, modular monolith (một frontend codebase, 3 module logic + một BaaS backend).

**Performance Goals**: Không đặt — spec-M01 §10.2: "the MVP specification sets none" (R-17). Chỉ có ràng buộc kỹ thuật: lazy-load từng màn; tối đa 4 request ảnh song song khi tải gói.

**Constraints**: Offline-capable (app shell + i18n trong Cache Storage; dữ liệu nghiệp vụ trong IndexedDB); nguồn khả dụng chỉ khi request thành công, timeout **8 s provisional**; kích hoạt gói và ghi context nguyên tử; không lộ staging cho M02; URL không được tính là byte đã tải; không runtime cache API/Auth/media đã ký; không cập nhật service worker khi có thao tác gói đang chạy (constitution VI); không secret trong `VITE_*`.

**Scale/Scope**: 4 màn hình (SCR-M01-001…004) + control ngôn ngữ dùng chung; 7 function (FN-M01-001…007), 50 sub-function; 14 FR; 16 BR; 10 SC; 4 entity canonical; 5 contract (2 consume, 3 produce). Kích thước gói bị M03 chặn ở trần `OFFLINE_PACKAGE_MAX_MB` = 50 (**provisional**, spec-M03 §5.3). Nguồn không nêu số du khách hay số tuyến.

Mọi mục `NEEDS CLARIFICATION` ban đầu đã được giải quyết ở [research.md](research.md) §1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Đối chiếu với [constitution](../../.specify/memory/constitution.md) v2.0.2.

| Nguyên tắc | Kiểm tra | Pre-Phase 0 | Post-Phase 1 | Bằng chứng |
|---|---|---|---|---|
| I. Spec-First Behavioral Authority | Không thêm behavior; mọi quyết định trỏ tới spec-M01; phần deferred (§10.2) được quyết ở mức trình bày/kỹ thuật và ghi rõ | PASS | PASS | research R-13, R-17, R-18 ghi rõ cách đọc nguồn; mọi contract có cột FR/BR/SC |
| II. Module Ownership Boundaries | M01 chỉ ghi 4 entity + 3 store kỹ thuật của nó; tên contract giữ nguyên (Published Route, `JourneySnapshot`, `LanguagePreference`, `SelectedRouteContext v3`, ready `OfflinePackage`); M02 chỉ đọc qua hàm đã validate; không lộ staging; ghi context nguyên tử; M01 không đụng dữ liệu M02/M03 | PASS | PASS | data-model §1, §5; contracts/ theo AGENTS.md §3.2; R-04, R-07 |
| III. Minimal Diff & Traceability | Chỉ tạo file trong package; ID ổn định; điểm lệch/phối hợp được ghi, không tự sửa plan M03 hay file upstream | PASS | PASS | research §4, §5 |
| IV. Data Integrity & Immutability | Manifest/resources đóng băng; candidate không bao giờ thành active trước khi kích hoạt thành công; lỗi cập nhật giữ gói cũ; essentials thay nguyên khối | PASS | PASS | R-08; offline-package-contract §4–§5 |
| V. Security & Authorization | M01 chỉ đọc qua `anon` + RLS/policy Storage của M03; không secret, chỉ `VITE_*` công khai; không PII | PASS | PASS | R-05, R-06, R-15 |
| VI. Offline Integrity & PWA Contract | Precache app shell + i18n; không runtime cache API/Auth/admin/signed media; byte ảnh là `Blob` trong IndexedDB; gói `SAN_SANG` + `OUTDATED` vẫn dùng được; cập nhật prompt, hoãn khi có thao tác gói/phiên/form; chỉ tuyên bố đã tải khi đủ byte | PASS | PASS | R-06, R-08, R-14; visitor-ui-flow-contract §3 |
| VII. Simplicity & MVP Scope | Không thêm capability, role, khái niệm; không scheduler/sync nền (cập nhật lười); không store danh mục mới; không dependency runtime mới ngoài tech-stack | PASS | PASS | R-02, R-10, R-13; dev dependency đề xuất ghi ở Complexity #4 |
| Security Principles checklist | Đọc công khai dựa vào RLS/view của M03; không `VITE_*` secret | PASS (thiết kế) | PASS (thiết kế) | RLS/policy thuộc M03 giai đoạn B |
| Testing & Validation | Mỗi BR-M01 có test; contract test Required/Conditional/Optional; test rollback cho kích hoạt gói và ghi context; test candidate `CHUA_HOAN_TAT` không bao giờ active; không tuyên bố PASS khi chưa chạy | PASS có điều kiện | PASS có điều kiện | truy vết test trong từng contract; quickstart V1–V26; CI và test Dexie ghi ở Complexity #3, #4 |

**Kết quả:** **PASS** cả trước Phase 0 và sau Phase 1. Không có vi phạm nguyên tắc. Bốn ràng buộc phạm vi/tiến trình được ghi ở Complexity Tracking để người duyệt plan quyết.

## Project Structure

### Documentation (this feature)

```text
specs/001-m01-route-planning-preparation/
├── spec.md                              # đầu vào (đã có)
├── checklists/requirements-quality.md   # đầu vào (đã có)
├── plan.md                              # file này
├── research.md                          # Phase 0
├── data-model.md                        # Phase 1
├── quickstart.md                        # Phase 1
├── contracts/                           # Phase 1
│   ├── m03-publication-consumer-contract.md   # M03 → M01: Published Route projection, JourneySnapshot (phía consumer)
│   ├── language-preference-contract.md        # M01 → M02: LanguagePreference
│   ├── selected-route-context-v3-contract.md  # M01 → M02: SelectedRouteContext v3
│   ├── offline-package-contract.md            # M01 → M02: ready OfflinePackage / OfflineResource
│   └── visitor-ui-flow-contract.md            # màn hình → route → thao tác; app shell/PWA
└── tasks.md                             # Phase 2 (/speckit-tasks — KHÔNG tạo ở bước này)
```

### Source Code (repository root)

```text
src/
├── app/                              # shell dùng chung (router gốc, provider)
│   ├── paths.ts                      # hằng path, gồm PATHS.m02SessionEntry = '/trip' (002 chốt)
│   └── pwa/updateCoordinator.ts      # prompt update + Web Lock cpq:busy + registerBusyCheck (R-14; dùng chung với 002/003)
├── shared/
│   ├── contracts/                    # Zod + TS cho contract cross-module (R-04)
│   │   ├── publishedRoute.ts         # do 003 sở hữu — M01 import
│   │   ├── journeySnapshot.ts        # do 003 sở hữu — M01 import
│   │   ├── languagePreference.ts     # M01 sở hữu
│   │   ├── selectedRouteContext.ts   # M01 sở hữu (SelectedRouteContextV3)
│   │   ├── offlinePackage.ts         # M01 sở hữu (OfflinePackage, OfflineResource)
│   │   └── __fixtures__/             # fixture synthetic dùng chung
│   ├── db/visitorDb.ts               # Dexie `cuc-phuong-quest`, version 1 = Physical §11 (R-07)
│   ├── config/                       # VITE_* + MEDIA_BUCKET (R-06, R-15)
│   ├── supabase/                     # client factory (publishable key) — từ 003
│   ├── testing/                      # e2eHooks.ts: cầu nối test E2E, chỉ ở MODE e2e/fake (tasks M03 T007)
│   └── ui/                           # token CSS từ design-system, component nền, icon từ assets/icons/
└── modules/
    └── m01/
        ├── index.ts                  # bề mặt công khai cho M02: LanguageControl, hook/hàm đọc (R-07, R-12)
        ├── routes.tsx                # 4 route lazy + guard ngôn ngữ
        ├── config/limits.ts          # SOURCE_REQUEST_TIMEOUT_SECONDS = 8 (provisional); hằng kỹ thuật
        ├── i18n/                     # vi.ts, en.ts (bảng copy của screen spec)
        ├── layout/                   # VisitorLayout (khe LanguageControl)
        ├── testing/                  # đăng ký hook E2E namespace m01
        ├── api/                      # adapter Data API + Storage có timeout; ánh xạ dòng → contract
        │   └── fake/                 # adapter giả in-memory cho unit/component
        ├── storage/                  # kiểu dòng Dexie, writer, reader, transaction (chỉ M01 ghi)
        ├── language/                 # LanguagePreference, LanguageControl, resolveDisplayLanguage
        ├── catalog/                  # SCR-M01-001, local view trong bộ nhớ, lọc, sắp xếp
        ├── recommendation/           # SCR-M01-002, hàm exact-match
        ├── route-detail/             # SCR-M01-003, dialog quyết định offline, essentials offline
        ├── offline-package/          # pipeline tải/kiểm tra/kích hoạt/cập nhật/xóa, lock theo tuyến; SCR-M01-004
        └── start/                    # Start online/offline, ghi context, thu hồi

e2e/m01/                              # Playwright (cần xác nhận phạm vi — Complexity #2)

package.json, package-lock.json, tsconfig*.json, vite.config.ts (PWA), vitest.config.ts,
playwright.config.ts, .env.example, .env.e2e   # tooling gốc (Complexity #2)
```

**Structure Decision**: Một web app (modular monolith), cùng cấu trúc với plan M03. M01 nằm trọn trong `src/modules/m01/`; M02 chỉ dùng `src/modules/m01/index.ts`. Phần dùng chung: `src/shared/contracts` (schema contract), `src/shared/db` (một khai báo Dexie cho cả M01 và M02), `src/shared/config`, `src/shared/supabase`, `src/shared/ui`, shell `src/app`. M01 không import từ `src/modules/m02|m03`. M01 không có file nào dưới `supabase/`.

## Component Responsibilities

| Thành phần | Trách nhiệm | FN / FR | Contract |
|---|---|---|---|
| `language/` | Lưu/công bố preference; bước chọn ngôn ngữ; `LanguageControl`; ngôn ngữ thiết bị cho entry link QR | FN-M01-001; FR-M01-001 | language-preference |
| `catalog/` | Đọc R1, lọc tuyến chọn được, thẻ, local view, ảnh placeholder; kích hoạt thu hồi/`OUTDATED`/essentials | FN-M01-002; FR-M01-002 | m03-publication-consumer |
| `recommendation/` | Chip ba nhóm; exact-match 0..N; A→Z | FN-M01-003; FR-M01-004 | m03-publication-consumer |
| `route-detail/` | Chi tiết online/offline; essentials đã lưu + thời điểm; cờ cần gói; dialog quyết định offline | FN-M01-002, 004; FR-M01-003, 005, 006, 014 | m03-publication-consumer, offline-package |
| `offline-package/` | Pipeline tải → kiểm tra → staging → kích hoạt; cập nhật lười; làm mới essentials; xóa; khôi phục candidate mồ côi; SCR-M01-004 | FN-M01-005; FR-M01-007…010, 014 | offline-package |
| `start/` | Chọn đường online/offline; dựng và ghi context v3; thu hồi; mở M02 sau commit | FN-M01-006; FR-M01-011, 012 | selected-route-context-v3 |
| `storage/` + `index.ts` | Writer nội bộ; reader đã validate cho M01 và M02; không bao giờ lộ candidate | FN-M01-007; FR-M01-013 | ba contract produce |
| `api/` | Adapter Data API/Storage, timeout provisional, signed URL, ánh xạ dòng | — | m03-publication-consumer |
| `src/app/pwa/` | Precache, `navigateFallback`, cập nhật prompt, lock `cpq:busy` | spec-M01 §9.3 | visitor-ui-flow §3 |

## Data Flow and Persistence Boundaries

- **Đọc nguồn:** adapter → Data API (`api.published_routes`, `api.active_journey_snapshots`) với timeout 8 s (provisional) → schema dùng chung → bộ nhớ. Đọc thành công kéo theo: thu hồi context tuyến đóng, đánh dấu `OUTDATED`, làm mới essentials (mỗi việc một transaction ngắn).
- **Gói:** lock `cpq:m01:package:{routeId}` → candidate `DANG_TAI` → (ngoài transaction) đọc snapshot + tải byte → kiểm tra trong bộ nhớ → staging → **một** transaction kích hoạt (gói, resources, byte, con trỏ, xóa bản cũ, xóa candidate). Lỗi → gói cũ giữ nguyên hoặc `CHUA_HOAN_TAT` ([research.md](research.md) R-08).
- **Start:** lock `cpq:m01:start` → nguồn online (dòng tuyến + snapshot) hoặc gói `SAN_SANG` → dựng context → **một** transaction `put` → điều hướng M02.
- **Công bố cho M02:** M02 gọi hàm đọc của `src/modules/m01/index.ts`; các hàm đọc trong transaction chỉ-đọc, theo con trỏ `activePackages`, validate contract, trả `null` khi không hợp lệ.
- **Cache Storage:** chỉ app shell, chunk, i18n, icon. Không dữ liệu nghiệp vụ, không response API.
- **Không có** gửi dữ liệu nào lên backend từ M01.

## Integration Contracts

| Hướng (AGENTS.md §3.2) | Contract | File |
|---|---|---|
| M03 → M01 | Published Route projection, `JourneySnapshot` | [m03-publication-consumer-contract.md](contracts/m03-publication-consumer-contract.md) (phía producer: [publication-public-contract.md](../003-m03-operations-content-administration/contracts/publication-public-contract.md)) |
| M01 → M02 | `LanguagePreference` | [language-preference-contract.md](contracts/language-preference-contract.md) |
| M01 → M02 | `SelectedRouteContext v3` | [selected-route-context-v3-contract.md](contracts/selected-route-context-v3-contract.md) |
| M01 → M02 | ready `OfflinePackage` (+ `OfflineResource`) | [offline-package-contract.md](contracts/offline-package-contract.md) |
| Nội bộ M01 | màn hình, route, app shell | [visitor-ui-flow-contract.md](contracts/visitor-ui-flow-contract.md) |
| M03 → M02, M02 → M03 | `LiveQrLookupResult`/`LiveStationContent`, `SessionSyncRecord` | không thuộc M01 |

Đối chiếu với phía M03: tên, version và ranh giới khớp; bốn điểm cần lưu ý (L-01…L-04) ở [research.md](research.md) §5. Điểm phối hợp với 002/003 (P-01…P-06) ở research §4.

## Implementation Sequence (định hướng cho `/speckit-tasks`)

| Bước | Nội dung | Phụ thuộc |
|---|---|---|
| 1 | Tooling gốc (nếu chưa có từ 003): `package.json`, TS strict, Vite + PWA, Vitest, Playwright, `.env.example`, `.env.e2e` | xác nhận Complexity #2 |
| 2 | Shell: `src/app` (router, `paths.ts`), `src/app/pwa/updateCoordinator.ts`, `src/shared/config`, `src/shared/supabase`, `src/shared/ui` (token) — nếu 003 chưa tạo | 1 |
| 3 | `src/shared/db/visitorDb.ts` (Physical §11, version 1) | 1 |
| 4 | Contract: 3 schema M01 + fixture + contract test; import/thử 2 schema của 003 (nếu 003 chưa có thì tạo theo đúng contract M03 và bàn giao quyền sở hữu cho 003) | 1 |
| 5 | `m01/config/limits.ts` (provisional), `m01/i18n`, `m01/storage` (writer/reader + test transaction) | 3, 4; Complexity #4 |
| 6 | `m01/api` (adapter thật + giả; timeout; signed URL) | 4 |
| 7 | `language/` + guard + `LanguageControl` (Story 1) | 5 |
| 8 | `catalog/` (Story 2), `route-detail/` online (Story 3) | 6, 7 |
| 9 | `start/` online + thu hồi (Story 4, 5) | 8 |
| 10 | `offline-package/` + dialog quyết định + SCR-M01-004 + Start offline + essentials offline (Story 6) | 8, 9 |
| 11 | `recommendation/` (Story 7, P2) | 8 |
| 12 | PWA precache/`navigateFallback`/coordinator + E2E V1–V26 trên network mock | 7–11 |
| 13 | Tích hợp stack Supabase local (V4, V10, V17, V22) | **M03 giai đoạn B** |

## Risks

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| M03 giai đoạn B chưa mở | M01 không có nguồn thật | Complexity #1; adapter giả và network mock giữ đúng contract |
| Tên cột view `api.*` chưa cố định (L-01) | Mọi dòng bị coi là hỏng | Hàm ánh xạ đặt cạnh schema dùng chung; chốt cùng migration bước 4 của M03 |
| Trình duyệt xóa/evict IndexedDB | Mất gói, context, preference | Gọi `navigator.storage.persist()`; không tuyên bố lưu trữ bảo đảm (spec-M01 §5.4) |
| Hết quota giữa lúc kích hoạt | Tải không xong | Transaction rollback giữ gói cũ; báo tải chưa hoàn tất |
| Trình duyệt cũ không có Web Locks | Hai tab có thể cùng tải | Token trong transaction kích hoạt vẫn chặn kết quả kép; ghi rủi ro (R-09) |
| Timeout 8 s chưa kiểm chứng ở thực địa | Nhầm nguồn chậm thành mất nguồn | Giá trị provisional; chủ dự án kiểm chứng trước lần phát hành thật (spec-M01 §9.3) |
| 002 không dùng `visitorDb`/bề mặt công khai của M01 | Hai database hoặc M02 đọc staging | Phối hợp P-01, P-02 khi plan 002 |

## Validation Strategy

- **Tự động:** typecheck, lint, unit, contract (Zod fixture cho 3 contract produce + consumer fixture cho 2 contract consume), component, test transaction Dexie (kích hoạt gói, rollback khi lỗi, ghi context, thu hồi, xóa), E2E Playwright có offline và nhiều tab.
- **Ánh xạ BR → test:** mỗi BR-M01-001…016 có ít nhất một test; bảng "Truy vết test" của từng contract và quickstart V1–V26 là đầu vào cho tasks.md.
- **Thủ công:** offline và eviction trên Android/iOS thật; kết quả ghi riêng, không thay bằng Playwright.
- **Không** test trên Shared Backend; phần không chạy được ghi `NOT RUN`.

## Downstream References

- `/speckit-tasks` đọc: plan.md, research.md, data-model.md, contracts/*.md, quickstart.md.
- Package 002 phải: dùng `src/shared/db/visitorDb.ts`, đọc dữ liệu M01 chỉ qua `src/modules/m01/index.ts` (gồm kết quả `NONE`/`INVALID`/`OK` của `readSelectedRouteContext()`, D-01), import 3 schema M01 trong `src/shared/contracts/`, đặt `LanguageControl` trên trang `/q/{qrIdentifier}`, dùng `PATHS.m02SessionEntry = '/trip'`, đăng ký `hasRunningSession()` qua `registerBusyCheck` của update coordinator (D-02).
- Điểm cần M03 xác nhận khi viết migration: [research.md](research.md) §5 (L-01, L-02).

## Complexity Tracking

> Không có vi phạm nguyên tắc constitution. Các mục dưới đây là ràng buộc phạm vi hoặc tiến trình, cần người duyệt plan quyết.

| # | Mục | Vì sao cần | Phương án đơn giản hơn bị loại vì |
|---|---|---|---|
| 1 | Nguồn thật của M01 (view `api.*`, policy đọc Storage) thuộc **M03 giai đoạn B, đang bị chặn** | FR-M01-002/007/011 cần đọc Published Route và `JourneySnapshot` thật | M01 tự tạo view tạm thì vi phạm AGENTS.md §2 và ownership M03. **Tạm thời:** adapter giả + network mock; bước 13 chờ change brief backend của M03 |
| 2 | File tooling gốc (`package.json`, lockfile, `tsconfig*.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.env.e2e`) và `e2e/` không được AGENTS.md §2 nêu đích danh | Không có chúng thì không build/test được | Giống Complexity #2 của plan M03; **cần** người dùng xác nhận một lần cho cả hai package. `.env.e2e` chỉ chứa giá trị giả an toàn |
| 3 | Constitution yêu cầu test BR chạy trong CI; repo chưa có CI và CI chưa được mở phạm vi | Test phải chạy tự động khi merge | Thêm CI ngay là mở phạm vi chưa duyệt. **Tạm thời:** `npm run test` / `npm run e2e`; nối CI cần quyết định riêng (giống #3 của M03) |
| 4 | Dev dependency `fake-indexeddb` chưa có trong tech-stack | Test transaction Dexie (kích hoạt gói, ghi context) trong Vitest; jsdom không có IndexedDB | Vitest browser mode cũng cần dependency mới. **Nếu không duyệt:** chuyển các test này sang Playwright (trình duyệt thật), chậm hơn, không cần dependency |

**Quyết định (2026-10-30, người dùng ủy quyền cho agent quyết; tasks.md T001; giống plan M02, M03):**

- **#1:** giữ nguyên — tích hợp thật chờ M03 giai đoạn B (change brief backend).
- **#2:** duyệt — file tooling gốc, `.env.e2e` (giá trị giả an toàn) và `e2e/` thuộc "cấu hình Vite".
- **#3:** duyệt nối CI (người dùng, 2026-10-30; thay quyết định hoãn trước đó): .github/workflows/ci.yml chạy `npm run ci` và E2E project mock trên mỗi push/PR (tasks M03 T002); job Supabase local thêm khi giai đoạn B mở (tasks M03 T198).
- **#4:** duyệt `fake-indexeddb` **chỉ làm dev dependency** cho Vitest; không vào bundle.
