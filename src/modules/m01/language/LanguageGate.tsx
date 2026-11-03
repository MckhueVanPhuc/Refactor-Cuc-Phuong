// Guard ngôn ngữ của route M01 (US-M01-01 mục 1; visitor-ui-flow §1): chưa có LanguagePreference → panel chọn
// chặn toàn trang; chọn xong mới vào. Chỉ bọc route M01; trang link QR của M02 không qua gate (BR-M02-024).
import type { ReactNode } from 'react';
import logoUrl from '../../../../assets/icons/icon.png';
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { messagesFor } from '../i18n';
import { writeLanguagePreference } from '../storage/languageWriter';
import styles from './LanguageGate.module.css';
import { deviceLanguage, resolveDisplayLanguage } from './resolveDisplayLanguage';
import { useLanguagePreferenceState } from './useLanguagePreference';

// Tên tự gọi của hai ngôn ngữ, như trong câu copy "Chọn ngôn ngữ (Tiếng Việt / English)"
const CHOICES: readonly { code: LanguageCode; label: string }[] = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
];

export function LanguageGate({ children }: { children: ReactNode }) {
  const state = useLanguagePreferenceState();
  if (state.status === 'loading') return null;
  if (state.value) return children;

  // Chưa chọn: tiêu đề theo ngôn ngữ thiết bị, chưa ghi gì
  const messages = messagesFor(resolveDisplayLanguage(null, deviceLanguage()));
  return (
    <main className={styles.panel}>
      <img className={styles.logo} src={logoUrl} alt="" />
      <h1 className={styles.title}>{messages.language.chooseTitle}</h1>
      <div className={styles.choices}>
        {CHOICES.map((choice) => (
          <button
            key={choice.code}
            type="button"
            className={styles.choice}
            lang={choice.code}
            onClick={() => void writeLanguagePreference(choice.code)}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </main>
  );
}
