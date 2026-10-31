// Bản đang hiện trên editor (BR-M03-E16, F06; tasks T120): bản nháp chờ (MSG-VERSION-DRAFT) hoặc bản đang hiển
// thị cho du khách (MSG-VERSION-PUBLISHED). Mục chưa từng lưu thì không có dòng này. Dùng chung cho ba editor.
import { formatMessage } from '../messages/catalog';
import styles from './VersionNote.module.css';

export function VersionNote({ hasDraft, hasPublished }: { hasDraft: boolean; hasPublished: boolean }) {
  if (!hasDraft && !hasPublished) return null;
  return <p className={styles.note}>{formatMessage(hasDraft ? 'MSG-VERSION-DRAFT' : 'MSG-VERSION-PUBLISHED')}</p>;
}
