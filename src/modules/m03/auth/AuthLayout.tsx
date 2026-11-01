import type { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

/**
 * Khung chung của SCR-M03-000 và SCR-M03-007: một cột hẹp giữa nền giấy, thẻ form trắng.
 * `notice` là vùng thông báo duy nhất, đặt trước form (design-system §5.3).
 */
export function AuthLayout({ title, notice, children }: { title: string; notice?: ReactNode; children: ReactNode }) {
  return (
    <main className={styles.page}>
      <div className={styles.column}>
        <p className={styles.brand}>Cúc Phương Quest</p>
        <section className={styles.card} aria-labelledby="auth-title">
          <h1 id="auth-title" className={styles.title}>
            {title}
          </h1>
          {notice ? <div className={styles.notice}>{notice}</div> : null}
          {children}
        </section>
      </div>
    </main>
  );
}
