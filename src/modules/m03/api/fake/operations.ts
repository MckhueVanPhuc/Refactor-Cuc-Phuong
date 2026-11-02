// Đóng tạm, mở lại, lưu trữ trên adapter giả (tasks T135): C-09…C-15 và Q-09 theo admin-command §5–§6 và
// data-model §8 (BR-M03-H01–H09, D10, T05, T07, G10, X02, X06). Mỗi command đi qua `store.run`: quyền, lỗi tiêm,
// khóa tập (tuyến/điểm dừng và mọi tuyến bị ảnh hưởng), stale, rollback khi thất bại, đúng một dòng audit.
import { OFFLINE_PACKAGE_MAX_BYTES, OFFLINE_PACKAGE_MAX_MB } from '../../config/limits';
import type {
  CheckpointContent,
  CloseCheckpointData,
  CloseRoutesListingCheckpointData,
  RouteContent,
  StatusChangeData,
} from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import { affectedRoutesLine } from '../../history/auditFormat';
import { formatMessage } from '../../messages/catalog';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { formatMegabytes } from '../../messages/format';
import { checkpointPublishIssues } from '../../validation/checkpoint';
import { routePublishIssues } from '../../validation/publishGaps';
import { visitPointPublishIssues } from '../../validation/visitPoint';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import { checkpointName, qrCheckInput, qrCodesOf, qrContent, routesListing, unreadableImageIssues } from './checkpointData';
import { reasonProblem } from './checkpoints';
import { activeSnapshotOf, commitRebuilds, rebuildRoutes, routesAffectedBy, type RouteRebuild } from './journey';
import { expectedFor, publishedOf, touch } from './revisions';
import { listedCheckpointStates, routeMediaStates } from './routes';
import type { CommandContext, FakeCheckpoint, FakeRoute, FakeStore } from './store';

type OperationsArea = Pick<
  AdminApi,
  | 'closeRoute'
  | 'closeCheckpoint'
  | 'closeRoutesListingCheckpoint'
  | 'reopenRoute'
  | 'reopenCheckpoint'
  | 'archiveRoute'
  | 'archiveCheckpoint'
  | 'getOperationImpact'
>;

const SAFETY_NOTE_LABEL = 'Ghi chú xác nhận an toàn';

/** Sai trạng thái nguồn (mục không còn ở trạng thái cho phép thao tác): danh mục §5.6 không có câu riêng */
const failed: CommandResult<never> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };

const status = (code: keyof typeof DISPLAY_NAMES.routeStatus) => DISPLAY_NAMES.routeStatus[code];
const routeNameOf = (route: FakeRoute) => route.name ?? '';
const routeRef = (route: FakeRoute) => ({ routeId: route.routeId, routeName: routeNameOf(route) });

export function createFakeOperationsArea(store: FakeStore): OperationsArea {
  const routes = () => store.state.routes;
  const checkpoints = () => store.state.checkpoints;

  function routeLock(route: FakeRoute) {
    return { key: `route:${route.routeId}`, itemName: routeNameOf(route) };
  }

  /** Tập kết nối của một thao tác trên điểm dừng: điểm dừng và mọi tuyến bị ảnh hưởng (research R-08) */
  function checkpointLocks(checkpoint: FakeCheckpoint) {
    return [
      { key: `checkpoint:${checkpoint.checkpointId}`, itemName: checkpointName(store, checkpoint) },
      ...routesAffectedBy(store, checkpoint.checkpointId).map(routeLock),
    ];
  }

  /** Tuyến `HOAT_DONG` sẽ hết điểm dừng hoạt động khi điểm dừng này đóng (BR-M03-H02, T05) */
  function autoClosingRoutes(checkpointId: string): FakeRoute[] {
    return routesAffectedBy(store, checkpointId).filter((route) => {
      if (route.status !== 'HOAT_DONG') return false;
      const remaining = activeSnapshotOf(store, route)?.checkpoints.filter((item) => item.checkpointId !== checkpointId) ?? [];
      return remaining.length === 0;
    });
  }

  /** Kiểm tra kỹ thuật trước khi mở lại tuyến (BR-M03-H07); câu đã điền giá trị */
  function routeReopenBlockers(route: FakeRoute): string[] {
    const content = (publishedOf(store, 'ROUTE', route.routeId)?.content ?? {}) as RouteContent;
    const issues = routePublishIssues(route.routeId, content, {
      media: routeMediaStates(store, route.routeId),
      checkpoints: listedCheckpointStates(store, content),
    });
    return [...new Set(issues.map((issue) => issue.message))];
  }

  /** Kiểm tra kỹ thuật trước khi mở lại điểm dừng, trên dữ liệu đã xuất bản (BR-M03-H06) */
  function checkpointReopenBlockers(checkpoint: FakeCheckpoint): string[] {
    const content = (publishedOf(store, 'CHECKPOINT', checkpoint.checkpointId)?.content ?? {}) as CheckpointContent;
    const active = qrCodesOf(store, checkpoint.checkpointId).filter((qr) => qr.status === 'HOAT_DONG');
    const visitPointIssues = active.flatMap((qr) => visitPointPublishIssues(qrCheckInput(store, qr, checkpoint, 'published')));
    const issues = [
      ...checkpointPublishIssues(checkpoint.checkpointId, content, active.length).filter((issue) => issue.targetFieldKey !== 'visitPoints'),
      ...visitPointIssues,
      ...unreadableImageIssues(store, checkpoint, active.map((qr) => ({ qr, content: qrContent(store, qr, 'published') }))),
    ];
    const blockers = issues.map((issue) => issue.message);
    if (active.length === 0) blockers.unshift(formatMessage('MSG-MISSING-FIELD', { 'tên ô': 'ít nhất một điểm tham quan đang hoạt động' }));
    if (content.connectivityMode === 'ONLINE_AVAILABLE' && !content.fieldVerificationConfirmed) {
      blockers.push(formatMessage('MSG-ONLINE-NOT-VERIFIED', { tên: content.checkpointName?.vi?.trim() ?? '' }));
    }
    return [...new Set(blockers)];
  }

  /** MSG-OFFLINE-TOO-BIG cho tuyến đầu tiên có hành trình mới vượt trần (BR-M03-G10) */
  function ceilingBlock(rebuilds: readonly RouteRebuild[]): CommandResult<never> | undefined {
    const over = rebuilds.find((rebuild) => rebuild.changed && rebuild.build.sizeBytes > OFFLINE_PACKAGE_MAX_BYTES);
    if (!over) return undefined;
    return {
      ok: false,
      reason: 'BLOCKED',
      messageKey: 'MSG-OFFLINE-TOO-BIG',
      values: {
        'tên tuyến': over.name,
        số: formatMegabytes(over.build.sizeBytes),
        'tối đa': OFFLINE_PACKAGE_MAX_MB,
        'danh sách': over.build.heaviestImages.join(', '),
      },
    };
  }

  /** Dòng audit nêu các tuyến bị ảnh hưởng (BR-M03-X06) */
  function affectedLine(context: CommandContext, affected: readonly FakeRoute[]): void {
    if (affected.length > 0) context.changeLines.push(affectedRoutesLine(affected.map(routeNameOf)));
  }

  function closeRouteAs(route: FakeRoute, source: 'MANUAL' | 'AUTO_NO_ACTIVE_CHECKPOINT', reason: string, actorEmail: string): void {
    route.status = 'TAM_DONG';
    route.closureSource = source;
    route.closureReason = reason;
    touch(store, route, actorEmail);
  }

  return {
    async closeRoute({ routeId, reason, expected }) {
      const route = routes().get(routeId);
      return store.run(
        {
          action: 'ROUTE_CLOSED',
          roles: 'B',
          subject: { type: 'ROUTE', id: routeId, ...(route ? { name: routeNameOf(route) } : {}) },
          ...(route ? { lockKeys: [routeLock(route)], expected: expectedFor(route, undefined, expected) } : {}),
          reason,
        },
        (context): CommandResult<StatusChangeData> => {
          if (!route || route.status !== 'HOAT_DONG') return failed;
          const problem = reasonProblem(reason, true);
          if (problem) return problem;
          // Không cần hành trình mới; snapshot active giữ nguyên (BR-M03-H03)
          closeRouteAs(route, 'MANUAL', reason.trim(), context.actor.email);
          context.changeLines.push(`Trạng thái: ${status('HOAT_DONG')} → ${status('TAM_DONG')}`);
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: route.status, concurrencyRevision: route.concurrencyRevision } };
        },
      );
    },

    async closeCheckpoint({ checkpointId, reason, expected }) {
      const checkpoint = checkpoints().get(checkpointId);
      return store.run(
        {
          action: 'CHECKPOINT_CLOSED',
          roles: 'B',
          subject: { type: 'CHECKPOINT', id: checkpointId, ...(checkpoint ? { name: checkpointName(store, checkpoint) } : {}) },
          ...(checkpoint ? { lockKeys: checkpointLocks(checkpoint), expected: expectedFor(checkpoint, undefined, expected) } : {}),
          reason,
        },
        (context): CommandResult<CloseCheckpointData> => {
          if (!checkpoint || checkpoint.status !== 'HOAT_DONG') return failed;
          const problem = reasonProblem(reason, true);
          if (problem) return problem;
          const affected = routesAffectedBy(store, checkpointId);
          const autoClosing = autoClosingRoutes(checkpointId);
          checkpoint.status = 'TAM_DONG';
          checkpoint.closureReason = reason.trim();
          touch(store, checkpoint, context.actor.email);
          // Điểm dừng rời hành trình của mọi tuyến liệt kê nó, cùng lúc; không bị trần chặn (BR-M03-H02, X02, G10)
          commitRebuilds(store, rebuildRoutes(store, affected));
          for (const route of autoClosing) {
            closeRouteAs(route, 'AUTO_NO_ACTIVE_CHECKPOINT', reason.trim(), context.actor.email);
            context.followUpAudit.push({
              action: 'ROUTE_AUTO_CLOSED',
              subject: { type: 'ROUTE', id: route.routeId, name: routeNameOf(route) },
              changeLines: [`Trạng thái: ${status('HOAT_DONG')} → ${status('TAM_DONG')}`, DISPLAY_NAMES.closureSource.AUTO_NO_ACTIVE_CHECKPOINT],
            });
          }
          context.changeLines.push(`Trạng thái: ${status('HOAT_DONG')} → ${status('TAM_DONG')}`);
          affectedLine(context, affected);
          return { ok: true, messageKey: 'MSG-SAVED', data: { autoClosedRoutes: autoClosing.map(routeRef) } };
        },
      );
    },

    async closeRoutesListingCheckpoint({ checkpointId, reason }) {
      const checkpoint = checkpoints().get(checkpointId);
      const targets = routesAffectedBy(store, checkpointId).filter((route) => route.status === 'HOAT_DONG');
      return store.run(
        {
          action: 'RELATED_ROUTES_CLOSED',
          roles: 'B',
          subject: { type: 'CHECKPOINT', id: checkpointId, ...(checkpoint ? { name: checkpointName(store, checkpoint) } : {}) },
          lockKeys: targets.map(routeLock),
          reason,
        },
        (context): CommandResult<CloseRoutesListingCheckpointData> => {
          if (!checkpoint) return failed;
          const problem = reasonProblem(reason, true);
          if (problem) return problem;
          // Đóng thẳng các tuyến, không cần snapshot; điểm dừng vẫn hoạt động (BR-M03-H04)
          for (const route of targets) closeRouteAs(route, 'MANUAL', reason.trim(), context.actor.email);
          affectedLine(context, targets);
          return { ok: true, messageKey: 'MSG-SAVED', data: { closedRoutes: targets.map(routeRef) } };
        },
      );
    },

    async reopenRoute({ routeId, safetyNote, expected }) {
      const route = routes().get(routeId);
      return store.run(
        {
          action: 'ROUTE_REOPENED',
          roles: 'R',
          subject: { type: 'ROUTE', id: routeId, ...(route ? { name: routeNameOf(route) } : {}) },
          ...(route ? { lockKeys: [routeLock(route)], expected: expectedFor(route, undefined, expected) } : {}),
          reason: safetyNote,
        },
        (context): CommandResult<StatusChangeData> => {
          if (!route || route.status !== 'TAM_DONG') return failed;
          const problem = reasonProblem(safetyNote, true, SAFETY_NOTE_LABEL);
          if (problem) return problem;
          // Cần ít nhất một điểm dừng hoạt động trong danh sách (BR-M03-H07, T05)
          if ((activeSnapshotOf(store, route)?.checkpoints.length ?? 0) === 0) {
            return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-NO-ACTIVE-CHECKPOINT', values: {} };
          }
          const blockers = routeReopenBlockers(route);
          if (blockers.length > 0) return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-REOPEN-BLOCKED', values: { 'danh sách': blockers.join(' ') } };
          route.status = 'HOAT_DONG';
          delete route.closureSource;
          delete route.closureReason;
          touch(store, route, context.actor.email);
          context.changeLines.push(`Trạng thái: ${status('TAM_DONG')} → ${status('HOAT_DONG')}`);
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: route.status, concurrencyRevision: route.concurrencyRevision } };
        },
      );
    },

    async reopenCheckpoint({ checkpointId, safetyNote, expected }) {
      const checkpoint = checkpoints().get(checkpointId);
      return store.run(
        {
          action: 'CHECKPOINT_REOPENED',
          roles: 'R',
          subject: { type: 'CHECKPOINT', id: checkpointId, ...(checkpoint ? { name: checkpointName(store, checkpoint) } : {}) },
          ...(checkpoint ? { lockKeys: checkpointLocks(checkpoint), expected: expectedFor(checkpoint, undefined, expected) } : {}),
          reason: safetyNote,
        },
        (context): CommandResult<StatusChangeData> => {
          if (!checkpoint || checkpoint.status !== 'TAM_DONG') return failed;
          const problem = reasonProblem(safetyNote, true, SAFETY_NOTE_LABEL);
          if (problem) return problem;
          const blockers = checkpointReopenBlockers(checkpoint);
          if (blockers.length > 0) return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-REOPEN-BLOCKED', values: { 'danh sách': blockers.join(' ') } };
          const affected = routesAffectedBy(store, checkpointId);
          checkpoint.status = 'HOAT_DONG';
          delete checkpoint.closureReason;
          touch(store, checkpoint, context.actor.email);
          // Điểm dừng trở lại hành trình của mọi tuyến liệt kê nó; trần áp dụng; tuyến đã tự đóng không mở lại (BR-M03-H06, H07, G10)
          const rebuilds = rebuildRoutes(store, affected);
          const tooBig = ceilingBlock(rebuilds);
          if (tooBig) return tooBig;
          commitRebuilds(store, rebuilds);
          context.changeLines.push(`Trạng thái: ${status('TAM_DONG')} → ${status('HOAT_DONG')}`);
          affectedLine(context, affected);
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: checkpoint.status, concurrencyRevision: checkpoint.concurrencyRevision } };
        },
      );
    },

    async archiveRoute({ routeId, reason, expected }) {
      const route = routes().get(routeId);
      return store.run(
        {
          action: 'ROUTE_ARCHIVED',
          roles: 'R',
          subject: { type: 'ROUTE', id: routeId, ...(route ? { name: routeNameOf(route) } : {}) },
          ...(route ? { lockKeys: [routeLock(route)], expected: expectedFor(route, undefined, expected) } : {}),
          reason,
        },
        (context): CommandResult<StatusChangeData> => {
          // Chỉ tuyến Tạm đóng; terminal; điểm dừng không đổi (BR-M03-H09, T07)
          if (!route || route.status !== 'TAM_DONG') return failed;
          const problem = reasonProblem(reason, true);
          if (problem) return problem;
          route.status = 'LUU_TRU';
          touch(store, route, context.actor.email);
          context.changeLines.push(`Trạng thái: ${status('TAM_DONG')} → ${status('LUU_TRU')}`);
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: route.status, concurrencyRevision: route.concurrencyRevision } };
        },
      );
    },

    async archiveCheckpoint({ checkpointId, reason, expected }) {
      const checkpoint = checkpoints().get(checkpointId);
      return store.run(
        {
          action: 'CHECKPOINT_ARCHIVED',
          roles: 'R',
          subject: { type: 'CHECKPOINT', id: checkpointId, ...(checkpoint ? { name: checkpointName(store, checkpoint) } : {}) },
          ...(checkpoint
            ? { lockKeys: [{ key: `checkpoint:${checkpointId}`, itemName: checkpointName(store, checkpoint) }], expected: expectedFor(checkpoint, undefined, expected) }
            : {}),
          reason,
        },
        (context): CommandResult<StatusChangeData> => {
          if (!checkpoint || checkpoint.status !== 'TAM_DONG') return failed;
          const problem = reasonProblem(reason, true);
          if (problem) return problem;
          // Không tuyến chưa lưu trữ nào liệt kê nó, kể cả trong bản nháp (BR-M03-D10)
          const using = routesListing(store, checkpointId);
          if (using.length > 0) {
            return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-CHECKPOINT-IN-USE', values: { 'danh sách': using.map((route) => route.routeName).join(', ') } };
          }
          checkpoint.status = 'LUU_TRU';
          touch(store, checkpoint, context.actor.email);
          // Điểm dừng đã rời mọi hành trình khi đóng, nên không có version mới; QR thành Đã thu hồi
          for (const qr of qrCodesOf(store, checkpointId)) {
            if (qr.status === 'THU_HOI') continue;
            qr.status = 'THU_HOI';
            touch(store, qr, context.actor.email);
          }
          context.changeLines.push(`Trạng thái: ${status('TAM_DONG')} → ${status('LUU_TRU')}`);
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: checkpoint.status, concurrencyRevision: checkpoint.concurrencyRevision } };
        },
      );
    },

    async getOperationImpact({ operation, subjectId }) {
      const admin = store.currentAdmin();
      if (!admin) throw new AdminApiError('MSG-SESSION-EXPIRED');
      // Mở lại chỉ dành cho Quản lý (admin-command Q-09)
      if (operation.startsWith('REOPEN_') && admin.role !== 'REVIEWER') throw new AdminApiError('MSG-NO-PERMISSION');
      if (operation === 'CLOSE_ROUTE' || operation === 'REOPEN_ROUTE') {
        const route = routes().get(subjectId);
        if (!route) throw new AdminApiError('MSG-GENERIC');
        const reopenBlockers =
          operation === 'REOPEN_ROUTE'
            ? [
                ...((activeSnapshotOf(store, route)?.checkpoints.length ?? 0) === 0 ? [formatMessage('MSG-NO-ACTIVE-CHECKPOINT')] : []),
                ...routeReopenBlockers(route),
              ]
            : [];
        return { affectedRoutes: [], autoClosingRoutes: [], reopenBlockers: [...new Set(reopenBlockers)] };
      }
      const checkpoint = checkpoints().get(subjectId);
      if (!checkpoint) throw new AdminApiError('MSG-GENERIC');
      return {
        affectedRoutes: routesAffectedBy(store, subjectId).map(routeRef),
        autoClosingRoutes: operation === 'CLOSE_CHECKPOINT' ? autoClosingRoutes(subjectId).map(routeRef) : [],
        reopenBlockers: operation === 'REOPEN_CHECKPOINT' ? checkpointReopenBlockers(checkpoint) : [],
      };
    },
  };
}
