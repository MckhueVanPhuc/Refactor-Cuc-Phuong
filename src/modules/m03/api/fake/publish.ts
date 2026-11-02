// Xuất bản trên adapter giả (tasks T084, T103, T119): Q-08 và C-05 cho mọi đơn vị xuất bản
// (BR-M03-C04, C09, C10, C15–C17, D04–D06, E06, E13, F01–F05, G01–G06, G10, T05, T06, X02, X03, A05).
// Review và xuất bản dùng chung một hàm dựng đơn vị: guard chạy lại đúng như lúc mở review.
import { OFFLINE_PACKAGE_MAX_BYTES, OFFLINE_PACKAGE_MAX_MB } from '../../config/limits';
import type {
  CheckpointContent,
  DraftBilingual,
  PublishUnitData,
  PublishUnitInput,
  QrContent,
  RouteContent,
} from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import type { FieldChange, PublicationReview, PublicationUnitType } from '../../contracts/publicationReview';
import type { ValidationIssue } from '../../contracts/validationIssue';
import { affectedRoutesLine, changeLine } from '../../history/auditFormat';
import { formatMessage, type MessageKey } from '../../messages/catalog';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { FIELD_LABELS, fieldLabel } from '../../messages/fieldLabels';
import { formatMegabytes } from '../../messages/format';
import { checkpointPublishIssues } from '../../validation/checkpoint';
import { makeIssue } from '../../validation/common';
import { routePublishIssues } from '../../validation/publishGaps';
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
import {
  activeSnapshotOf,
  buildJourney,
  commitRebuilds,
  commitSnapshot,
  rebuildRoutes,
  routesAffectedBy,
  sameJourney,
  type JourneyBuild,
  type RouteRebuild,
} from './journey';
import { draftOf, publishDraft, publishedOf, touch } from './revisions';
import { listedCheckpointStates, routeMediaStates } from './routes';
import type { CommandSpec, FakeCheckpoint, FakeQrCode, FakeStore } from './store';

type PublishArea = Pick<AdminApi, 'openPublicationReview' | 'publishUnit'>;

/** Review đã dựng kèm những gì C-05 cần để kiểm và áp dụng */
type Unit = {
  review: PublicationReview;
  name: string;
  subjectType: 'ROUTE' | 'CHECKPOINT' | 'QRCODE';
  lockKeys: { key: string; itemName: string }[];
  lastEdit: { editorEmail: string; editedAt: string };
  /** Guard lúc xuất bản; mặc định: còn issue chặn thì VALIDATION (BR-M03-F01) */
  check?: (input: PublishUnitInput) => CommandResult<never> | undefined;
  apply: (actorEmail: string) => { publishedRevisionNumber: number; selfPublished: boolean; newJourneyVersions: PublishUnitData['newJourneyVersions'] };
};

const failed: CommandResult<never> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };

const LANGUAGE_NAMES = { vi: 'tiếng Việt', en: 'tiếng Anh' } as const;

/** Trường của tuyến mà review phải tô sáng vì không có người duyệt thứ hai (BR-M03-C10) */
const SENSITIVE_ROUTE_FIELDS = ['safetyWarning', 'participationRequirements', 'offlineRouteMapRequired'] as const;

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

const validationOf = (issues: readonly ValidationIssue[]): CommandResult<never> | undefined =>
  issues.length > 0 ? { ok: false, reason: 'VALIDATION', messageKey: issues[0]!.messageKey as MessageKey, issues: [...issues] } : undefined;

const hasText = (value: DraftBilingual | undefined) => Boolean(value?.vi?.trim() || value?.en?.trim());

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
    itemType: 'ROUTE' | 'CHECKPOINT' | 'QRCODE',
    fieldKey: string,
    before: DraftBilingual | undefined,
    after: DraftBilingual | undefined,
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

    const review = emptyReview('CHECKPOINT_FIRST_PUBLICATION', unitRevision([checkpoint, draft, ...drafts.flatMap(qrUnitParts)]));
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
      lockKeys: [{ key: `checkpoint:${checkpointId}`, itemName: name }],
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
        return { publishedRevisionNumber: draft.revisionNumber, selfPublished, newJourneyVersions: [] };
      },
    };
  }

  /**
   * Tác động lên các tuyến của một thay đổi ở điểm dừng hoặc điểm tham quan (BR-M03-X02, X03, G10):
   * dòng "Tuyến bị ảnh hưởng", vượt trần (chỉ tuyến có hành trình đổi), ghi chú tác động, khóa tập.
   */
  function impactOf(rebuilds: readonly RouteRebuild[]) {
    const affectedRoutes: PublicationReview['affectedRoutes'] = rebuilds.map(({ route, name, build, changed }) => ({
      routeId: route.routeId,
      routeName: name,
      routeStatus: route.status === 'TAM_DONG' ? 'TAM_DONG' : 'HOAT_DONG',
      createsNewJourneyVersion: changed,
      estimatedOfflineSizeBytes: build.sizeBytes,
      closesAutomatically: false,
    }));
    const tooBig = rebuilds.find(({ changed, build }) => changed && build.sizeBytes > OFFLINE_PACKAGE_MAX_BYTES);
    const size = tooBig && sizeBlock(tooBig.route.routeId, tooBig.name, tooBig.build);
    const changedNames = rebuilds.filter((rebuild) => rebuild.changed).map((rebuild) => rebuild.name);
    return {
      affectedRoutes,
      sizeIssues: size ? [size.issue] : [],
      blocked: size?.blocked,
      notes: changedNames.length > 0 ? [formatMessage('MSG-AFFECTED-ROUTES', { số: changedNames.length, 'danh sách': changedNames.join(', ') })] : [],
      lockKeys: rebuilds.map(({ route, name }) => ({ key: `route:${route.routeId}`, itemName: name })),
    };
  }

  /** MSG-OFFLINE-TOO-BIG: issue trên review và từ chối BLOCKED lúc xuất bản, nêu tuyến và ảnh nặng nhất */
  function sizeBlock(routeId: string, routeName: string, build: JourneyBuild) {
    const values = {
      'tên tuyến': routeName,
      số: formatMegabytes(build.sizeBytes),
      'tối đa': OFFLINE_PACKAGE_MAX_MB,
      'danh sách': build.heaviestImages.join(', '),
    };
    const issue = makeIssue({
      itemType: 'ROUTE',
      itemId: routeId,
      severity: 'BLOCKS_PUBLISH',
      fieldKey: 'checkpointList',
      messageKey: 'MSG-OFFLINE-TOO-BIG',
      values,
    });
    const blocked: CommandResult<never> = { ok: false, reason: 'BLOCKED', messageKey: 'MSG-OFFLINE-TOO-BIG', values };
    return { issue, blocked };
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
    // Hành trình sau khi xuất bản: điểm tham quan Đang hoạt động với nội dung nháp (BR-M03-E06, E13)
    const routes = routesAffectedBy(store, checkpoint.checkpointId);
    const rebuilds = rebuildRoutes(store, routes, { qrCodes: new Map([[qrIdentifier, { content: after, status: 'HOAT_DONG' as const }]]) });
    const impact = impactOf(rebuilds);

    const review = emptyReview('QR_OBJECT', unitRevision([...qrUnitParts(qr), ...routes]));
    const gaps = [...qrIssues(store, qr, checkpoint, 'draft'), ...unreadableImageIssues(store, checkpoint, [{ qr, content: after }])];
    review.blockingIssues = [...gaps, ...impact.sizeIssues];
    review.changes = [
      ...textChanges('QRCODE', 'objectName', beforeContent?.objectName, after.objectName),
      ...textChanges('QRCODE', 'introductionText', beforeContent?.introductionText, after.introductionText),
      ...mediaCountChanges(beforeContent, after),
    ];
    review.affectedRoutes = impact.affectedRoutes;
    review.impactNotes = [...impact.notes, ...oneLanguageNotes(name, after)];

    return {
      review,
      name,
      subjectType: 'QRCODE',
      lockKeys: [{ key: `checkpoint:${checkpoint.checkpointId}`, itemName: checkpointName(store, checkpoint) }, ...impact.lockKeys],
      lastEdit: lastEditOf(qr, draft),
      check: () => validationOf(gaps) ?? impact.blocked,
      apply(actorEmail) {
        const selfPublished = publishDraft(store, draft, actorEmail);
        qr.status = 'HOAT_DONG';
        touch(store, qr, actorEmail);
        return { publishedRevisionNumber: draft.revisionNumber, selfPublished, newJourneyVersions: commitRebuilds(store, rebuilds) };
      },
    };
  }

  /** Bản sửa thông tin điểm dừng (tên, mode) sau lần xuất bản đầu (BR-M03-D06, D11, G04) */
  function checkpointRevision(checkpointId: string): Unit {
    const checkpoint = store.state.checkpoints.get(checkpointId);
    const draft = checkpoint && draftOf(store, 'CHECKPOINT', checkpointId);
    const live = checkpoint?.status === 'HOAT_DONG' || checkpoint?.status === 'TAM_DONG';
    if (!checkpoint || !draft || !live) throw new AdminApiError('MSG-GENERIC');
    const after = draft.content as CheckpointContent;
    const before = (publishedOf(store, 'CHECKPOINT', checkpointId)?.content ?? {}) as CheckpointContent;
    const active = qrCodesOf(store, checkpointId).filter((qr) => qr.status === 'HOAT_DONG');
    const routes = routesAffectedBy(store, checkpointId);
    const rebuilds = rebuildRoutes(store, routes, { checkpoints: new Map([[checkpointId, after]]) });
    const impact = impactOf(rebuilds);
    const name = after.checkpointName?.vi?.trim() ?? checkpointName(store, checkpoint);

    const gaps = [
      ...checkpointPublishIssues(checkpointId, after, active.length),
      // Đổi sang "Cần tải trước": ảnh của mọi điểm tham quan đang hoạt động phải đọc được (BR-M03-D04 điều 4)
      ...(after.connectivityMode === 'OFFLINE_REQUIRED'
        ? active.flatMap((qr) =>
            unreadableImageIssues(store, checkpoint, [{ qr, content: (publishedOf(store, 'QRCODE', qr.qrIdentifier)?.content ?? {}) as QrContent }]),
          )
        : []),
    ];
    const review = emptyReview('CHECKPOINT_REVISION', unitRevision([checkpoint, draft, ...routes]));
    review.blockingIssues = [...gaps, ...impact.sizeIssues];
    review.changes = [
      ...textChanges('CHECKPOINT', 'checkpointName', before.checkpointName, after.checkpointName),
      ...(before.connectivityMode !== after.connectivityMode && after.connectivityMode
        ? [
            {
              fieldLabel: FIELD_LABELS.CHECKPOINT.connectivityMode,
              before: before.connectivityMode ? DISPLAY_NAMES.connectivityMode[before.connectivityMode] : '',
              after: DISPLAY_NAMES.connectivityMode[after.connectivityMode],
            },
          ]
        : []),
    ];
    review.affectedRoutes = impact.affectedRoutes;
    review.impactNotes = [
      ...impact.notes,
      // Dòng hướng dẫn trên tem phụ thuộc mode (BR-M03-B05)
      ...(before.connectivityMode !== after.connectivityMode ? [formatMessage('MSG-REPRINT-MODE-CHANGED', { tên: name })] : []),
    ];

    return {
      review,
      name,
      subjectType: 'CHECKPOINT',
      // Câu MSG-ROUTE-BUSY gọi điểm dừng bằng tên đang công khai, không phải tên nháp
      lockKeys: [{ key: `checkpoint:${checkpointId}`, itemName: before.checkpointName?.vi ?? checkpointName(store, checkpoint) }, ...impact.lockKeys],
      lastEdit: lastEditOf(checkpoint, draft),
      check: () => validationOf(gaps) ?? impact.blocked,
      apply(actorEmail) {
        const selfPublished = publishDraft(store, draft, actorEmail);
        touch(store, checkpoint, actorEmail);
        checkpoint.name = checkpointName(store, checkpoint);
        return { publishedRevisionNumber: draft.revisionNumber, selfPublished, newJourneyVersions: commitRebuilds(store, rebuilds) };
      },
    };
  }

  /** Trước/sau của nội dung tuyến; lần đầu thì "trước" trống */
  function routeChanges(before: RouteContent | undefined, after: RouteContent): FieldChange[] {
    const labels = FIELD_LABELS.ROUTE;
    const line = (fieldLabel: string, from: string, to: string): FieldChange[] => (from === to ? [] : [{ fieldLabel, before: from, after: to }]);
    const number = (value: number | undefined) => (value === undefined ? '' : String(value).replace('.', ','));
    const tags = (values: readonly string[] | undefined, names: Record<string, string>) => (values ?? []).map((tag) => names[tag] ?? '').join(', ');
    const checkpoints = (content: RouteContent | undefined) =>
      (content?.checkpointList ?? [])
        .map(({ checkpointId }) => {
          const checkpoint = store.state.checkpoints.get(checkpointId);
          return checkpoint ? checkpointName(store, checkpoint) : '';
        })
        .join(', ');
    const count = (content: RouteContent | undefined) => `${(content?.galleryItems ?? []).length} ảnh`;
    const flag = (value: boolean | undefined) => (value ? 'Có' : before ? 'Không' : '');
    return [
      ...line(labels.thumbnailMediaId, before?.thumbnailMediaId ? 'Có' : '', after.thumbnailMediaId === before?.thumbnailMediaId ? (before?.thumbnailMediaId ? 'Có' : '') : after.thumbnailMediaId ? 'Ảnh mới' : ''),
      ...(['name', 'shortDescription'] as const).flatMap((key) => textChanges('ROUTE', key, before?.[key], after[key])),
      ...line(labels.distanceKm, number(before?.distanceKm), number(after.distanceKm)),
      ...line(labels.durationMin, number(before?.durationMin), number(after.durationMin)),
      ...line(labels.difficulty, before?.difficulty ? DISPLAY_NAMES.difficulty[before.difficulty] : '', after.difficulty ? DISPLAY_NAMES.difficulty[after.difficulty] : ''),
      ...(['description', 'startingPoint', 'participationRequirements', 'preparation', 'bestTime', 'safetyWarning'] as const).flatMap((key) =>
        textChanges('ROUTE', key, before?.[key], after[key]),
      ),
      ...line(labels.galleryItems, before ? count(before) : '', count(after)),
      ...line(labels.offlineRouteMapRequired, flag(before?.offlineRouteMapRequired), flag(after.offlineRouteMapRequired)),
      ...line(labels.groupTags, tags(before?.groupTags, DISPLAY_NAMES.groupTag), tags(after.groupTags, DISPLAY_NAMES.groupTag)),
      ...line(labels.experienceTags, tags(before?.experienceTags, DISPLAY_NAMES.experienceTag), tags(after.experienceTags, DISPLAY_NAMES.experienceTag)),
      ...line(labels.checkpointList, checkpoints(before), checkpoints(after)),
    ];
  }

  /** Xuất bản tuyến: lần đầu (`ROUTE_FIRST_PUBLICATION`) hoặc bản sửa (`ROUTE_INFORMATION`) */
  function routePublication(routeId: string, first: boolean): Unit {
    const route = store.state.routes.get(routeId);
    const draft = route && draftOf(store, 'ROUTE', routeId);
    const statusOk = first ? route?.status === 'NHAP' : route?.status === 'HOAT_DONG' || route?.status === 'TAM_DONG';
    if (!route || !draft || !statusOk) throw new AdminApiError('MSG-GENERIC');
    const content = draft.content as RouteContent;
    const before = first ? undefined : (publishedOf(store, 'ROUTE', routeId)?.content as RouteContent | undefined);
    const name = content.name?.vi?.trim() ?? '';
    const journey = buildJourney(store, routeId, content);
    // Bản sửa chỉ tạo version khi hành trình đổi: danh sách, thứ tự, sơ đồ offline (BR-M03-C15, C16, T06, G04)
    const changed = first || !sameJourney(journey.candidate, activeSnapshotOf(store, route));
    const listed = listedCheckpointStates(store, content);

    // Tick "không có cảnh báo" nằm trên màn review, không phải khoảng trống của bản nháp (BR-M03-C09).
    // Tuyến đang hoạt động không được mất điểm dừng hoạt động cuối: BLOCKED riêng (BR-M03-T05).
    const gaps = routePublishIssues(routeId, content, { media: routeMediaStates(store, routeId), checkpoints: listed }).filter(
      (issue) => issue.messageKey !== 'MSG-SAFETY-CONFIRM' && (first || issue.messageKey !== 'MSG-NO-ACTIVE-CHECKPOINT'),
    );
    const lastCheckpointRemoved = !first && route.status === 'HOAT_DONG' && journey.candidate.checkpoints.length === 0;
    const size = changed && journey.sizeBytes > OFFLINE_PACKAGE_MAX_BYTES ? sizeBlock(routeId, name, journey) : undefined;
    const safetyRequired = !hasText(content.safetyWarning) && !content.noSafetyWarningConfirmed;

    // Tập kết nối: tuyến và mọi điểm dừng trong danh sách đã xuất bản và bản nháp (BR-M03-F05; research R-08)
    const lockedCheckpoints = [...new Set([...(before?.checkpointList ?? []), ...(content.checkpointList ?? [])].map((item) => item.checkpointId))].flatMap(
      (checkpointId) => {
        const checkpoint = store.state.checkpoints.get(checkpointId);
        return checkpoint ? [checkpoint] : [];
      },
    );
    const review = emptyReview(first ? 'ROUTE_FIRST_PUBLICATION' : 'ROUTE_INFORMATION', unitRevision([route, draft, ...lockedCheckpoints]));
    review.blockingIssues = [...gaps, ...(size ? [size.issue] : [])];
    review.noSafetyWarningConfirmationRequired = safetyRequired;
    review.leftOutCheckpoints = journey.leftOut;
    review.affectedRoutes = [
      {
        routeId,
        routeName: name,
        routeStatus: route.status === 'TAM_DONG' ? 'TAM_DONG' : 'HOAT_DONG',
        createsNewJourneyVersion: changed,
        estimatedOfflineSizeBytes: journey.sizeBytes,
        closesAutomatically: false,
      },
    ];
    review.changes = routeChanges(before, content);
    const sensitiveLabels = new Set(
      SENSITIVE_ROUTE_FIELDS.flatMap((key) =>
        key === 'offlineRouteMapRequired' ? [FIELD_LABELS.ROUTE[key]] : [fieldLabel('ROUTE', `${key}.vi`), fieldLabel('ROUTE', `${key}.en`)],
      ),
    );
    review.sensitiveChanges = review.changes.filter((change) => sensitiveLabels.has(change.fieldLabel));

    return {
      review,
      name,
      subjectType: 'ROUTE',
      lockKeys: [
        { key: `route:${routeId}`, itemName: name },
        ...lockedCheckpoints.map((checkpoint) => ({ key: `checkpoint:${checkpoint.checkpointId}`, itemName: checkpointName(store, checkpoint) })),
      ],
      lastEdit: lastEditOf(route, draft),
      check(input) {
        const missing = validationOf(gaps);
        if (missing) return missing;
        if (lastCheckpointRemoved) return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-ROUTE-LAST-CHECKPOINT', values: {} };
        if (size) return size.blocked;
        if (safetyRequired && !input.noSafetyWarningConfirmed) {
          return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-SAFETY-CONFIRM', values: {} };
        }
        return undefined;
      },
      apply(actorEmail) {
        // Tick xác nhận trên review được lưu vào nội dung và chép sang các bản nháp sau (BR-M03-C09)
        if (safetyRequired) (draft.content as RouteContent).noSafetyWarningConfirmed = true;
        const selfPublished = publishDraft(store, draft, actorEmail);
        // Xuất bản tuyến không bao giờ xuất bản điểm dừng hay điểm tham quan (BR-M03-C17)
        const newJourneyVersions = changed ? [{ routeId, contentVersion: commitSnapshot(store, route, journey.candidate).contentVersion }] : [];
        if (first) route.status = 'HOAT_DONG';
        touch(store, route, actorEmail);
        if (name) route.name = name;
        return { publishedRevisionNumber: draft.revisionNumber, selfPublished, newJourneyVersions };
      },
    };
  }

  function buildUnit(unitType: PublicationUnitType, subjectId: string): Unit {
    switch (unitType) {
      case 'CHECKPOINT_FIRST_PUBLICATION':
        return checkpointFirstPublication(subjectId);
      case 'CHECKPOINT_REVISION':
        return checkpointRevision(subjectId);
      case 'QR_OBJECT':
        return visitPointPublication(subjectId);
      case 'ROUTE_FIRST_PUBLICATION':
        return routePublication(subjectId, true);
      case 'ROUTE_INFORMATION':
        return routePublication(subjectId, false);
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
      const subjectType = input.unitType === 'QR_OBJECT' ? 'QRCODE' : input.unitType.startsWith('ROUTE') ? 'ROUTE' : 'CHECKPOINT';
      const spec: CommandSpec = {
        action: 'PUBLISHED',
        roles: 'B',
        subject: { type: subjectType, id: input.subjectId, ...(unit?.name ? { name: unit.name } : {}) },
        ...(unit
          ? {
              lockKeys: unit.lockKeys,
              expected: [{ submitted: input.reviewedConcurrencyRevision, current: unit.review.reviewedConcurrencyRevision, ...unit.lastEdit }],
            }
          : {}),
      };
      return store.run(spec, (context): CommandResult<PublishUnitData> => {
        if (!unit) return failed;
        // Còn thiếu thì không xuất bản gì (BR-M03-F01)
        const rejected = unit.check ? unit.check(input) : validationOf(unit.review.blockingIssues);
        if (rejected) return rejected;
        const { publishedRevisionNumber, selfPublished, newJourneyVersions } = unit.apply(context.actor.email);
        context.selfPublished = selfPublished;
        // Dòng audit ghi nội dung trước/sau và, với điểm dừng/điểm tham quan, các tuyến bị ảnh hưởng (BR-M03-F08, X06)
        context.changeLines.push(...unit.review.changes.map(changeLine));
        if (subjectType !== 'ROUTE' && unit.review.affectedRoutes.length > 0) {
          context.changeLines.push(affectedRoutesLine(unit.review.affectedRoutes.map((route) => route.routeName)));
        }
        return { ok: true, messageKey: 'MSG-PUBLISHED', data: { publishedRevisionNumber, newJourneyVersions } };
      });
    },
  };
}
