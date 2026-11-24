// Confetti lá cho khoảnh khắc kết thúc chuyến (design-system §4.3.1 T3, §7; specs/006 R-12; contracts §2). Chỉ trang trí:
// ẩn với công nghệ hỗ trợ, không nhận con trỏ, tối đa 40 hạt, không render khi không có trang trí (giảm chuyển động,
// công tắc tắt, tiết kiệm dữ liệu, máy yếu). Mỗi hạt là mask `leaf.svg` màu theo token; vị trí tất định theo chỉ số.
import type { CSSProperties } from 'react';
import { TintIcon } from '../ui/Icon';
import styles from './LeafConfetti.module.css';
import { useMotionLevel } from './level';

export const LEAF_CONFETTI_MAX = 40;

/** Giả ngẫu nhiên tất định (không đổi giữa các lần render) cho hạt thứ i */
const spread = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export function LeafConfetti({ count = 24 }: { count?: number }) {
  const { decor } = useMotionLevel();
  if (!decor) return null;
  const n = Math.max(0, Math.min(LEAF_CONFETTI_MAX, Math.round(count)));
  return (
    <span className={styles.layer} aria-hidden="true" data-leaf-confetti="">
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className={styles.leaf}
          data-tone={i % 3}
          style={
            {
              '--x': `${Math.round(spread(i, 1) * 100)}%`,
              '--drift': `${Math.round((spread(i, 2) - 0.5) * 60)}%`,
              '--turn': `${Math.round(spread(i, 3) * 540 - 270)}deg`,
              '--delay': spread(i, 4).toFixed(2),
              '--scale': (0.7 + spread(i, 5) * 0.6).toFixed(2),
            } as CSSProperties
          }
        >
          <TintIcon name="leaf" className={styles.icon} />
        </span>
      ))}
    </span>
  );
}
