// Adapter Supabase của AdminApi: RPC trong schema `api`, Edge `admin-accounts`, Storage `quest-media`.
// Chạy thật chỉ ở giai đoạn B trên stack local (CHG-M03-2026-10-30-01); T197 kiểm bằng bộ contract dùng chung.
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { MEDIA_BUCKET } from '../../../shared/config/storage';
import { commandResultSchema, type CommandResult } from '../contracts/commandResult';
import { publicationReviewSchema } from '../contracts/publicationReview';
import { rpt01OutputSchema, rpt02OutputSchema } from '../contracts/reportOutputs';
import type { AdminApi } from './AdminApi';
import { AdminApiError } from './errors';
import { trackRequest } from './inflight';
import { callAdminAccounts } from './adminAccountsEdge';
import { RPC_NAMES, toRpcParams } from './rpcNames';

// Thời hạn signed URL cho xem trước của admin (R-12); không cache bằng Workbox
const SIGNED_URL_SECONDS = 3600;

// Hình dạng `data` của từng command do function quyết định; envelope được kiểm bằng Zod của T038
const anyCommandResult = commandResultSchema(z.unknown());

/** Kiểu dữ liệu trả về của một query trong AdminApi */
type Out<M extends keyof AdminApi> = Awaited<ReturnType<AdminApi[M]>>;

export function createSupabaseAdminApi(supabase: SupabaseClient<any, 'api'>): AdminApi {
  async function rpc(name: string, input: Record<string, unknown>): Promise<unknown> {
    return trackRequest(async (signal) => {
      try {
        const { data, error } = await supabase.rpc(name, toRpcParams(input)).abortSignal(signal);
        if (error) throw error;
        return data;
      } catch (error) {
        throw AdminApiError.from(error);
      }
    });
  }

  function command<T>(method: keyof typeof RPC_NAMES) {
    return async (input: object): Promise<CommandResult<T>> => {
      const raw = await rpc(RPC_NAMES[method], input as Record<string, unknown>);
      const parsed = anyCommandResult.safeParse(raw);
      if (!parsed.success) throw AdminApiError.from(parsed.error);
      return parsed.data as CommandResult<T>;
    };
  }

  function query<T>(method: keyof typeof RPC_NAMES, schema?: z.ZodType<T>) {
    return async (input: object = {}): Promise<T> => {
      const raw = await rpc(RPC_NAMES[method], input as Record<string, unknown>);
      if (!schema) return raw as T;
      const parsed = schema.safeParse(raw);
      if (!parsed.success) throw AdminApiError.from(parsed.error);
      return parsed.data;
    };
  }

  return {
    saveRouteDraft: command('saveRouteDraft'),
    saveCheckpointDraft: command('saveCheckpointDraft'),
    saveVisitPointDraft: command('saveVisitPointDraft'),
    registerMedia: command('registerMedia'),
    publishUnit: command('publishUnit'),
    discardDraft: command('discardDraft'),
    discardUnpublished: command('discardUnpublished'),
    restoreRevision: command('restoreRevision'),
    closeRoute: command('closeRoute'),
    closeCheckpoint: command('closeCheckpoint'),
    closeRoutesListingCheckpoint: command('closeRoutesListingCheckpoint'),
    reopenRoute: command('reopenRoute'),
    reopenCheckpoint: command('reopenCheckpoint'),
    archiveRoute: command('archiveRoute'),
    archiveCheckpoint: command('archiveCheckpoint'),
    revokeVisitPoint: command('revokeVisitPoint'),
    recordReprint: command('recordReprint'),
    changeAccountRole: command('changeAccountRole'),
    setAccountStatus: command('setAccountStatus'),

    inviteAccount: (input) => callAdminAccounts(supabase, { action: 'invite', ...input }),
    resendInvitation: (input) => callAdminAccounts(supabase, { action: 'resend', ...input }),
    linkInvitation: () => callAdminAccounts(supabase, { action: 'link' }),

    getCurrentAdmin: async () => (await query<Out<'getCurrentAdmin'>>('getCurrentAdmin')()) ?? null,
    listRoutes: (filter) => query<Out<'listRoutes'>>('listRoutes')(filter),
    getRouteEditor: (routeId) => query<Out<'getRouteEditor'>>('getRouteEditor')({ routeId }),
    listSelectableCheckpoints: (search) => query<Out<'listSelectableCheckpoints'>>('listSelectableCheckpoints')({ search }),
    listCheckpoints: (filter) => query<Out<'listCheckpoints'>>('listCheckpoints')(filter),
    getCheckpointEditor: (checkpointId) => query<Out<'getCheckpointEditor'>>('getCheckpointEditor')({ checkpointId }),
    getVisitPointEditor: (qrIdentifier) => query<Out<'getVisitPointEditor'>>('getVisitPointEditor')({ qrIdentifier }),
    openPublicationReview: (input) => query('openPublicationReview', publicationReviewSchema)(input),
    getOperationImpact: (input) => query<Out<'getOperationImpact'>>('getOperationImpact')(input),
    getItemHistory: (input) => query<Out<'getItemHistory'>>('getItemHistory')(input),
    listAuditLog: (filter) => query<Out<'listAuditLog'>>('listAuditLog')(filter),
    reportRpt01: (input) => query('reportRpt01', rpt01OutputSchema)(input),
    reportRpt02: (input) => query('reportRpt02', rpt02OutputSchema)(input),
    listAccounts: () => query<Out<'listAccounts'>>('listAccounts')(),

    async uploadMedia({ ownerType, ownerId, file }) {
      const objectPath = `uploads/${ownerType}/${ownerId}/${crypto.randomUUID()}`;
      try {
        const { error } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(objectPath, file, { upsert: false, contentType: file.type });
        if (error) throw error;
        return { objectPath };
      } catch (error) {
        throw AdminApiError.from(error);
      }
    },

    async getMediaUrl(sourceRef) {
      try {
        const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(sourceRef, SIGNED_URL_SECONDS);
        if (error) throw error;
        return data.signedUrl;
      } catch (error) {
        throw AdminApiError.from(error);
      }
    },
  };
}
