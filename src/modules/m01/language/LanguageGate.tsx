// Guard ngôn ngữ của route M01 (US-M01-01 mục 1; visitor-ui-flow §1): chưa có LanguagePreference → panel chọn
// chặn toàn trang; chọn xong mới vào. Chỉ bọc route M01; trang link QR của M02 không qua gate (BR-M02-024).
import type { ReactNode } from 'react';
import flagEnUrl from '../../../../assets/icons/flag-en.svg';
import flagViUrl from '../../../../assets/icons/flag-vi.svg';
import logoUrl from '../../../../assets/icons/icon.png';
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { messagesFor } from '../i18n';
import { writeLanguagePreference } from '../storage/languageWriter';
import styles from './LanguageGate.module.css';
import { useLanguagePreferenceState } from './useLanguagePreference';

// Tên tự gọi của hai ngôn ngữ; cờ chỉ trang trí nên tên nút vẫn là chữ (SCR-M01-001 OQ-SCR-M01-001-003)
const CHOICES: readonly { code: LanguageCode; label: string; flagUrl: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flagUrl: flagViUrl },
  { code: 'en', label: 'English', flagUrl: flagEnUrl },
];

export function LanguageGate({ children }: { children: ReactNode }) {
  const state = useLanguagePreferenceState();
  if (state.status === 'loading') return null;
  if (state.value) return children;

  // Chưa chọn: panel song ngữ, tiếng Việt trước (bảng copy SCR-M01-001); chưa ghi gì cho tới khi bấm
  const vi = messagesFor('vi').language;
  const en = messagesFor('en').language;
  return (
    <main className={styles.panel} aria-labelledby="language-gate-title">
      <div className={styles.emblem}>
        <img className={styles.logo} src={logoUrl} alt="" />
      </div>
      <h1 id="language-gate-title" className={styles.title}>
        {vi.chooseTitle}
      </h1>
      <p className={styles.subtitle} lang="en">
        {en.chooseTitle}
      </p>
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.rule} />
        <span className={styles.mountain} />
        <span className={styles.rule} />
      </div>
      <p className={styles.lead}>{vi.chooseLead}</p>
      <p className={styles.leadEn} lang="en">
        {en.chooseLead}
      </p>
      <div className={styles.choices}>
        {CHOICES.map((choice) => (
          <button
            key={choice.code}
            type="button"
            className={styles.choice}
            data-language={choice.code}
            lang={choice.code}
            onClick={() => void writeLanguagePreference(choice.code)}
          >
            <img className={styles.flag} src={choice.flagUrl} alt="" />
            {choice.label}
          </button>
        ))}
      </div>
    </main>
  );
}
