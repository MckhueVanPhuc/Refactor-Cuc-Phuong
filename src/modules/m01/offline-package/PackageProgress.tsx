// Thanh "đang tải" của gói và dấu ✓ khi xong (design-system §5.3 v1.4; specs/006 US4, R-06). M01 không báo phần trăm:
// thanh không xác định, không số. Chỉ trình bày từ trạng thái gói sẵn có; không đổi logic tải.
import { useEffect, useRef, useState } from 'react';
import { ProgressTrail } from '../../../shared/ui/ProgressTrail';
import { TintIcon } from '../../../shared/ui/Icon';
import styles from './PackageProgress.module.css';

/** `busy`: đang tải; `ready`: gói đang dùng sẵn sàng. Dấu ✓ chỉ khi gói chuyển từ đang tải sang sẵn sàng trong lần mở màn này. */
export function PackageProgress({ busy, ready, label }: { busy: boolean; ready: boolean; label: string }) {
  const wasBusy = useRef(busy);
  const [justReady, setJustReady] = useState(false);
  useEffect(() => {
    if (wasBusy.current && !busy && ready) setJustReady(true);
    wasBusy.current = busy;
  }, [busy, ready]);

  if (busy) return <ProgressTrail className={styles.trail} indeterminate label={label} />;
  if (justReady)
    return (
      <span className={styles.ready} data-package-ready="" aria-hidden="true">
        <TintIcon name="check" className={styles.check} />
      </span>
    );
  return null;
}
