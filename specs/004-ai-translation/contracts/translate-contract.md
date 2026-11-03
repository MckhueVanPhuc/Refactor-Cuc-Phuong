# Contract: Edge Function `translate`

**Logical contract**: `TranslationRequest` / `TranslationResult` (spec-AI_integration §5.2). **Producer**: AI Integration (Edge Function). **Consumer**: editor M03. Quyết định kỹ thuật: [research.md](../research.md) R-01…R-06, R-12.

## 1. Gọi

- `POST {SUPABASE_URL}/functions/v1/translate`, qua `supabase.functions.invoke('translate', { body, timeout: AI_TRANSLATE_TIMEOUT_MS })` của client M03 (tự gắn JWT phiên admin).
- Header: `Authorization: Bearer <JWT admin>`, `Content-Type: application/json`. `OPTIONS` trả preflight CORS (`_shared/cors.ts`).
- `verify_jwt = false` (`supabase/config.toml`); function tự xác minh (§3).

## 2. Request body (`TranslationRequest`)

```json
{ "sourceLanguage": "vi", "targetLanguage": "en", "text": "Cây chò ngàn năm", "lineBreaks": "NOT_ALLOWED" }
```

Kiểm tra (theo thứ tự; sai → `400 { "result": "INVALID" }`):

1. Body là JSON object, ≤ 16 KiB, chỉ có bốn khóa trên.
2. `sourceLanguage === "vi"`, `targetLanguage === "en"`.
3. `text` là string; `trim(text)` có 1…2000 code point.
4. `lineBreaks ∈ {"ALLOWED", "NOT_ALLOWED"}`.

## 3. Xác thực (BR-AI-08)

1. Không có `Bearer` → `401 {}`.
2. `getUser(token)` thất bại → `401 {}`.
3. `api.get_current_admin()` gọi bằng JWT người gọi: PostgREST từ chối JWT → `401 {}`; trả null (không `ACTIVE`) → `403 { "result": "FORBIDDEN" }`.
4. Mọi role `ACTIVE` đều được; không ghi audit (không phải thao tác quản trị trên dữ liệu M03).

Xác thực chạy trước kiểm tra body, để người lạ không dò được định dạng.

## 4. Gọi dịch vụ dịch

- Thiếu `GEMINI_API_KEY` → `502 { "result": "FAILED" }`.
- `POST https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent` (`GEMINI_MODEL` = `gemini-3.5-flash-lite`, research R-03), header `x-goog-api-key`, `signal: AbortSignal.timeout(12000)`; chỉ gửi `systemInstruction` cố định và `trim(text)` (BR-AI-10).
- Gemini lỗi HTTP, quá thời gian, bị chặn an toàn hoặc không có text → `502 { "result": "FAILED" }`.

## 5. Response thành công (`TranslationResult`)

`200`:

```json
{ "translatedText": "The thousand-year-old Cho tree" }
```

Hậu xử lý trước khi trả: trim; bỏ một cặp ngoặc kép bao ngoài; khi `NOT_ALLOWED` thay mọi chuỗi xuống dòng bằng một khoảng trắng; không cắt theo giới hạn trường. Rỗng sau hậu xử lý → `502 { "result": "FAILED" }`.

## 6. Bảng mã

| HTTP | Body | Client hiểu là |
|---|---|---|
| 200 | `{ translatedText }` | Thành công → ghi ô tiếng Anh nếu BR-AI-04 cho phép |
| 400 | `{ result: "INVALID" }` | Lỗi → MSG-AI-FAILED |
| 401 | `{}` | Lỗi → MSG-AI-FAILED |
| 403 | `{ result: "FORBIDDEN" }` | Lỗi → MSG-AI-FAILED |
| 405 | `{ result: "FAILED" }` | Lỗi → MSG-AI-FAILED |
| 502 | `{ result: "FAILED" }` | Lỗi → MSG-AI-FAILED |
| — | Lỗi mạng / quá `AI_TRANSLATE_TIMEOUT_MS` | Lỗi → MSG-AI-FAILED |

Body lỗi không bao giờ chứa text nguồn, lỗi thô của Gemini, JWT hay khóa. Log của function chỉ có mã kết quả và HTTP status của Gemini (R-12).

## 7. Interface phía client

```ts
// src/modules/m03/translation/translationContract.ts
type TranslationRequest = { sourceLanguage: 'vi'; targetLanguage: 'en'; text: string; lineBreaks: 'ALLOWED' | 'NOT_ALLOWED' };
type TranslationOutcome = { ok: true; text: string } | { ok: false };
interface Translator { translate(request: TranslationRequest): Promise<TranslationOutcome> } // không bao giờ throw
```

Ba bản cài: `supabaseTranslator` (Edge thật), `fakeTranslator` (`dev:fake`, test; chế độ `ok | fail | slow`), và test double trong unit test.
