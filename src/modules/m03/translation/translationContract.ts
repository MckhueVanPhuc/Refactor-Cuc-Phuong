// Contract dịch phía client: TranslationRequest / TranslationResult (spec-AI_integration §5.2;
// specs/004-ai-translation/contracts/translate-contract.md §7).

export type LineBreaks = 'ALLOWED' | 'NOT_ALLOWED';

export type TranslationRequest = {
  sourceLanguage: 'vi';
  targetLanguage: 'en';
  /** Ô tiếng Việt đã trim; không rỗng (BR-AI-01) */
  text: string;
  /** NOT_ALLOWED cho trường một dòng (BR-AI-11) */
  lineBreaks: LineBreaks;
};

/** Kết quả một lượt dịch; mọi lỗi gộp thành `{ ok: false }` (research R-05) */
export type TranslationOutcome = { ok: true; text: string } | { ok: false };

export interface Translator {
  /** Không bao giờ throw: lỗi mạng, quá thời gian hay bị từ chối đều trả `{ ok: false }` */
  translate(request: TranslationRequest): Promise<TranslationOutcome>;
}

/** Thời gian chờ tối đa của một lượt dịch ở trình duyệt (provisional; spec-AI §5.4, research R-06) */
export const AI_TRANSLATE_TIMEOUT_MS = 15000;

/** Tên Edge Function dịch (contract §1) */
export const TRANSLATE_FUNCTION = 'translate';

export function translationRequest(text: string, lineBreaks: LineBreaks): TranslationRequest {
  return { sourceLanguage: 'vi', targetLanguage: 'en', text: text.trim(), lineBreaks };
}
