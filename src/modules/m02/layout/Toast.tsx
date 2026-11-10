// Toast của M02: thông báo ngắn nổi ngay dưới thanh app, không đẩy nội dung (ví dụ "Đã ghi nhận lượt quét."). Hiện
// 4 giây rồi tự ẩn; trình đọc màn hình đọc qua role="status". Gắn vào body để vị trí cố định không phụ thuộc layout.
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TintIcon } from '../../../shared/ui/Icon';
import styles from './Toast.module.css';

const SHOWN_MS = 4000;
// Bằng --duration-toast-exit (design-system §4)
const LEAVE_MS = 200;

export function Toast({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<'shown' | 'leaving' | 'gone'>('shown');

  useEffect(() => {
    const leave = setTimeout(() => setPhase('leaving'), SHOWN_MS);
    const gone = setTimeout(() => setPhase('gone'), SHOWN_MS + LEAVE_MS);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
  }, []);

  if (phase === 'gone') return null;
  return createPortal(
    <div className={styles.toast} role="status" data-leaving={phase === 'leaving' || undefined}>
      <TintIcon name="check-circle" className={styles.icon} />
      <p className={styles.text}>{children}</p>
    </div>,
    document.body,
  );
}
