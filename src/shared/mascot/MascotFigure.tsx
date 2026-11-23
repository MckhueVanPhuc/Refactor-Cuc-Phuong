// Hình tĩnh của Mila đặt cạnh một câu cố định (INLINE; specs/005 research R-07). Không bong bóng, không logic,
// ẩn khỏi trình đọc màn hình vì ý nghĩa nằm ở câu chữ bên cạnh (BR-MAS-02).
import { useState } from 'react';
import { TintIcon } from '../ui/Icon';
import { poseAsset } from './assets';
import { isMascotEnabled } from './flag';
import styles from './MascotFigure.module.css';
import type { PoseId } from './types';

export function MascotFigure({ pose, size = 'md' }: { pose: PoseId; size?: 'sm' | 'md' }) {
  const [broken, setBroken] = useState(false);
  if (!isMascotEnabled() || broken) return null;
  const asset = poseAsset(pose);
  return (
    <span className={`${styles.figure} ${styles[size]}`} data-mascot-figure={pose} aria-hidden="true">
      {asset ? (
        <img className={styles.image} src={asset.src240} alt="" decoding="async" onError={() => setBroken(true)} />
      ) : (
        <span className={styles.placeholder} data-mascot-placeholder="">
          <TintIcon name="leaf" className={styles.leaf} />
        </span>
      )}
    </span>
  );
}
