// Danh sách audio/video của nội dung live (tasks T055; BR-M02-016, 026; FR-M02-011; E-SCR-M02-002-06, -07, -14).
// Chỉ phát khi bấm: `controls`, `preload="none"`, không autoplay. Mỗi tệp gắn key theo `sourceRef`, nên tệp bị bỏ khi
// đổi VI/EN được gỡ khỏi DOM và dừng phát. Tệp không ký được hoặc không phát được → thông báo lỗi tệp.
import { useState } from 'react';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM02Messages } from '../i18n/useM02Messages';
import type { MediaItem } from './mediaFilter';
import styles from './MediaList.module.css';

function MediaEntry({ item, url }: { item: MediaItem; url: string | undefined }) {
  const messages = useM02Messages();
  const [failed, setFailed] = useState(false);
  const broken = failed || !url;
  const Player = item.resource.type === 'AUDIO' ? 'audio' : 'video';
  return (
    <li className={`${styles.item} ${item.resource.type === 'AUDIO' ? styles.audio : styles.video}`} data-media={item.resource.sourceRef}>
      <span className={styles.label}>
        <TintIcon name={item.resource.type === 'AUDIO' ? 'headphones' : 'video'} />
        {item.label}
      </span>
      {broken ? (
        <p className={styles.error}>{messages.content.mediaError}</p>
      ) : (
        <Player className={styles.player} src={url} controls preload="none" onError={() => setFailed(true)} aria-label={item.label} />
      )}
    </li>
  );
}

export function MediaList({ items, urls }: { items: readonly MediaItem[]; urls: Map<string, string> }) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <MediaEntry key={item.resource.sourceRef} item={item} url={urls.get(item.resource.sourceRef)} />
      ))}
    </ul>
  );
}
