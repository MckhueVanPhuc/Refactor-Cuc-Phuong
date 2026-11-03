// Nút "→" và dòng trạng thái dịch của một trường song ngữ (spec-AI_integration §5.5, BR-AI-01, BR-AI-09;
// design-system §5.3 "Nút dịch", "Trạng thái dịch"). Ký tự chữ, không file icon (OD-AI-18).
import { RETRY_LABEL, TRANSLATE_BUTTON_NAME, TRANSLATE_BUTTON_TEXT, TRANSLATION_MESSAGES } from './translationMessages';
import type { FieldTranslation } from './useFieldTranslation';
import styles from './TranslateButton.module.css';

export function TranslateButton({ translation }: { translation: FieldTranslation }) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={TRANSLATE_BUTTON_NAME}
      title={TRANSLATE_BUTTON_NAME}
      disabled={!translation.canTranslate}
      onClick={translation.translate}
    >
      <span aria-hidden="true">{TRANSLATE_BUTTON_TEXT}</span>
    </button>
  );
}

/** Dòng dưới ô tiếng Anh; `id` gắn với ô qua aria-describedby. Không có gì khi idle. */
export function TranslationStatusLine({ id, translation }: { id: string; translation: FieldTranslation }) {
  if (translation.status === 'translating') {
    return (
      <p id={id} role="status" className={styles.progress}>
        {TRANSLATION_MESSAGES['MSG-AI-TRANSLATING']}
      </p>
    );
  }
  if (translation.status === 'failed') {
    return (
      <div id={id} role="alert" className={styles.failure}>
        <span>{TRANSLATION_MESSAGES['MSG-AI-FAILED']}</span>
        <button type="button" className={styles.retry} onClick={translation.retry}>
          {RETRY_LABEL}
        </button>
      </div>
    );
  }
  return null;
}
