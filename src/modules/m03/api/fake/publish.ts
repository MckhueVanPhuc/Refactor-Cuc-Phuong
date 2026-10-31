// Xuất bản trên adapter giả (tasks T084): Q-08 và C-05 cho `CHECKPOINT_FIRST_PUBLICATION`, `QR_OBJECT`
// (BR-M03-D04, D05, E13, F01–F03, A05). Đơn vị tuyến (T103) và bản sửa có snapshot (T119) cài ở story sau.
// Review và xuất bản dùng chung một hàm dựng review: guard chạy lại đúng như lúc mở review.
import type { CheckpointContent, PublishUnitData, PublishUnitInput, QrContent } from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import type { FieldChange, PublicationReview, PublicationUnitType } from '../../contracts/publicationReview';
import { formatMessage, type MessageKey } from '../../messages/catalog';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { FIELD_LABELS, fieldLabel } from '../../messages/fieldLabels';
import { visitPointName } from '../../validation/visitPoint';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import {
  checkpointIssues,
  checkpointName,
  mediaOfContent,
  qrCodesOf,
  qrContent,
  qrIssues,
  qrReadiness,
  unreadableImageIssues,
} from './checkpointData';
import { draftOf, publishDraft, publishedOf, touch } from './revisions';
import type { CommandSpec, FakeCheckpoint, FakeQrCode, FakeStore } from './store';

type PublishArea = Pick<AdminApi, 'openPublicationReview' | 'publishUnit'>;

/** Review đã dựng kèm những gì C-05 cần để áp dụng */
type Unit = {
  review: PublicationReview;
  name: string;
  subjectType: 'CHECKPOINT' | 'QRCODE';
  lockKey: { key: string; itemName: string };
  lastEdit: { editorEmail: string; editedAt: string };
  apply: (actorEmail: string) => { publishedRevisionNumber: number; selfPublished: boolean };
};

const failed: CommandResult<never> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };

const LANGUAGE_NAMES = { vi: 'tiếng Việt', en: 'tiếng Anh' } as const;

function emptyReview(unitType: PublicationUnitType, reviewedConcurrencyRevision: number): PublicationReview {
  return {
    unitType,
    blockingIssues: [],
    changes: [],
    sensitiveChanges: [],
    affectedRoutes: [],
    leftOutCheckpoints: [],
    leftOutQrObjects: [],
    impactNotes: [],
    noSafetyWarningConfirmationRequired: false,
    reviewedConcurrencyRevision,
  };
}

const lastEditOf = (...items: { lastEditedByEmail: string; lastEditedAt: string }[]) => {
  const latest = items.reduce((a, b) => (b.lastEditedAt > a.lastEditedAt ? b : a));
  return { editorEmail: latest.lastEditedByEmail, editedAt: latest.lastEditedAt };
};

export function createFakePublishArea(store: FakeStore): PublishArea {
  /** Mốc của cả đơn vị: tăng mỗi khi thực thể hoặc bản nháp nào trong đơn vị đổi (BR-M03-F02) */
  function unitRevision(items: readonly { concurrencyRevision: number }[]): number {
    return items.reduce((sum, item) => sum + item.concurrencyRevision, 0);
  }

  function qrUnitParts(qr: FakeQrCode) {
    const draft = draftOf(store, 'QRCODE', qr.qrIdentifier);
    return draft ? [qr, draft] : [qr];
  }

  /** MSG-AV-ONE-LANGUAGE: chỉ cảnh báo, không chặn (BR-M03-E17) */
  function oneLanguageNotes(name: string, content: QrContent): string[] {
    const spoken = new Set(
      mediaOfContent(store, content)
        .filter((media) => media.type !== 'IMAGE')
        .map((media) => media.spokenLanguage),
    );
    const hasVi = spoken.has('vi');
    const hasEn = spoken.has('en');
    if (hasVi === hasEn) return [];
    const [only, other] = hasVi ? (['vi', 'en'] as const) : (['en', 'vi'] as const);
    return [
      formatMessage('MSG-AV-ONE-LANGUAGE', { tên: name, 'ngôn ngữ': LANGUAGE_NAMES[only], 'ngôn ngữ còn lại': LANGUAGE_NAMES[other] }),
    ];
  }

  function textChanges(
    itemType: 'CHECKPOINT' | 'QRCODE',
    fieldKey: string,
    before: { vi?: string; en?: string } | undefined,
    after: { vi?: string; en?: string } | undefined,
  ): FieldChange[] {
    return (['vi', 'en'] as const).flatMap((language) => {
      const from = before?.[language]?.trim() ?? '';
      const to = after?.[language]?.trim() ?? '';
      return from === to ? [] : [{ fieldLabel: fieldLabel(itemType, `${fieldKey}.${language}`) ?? fieldKey, before: from, after: to }];
    });
  }

  function mediaCountChanges(before: QrContent | undefined, after: QrContent): FieldChange[] {
    const count = (content: QrContent | undefined, image: boolean) =>
      content ? mediaOfContent(store, content).filter((media) => (media.type === 'IMAGE') === image).length : 0;
    return [
      { label: FIELD_LABELS.QRCODE.images, unit: 'ảnh', image: true },
      { label: FIELD_LABELS.QRCODE.avFiles, unit: 'tệp', image: false },
    ].flatMap(({ label, unit, image }) => {
      const from = count(before, image);
      const to = count(after, image);
      return from === to ? [] : [{ fieldLabel: label, before: `${from} ${unit}`, after: `${to} ${unit}` }];
    });
  }

  function checkpointFirstPublication(checkpointId: string): Unit {
    const checkpoint = store.state.checkpoints.get(checkpointId);
    const draft = checkpoint && draftOf(store, 'CHECKPOINT', checkpointId);
    if (!checkpoint || !draft || checkpoint.status !== 'NHAP') throw new AdminApiError('MSG-GENERIC');
    const content = draft.content as CheckpointContent;
    const drafts = qrCodesOf(store, checkpointId).filter((qr) => qr.status === 'NHAP');
    const ready = drafts.filter((qr) => qrReadiness(store, qr, checkpoint).ready);
    const notReady = drafts.filter((qr) => !ready.includes(qr));
    const name = checkpointName(store, checkpoint);

    const review = emptyReview(
      'CHECKPOINT_FIRST_PUBLICATION',
      unitRevision([checkpoint, draft, ...drafts.flatMap(qrUnitParts)]),
    );
    review.blockingIssues = [
      ...checkpointIssues(store, checkpoint),
      ...unreadableImageIssues(store, checkpoint, ready.map((qr) => ({ qr, content: qrContent(store, qr) }))),
    ];
    review.changes = [
      ...textChanges('CHECKPOINT', 'checkpointName', undefined, content.checkpointName),
      ...(content.connectivityMode
        ? [{ fieldLabel: FIELD_LABELS.CHECKPOINT.connectivityMode, before: '', after: DISPLAY_NAMES.connectivityMode[content.connectivityMode] }]
        : []),
      ...ready.map((qr) => ({
        fieldLabel: 'Điểm tham quan',
        before: '',
        after: visitPointName(qrContent(store, qr).objectName?.vi, qr.creationOrder),
      })),
    ];
    review.leftOutQrObjects = notReady.map((qr) => ({
      name: visitPointName(qrContent(store, qr).objectName?.vi, qr.creationOrder),
      missing: qrReadiness(store, qr, checkpoint).missing,
    }));
    review.impactNotes = ready.flatMap((qr) =>
      oneLanguageNotes(visitPointName(qrContent(store, qr).objectName?.vi, qr.creationOrder), qrContent(store, qr)),
    );

    return {
      review,
      name,
      subjectType: 'CHECKPOINT',
      lockKey: { key: `checkpoint:${checkpointId}`, itemName: name },
      lastEdit: lastEditOf(checkpoint, draft, ...drafts),
      apply(actorEmail) {
        // Điểm dừng và mọi điểm tham quan sẵn sàng cùng Đang hoạt động; điểm chưa sẵn sàng giữ Nháp (BR-M03-D05).
        // Không tạo phiên bản hành trình vì chưa tuyến nào liệt kê điểm dừng.
        const selfPublished = publishDraft(store, draft, actorEmail);
        checkpoint.status = 'HOAT_DONG';
        touch(store, checkpoint, actorEmail);
        for (const qr of ready) {
          const qrDraft = draftOf(store, 'QRCODE', qr.qrIdentifier);
          if (qrDraft) publishDraft(store, qrDraft, actorEmail);
          qr.status = 'HOAT_DONG';
          touch(store, qr, actorEmail);
        }
        return { publishedRevisionNumber: draft.revisionNumber, selfPublished };
      },
    };
  }

  function visitPointPublication(qrIdentifier: string): Unit {
    const qr = store.state.qrCodes.get(qrIdentifier);
    const checkpoint: FakeCheckpoint | undefined = qr && store.state.checkpoints.get(qr.checkpointId);
    const draft = qr && draftOf(store, 'QRCODE', qrIdentifier);
    // Điểm dừng chưa xuất bản thì điểm tham quan đi cùng lần xuất bản đầu của điểm dừng (BR-M03-D05)
    const checkpointLive = checkpoint?.status === 'HOAT_DONG' || checkpoint?.status === 'TAM_DONG';
    if (!qr || !checkpoint || !draft || !checkpointLive || qr.status === 'THU_HOI') throw new AdminApiError('MSG-GENERIC');
    const after = draft.content as QrContent;
    const beforeContent = publishedOf(store, 'QRCODE', qrIdentifier)?.content as QrContent | undefined;
    const name = visitPointName(after.objectName?.vi, qr.creationOrder);

    const review = emptyReview('QR_OBJECT', unitRevision(qrUnitParts(qr)));
    review.blockingIssues = [
      ...qrIssues(store, qr, checkpoint, 'draft'),
      ...unreadableImageIssues(store, checkpoint, [{ qr, content: after }]),
    ];
    review.changes = [
      ...textChanges('QRCODE', 'objectName', beforeContent?.objectName, after.objectName),
      ...textChanges('QRCODE', 'introductionText', beforeContent?.introductionText, after.introductionText),
      ...mediaCountChanges(beforeContent, after),
    ];
    review.impactNotes = oneLanguageNotes(name, after);
    // Tuyến bị ảnh hưởng và phiên bản hành trình mới (điểm dừng `OFFLINE_REQUIRED` đang được liệt kê): US4 (T119)

    return {
      review,
      name,
      subjectType: 'QRCODE',
      lockKey: { key: `checkpoint:${checkpoint.checkpointId}`, itemName: checkpointName(store, checkpoint) },
      lastEdit: lastEditOf(qr, draft),
      apply(actorEmail) {
        const selfPublished = publishDraft(store, draft, actorEmail);
        qr.status = 'HOAT_DONG';
        touch(store, qr, actorEmail);
        return { publishedRevisionNumber: draft.revisionNumber, selfPublished };
      },
    };
  }

  function buildUnit(unitType: PublicationUnitType, subjectId: string): Unit {
    switch (unitType) {
      case 'CHECKPOINT_FIRST_PUBLICATION':
        return checkpointFirstPublication(subjectId);
      case 'QR_OBJECT':
        return visitPointPublication(subjectId);
      default:
        throw new Error(`Adapter giả chưa có xuất bản ${unitType}: khu vực publish — T103 (US3), T119 (US4)`);
    }
  }

  return {
    async openPublicationReview({ unitType, subjectId }) {
      if (!store.currentAdmin()) throw new AdminApiError('MSG-SESSION-EXPIRED');
      return buildUnit(unitType, subjectId).review;
    },

    async publishUnit(input: PublishUnitInput) {
      let unit: Unit | undefined;
      try {
        unit = buildUnit(input.unitType, input.subjectId);
      } catch (error) {
        if (!(error instanceof AdminApiError)) throw error;
      }
      const subjectType = input.unitType === 'QR_OBJECT' ? 'QRCODE' : 'CHECKPOINT';
      const spec: CommandSpec = {
        action: 'PUBLISHED',
        roles: 'B',
        subject: { type: subjectType, id: input.subjectId, ...(unit?.name ? { name: unit.name } : {}) },
        ...(unit
          ? {
              lockKeys: [unit.lockKey],
              expected: [
                { submitted: input.reviewedConcurrencyRevision, current: unit.review.reviewedConcurrencyRevision, ...unit.lastEdit },
              ],
            }
          : {}),
      };
      return store.run(spec, (context): CommandResult<PublishUnitData> => {
        if (!unit) return failed;
        // Còn thiếu thì không xuất bản gì (BR-M03-F01)
        const issues = unit.review.blockingIssues;
        if (issues.length > 0) {
          return { ok: false, reason: 'VALIDATION', messageKey: issues[0]!.messageKey as MessageKey, issues };
        }
        const { publishedRevisionNumber, selfPublished } = unit.apply(context.actor.email);
        context.selfPublished = selfPublished;
        return { ok: true, messageKey: 'MSG-PUBLISHED', data: { publishedRevisionNumber, newJourneyVersions: [] } };
      });
    },
  };
}
