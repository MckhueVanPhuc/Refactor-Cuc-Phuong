// SCR-M03-008 editor điểm dừng + danh sách điểm tham quan (tasks T088; Q-06, C-02, C-07;
// BR-M03-D01–D04, D09, D11, E15, E16, F11). Đóng tạm / Mở lại / Lưu trữ gắn ở US6 (T140); bản nháp chờ ở US4 (T122).
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { RadioGroup } from '../../../shared/ui/RadioGroup';
import { TextArea } from '../../../shared/ui/TextArea';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import { CHECKPOINT_QR_MAX_ITEMS, NAME_MAX_CHARS, NOTE_MAX_CHARS } from '../config/limits';
import type { CheckpointContent, CheckpointEditor, ConnectivityMode } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { CommandOutcome } from '../editor/CommandOutcome';
import layout from '../editor/EditorLayout.module.css';
import { useFlash, useHighlightedQr, type FlashState } from '../editor/flash';
import { MissingToPublishPanel } from '../editor/MissingToPublishPanel';
import { ReasonDialog } from '../editor/ReasonDialog';
import { useDraftForm } from '../editor/useDraftForm';
import { useFieldIssues } from '../editor/useFieldIssues';
import { UnsavedChangesDialog, allowNextNavigation, useUnsavedChangesGuard } from '../editor/useUnsavedChangesGuard';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES, readinessLabel } from '../messages/displayNames';
import { FIELD_LABELS } from '../messages/fieldLabels';
import { qrSuffix } from '../messages/format';
import { ADMIN_PATHS } from '../paths';
import { checkpointPublishIssues, checkpointSaveIssues } from '../validation/checkpoint';
import { stripLineBreaks } from '../validation/common';
import { visitPointName } from '../validation/visitPoint';
import styles from './CheckpointEditorPage.module.css';

type Form = {
  name: { vi: string; en: string };
  mode: ConnectivityMode | '';
  verified: boolean;
  locationNote: string;
};

const EMPTY: Form = { name: { vi: '', en: '' }, mode: '', verified: false, locationNote: '' };

const MODE_OPTIONS = [
  { value: 'OFFLINE_REQUIRED', label: DISPLAY_NAMES.connectivityMode.OFFLINE_REQUIRED },
  { value: 'ONLINE_AVAILABLE', label: DISPLAY_NAMES.connectivityMode.ONLINE_AVAILABLE },
] as const;

const NEW_ID = 'new';

function toContent(form: Form): CheckpointContent {
  const content: CheckpointContent = {};
  const vi = form.name.vi.trim();
  const en = form.name.en.trim();
  if (vi || en) content.checkpointName = { ...(vi ? { vi } : {}), ...(en ? { en } : {}) };
  if (form.mode) content.connectivityMode = form.mode;
  if (form.mode === 'ONLINE_AVAILABLE' && form.verified) content.fieldVerificationConfirmed = true;
  return content;
}

function fromEditor(editor: CheckpointEditor): Form {
  const content = (editor.draft ?? editor.published)?.content ?? {};
  return {
    name: { vi: content.checkpointName?.vi ?? '', en: content.checkpointName?.en ?? '' },
    mode: content.connectivityMode ?? '',
    verified: Boolean(content.fieldVerificationConfirmed),
    locationNote: editor.locationNote ?? '',
  };
}

/** Mỗi điểm dừng (và form mới) là một phiên editor riêng: đổi URL thì dựng lại state */
export function CheckpointEditorPage() {
  const { checkpointId = NEW_ID } = useParams();
  return <CheckpointEditor key={checkpointId} checkpointId={checkpointId === NEW_ID ? undefined : checkpointId} />;
}

function CheckpointEditor({ checkpointId }: { checkpointId: string | undefined }) {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();
  const highlightQr = useHighlightedQr();
  const [flash, clearFlash] = useFlash();
  const [editor, setEditor] = useState<CheckpointEditor | null>(null);
  const [loadError, setLoadError] = useState<AdminApiError | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionOutcome, setActionOutcome] = useState<CommandResult<unknown> | null>(null);
  const restoreKey = `checkpoint:${checkpointId ?? NEW_ID}`;
  const lastSave = useRef<CommandResult<{ checkpointId: string }> | null>(null);

  const save = useCallback(
    async (state: Form) => {
      const result = await api.saveCheckpointDraft({
        ...(checkpointId ? { checkpointId } : {}),
        ...(editor ? { expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision } } : {}),
        content: toContent(state),
        locationNote: state.locationNote,
      });
      lastSave.current = result;
      return result;
    },
    [api, checkpointId, editor],
  );

  const form = useDraftForm<Form, { checkpointId: string }>({ initial: EMPTY, save, restoreKey });
  const guard = useUnsavedChangesGuard(restoreKey, form.isDirty);
  const id = checkpointId ?? NEW_ID;

  const handleTransport = useCallback(
    (error: unknown) => {
      const apiError = AdminApiError.from(error);
      if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire({ key: restoreKey, state: form.state });
      return apiError;
    },
    [expire, form.state, restoreKey],
  );

  const load = useCallback(
    async (mode: 'open' | 'refresh') => {
      if (!checkpointId) return;
      try {
        const loaded = await api.getCheckpointEditor(checkpointId);
        setEditor(loaded);
        setLoadError(null);
        // Mở lần đầu: form theo dữ liệu đã lưu, trừ khi vừa lấy lại chữ chưa lưu sau khi phiên hết hạn
        if (mode === 'open') {
          if (form.isDirty) form.rebase(fromEditor(loaded));
          else form.reset(fromEditor(loaded));
        }
      } catch (error) {
        setLoadError(handleTransport(error));
      }
    },
    // form.reset/rebase ổn định; chỉ nạp lại khi đổi điểm dừng
    [api, checkpointId],
  );

  useEffect(() => {
    void load('open');
  }, [load]);

  useEffect(() => {
    if (form.transportError?.messageKey === 'MSG-SESSION-EXPIRED') expire({ key: restoreKey, state: form.state });
    // chỉ phản ứng khi có lỗi transport mới
  }, [form.transportError]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    clearFlash();
    setActionOutcome(null);
    await form.saveDraft();
    const result = lastSave.current;
    if (!result?.ok) return;
    if (!checkpointId) {
      // Lần lưu đầu tạo điểm dừng: sang URL có id, mang câu MSG-SAVED theo
      allowNextNavigation();
      const state: FlashState = { flash: { messageKey: 'MSG-SAVED' } };
      void navigate(ADMIN_PATHS.checkpoint(result.data.checkpointId), { replace: true, state });
      return;
    }
    await load('refresh');
  }

  async function onDiscard(reason: string | undefined) {
    if (!editor || !checkpointId) return;
    setBusy(true);
    try {
      const result = await api.discardUnpublished({
        subjectType: 'CHECKPOINT',
        subjectId: checkpointId,
        ...(reason ? { reason } : {}),
        expected: { entity: editor.concurrencyRevision },
      });
      setDiscardOpen(false);
      if (result.ok) {
        allowNextNavigation();
        void navigate(ADMIN_PATHS.checkpoints);
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

  const { state, update } = form;
  const savedMode = (editor?.draft ?? editor?.published)?.content.connectivityMode;
  const openVisitPoints = editor?.visitPoints.filter((vp) => vp.status !== 'THU_HOI') ?? [];
  const readyCount = openVisitPoints.filter((vp) => vp.readiness.ready).length;
  const limitReached = openVisitPoints.length >= CHECKPOINT_QR_MAX_ITEMS;
  const archived = editor?.status === 'LUU_TRU';
  const title = editor ? state.name.vi.trim() || 'Điểm dừng chưa đặt tên' : 'Điểm dừng mới';

  const serverIssues = form.outcome && !form.outcome.ok && form.outcome.reason === 'VALIDATION' ? form.outcome.issues : [];
  const clientIssues = useMemo(() => checkpointSaveIssues(id, { content: toContent(state), locationNote: state.locationNote }), [id, state]);
  const fields = useFieldIssues([...serverIssues, ...clientIssues]);
  const publishIssues = useMemo(() => checkpointPublishIssues(id, toContent(state), readyCount), [id, state, readyCount]);

  const addBlocked = !savedMode
    ? formatMessage('MSG-MODE-REQUIRED-FIRST')
    : limitReached
      ? formatMessage('MSG-LIMIT-QR', { tên: state.name.vi.trim(), 'tối đa': CHECKPOINT_QR_MAX_ITEMS })
      : undefined;

  if (loadError && !editor) {
    return <Banner tone="error">{formatMessage(loadError.messageKey)}</Banner>;
  }
  if (checkpointId && !editor) return null;

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <div className={layout.titleBlock}>
          <h1 className={layout.title}>{title}</h1>
          {editor ? (
            <p className={layout.meta}>
              <span>Trạng thái: {DISPLAY_NAMES.checkpointStatus[editor.status]}</span>
              <span>{readinessLabel(publishIssues.map((issue) => issue.fieldLabel))}</span>
            </p>
          ) : null}
        </div>
        <div className={layout.headingActions}>
          <Button onClick={() => void navigate(ADMIN_PATHS.checkpoints)}>Thư viện điểm dừng</Button>
          {editor?.status === 'NHAP' ? (
            <Button
              variant="primary"
              onClick={() => void navigate(ADMIN_PATHS.review('CHECKPOINT_FIRST_PUBLICATION', editor.checkpointId))}
            >
              Xuất bản
            </Button>
          ) : null}
        </div>
      </div>

      {flash && !form.outcome && !actionOutcome ? <Banner tone="success">{flash}</Banner> : null}
      <CommandOutcome
        result={actionOutcome ?? form.outcome}
        transportError={form.transportError ?? loadError}
        onReload={() => void load('open')}
      />

      <div className={layout.columns}>
        <div className={layout.main}>
          <form className={layout.section} onSubmit={onSave} noValidate aria-label="Thông tin điểm dừng">
            <div className={layout.pair}>
              <TextField
                label={`${FIELD_LABELS.CHECKPOINT.checkpointName} (tiếng Việt)`}
                value={state.name.vi}
                onChange={(value) => update((current) => ({ ...current, name: { ...current.name, vi: stripLineBreaks(value) } }))}
                maxChars={NAME_MAX_CHARS}
                error={fields.errorFor('checkpointName.vi')}
                fieldKey="checkpointName.vi"
                lang="vi"
                disabled={archived}
              />
              <TextField
                label={`${FIELD_LABELS.CHECKPOINT.checkpointName} (tiếng Anh)`}
                value={state.name.en}
                onChange={(value) => update((current) => ({ ...current, name: { ...current.name, en: stripLineBreaks(value) } }))}
                maxChars={NAME_MAX_CHARS}
                error={fields.errorFor('checkpointName.en')}
                fieldKey="checkpointName.en"
                lang="en"
                disabled={archived}
              />
            </div>
            <div data-field-key="connectivityMode" tabIndex={-1} className={styles.focusTarget}>
              <RadioGroup
                legend={FIELD_LABELS.CHECKPOINT.connectivityMode}
                value={state.mode}
                options={MODE_OPTIONS}
                // Đổi khỏi "có mạng" thì xóa xác nhận khảo sát (BR-M03-D02)
                onChange={(mode) => update((current) => ({ ...current, mode, verified: mode === 'ONLINE_AVAILABLE' && current.verified }))}
                error={fields.errorFor('connectivityMode')}
                disabled={archived}
              />
            </div>
            {state.mode === 'ONLINE_AVAILABLE' ? (
              <Checkbox
                label={FIELD_LABELS.CHECKPOINT.fieldVerificationConfirmed}
                checked={state.verified}
                onChange={(verified) => update((current) => ({ ...current, verified }))}
                error={fields.errorFor('fieldVerificationConfirmed')}
                fieldKey="fieldVerificationConfirmed"
                disabled={archived}
              />
            ) : null}
            <TextArea
              label={FIELD_LABELS.CHECKPOINT.locationNote}
              value={state.locationNote}
              onChange={(locationNote) => update((current) => ({ ...current, locationNote }))}
              maxChars={NOTE_MAX_CHARS}
              rows={3}
              error={fields.errorFor('locationNote')}
              fieldKey="locationNote"
              disabled={archived}
            />
            {archived ? null : (
              <div className={layout.formActions}>
                <Button type="submit" variant="primary" disabled={form.saving}>
                  Lưu bản nháp
                </Button>
                {editor?.status === 'NHAP' ? (
                  <Button onClick={() => setDiscardOpen(true)} disabled={busy}>
                    Hủy điểm dừng
                  </Button>
                ) : null}
              </div>
            )}
          </form>

          <section className={layout.section} aria-labelledby="visit-points-title" data-field-key="visitPoints" tabIndex={-1}>
            <div className={layout.sectionHeading}>
              <h2 id="visit-points-title" className={layout.sectionTitle}>
                Điểm tham quan
              </h2>
              {archived ? null : (
                <Button
                  disabled={Boolean(addBlocked) || !editor}
                  onClick={() => editor && void navigate(ADMIN_PATHS.newVisitPoint(editor.checkpointId))}
                >
                  Thêm điểm tham quan
                </Button>
              )}
            </div>
            {addBlocked && !archived ? <p className={layout.note}>{addBlocked}</p> : null}
            {editor && editor.visitPoints.length > 0 ? (
              <div className={layout.tableWrap}>
                <table className={layout.table} aria-label="Điểm tham quan">
                  <thead>
                    <tr>
                      <th scope="col">Tên</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col">Sẵn sàng</th>
                      <th scope="col">Mã</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editor.visitPoints.map((vp) => (
                      <tr key={vp.qrIdentifier} aria-current={vp.qrIdentifier === highlightQr ? 'true' : undefined}>
                        <td>
                          <Link className={layout.rowLink} to={ADMIN_PATHS.visitPoint(editor.checkpointId, vp.qrIdentifier)}>
                            {visitPointName(vp.name, vp.creationOrder)}
                          </Link>
                        </td>
                        <td>
                          <span className={`${layout.status} ${layout[vp.status]}`}>{DISPLAY_NAMES.qrStatus[vp.status]}</span>
                        </td>
                        <td className={vp.readiness.ready ? layout.ready : layout.notReady}>{readinessLabel(vp.readiness.missing)}</td>
                        <td className={layout.code}>Mã …{qrSuffix(vp.qrIdentifier)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : editor ? (
              <p className={layout.empty}>Chưa có điểm tham quan nào.</p>
            ) : null}
          </section>
        </div>

        <aside className={layout.aside}>
          <MissingToPublishPanel issues={publishIssues} />
          {editor ? (
            <section className={layout.section} aria-labelledby="routes-using-title">
              <h2 id="routes-using-title" className={layout.sectionTitle}>
                Tuyến đang dùng
              </h2>
              {editor.routesUsing.length > 0 ? (
                <ul className={layout.list}>
                  {editor.routesUsing.map((route) => (
                    <li key={route.routeId}>
                      <Link to={ADMIN_PATHS.route(route.routeId)}>{route.routeName}</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={layout.note}>Chưa có tuyến nào dùng điểm dừng này.</p>
              )}
            </section>
          ) : null}
        </aside>
      </div>

      <ReasonDialog
        open={discardOpen}
        title={formatMessage('MSG-CONFIRM-DISCARD-CHECKPOINT', { tên: state.name.vi.trim() || title })}
        safeLabel="Không hủy"
        confirmLabel="Hủy điểm dừng"
        reasonRequired
        busy={busy}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={(reason) => void onDiscard(reason)}
      />
      <UnsavedChangesDialog guard={guard} />
    </div>
  );
}

export default CheckpointEditorPage;
