// Bộ dịch giả cho `npm run dev:fake` và test (research R-11): không gọi dịch vụ nào, trả "{text} (en)"
// như quy ước pair() của e2eSeed.ts. Chế độ ok / fail / slow để E2E kiểm BR-AI-04 và BR-AI-09.
import type { TranslationOutcome, Translator } from './translationContract';

export type FakeTranslationMode = 'ok' | 'fail' | 'slow';

export type FakeTranslator = Translator & {
  setMode(mode: FakeTranslationMode): void;
  /** Số lượt dịch đã nhận (kiểm "không tự dịch", SC-AI-001/002) */
  readonly requestCount: number;
};

const SLOW_DELAY_MS = 3000;

export function createFakeTranslator({ delayMs = 300 }: { delayMs?: number } = {}): FakeTranslator {
  let mode: FakeTranslationMode = 'ok';
  let requestCount = 0;
  return {
    setMode(next) {
      mode = next;
    },
    get requestCount() {
      return requestCount;
    },
    async translate({ text, lineBreaks }): Promise<TranslationOutcome> {
      requestCount += 1;
      const current = mode;
      await new Promise((resolve) => setTimeout(resolve, current === 'slow' ? SLOW_DELAY_MS : delayMs));
      if (current === 'fail') return { ok: false };
      const translated = `${text.trim()} (en)`;
      return { ok: true, text: lineBreaks === 'NOT_ALLOWED' ? translated.replace(/\s*[\r\n]+\s*/g, ' ') : translated };
    },
  };
}
