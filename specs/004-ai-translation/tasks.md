---

description: "Danh sách task triển khai AI Integration — dịch theo yêu cầu cho editor M03"
---

# Tasks: AI Integration — Dịch theo yêu cầu cho editor M03

**Input**: Tài liệu thiết kế trong `specs/004-ai-translation/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/translate-contract.md](contracts/translate-contract.md), [quickstart.md](quickstart.md)

**Tests**: **Có.** Constitution "Testing & Validation" yêu cầu mỗi BR có test và test bảo mật cho người gọi không được phép; plan "Validation Strategy" liệt kê unit, Deno, E2E. Test viết trước và phải FAIL trước khi cài đặt.

**Organization**: Task nhóm theo user story của [spec.md](spec.md) để mỗi story cài đặt và kiểm chứng độc lập.

> **Quy tắc dẫn xuất.** File này không tạo requirement. Hành vi lấy từ [spec-AI_integration v1.0](../../docs/spec/spec-AI_integration.md); quyết định kỹ thuật lấy từ plan/research. Giữ tên contract `TranslationRequest` / `TranslationResult` và mọi ID. Phạm vi file theo change brief [CHG-AI-2026-11-03-01](change-brief-CHG-AI-2026-11-03-01.md) §4; **không** deploy, `supabase link`, `db push` hay đặt secret cloud (§7). Không ghi khóa Gemini vào bất kỳ file nào được commit.
>
> **Giao diện.** Task dựng giao diện dùng skill `frontend-design`; màu, font, khoảng cách, bo góc chỉ lấy từ token ([design-system.md](../../docs/design/design-system.md) §5.3 "Nút dịch", "Trạng thái dịch"); nút dùng ký tự chữ "→", không file icon (OD-AI-18). Mọi chữ hiển thị đi qua danh mục thông báo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Chạy song song được (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story của task (US1…US3, theo spec.md)

## Path Conventions

- Frontend: `src/` (test Vitest đặt cạnh mã nguồn). E2E: `e2e/m03/`. Backend: `supabase/functions/translate/`, `supabase/config.toml`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Hằng số, kiểu và chữ hiển thị dùng chung.

- [X] T001 [P] Tạo danh mục thông báo riêng của capability (spec-AI §5.5) trong `src/modules/m03/translation/translationMessages.ts`: `MSG-AI-TRANSLATING` = "Đang dịch…", `MSG-AI-FAILED` = "Chưa dịch được. Hãy bấm \"Thử lại\" hoặc tự nhập tiếng Anh.", kèm nhãn nút "Thử lại" và tên truy cập "Dịch sang tiếng Anh"; **không** thêm vào `src/modules/m03/messages/catalogText.ts` vì danh mục đó phải trùng từng chữ với spec-M03 §5.6 và `app.message_template` trong migration (`src/modules/m03/api/sqlCatalog.test.ts`) — thêm vào đó sẽ cần migration, ngoài phạm vi brief (quyết định khi cài đặt 2026-11-03); test `translationMessages.test.ts` kiểm chữ và từ cấm
- [X] T002 [P] Tạo `src/modules/m03/translation/translationContract.ts`: kiểu `TranslationRequest` (`sourceLanguage: 'vi'`, `targetLanguage: 'en'`, `text`, `lineBreaks: 'ALLOWED' | 'NOT_ALLOWED'`), `TranslationOutcome` (`{ ok: true; text } | { ok: false }`), interface `Translator { translate(request): Promise<TranslationOutcome> }` (không bao giờ throw), hằng `AI_TRANSLATE_TIMEOUT_MS = 15000` (provisional, R-06) và `TRANSLATE_FUNCTION = 'translate'` (contracts/translate-contract.md §1, §7)
- [X] T003 [P] Thêm prop tùy chọn `extraDescribedBy?: string` vào `FieldShell` (nối vào `aria-describedby`, mặc định không đổi gì) trong `src/shared/ui/Field.tsx`, chuyển tiếp qua `src/shared/ui/TextField.tsx` và `src/shared/ui/TextArea.tsx`; thêm một test trong test hiện có của Field (hoặc `src/shared/ui/Field.test.tsx`) cho id được nối (R-10)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Bộ dịch giả và cách cấp `Translator` cho mọi editor — phải xong trước mọi story.

**⚠️ CRITICAL**: Không story nào bắt đầu trước khi phase này xong.

- [X] T004 Tạo `src/modules/m03/translation/fakeTranslator.ts`: `createFakeTranslator()` trả `"{trim(text)} (en)"` sau ~300 ms, thay chuỗi xuống dòng bằng một khoảng trắng khi `NOT_ALLOWED`; chế độ `ok | fail | slow` (slow = 3000 ms) đặt bằng `setMode()`; `fail` trả `{ ok: false }` (R-11)
- [X] T005 Thêm `translator: Translator` vào type `AdminServices` và hook `useTranslator()` trong `src/modules/m03/api/AdminApiProvider.tsx`; MODE `fake` lấy translator từ `createFakeServices`, nhánh Supabase tạm dùng `createFakeTranslator()` cho tới T029 (ghi chú TODO trỏ T029) (R-07)
- [X] T006 Sửa `createFakeServices` trong `src/modules/m03/api/fake/fakeAdminApi.ts` trả thêm `translator` (một bản cho mỗi store) và đăng ký hook E2E `setTranslationMode(mode)` trong `registerFakeTestHooks` (chỉ MODE `fake`/`e2e`, theo cách các hook hiện có) (R-11)
- [X] T007 Cập nhật builder services cho test trong `src/modules/m03/testing/renderAdmin.tsx` và các test tự dựng `AdminServicesProvider services={...}` (`src/modules/m03/auth/useSignOut.test.tsx`, `src/modules/m03/operations/ReopenDialog.test.tsx`, `src/modules/m03/visit-points/preview/VisitorPreview.test.tsx`, `src/modules/m03/auth/InvitationPage.test.tsx`) để có `translator`; `npm run typecheck` và `npm test` xanh

**Checkpoint**: `npm run ci` xanh; chưa có thay đổi nào nhìn thấy trên giao diện.

---

## Phase 3: User Story 1 - Dịch một trường khi bấm — US-AI-01 (Priority: P1) 🎯 MVP

**Goal**: Mỗi trường trong spec-AI §5.1 có nút "→"; bấm thì ô tiếng Anh nhận bản dịch, không lưu.

**Independent Test**: Trên `dev:fake`, điền tiếng Việt, bấm "→" ở từng trường của ba editor, thấy "Đang dịch…" rồi "… (en)"; rời trang chưa lưu thì có hộp thay đổi chưa lưu (quickstart Q1–Q4, Q10–Q14).

### Tests for User Story 1 ⚠️

> **Viết trước, đảm bảo FAIL trước khi cài đặt.**

- [X] T008 [P] [US1] Test hook trong `src/modules/m03/translation/useFieldTranslation.test.tsx`: bấm → `translating` rồi gọi `setEnglish(kết quả)` (BR-AI-01/02); thay chữ tiếng Anh đã có, không hỏi (BR-AI-02); không bấm được khi nguồn trống/khoảng trắng hoặc đang dịch (BR-AI-01); gửi `trim(text)` và `lineBreaks` đúng; kết quả `NOT_ALLOWED` không có xuống dòng (BR-AI-11); unmount trước khi xong không ghi
- [X] T009 [P] [US1] Test component trong `src/modules/m03/editor/BilingualField.test.tsx`: có nút tên "Dịch sang tiếng Anh" chữ "→"; `readOnly` thì không có nút (BR-AI-07); `multiline` → `ALLOWED`, ngược lại `NOT_ALLOWED`; "Đang dịch…" có `role="status"` và gắn với ô tiếng Anh qua `aria-describedby`; nhãn, `fieldKey`, `lang` của hai ô giữ nguyên như trước
- [X] T010 [P] [US1] E2E `e2e/m03/translate.spec.ts` (dev:fake): Q1 (tên tuyến), Q2 (đủ 14 trường: 6 trường dài + tên, mô tả ngắn, 2 điểm nổi bật, 2 chú thích ảnh, chú thích sơ đồ ở tuyến; tên điểm dừng; tên đối tượng và giới thiệu), Q3, Q4, Q10 (hộp thay đổi chưa lưu), Q11 (98 ký tự → 103, bộ đếm đỏ, lưu → MSG-LIMIT-TEXT), Q12, Q13 (mục chỉ đọc không có nút), Q14 (Tab + Enter)

### Implementation for User Story 1

- [X] T011 [US1] Cài `useFieldTranslation({ source, setEnglish, lineBreaks, enabled })` trong `src/modules/m03/translation/useFieldTranslation.ts`: state `idle | translating | failed`; ref `sentSource`; lấy `Translator` bằng `useTranslator()`; ghi qua `setEnglish` khi thành công; trả `{ status, canTranslate, translate, retry }` (data-model §3; R-09) — làm T008 xanh
- [X] T012 [US1] Tạo `src/modules/m03/translation/TranslateButton.tsx` + `TranslateButton.module.css` (dùng skill `frontend-design`): nút chữ "→", `aria-label`/`title` "Dịch sang tiếng Anh", vùng chạm 44×44 px, nền `white`, viền `control border`, chữ `accent`, bo `--radius-md`; dòng trạng thái 14 px dưới ô tiếng Anh: "Đang dịch…" `role="status"` màu `secondary` (design-system §5.3)
- [X] T013 [US1] Chuyển `BilingualField` sang `src/modules/m03/editor/BilingualField.tsx` (giữ nguyên props và hành vi; `src/modules/m03/route-admin/steps/shared.tsx` export lại để import hiện có không đổi), thêm `TranslateButton` + `useFieldTranslation` giữa hai ô; `lineBreaks` từ `multiline`; ô một dòng vẫn `stripLineBreaks`; truyền id dòng trạng thái qua `extraDescribedBy` cho ô tiếng Anh; không render nút khi `readOnly` (R-08) — làm T009 xanh
- [X] T014 [US1] Sửa lưới cặp song ngữ trong `src/modules/m03/editor/EditorLayout.module.css`: `1fr auto 1fr` có cột nút; màn hẹp xếp chồng, nút giữa hai ô; chỉ token (dùng skill `frontend-design`)
- [X] T015 [US1] Dùng `BilingualField` cho tên điểm dừng trong `src/modules/m03/checkpoint-library/CheckpointEditorPage.tsx` (nhãn `FIELD_LABELS.CHECKPOINT.checkpointName`, `fieldKey="checkpointName"`, `NAME_MAX_CHARS`, `readOnly={archived}`); test hiện có của trang vẫn xanh
- [X] T016 [US1] Dùng `BilingualField` cho tên đối tượng (một dòng, `NAME_MAX_CHARS`) và giới thiệu (`multiline`, `rows={6}`, `QR_INTRO_MAX_CHARS`) trong `src/modules/m03/visit-points/VisitPointEditorPage.tsx`, `fieldKey` `objectName` / `introductionText`, `readOnly={readOnly}`; test hiện có của trang vẫn xanh
- [X] T017 [US1] Kiểm route editor: mọi trường của spec-AI §5.1 trong `src/modules/m03/route-admin/steps/CardStep.tsx` và `DetailsStep.tsx` (gồm từng mục điểm nổi bật, từng chú thích ảnh, chú thích sơ đồ) đều đi qua `BilingualField`; sửa chỗ nào còn ô vi/en viết tay — chạy T010

**Checkpoint**: US1 chạy được và kiểm độc lập trên `dev:fake`; toàn bộ `e2e/m03/*.spec.ts` hiện có vẫn xanh.

---

## Phase 4: User Story 2 - Admin luôn làm chủ ô tiếng Anh — US-AI-02 (Priority: P1)

**Goal**: Không bao giờ tự dịch hay tự đổi ô tiếng Anh; kết quả trễ bị bỏ.

**Independent Test**: Trên `dev:fake` chế độ `slow`, bấm "→" rồi gõ ô tiếng Anh hoặc sửa ô tiếng Việt trước khi xong → kết quả bị bỏ; sửa ô tiếng Việt, xóa ô tiếng Anh, mở lại form → ô tiếng Anh không tự đổi (quickstart Q5–Q7).

### Tests for User Story 2 ⚠️

- [X] T018 [P] [US2] Bổ sung `src/modules/m03/translation/useFieldTranslation.test.tsx`: không có request khi gõ, rời ô, mount với nguồn có chữ, xóa ô tiếng Anh, đổi nguồn (BR-AI-01, 03, 05); kết quả về sau khi nguồn đổi → bỏ, `idle` (BR-AI-04); kết quả về sau khi gõ ô tiếng Anh → bỏ (BR-AI-04)
- [X] T019 [P] [US2] Bổ sung `e2e/m03/translate.spec.ts`: Q5 (đổi tiếng Việt, xóa tiếng Anh, tải lại form — tiếng Anh không đổi), Q6 và Q7 (chế độ `slow` qua `setTranslationMode`)

### Implementation for User Story 2

- [X] T020 [US2] Thêm ref `typedSinceRequest` và hàm `onEnglishTyped()` vào `src/modules/m03/translation/useFieldTranslation.ts`; khi kết quả về chỉ ghi nếu `trim(source hiện tại) === sentSource` và `typedSinceRequest === false`, ngược lại về `idle` (BR-AI-04; data-model §3) — làm T018 xanh
- [X] T021 [US2] Trong `src/modules/m03/editor/BilingualField.tsx`, gọi `onEnglishTyped()` từ `onChange` của ô tiếng Anh (chỉ khi người dùng gõ, không khi hook tự ghi); bảo đảm không có effect nào gọi dịch khi mount hay khi giá trị đổi — chạy T019

**Checkpoint**: US1 + US2 xanh trên `dev:fake`.

---

## Phase 5: User Story 3 - Lỗi dịch không chặn công việc — US-AI-03 (Priority: P2)

**Goal**: Lỗi hiện MSG-AI-FAILED + "Thử lại"; dịch thật đi qua Edge Function có xác thực, khóa phía server.

**Independent Test**: `dev:fake` chế độ `fail` → MSG-AI-FAILED, "Thử lại", vẫn lưu/xuất bản được (Q8–Q9); `deno test supabase/functions/translate`; trên stack local: L1–L5.

### Tests for User Story 3 ⚠️

- [X] T022 [P] [US3] Bổ sung `src/modules/m03/translation/useFieldTranslation.test.tsx`: lỗi → `failed`, ô tiếng Anh giữ nguyên (BR-AI-09); `retry()` gửi lại đúng request; gõ ô tiếng Anh xóa `failed`; lỗi về sau khi nguồn đổi → `idle`
- [X] T023 [P] [US3] Test `src/modules/m03/translation/supabaseTranslator.test.ts` với client giả: 200 + `translatedText` → `{ ok: true }`; 400/401/403/405/502, lỗi mạng, quá thời gian, body sai → `{ ok: false }`; không bao giờ throw; gọi `functions.invoke('translate', { body, timeout: AI_TRANSLATE_TIMEOUT_MS })` với đúng bốn khóa (contracts §6–§7)
- [X] T024 [P] [US3] Test Deno `supabase/functions/translate/index.test.ts` với dependency giả (mẫu `admin-accounts/index.test.ts`): OPTIONS; 405; thiếu/sai Bearer → 401; `currentAdmin` null → 403 `FORBIDDEN`; xác thực chạy trước kiểm body; body sai (khóa thừa, ngôn ngữ khác, text rỗng sau trim, > 2000 code point, `lineBreaks` sai, > 16 KiB) → 400 `INVALID`; dịch lỗi / rỗng → 502 `FAILED`; thành công → 200 `{ translatedText }` đã hậu xử lý (trim, bỏ ngoặc kép bao ngoài, bỏ xuống dòng khi `NOT_ALLOWED`, không cắt); chỉ `trim(text)` được đưa cho dependency dịch; body lỗi không chứa text nguồn (contracts §2–§6)
- [X] T025 [P] [US3] Bổ sung `e2e/m03/translate.spec.ts`: Q8 (chế độ `fail` → MSG-AI-FAILED + "Thử lại"; chuyển `ok`, "Thử lại" → có bản dịch), Q9 (chế độ `fail`, điền tay, lưu và xuất bản một điểm dừng như spec-M03)

### Implementation for User Story 3

- [X] T026 [US3] Trong `src/modules/m03/translation/useFieldTranslation.ts` và `TranslateButton.tsx`: trạng thái `failed` hiện MSG-AI-FAILED `role="alert"` màu `error` kèm nút chữ "Thử lại" (gọi `retry()`), không tự đóng; xóa khi "Thử lại", gõ ô tiếng Anh hoặc bấm "→" (BR-AI-09) — làm T022 xanh
- [X] T027 [US3] Tạo `supabase/functions/translate/handler.ts` (logic thuần, `Deps = { getUser, currentAdmin, translate }`, dùng `json`/`preflight` của `_shared/cors.ts`) theo contracts §1–§6 — làm T024 xanh
- [X] T028 [US3] Tạo `supabase/functions/translate/index.ts`: `getUser`/`currentAdmin` như `admin-accounts/index.ts` nhưng chỉ dùng client publishable key + JWT người gọi (không `APP_BACKEND_SECRET_KEY`); `translate` gọi `POST …/v1beta/models/{GEMINI_MODEL}:generateContent` bằng `fetch`, header `x-goog-api-key` từ `Deno.env.get('GEMINI_API_KEY')`, `AbortSignal.timeout(12000)`, `systemInstruction` theo R-03, `temperature: 0.2`, `responseMimeType: 'text/plain'`; thiếu khóa → lỗi; chỉ log mã kết quả và HTTP status. Trước khi chốt hằng `GEMINI_MODEL`, kiểm tài liệu Gemini API rằng model còn khả dụng (R-03) — kết quả: `gemini-2.5-flash` deprecated nên dùng `gemini-3.5-flash-lite`
- [X] T029 [US3] Tạo `src/modules/m03/translation/supabaseTranslator.ts` (`createSupabaseTranslator(client)`) và nối vào nhánh Supabase của `src/modules/m03/api/AdminApiProvider.tsx` thay cho bản giả tạm của T005 — làm T023 xanh
- [X] T030 [US3] Thêm `[functions.translate]` `verify_jwt = false` (kèm comment lý do như hai function hiện có) vào `supabase/config.toml`; xác nhận `supabase/functions/.env` bị `.gitignore` bỏ qua (`git check-ignore supabase/functions/.env`)

**Checkpoint**: Ba story xanh trên `dev:fake`; `deno test supabase/functions/translate` xanh (hoặc `NOT RUN` nếu máy chưa có Deno — ghi lý do).

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T031 Chạy `npm run ci` và toàn bộ `npx playwright test` (mock projects); sửa hồi quy ở các E2E M03 hiện có do DOM của `BilingualField` đổi (selector theo nhãn, không theo cấu trúc)
- [X] T032 Quét bundle: `npm run build` rồi tìm `GEMINI`, `generativelanguage`, `x-goog-api-key` trong `dist/` — phải rỗng (SC-AI-004, quickstart L4)
- [X] T033 Kiểm trên stack local theo quickstart §3 (L1–L3, L5) với khóa thật trong `supabase/functions/.env`; nếu máy chưa có Docker/Supabase CLI ghi `NOT RUN` kèm lý do — chạy 2026-11-04 trên máy có Docker/Supabase CLI/Deno: `deno test` 12/12, L1 (API và giao diện), L2, L3, L5 PASS; xem validation-report §3
- [X] T034 Tạo `specs/004-ai-translation/validation-report.md`: kết quả từng lệnh/kịch bản quickstart (PASS / FAIL / NOT RUN + lý do), độ phủ BR-AI-01…12 → test, SC-AI-001…006 → kịch bản

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: không phụ thuộc; T001–T003 song song.
- **Foundational (Phase 2)**: sau Phase 1; T004 → T005 → T006 → T007.
- **US1 (Phase 3)**: sau Phase 2. MVP.
- **US2 (Phase 4)**: sau US1 (sửa cùng hook và `BilingualField`).
- **US3 (Phase 5)**: phần UI (T022, T025, T026) sau US1; phần backend (T023, T024, T027–T030) chỉ cần Phase 1–2, làm song song với US1/US2 được.
- **Polish (Phase 6)**: sau mọi story.

### User Story Dependencies

- **US1 (P1)**: nền tảng của nút và hook.
- **US2 (P1)**: mở rộng hook của US1; kiểm độc lập bằng chế độ `slow`.
- **US3 (P2)**: UI lỗi mở rộng hook của US1; Edge Function và `supabaseTranslator` độc lập.

### Within Each User Story

- Test viết trước và FAIL → hook → component → tích hợp editor → E2E xanh.

## Parallel Example

```text
# Phase 1:
T001 catalogText.ts   |  T002 translationContract.ts   |  T003 Field/TextField/TextArea

# US1 tests:
T008 useFieldTranslation.test.tsx  |  T009 BilingualField.test.tsx  |  T010 e2e/m03/translate.spec.ts

# Backend US3 song song với US1/US2 (người khác hoặc sau Phase 2):
T024 translate/index.test.ts → T027 handler.ts → T028 index.ts → T030 config.toml
T023 supabaseTranslator.test.ts → T029 supabaseTranslator.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2.
2. Phase 3 (US1) trên `dev:fake`.
3. **Dừng và kiểm** quickstart Q1–Q4, Q10–Q14.

### Incremental Delivery

1. US1 → nút dịch hoạt động với bản giả.
2. US2 → không ghi đè chữ admin; kết quả trễ bị bỏ.
3. US3 → báo lỗi + "Thử lại"; Edge Function thật; kiểm với khóa Gemini trên stack local.
4. Polish → CI, quét bundle, validation report.

Cả capability là **Could** (MVP-Scope §3.5): không chặn bất kỳ increment Must nào của M01–M03.

## Notes

- [P] = khác file, không phụ thuộc task chưa xong.
- Commit sau mỗi task hoặc nhóm logic; branch riêng từ `main`, PR vào `main`.
- Không đổi luật M03, schema, `AdminApi` hay contract M01/M02; phát hiện lệch thì dừng và ghi `[NEEDS CLARIFICATION: …]`.
