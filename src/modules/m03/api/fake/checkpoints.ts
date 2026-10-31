// Điểm dừng và điểm tham quan trên adapter giả (tasks T083): C-02, C-03, C-07 (điểm dừng/QR), C-16, C-17,
// Q-05, Q-06, Q-07 (admin-command §5–§6; BR-M03-B01–B03, D01–D03, D09, D11, E02, E04, E07, E09–E11, E14–E17).
import { CHECKPOINT_QR_MAX_ITEMS, NOTE_MAX_CHARS } from '../../config/limits';
import type {
  CheckpointContent,
  CheckpointListRow,
  QrContent,
  SaveCheckpointDraftData,
  SaveVisitPointDraftData,
  StatusChangeData,
  VisitPointListRow,
} from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import type { MessageKey } from '../../messages/catalog';
import { checkpointNameTaken, checkpointSaveIssues, modeHasAvIssues, normalizeCheckpointName } from '../../validation/checkpoint';
import { trimmedLength } from '../../validation/common';
import { readinessOf, visitPointName, visitPointSaveIssues } from '../../validation/visitPoint';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import {
  checkpointContent,
  checkpointIssues,
  checkpointName,
  mediaOfContent,
  openQrCodesOf,
  qrCodesOf,
  qrContent,
  qrDisplayName,
  qrIssues,
  qrReadiness,
  routesListing,
  savedMode,
  toMediaInfo,
  visitPointsWithAv,
} from './checkpointData';
import { draftOf, everPublished, expectedFor, publishedOf, revisionsOf, toEditorRevision, touch, writeDraft } from './revisions';
import type { FakeCheckpoint, FakeQrCode, FakeStore } from './store';

type CheckpointsArea = Pick<
  AdminApi,
  | 'saveCheckpointDraft'
  | 'saveVisitPointDraft'
  | 'discardUnpublished'
  | 'revokeVisitPoint'
  | 'recordReprint'
  | 'listCheckpoints'
  | 'getCheckpointEditor'
  | 'getVisitPointEditor'
>;

const failed: CommandResult<never> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };

/** Lý do / ghi chú: không rỗng sau trim khi bắt buộc, ≤ NOTE_MAX_CHARS (admin-command §1) */
function reasonProblem(reason: string | undefined, required: boolean): CommandResult<never> | undefined {
  const length = trimmedLength(reason ?? '');
  if (required && length === 0) {
    return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-MISSING-FIELD', values: { 'tên ô': 'Lý do' } };
  }
  if (length > NOTE_MAX_CHARS) {
    return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-LIMIT-TEXT', values: { 'Tên ô': 'Lý do', 'tối đa': NOTE_MAX_CHARS, số: length } };
  }
  return undefined;
}

const optionalText = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);

export function createFakeCheckpointsArea(store: FakeStore): CheckpointsArea {
  const checkpoints = () => store.state.checkpoints;
  const qrCodes = () => store.state.qrCodes;

  function requireAdmin(): void {
    if (!store.currentAdmin()) throw new AdminApiError('MSG-SESSION-EXPIRED');
  }

  function findCheckpoint(checkpointId: string): FakeCheckpoint {
    const checkpoint = checkpoints().get(checkpointId);
    if (!checkpoint) throw new AdminApiError('MSG-GENERIC');
    return checkpoint;
  }

  /** Tên tiếng Việt (nháp và đã xuất bản) của mọi điểm dừng khác chưa lưu trữ (BR-M03-D03) */
  function otherCheckpointNames(checkpointId: string): string[] {
    return [...checkpoints().values()]
      .filter((other) => other.checkpointId !== checkpointId && other.status !== 'LUU_TRU')
      .flatMap((other) =>
        [draftOf(store, 'CHECKPOINT', other.checkpointId), publishedOf(store, 'CHECKPOINT', other.checkpointId)].flatMap(
          (rev) => (rev ? [(rev.content as CheckpointContent).checkpointName?.vi ?? ''] : []),
        ),
      );
  }

  /** Identifier ngẫu nhiên, không trùng; va chạm thì sinh lại, không bao giờ báo lỗi cho người dùng (BR-M03-B03) */
  function newQrIdentifier(): string {
    for (;;) {
      const candidate = store.queuedQrIdentifiers.shift() ?? store.newId(20);
      if (!qrCodes().has(candidate)) return candidate;
    }
  }

  function visitPointRow(qr: FakeQrCode, checkpoint: FakeCheckpoint): VisitPointListRow {
    const row: VisitPointListRow = {
      qrIdentifier: qr.qrIdentifier,
      creationOrder: qr.creationOrder,
      status: qr.status,
      readiness: qrReadiness(store, qr, checkpoint),
    };
    const name = qrContent(store, qr).objectName?.vi?.trim();
    if (name) row.name = name;
    return row;
  }

  function discardCheckpoint(input: Parameters<AdminApi['discardUnpublished']>[0]) {
    const checkpoint = checkpoints().get(input.subjectId);
    return store.run(
      {
        action: 'ITEM_DISCARDED',
        roles: 'B',
        subject: { type: 'CHECKPOINT', id: input.subjectId, ...(checkpoint?.name ? { name: checkpoint.name } : {}) },
        ...(checkpoint ? { expected: expectedFor(checkpoint, undefined, input.expected) } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
      },
      (context): CommandResult<StatusChangeData> => {
        if (!checkpoint || checkpoint.status !== 'NHAP' || everPublished(store, 'CHECKPOINT', checkpoint.checkpointId)) {
          return failed;
        }
        const problem = reasonProblem(input.reason, true);
        if (problem) return problem;
        checkpoint.status = 'LUU_TRU';
        touch(store, checkpoint, context.actor.email);
        // Điểm tham quan nháp của nó không dùng được nữa (BR-M03-D09)
        for (const qr of qrCodesOf(store, checkpoint.checkpointId)) {
          if (qr.status !== 'NHAP') continue;
          qr.status = 'THU_HOI';
          touch(store, qr, context.actor.email);
        }
        context.changeLines.push('Trạng thái: Nháp → Đã lưu trữ');
        return { ok: true, messageKey: 'MSG-SAVED', data: { status: checkpoint.status, concurrencyRevision: checkpoint.concurrencyRevision } };
      },
    );
  }

  function discardVisitPoint(input: Parameters<AdminApi['discardUnpublished']>[0]) {
    const qr = qrCodes().get(input.subjectId);
    return store.run(
      {
        action: 'ITEM_DISCARDED',
        roles: 'B',
        subject: { type: 'QRCODE', id: input.subjectId, ...(qr ? { name: qrDisplayName(store, qr) } : {}) },
        ...(qr ? { expected: expectedFor(qr, undefined, input.expected) } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
      },
      (context): CommandResult<StatusChangeData> => {
        if (!qr || qr.status !== 'NHAP' || everPublished(store, 'QRCODE', qr.qrIdentifier)) return failed;
        // Lý do tùy chọn với QR (BR-M03-E10)
        const problem = reasonProblem(input.reason, false);
        if (problem) return problem;
        qr.status = 'THU_HOI';
        touch(store, qr, context.actor.email);
        context.changeLines.push('Trạng thái: Nháp → Đã thu hồi');
        return { ok: true, messageKey: 'MSG-SAVED', data: { status: qr.status, concurrencyRevision: qr.concurrencyRevision } };
      },
    );
  }

  return {
    async saveCheckpointDraft({ checkpointId, expected, content, locationNote }) {
      const existing = checkpointId ? checkpoints().get(checkpointId) : undefined;
      const draft = existing && draftOf(store, 'CHECKPOINT', existing.checkpointId);
      return store.run(
        {
          action: 'CHECKPOINT_DRAFT_SAVED',
          roles: 'B',
          subject: { type: 'CHECKPOINT', ...(checkpointId ? { id: checkpointId } : {}), ...(existing?.name ? { name: existing.name } : {}) },
          ...(existing ? { expected: expectedFor(existing, draft, expected) } : {}),
        },
        (context): CommandResult<SaveCheckpointDraftData> => {
          if (checkpointId && (!existing || existing.status === 'LUU_TRU')) return failed;
          const id = existing?.checkpointId ?? store.newId();
          const issues = [
            ...checkpointSaveIssues(id, { content, ...(locationNote !== undefined ? { locationNote } : {}) }),
            ...checkpointNameTaken(id, content.checkpointName?.vi, otherCheckpointNames(id)),
            ...(existing ? modeHasAvIssues(id, content.connectivityMode, visitPointsWithAv(store, id)) : []),
          ];
          if (issues.length > 0) return { ok: false, reason: 'VALIDATION', messageKey: issues[0]!.messageKey as MessageKey, issues };

          // Ai xác nhận khảo sát và lúc nào do M03 ghi; đổi khỏi "có mạng" thì xóa xác nhận (BR-M03-D02)
          const previous = existing ? checkpointContent(store, existing) : {};
          const stored: CheckpointContent = { ...content };
          delete stored.fieldVerifiedByUserId;
          delete stored.fieldVerifiedAt;
          if (content.connectivityMode === 'ONLINE_AVAILABLE' && content.fieldVerificationConfirmed) {
            const keep = previous.connectivityMode === 'ONLINE_AVAILABLE' && previous.fieldVerificationConfirmed;
            stored.fieldVerifiedByUserId = (keep && previous.fieldVerifiedByUserId) || context.actor.userId;
            stored.fieldVerifiedAt = (keep && previous.fieldVerifiedAt) || store.now();
          } else {
            delete stored.fieldVerificationConfirmed;
          }

          const checkpoint: FakeCheckpoint = existing ?? {
            checkpointId: id,
            status: 'NHAP',
            concurrencyRevision: 0,
            lastEditedByEmail: context.actor.email,
            lastEditedAt: store.now(),
          };
          checkpoints().set(id, checkpoint);
          touch(store, checkpoint, context.actor.email);
          const note = optionalText(locationNote);
          if (note) checkpoint.locationNote = note;
          else delete checkpoint.locationNote;
          const revision = writeDraft(store, 'CHECKPOINT', id, stored, context.actor.email);
          const name = checkpointName(store, checkpoint);
          if (name) checkpoint.name = name;
          context.subjectId = id;
          context.subjectName = checkpoint.name;
          return {
            ok: true,
            messageKey: 'MSG-SAVED',
            data: { checkpointId: id, revisionNumber: revision.revisionNumber, concurrencyRevision: revision.concurrencyRevision },
          };
        },
      );
    },

    async saveVisitPointDraft(input) {
      const checkpoint = checkpoints().get(input.checkpointId);
      const existing = input.qrIdentifier ? qrCodes().get(input.qrIdentifier) : undefined;
      const draft = existing && draftOf(store, 'QRCODE', existing.qrIdentifier);
      return store.run(
        {
          action: 'VISIT_POINT_DRAFT_SAVED',
          roles: 'B',
          subject: {
            type: 'QRCODE',
            ...(input.qrIdentifier ? { id: input.qrIdentifier } : {}),
            ...(existing ? { name: qrDisplayName(store, existing) } : {}),
          },
          ...(existing ? { expected: expectedFor(existing, draft, input.expected) } : {}),
        },
        (context): CommandResult<SaveVisitPointDraftData> => {
          if (!checkpoint || checkpoint.status === 'LUU_TRU') return failed;
          if (input.qrIdentifier && (!existing || existing.checkpointId !== checkpoint.checkpointId || existing.status === 'THU_HOI')) {
            return failed;
          }
          const mode = savedMode(store, checkpoint);
          if (!mode) return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-MODE-REQUIRED-FIRST', values: {} };
          if (!existing && openQrCodesOf(store, checkpoint.checkpointId).length >= CHECKPOINT_QR_MAX_ITEMS) {
            return {
              ok: false,
              reason: 'BLOCKED',
              messageKey: 'MSG-LIMIT-QR',
              values: { tên: checkpointName(store, checkpoint), 'tối đa': CHECKPOINT_QR_MAX_ITEMS },
            };
          }

          // Media phải là QR_MEDIA của chính điểm dừng này (DAC-M03-053)
          const content: QrContent = structuredClone(input.content);
          const media = mediaOfContent(store, content);
          const valid =
            media.length === (content.mediaItems ?? []).length &&
            media.every((item) => item.usage === 'QR_MEDIA' && item.ownerType === 'CHECKPOINT' && item.ownerId === checkpoint.checkpointId);
          if (!valid) return failed;
          const settings = new Map(input.mediaSettings.map((setting) => [setting.mediaId, setting]));

          const creationOrder = existing?.creationOrder ?? qrCodesOf(store, checkpoint.checkpointId).length + 1;
          const qrIdentifier = existing?.qrIdentifier ?? newQrIdentifier();
          const displayName = visitPointName(content.objectName?.vi, creationOrder);
          const issues = visitPointSaveIssues({
            qrIdentifier,
            displayName,
            checkpointName: checkpointName(store, checkpoint),
            checkpointMode: mode,
            content,
            installationLabel: input.installationLabel,
            media: media.map((item) => ({
              mediaId: item.mediaId,
              type: item.type,
              usageRightsConfirmed: settings.get(item.mediaId)?.usageRightsConfirmed ?? false,
              spokenLanguage: settings.get(item.mediaId)?.spokenLanguage,
            })),
          });
          if (issues.length > 0) return { ok: false, reason: 'VALIDATION', messageKey: issues[0]!.messageKey as MessageKey, issues };

          // Tick quyền và ngôn ngữ nói lưu theo từng tệp, cùng lần lưu (BR-M03-F11, E17)
          for (const item of media) {
            const setting = settings.get(item.mediaId);
            item.usageRightsConfirmed = setting?.usageRightsConfirmed ?? false;
            if (item.type !== 'IMAGE' && setting?.spokenLanguage) item.spokenLanguage = setting.spokenLanguage;
            else delete item.spokenLanguage;
          }

          const qr: FakeQrCode = existing ?? {
            qrIdentifier,
            checkpointId: checkpoint.checkpointId,
            status: 'NHAP',
            creationOrder,
            concurrencyRevision: 0,
            lastEditedByEmail: context.actor.email,
            lastEditedAt: store.now(),
          };
          qrCodes().set(qrIdentifier, qr);
          touch(store, qr, context.actor.email);
          const label = optionalText(input.installationLabel);
          if (label) qr.installationLabel = label;
          else delete qr.installationLabel;
          const revision = writeDraft(store, 'QRCODE', qrIdentifier, content, context.actor.email);
          context.subjectId = qrIdentifier;
          context.subjectName = displayName;
          return {
            ok: true,
            messageKey: existing ? 'MSG-SAVED' : 'MSG-QR-CREATED',
            data: {
              qrIdentifier,
              revisionNumber: revision.revisionNumber,
              concurrencyRevision: revision.concurrencyRevision,
              created: !existing,
            },
          };
        },
      );
    },

    async discardUnpublished(input) {
      if (input.subjectType === 'CHECKPOINT') return discardCheckpoint(input);
      if (input.subjectType === 'QRCODE') return discardVisitPoint(input);
      throw new Error('Adapter giả chưa có discardUnpublished cho tuyến: khu vực routes — T102 (US3)');
    },

    async revokeVisitPoint({ qrIdentifier, reason, expected }) {
      const qr = qrCodes().get(qrIdentifier);
      const checkpoint = qr && checkpoints().get(qr.checkpointId);
      return store.run(
        {
          action: 'QR_REVOKED',
          roles: 'B',
          subject: { type: 'QRCODE', id: qrIdentifier, ...(qr ? { name: qrDisplayName(store, qr) } : {}) },
          ...(checkpoint ? { lockKeys: [{ key: `checkpoint:${checkpoint.checkpointId}`, itemName: checkpointName(store, checkpoint) }] } : {}),
          ...(qr ? { expected: expectedFor(qr, undefined, expected) } : {}),
          reason,
        },
        (context): CommandResult<StatusChangeData> => {
          if (!qr || !checkpoint || qr.status !== 'HOAT_DONG') return failed;
          const problem = reasonProblem(reason, true);
          if (problem) return problem;
          // Điểm dừng đang hoạt động luôn giữ ít nhất một QR hoạt động (BR-M03-E11)
          const active = qrCodesOf(store, checkpoint.checkpointId).filter((other) => other.status === 'HOAT_DONG');
          if (checkpoint.status === 'HOAT_DONG' && active.length <= 1) {
            return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-QR', values: {} };
          }
          qr.status = 'THU_HOI';
          touch(store, qr, context.actor.email);
          context.changeLines.push('Trạng thái: Đang hoạt động → Đã thu hồi');
          // Phiên bản hành trình mới cho các tuyến liệt kê điểm dừng: US4 (T119)
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: qr.status, concurrencyRevision: qr.concurrencyRevision } };
        },
      );
    },

    async recordReprint({ qrIdentifier }) {
      const qr = qrCodes().get(qrIdentifier);
      return store.run(
        { action: 'QR_REPRINTED', roles: 'B', subject: { type: 'QRCODE', id: qrIdentifier, ...(qr ? { name: qrDisplayName(store, qr) } : {}) } },
        (): CommandResult<null> => (qr && qr.status !== 'THU_HOI' ? { ok: true, messageKey: 'MSG-SAVED', data: null } : failed),
      );
    },

    async listCheckpoints({ search, status }) {
      requireAdmin();
      const query = search?.trim() ? normalizeCheckpointName(search) : undefined;
      return [...checkpoints().values()]
        .map((checkpoint): CheckpointListRow => {
          const content = checkpointContent(store, checkpoint);
          const row: CheckpointListRow = {
            checkpointId: checkpoint.checkpointId,
            status: checkpoint.status,
            visitPointCount: openQrCodesOf(store, checkpoint.checkpointId).length,
            routesUsing: routesListing(store, checkpoint.checkpointId).map(({ routeId, routeName }) => ({ routeId, routeName })),
            readiness: readinessOf(checkpointIssues(store, checkpoint)),
            hasPendingDraft: Boolean(draftOf(store, 'CHECKPOINT', checkpoint.checkpointId)) && checkpoint.status !== 'NHAP',
          };
          const name = content.checkpointName?.vi?.trim();
          if (name) row.name = name;
          if (content.connectivityMode) row.connectivityMode = content.connectivityMode;
          return row;
        })
        .filter((row) => !status || row.status === status)
        .filter((row) => !query || normalizeCheckpointName(row.name ?? '').includes(query))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'vi'));
    },

    async getCheckpointEditor(checkpointId) {
      requireAdmin();
      const checkpoint = findCheckpoint(checkpointId);
      const editor: Awaited<ReturnType<AdminApi['getCheckpointEditor']>> = {
        checkpointId,
        status: checkpoint.status,
        concurrencyRevision: checkpoint.concurrencyRevision,
        visitPoints: qrCodesOf(store, checkpointId).map((qr) => visitPointRow(qr, checkpoint)),
        routesUsing: routesListing(store, checkpointId),
        issues: checkpointIssues(store, checkpoint),
      };
      const draft = toEditorRevision<CheckpointContent>(draftOf(store, 'CHECKPOINT', checkpointId));
      const published = toEditorRevision<CheckpointContent>(publishedOf(store, 'CHECKPOINT', checkpointId));
      if (draft) editor.draft = draft;
      if (published) editor.published = published;
      if (checkpoint.locationNote) editor.locationNote = checkpoint.locationNote;
      if (checkpoint.closureReason) editor.closureReason = checkpoint.closureReason;
      return editor;
    },

    async getVisitPointEditor(qrIdentifier) {
      requireAdmin();
      const qr = qrCodes().get(qrIdentifier);
      if (!qr) throw new AdminApiError('MSG-GENERIC');
      const checkpoint = findCheckpoint(qr.checkpointId);
      const revisions = revisionsOf(store, 'QRCODE', qrIdentifier);
      const mediaIds = new Set(
        revisions
          .filter((rev) => rev.status === 'NHAP' || rev.status === 'PHAT_HANH')
          .flatMap((rev) => ((rev.content as QrContent).mediaItems ?? []).map((item) => item.mediaId)),
      );
      const editor: Awaited<ReturnType<AdminApi['getVisitPointEditor']>> = {
        qrIdentifier,
        checkpointId: qr.checkpointId,
        checkpointStatus: checkpoint.status,
        status: qr.status,
        creationOrder: qr.creationOrder,
        concurrencyRevision: qr.concurrencyRevision,
        media: [...mediaIds].flatMap((id) => {
          const media = store.state.media.get(id);
          return media ? [toMediaInfo(media)] : [];
        }),
        readiness: qrReadiness(store, qr, checkpoint),
        issues: qrIssues(store, qr, checkpoint),
      };
      const name = checkpointName(store, checkpoint);
      const mode = savedMode(store, checkpoint);
      const draft = toEditorRevision<QrContent>(draftOf(store, 'QRCODE', qrIdentifier));
      const published = toEditorRevision<QrContent>(publishedOf(store, 'QRCODE', qrIdentifier));
      if (name) editor.checkpointName = name;
      if (mode) editor.checkpointMode = mode;
      if (qr.installationLabel) editor.installationLabel = qr.installationLabel;
      if (draft) editor.draft = draft;
      if (published) editor.published = published;
      return editor;
    },
  };
}
