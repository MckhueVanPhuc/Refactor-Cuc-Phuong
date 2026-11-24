// SCR-M01-001 Danh mục tuyến (FR-M01-002; US-M01-02; visitor-ui-flow §2). Trạng thái theo screen spec §4:
// Loading, Has routes, Empty, Stale/offline, Source unavailable, Image failed. "Route removed" (US5) là hệ quả của
// việc lọc lại sau mỗi lần đọc thành công.
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import { emitMascotEvent, MascotFigure, MascotSlot } from '../../../shared/mascot/index';
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
/** Danh mục còn tải sau chừng này → Mila nói câu chờ (Behavior Matrix MAS-B-005; contract `slow`) */
const SLOW_MS = 600;

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
  useCatalogMascotSignals(catalog.status, routes.length, catalog.status === 'ready' && catalog.stale);

  return (
    <>
      {/* Hero hai cột (design-system §9.3a, v1.3): trái tiêu đề và "Gợi ý tuyến"; phải dải đồi và Mila đứng trên đồi;
          bong bóng của Mila mở ở hàng dưới cùng, Mila không đổi chỗ */}
      <div className={styles.hero}>
        <h1 className={styles.title}>
          <TintIcon name="leaf" className={styles.leaf} />
          {messages.screenTitle.catalog}
        </h1>
        <Link className={styles.recommendLink} to={PATHS.recommend}>
          <TintIcon name="compass" />
          {messages.nav.recommend}
          <TintIcon name="chevron-right" className={styles.chevron} />
        </Link>
        <TintIcon name="hills" className={styles.hills} />
        {/* Mila: lớp phủ giới thiệu và đứng ở hero (spec-Mascot §5.1; specs/005 T035, R-29) */}
        <MascotSlot id="catalog-hero" modes={['INTRO', 'DOCK']} size="catalog" />
      </div>

      {catalog.status === 'ready' && catalog.stale && (
        <SourceNotice>
          <p className={styles.notice}>{messages.catalog.stale}</p>
        </SourceNotice>
      )}

      {/* Mila minh họa cạnh câu cố định (MAS-B-006 rỗng, 007 lỗi nguồn; spec-Mascot §5.1 INLINE) */}
      {catalog.status === 'unavailable' && (
        <div className={styles.withMila}>
          <MascotFigure pose="confused" />
          <p className={styles.message}>{messages.catalog.sourceUnavailable}</p>
        </div>
      )}
      {catalog.status === 'ready' && routes.length === 0 && (
        <div className={styles.withMila}>
          <MascotFigure pose="peek" />
          <p className={styles.message}>{messages.catalog.empty}</p>
        </div>
      )}

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

/**
 * Tín hiệu cho Mila (specs/005 contracts/mascot-event-contract.md §3): trạng thái danh mục khi đổi, và lần cuộn đầu tiên
 * (du khách đang xem, Mila thôi gợi ý). Chỉ phát sự kiện, không đổi hành vi danh mục.
 */
function useCatalogMascotSignals(status: string, count: number, stale: boolean) {
  useEffect(() => {
    if (status === 'ready' || status === 'unavailable') {
      emitMascotEvent({ type: 'm01.catalog.loaded', status, count, stale, slow: false });
      return undefined;
    }
    // Còn tải sau 600 ms: báo `slow` một lần cho lần tải này (MAS-B-005)
    const id = window.setTimeout(() => emitMascotEvent({ type: 'm01.catalog.loaded', status: 'loading', count: 0, stale: false, slow: true }), SLOW_MS);
    return () => window.clearTimeout(id);
  }, [status, count, stale]);
  const interacted = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (interacted.current) return;
      interacted.current = true;
      emitMascotEvent({ type: 'm01.catalog.interacted' });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}
