// SCR-M02-002 — Nội dung điểm tham quan (tasks T056; screen spec §3–§6). Nhận kết quả quét qua router state; không có
// (tải lại trang, chạm điểm đã quét) thì gọi viewScannedPoint — không ghi lượt ghé. Nội dung là của đúng mã đã quét
// (BR-M02-014). Online `VALID` → nội dung live + audio/video lọc theo ngôn ngữ; lỗi nguồn → nội dung gói, không bao giờ
// có media (BR-M02-016). Lỗi ảnh hay media không gỡ lượt ghé đã ghi (SC-M02-004).
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { PATHS } from '../../../app/paths';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import { FinalPrompt } from '../end/FinalPrompt';
import { useEndTrip } from '../end/useEndTrip';
import { FieldLayout, FieldNotice } from '../layout/FieldLayout';
import type { ScanResult } from '../scan/processScan';
import { viewScannedPoint } from '../scan/viewScannedPoint';
import type { ContentRouteState } from '../session/TripPage';
import styles from './ContentPage.module.css';
import { filterMedia } from './mediaFilter';
import { MediaList } from './MediaList';
import { ScanNotice } from './ScanNotice';
import { selectContentSource, type ContentView } from './selectContentSource';
import { usePackageImage } from './usePackageImage';
import { useSignedUrls } from './useSignedImage';

/** Giờ thiết bị dạng hh:mm dd/mm/yyyy (OQ-SCR-M02-002-003). */
function visitTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Ảnh lỗi hoặc thiếu → ô trung tính cùng kích thước (screen spec "Media error"; research R-12). */
function ImageOrPlaceholder({ src, alt }: { src: string | null | undefined; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (src === undefined) return <div className={styles.imageSlot} aria-hidden="true" />;
  if (!src || failed) return <div className={`${styles.imageSlot} ${styles.placeholder}`} data-image="placeholder" aria-hidden="true" />;
  return <img className={styles.image} src={src} alt={alt} onError={() => setFailed(true)} />;
}

function PackageImage({ routeId, contentVersion, sourceRef, alt }: { routeId: string; contentVersion: number; sourceRef: string; alt: string }) {
  return <ImageOrPlaceholder src={usePackageImage(routeId, contentVersion, sourceRef)} alt={alt} />;
}

function LiveArticle({ view }: { view: Extract<ContentView, { kind: 'LIVE' }> }) {
  const messages = useM02Messages();
  const language = useM02DisplayLanguage();
  const urls = useSignedUrls([...view.images, ...view.media.map((m) => m.sourceRef)]);
  const objectName = view.objectName[language];
  const media = filterMedia(view.media, language, messages);
  return (
    <>
      <ArticleHeader checkpointName={view.checkpointName[language]} objectName={objectName} />
      {view.images.map((ref) => (
        <ImageOrPlaceholder key={ref} src={urls === undefined ? undefined : (urls.get(ref) ?? null)} alt={objectName} />
      ))}
      <p className={styles.introduction}>{view.introduction[language].introductionText}</p>
      {urls && <MediaList items={media} urls={urls} />}
    </>
  );
}

function PackageArticle({ view }: { view: Extract<ContentView, { kind: 'PACKAGE' }> }) {
  const language = useM02DisplayLanguage();
  const objectName = view.objectName[language];
  return (
    <>
      <ArticleHeader checkpointName={view.checkpointName[language]} objectName={objectName} />
      {view.images.sourceRefs.map((ref) => (
        <PackageImage key={ref} routeId={view.images.routeId} contentVersion={view.images.contentVersion} sourceRef={ref} alt={objectName} />
      ))}
      <p className={styles.introduction}>{view.introduction[language].introductionText}</p>
    </>
  );
}

function ArticleHeader({ checkpointName, objectName }: { checkpointName: string; objectName: string }) {
  return (
    <div className={styles.header}>
      <p className={styles.checkpoint}>{checkpointName}</p>
      <h1 className={styles.object}>{objectName}</h1>
    </div>
  );
}

function Notice({ tone, children, role = 'status' }: { tone: 'info' | 'warning' | 'error' | 'success'; children: ReactNode; role?: 'status' | 'alert' }) {
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role={role}>
      {children}
    </div>
  );
}

function ContentNotices({ scan, view }: { scan: ScanResult; view: ContentView | undefined }) {
  const messages = useM02Messages();
  const language = useM02DisplayLanguage();
  return (
    <FieldNotice>
      {scan.visitCreated && (
        <Notice tone="success">
          <p className={styles.noticeText}>{messages.trip.visitRecorded}</p>
        </Notice>
      )}
      {scan.display.kind === 'PACKAGE' && (
        <Notice tone="info">
          <p className={styles.noticeText}>{messages.notice.sourceFailureInJourney}</p>
        </Notice>
      )}
      {view?.kind === 'PACKAGE' && view.outdated && (
        <Notice tone="warning">
          <p className={styles.noticeText}>{messages.content.outdatedPackage}</p>
        </Notice>
      )}
      {view?.kind === 'NO_OFFLINE' && (
        <Notice tone="info" role="alert">
          <p className={styles.noticeText}>
            <strong>{view.checkpointName[language]}</strong>
          </p>
          <p className={styles.noticeText}>
            {view.reason === 'ONLINE_ONLY' ? messages.content.needsNetwork : messages.notice.noOfflineResource}
          </p>
        </Notice>
      )}
      {(view?.kind === 'CLOSED' || view?.kind === 'INVALID' || view?.kind === 'CONNECTION_NEEDED') && <ScanNotice kind={view.kind} />}
      {scan.freeVisitor && (
        <Notice tone="info">
          <p className={styles.noticeText}>{messages.notice.freeVisitor}</p>
          <Link className={styles.noticeLink} to={PATHS.catalog}>
            {messages.qrLink.chooseRoute}
          </Link>
        </Notice>
      )}
    </FieldNotice>
  );
}

export function ContentPage() {
  const messages = useM02Messages();
  const { qrIdentifier = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as ContentRouteState;
  const [scan, setScan] = useState<ScanResult | undefined>(state.scan);
  const [view, setView] = useState<ContentView | undefined>(undefined);
  const { endTrip, ending } = useEndTrip();
  const [promptDismissed, setPromptDismissed] = useState(false);
  // Lượt ghé điểm cuối vừa ghi lần đầu → hỏi kết thúc chuyến một lần (BR-M02-021; FR-M02-023)
  const promptSessionId = scan?.finalPromptNeeded && !promptDismissed ? scan.session?.sessionId : undefined;
  const continueTrip = () => {
    setPromptDismissed(true);
    // Ghi đè router state để quay lại / tải lại trang không hỏi lần nữa
    if (scan) navigate(location.pathname, { replace: true, state: { scan: { ...scan, finalPromptNeeded: false } } satisfies ContentRouteState });
  };

  // Không có kết quả quét trong router state: xem lại, không ghi lượt ghé (scan-resolution §4)
  useEffect(() => {
    if (state.scan) return undefined;
    let cancelled = false;
    void viewScannedPoint(qrIdentifier).then((result) => {
      if (!cancelled) setScan(result);
    });
    return () => {
      cancelled = true;
    };
  }, [qrIdentifier, state.scan]);

  useEffect(() => {
    if (!scan) return undefined;
    let cancelled = false;
    setView(undefined);
    void selectContentSource(scan).then((next) => {
      if (!cancelled) setView(next);
    });
    return () => {
      cancelled = true;
    };
  }, [scan]);

  return (
    <FieldLayout surface="reader">
      {scan && <ContentNotices scan={scan} view={view} />}
      <article className={styles.article} data-qr={qrIdentifier} data-view={view?.kind ?? 'LOADING'}>
        {!view && (
          <p className={styles.loading} role="status">
            {messages.trip.lookingUp}
          </p>
        )}
        {view?.kind === 'LIVE' && <LiveArticle view={view} />}
        {view?.kind === 'PACKAGE' && <PackageArticle view={view} />}
        {scan?.visit && <p className={styles.visitTime}>{messages.content.scannedAt({ time: visitTime(scan.visit.checkedInAt) })}</p>}
      </article>
      <Link className={styles.back} to={PATHS.m02SessionEntry}>
        {messages.content.back}
      </Link>
      {promptSessionId && <FinalPrompt onEnd={() => void endTrip(promptSessionId)} onContinue={continueTrip} busy={ending} />}
    </FieldLayout>
  );
}
