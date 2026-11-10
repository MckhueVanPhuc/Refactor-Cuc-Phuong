// Ba vạch tăng dần tô theo độ khó của tuyến (thẻ tuyến SCR-M01-001, ô Độ khó SCR-M01-003). Chỉ trang trí: nhãn chữ
// độ khó luôn hiện cạnh vạch, không dùng vạch hay màu làm tín hiệu duy nhất (design-system §7).
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import styles from './DifficultyBars.module.css';

const LEVEL: Record<PublishedRoute['difficulty'], number> = { NHE: 1, TRUNG_BINH: 2, KHO: 3 };

export function DifficultyBars({ difficulty, className }: { difficulty: PublishedRoute['difficulty']; className?: string | undefined }) {
  const level = LEVEL[difficulty];
  return (
    <span className={className ? `${styles.bars} ${className}` : styles.bars} aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <span key={bar} className={styles.bar} data-filled={bar <= level || undefined} />
      ))}
    </span>
  );
}
