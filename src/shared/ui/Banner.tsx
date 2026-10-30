import type { ReactNode } from 'react';
import styles from './Banner.module.css';

export type BannerTone = 'info' | 'success' | 'warning' | 'error';

export type BannerProps = {
  tone: BannerTone;
  children: ReactNode;
  title?: ReactNode;
  /** Hành động khôi phục theo screen spec; banner có hành động không tự đóng. */
  actions?: ReactNode;
};

/**
 * Banner trạng thái (design-system §5.3): lỗi dùng `role="alert"`, còn lại `role="status"`
 * để trình đọc màn hình đọc mà không chuyển focus. Màu chỉ đi kèm chữ, không thay chữ.
 */
export function Banner({ tone, children, title, actions }: BannerProps) {
  return (
    <div className={`${styles.banner} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div className={styles.content}>
        {title ? <p className={styles.title}>{title}</p> : null}
        <div>{children}</div>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
