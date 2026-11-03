// Edge `translate`: dịch vi → en theo yêu cầu cho editor M03 (spec-AI_integration BR-AI-08, 10, 11;
// specs/004-ai-translation/contracts/translate-contract.md §1–§6). Logic thuần, không gọi mạng: index.ts nối
// dependency thật (Auth, api.get_current_admin, Gemini) vào đây.
// Body lỗi không bao giờ chứa text nguồn, lỗi thô của dịch vụ, JWT hay khóa; log chỉ có mã kết quả (research R-12).
import { json, preflight } from '../_shared/cors.ts';

export type CurrentAdmin = { email: string; role: string; status: string } | null;
export type LineBreaks = 'ALLOWED' | 'NOT_ALLOWED';

export type Deps = {
  /** Người dùng của JWT (provider xác minh chữ ký, hạn, phiên); null nếu không hợp lệ */
  getUser(token: string): Promise<{ id: string } | null>;
  /** `api.get_current_admin` gọi bằng JWT của người gọi: chỉ khác null khi tài khoản ACTIVE; 'UNAUTHORIZED' khi PostgREST từ chối JWT */
  currentAdmin(token: string): Promise<CurrentAdmin | 'UNAUTHORIZED'>;
  /** Gọi dịch vụ dịch với đúng text nguồn đã trim; null khi dịch vụ lỗi, quá thời gian, thiếu khóa hay không có chữ */
  translate(input: { text: string; lineBreaks: LineBreaks }): Promise<string | null>;
};

/** Trần chung của text nguồn: giới hạn lớn nhất của spec-M03 §5.3 (mô tả đầy đủ, giới thiệu) — research R-04 */
export const MAX_SOURCE_CHARS = 2000;
export const MAX_BODY_BYTES = 16 * 1024;

const REQUEST_KEYS = ['sourceLanguage', 'targetLanguage', 'text', 'lineBreaks'] as const;

function bearer(req: Request): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '');
  return match ? match[1]! : null;
}

type ValidRequest = { text: string; lineBreaks: LineBreaks };

/** TranslationRequest hợp lệ (contract §2) hoặc null */
async function readRequest(req: Request): Promise<ValidRequest | null> {
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return null;
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return null;
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => !(REQUEST_KEYS as readonly string[]).includes(key))) return null;
  if (record.sourceLanguage !== 'vi' || record.targetLanguage !== 'en') return null;
  if (record.lineBreaks !== 'ALLOWED' && record.lineBreaks !== 'NOT_ALLOWED') return null;
  if (typeof record.text !== 'string') return null;
  const text = record.text.trim();
  const length = Array.from(text).length;
  if (length === 0 || length > MAX_SOURCE_CHARS) return null;
  return { text, lineBreaks: record.lineBreaks };
}

/** Chữ thuần: trim, bỏ một cặp ngoặc kép bao ngoài, bỏ xuống dòng cho trường một dòng; không cắt theo độ dài (BR-AI-06, 11) */
export function cleanTranslation(raw: string, lineBreaks: LineBreaks): string {
  let text = raw.trim();
  const quoted = /^"([\s\S]*)"$/.exec(text) ?? /^“([\s\S]*)”$/.exec(text);
  if (quoted) text = quoted[1]!.trim();
  if (lineBreaks === 'NOT_ALLOWED') text = text.replace(/\s*[\r\n]+\s*/g, ' ');
  return text;
}

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method === 'OPTIONS') return preflight();
  if (req.method !== 'POST') return json(405, { result: 'FAILED' });

  // Xác thực trước kiểm tra body: người lạ không dò được định dạng (contract §3)
  const token = bearer(req);
  if (!token) return json(401, {});
  try {
    const user = await deps.getUser(token);
    if (!user) return json(401, {});
    const admin = await deps.currentAdmin(token);
    if (admin === 'UNAUTHORIZED') return json(401, {});
    if (!admin) return json(403, { result: 'FORBIDDEN' });

    const request = await readRequest(req);
    if (!request) return json(400, { result: 'INVALID' });

    const raw = await deps.translate(request);
    const translatedText = raw === null ? '' : cleanTranslation(raw, request.lineBreaks);
    if (!translatedText) {
      console.error('[translate]', 'FAILED');
      return json(502, { result: 'FAILED' });
    }
    return json(200, { translatedText });
  } catch (error) {
    console.error('[translate]', error instanceof Error ? error.name : 'unknown error');
    return json(502, { result: 'FAILED' });
  }
}
