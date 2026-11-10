// SCR-M01-001 Danh mục tuyến (FR-M01-002; US-M01-02; visitor-ui-flow §2). Trạng thái theo screen spec §4:
// Loading, Has routes, Empty, Stale/offline, Source unavailable, Image failed. "Route removed" (US5) là hệ quả của
// việc lọc lại sau mỗi lần đọc thành công.
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useM01Messages } from '../i18n/useM01Messages';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import { SourceNotice } from '../layout/VisitorLayout';
import { useSignedUrls } from '../media/useSignedUrls';
import styles from './CatalogPage.module.css';
import { useCatalog } from './catalogStore';
import { RouteCard } from './RouteCard';
import { selectableRoutes } from './selectableRoutes';

const LOADING_PLACEHOLDERS = 3;

export function CatalogPage() {
  const { source, media } = useM01Services();
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const catalog = useCatalog(source);

  const routes = catalog.status === 'ready' ? selectableRoutes(catalog.routes, language) : [];
  const thumbnails = useSignedUrls(
    media,
    routes.map((route) => route.thumbnail.sourceRef),
  );
  const busy = catalog.status === 'idle' || catalog.status === 'loading' || ('refreshing' in catalog && catalog.refreshing);

  return (
    <>
      <div className={styles.hero}>
        <TintIcon name="hills" className={styles.hills} />
        <h1 className={styles.title}>
          <TintIcon name="leaf" className={styles.leaf} />
          {messages.screenTitle.catalog}
        </h1>
        <Link className={styles.recommendLink} to={PATHS.recommend}>
          <TintIcon name="compass" />
          {messages.nav.recommend}
          <TintIcon name="chevron-right" className={styles.chevron} />
        </Link>
      </div>

      {catalog.status === 'ready' && catalog.stale && (
        <SourceNotice>
          <p className={styles.notice}>{messages.catalog.stale}</p>
        </SourceNotice>
      )}

      {catalog.status === 'unavailable' && <p className={styles.message}>{messages.catalog.sourceUnavailable}</p>}
      {catalog.status === 'ready' && routes.length === 0 && <p className={styles.message}>{messages.catalog.empty}</p>}

      <ul className={styles.list} data-testid="catalog-list" aria-busy={busy}>
        {catalog.status === 'loading' || catalog.status === 'idle'
          ? Array.from({ length: LOADING_PLACEHOLDERS }, (_, index) => (
              <li key={index} className={styles.placeholderCard} aria-hidden="true" />
            ))
          : routes.map((route) => (
              <li key={route.routeId}>
                <RouteCard route={route} language={language} thumbnailUrl={thumbnails.get(route.thumbnail.sourceRef)} />
              </li>
            ))}
      </ul>
    </>
  );
}
