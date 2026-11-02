// SCR-M01-003 Chi tiết tuyến & Chuẩn bị (FR-M01-003, 014; US-M01-06; visitor-ui-flow §2). Online: đủ trường bắt
// buộc, ẩn trường tùy chọn vắng; offline có gói: chữ cốt lõi đã lưu kèm thời điểm lưu, ảnh không lưu → placeholder.
// Nút "Bắt đầu" (US4); trạng thái gói và dialog quyết định offline (US6) gắn vào sau.
import { useId } from 'react';
import { Link, useParams } from 'react-router';
import { PATHS } from '../../../app/paths';
import { useM01Services } from '../api/services';
import { formatCapturedAt, formatDistanceKm } from '../format';
import { useM01Messages } from '../i18n/useM01Messages';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import { SourceNotice } from '../layout/VisitorLayout';
import { usePackageImageUrl } from '../media/usePackageImageUrl';
import { useSignedUrls } from '../media/useSignedUrls';
import { onlineDetailView, savedDetailView, type DetailView } from './detailView';
import { continueWithoutDecision } from './offlineDecision';
import { StartPanel } from './StartPanel';
import styles from './RouteDetailPage.module.css';
import { useRouteDetail } from './useRouteDetail';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 className={styles.sectionTitle} id={id}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailBody({ view }: { view: DetailView }) {
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const sections = messages.routeDetail.sections;
  const { media } = useM01Services();
  const onlineMap = view.routeMap?.kind === 'online' ? view.routeMap : undefined;
  const signed = useSignedUrls(media, [...view.gallery.map((image) => image.sourceRef), ...(onlineMap ? [onlineMap.sourceRef] : [])]);
  const packageMapUrl = usePackageImageUrl(view.routeMap?.kind === 'package' ? view.routeMap : undefined);
  const mapUrl = onlineMap ? signed.get(onlineMap.sourceRef) : packageMapUrl;
  const stopsTitleId = useId();

  return (
    <div className={styles.content}>
      {view.gallery.length > 0 ? (
        <ul className={styles.gallery} data-testid="gallery">
          {view.gallery.map((image, index) => {
            const url = signed.get(image.sourceRef);
            return (
              <li key={`${image.sourceRef}-${index}`}>
                {url ? (
                  <img className={styles.cover} src={url} alt={image.caption ?? ''} loading={index === 0 ? 'eager' : 'lazy'} />
                ) : (
                  <div className={styles.coverPlaceholder} aria-hidden="true" />
                )}
                {image.caption && <p className={styles.caption}>{image.caption}</p>}
              </li>
            );
          })}
        </ul>
      ) : (
        // Không có ảnh để hiện (gallery rỗng, hoặc offline vì ảnh không được lưu): khối trung tính, không tự dựng ảnh
        <div className={styles.coverPlaceholder} data-testid="cover-placeholder" aria-hidden="true" />
      )}

      {view.facts && (
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>{sections.distance}</dt>
            <dd>{messages.routeDetail.distanceValue({ km: formatDistanceKm(view.facts.distanceKm, language) })}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{sections.duration}</dt>
            <dd>{messages.routeDetail.durationValue({ min: view.facts.durationMin })}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{sections.difficulty}</dt>
            <dd>{messages.labels.difficulty[view.facts.difficulty]}</dd>
          </div>
        </dl>
      )}

      {view.safetyWarning && (
        <div className={styles.safety} role="note" aria-label={sections.safetyWarning}>
          <h2 className={styles.sectionTitle}>{sections.safetyWarning}</h2>
          <p className={styles.text}>{view.safetyWarning}</p>
        </div>
      )}

      {view.description && (
        <Section title={sections.description}>
          <p className={styles.text}>{view.description}</p>
        </Section>
      )}
      <Section title={sections.startingPoint}>
        <p className={styles.text}>{view.startingPoint}</p>
      </Section>
      {view.participationRequirements && (
        <Section title={sections.participationRequirements}>
          <p className={styles.text}>{view.participationRequirements}</p>
        </Section>
      )}
      {view.preparation && (
        <Section title={sections.preparation}>
          <p className={styles.text}>{view.preparation}</p>
        </Section>
      )}
      {view.bestTime && (
        <Section title={sections.bestTime}>
          <p className={styles.text}>{view.bestTime}</p>
        </Section>
      )}
      {view.highlights.length > 0 && (
        <Section title={sections.highlights}>
          <ul className={styles.bullets}>
            {view.highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </Section>
      )}
      {view.routeMap && mapUrl && (
        <Section title={sections.routeMap}>
          <figure className={styles.figure}>
            <img className={styles.cover} src={mapUrl} alt={sections.routeMap} />
            {view.routeMap.caption && <figcaption className={styles.caption}>{view.routeMap.caption}</figcaption>}
          </figure>
        </Section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle} id={stopsTitleId}>
          {sections.checkpoints}
        </h2>
        <ol className={styles.stops} aria-labelledby={stopsTitleId}>
          {view.checkpoints.map((checkpoint) => (
            <li className={styles.stop} key={checkpoint.number}>
              <span className={styles.stopNumber}>{checkpoint.number}</span>
              <span>{checkpoint.name}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function RouteDetailPage() {
  const { routeId = '' } = useParams();
  const { source } = useM01Services();
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const data = useRouteDetail(source, routeId);

  const view =
    data.status === 'online' || data.status === 'localView'
      ? onlineDetailView(data.route, language)
      : data.status === 'saved'
        ? savedDetailView(data.pkg, language)
        : undefined;
  const unavailableName =
    data.status === 'routeUnavailable'
      ? (data.route?.name[language] ?? data.pkg?.routeEssentials.name[language])
      : undefined;
  const title = view?.name ?? unavailableName ?? messages.screenTitle.routeDetail;
  const pkg = data.status === 'online' || data.status === 'saved' ? data.pkg : null;
  // Start có ở mọi trạng thái trừ tuyến đã đóng; đường online/offline do chooseStartPath quyết định
  const canStart = data.status !== 'loading' && data.status !== 'routeUnavailable';

  return (
    <>
      <div className={styles.hero}>
        <Link className={styles.backLink} to={PATHS.catalog}>
          {messages.nav.catalog}
        </Link>
        <h1 className={styles.title}>{title}</h1>
        {view?.needsPackage && <span className={styles.heroChip}>{messages.catalog.offlineNeeded}</span>}
      </div>

      {(data.status === 'saved' || data.status === 'localView' || pkg?.versionStatus === 'OUTDATED') && (
        <SourceNotice>
          <div className={styles.notices}>
            {pkg?.versionStatus === 'OUTDATED' && <p className={styles.notice}>{messages.routeDetail.outdated}</p>}
            {data.status !== 'online' && <p className={styles.notice}>{messages.routeDetail.sourceErrorUsingSaved}</p>}
            {view?.capturedAt && (
              <p className={styles.notice}>
                {messages.routeDetail.savedAt({ time: formatCapturedAt(view.capturedAt, language) })}
              </p>
            )}
          </div>
        </SourceNotice>
      )}

      {data.status === 'loading' && <div className={styles.coverPlaceholder} aria-busy="true" />}
      {data.status === 'sourceUnavailable' && <p className={styles.message}>{messages.catalog.sourceUnavailable}</p>}
      {data.status === 'routeUnavailable' && <p className={styles.notice}>{messages.routeDetail.routeUnavailable}</p>}
      {canStart && (
        <div className={styles.startArea}>
          <StartPanel
            routeId={routeId}
            needsDecision={Boolean(view?.needsPackage) && !pkg}
            requestOfflineDecision={continueWithoutDecision}
          />
        </div>
      )}
      {view && <DetailBody view={view} />}
    </>
  );
}
