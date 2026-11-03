# Implementation Plan: AI Integration — Dịch theo yêu cầu cho editor M03

**Branch**: `004-ai-translation` *(định danh thư mục; tài liệu đang ở git branch `docs/ai-translation`)* | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification [specs/004-ai-translation/spec.md](spec.md), bản dẫn xuất từ [spec-AI_integration v1.0](../../docs/spec/spec-AI_integration.md) (Change Brief [CHG-AI-2026-11-03-01](change-brief-CHG-AI-2026-11-03-01.md), APPROVED 2026-11-03).

**Note**: Plan này là bản dẫn xuất (Layer 3). Nó không tạo requirement, không đổi tên contract hay ID. Hành vi lấy từ spec-AI_integration; quyết định kỹ thuật lấy từ [tech-stack.md](../../docs/architecture/tech-stack.md) §5, [environment.md](../../docs/architecture/environment.md) §4, §6 và [system-configuration.md](../../docs/architecture/system-configuration.md); phần nguồn để trống được quyết ở [research.md](research.md).

## Summary

Thêm nút "→" vào mỗi trường song ngữ của ba editor M03 (tuyến, điểm dừng, điểm tham quan; 14 trường). Bấm thì text tiếng Việt của đúng trường đó được gửi tới một Edge Function mới `translate`; function xác minh admin `ACTIVE`, gọi Gemini bằng khóa phía server và trả bản dịch; editor ghi vào ô tiếng Anh qua `onChange` hiện có, không lưu. Lỗi giữ nguyên ô và hiện "Thử lại". `dev:fake` dùng bộ dịch giả.

Cách làm kỹ thuật:

- **Backend:** `supabase/functions/translate/` (`handler.ts` thuần + `index.ts` nối dependency), xác thực như `admin-accounts`, gọi Gemini REST `generateContent` không SDK (R-01…R-06).
- **Frontend:** `src/modules/m03/translation/` (interface `Translator`, bản Supabase, bản giả, hook `useFieldTranslation`, `TranslateButton`); cấp qua `AdminServices`; cài một lần trong `BilingualField` (chuyển về `src/modules/m03/editor/`) rồi dùng `BilingualField` cho cả checkpoint và visit-point editor (R-07…R-11).
- **Không** đổi schema, migration, RPC, `AdminApi`, contract M01/M02 hay luật M03.

## Technical Context

**Language/Version**: TypeScript (strict) trên Node.js 24 LTS cho frontend; TypeScript trên Deno (Supabase Edge runtime) cho function — giống hiện có.

**Primary Dependencies**: Có sẵn: `react`, `@supabase/supabase-js` 2.118.0 (`functions.invoke` có `timeout`), Vitest, Testing Library, Playwright; Edge: `npm:@supabase/supabase-js@2.118.0` như `admin-accounts`. **Không thêm dependency mới**; Gemini gọi bằng `fetch` (tech-stack §5).

**Storage**: N/A — không lưu gì mới (data-model §1).

**Testing**: Vitest + Testing Library (cạnh mã nguồn); `deno test` cho handler (dependency giả, không mạng); Playwright `e2e/m03/translate.spec.ts` trên `dev:fake`; kiểm tay trên stack local với khóa thật (quickstart §3).

**Target Platform**: Trình duyệt máy tính/máy tính bảng của nhân viên (M03 online-only); Supabase Edge runtime (local trước; cloud cần brief riêng).

**Project Type**: Web application — frontend SPA dùng chung + Supabase backend (cấu trúc repo hiện có).

**Performance Goals**: Một bản dịch ≤ 2000 ký tự trả về trong thời gian chờ `AI_TRANSLATE_TIMEOUT_MS` = 15 s (client) / 12 s (server→Gemini) (R-06); không có chỉ tiêu throughput (không giới hạn số lần dịch, OD-AI-13).

**Constraints**: Khóa chỉ ở secret Edge; không `VITE_` (BR-AI-08); chỉ gửi text nguồn (BR-AI-10); không hộp xác nhận mới (BR-M03-L12); không file icon (OD-AI-18); token design-system; không đổi luật M03; không deploy cloud (brief §7).

**Scale/Scope**: 3 editor, 14 trường; 1 Edge Function; ~6 file frontend mới, ~6 file sửa; 1 spec E2E.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Kiểm tra | Trước Phase 0 | Sau Phase 1 | Bằng chứng |
|---|---|---|---|---|
| I. Spec-First Behavioral Authority | Mọi hành vi trỏ tới spec-AI_integration (BR-AI-*), nguồn sự thật theo constitution 2.1.0; không thêm hành vi; phần kỹ thuật trống quyết ở research | PASS | PASS | research R-04…R-06, R-13; AGENTS.md §3.1 mục 4 |
| II. Module Ownership Boundaries | Không ghi entity nào; contract mới `TranslationRequest`/`TranslationResult` đã có trong AGENTS.md §3.2; không chạm contract M01/M02/M03; code ở `src/modules/m03/translation/` | PASS | PASS | data-model §1–2; R-07; constitution 2.1.0 Principle II |
| III. Minimal Diff & Traceability | Chỉ file trong brief §4; ID ổn định; `BilingualField` export lại ở chỗ cũ; artifact stale được ghi | PASS | PASS | R-08; research "Upstream có nguy cơ stale" |
| IV. Data Integrity & Immutability | Không dữ liệu bền vững mới; bản dịch chỉ đi vào bản nháp khi admin lưu, qua RPC hiện có | PASS | PASS | data-model §1 |
| V. Security & Authorization | Xác thực phía server: JWT + `api.get_current_admin()` (ACTIVE); khóa chỉ trong secret Edge, header không query; không secret trong `VITE_*`; không log text/khóa; body ≤ 16 KiB, text ≤ 2000 | PASS | PASS | contract §3–§4, §6; R-02, R-12 |
| VI. Offline Integrity & PWA Contract | M03 online-only; không cache response function bằng Workbox (đã cấm cho Supabase API); không ảnh hưởng gói offline | PASS | PASS | tech-stack §4 |
| VII. Simplicity & MVP Scope | Capability Could đã có trong MVP-Scope §3.5; không phải "AI scoring" (Won't của M01); một function, không queue/cron; không dependency mới | PASS | PASS | MVP-Scope §3.5, §4; R-01, R-03 |

Gate: **PASS** — constitution 2.1.0 (2026-11-03) đã liệt kê spec-AI_integration và contract dịch (Complexity #1 đã đóng).

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-translation/
├── change-brief-CHG-AI-2026-11-03-01.md   # APPROVED
├── spec.md                                # /speckit-specify
├── checklists/requirements.md             # /speckit-specify
├── plan.md                                # This file
├── research.md                            # Phase 0
├── data-model.md                          # Phase 1
├── quickstart.md                          # Phase 1
├── contracts/translate-contract.md        # Phase 1
└── tasks.md                               # /speckit-tasks
```

### Source Code (repository root)

```text
supabase/
├── config.toml                            # SỬA: [functions.translate] verify_jwt = false
└── functions/
    └── translate/                         # MỚI
        ├── handler.ts                     # logic thuần: auth, kiểm request, gọi dịch, hậu xử lý, mã HTTP
        ├── index.ts                       # nối getUser / currentAdmin / gọi Gemini thật
        └── index.test.ts                  # deno test, dependency giả

src/
├── shared/ui/
│   ├── Field.tsx                          # SỬA: prop tùy chọn extraDescribedBy
│   ├── TextField.tsx, TextArea.tsx        # SỬA: chuyển tiếp extraDescribedBy
└── modules/m03/
    ├── api/AdminApiProvider.tsx           # SỬA: AdminServices.translator + useTranslator()
    ├── api/fake/fakeAdminApi.ts           # SỬA: createFakeServices thêm translator; hook E2E đặt chế độ dịch
    ├── messages/catalogText.ts            # SỬA: MSG-AI-TRANSLATING, MSG-AI-FAILED
    ├── testing/                           # SỬA: builder services cho test có translator
    ├── translation/                       # MỚI
    │   ├── translationContract.ts         # kiểu, AI_TRANSLATE_TIMEOUT_MS, TRANSLATE_FUNCTION
    │   ├── supabaseTranslator.ts (+ .test.ts)
    │   ├── fakeTranslator.ts
    │   ├── useFieldTranslation.ts (+ .test.tsx)
    │   ├── TranslateButton.tsx + TranslateButton.module.css
    ├── editor/BilingualField.tsx (+ .test.tsx)   # MỚI (chuyển từ route-admin/steps/shared.tsx) + nút "→"
    ├── editor/EditorLayout.module.css     # SỬA: lưới cặp song ngữ có cột nút
    ├── route-admin/steps/shared.tsx       # SỬA: export lại BilingualField
    ├── checkpoint-library/CheckpointEditorPage.tsx   # SỬA: dùng BilingualField cho tên
    └── visit-points/VisitPointEditorPage.tsx         # SỬA: dùng BilingualField cho tên đối tượng, giới thiệu

e2e/m03/translate.spec.ts                  # MỚI
```

**Structure Decision**: Giữ cấu trúc repo hiện có (frontend `src/`, backend `supabase/`, E2E `e2e/`). Code dịch phía client nằm trong module M03 vì chỉ editor M03 dùng (R-07); function nằm cạnh `admin-accounts` và `session-intake`.

## Component Responsibilities

| Thành phần | Trách nhiệm | BR |
|---|---|---|
| `translate/handler.ts` | 405/OPTIONS; xác thực (401/403); kiểm body (400); gọi dịch qua dependency; hậu xử lý; 502 khi lỗi; không lộ text/khóa | 08, 10, 11 |
| `translate/index.ts` | `getUser` (client publishable + JWT), `currentAdmin` (`api.get_current_admin` bằng JWT người gọi), `translate` (fetch Gemini, header khóa, timeout 12 s, hằng số model) | 08, 10 |
| `supabaseTranslator` | `functions.invoke('translate', { body, timeout })`; 200 có `translatedText` → `{ ok: true }`; mọi thứ khác → `{ ok: false }`; không throw | 09 |
| `fakeTranslator` | `"{text} (en)"`, chế độ `ok/fail/slow`, bỏ xuống dòng khi `NOT_ALLOWED` | — (R-11) |
| `useFieldTranslation` | Trạng thái `idle/translating/failed`; ref `sentSource`/`typedSinceRequest`; chỉ ghi khi BR-AI-04 cho phép; ghi qua `setEnglish` (= `onChange` của form) | 01–04, 06, 09 |
| `TranslateButton` | Nút chữ "→" (`aria-label`), dòng trạng thái `role=status`/`alert`, nút "Thử lại" | 01, 07, 09 |
| `BilingualField` | Lưới vi / "→" / en; không render nút khi `readOnly`; `lineBreaks` từ `multiline`; `stripLineBreaks` cho ô một dòng | 01, 07, 11 |

## Data Flow and Persistence Boundaries

1. Admin bấm "→" → `useFieldTranslation` gửi `{ vi, en, trim(text), lineBreaks }` qua `Translator`.
2. `supabaseTranslator` → Edge `translate` (JWT phiên) → Gemini (khóa phía server) → `TranslationResult` hoặc lỗi.
3. Kết quả → kiểm BR-AI-04 → `onChange` của form → ô tiếng Anh; form "chưa lưu".
4. Chỉ khi admin bấm "Lưu bản nháp", giá trị đi qua RPC lưu nháp hiện có (spec-M03 BR-M03-F11). Không có ghi nào khác ở bất kỳ bước nào.

## Integration Contracts

| Contract | File | Ghi chú |
|---|---|---|
| `TranslationRequest` / `TranslationResult` | [contracts/translate-contract.md](contracts/translate-contract.md) | Mới; AGENTS.md §3.2 |
| Lưu nháp (C-01…C-03) | specs/003 contracts/admin-command-contract.md | Không đổi |

## Implementation Sequence (định hướng cho `/speckit-tasks`)

1. **Nền chung**: catalog (2 khóa), `translationContract.ts`, `Translator` + `fakeTranslator`, `AdminServices.translator`, builder test, `extraDescribedBy`.
2. **US1 + US2 (P1) trên `dev:fake`**: `useFieldTranslation` (test trước: ghi, thay, bỏ trễ, không tự dịch), `TranslateButton`, chuyển `BilingualField` + nút, dùng trong checkpoint và visit-point editor, CSS lưới; E2E Q1–Q7, Q10–Q14.
3. **US3 (P2)**: `supabaseTranslator` (+ test ánh xạ lỗi), Edge `translate` handler (deno test trước) + `index.ts` + `config.toml`; E2E Q8–Q9 (bản giả `fail`); kiểm tay L1–L5 khi có stack local.
4. **Polish**: `npm run ci`, quét bundle (L4), cập nhật validation-report của gói.

US1 và US2 cùng ưu tiên P1 và dùng chung hook, nên làm chung một pha; US3 độc lập về mặt kiểm thử nhờ chế độ `fail` của bản giả.

## Risks

| Rủi ro | Giảm thiểu |
|---|---|
| Model Gemini đổi tên/ngừng | Model là một hằng số; task kiểm tài liệu Gemini trước khi chốt (R-03) |
| Bản dịch sai tên riêng / cảnh báo an toàn | Prompt giữ tên riêng; admin đọc và sửa; màn review bắt buộc (spec-AI §9) |
| Chuyển `BilingualField` làm đổi DOM của hai editor | Giữ nhãn, `fieldKey`, `lang`, giới hạn; chạy lại toàn bộ E2E M03 hiện có |
| Máy chưa có Docker/Supabase CLI | Toàn bộ US1–US3 kiểm được trên `dev:fake`; quickstart §3 ghi `NOT RUN` nếu chưa cài |
| Constitution stale | Complexity #1; đề nghị `/speckit-constitution` |

## Validation Strategy

- Unit/component (Vitest): hook (6 nhánh BR-AI-01…04, 09), `BilingualField` (có/không nút, `lineBreaks`), `supabaseTranslator` (200/4xx/5xx/timeout/không throw).
- Deno: handler đủ bảng mã contract §6 và không lộ dữ liệu.
- E2E `dev:fake`: quickstart Q1–Q14; chạy lại toàn bộ `e2e/m03/*.spec.ts`.
- Stack local: quickstart L1–L5 (cần Docker; nếu không có thì `NOT RUN`).

## Downstream References

- Screen spec SCR-M03-002 (#37–38), 003 (#32–33), 008 (#27–28); design-system §5.3 "Nút dịch", "Trạng thái dịch".
- function-list-AI SF-AI-001-01…07, SF-AI-002-01…04.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| #1 **Đã đóng 2026-11-03** — Constitution Principle I chỉ liệt kê spec-M01/M02/M03; Principle II chưa có contract `TranslationRequest`/`TranslationResult` | Người dùng yêu cầu cập nhật; constitution 2.1.0 (2026-11-03) thêm spec-AI_integration vào Principle I và contract vào Principle II (R-13) | — |
