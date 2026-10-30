import styles from './PlaceholderPage.module.css';

/** Trang giữ chỗ cho một màn M03; story tương ứng thay bằng màn thật (tasks T046). */
export default function PlaceholderPage({ title }: { title: string }) {
  return <h1 className={styles.title}>{title}</h1>;
}
