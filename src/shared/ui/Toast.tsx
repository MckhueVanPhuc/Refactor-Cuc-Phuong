// Toast dùng chung (design-system §5.3 "Xác nhận lượt ghé và toast"; người dùng duyệt 2026-11-21): thông báo thành
// công ngắn nổi ngay dưới thanh app, không đẩy nội dung (ví dụ "Đã ghi nhận lượt quét."). `role="status"` để trình đọc
// màn hình đọc mà không chuyển focus. Tự đóng sau 6 giây; dừng đếm khi con trỏ ở trên hoặc focus ở trong toast; nút đóng
// ẩn ngay. Đổi `key` khi có thông báo mới để toast mới thay toast cũ. Gắn vào body để vị trí cố định không phụ thuộc
// layout. Lỗi và thông báo có hành động không dùng toast (chúng không được tự đóng).
// 2026-11-27 (CHG-MASCOT-2026-11-27-08): `durationMs` và `icon` cho toast thông tin (gợi ý khách tự do, 4 giây).
import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TintIcon } from './Icon';
import styles from './Toast.module.css';

/** Thời gian hiện trước khi tự đóng (design-system §5.3) */
export const TOAST_SHOWN_MS = 6000;
// Bằng --duration-toast-exit (design-system §4.3)
const LEAVE_MS = 200;

export function Toast({
  children,
  closeLabel,
  durationMs = TOAST_SHOWN_MS,
  icon = 'check-circle',
}: {
  children: ReactNode;
  closeLabel: string;
  /** Thời gian hiện trước khi tự đóng; mặc định 6 giây (design-system §5.3) */
  durationMs?: number;
  /** Icon trong assets/icons/; mặc định dấu thành công */
  icon?: string;
}) {
  const [phase, setPhase] = useState<'shown' | 'leaving' | 'gone'>('shown');
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Thời gian còn lại; tạm dừng thì giữ phần chưa đếm
  const remaining = useRef(durationMs);
  const paused = hovered || focused;

  useEffect(() => {
    if (phase !== 'shown' || paused) return undefined;
    const started = Date.now();
    const timer = setTimeout(() => setPhase('leaving'), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    const timer = setTimeout(() => setPhase('gone'), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  if (phase === 'gone') return null;
  return createPortal(
    <div
      className={styles.toast}
      data-leaving={phase === 'leaving' || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
    >
      <TintIcon name={icon} className={styles.icon} />
      {/* Chỉ câu thông báo là vùng đọc tự động; tên nút đóng không bị đọc kèm */}
      <p className={styles.text} role="status">
        {children}
      </p>
      <button type="button" className={styles.close} aria-label={closeLabel} onClick={() => setPhase('leaving')}>
        <TintIcon name="close" />
      </button>
    </div>,
    document.body,
  );
}
