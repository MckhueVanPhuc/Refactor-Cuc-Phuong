# Implementation Plan: M02 — Field Quest Experience

**Branch**: `002-m02-field-quest-experience` *(định danh thư mục; chưa tạo git branch)* | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification [specs/002-m02-field-quest-experience/spec.md](spec.md), bản dẫn xuất từ [spec-M02 v3.3](../../docs/spec/spec-M02.md) (Change Brief CHG-M02-2026-10-29-01). Producer đầu vào: plan M01 ([specs/001](../001-m01-route-planning-preparation/plan.md)) và plan M03 ([specs/003](../003-m03-operations-content-administration/plan.md)), cả hai đã duyệt. Consumer đầu ra: M03.

**Note**: Plan này là bản dẫn xuất (Layer 3). Nó không tạo requirement, không đổi tên contract hay ID. Hành vi lấy từ spec-M02. Quyết định kỹ thuật lấy từ [tech-stack.md](../../docs/architecture/tech-stack.md), [environment.md](../../docs/architecture/environment.md), [system-configuration.md](../../docs/architecture/system-configuration.md) và [Physical Schema](../../data/06-physical-schema.md) §11; phần nguồn để trống được quyết ở [research.md](research.md).

## Summary

M02 tạo một phiên thực địa từ handoff hợp lệ của M01, hiển thị journey cố định, ghi lượt ghé theo QR (trình quét trong app hoặc link mở bằng camera điện thoại), hiện nội dung của đúng mã đã quét từ nguồn đúng (live khi online, gói khi offline hoặc tra cứu lỗi), báo khu vực tạm đóng, giữ tiến độ cục bộ, kết thúc phiên (Finish, câu hỏi cuối chuyến, thay phiên, tự đóng sau 24 giờ) và đồng bộ bản ghi terminal ẩn danh. Đầu vào: **`LanguagePreference`**, **`SelectedRouteContext v3`**, ready **`OfflinePackage`** (M01) và **`LiveQrLookupResult`/`LiveStationContent`** (M03). Đầu ra: **`SessionSyncRecord`** cho M03, nơi lưu thành `SessionRecord`.

Cách làm kỹ thuật:

- **Frontend:** SPA React + TypeScript + Vite trong website/PWA dùng chung; route công khai `/trip`, `/trip/qr/:qrIdentifier`, `/trip/end`, `/q/:qrIdentifier`, lazy-load; scanner `@zxing/browser` lazy, đã precache ([research.md](research.md) R-03, R-13).
- **Lưu trữ cục bộ:** 3 store M02 trong database Dexie dùng chung `cuc-phuong-quest` (khai báo bởi M01); mọi bước nghiệp vụ là một transaction ngắn: tạo/thay phiên, ghi lượt ghé, chuyển terminal + xếp hàng đợi (R-06, R-08, R-09).
- **Nguồn:** RPC `api.lookup_qr` với timeout `LOOKUP_TIMEOUT_SECONDS` = 8 (**provisional**); Edge `session-intake` cho đồng bộ; signed URL cho media (R-08, R-11, R-12).
- **Phạm vi:** M02 không có backend riêng. Tích hợp thật phụ thuộc M03 giai đoạn B (bị chặn) và package 001 (R-01).

## Technical Context

**Language/Version**: TypeScript (strict) trên Node.js 24 LTS cho toolchain; React cho UI. Không có SQL hay Edge Function trong package này. Phiên bản dependency pin khi task setup cài thật (R-02).

**Primary Dependencies**: `react`, `react-dom`, `react-router` (declarative mode), `@supabase/supabase-js`, `zod`, `dexie`, `@zxing/browser` + `@zxing/library`; dev: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `typescript`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `@playwright/test`. Dev `fake-indexeddb` theo đề xuất chung của plan M01 (Complexity #4). Browser API: IndexedDB, `getUserMedia`, Web Locks, `crypto.randomUUID`, Page Visibility. Không thêm thư viện state, i18n, media player.

**Storage**: IndexedDB qua Dexie — `playSessions`, `checkpointVisits`, `pendingSyncItems` (Physical §11). Đọc chỉ-đọc dữ liệu M01 qua hàm của M01. Không lưu kết quả lookup. Không có lưu trữ backend của M02 ([data-model.md](data-model.md)).

**Testing**: Vitest + Testing Library cạnh mã nguồn; Playwright trong `e2e/m02/` (network mock, offline, camera giả Chromium, đồng hồ giả); tích hợp stack Supabase local sau M03 giai đoạn B; kiểm thủ công trên Android/iOS thật (R-19).

**Target Platform**: Trình duyệt di động (Android Chrome, iOS Safari) của du khách, dùng trong trình duyệt; secure context cho camera và `crypto.randomUUID`. Single Vercel Project; backend Single Supabase Cloud Project.

**Project Type**: Web application, modular monolith (một frontend codebase, 3 module logic + một BaaS backend).

**Performance Goals**: Spec không có requirement (spec-M02 §10; checklist CHK025). Mục tiêu kỹ thuật, không phải requirement: trang `/q/…` không tải chunk scanner/M01/M03; LCP ≤ 2,5 s ở profile di động Lighthouse trên build preview với lookup giả (R-17).

**Constraints**: Offline-capable cho phiên (lượt ghé, nội dung gói, hàng đợi); lượt ghé ghi trước khi hiện nội dung; tối đa một phiên chạy mỗi trình duyệt; thay phiên all-or-nothing; lỗi nguồn ≠ `INVALID`; lookup timeout 8 s **provisional**; không PII trong bản ghi đồng bộ; không đồng bộ nền sau khi đóng trình duyệt; không runtime cache lookup/intake/media; không ghi dữ liệu M01/M03; không auto-reload service worker khi phiên đang chạy.

**Scale/Scope**: 4 màn hình (SCR-M02-001…004); 8 function (FN-M02-001…008), 55 sub-function; 26 FR; 26 BR; 19 SC; 3 entity canonical; 5 contract file (2 consume, 1 produce, 2 nội bộ). Mỗi phiên ≤ 30 checkpoint theo giới hạn **provisional** của M03 (spec-M03 §5.3). Nguồn không nêu số du khách.

Mọi mục `NEEDS CLARIFICATION` ban đầu đã được giải quyết ở [research.md](research.md) §1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Đối chiếu với [constitution](../../.specify/memory/constitution.md) v2.0.2.

| Nguyên tắc | Kiểm tra | Pre-Phase 0 | Post-Phase 1 | Bằng chứng |
|---|---|---|---|---|
| I. Spec-First Behavioral Authority | Không thêm behavior; bảng quyết định quét chép từ BR-M02-005/008/009/015/018/020; phần spec giao cho thiết kế (hiệu năng, dung lượng) ghi rõ là mục tiêu kỹ thuật | PASS | PASS | research R-08, R-17, R-18; scan-resolution-contract §2 |
| II. Module Ownership Boundaries | M02 chỉ ghi 3 store của nó; đọc M01 qua hàm của M01; không đọc staging; không dựng journey từ M03; tên contract giữ nguyên; `SessionSyncRecord` ≠ `SessionRecord` | PASS | PASS | data-model §1, §4, §5; R-04, R-05 |
| III. Minimal Diff & Traceability | Chỉ tạo file trong package; ID ổn định; điểm lệch với plan M01/M03 ghi lại, không tự sửa | PASS | PASS | research §4, §5 |
| IV. Data Integrity & Immutability | `journeyCheckpoints` đóng băng; `checkedInAt` đầu bất biến; `record` bất biến, chỉ `syncStatus` đổi; retry giống hệt idempotent, đổi nội dung → conflict; lượt ghé ghi trước nội dung | PASS | PASS | data-model §3, §8; session-sync-record-contract §2–§4 |
| V. Security & Authorization | Gọi intake qua Edge (không RPC ghi cho `anon`); không PII/thiết bị/GPS; không secret, chỉ `VITE_*` công khai | PASS | PASS | R-11, R-16; session-sync-record-contract §1 |
| VI. Offline Integrity & PWA Contract | Lượt ghé chỉ cho lần quét được chấp nhận, trước nội dung, lỗi nội dung không gỡ; gói `OUTDATED` dùng được với cảnh báo; sync chỉ khi app mở, conflict dừng retry; không auto-reload khi phiên chạy; không runtime cache API/media | PASS | PASS | R-08, R-11, R-12, R-15 |
| VII. Simplicity & MVP Scope | Không tài khoản khách, định danh thiết bị, GPS, gợi ý/điểm; không background sync, scheduler; không nút "Dừng chuyến đi"; không xóa dữ liệu không có requirement; chỉ dependency có trong tech-stack | PASS | PASS | R-02, R-09, R-18 |
| Security Principles checklist | Edge validate Zod trước RPC (M03 giai đoạn B); không `VITE_*` secret | PASS (thiết kế) | PASS (thiết kế) | thực thi phía server thuộc M03 |
| Testing & Validation | Mỗi BR-M02 có test; contract test strict; test rollback cho thay phiên và chuyển terminal; test khách tự do tạo 0 `PlaySession`/`CheckpointVisit`/`SessionSyncRecord`; không tuyên bố PASS khi chưa chạy | PASS có điều kiện | PASS có điều kiện | quickstart V1–V29; CI và test Dexie ghi ở Complexity #3, #4 |

**Kết quả:** **PASS** cả trước Phase 0 và sau Phase 1. Không có vi phạm nguyên tắc. Các ràng buộc phạm vi/tiến trình ghi ở Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-m02-field-quest-experience/
├── spec.md                              # đầu vào (đã có)
├── checklists/requirements-quality.md   # đầu vào (đã có)
├── plan.md                              # file này
├── research.md                          # Phase 0
├── data-model.md                        # Phase 1
├── quickstart.md                        # Phase 1
├── contracts/                           # Phase 1
│   ├── m01-shared-data-consumer-contract.md   # M01 → M02: LanguagePreference, SelectedRouteContext v3, ready OfflinePackage
│   ├── live-qr-lookup-consumer-contract.md    # M03 → M02: LiveQrLookupResult / LiveStationContent + link QR
│   ├── session-sync-record-contract.md        # M02 → M03: SessionSyncRecord
│   ├── scan-resolution-contract.md            # nội bộ: bảng quyết định ghi lượt ghé / nguồn nội dung
│   └── field-ui-flow-contract.md              # màn hình → route → thao tác; offline/PWA
└── tasks.md                             # Phase 2 (/speckit-tasks — KHÔNG tạo ở bước này)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── paths.ts                      # PATHS.m02SessionEntry = '/trip' (M02 chốt giá trị)
│   └── pwa/updateCoordinator.ts      # dùng chung; M02 đăng ký lock + hasRunningSession() (R-15)
├── shared/
│   ├── contracts/
│   │   ├── liveQrLookup.ts           # do 003 sở hữu — M02 import
│   │   ├── sessionSyncRecord.ts      # đồng sở hữu M02/M03 (R-04)
│   │   ├── selectedRouteContext.ts, offlinePackage.ts, languagePreference.ts   # do 001 sở hữu
│   │   └── __fixtures__/
│   ├── db/visitorDb.ts               # do 001 khai báo; gồm 3 store M02 (Physical §11)
│   ├── config/                       # VITE_QR_PUBLIC_BASE_URL, MEDIA_BUCKET
│   ├── supabase/                     # client dùng chung
│   ├── testing/                      # e2eHooks.ts: cầu nối test E2E, chỉ ở MODE e2e/fake (tasks M03 T007)
│   └── ui/                           # token, component nền, icon từ assets/icons/
└── modules/
    ├── m01/index.ts                  # bề mặt đọc M01 mà M02 dùng (không sửa ở package này)
    └── m02/
        ├── routes.tsx                # 4 route lazy
        ├── config/limits.ts          # LOOKUP_TIMEOUT_SECONDS = 8 (provisional); hằng kỹ thuật
        ├── i18n/                     # vi.ts, en.ts (spec-M02 §5.1 + bảng copy)
        ├── m01Port.ts                # cổng đọc duy nhất vào src/modules/m01/index.ts (tasks T016)
        ├── layout/                   # FieldLayout (LanguageControl của M01)
        ├── testing/                  # fakeM01Port, hook E2E namespace m02
        ├── pwa/                      # registerBusy: hasRunningSession qua registerBusyCheck
        ├── api/                      # lookup (RPC + timeout), intake (Edge), signed URL; adapter giả
        ├── storage/                  # kiểu dòng, writer/reader 3 store, transaction
        ├── session/                  # vào phiên, tạo/thay, khôi phục, tự đóng, kết thúc (R-06, R-09)
        ├── scan/                     # phân tích link, processScan, viewScannedPoint (R-07, R-08)
        ├── scanner/                  # lớp camera @zxing (chunk m02-scanner)
        ├── journey/                  # RouteJourneyMap, SCR-M02-001
        ├── content/                  # SCR-M02-002, ảnh, media lọc theo ngôn ngữ
        ├── end/                      # SCR-M02-003, câu hỏi cuối chuyến
        ├── qr-link/                  # SCR-M02-004
        └── sync/                     # hàng đợi, gửi, ánh xạ response, lock (R-11)

e2e/m02/                              # Playwright (+ e2e/fixtures/*.y4m); phạm vi theo Complexity #2
```

**Structure Decision**: Một web app (modular monolith), cùng cấu trúc với plan M01 và M03. M02 nằm trọn trong `src/modules/m02/`; chỉ import `src/shared/*`, `src/app/*` và `src/modules/m01/index.ts`. M02 không có file nào dưới `supabase/`.

## Component Responsibilities

| Thành phần | Trách nhiệm | FN / FR | Contract |
|---|---|---|---|
| `session/` | Đọc/kiểm handoff; tạo, thay, khôi phục phiên; tự đóng 24 giờ; Finish | FN-M02-001, 002, 006; FR-M02-001…005, 015…017, 023, 024 | m01-shared-data-consumer; field-ui-flow |
| `scan/` | Phân tích link; `processScan`; ghi lượt ghé; xem lại | FN-M02-004; FR-M02-006…009, 012, 013, 021, 022, 026 | scan-resolution; live-qr-lookup-consumer |
| `scanner/` | Camera, decode, lỗi quyền | FN-M02-004; FR-M02-026 | field-ui-flow |
| `journey/` | Journey map, đánh số liên tục, "Đã quét QR", số đã quét/tổng, Finish | FN-M02-003; FR-M02-008, 015 | field-ui-flow |
| `content/` | Nội dung live/gói, cảnh báo gói cũ, media theo ngôn ngữ, trạng thái lỗi | FN-M02-005; FR-M02-010, 011, 014 | live-qr-lookup-consumer; m01-shared-data-consumer |
| `end/` | Câu hỏi cuối chuyến, xác nhận, tóm tắt, trạng thái đồng bộ | FN-M02-006, 007; FR-M02-016, 018, 023 | session-sync-record |
| `qr-link/` | Trang `/q/…`: tự đóng, phiên cùng trình duyệt hoặc khách tự do | FN-M02-004, 008; FR-M02-019, 025 | scan-resolution; field-ui-flow |
| `sync/` | Hàng đợi, gửi, ánh xạ, lock, lịch thử lại | FN-M02-007; FR-M02-018 | session-sync-record |
| `storage/` | Writer/reader 3 store; schema dòng | FN-M02-002 | data-model |
| `api/` | Adapter lookup/intake/media có timeout | — | live-qr-lookup-consumer; session-sync-record |

## Data Flow and Persistence Boundaries

- **Vào phiên:** tự đóng → đọc context qua M01 → một transaction tạo/thay phiên (đọc lại context, kiểm chưa dùng, phiên cũ `BO_DO` + hàng đợi, phiên mới).
- **Quét:** phân tích link → lookup (8 s, provisional) → bảng quyết định → transaction ghi lượt ghé (nếu được chấp nhận) → hiển thị nội dung live hoặc gói (đọc qua M01).
- **Kết thúc:** một transaction: trạng thái terminal + `endedAt` + `PendingSyncItem` với `SessionSyncRecord` bất biến.
- **Đồng bộ:** tab giữ lock `cpq:m02:sync` gửi từng mục `PENDING` tới Edge `session-intake`; chỉ `syncStatus` đổi.
- **Trang `/q/…`:** tự đóng → có phiên: `processScan('link')`; không: khách tự do, không ghi gì.
- **Không có** ghi vào store M01, không lưu kết quả lookup, không gửi gì khác lên backend.

## Integration Contracts

| Hướng (AGENTS.md §3.2) | Contract | File |
|---|---|---|
| M01 → M02 | `LanguagePreference`, `SelectedRouteContext v3`, ready `OfflinePackage` | [m01-shared-data-consumer-contract.md](contracts/m01-shared-data-consumer-contract.md) (phía producer: contracts của [specs/001](../001-m01-route-planning-preparation/contracts/)) |
| M03 → M02 | `LiveQrLookupResult` với `LiveStationContent` (+ link QR công khai) | [live-qr-lookup-consumer-contract.md](contracts/live-qr-lookup-consumer-contract.md) (phía producer: [live-qr-lookup-contract.md](../003-m03-operations-content-administration/contracts/live-qr-lookup-contract.md)) |
| M02 → M03 | `SessionSyncRecord` → `SessionRecord` | [session-sync-record-contract.md](contracts/session-sync-record-contract.md) (phía consumer: [session-intake-contract.md](../003-m03-operations-content-administration/contracts/session-intake-contract.md)) |
| Nội bộ M02 | xử lý quét; màn hình | [scan-resolution-contract.md](contracts/scan-resolution-contract.md), [field-ui-flow-contract.md](contracts/field-ui-flow-contract.md) |

Đối chiếu: tên, version, ranh giới khớp với plan M01 và M03; hai điểm đã chốt vào plan M01 (D-01, D-02) và ba điểm lưu ý phía M03 (L-01…L-03) ở [research.md](research.md) §5.

## Implementation Sequence (định hướng cho `/speckit-tasks`)

| Bước | Nội dung | Phụ thuộc |
|---|---|---|
| 1 | Tooling, shell, `visitorDb`, config, supabase client (nếu chưa có từ 001/003) | 001 bước 1–3; Complexity #2 |
| 2 | `sessionSyncRecord.ts` (nếu 003 chưa tạo) + contract test; import/thử `liveQrLookup.ts` | 1 |
| 3 | `m02/config/limits.ts` (provisional), `m02/i18n`, `m02/storage` + test transaction | 1; Complexity #4 |
| 4 | `m02/api` (lookup, intake, media; adapter thật + giả) | 2 |
| 5 | `session/` vào phiên, tạo/thay, khôi phục, tự đóng (Story 1, phần Story 5) | 3; `readSelectedRouteContext()` của M01 |
| 6 | `scan/` + `journey/` + `scanner/` (Story 2, 4) | 4, 5 |
| 7 | `content/` (Story 3) | 6; bề mặt đọc gói của M01 |
| 8 | `end/` Finish, câu hỏi cuối chuyến (Story 5) | 6 |
| 9 | `qr-link/` (Story 6) | 6, 7 |
| 10 | `sync/` (Story 7, P2) | 8 |
| 11 | Đăng ký với update coordinator (`registerBusyCheck`); E2E V1–V29 | 5–10 |
| 12 | Tích hợp stack Supabase local (V5, V14, V20, V24, V25) | **M03 giai đoạn B** |

## Risks

| Rủi ro | Tác động | Giảm thiểu |
|---|---|---|
| M03 giai đoạn B chưa mở | Không có lookup/intake thật | Complexity #1; adapter giả, network mock |
| Đồng hồ thiết bị sai | Hạn handoff/tự đóng lệch; bản ghi bị từ chối | Giả định của spec §9; kẹp thời điểm (R-10) |
| Camera/quyền khác nhau giữa trình duyệt | Không quét được trong app | Thông báo camera + quét bằng camera hệ thống (BR-M02-023); kiểm thiết bị thật |
| App cài trên màn hình chính iPhone | Camera không mở link vào app | Không khuyến khích cài (spec §9); giới hạn đã chấp nhận |
| Timeout 8 s chưa kiểm chứng | Nhầm mạng chậm thành lỗi nguồn | Provisional; chủ dự án kiểm chứng (spec §9) |
| Mục hàng đợi bị kẹt `PENDING` do lỗi cấu hình phía server | Báo cáo thiếu | Không chuyển `CONFLICT` cho lỗi không rõ (R-11); bản ghi được gửi lại khi sửa xong |

## Validation Strategy

- **Tự động:** typecheck, lint, unit, contract (`SessionSyncRecord` strict; consumer `LiveQrLookupResult`), component, test transaction Dexie (tạo/thay phiên + rollback, ghi lượt ghé, terminal + hàng đợi, tự đóng), E2E Playwright có offline, hai tab, camera giả, đồng hồ giả.
- **Ánh xạ BR → test:** mỗi BR-M02-001…026 có ít nhất một test; nguồn là bảng "Truy vết test" của từng contract và quickstart V1–V29.
- **Thủ công:** camera, quyền, camera hệ thống mở link, offline trên Android/iOS thật.
- Không test trên Shared Backend; phần không chạy được ghi `NOT RUN`.

## Downstream References

- `/speckit-tasks` đọc: plan.md, research.md, data-model.md, contracts/*.md, quickstart.md.
- Package 001 đã chốt (2026-10-29): D-01 (kiểu trả `readSelectedRouteContext`), D-02 (`registerBusyCheck` của update coordinator), `PATHS.m02SessionEntry = '/trip'`.
- Package 003 cần ghi khi làm giai đoạn B: L-01 (đồng sở hữu `sessionSyncRecord.ts`), L-02 (ánh xạ các mã HTTP khác).

## Complexity Tracking

> Không có vi phạm nguyên tắc constitution. Các mục dưới đây là ràng buộc phạm vi hoặc tiến trình, cần người duyệt plan quyết.

| # | Mục | Vì sao cần | Phương án đơn giản hơn bị loại vì |
|---|---|---|---|
| 1 | Lookup, intake và policy Storage thuộc **M03 giai đoạn B, đang bị chặn** | FR-M02-011, 018 cần nguồn thật | M02 tự giả lập server lâu dài thì không đáp ứng FR. **Tạm thời:** adapter giả + network mock; bước 12 chờ change brief backend của M03 |
| 2 | File tooling gốc và `e2e/` (kèm fixture `.y4m`) | Không có chúng thì không build/test được | Cùng quyết định với Complexity #2 của plan M01/M03 |
| 3 | Chưa có CI | Constitution yêu cầu test BR chạy trong CI | Cùng quyết định với Complexity #3 của plan M01/M03 |
| 4 | `fake-indexeddb` chưa có trong tech-stack | Test transaction Dexie trong Vitest | Cùng đề xuất với Complexity #4 của plan M01; không duyệt thì chuyển sang Playwright |

**Quyết định (2026-10-30, người dùng ủy quyền cho agent quyết; tasks.md T001):**

- **#1:** giữ nguyên — tích hợp thật chờ M03 giai đoạn B (change brief backend).
- **#2:** duyệt — như plan M03: file tooling gốc, `.env.e2e` (giá trị giả an toàn), `e2e/` và fixture `.y4m` thuộc "cấu hình Vite".
- **#3:** duyệt nối CI (người dùng, 2026-10-30; thay quyết định hoãn trước đó): .github/workflows/ci.yml chạy `npm run ci` và E2E project mock trên mỗi push/PR (tasks M03 T002); job Supabase local thêm khi giai đoạn B mở (tasks M03 T198).
- **#4:** duyệt `fake-indexeddb` **chỉ làm dev dependency** cho Vitest; không vào bundle. Cùng quyết định áp cho plan M01 Complexity #4 khi package 001 ghi nhận.
