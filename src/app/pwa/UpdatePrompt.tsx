// Lời nhắc cập nhật ứng dụng (tasks M01 T093; constitution VI; research M01 R-14). Chỉ trên route du khách (M01, M02):
// màn /admin/* chỉ hiện thông báo của danh mục §5.6 (BR-M03-L13), bản mới áp cho admin khi mọi tab đã đóng.
// Câu chữ: bảng copy SCR-M01-001 (quyết định người dùng 2026-10-30). "Cập nhật" gọi coordinator (vẫn hoãn khi còn việc
// bận); "Để sau" đóng lời nhắc và giữ bản đang chờ.
import { useState, useSyncExternalStore } from 'react';
import { useM01Messages } from '../../modules/m01/i18n/useM01Messages';
import { updateCoordinator as defaultCoordinator, type UpdateCoordinator } from './updateCoordinator';
import styles from './UpdatePrompt.module.css';

export function UpdatePrompt({
  pathname,
  coordinator = defaultCoordinator,
}: {
  pathname: string;
  coordinator?: Pick<UpdateCoordinator, 'subscribe' | 'isUpdateAvailable' | 'applyUpdate'>;
}) {
  const available = useSyncExternalStore(coordinator.subscribe, coordinator.isUpdateAvailable, coordinator.isUpdateAvailable);
  const [dismissed, setDismissed] = useState(false);
  const messages = useM01Messages().update;

  if (!available || dismissed || pathname === '/admin' || pathname.startsWith('/admin/')) return null;

  return (
    <div className={styles.bar} role="status">
      <p className={styles.text}>{messages.available}</p>
      <div className={styles.actions}>
        <button type="button" className={`${styles.button} ${styles.apply}`} onClick={() => void coordinator.applyUpdate()}>
          {messages.apply}
        </button>
        <button type="button" className={`${styles.button} ${styles.later}`} onClick={() => setDismissed(true)}>
          {messages.later}
        </button>
      </div>
    </div>
  );
}
