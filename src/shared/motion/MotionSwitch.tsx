// Công tắc "Hiệu ứng chuyển động" ở màn Tài nguyên (spec-Mascot v1.4 BR-MAS-21; design-system §9.5; specs/006 R-15).
// Công tắc duy nhất của app: dừng chuyển động của Mila và hiệu ứng trang trí trên mọi màn, không ẩn Mila (OD-MAS-03).
// Luôn render, kể cả khi cờ Mila tắt (OD-MAS-21). Trạng thái theo lần tải trang, không lưu (BR-MAS-18).
import { labelsFor } from '../mascot/dialogue/catalog';
import type { Language } from '../mascot/events';
import styles from './MotionSwitch.module.css';
import { setMotion, useMotion } from './store';

export function MotionSwitch({ language }: { language: Language }) {
  const on = useMotion();
  const labels = labelsFor(language);
  return (
    <button type="button" role="switch" aria-checked={on} className={styles.row} data-motion-switch="" onClick={() => setMotion(!on)}>
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
