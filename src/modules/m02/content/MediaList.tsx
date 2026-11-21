// Danh sách audio/video của nội dung live (tasks T055; BR-M02-016, 026; FR-M02-011; E-SCR-M02-002-06, -07, -14).
// Chỉ phát khi bấm: `controls`, `preload="none"`, không autoplay. Mỗi tệp gắn key theo `sourceRef`, nên tệp bị bỏ khi
// đổi VI/EN được gỡ khỏi DOM và dừng phát. Tệp không ký được hoặc không phát được → thông báo lỗi tệp.
import { useEffect, useRef, useState } from 'react';
import { holdMascotSignal } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM02Messages } from '../i18n/useM02Messages';
import type { MediaItem } from './mediaFilter';
import styles from './MediaList.module.css';

function MediaEntry({ item, url }: { item: MediaItem; url: string | undefined }) {
  const messages = useM02Messages();
  const [failed, setFailed] = useState(false);
  const broken = failed || !url;
  const Player = item.resource.type === 'AUDIO' ? 'audio' : 'video';
  // Mila im lặng khi đang phát (spec-Mascot BR-MAS-08; specs/005 T029). Đếm theo số tệp đang phát: dừng một tệp khi
  // tệp khác còn phát thì Mila vẫn im. Tệp bị gỡ khi đang phát (đổi VI/EN) cũng nhả, để Mila không im mãi.
  const release = useRef<(() => void) | null>(null);
  const onPlay = () => {
    release.current ??= holdMascotSignal(
      'media',
      { type: 'm02.media.playing', mediaType: item.resource.type },
      { type: 'm02.media.stopped' },
    );
  };
  const onStop = () => {
    release.current?.();
    release.current = null;
  };
  useEffect(
    () => () => {
      release.current?.();
      release.current = null;
    },
    [],
  );
  return (
    <li className={`${styles.item} ${item.resource.type === 'AUDIO' ? styles.audio : styles.video}`} data-media={item.resource.sourceRef}>
      <span className={styles.label}>
        <TintIcon name={item.resource.type === 'AUDIO' ? 'headphones' : 'video'} />
        {item.label}
      </span>
      {broken ? (
        <p className={styles.error}>{messages.content.mediaError}</p>
      ) : (
        <Player
          className={styles.player}
          src={url}
          controls
          preload="none"
          onError={() => setFailed(true)}
          onPlay={onPlay}
          onPause={onStop}
          onEnded={onStop}
          aria-label={item.label}
        />
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
