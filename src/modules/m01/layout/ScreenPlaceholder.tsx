// Trang placeholder của khung route (tasks T032): chỉ tiêu đề màn; màn thật thay ở US2–US7.
import { useM01Messages } from '../i18n/useM01Messages';
import type { M01Messages } from '../i18n';
import styles from './ScreenPlaceholder.module.css';

export function ScreenPlaceholder({ screen }: { screen: keyof M01Messages['screenTitle'] }) {
  const messages = useM01Messages();
  return <h1 className={styles.title}>{messages.screenTitle[screen]}</h1>;
}
