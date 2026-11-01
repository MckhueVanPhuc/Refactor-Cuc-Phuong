// SCR-M03-004 Xem lại & Xuất bản (tasks T093, T113; Q-08, C-05; BR-M03-C09, C10, F01, F02, F12, G10).
// Đơn vị điểm dừng/QR và tuyến; ghi chú tác động của bản sửa (tuyến bị ảnh hưởng khi sửa điểm dừng) ở T117.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { Dialog } from '../../../shared/ui/Dialog';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import type { VisitPointEditor } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { publicationUnitType, type PublicationReview, type PublicationUnitType } from '../contracts/publicationReview';
import { CommandOutcome } from '../editor/CommandOutcome';
import layout from '../editor/EditorLayout.module.css';
import type { FlashState } from '../editor/flash';
import { MissingToPublishPanel } from '../editor/MissingToPublishPanel';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { formatMegabytes } from '../messages/format';
import { ADMIN_PATHS } from '../paths';
import { visitPointName } from '../validation/visitPoint';
import { VisitorPreview } from '../visit-points/preview/VisitorPreview';
import styles from './PublicationReviewPage.module.css';

/** Tên mục, đường quay lại editor và các điểm tham quan có trong đơn vị (để xem trước) */
type UnitContext = {
  name: string;
  editorPath: string;
  visitPoints: { qrIdentifier: string; name: string }[];
};

async function loadContext(
  api: ReturnType<typeof useAdminApi>,
  unitType: PublicationUnitType,
  subjectId: string,
): Promise<UnitContext> {
  switch (unitType) {
    case 'CHECKPOINT_FIRST_PUBLICATION':
    case 'CHECKPOINT_REVISION': {
      const editor = await api.getCheckpointEditor(subjectId);
      const content = (editor.draft ?? editor.published)?.content;
      // Lần đầu xuất bản mọi điểm tham quan sẵn sàng còn Nháp (BR-M03-D05)
      const included =
        unitType === 'CHECKPOINT_FIRST_PUBLICATION'
          ? editor.visitPoints.filter((vp) => vp.status === 'NHAP' && vp.readiness.ready)
          : [];
      return {
        name: content?.checkpointName?.vi ?? '',
        editorPath: ADMIN_PATHS.checkpoint(subjectId),
        visitPoints: included.map((vp) => ({ qrIdentifier: vp.qrIdentifier, name: visitPointName(vp.name, vp.creationOrder) })),
      };
    }
    case 'QR_OBJECT': {
      const editor = await api.getVisitPointEditor(subjectId);
      const name = visitPointName((editor.draft ?? editor.published)?.content.objectName?.vi, editor.creationOrder);
      return {
        name,
        editorPath: ADMIN_PATHS.visitPoint(editor.checkpointId, subjectId),
        visitPoints: [{ qrIdentifier: subjectId, name }],
      };
    }
    case 'ROUTE_FIRST_PUBLICATION':
    case 'ROUTE_INFORMATION': {
      const editor = await api.getRouteEditor(subjectId);
      return {
        name: (editor.draft ?? editor.published)?.content.name?.vi ?? '',
        editorPath: ADMIN_PATHS.route(subjectId),
        visitPoints: [],
      };
    }
  }
}

/** Xem trước một điểm tham quan của đơn vị, nạp khi mở (BR-M03-F02 e) */
function VisitPointPreviewToggle({ qrIdentifier, name }: { qrIdentifier: string; name: string }) {
  const api = useAdminApi();
  const [editor, setEditor] = useState<VisitPointEditor | null>(null);
  const [open, setOpen] = useState(false);

  async function toggle() {
    if (!open && !editor) {
      try {
        setEditor(await api.getVisitPointEditor(qrIdentifier));
      } catch {
        return;
      }
    }
    setOpen((value) => !value);
  }

  const content = (editor?.draft ?? editor?.published)?.content;
  const byId = new Map(editor?.media.map((media) => [media.mediaId, media]));
  return (
    <li className={styles.previewItem}>
      <Button onClick={() => void toggle()} aria-expanded={open}>
        Xem trước như du khách: {name}
      </Button>
      {open && editor ? (
        <VisitorPreview
          checkpointName={{ vi: editor.checkpointName ?? '', en: editor.checkpointName ?? '' }}
          connectivityMode={editor.checkpointMode}
          objectName={content?.objectName ?? {}}
          introductionText={content?.introductionText ?? {}}
          media={(content?.mediaItems ?? []).flatMap(({ mediaId }) => {
            const media = byId.get(mediaId);
            return media ? [media] : [];
          })}
        />
      ) : null}
    </li>
  );
}

export function PublicationReviewPage() {
  const { unitType: rawUnitType = '', subjectId = '' } = useParams();
  const parsedUnit = publicationUnitType.safeParse(rawUnitType);
  if (!parsedUnit.success) return <Banner tone="error">{formatMessage('MSG-GENERIC')}</Banner>;
  return <ReviewView key={`${rawUnitType}:${subjectId}`} unitType={parsedUnit.data} subjectId={subjectId} />;
}

function ReviewView({ unitType, subjectId }: { unitType: PublicationUnitType; subjectId: string }) {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();
  const [review, setReview] = useState<PublicationReview | null>(null);
  const [context, setContext] = useState<UnitContext | null>(null);
  const [loadError, setLoadError] = useState<AdminApiError | null>(null);
  const [outcome, setOutcome] = useState<CommandResult<unknown> | null>(null);
  const [transportError, setTransportError] = useState<AdminApiError | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [noSafetyWarningConfirmed, setNoSafetyWarningConfirmed] = useState(false);

  const handleTransport = useCallback(
    (error: unknown) => {
      const apiError = AdminApiError.from(error);
      if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire();
      return apiError;
    },
    [expire],
  );

  /** Review luôn tính trên dữ liệu đã lưu; mở lại sau STALE hoặc khi guard từ chối (BR-M03-F02) */
  const load = useCallback(async () => {
    try {
      const [loadedReview, loadedContext] = await Promise.all([
        api.openPublicationReview({ unitType, subjectId }),
        loadContext(api, unitType, subjectId),
      ]);
      setReview(loadedReview);
      setContext(loadedContext);
      setLoadError(null);
    } catch (error) {
      setLoadError(handleTransport(error));
    }
  }, [api, unitType, subjectId, handleTransport]);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish() {
    if (!review || !context) return;
    setBusy(true);
    setOutcome(null);
    setTransportError(null);
    try {
      const result = await api.publishUnit({
        unitType,
        subjectId,
        reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
        ...(review.noSafetyWarningConfirmationRequired ? { noSafetyWarningConfirmed } : {}),
      });
      setConfirmOpen(false);
      if (result.ok) {
        const state: FlashState = { flash: { messageKey: 'MSG-PUBLISHED' } };
        void navigate(context.editorPath, { state });
        return;
      }
      setOutcome(result);
      // Mục đã đổi hoặc còn thiếu: mở lại review với dữ liệu mới, không xuất bản gì
      if (result.reason === 'STALE' || result.reason === 'VALIDATION') await load();
    } catch (error) {
      setConfirmOpen(false);
      setTransportError(handleTransport(error));
    } finally {
      setBusy(false);
    }
  }

  if (loadError && !review) return <Banner tone="error">{formatMessage(loadError.messageKey)}</Banner>;
  if (!review || !context) return null;

  // Cảnh báo an toàn trống: phải tick xác nhận mới xuất bản được (BR-M03-C09)
  const blocked = review.blockingIssues.length > 0 || (review.noSafetyWarningConfirmationRequired && !noSafetyWarningConfirmed);
  const isSensitive = (change: { fieldLabel: string; after: string }) =>
    review.sensitiveChanges.some((other) => other.fieldLabel === change.fieldLabel && other.after === change.after);
  const firstPublication = unitType === 'ROUTE_FIRST_PUBLICATION' || unitType === 'CHECKPOINT_FIRST_PUBLICATION';
  const leftOut = [
    ...review.leftOutCheckpoints.map((item) => formatMessage('MSG-CHECKPOINT-LEFT-OUT', { tên: item.name })),
    ...review.leftOutQrObjects.map((item) =>
      formatMessage('MSG-QR-LEFT-OUT', { tên: item.name, 'điều còn thiếu': item.missing.join(', ') }),
    ),
  ];

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <div className={layout.titleBlock}>
          <h1 className={layout.title}>Xem lại & Xuất bản</h1>
          <p className={layout.meta}>
            <span>{DISPLAY_NAMES.publicationUnit[unitType]}</span>
            {context.name ? <span>{context.name}</span> : null}
          </p>
        </div>
      </div>

      <CommandOutcome
        result={outcome && !(outcome.ok === false && outcome.reason === 'VALIDATION') ? outcome : null}
        transportError={transportError}
        onReload={() => void load()}
      />

      <div className={layout.columns}>
        <div className={layout.main}>
          <section className={layout.section} aria-labelledby="review-changes-title">
            <h2 id="review-changes-title" className={layout.sectionTitle}>
              So sánh với bản đang hiển thị
            </h2>
            {review.changes.length > 0 ? (
              <div className={layout.tableWrap}>
                <table className={layout.table} aria-label="Thay đổi">
                  <thead>
                    <tr>
                      <th scope="col">Mục</th>
                      <th scope="col">Đang hiển thị</th>
                      <th scope="col">Sau khi xuất bản</th>
                    </tr>
                  </thead>
                  <tbody>
                    {review.changes.map((change, index) => (
                      <tr
                        key={`${change.fieldLabel}:${index}`}
                        className={isSensitive(change) ? styles.sensitive : undefined}
                        data-sensitive={isSensitive(change) ? 'true' : undefined}
                      >
                        <th scope="row" className={styles.rowLabel}>
                          {change.fieldLabel}
                        </th>
                        <td className={styles.value}>{change.before || '—'}</td>
                        <td className={styles.value}>{change.after || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={layout.note}>Không có thay đổi nội dung.</p>
            )}
          </section>

          {review.sensitiveChanges.length > 0 ? (
            <section className={`${layout.section} ${styles.sensitiveSection}`} aria-labelledby="review-sensitive-title">
              <h2 id="review-sensitive-title" className={layout.sectionTitle}>
                Thay đổi cần chú ý
              </h2>
              <ul className={layout.list}>
                {review.sensitiveChanges.map((change, index) => (
                  <li key={`${change.fieldLabel}:${index}`}>
                    <span className={styles.rowLabel}>{change.fieldLabel}</span>: {change.before || '—'} → {change.after || '—'}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {review.affectedRoutes.length > 0 ? (
            <section className={layout.section} aria-labelledby="review-routes-title">
              <h2 id="review-routes-title" className={layout.sectionTitle}>
                Tuyến bị ảnh hưởng
              </h2>
              <ul className={styles.routeList}>
                {review.affectedRoutes.map((route) => (
                  <li key={route.routeId} className={styles.route}>
                    <span className={styles.rowLabel}>{route.routeName}</span>
                    {firstPublication ? null : <span>Trạng thái: {DISPLAY_NAMES.routeStatus[route.routeStatus]}</span>}
                    <span>Gói tải trước ước tính: {formatMegabytes(route.estimatedOfflineSizeBytes)} MB</span>
                    {firstPublication ? null : route.createsNewJourneyVersion ? (
                      <span>Gói tải trước của du khách cần cập nhật; các chuyến đang đi không bị thay đổi.</span>
                    ) : (
                      <span>Hành trình của tuyến không đổi.</span>
                    )}
                    {route.closesAutomatically ? <span>Tuyến sẽ tự đóng tạm.</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {leftOut.length > 0 ? (
            <section className={layout.section} aria-labelledby="review-left-out-title">
              <h2 id="review-left-out-title" className={layout.sectionTitle}>
                Chưa xuất bản lần này
              </h2>
              <ul className={layout.list}>
                {leftOut.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {review.impactNotes.length > 0 ? (
            <section className={layout.section} aria-labelledby="review-notes-title">
              <h2 id="review-notes-title" className={layout.sectionTitle}>
                Lưu ý
              </h2>
              <ul className={layout.list}>
                {review.impactNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {context.visitPoints.length > 0 ? (
            <section className={layout.section} aria-labelledby="review-preview-title">
              <h2 id="review-preview-title" className={layout.sectionTitle}>
                Xem trước
              </h2>
              <ul className={styles.previewList}>
                {context.visitPoints.map((vp) => (
                  <VisitPointPreviewToggle key={vp.qrIdentifier} qrIdentifier={vp.qrIdentifier} name={vp.name} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className={layout.aside}>
          <MissingToPublishPanel issues={review.blockingIssues} />
          {review.noSafetyWarningConfirmationRequired ? (
            <div className={layout.section}>
              <Checkbox
                label="Tôi xác nhận tuyến không có cảnh báo an toàn cần nêu"
                checked={noSafetyWarningConfirmed}
                onChange={setNoSafetyWarningConfirmed}
              />
            </div>
          ) : null}
          <div className={layout.formActions}>
            <Button onClick={() => void navigate(context.editorPath)}>Quay lại sửa</Button>
            <Button variant="primary" disabled={blocked || busy} onClick={() => setConfirmOpen(true)}>
              Xuất bản
            </Button>
          </div>
        </aside>
      </div>

      <Dialog
        open={confirmOpen}
        title={formatMessage('MSG-CONFIRM-PUBLISH', { 'tên mục': context.name })}
        safeLabel="Quay lại"
        confirmLabel="Xuất bản"
        confirmDisabled={busy}
        onSafe={() => setConfirmOpen(false)}
        onConfirm={() => void publish()}
      />
    </div>
  );
}

export default PublicationReviewPage;
