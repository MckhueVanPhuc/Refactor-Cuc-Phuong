// Công tắc "Chuyển động của Mila" ở màn Tài nguyên (spec-Mascot v1.3 BR-MAS-21; design-system §9.5; specs/005 research
// R-28). Công tắc duy nhất của app: chỉ dừng chuyển động của Mila trên mọi màn, không ẩn Mila (OD-MAS-03). Không render
// khi cờ Mila tắt. Trạng thái theo lần tải trang, không lưu (BR-MAS-18).
import { labelsFor } from './dialogue/catalog';
import type { Language } from './events';
import { isMascotEnabled } from './flag';
import { setMotion, useMotion } from './motion';
import styles from './MascotMotionSwitch.module.css';

export function MascotMotionSwitch({ language }: { language: Language }) {
  const on = useMotion();
  if (!isMascotEnabled()) return null;
  const labels = labelsFor(language);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={styles.row}
      data-mascot-motion-switch=""
      onClick={() => setMotion(!on)}
    >
      <span className={styles.text}>
        <span className={styles.label}>{labels.motion}</span>
        <span className={styles.hint}>{labels.motionHint}</span>
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </button>
  );
}
