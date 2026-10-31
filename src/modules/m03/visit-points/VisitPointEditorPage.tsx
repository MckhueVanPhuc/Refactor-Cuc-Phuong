// SCR-M03-003 Điểm tham quan (QR) & Nội dung (tasks T089; Q-07, C-03, C-04; BR-M03-B01, B02, E02–E05,
// E14–E17, F11, F12). Ảnh in, In lại, Thu hồi, Hủy ở VisitPointLifecycle (T091).
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { RadioGroup } from '../../../shared/ui/RadioGroup';
import { TextArea } from '../../../shared/ui/TextArea';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import {
  NAME_MAX_CHARS,
  NOTE_MAX_CHARS,
  QR_INTRO_MAX_CHARS,
  QR_MAX_AV_FILES,
  QR_MAX_IMAGES,
  type MediaType,
} from '../config/limits';
import type {
  CheckpointStatus,
  ConnectivityMode,
  QrContent,
  SaveVisitPointDraftData,
  SpokenLanguage,
  VisitPointEditor,
} from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { CommandOutcome } from '../editor/CommandOutcome';
import layout from '../editor/EditorLayout.module.css';
import type { FlashState } from '../editor/flash';
import { MissingToPublishPanel } from '../editor/MissingToPublishPanel';
import { useDraftForm } from '../editor/useDraftForm';
import { useFieldIssues } from '../editor/useFieldIssues';
import { UnsavedChangesDialog, allowNextNavigation, useUnsavedChangesGuard } from '../editor/useUnsavedChangesGuard';
import { MediaThumbnail } from '../media/MediaThumbnail';
import { MediaUploader } from '../media/MediaUploader';
import type { UploadItem } from '../media/useUploadQueue';
import { formatMessage, formatMessageFromServer } from '../messages/catalog';
import { DISPLAY_NAMES, readinessLabel } from '../messages/displayNames';
import { FIELD_LABELS } from '../messages/fieldLabels';
import { qrSuffix } from '../messages/format';
import { HINTS } from '../messages/hints';
import { ADMIN_PATHS } from '../paths';
import { stripLineBreaks } from '../validation/common';
import {
  mediaLabel,
  visitPointName,
  visitPointPublishIssues,
  visitPointSaveIssues,
  type VisitPointCheckInput,
} from '../validation/visitPoint';
import { VisitorPreview } from './preview/VisitorPreview';
import { VisitPointLifecycle } from './VisitPointLifecycle';
import styles from './VisitPointEditorPage.module.css';

type MediaEntry = {
  mediaId: string;
  type: MediaType;
  sourceRef: string;
  usageRightsConfirmed: boolean;
  spokenLanguage?: SpokenLanguage;
  /** tên tệp gốc, chỉ biết khi vừa tải trong phiên này (hệ thống không lưu tên tệp) */
  fileName?: string;
};

type Form = {
  objectName: { vi: string; en: string };
  intro: { vi: string; en: string };
  installationLabel: string;
  media: MediaEntry[];
};

const EMPTY: Form = { objectName: { vi: '', en: '' }, intro: { vi: '', en: '' }, installationLabel: '', media: [] };

const SPOKEN_OPTIONS = (['vi', 'en', 'NONE'] as const).map((value) => ({ value, label: DISPLAY_NAMES.spokenLanguage[value] }));

const NEW_ID = 'new';

/** Thông tin điểm dừng mà form cần: tên, mode đã lưu, trạng thái */
type CheckpointInfo = { name: string; mode?: ConnectivityMode | undefined; status: CheckpointStatus; creationOrder: number };

const bilingual = (value: { vi: string; en: string }) => {
  const vi = value.vi.trim();
  const en = value.en.trim();
  return vi || en ? { ...(vi ? { vi } : {}), ...(en ? { en } : {}) } : undefined;
};

function toContent(form: Form): QrContent {
  const content: QrContent = { mediaItems: form.media.map(({ mediaId }) => ({ mediaId })) };
  const objectName = bilingual(form.objectName);
  const introductionText = bilingual(form.intro);
  if (objectName) content.objectName = objectName;
  if (introductionText) content.introductionText = introductionText;
  return content;
}

function fromEditor(editor: VisitPointEditor): Form {
  const content = (editor.draft ?? editor.published)?.content ?? {};
  const byId = new Map(editor.media.map((media) => [media.mediaId, media]));
  return {
    objectName: { vi: content.objectName?.vi ?? '', en: content.objectName?.en ?? '' },
    intro: { vi: content.introductionText?.vi ?? '', en: content.introductionText?.en ?? '' },
    installationLabel: editor.installationLabel ?? '',
    media: (content.mediaItems ?? []).flatMap(({ mediaId }) => {
      const media = byId.get(mediaId);
      if (!media) return [];
      const entry: MediaEntry = {
        mediaId,
        type: media.type,
        sourceRef: media.sourceRef,
        usageRightsConfirmed: media.usageRightsConfirmed,
      };
      if (media.spokenLanguage) entry.spokenLanguage = media.spokenLanguage;
      return [entry];
    }),
  };
}

const isEmpty = (form: Form) =>
  !form.objectName.vi.trim() &&
  !form.objectName.en.trim() &&
  !form.intro.vi.trim() &&
  !form.intro.en.trim() &&
  !form.installationLabel.trim() &&
  form.media.length === 0;

export function VisitPointEditorPage() {
  const { checkpointId = '', qrIdentifier = NEW_ID } = useParams();
  return (
    <VisitPointEditorView
      key={qrIdentifier}
      checkpointId={checkpointId}
      qrIdentifier={qrIdentifier === NEW_ID ? undefined : qrIdentifier}
    />
  );
}

function VisitPointEditorView({ checkpointId, qrIdentifier }: { checkpointId: string; qrIdentifier: string | undefined }) {
  const api = useAdminApi();
  const navigate = useNavigate();
  const location = useLocation();
  const expire = useSessionExpiry();
  const [editor, setEditor] = useState<VisitPointEditor | null>(null);
  const [checkpoint, setCheckpoint] = useState<CheckpointInfo | null>(null);
  const [loadError, setLoadError] = useState<AdminApiError | null>(null);
  const [actionOutcome, setActionOutcome] = useState<CommandResult<unknown> | null>(null);
  const [actionError, setActionError] = useState<AdminApiError | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [created, setCreated] = useState(() => {
    const flash = (location.state as FlashState | null)?.flash;
    return flash?.messageKey === 'MSG-QR-CREATED' ? formatMessageFromServer(flash.messageKey, flash.values) : null;
  });
  const restoreKey = `visit-point:${checkpointId}:${qrIdentifier ?? NEW_ID}`;
  const lastSave = useRef<CommandResult<SaveVisitPointDraftData> | null>(null);

  const save = useCallback(
    async (state: Form) => {
      const result = await api.saveVisitPointDraft({
        checkpointId,
        ...(qrIdentifier ? { qrIdentifier } : {}),
        ...(editor ? { expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision } } : {}),
        content: toContent(state),
        installationLabel: state.installationLabel,
        mediaSettings: state.media.map(({ mediaId, type, usageRightsConfirmed, spokenLanguage }) => ({
          mediaId,
          usageRightsConfirmed,
          ...(type !== 'IMAGE' && spokenLanguage ? { spokenLanguage } : {}),
        })),
      });
      lastSave.current = result;
      return result;
    },
    [api, checkpointId, qrIdentifier, editor],
  );

  const form = useDraftForm<Form, SaveVisitPointDraftData>({ initial: EMPTY, save, restoreKey });
  const guard = useUnsavedChangesGuard(restoreKey, form.isDirty);

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
      try {
        if (qrIdentifier) {
          const loaded = await api.getVisitPointEditor(qrIdentifier);
          setEditor(loaded);
          setCheckpoint({
            name: loaded.checkpointName ?? '',
            mode: loaded.checkpointMode,
            status: loaded.checkpointStatus,
            creationOrder: loaded.creationOrder,
          });
          if (mode === 'open') {
            if (form.isDirty) form.rebase(fromEditor(loaded));
            else form.reset(fromEditor(loaded));
          }
        } else {
          const parent = await api.getCheckpointEditor(checkpointId);
          const content = (parent.draft ?? parent.published)?.content;
          setCheckpoint({
            name: content?.checkpointName?.vi ?? '',
            mode: content?.connectivityMode,
            status: parent.status,
            creationOrder: parent.visitPoints.length + 1,
          });
        }
        setLoadError(null);
      } catch (error) {
        setLoadError(handleTransport(error));
      }
    },
    // Chỉ nạp lại khi đổi mục; form.reset/rebase ổn định
    [api, checkpointId, qrIdentifier],
  );

  useEffect(() => {
    void load('open');
  }, [load]);

  useEffect(() => {
    if (form.transportError?.messageKey === 'MSG-SESSION-EXPIRED') expire({ key: restoreKey, state: form.state });
  }, [form.transportError]);

  const { state, update } = form;
  const displayName = visitPointName(state.objectName.vi, checkpoint?.creationOrder ?? 1);
  const mode = checkpoint?.mode;
  const readOnly = editor?.status === 'THU_HOI' || checkpoint?.status === 'LUU_TRU';
  const itemId = qrIdentifier ?? NEW_ID;

  const checkInput: VisitPointCheckInput = {
    qrIdentifier: itemId,
    displayName,
    checkpointName: checkpoint?.name ?? '',
    checkpointMode: mode,
    content: toContent(state),
    installationLabel: state.installationLabel,
    media: state.media,
  };
  const clientSaveIssues = useMemo(() => visitPointSaveIssues(checkInput), [state, checkpoint]);
  const publishIssues = useMemo(
    () => [...clientSaveIssues, ...visitPointPublishIssues(checkInput)],
    [state, checkpoint, clientSaveIssues],
  );
  const serverIssues = form.outcome && !form.outcome.ok && form.outcome.reason === 'VALIDATION' ? form.outcome.issues : [];
  const fields = useFieldIssues([...serverIssues, ...clientSaveIssues]);

  const updateMedia = (index: number, change: Partial<MediaEntry>) =>
    update((current) => ({
      ...current,
      media: current.media.map((item, i) => (i === index ? { ...item, ...change } : item)),
    }));

  const onUploaded = useCallback(
    (item: UploadItem) => {
      if (!item.mediaId || !item.sourceRef || !item.type) return;
      const entry: MediaEntry = {
        mediaId: item.mediaId,
        type: item.type,
        sourceRef: item.sourceRef,
        usageRightsConfirmed: false,
        fileName: item.fileName,
      };
      update((current) => ({ ...current, media: [...current.media, entry] }));
    },
    [update],
  );

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setCreated(null);
    setActionOutcome(null);
    setActionError(null);
    await form.saveDraft();
    const result = lastSave.current;
    if (!result?.ok) return;
    if (result.data.created) {
      // Lần lưu đầu tạo QR + identifier: sang URL của điểm tham quan, ở lại form (BR-M03-E15, E16)
      allowNextNavigation();
      const flashState: FlashState = { flash: { messageKey: 'MSG-QR-CREATED', values: { tên: displayName } } };
      void navigate(ADMIN_PATHS.visitPoint(checkpointId, result.data.qrIdentifier), { replace: true, state: flashState });
      return;
    }
    await load('refresh');
  }

  const backToCheckpoint = () => {
    const highlight: FlashState = qrIdentifier ? { highlightQr: qrIdentifier } : {};
    void navigate(ADMIN_PATHS.checkpoint(checkpointId), { state: highlight });
  };

  if (loadError && !checkpoint) return <Banner tone="error">{formatMessage(loadError.messageKey)}</Banner>;
  if (!checkpoint) return null;

  const images = state.media.filter((item) => item.type === 'IMAGE');
  const avFiles = state.media.filter((item) => item.type !== 'IMAGE');
  const labels = (() => {
    const counters = { image: 0, av: 0 };
    return state.media.map((item) => mediaLabel(displayName, item, item.type === 'IMAGE' ? counters.image++ : counters.av++));
  })();
  const version = editor?.draft ? 'MSG-VERSION-DRAFT' : editor?.published ? 'MSG-VERSION-PUBLISHED' : null;
  const canPublish = Boolean(editor?.draft) && editor?.status !== 'THU_HOI' && (checkpoint.status === 'HOAT_DONG' || checkpoint.status === 'TAM_DONG');

  function mediaRow(item: MediaEntry) {
    const index = state.media.indexOf(item);
    const label = labels[index] ?? '';
    return (
      <li key={item.mediaId} className={styles.mediaItem}>
        {item.type === 'IMAGE' ? <MediaThumbnail sourceRef={item.sourceRef} /> : null}
        <div className={styles.mediaBody}>
          <p className={styles.mediaName}>{label}</p>
          <Checkbox
            label={`${FIELD_LABELS.QRCODE.usageRights} — ${label}`}
            checked={item.usageRightsConfirmed}
            onChange={(usageRightsConfirmed) => updateMedia(index, { usageRightsConfirmed })}
            fieldKey={`usageRights.${index}`}
            disabled={readOnly}
          />
          {item.type !== 'IMAGE' ? (
            <div data-field-key={`spokenLanguage.${index}`} tabIndex={-1}>
              <RadioGroup
                legend={`${FIELD_LABELS.QRCODE.spokenLanguage} — ${label}`}
                value={item.spokenLanguage ?? ''}
                options={SPOKEN_OPTIONS}
                onChange={(spokenLanguage) => updateMedia(index, { spokenLanguage })}
                disabled={readOnly}
              />
            </div>
          ) : null}
        </div>
        {readOnly ? null : (
          <Button onClick={() => update((current) => ({ ...current, media: current.media.filter((other) => other !== item) }))}>
            Bỏ tệp
          </Button>
        )}
      </li>
    );
  }

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <div className={layout.titleBlock}>
          <h1 className={layout.title}>{editor ? `Đang sửa: ${displayName}` : 'Điểm tham quan mới'}</h1>
          <p className={layout.meta}>
            <span>Điểm dừng: {checkpoint.name || 'Điểm dừng chưa đặt tên'}</span>
            {editor ? (
              <>
                <span>
                  Trạng thái: <strong className={`${layout.status} ${layout[editor.status]}`}>{DISPLAY_NAMES.qrStatus[editor.status]}</strong>
                </span>
                <span>{readinessLabel(editor.readiness.missing)}</span>
                <span className={layout.code}>Mã …{qrSuffix(editor.qrIdentifier)}</span>
              </>
            ) : null}
          </p>
          {version ? <p className={styles.version}>{formatMessage(version)}</p> : null}
        </div>
        <div className={layout.headingActions}>
          <Button onClick={backToCheckpoint}>Về điểm dừng</Button>
          <Button onClick={() => setPreviewOpen((open) => !open)} aria-expanded={previewOpen}>
            Xem trước như du khách
          </Button>
          {canPublish && editor ? (
            <Button variant="primary" onClick={() => void navigate(ADMIN_PATHS.review('QR_OBJECT', editor.qrIdentifier))}>
              Xuất bản
            </Button>
          ) : null}
        </div>
      </div>

      {created && !form.outcome ? (
        <Banner
          tone="success"
          actions={
            <Button onClick={() => void navigate(ADMIN_PATHS.newVisitPoint(checkpointId))}>Thêm điểm tham quan khác</Button>
          }
        >
          {created}
        </Banner>
      ) : null}
      {!mode ? <Banner tone="warning">{formatMessage('MSG-MODE-REQUIRED-FIRST')}</Banner> : null}
      <CommandOutcome
        result={actionOutcome ?? form.outcome}
        transportError={actionError ?? form.transportError ?? loadError}
        {...(form.outcome?.ok && form.outcome.messageKey === 'MSG-QR-CREATED' ? { successValues: { tên: displayName } } : {})}
        onReload={() => void load('open')}
      />

      {previewOpen ? (
        <div className={layout.section}>
          <VisitorPreview
            checkpointName={{ vi: checkpoint.name, en: checkpoint.name }}
            connectivityMode={mode}
            objectName={state.objectName}
            introductionText={state.intro}
            media={state.media}
          />
        </div>
      ) : null}

      <div className={layout.columns}>
        <div className={layout.main}>
          <form className={layout.section} onSubmit={onSave} noValidate aria-label="Nội dung điểm tham quan">
            <div className={layout.pair}>
              {(['vi', 'en'] as const).map((language) => (
                <TextField
                  key={language}
                  label={`${FIELD_LABELS.QRCODE.objectName} (${language === 'vi' ? 'tiếng Việt' : 'tiếng Anh'})`}
                  value={state.objectName[language]}
                  onChange={(value) =>
                    update((current) => ({ ...current, objectName: { ...current.objectName, [language]: stripLineBreaks(value) } }))
                  }
                  maxChars={NAME_MAX_CHARS}
                  error={fields.errorFor(`objectName.${language}`)}
                  fieldKey={`objectName.${language}`}
                  lang={language}
                  disabled={readOnly}
                />
              ))}
            </div>
            <div className={layout.pair}>
              {(['vi', 'en'] as const).map((language) => (
                <TextArea
                  key={language}
                  label={`${FIELD_LABELS.QRCODE.introductionText} (${language === 'vi' ? 'tiếng Việt' : 'tiếng Anh'})`}
                  value={state.intro[language]}
                  onChange={(value) => update((current) => ({ ...current, intro: { ...current.intro, [language]: value } }))}
                  maxChars={QR_INTRO_MAX_CHARS}
                  rows={6}
                  error={fields.errorFor(`introductionText.${language}`)}
                  fieldKey={`introductionText.${language}`}
                  lang={language}
                  disabled={readOnly}
                />
              ))}
            </div>

            <div className={styles.mediaGroup} data-field-key="images" tabIndex={-1}>
              {readOnly ? (
                <p className={styles.groupLabel}>{FIELD_LABELS.QRCODE.images}</p>
              ) : (
                <MediaUploader
                  api={api}
                  label={FIELD_LABELS.QRCODE.images}
                  {...(mode === 'OFFLINE_REQUIRED' ? { hint: HINTS.offlineCheckpointMedia } : {})}
                  ownerType="CHECKPOINT"
                  ownerId={checkpointId}
                  usage="QR_MEDIA"
                  kind="IMAGE"
                  maxCount={QR_MAX_IMAGES}
                  remaining={QR_MAX_IMAGES - images.length}
                  ownerName={displayName}
                  onUploaded={onUploaded}
                />
              )}
              {fields.errorFor('images') ? <p className={styles.error}>Lỗi: {fields.errorFor('images')}</p> : null}
              {images.length > 0 ? <ul className={styles.mediaList}>{images.map(mediaRow)}</ul> : null}
            </div>

            {mode === 'ONLINE_AVAILABLE' ? (
              <div className={styles.mediaGroup} data-field-key="avFiles" tabIndex={-1}>
                {readOnly ? (
                  <p className={styles.groupLabel}>{FIELD_LABELS.QRCODE.avFiles}</p>
                ) : (
                  <MediaUploader
                    api={api}
                    label={FIELD_LABELS.QRCODE.avFiles}
                    ownerType="CHECKPOINT"
                    ownerId={checkpointId}
                    usage="QR_MEDIA"
                    kind="AV"
                    maxCount={QR_MAX_AV_FILES}
                    remaining={QR_MAX_AV_FILES - avFiles.length}
                    ownerName={displayName}
                    checkpointMode={mode}
                    checkpointName={checkpoint.name}
                    onUploaded={onUploaded}
                  />
                )}
                {fields.errorFor('avFiles') ? <p className={styles.error}>Lỗi: {fields.errorFor('avFiles')}</p> : null}
                {avFiles.length > 0 ? <ul className={styles.mediaList}>{avFiles.map(mediaRow)}</ul> : null}
              </div>
            ) : null}

            <TextArea
              label={FIELD_LABELS.QRCODE.installationLabel}
              value={state.installationLabel}
              onChange={(installationLabel) => update((current) => ({ ...current, installationLabel }))}
              maxChars={NOTE_MAX_CHARS}
              rows={3}
              error={fields.errorFor('installationLabel')}
              fieldKey="installationLabel"
              disabled={readOnly}
            />
            {readOnly ? null : (
              <div className={layout.formActions}>
                <Button type="submit" variant="primary" disabled={form.saving || !mode || (!editor && isEmpty(state))}>
                  Lưu bản nháp
                </Button>
              </div>
            )}
          </form>
        </div>

        <aside className={layout.aside}>
          <MissingToPublishPanel issues={publishIssues} />
          {editor ? (
            <VisitPointLifecycle
              editor={editor}
              displayName={displayName}
              onOutcome={(result) => {
                setActionOutcome(result);
                setActionError(null);
              }}
              onTransportError={(error) => setActionError(handleTransport(error))}
              onChanged={() => void load('open')}
              onDiscarded={() => {
                allowNextNavigation();
                void navigate(ADMIN_PATHS.checkpoint(checkpointId));
              }}
            />
          ) : null}
        </aside>
      </div>

      <UnsavedChangesDialog guard={guard} />
    </div>
  );
}

export default VisitPointEditorPage;
