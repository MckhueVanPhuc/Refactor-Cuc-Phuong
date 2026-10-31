// Tuyến trên adapter giả (tasks T102): C-01, C-07 cho tuyến, Q-02, Q-03, Q-04
// (admin-command §5–§6; BR-M03-C01, C03, C09, C12, C16, C17, T01, T03, T09, F06, F11).
import { NOTE_MAX_CHARS, ROUTE_HIGHLIGHTS_MAX_ITEMS } from '../../config/limits';
import type {
  CheckpointContent,
  DiscardUnpublishedInput,
  RouteContent,
  RouteEditor,
  RouteListRow,
  SaveRouteDraftData,
  StatusChangeData,
} from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import type { MessageKey } from '../../messages/catalog';
import { normalizeCheckpointName } from '../../validation/checkpoint';
import { trimmedLength } from '../../validation/common';
import { routeImages, routePublishIssues } from '../../validation/publishGaps';
import { normalizeRouteContent, routeSaveIssues } from '../../validation/route';
import type { AdminApi } from '../AdminApi';
import { AdminApiError } from '../errors';
import { checkpointName, openQrCodesOf, routesListing, toMediaInfo } from './checkpointData';
import { draftOf, everPublished, expectedFor, publishedOf, toEditorRevision, touch, writeDraft } from './revisions';
import type { FakeRoute, FakeStore } from './store';

type RoutesArea = Pick<AdminApi, 'saveRouteDraft' | 'listRoutes' | 'getRouteEditor' | 'listSelectableCheckpoints'> & {
  discardRoute(input: DiscardUnpublishedInput): Promise<CommandResult<StatusChangeData>>;
};

const failed: CommandResult<never> = { ok: false, reason: 'FAILED', messageKey: 'MSG-GENERIC' };

/** Usage hợp lệ của từng chỗ ảnh trong nội dung tuyến */
const IMAGE_USAGE = { thumbnailMediaId: 'ROUTE_THUMBNAIL', galleryItems: 'ROUTE_GALLERY', routeMapMediaId: 'ROUTE_MAP' } as const;

export function routeContentOf(store: FakeStore, routeId: string): RouteContent | undefined {
  return (draftOf(store, 'ROUTE', routeId) ?? publishedOf(store, 'ROUTE', routeId))?.content as RouteContent | undefined;
}

/** Media của tuyến và cờ quyền đã lưu, theo mediaId — cho guard xuất bản */
export function routeMediaStates(store: FakeStore, routeId: string) {
  return new Map(
    [...store.state.media.values()]
      .filter((media) => media.ownerType === 'ROUTE' && media.ownerId === routeId)
      .map((media) => [media.mediaId, { usageRightsConfirmed: media.usageRightsConfirmed }]),
  );
}

/** Trạng thái hiện tại của các điểm dừng mà nội dung tuyến liệt kê */
export function listedCheckpointStates(store: FakeStore, content: RouteContent) {
  return new Map(
    (content.checkpointList ?? []).flatMap(({ checkpointId }) => {
      const checkpoint = store.state.checkpoints.get(checkpointId);
      return checkpoint ? [[checkpointId, { name: checkpointName(store, checkpoint), status: checkpoint.status }] as const] : [];
    }),
  );
}

export function createFakeRoutesArea(store: FakeStore): RoutesArea {
  const routes = () => store.state.routes;

  function requireAdmin(): void {
    if (!store.currentAdmin()) throw new AdminApiError('MSG-SESSION-EXPIRED');
  }

  const routeName = (route: FakeRoute) => routeContentOf(store, route.routeId)?.name?.vi?.trim() || undefined;

  /** Mọi điểm dừng thêm mới vào danh sách phải đang hoạt động lúc thêm (BR-M03-T01) */
  function listAdditionsValid(routeId: string | undefined, content: RouteContent): boolean {
    const before = new Set(
      routeId
        ? [draftOf(store, 'ROUTE', routeId), publishedOf(store, 'ROUTE', routeId)].flatMap((rev) =>
            ((rev?.content as RouteContent | undefined)?.checkpointList ?? []).map((item) => item.checkpointId),
          )
        : [],
    );
    return (content.checkpointList ?? []).every(
      ({ checkpointId }) => before.has(checkpointId) || store.state.checkpoints.get(checkpointId)?.status === 'HOAT_DONG',
    );
  }

  /** Mọi ảnh trong nội dung là media của chính tuyến này với đúng usage (DAC-M03-041) */
  function imagesValid(routeId: string, content: RouteContent): boolean {
    return routeImages(content).every(({ mediaId, fieldKey }) => {
      const media = store.state.media.get(mediaId);
      const slot = fieldKey.split('.')[0] as keyof typeof IMAGE_USAGE;
      return media?.ownerType === 'ROUTE' && media.ownerId === routeId && media.type === 'IMAGE' && media.usage === IMAGE_USAGE[slot];
    });
  }

  return {
    async saveRouteDraft({ routeId, expected, content, mediaSettings }) {
      const existing = routeId ? routes().get(routeId) : undefined;
      const draft = existing && draftOf(store, 'ROUTE', existing.routeId);
      return store.run(
        {
          action: 'ROUTE_DRAFT_SAVED',
          roles: 'B',
          subject: { type: 'ROUTE', ...(routeId ? { id: routeId } : {}), ...(existing?.name ? { name: existing.name } : {}) },
          ...(existing ? { expected: expectedFor(existing, draft, expected) } : {}),
        },
        (context): CommandResult<SaveRouteDraftData> => {
          if (routeId && (!existing || existing.status === 'LUU_TRU')) return failed;
          const id = existing?.routeId ?? store.newId();
          const normalized = normalizeRouteContent(content);
          if ((normalized.highlights ?? []).length > ROUTE_HIGHLIGHTS_MAX_ITEMS) return failed;
          if (!listAdditionsValid(existing?.routeId, normalized)) return failed;
          if (existing && !imagesValid(id, normalized)) return failed;
          if (!existing && routeImages(normalized).length > 0) return failed;
          const issues = routeSaveIssues(id, normalized, {
            checkpointName: (checkpointId) => {
              const checkpoint = store.state.checkpoints.get(checkpointId);
              return checkpoint ? checkpointName(store, checkpoint) : '';
            },
          });
          if (issues.length > 0) return { ok: false, reason: 'VALIDATION', messageKey: issues[0]!.messageKey as MessageKey, issues };

          // Tick quyền từng ảnh lưu cùng lần lưu (BR-M03-F11, C14)
          for (const setting of mediaSettings ?? []) {
            const media = store.state.media.get(setting.mediaId);
            if (media?.ownerType === 'ROUTE' && media.ownerId === id) media.usageRightsConfirmed = setting.usageRightsConfirmed;
          }
          const route: FakeRoute = existing ?? {
            routeId: id,
            status: 'NHAP',
            concurrencyRevision: 0,
            lastEditedByEmail: context.actor.email,
            lastEditedAt: store.now(),
          };
          routes().set(id, route);
          touch(store, route, context.actor.email);
          const revision = writeDraft(store, 'ROUTE', id, normalized, context.actor.email);
          const name = routeName(route);
          if (name) route.name = name;
          context.subjectId = id;
          context.subjectName = route.name;
          return {
            ok: true,
            messageKey: 'MSG-SAVED',
            data: { routeId: id, revisionNumber: revision.revisionNumber, concurrencyRevision: revision.concurrencyRevision },
          };
        },
      );
    },

    async discardRoute({ subjectId, reason, expected }) {
      const route = routes().get(subjectId);
      return store.run(
        {
          action: 'ITEM_DISCARDED',
          roles: 'B',
          subject: { type: 'ROUTE', id: subjectId, ...(route?.name ? { name: route.name } : {}) },
          ...(route ? { expected: expectedFor(route, undefined, expected) } : {}),
          ...(reason !== undefined ? { reason } : {}),
        },
        (context): CommandResult<StatusChangeData> => {
          if (!route || route.status !== 'NHAP' || everPublished(store, 'ROUTE', subjectId)) return failed;
          const length = trimmedLength(reason ?? '');
          if (length === 0) return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-MISSING-FIELD', values: { 'tên ô': 'Lý do' } };
          if (length > NOTE_MAX_CHARS) {
            return { ok: false, reason: 'BLOCKED', messageKey: 'MSG-LIMIT-TEXT', values: { 'Tên ô': 'Lý do', 'tối đa': NOTE_MAX_CHARS, số: length } };
          }
          // Hủy tuyến không bao giờ đụng tới điểm dừng nó liệt kê (BR-M03-C01)
          route.status = 'LUU_TRU';
          touch(store, route, context.actor.email);
          context.changeLines.push('Trạng thái: Nháp → Đã lưu trữ');
          return { ok: true, messageKey: 'MSG-SAVED', data: { status: route.status, concurrencyRevision: route.concurrencyRevision } };
        },
      );
    },

    async listRoutes({ search, status }) {
      requireAdmin();
      const query = search?.trim() ? normalizeCheckpointName(search) : undefined;
      return [...routes().values()]
        .map((route): RouteListRow => {
          const row: RouteListRow = {
            routeId: route.routeId,
            status: route.status,
            hasPendingDraft: route.status !== 'NHAP' && Boolean(draftOf(store, 'ROUTE', route.routeId)),
            lastEditedAt: route.lastEditedAt,
            lastEditedByEmail: route.lastEditedByEmail,
          };
          const name = routeName(route);
          if (name) row.name = name;
          return row;
        })
        .filter((row) => !status || row.status === status)
        .filter((row) => !query || normalizeCheckpointName(row.name ?? '').includes(query))
        .sort((a, b) => b.lastEditedAt.localeCompare(a.lastEditedAt));
    },

    async getRouteEditor(routeId) {
      requireAdmin();
      const route = routes().get(routeId);
      if (!route) throw new AdminApiError('MSG-GENERIC');
      const draft = draftOf(store, 'ROUTE', routeId);
      const published = publishedOf(store, 'ROUTE', routeId);
      const content = (draft ?? published)?.content as RouteContent | undefined;
      const listed = [...new Set([draft, published].flatMap((rev) => ((rev?.content as RouteContent | undefined)?.checkpointList ?? []).map((item) => item.checkpointId)))];
      const editor: RouteEditor = {
        routeId,
        status: route.status,
        concurrencyRevision: route.concurrencyRevision,
        media: [...store.state.media.values()]
          .filter((media) => media.ownerType === 'ROUTE' && media.ownerId === routeId)
          .map(toMediaInfo),
        checkpoints: listed.flatMap((checkpointId) => {
          const checkpoint = store.state.checkpoints.get(checkpointId);
          if (!checkpoint) return [];
          const mode = (publishedOf(store, 'CHECKPOINT', checkpointId)?.content as CheckpointContent | undefined)?.connectivityMode;
          return [{ checkpointId, name: checkpointName(store, checkpoint), status: checkpoint.status, ...(mode ? { connectivityMode: mode } : {}) }];
        }),
        issues: content
          ? routePublishIssues(routeId, content, { media: routeMediaStates(store, routeId), checkpoints: listedCheckpointStates(store, content) })
          : [],
      };
      const draftRevision = toEditorRevision<RouteContent>(draft);
      const publishedRevision = toEditorRevision<RouteContent>(published);
      if (draftRevision) editor.draft = draftRevision;
      if (publishedRevision) editor.published = publishedRevision;
      if (route.closureReason) editor.closureReason = route.closureReason;
      if (route.closureSource) editor.closureSource = route.closureSource;
      return editor;
    },

    async listSelectableCheckpoints(search) {
      requireAdmin();
      const query = search.trim() ? normalizeCheckpointName(search) : undefined;
      return [...store.state.checkpoints.values()]
        .filter((checkpoint) => checkpoint.status === 'HOAT_DONG')
        .map((checkpoint) => {
          const published = publishedOf(store, 'CHECKPOINT', checkpoint.checkpointId)?.content as CheckpointContent | undefined;
          return {
            checkpointId: checkpoint.checkpointId,
            name: published?.checkpointName?.vi ?? '',
            connectivityMode: published?.connectivityMode ?? 'OFFLINE_REQUIRED',
            visitPointCount: openQrCodesOf(store, checkpoint.checkpointId).filter((qr) => qr.status === 'HOAT_DONG').length,
            otherRoutes: routesListing(store, checkpoint.checkpointId).map(({ routeId, routeName }) => ({ routeId, routeName })),
          };
        })
        .filter((row) => !query || normalizeCheckpointName(row.name).includes(query))
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    },
  };
}
