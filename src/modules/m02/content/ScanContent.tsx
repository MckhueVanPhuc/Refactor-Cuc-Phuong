// Nội dung của một kết quả quét, dùng chung cho SCR-M02-002 (ContentPage) và SCR-M02-004 (QrLinkPage) (tasks T056,
// T082; screen spec SCR-M02-002 §3–§6, SCR-M02-004 E-02). Nội dung là của đúng mã đã quét (BR-M02-014). Online `VALID` →
// nội dung live + audio/video lọc theo ngôn ngữ; lỗi nguồn → nội dung gói, không bao giờ có media (BR-M02-016). Lỗi ảnh
// hay media không gỡ lượt ghé đã ghi (SC-M02-004). Lượt ghé điểm cuối vừa ghi lần đầu → câu hỏi kết thúc chuyến một lần.
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import { FinalPrompt } from '../end/FinalPrompt';
import { useEndTrip } from '../end/useEndTrip';
import { useM02DisplayLanguage, useM02Messages } from '../i18n/useM02Messages';
import { FieldNotice } from '../layout/FieldLayout';
import { FreeVisitorHint } from '../qr-link/FreeVisitorHint';
import type { ScanResult } from '../scan/processScan';
import { filterMedia } from './mediaFilter';
import { MediaList } from './MediaList';
import styles from './ScanContent.module.css';
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

function Notice({ tone, children, role = 'status' }: { tone: 'info' | 'warning' | 'success'; children: ReactNode; role?: 'status' | 'alert' }) {
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
    </FieldNotice>
  );
}

export function ScanContent({
  scan,
  qrIdentifier,
  showBack,
  onPromptContinue,
}: {
  /** `undefined` = đang tra cứu */
  scan: ScanResult | undefined;
  qrIdentifier: string;
  /** "Quay lại" về phiên (SCR-M02-001); khách tự do ở `/q/…` không có phiên để quay lại */
  showBack: boolean;
  /** Việc thêm khi chọn [Đi tiếp] (ContentPage ghi đè router state để không hỏi lại) */
  onPromptContinue?: () => void;
}) {
  const messages = useM02Messages();
  const [view, setView] = useState<ContentView | undefined>(undefined);
  const { endTrip, ending } = useEndTrip();
  const [promptDismissed, setPromptDismissed] = useState(false);
  // Lượt ghé điểm cuối vừa ghi lần đầu → hỏi kết thúc chuyến một lần (BR-M02-021; FR-M02-023)
  const promptSessionId = scan?.finalPromptNeeded && !promptDismissed ? scan.session?.sessionId : undefined;

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
    <>
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
      {/* Gợi ý khách tự do sau nội dung, như mockup-SCR-M02-004: du khách thấy nội dung trước */}
      {scan?.freeVisitor && <FreeVisitorHint />}
      {showBack && (
        <Link className={styles.back} to={PATHS.m02SessionEntry}>
          {messages.content.back}
        </Link>
      )}
      {promptSessionId && (
        <FinalPrompt
          onEnd={() => void endTrip(promptSessionId)}
          onContinue={() => {
            setPromptDismissed(true);
            onPromptContinue?.();
          }}
          busy={ending}
        />
      )}
    </>
  );
}
