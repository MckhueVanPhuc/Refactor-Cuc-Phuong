// Chữ hiển thị của nút dịch — câu chữ cố định của spec-AI_integration §5.5 (OD-AI-18 cho nút).
// Tách khỏi messages/catalogText.ts: danh mục M03 phải trùng từng chữ với spec-M03 §5.6 và app.message_template.

export const TRANSLATION_MESSAGES = {
  // A translation of this field is in progress
  'MSG-AI-TRANSLATING': 'Đang dịch…',
  // The translation of this field failed (BR-AI-09)
  'MSG-AI-FAILED': 'Chưa dịch được. Hãy bấm "Thử lại" hoặc tự nhập tiếng Anh.',
} as const;

/** Nhãn của nút "→" (ký tự chữ, không file icon) và tên truy cập của nó (spec-AI §5.5) */
export const TRANSLATE_BUTTON_TEXT = '→';
export const TRANSLATE_BUTTON_NAME = 'Dịch sang tiếng Anh';
/** Nhãn của hành động thử lại trong MSG-AI-FAILED (BR-AI-09) */
export const RETRY_LABEL = 'Thử lại';
