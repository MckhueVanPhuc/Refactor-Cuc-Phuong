// Thẻ tuyến của SCR-M01-001 (E-SCR-M01-001-06…14; US-M01-02 mục 1, 4). Ảnh lỗi → placeholder trung tính,
// thẻ vẫn bấm được; trường vắng không có chữ thay thế (SR-SCR-M01-001-005).
import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import { TintIcon } from '../../../shared/ui/Icon';
import { formatDistanceKm } from '../format';
import { messagesFor } from '../i18n';
import styles from './RouteCard.module.css';
import { DifficultyBars } from '../layout/DifficultyBars';
import { needsOfflinePackageMark } from './selectableRoutes';

const STAT_ICONS = ['route-stops', 'distance', 'clock'] as const;

export function RouteCard({
  route,
  language,
  thumbnailUrl,
}: {
  route: PublishedRoute;
  language: LanguageCode;
  thumbnailUrl: string | undefined;
}) {
  const messages = messagesFor(language);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = thumbnailUrl !== undefined && !imageFailed;
  const stats = messages.catalog.stats({
    n: route.checkpointCount,
    km: formatDistanceKm(route.distanceKm, language),
    min: route.durationMin,
  });

  return (
    <Link className={styles.card} to={PATHS.routeDetail(route.routeId)}>
      <div className={styles.media}>
        {showImage ? (
          <img
            className={styles.thumbnail}
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={styles.thumbnail} data-testid="thumbnail-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>
          <span className={styles.pin}>
            <TintIcon name="map-pin" />
          </span>
          {route.name[language]}
        </h2>
        <p className={styles.description}>{route.shortDescription[language]}</p>
        <p className={styles.stats}>
          {/* Chữ đầy đủ theo bảng copy cho trình đọc màn hình; ba mục có icon chỉ để nhìn */}
          <span className="visually-hidden">{stats}</span>
          <span className={styles.statItems} aria-hidden="true">
            {stats.split(' · ').map((part, index) => (
              <span className={styles.statItem} key={index}>
                <TintIcon name={STAT_ICONS[index] ?? 'clock'} />
                {part}
              </span>
            ))}
          </span>
        </p>
        <p className={styles.chips}>
          <span className={styles.difficulty}>
            <DifficultyBars difficulty={route.difficulty} />
            {messages.labels.difficulty[route.difficulty]}
          </span>
          {needsOfflinePackageMark(route) && (
            <span className={styles.offlineChip}>
              <TintIcon name="hiker" />
              {messages.catalog.offlineNeeded}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
