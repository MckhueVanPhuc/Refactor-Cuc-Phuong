# Research: AI Integration — Dịch theo yêu cầu cho editor M03

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Date**: 2026-11-03

Mỗi mục: Decision / Rationale / Alternatives considered. Không mục nào tạo requirement mới; hành vi lấy từ [spec-AI_integration](../../docs/spec/spec-AI_integration.md) v1.0. Quyết định công nghệ đã chốt ở [tech-stack.md](../../docs/architecture/tech-stack.md) §5 và [environment.md](../../docs/architecture/environment.md) §4 được dùng nguyên; research chỉ quyết phần kỹ thuật mà các tài liệu đó để lại cho plan.

## R-01 — Nơi gọi dịch vụ dịch

- **Decision**: Một Supabase Edge Function mới tên `translate` (`supabase/functions/translate/`), tách `handler.ts` (logic thuần, nhận dependency) và `index.ts` (nối dependency thật), giống `admin-accounts`. `verify_jwt = false` trong `supabase/config.toml`; function tự xác minh người gọi.
- **Rationale**: BR-AI-08 bắt buộc gọi phía server, khóa không tới trình duyệt. tech-stack §5 chốt Edge Function cho lời gọi Gemini. Tách handler cho phép test Deno không gọi mạng như `admin-accounts/index.test.ts`.
- **Alternatives**: Gọi Gemini thẳng từ trình duyệt — vi phạm BR-AI-08. RPC PostgreSQL gọi HTTP (`pg_net`) — thêm extension và không có trong tech-stack. Thêm action vào `admin-accounts` — trộn trách nhiệm Auth Admin với dịch, và function đó cần secret khác.

## R-02 — Xác thực người gọi

- **Decision**: Giống `admin-accounts`: đọc `Authorization: Bearer <JWT>`; `getUser(token)` qua Auth; rồi gọi `api.get_current_admin()` **bằng JWT của người gọi**. Chỉ chấp nhận khi kết quả khác null (hàm chỉ trả tài khoản `ACTIVE`; null với chưa có tài khoản, đang chờ, bị khóa hoặc phiên đã đăng xuất). Mọi role (`CONTENT_STAFF`, `REVIEWER`) đều được (BR-M03-A02). Không cần `APP_BACKEND_SECRET_KEY`: `getUser` dùng client publishable key với JWT người gọi.
- **Rationale**: BR-AI-08 = BR-M03-A04: danh tính đã xác thực **và** `AdminAccount` `ACTIVE`. Đọc quyền từ `app.current_admin()` (không từ metadata JWT) là cách M03 đã chốt (constitution V). Không dùng secret quản trị khi không cần — giảm bề mặt.
- **Alternatives**: `verify_jwt = true` — chỉ kiểm chữ ký, không kiểm `AdminAccount`; vẫn phải gọi `get_current_admin`, và publishable key không phải JWT nên cấu hình hiện hành của dự án là `false`. Kiểm role trong JWT claim — trái constitution V.

## R-03 — Gọi Gemini

- **Decision**: HTTPS REST `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, khóa ở header `x-goog-api-key` (không ở query string để không lọt vào log URL). Model là hằng số trong `index.ts`: **`gemini-3.5-flash-lite`** (không thêm biến môi trường mới ngoài environment.md). Bản plan ban đầu ghi `gemini-2.5-flash`; khi cài đặt (2026-11-03) kiểm tài liệu Gemini API: `gemini-2.5-flash` đã deprecated, bị chuyển hướng từ 2026-12-01 và không còn cho tài khoản mới, nên đổi sang Flash-Lite stable được tài liệu khuyên dùng cho tác vụ nhanh. `generateContent` v1beta vẫn là method hiện hành. Không gửi `thinkingConfig` (chưa xác nhận được trên trang tham chiếu). Body: `systemInstruction` cố định + một `contents` chứa text nguồn; `generationConfig: { temperature: 0.2, responseMimeType: "text/plain" }`. Lấy `candidates[0].content.parts[*].text` nối lại.
- **Prompt (systemInstruction)**: dịch tiếng Việt sang tiếng Anh cho nội dung giới thiệu của một vườn quốc gia; giữ nguyên tên riêng (địa danh, tên loài, "Cúc Phương") theo cách viết thông dụng; chỉ trả bản dịch dạng chữ thuần, không markdown, không ngoặc kép bao ngoài, không giải thích; khi `lineBreaks = NOT_ALLOWED` thì trả một dòng. Không có bảng thuật ngữ (OD-AI-10).
- **Rationale**: tech-stack §5: "HTTPS REST từ Edge Function, không SDK". Model Flash đủ cho dịch ngắn, độ trễ thấp, chi phí thấp. Nhiệt độ thấp cho bản dịch ổn định. Đặt model là hằng số tránh thêm cấu hình chưa có trong environment.md.
- **Alternatives**: SDK `@google/genai` — tech-stack loại. Model Pro — chậm và đắt hơn, không cần cho dịch. Biến môi trường `GEMINI_MODEL` — phải sửa environment.md; để dành nếu sau này cần đổi model không cần deploy.

## R-04 — Hậu xử lý và kiểm tra request ở server

- **Decision**: Server kiểm request: `sourceLanguage = "vi"`, `targetLanguage = "en"`, `text` là chuỗi, sau khi trim không rỗng và không quá **2000** ký tự (code point), `lineBreaks ∈ {ALLOWED, NOT_ALLOWED}`; body tối đa 16 KiB; khóa ngoài danh sách bị từ chối. Kết quả: trim; bỏ một cặp ngoặc kép bao ngoài nếu có; khi `NOT_ALLOWED` thay mọi chuỗi xuống dòng bằng một khoảng trắng. Không cắt theo độ dài trường (BR-AI-06). Kết quả rỗng sau hậu xử lý = lỗi.
- **Rationale**: spec-AI §5.2: text "at most the limit of its field" — giới hạn theo trường do client biết (nó đang gửi đúng trường đó); server chặn trần chung bằng giới hạn lớn nhất trong spec-M03 §5.3 (`ROUTE_DESC_MAX_CHARS` = `QR_INTRO_MAX_CHARS` = 2000) để chống lạm dụng. BR-AI-11 yêu cầu chữ thuần và bỏ xuống dòng cho trường một dòng; client cũng `stripLineBreaks` lần nữa (phòng thủ hai lớp).
- **Alternatives**: Gửi kèm tên trường để server biết giới hạn — thêm trường vào contract canonical, không được. Cắt kết quả theo giới hạn — trái OD-AI-09.

## R-05 — Mã HTTP và tín hiệu lỗi

- **Decision**: `200 { translatedText }` khi thành công. Lỗi không có text: `401 {}` (không JWT/JWT sai), `403 { result: "FORBIDDEN" }` (không `ACTIVE`), `400 { result: "INVALID" }` (request sai), `405`, `502 { result: "FAILED" }` (Gemini lỗi, quá thời gian, trả rỗng, thiếu khóa). Client ánh xạ **mọi** phản hồi khác 200, lỗi mạng và quá thời gian thành một tín hiệu lỗi duy nhất → MSG-AI-FAILED.
- **Rationale**: spec-AI §5.2: lỗi là tín hiệu riêng, không phải `TranslationResult`; BR-AI-09 chỉ có một thông báo. Edge case spec: mất phiên cũng xử lý như lỗi, luồng phiên hết hạn của M03 không đổi. Không trả lỗi thô của provider (BR-M03-L10).
- **Alternatives**: Ném `MSG-SESSION-EXPIRED` khi 401 như `adminAccountsEdge` — spec-AI chọn MSG-AI-FAILED cho mọi lỗi dịch; phiên hết hạn vẫn được M03 phát hiện ở lần lưu/tải kế tiếp.

## R-06 — Thời gian chờ (`AI_TRANSLATE_TIMEOUT_MS`)

- **Decision**: Client: `AI_TRANSLATE_TIMEOUT_MS = 15000`, truyền `timeout` cho `supabase.functions.invoke` (functions-js có `timeout`/`signal`). Server: `AbortSignal.timeout(12000)` cho lời gọi Gemini, để server trả 502 trước khi client bỏ cuộc.
- **Rationale**: spec-AI §5.4 để giá trị cho plan. 15 giây đủ cho bản dịch 2000 ký tự với model Flash, đồng thời không để admin chờ vô hạn. Giá trị là cấu hình kỹ thuật provisional, đặt cạnh các hằng số M03.
- **Alternatives**: Không timeout — trái BR-AI-09. Timeout ngắn (5 giây) — dễ lỗi oan với văn bản dài.

## R-07 — Vị trí code frontend và cách cấp dịch vụ

- **Decision**: Thư mục mới `src/modules/m03/translation/`: `Translator.ts` (interface `translate(request) → Promise<TranslationOutcome>`), `supabaseTranslator.ts` (gọi Edge `translate`), `fakeTranslator.ts` (cho `dev:fake` và test), `useFieldTranslation.ts` (hook trạng thái một trường), `TranslateButton.tsx` + CSS module, `translationContract.ts` (kiểu và hằng số). Thêm `translator: Translator` vào `AdminServices` trong `AdminServicesProvider.tsx` và `useTranslator()`; MODE `fake` dùng `fakeTranslator`, còn lại dùng `supabaseTranslator` trên cùng Supabase client.
- **Rationale**: Năng lực chỉ được editor M03 dùng; đặt trong `m03` giữ ranh giới module (constitution II) và dùng lại client, auth, catalog thông báo của M03. Không nhét vào `AdminApi` vì `AdminApi` là contract admin-command/RPC của M03; contract dịch là contract riêng (`TranslationRequest`/`TranslationResult`). Cấp qua `AdminServices` để `dev:fake` và test chọn bản giả giống cách hiện có.
- **Alternatives**: Module `src/modules/ai/` riêng — phải tự dựng client/auth/catalog, trùng lặp. Thêm method vào `AdminApi` — lẫn contract, ảnh hưởng bộ contract test dùng chung.

## R-08 — Một thành phần song ngữ dùng chung cho ba editor

- **Decision**: Chuyển `BilingualField` từ `route-admin/steps/shared.tsx` sang `src/modules/m03/editor/BilingualField.tsx` (export lại ở chỗ cũ để import hiện có không đổi), thêm vào đó nút "→" và dòng trạng thái. Props thêm: không cần — `multiline` quyết `lineBreaks`, `readOnly` quyết có nút hay không. `CheckpointEditorPage` (tên điểm dừng) và `VisitPointEditorPage` (tên đối tượng, giới thiệu) thay cặp ô viết tay bằng `BilingualField` với cùng nhãn, `fieldKey`, giới hạn và `stripLineBreaks`.
- **Rationale**: 14 trường, ba editor: một chỗ cài nút thay vì ba. Nhãn `"{nhãn} (tiếng Việt)" / "(tiếng Anh)"` và `fieldKey` `x.vi`/`x.en` của `BilingualField` trùng với hai editor kia, nên panel "Còn thiếu để xuất bản" và lỗi tại ô vẫn trỏ đúng.
- **Alternatives**: Cài nút riêng ở mỗi editor — lặp logic trễ/bỏ kết quả ba lần.

## R-09 — Trạng thái một trường và quy tắc bỏ kết quả trễ

- **Decision**: `useFieldTranslation({ source, english, setEnglish, lineBreaks })` giữ state `idle | translating | failed`. Khi bấm: ghi `sentSource` và `typedSinceRequest = false` vào ref, đặt `translating`. Mỗi lần admin gõ vào ô tiếng Anh: `typedSinceRequest = true` và xóa trạng thái `failed`. Khi kết quả về: chỉ ghi nếu component còn mount, `source` hiện tại (ref) bằng `sentSource` và `typedSinceRequest = false` (BR-AI-04); lỗi → `failed` nếu cùng điều kiện, ngược lại về `idle`. Nút bị vô hiệu khi `source.trim()` rỗng hoặc đang `translating` (BR-AI-01). Ghi kết quả qua `onChange` hiện có của form → form đánh dấu "chưa lưu" như khi gõ, và hộp thay đổi chưa lưu (BR-M03-F11) hoạt động không cần sửa.
- **Rationale**: Ánh xạ trực tiếp BR-AI-01…06, 09. Đi qua `onChange` hiện có giữ mọi kiểm tra M03 (độ dài, bộ đếm, MSG-LIMIT-TEXT) đúng như khi tự gõ.
- **Alternatives**: Hủy request khi nguồn đổi (AbortController) — vẫn cần kiểm khi kết quả về; giữ đơn giản bằng so sánh.

## R-10 — Hình thức và truy cập

- **Decision**: Theo design-system §5.3 "Nút dịch" và "Trạng thái dịch": cặp ô thành lưới `1fr auto 1fr` (màn hẹp: xếp chồng, nút giữa hai ô); nút chữ "→", `aria-label="Dịch sang tiếng Anh"`, vùng chạm 44×44 px, chỉ dùng token. Dòng "Đang dịch…" là `role="status"`; lỗi là `role="alert"` kèm nút chữ "Thử lại". Hai thông báo MSG-AI-TRANSLATING, MSG-AI-FAILED (spec-AI §5.5) nằm trong danh mục riêng `src/modules/m03/translation/translationMessages.ts`, không trong `catalogText.ts`: danh mục M03 phải trùng từng chữ với spec-M03 §5.6 và bản SQL `app.message_template` (`sqlCatalog.test.ts`), nên thêm vào đó sẽ cần migration (quyết định khi cài đặt, 2026-11-03). Dòng trạng thái gắn với ô tiếng Anh: thêm prop tùy chọn `extraDescribedBy` vào `FieldShell`/`TextField`/`TextArea` (minimal diff, mặc định không đổi gì).
- **Rationale**: CLAUDE.md: token từ design-system, không file icon (OD-AI-18 dùng ký tự chữ). Test cấm từ (`e2e/m03/forbidden-words.spec.ts`) và catalog khép kín yêu cầu mọi chữ hiển thị nằm trong catalog.
- **Alternatives**: Tooltip giải thích nút — BR-M03-L12 cấm hint ngoài danh sách §5.5.

## R-11 — Bản giả cho `dev:fake` và test

- **Decision**: `fakeTranslator` trả `"{text} (en)"` sau ~300 ms (giống quy ước `pair()` trong `e2eSeed.ts`), bỏ xuống dòng khi `NOT_ALLOWED`. Chế độ điều khiển được: `ok | fail | slow` (slow = 3 giây), đặt qua hook E2E đăng ký trong `registerFakeTestHooks` (chỉ MODE `fake`/`e2e`, không vào bundle production). Không bao giờ gọi Gemini ở `dev:fake`.
- **Rationale**: environment.md §6: `dev:fake` dùng adapter dịch giả. E2E cần lỗi và trễ có thể lặp lại để kiểm SC-AI-002, 003.
- **Alternatives**: Mock mạng trong Playwright (`page.route`) — `dev:fake` không gọi mạng thật cho M03 nên mock ở adapter là nhất quán.

## R-12 — Log và bí mật

- **Decision**: Function không log text nguồn, bản dịch, JWT hay khóa; chỉ log mã kết quả (`FAILED` kèm HTTP status của Gemini). Khóa đọc bằng `Deno.env.get('GEMINI_API_KEY')`. Local: đặt trong `supabase/functions/.env` (đã bị `.gitignore` bỏ qua theo mẫu `.env`) và chạy `supabase functions serve`/`supabase start`; không bao giờ commit. Kiểm SC-AI-004: quét `dist/` sau `npm run build` không có `GEMINI`/`generativelanguage`/chuỗi khóa.
- **Rationale**: BR-AI-08, BR-AI-10; environment.md §4, §7; AGENTS.md §6 cấm ghi secret.
- **Alternatives**: Log text để gỡ lỗi — lộ nội dung nháp (BR-AI-10).

## R-13 — Constitution chưa liệt kê spec-AI (đã giải quyết: constitution 2.1.0, 2026-11-03)

- **Decision**: `.specify/memory/constitution.md` Principle I liệt kê "ba module spec" là nguồn sự thật duy nhất và Principle II liệt kê bốn contract; chưa có spec-AI_integration và contract `TranslationRequest`/`TranslationResult`, trong khi AGENTS.md §3.1–3.2 (đã sửa 2026-11-03) có. Plan ghi vào Complexity Tracking và đề nghị sửa constitution (PATCH/MINOR) bằng `/speckit-constitution` **khi người dùng đồng ý**; không tự sửa `.specify/` (AGENTS.md §4: bảo tồn governance).
- **Rationale**: AGENTS.md là quy tắc chính của repo và đã được người dùng cho phép sửa; constitution là bản dẫn xuất cho Spec-Kit và đang stale. Không âm thầm reconcile (AGENTS.md §3.1).
- **Alternatives**: Tự sửa constitution — vượt phạm vi task. Coi gate là FAIL và dừng — chặn vô lý vì nguồn quyền cao hơn (AGENTS.md) đã cho phép.

## Upstream có nguy cơ stale

- `.specify/memory/constitution.md` Principle I, II — đã cập nhật lên 2.1.0 ngày 2026-11-03 (R-13).
- `screens/html/mockup-SCR-M03-002/003/008.html` — chưa có nút dịch; người dùng chủ động loại khỏi phạm vi (2026-11-03).
