// Control VI/EN dùng chung cho mọi màn du khách, kể cả trang link QR của M02 (US-M01-01 mục 3; BR-M01-001).
// Mỗi lần bấm ghi qua writer của M01, nên M01 vẫn là writer duy nhất (language-preference-contract §3).
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { messagesFor } from '../i18n';
import { writeLanguagePreference } from '../storage/languageWriter';
import styles from './LanguageControl.module.css';
import { useDisplayLanguage } from './useLanguagePreference';

// Nhãn mã ngôn ngữ như mockup SCR-M01-003; giống nhau ở cả hai ngôn ngữ
const OPTIONS: readonly { code: LanguageCode; label: string }[] = [
  { code: 'vi', label: 'VI' },
  { code: 'en', label: 'EN' },
];

export function LanguageControl({ tone = 'onLight' }: { tone?: 'onLight' | 'onDark' }) {
  const language = useDisplayLanguage();
  const className = tone === 'onDark' ? `${styles.group} ${styles.onDark}` : styles.group;

  return (
    <div className={className} role="group" aria-label={messagesFor(language).language.groupLabel}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={styles.button}
          lang={option.code}
          aria-pressed={language === option.code}
          onClick={() => void writeLanguagePreference(option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
