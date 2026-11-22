// Công tắc "Chuyển động" ở thanh đầu trang (design-system §9.5; spec-Mascot BR-MAS-21; specs/005 mascot-ui-contract
// §4a). Chỉ dừng chuyển động của Mila, không ẩn Mila (OD-MAS-03). Không render khi cờ Mila tắt.
import { labelsFor } from './dialogue/catalog';
import type { Language } from './events';
import { isMascotEnabled } from './flag';
import { setMotion, useMotion } from './motion';
import { TintIcon } from '../ui/Icon';
import styles from './MascotMotionToggle.module.css';

type Props = {
  language: Language;
  /** Màu theo nền thanh đầu trang (như LanguageControl) */
  tone: 'onDark' | 'onLight';
  /** Chỉ biểu tượng (thanh đầu trang đã có tiêu đề, ví dụ M02): không chiếm chỗ của tiêu đề và VI/EN */
  compact?: boolean;
};

export function MascotMotionToggle({ language, tone, compact = false }: Props) {
  const on = useMotion();
  if (!isMascotEnabled()) return null;
  const labels = labelsFor(language);
  return (
    <button
      type="button"
      className={styles.toggle}
      data-tone={tone}
      data-compact={compact ? '' : undefined}
      data-mascot-motion-toggle=""
      aria-pressed={on}
      aria-label={labels.motion}
      onClick={() => setMotion(!on)}
    >
      <TintIcon name={on ? 'pause' : 'play'} className={styles.icon} />
      <span className={styles.text}>{on ? labels.motionOn : labels.motionOff}</span>
    </button>
  );
}
