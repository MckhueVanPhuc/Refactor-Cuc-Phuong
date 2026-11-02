// Lịch sử, khôi phục, bỏ thay đổi, nhật ký trên adapter giả (tasks T148): C-06, C-08, Q-10, Q-11 theo
// admin-command §5–§6 (BR-M03-F07, F09, F10, A03). Khôi phục kiểm giới hạn **hiện hành** bằng đúng các hàm
// kiểm tra lúc lưu bản nháp; vi phạm thì MSG-RESTORE-BLOCKED và không tạo gì.
import type {
  CheckpointContent,
  QrContent,
  RestoreRevisionData,
  RevisionSummary,
  RouteContent,
  SubjectType,
} from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import type { ValidationIssue } from '../../contracts/validationIssue';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { checkpointNameTaken, checkpointSaveIssues } from '../../validation/checkpoint';
import { normalizeRouteContent, routeSaveIssues } from '../../validation/route';
import { visitPointSaveIssues } from '../../validation/visitPoint';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import { checkpointName, qrCheckInputFor, qrDisplayName } from './checkpointData';
import { draftOf, expectedFor, publishedOf, revisionsOf, touch, writeDraft } from './revisions';
import type { FakeAuditRow, FakeCheckpoint, FakeQrCode, FakeRoute, FakeStore } from './store';

type HistoryArea = Pick<AdminApi, 'discardDraft' | 'restoreRevision' | 'getItemHistory' | 'listAuditLog'>;

/** Số dòng mỗi trang của nhật ký toàn hệ thống — lựa chọn kỹ thuật, không phải quy tắc nghiệp vụ */
export const AUDIT_PAGE_SIZE = 50;

const failed: CommandResult<never> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };

type Subject =
  | { type: 'ROUTE'; entity: FakeRoute }
  | { type: 'CHECKPOINT'; entity: FakeCheckpoint }
  | { type: 'QRCODE'; entity: FakeQrCode };

const withoutInternalId = ({ subjectId: _internal, ...row }: FakeAuditRow) => row;

export function createFakeHistoryArea(store: FakeStore): HistoryArea {
  function findSubject(subjectType: SubjectType, subjectId: string): Subject | undefined {
    if (subjectType === 'ROUTE') {
      const entity = store.state.routes.get(subjectId);
      return entity && { type: 'ROUTE', entity };
    }
    if (subjectType === 'CHECKPOINT') {
      const entity = store.state.checkpoints.get(subjectId);
      return entity && { type: 'CHECKPOINT', entity };
    }
    const entity = store.state.qrCodes.get(subjectId);
    return entity && { type: 'QRCODE', entity };
  }

  function nameOf(subject: Subject | undefined): string | undefined {
    if (!subject) return undefined;
    if (subject.type === 'ROUTE') return subject.entity.name;
    if (subject.type === 'CHECKPOINT') return checkpointName(store, subject.entity) || subject.entity.name;
    return qrDisplayName(store, subject.entity);
  }

  /** Tên hiển thị của tuyến/điểm dừng theo bản nháp nếu có, ngược lại bản đã xuất bản (như khi lưu nháp) */
  function refreshName(subject: Subject): void {
    if (subject.type === 'ROUTE') {
      const id = subject.entity.routeId;
      const name = ((draftOf(store, 'ROUTE', id) ?? publishedOf(store, 'ROUTE', id))?.content as RouteContent | undefined)?.name?.vi?.trim();
      if (name) subject.entity.name = name;
    } else if (subject.type === 'CHECKPOINT') {
      const name = checkpointName(store, subject.entity);
      if (name) subject.entity.name = name;
    }
  }

  /** Giới hạn hiện hành trên nội dung của bản cũ (BR-M03-F07): cùng hàm kiểm tra lúc lưu bản nháp */
  function currentLimitIssues(subject: Subject, content: RouteContent | CheckpointContent | QrContent): ValidationIssue[] {
    if (subject.type === 'ROUTE') {
      return routeSaveIssues(subject.entity.routeId, normalizeRouteContent(content as RouteContent), {
        checkpointName: (checkpointId) => {
          const checkpoint = store.state.checkpoints.get(checkpointId);
          return checkpoint ? checkpointName(store, checkpoint) : '';
        },
      });
    }
    if (subject.type === 'CHECKPOINT') {
      const id = subject.entity.checkpointId;
      const others = [...store.state.checkpoints.values()]
        .filter((other) => other.checkpointId !== id && other.status !== 'LUU_TRU')
        .flatMap((other) =>
          [draftOf(store, 'CHECKPOINT', other.checkpointId), publishedOf(store, 'CHECKPOINT', other.checkpointId)].flatMap((rev) =>
            rev ? [(rev.content as CheckpointContent).checkpointName?.vi ?? ''] : [],
          ),
        );
      const checkpointContent = content as CheckpointContent;
      return [
        ...checkpointSaveIssues(id, { content: checkpointContent, ...(subject.entity.locationNote ? { locationNote: subject.entity.locationNote } : {}) }),
        ...checkpointNameTaken(id, checkpointContent.checkpointName?.vi, others),
      ];
    }
    const checkpoint = store.state.checkpoints.get(subject.entity.checkpointId);
    return checkpoint ? visitPointSaveIssues(qrCheckInputFor(store, subject.entity, checkpoint, content as QrContent)) : [];
  }

  function summary(rev: ReturnType<typeof revisionsOf>[number]): RevisionSummary {
    const result: RevisionSummary = {
      revisionNumber: rev.revisionNumber,
      status: rev.status,
      lastEditedByEmail: rev.lastEditedByEmail,
      lastEditedAt: rev.lastEditedAt,
      concurrencyRevision: rev.concurrencyRevision,
    };
    if (rev.basedOnRevisionNumber !== undefined) result.basedOnRevisionNumber = rev.basedOnRevisionNumber;
    if (rev.publishedByEmail) result.publishedByEmail = rev.publishedByEmail;
    if (rev.publishedAt) result.publishedAt = rev.publishedAt;
    if (rev.selfPublished !== undefined) result.selfPublished = rev.selfPublished;
    return result;
  }

  return {
    async discardDraft({ subjectType, subjectId, expected }) {
      const subject = findSubject(subjectType, subjectId);
      const draft = subject && draftOf(store, subjectType, subjectId);
      const name = nameOf(subject);
      return store.run(
        {
          action: 'DRAFT_DISCARDED',
          roles: 'B',
          subject: { type: subjectType, id: subjectId, ...(name ? { name } : {}) },
          ...(subject ? { expected: expectedFor(subject.entity, draft, expected) } : {}),
        },
        (context): CommandResult<null> => {
          // Chỉ bản nháp chờ của mục đã xuất bản; mục chưa từng xuất bản dùng "Hủy" (C-07)
          if (!subject || !draft || !publishedOf(store, subjectType, subjectId)) return failed;
          draft.status = 'DA_BO';
          draft.concurrencyRevision += 1;
          touch(store, subject.entity, context.actor.email);
          refreshName(subject);
          context.changeLines.push(`Bản ${draft.revisionNumber}: ${DISPLAY_NAMES.revisionStatus.NHAP} → ${DISPLAY_NAMES.revisionStatus.DA_BO}`);
          return { ok: true, messageKey: 'MSG-SAVED', data: null };
        },
      );
    },

    async restoreRevision({ subjectType, subjectId, revisionNumber }) {
      const subject = findSubject(subjectType, subjectId);
      const name = nameOf(subject);
      return store.run(
        { action: 'REVISION_RESTORED', roles: 'B', subject: { type: subjectType, id: subjectId, ...(name ? { name } : {}) } },
        (context): CommandResult<RestoreRevisionData> => {
          // Chỉ bản đã xuất bản trước đó (nay là Bản cũ) của mục chưa lưu trữ/thu hồi
          const old = revisionsOf(store, subjectType, subjectId).find((rev) => rev.revisionNumber === revisionNumber && rev.status === 'LUU_TRU');
          if (!subject || !old || ['LUU_TRU', 'THU_HOI'].includes(subject.entity.status)) return failed;
          if (draftOf(store, subjectType, subjectId)) return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-DRAFT-EXISTS', values: {} };
          const issues = currentLimitIssues(subject, old.content);
          if (issues.length > 0) {
            const places = [...new Set(issues.map((issue) => issue.fieldLabel))].join(', ');
            return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-RESTORE-BLOCKED', values: { 'danh sách chỗ cần sửa': places } };
          }
          const draft = writeDraft(store, subjectType, subjectId, old.content, context.actor.email);
          draft.basedOnRevisionNumber = revisionNumber;
          touch(store, subject.entity, context.actor.email);
          refreshName(subject);
          context.changeLines.push(`Bản nháp mới dựa trên bản ${revisionNumber}`);
          return { ok: true, messageKey: 'MSG-SAVED', data: { revisionNumber: draft.revisionNumber, basedOnRevisionNumber: revisionNumber } };
        },
      );
    },

    async getItemHistory({ subjectType, subjectId }) {
      if (!store.currentAdmin()) throw new AdminApiError('MSG-SESSION-EXPIRED');
      const publishedRevisions = revisionsOf(store, subjectType, subjectId)
        .filter((rev) => (rev.status === 'PHAT_HANH' || rev.status === 'LUU_TRU') && rev.publishedAt)
        .sort((a, b) => b.revisionNumber - a.revisionNumber)
        .map(summary);
      const auditRows = store.audit
        .filter((row) => row.subjectType === subjectType && row.subjectId === subjectId)
        .reverse()
        .map(withoutInternalId);
      return { publishedRevisions, auditRows };
    },

    async listAuditLog({ from, to, actorEmail, subjectType, page }) {
      const admin = store.currentAdmin();
      if (!admin) throw new AdminApiError('MSG-SESSION-EXPIRED');
      // Nhật ký toàn hệ thống chỉ dành cho Quản lý (BR-M03-A03, F09)
      if (admin.role !== 'REVIEWER') throw new AdminApiError('MSG-NO-PERMISSION');
      const actor = actorEmail?.trim().toLowerCase();
      const rows = store.audit
        .filter((row) => !from || row.occurredAt >= from)
        .filter((row) => !to || row.occurredAt < to)
        .filter((row) => !actor || row.actorEmail.toLowerCase().includes(actor))
        .filter((row) => !subjectType || row.subjectType === subjectType)
        .reverse();
      const start = page * AUDIT_PAGE_SIZE;
      // Q-11 kèm subjectId để dựng link tới mục (admin-command Q-11); Q-10 không cần vì đã ở trong mục
      return { rows: rows.slice(start, start + AUDIT_PAGE_SIZE), page, hasMore: rows.length > start + AUDIT_PAGE_SIZE };
    },
  };
}
