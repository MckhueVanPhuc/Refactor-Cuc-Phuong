// Edge `translate` — nối dependency thật vào handler.ts (specs/004-ai-translation tasks T028; research R-01…R-03, R-12).
// `verify_jwt = false` trong supabase/config.toml: function tự xác minh JWT người gọi như `admin-accounts`.
// GEMINI_API_KEY chỉ có trong secret của Edge (environment.md §4); gửi qua header, không bao giờ trả về hay ghi log.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { type Deps, handle } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

/**
 * Model stable cho tác vụ ngắn, độ trễ thấp. Kiểm trên tài liệu Gemini API ngày 2026-11-03: gemini-2.5-flash đã
 * deprecated (chuyển hướng từ 2026-12-01), gemini-3.5-flash-lite là Flash-Lite stable (research R-03).
 */
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
/** Server bỏ cuộc trước client (AI_TRANSLATE_TIMEOUT_MS = 15 s) để trả 502 rõ ràng (research R-06) */
const GEMINI_TIMEOUT_MS = 12_000;

const SYSTEM_INSTRUCTION = [
  'You translate Vietnamese text into English for the visitor content of Cuc Phuong National Park, Vietnam.',
  'Keep proper names (place names, species names, "Cúc Phương") in their usual written form.',
  'Return only the English translation as plain text: no markdown, no surrounding quotes, no notes or explanations.',
].join(' ');
const SINGLE_LINE = 'Return the translation on a single line.';

const noSession = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

function callerClient(token: string) {
  return createClient(url, publishableKey, {
    auth: noSession,
    db: { schema: 'api' },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

type GeminiResponse = { candidates?: { content?: { parts?: { text?: string }[] } }[] };

const deps: Deps = {
  async getUser(token) {
    const { data, error } = await callerClient(token).auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id };
  },
  async currentAdmin(token) {
    const { data, error, status } = await callerClient(token).rpc('get_current_admin');
    if (status === 401) return 'UNAUTHORIZED';
    if (error) throw new Error('get_current_admin failed');
    return data;
  },
  async translate({ text, lineBreaks }) {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[translate]', 'MISSING_KEY');
      return null;
    }
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: lineBreaks === 'NOT_ALLOWED' ? `${SYSTEM_INSTRUCTION} ${SINGLE_LINE}` : SYSTEM_INSTRUCTION }],
        },
        // Chỉ text nguồn của một trường (BR-AI-10)
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'text/plain' },
      }),
    });
    if (!response.ok) {
      // Chỉ mã HTTP của dịch vụ; không bao giờ log body (có thể chứa text nguồn)
      console.error('[translate]', 'GEMINI_HTTP', response.status);
      return null;
    }
    const body = (await response.json()) as GeminiResponse;
    const parts = body.candidates?.[0]?.content?.parts ?? [];
    const translated = parts.map((part) => part.text ?? '').join('');
    return translated.trim() ? translated : null;
  },
};

Deno.serve((req) => handle(req, deps));
