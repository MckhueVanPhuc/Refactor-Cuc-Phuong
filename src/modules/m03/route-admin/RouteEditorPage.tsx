// SCR-M03-002 Biên tập tuyến (tasks T108; Q-03, Q-04, C-01, C-04, C-07; BR-M03-C01–C17, T01–T09, F11, L03).
// Bốn bước, một state form, một nút "Lưu bản nháp"; panel "Còn thiếu để xuất bản" luôn hiện.
// Tuyến đã xuất bản mở bản nháp chờ nếu có, ngược lại bản đã xuất bản (T122); lịch sử/khôi phục ở US8 (T150).
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { stashDraft, useSessionExpiry } from '../auth/useSessionExpiry';
import type { RouteEditor } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { CommandOutcome } from '../editor/CommandOutcome';
import { confirmation } from '../editor/confirmations';
import layout from '../editor/EditorLayout.module.css';
import { useFlash, type FlashState } from '../editor/flash';
import { MissingToPublishPanel } from '../editor/MissingToPublishPanel';
import { ReasonDialog } from '../editor/ReasonDialog';
import { useDraftForm } from '../editor/useDraftForm';
import { useFieldIssues } from '../editor/useFieldIssues';
import { UnsavedChangesDialog, allowNextNavigation, useUnsavedChangesGuard } from '../editor/useUnsavedChangesGuard';
import { VersionNote } from '../editor/VersionNote';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { ADMIN_PATHS } from '../paths';
import { routePublishIssues } from '../validation/publishGaps';
import { normalizeRouteContent, routeSaveIssues } from '../validation/route';
import {
  EMPTY_ROUTE_FORM,
  STEPS,
  fromRouteEditor,
  mediaSettingsOf,
  publishContextOf,
  stepOf,
  toRouteContent,
  type RouteForm,
  type StepId,
} from './routeForm';
import { saveNewRoute } from './firstSave';
import { CardStep } from './steps/CardStep';
import { CheckpointsStep } from './steps/CheckpointsStep';
import { DetailsStep } from './steps/DetailsStep';
import { TagsStep } from './steps/TagsStep';
import styles from './RouteEditorPage.module.css';

const NEW_ID = 'new';

/** Mỗi tuyến (và form mới) là một phiên editor riêng: đổi URL thì dựng lại state */
export function RouteEditorPage() {
  const { routeId = NEW_ID } = useParams();
  return <RouteEditorView key={routeId} routeId={routeId === NEW_ID ? undefined : routeId} />;
}

function RouteEditorView({ routeId }: { routeId: string | undefined }) {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();
  const [flash, clearFlash, flashWarning] = useFlash();
  const uploadSummary = useRef<{ failedFiles: string[]; total: number } | null>(null);
  const [editor, setEditor] = useState<RouteEditor | null>(null);
  const [loadError, setLoadError] = useState<AdminApiError | null>(null);
  const [step, setStep] = useState<StepId>('card');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionOutcome, setActionOutcome] = useState<CommandResult<unknown> | null>(null);
  const restoreKey = `route:${routeId ?? NEW_ID}`;
  const lastSave = useRef<CommandResult<{ routeId: string }> | null>(null);

  const save = useCallback(
    async (state: RouteForm) => {
      if (!routeId) {
        // Tuyến mới: tạo tuyến, tải ảnh đã chọn, lưu lại kèm ảnh — một lần bấm (D-25)
        const created = await saveNewRoute(api, state);
        uploadSummary.current = { failedFiles: created.failedFiles, total: created.total };
        lastSave.current = created.result;
        return created.result;
      }
      const result = await api.saveRouteDraft({
        ...(routeId ? { routeId } : {}),
        ...(editor ? { expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision } } : {}),
        content: toRouteContent(state),
        mediaSettings: mediaSettingsOf(state),
      });
      lastSave.current = result;
      return result;
    },
    [api, routeId, editor],
  );

  const form = useDraftForm<RouteForm, { routeId: string }>({ initial: EMPTY_ROUTE_FORM, save, restoreKey });
  const guard = useUnsavedChangesGuard(restoreKey, form.isDirty);
  const id = routeId ?? NEW_ID;

  const handleTransport = useCallback(
    (error: unknown) => {
      const apiError = AdminApiError.from(error);
      if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire({ key: restoreKey, state: form.state });
      return apiError;
    },
    [expire, form.state, restoreKey],
  );

  // Chỉ nạp lại khi đổi tuyến; form.reset/rebase ổn định
  const load = useCallback(
    async (mode: 'open' | 'refresh' | 'reload') => {
      if (!routeId) return;
      try {
        const loaded = await api.getRouteEditor(routeId);
        setEditor(loaded);
        setLoadError(null);
        // Mở lần đầu: form theo dữ liệu đã lưu, trừ khi vừa lấy lại chữ chưa lưu (phiên hết hạn, tạo điểm dừng mới).
        // "Tải lại" sau STALE: nạp bản mới nhất, bỏ chữ đang gõ (BR-M03-F06).
        if (mode === 'reload') form.reset(fromRouteEditor(loaded));
        if (mode === 'open') {
          if (form.isDirty) form.rebase(fromRouteEditor(loaded));
          else form.reset(fromRouteEditor(loaded));
        }
      } catch (error) {
        setLoadError(handleTransport(error));
      }
    },
    [api, routeId],
  );

  useEffect(() => {
    void load('open');
  }, [load]);

  useEffect(() => {
    if (form.transportError?.messageKey === 'MSG-SESSION-EXPIRED') expire({ key: restoreKey, state: form.state });
  }, [form.transportError]);

  const { state, update } = form;
  const content = useMemo(() => toRouteContent(state), [state]);
  const clientSaveIssues = useMemo(
    () =>
      routeSaveIssues(id, normalizeRouteContent(content), {
        checkpointName: (checkpointId) => state.checkpoints.find((item) => item.checkpointId === checkpointId)?.name ?? '',
      }),
    [id, content, state.checkpoints],
  );
  const publishIssues = useMemo(() => routePublishIssues(id, content, publishContextOf(state)), [id, content, state]);
  const serverIssues = form.outcome && !form.outcome.ok && form.outcome.reason === 'VALIDATION' ? form.outcome.issues : [];
  const fields = useFieldIssues([...serverIssues, ...clientSaveIssues]);
  const archived = editor?.status === 'LUU_TRU';
  const title = editor ? state.name.vi.trim() || 'Tuyến chưa đặt tên' : 'Tuyến mới';
  // Lần đầu xuất bản tuyến Nháp; sau đó chỉ xuất bản khi có bản nháp chờ (BR-M03-T06)
  const publishUnit =
    editor?.status === 'NHAP'
      ? 'ROUTE_FIRST_PUBLICATION'
      : editor?.draft && (editor.status === 'HOAT_DONG' || editor.status === 'TAM_DONG')
        ? 'ROUTE_INFORMATION'
        : undefined;

  async function onSave(event: FormEvent) {
    event.preventDefault();
    clearFlash();
    setActionOutcome(null);
    await form.saveDraft();
    const result = lastSave.current;
    if (!result?.ok) {
      // Lỗi lưu: chuyển tới bước có trường lỗi đầu tiên
      const first = serverIssuesOf(result)[0];
      if (first) setStep(stepOf(first.targetFieldKey));
      return;
    }
    if (!routeId) {
      allowNextNavigation();
      const summary = uploadSummary.current;
      const flashState: FlashState = {
        flash: { messageKey: 'MSG-SAVED' },
        ...(summary && summary.failedFiles.length > 0
          ? {
              warning: {
                messageKey: 'MSG-UPLOAD-SUMMARY',
                values: { số: summary.total - summary.failedFiles.length, tổng: summary.total, 'danh sách': summary.failedFiles.join(', ') },
              },
            }
          : {}),
      };
      void navigate(ADMIN_PATHS.route(result.data.routeId), { replace: true, state: flashState });
      return;
    }
    await load('refresh');
  }

  async function onDiscard(reason: string | undefined) {
    if (!editor || !routeId) return;
    setBusy(true);
    try {
      const result = await api.discardUnpublished({
        subjectType: 'ROUTE',
        subjectId: routeId,
        ...(reason ? { reason } : {}),
        expected: { entity: editor.concurrencyRevision },
      });
      setDiscardOpen(false);
      if (result.ok) {
        allowNextNavigation();
        void navigate(ADMIN_PATHS.routes);
        return;
      }
      setActionOutcome(result);
    } catch (error) {
      setDiscardOpen(false);
      setLoadError(handleTransport(error));
    } finally {
      setBusy(false);
    }
  }

  /** "Tạo điểm dừng mới": cất state form để quay lại tiếp tục (BR-M03-T01) */
  function onCreateCheckpoint() {
    if (form.isDirty) stashDraft(restoreKey, state);
    allowNextNavigation();
    void navigate(ADMIN_PATHS.newCheckpoint);
  }

  if (loadError && !editor) return <Banner tone="error">{formatMessage(loadError.messageKey)}</Banner>;
  if (routeId && !editor) return null;

  const stepProps = { form: state, update, errorFor: fields.errorFor, readOnly: archived, api, routeId, savedMediaIds: savedMediaOf(editor) };

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <div className={layout.titleBlock}>
          <h1 className={layout.title}>{title}</h1>
          {editor ? (
            <p className={layout.meta}>
              <span>
                Trạng thái: <strong className={`${layout.status} ${layout[editor.status]}`}>{DISPLAY_NAMES.routeStatus[editor.status]}</strong>
              </span>
            </p>
          ) : null}
          {editor ? <VersionNote hasDraft={Boolean(editor.draft)} hasPublished={Boolean(editor.published)} /> : null}
        </div>
        <div className={layout.headingActions}>
          <Button onClick={() => void navigate(ADMIN_PATHS.routes)}>Quản trị tuyến</Button>
          {publishUnit && editor ? (
            <Button variant="primary" onClick={() => void navigate(ADMIN_PATHS.review(publishUnit, editor.routeId))}>
              Xuất bản
            </Button>
          ) : null}
        </div>
      </div>

      {flash && !form.outcome && !actionOutcome ? <Banner tone="success">{flash}</Banner> : null}
      {flashWarning && !form.outcome && !actionOutcome ? <Banner tone="warning">{flashWarning}</Banner> : null}
      <CommandOutcome result={actionOutcome ?? form.outcome} transportError={form.transportError ?? loadError} onReload={() => void load('reload')} />

      <nav className={styles.steps} aria-label="Các bước">
        {STEPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={styles.step}
            aria-current={step === item.id ? 'step' : undefined}
            onClick={() => setStep(item.id)}
          >
            {index + 1}. {item.label}
          </button>
        ))}
      </nav>

      <div className={layout.columns}>
        <form className={layout.section} onSubmit={onSave} noValidate aria-label="Thông tin tuyến">
          {step === 'card' ? <CardStep {...stepProps} /> : null}
          {step === 'details' ? <DetailsStep {...stepProps} /> : null}
          {step === 'tags' ? <TagsStep {...stepProps} /> : null}
          {step === 'checkpoints' ? <CheckpointsStep {...stepProps} onCreateCheckpoint={onCreateCheckpoint} /> : null}
          {archived ? null : (
            <div className={layout.formActions}>
              <Button type="submit" variant="primary" disabled={form.saving}>
                Lưu bản nháp
              </Button>
              {editor?.status === 'NHAP' ? (
                <Button onClick={() => setDiscardOpen(true)} disabled={busy}>
                  Hủy tuyến
                </Button>
              ) : null}
            </div>
          )}
        </form>

        <aside className={layout.aside}>
          <MissingToPublishPanel issues={publishIssues} onNavigate={(issue) => setStep(stepOf(issue.targetFieldKey))} />
        </aside>
      </div>

      <ReasonDialog
        open={discardOpen}
        {...confirmation('DISCARD_ROUTE', { tên: state.name.vi.trim() || title })}
        reasonRequired
        busy={busy}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={(reason) => void onDiscard(reason)}
      />
      <UnsavedChangesDialog guard={guard} />
    </div>
  );
}

function serverIssuesOf(result: CommandResult<unknown> | null) {
  return result && !result.ok && result.reason === 'VALIDATION' ? result.issues : [];
}

/** Media mà bản đã lưu (bản nháp, hoặc bản xuất bản khi không có nháp) tham chiếu */
function savedMediaOf(editor: RouteEditor | null): Set<string> {
  const content = (editor?.draft ?? editor?.published)?.content;
  const ids = [content?.thumbnailMediaId, ...(content?.galleryItems ?? []).map((item) => item.mediaId), content?.routeMapMediaId];
  return new Set(ids.filter((id): id is string => Boolean(id)));
}

export default RouteEditorPage;
