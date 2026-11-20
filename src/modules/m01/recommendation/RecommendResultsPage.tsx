// SCR-M01-002 Gợi ý tuyến — trang kết quả riêng (FR-M01-004; BR-M01-003; screen spec §4 "Results", "Zero result").
// Mọi tuyến chọn được chứa cả ba tag đã chọn, sắp A→Z; 0 kết quả không nới tiêu chí. Tiêu chí lấy từ bộ nhớ của layout
// (HC-007): mở thẳng hoặc tải lại trang khi chưa đủ tiêu chí thì quay về form.
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useCatalog } from '../catalog/catalogStore';
import { RouteCard } from '../catalog/RouteCard';
import { useM01Messages } from '../i18n/useM01Messages';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import { useSignedUrls } from '../media/useSignedUrls';
import { useRecommendationCriteria } from './criteriaContext';
import { chosenLabels, criteriaGroups } from './groups';
import { recommend } from './recommend';
import type { RecommendResultsState } from './RecommendPage';
import styles from './RecommendPage.module.css';

export function RecommendResultsPage() {
  const { source, media } = useM01Services();
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const catalog = useCatalog(source);
  const navigate = useNavigate();
  const location = useLocation();
  const { criteria, focusChoiceOnReturn } = useRecommendationCriteria();

  const routes = catalog.status === 'ready' ? catalog.routes : [];
  const result = recommend(routes, criteria, language);
  const matched = result.kind === 'results' ? result.routes : [];
  const thumbnails = useSignedUrls(
    media,
    matched.map((route) => route.thumbnail.sourceRef),
  );

  if (result.kind !== 'results') return <Navigate to={PATHS.recommend} replace />;

  const labels = chosenLabels(criteriaGroups(messages), criteria);

  // Về form với lựa chọn còn nguyên; mở từ form thì lùi một bước để lịch sử trình duyệt không lặp
  function changeChoices() {
    focusChoiceOnReturn.current = true;
    if ((location.state as RecommendResultsState | null)?.fromForm) void navigate(-1);
    else void navigate(PATHS.recommend, { replace: true });
  }

  // Khi 0 kết quả, "Đổi tiêu chí" nằm trong khối rỗng cùng "Xem tất cả tuyến" (screen spec E-SCR-M01-002-10)
  const zeroResults = catalog.status === 'ready' && matched.length === 0;

  return (
    <>
      {!zeroResults && (
        <button type="button" className={styles.backLink} onClick={changeChoices}>
          <TintIcon name="chevron-left" />
          {messages.recommend.changeChoices}
        </button>
      )}
      <h1 className={styles.title}>
        <TintIcon name="leaf" className={styles.leaf} />
        {messages.recommend.resultsTitle}
      </h1>
      <p className={styles.criteria}>
        {labels.map((label, index) => (
          <span key={label}>
            {index > 0 && <span className="visually-hidden"> · </span>}
            <span className={styles.criterion}>{label}</span>
          </span>
        ))}
      </p>

      {catalog.status === 'unavailable' && <p className={styles.message}>{messages.recommend.sourceUnavailable}</p>}
      {catalog.status === 'ready' && (
        <section aria-live="polite">
          {matched.length > 0 ? (
            <ul className={styles.list}>
              {matched.map((route) => (
                <li key={route.routeId}>
                  <RouteCard route={route} language={language} thumbnailUrl={thumbnails.get(route.thumbnail.sourceRef)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>{messages.recommend.noMatch}</p>
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={changeChoices}>
                  {messages.recommend.changeChoices}
                </button>
                <Link className={styles.secondary} to={PATHS.catalog}>
                  <TintIcon name="star" />
                  {messages.recommend.seeAllRoutes}
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
