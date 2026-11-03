// Client Edge Function `translate` (spec-AI_integration §5.2; contracts/translate-contract.md §1, §6–§7).
// 200 có `translatedText` → bản dịch; mọi thứ khác (4xx, 5xx, mạng, quá thời gian) → `{ ok: false }` (research R-05).
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  AI_TRANSLATE_TIMEOUT_MS,
  TRANSLATE_FUNCTION,
  type TranslationOutcome,
  type TranslationRequest,
  type Translator,
} from './translationContract';

type Invoker = Pick<SupabaseClient<any, 'api'>, 'functions'>;

export function createSupabaseTranslator(supabase: Invoker): Translator {
  return {
    async translate(request: TranslationRequest): Promise<TranslationOutcome> {
      try {
        const { data, error } = await supabase.functions.invoke<{ translatedText?: unknown }>(TRANSLATE_FUNCTION, {
          body: {
            sourceLanguage: request.sourceLanguage,
            targetLanguage: request.targetLanguage,
            text: request.text,
            lineBreaks: request.lineBreaks,
          },
          timeout: AI_TRANSLATE_TIMEOUT_MS,
        });
        const text = data?.translatedText;
        if (error || typeof text !== 'string' || text.trim() === '') return { ok: false };
        return { ok: true, text };
      } catch {
        return { ok: false };
      }
    },
  };
}
