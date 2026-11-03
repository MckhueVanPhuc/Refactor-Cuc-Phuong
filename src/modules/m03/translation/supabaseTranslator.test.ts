import { describe, expect, it, vi } from 'vitest';
import { createSupabaseTranslator } from './supabaseTranslator';
import { AI_TRANSLATE_TIMEOUT_MS, translationRequest } from './translationContract';

type InvokeResult = { data: unknown; error: unknown };

function client(result: InvokeResult | (() => Promise<InvokeResult>)) {
  const invoke = vi.fn(typeof result === 'function' ? result : async () => result);
  return { invoke, translator: createSupabaseTranslator({ functions: { invoke } } as never) };
}

const request = translationRequest('  Cây chò ngàn năm ', 'NOT_ALLOWED');

describe('supabaseTranslator (contract §6–§7)', () => {
  it('gọi Edge `translate` với đúng bốn khóa và thời gian chờ', async () => {
    const { invoke, translator } = client({ data: { translatedText: 'Cho tree' }, error: null });
    await translator.translate(request);
    expect(invoke).toHaveBeenCalledWith('translate', {
      body: { sourceLanguage: 'vi', targetLanguage: 'en', text: 'Cây chò ngàn năm', lineBreaks: 'NOT_ALLOWED' },
      timeout: AI_TRANSLATE_TIMEOUT_MS,
    });
  });

  it('200 có translatedText → ok', async () => {
    const { translator } = client({ data: { translatedText: 'Cho tree' }, error: null });
    await expect(translator.translate(request)).resolves.toEqual({ ok: true, text: 'Cho tree' });
  });

  it.each([
    ['400/401/403/405/502 (FunctionsHttpError)', { data: null, error: new Error('Edge Function returned a non-2xx status code') }],
    ['body không có translatedText', { data: { result: 'FAILED' }, error: null }],
    ['translatedText rỗng', { data: { translatedText: '  ' }, error: null }],
    ['translatedText không phải chuỗi', { data: { translatedText: 42 }, error: null }],
  ])('%s → { ok: false }', async (_name, result) => {
    const { translator } = client(result);
    await expect(translator.translate(request)).resolves.toEqual({ ok: false });
  });

  it('lỗi mạng hoặc quá thời gian (invoke throw) → { ok: false }, không throw', async () => {
    const { translator } = client(() => Promise.reject(new DOMException('timeout', 'TimeoutError')));
    await expect(translator.translate(request)).resolves.toEqual({ ok: false });
  });
});
