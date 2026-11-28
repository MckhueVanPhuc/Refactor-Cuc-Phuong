// SCR-M01-002 Gợi ý tuyến — trang kết quả riêng (FR-M01-004; BR-M01-003; screen spec §4 "Results", "Zero result").
// Ở mỗi nhóm có ý được chọn, tuyến chứa ít nhất một ý (HOẶC trong nhóm, VÀ giữa nhóm; spec-M01 v3.3), sắp A→Z; 0 kết
// quả không nới tiêu chí. Tiêu chí lấy từ bộ nhớ của layout (HC-007); không chọn gì thì là mọi tuyến chọn được.
import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { emitMascotEvent, MascotFigure, MascotSlot } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useCatalog } from '../catalog/catalogStore';
import { RouteCard } from '../catalog/RouteCard';
import { useM01Messages } from '../i18n/useM01Messages';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import { useSignedUrls } from '../media/useSignedUrls';
import { useRecommendationCriteria } from './criteriaContext';
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
  const { criteria, focusChoiceOnReturn, leftResults } = useRecommendationCriteria();

  const routes = catalog.status === 'ready' ? catalog.routes : [];
  const matched = recommend(routes, criteria, language).routes;
  const thumbnails = useSignedUrls(
    media,
    matched.map((route) => route.thumbnail.sourceRef),
  );

  // Mila phản ứng với kết quả (MAS-B-011) khi danh sách đã tính xong; không đổi kết quả
  const resolvedCount = catalog.status === 'ready' ? matched.length : null;
  useEffect(() => {
    if (resolvedCount !== null) emitMascotEvent({ type: 'm01.recommend.resolved', count: resolvedCount });
  }, [resolvedCount]);

  // Đã mở trang kết quả: form mở lại bằng quay lui ("Đổi tiêu chí", Back) thì Mila không nói (spec-Mascot v1.11).
  // Đặt lúc mở, không lúc rời: form đọc cờ khi render, trước cleanup của trang này.
  useEffect(() => {
    leftResults.current = true;
  }, [leftResults]);

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
      <div className={styles.head}>
        <h1 className={styles.title}>
          <TintIcon name="leaf" className={styles.leaf} />
          {messages.recommend.resultsTitle}
        </h1>
        {/* Mila đứng cạnh tiêu đề khi có kết quả (spec-Mascot v1.5 §5.1, DOCK); không có kết quả thì ô trống, không chiếm chỗ */}
        <MascotSlot id="recommend-head" modes={['DOCK']} size="recommend" />
      </div>
      {/* Không hiện lại các tiêu chí đã chọn trên trang kết quả (chủ dự án 2026-11-28); "Đổi tiêu chí" mở lại form với lựa chọn còn nguyên */}

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
              {/* Mila minh họa cạnh câu cố định (MAS-B-012, 013: chỉ hình từ v1.2, không thêm nút) */}
              <div className={styles.withMila}>
                <MascotFigure pose="think" />
                <p>{messages.recommend.noMatch}</p>
              </div>
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
