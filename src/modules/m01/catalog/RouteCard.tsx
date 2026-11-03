// Thẻ tuyến của SCR-M01-001 (E-SCR-M01-001-06…14; US-M01-02 mục 1, 4). Ảnh lỗi → placeholder trung tính,
// thẻ vẫn bấm được; trường vắng không có chữ thay thế (SR-SCR-M01-001-005).
import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import { formatDistanceKm } from '../format';
import { messagesFor } from '../i18n';
import styles from './RouteCard.module.css';
import { needsOfflinePackageMark } from './selectableRoutes';

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
        <h2 className={styles.name}>{route.name[language]}</h2>
        <p className={styles.description}>{route.shortDescription[language]}</p>
        <p className={styles.stats}>
          {messages.catalog.stats({
            n: route.checkpointCount,
            km: formatDistanceKm(route.distanceKm, language),
            min: route.durationMin,
          })}
        </p>
        <p className={styles.chips}>
          <span className={styles.chip}>{messages.labels.difficulty[route.difficulty]}</span>
          {needsOfflinePackageMark(route) && (
            <span className={`${styles.chip} ${styles.offlineChip}`}>{messages.catalog.offlineNeeded}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
