import { describe, expect, it } from 'vitest';
import { RETRY_LABEL, TRANSLATE_BUTTON_NAME, TRANSLATE_BUTTON_TEXT, TRANSLATION_MESSAGES } from './translationMessages';

describe('chữ hiển thị của nút dịch (spec-AI §5.5)', () => {
  it('đúng câu chữ của spec', () => {
    expect(TRANSLATION_MESSAGES).toEqual({
      'MSG-AI-TRANSLATING': 'Đang dịch…',
      'MSG-AI-FAILED': 'Chưa dịch được. Hãy bấm "Thử lại" hoặc tự nhập tiếng Anh.',
    });
    expect(TRANSLATE_BUTTON_TEXT).toBe('→');
    expect(TRANSLATE_BUTTON_NAME).toBe('Dịch sang tiếng Anh');
    expect(RETRY_LABEL).toBe('Thử lại');
  });

  it('không câu nào chứa từ cấm hiện cho nhân viên', () => {
    const banned = /AI|Gemini|API|token|JSON|null|undefined|endpoint|status code|lỗi \d/i;
    for (const text of [...Object.values(TRANSLATION_MESSAGES), TRANSLATE_BUTTON_NAME, RETRY_LABEL]) {
      expect(text).not.toMatch(banned);
    }
  });
});
