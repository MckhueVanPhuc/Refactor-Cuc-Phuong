// Thanh tiến trình "đường mòn" (design-system §5.3 v1.4; specs/006 R-05, R-06; contracts/motion-ui-contract.md §3).
// Xác định: phần đã đi `scaleX(value/max)`, dấu chân ở đầu; không xác định: một vệt trôi, không số, không giả tiến độ.
// Màu theo `currentColor` của chỗ đặt (scanner: success; panel gói: forest). Chỉ animate transform (§4.3.2).
import { useEffect, useState, type CSSProperties } from 'react';
import { TintIcon } from './Icon';
import styles from './ProgressTrail.module.css';

type Determinate = { value: number; max: number; label: string; /** Giá trị trước để thanh tăng từ đó (mở khóa) */ from?: number };
type Indeterminate = { indeterminate: true; label: string };
export type ProgressTrailProps = (Determinate | Indeterminate) & { className?: string | undefined };

const ratio = (value: number, max: number) => (max > 0 ? Math.min(1, Math.max(0, value / max)) : 0);

export function ProgressTrail(props: ProgressTrailProps) {
  const className = [styles.trail, props.className].filter(Boolean).join(' ');
  if ('indeterminate' in props) {
    return (
      <div className={className} role="progressbar" aria-label={props.label} data-indeterminate="">
        <span className={styles.drift} />
      </div>
    );
  }
  return <DeterminateTrail {...props} className={className} />;
}

function DeterminateTrail({ value, max, label, from, className }: Determinate & { className: string }) {
  // Vẽ khung đầu ở `from`, khung sau ở `value` để transition chạy (một lần, không vòng lặp)
  const [shown, setShown] = useState(from ?? value);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);
  return (
    <div
      className={className}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      style={{ '--trail-progress': ratio(shown, max) } as CSSProperties}
    >
      <span className={styles.fill} />
      <span className={styles.marker}>
        <TintIcon name="footprint" className={styles.footprint} />
      </span>
    </div>
  );
}
