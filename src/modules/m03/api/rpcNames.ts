// Bảng ánh xạ DUY NHẤT từ thao tác logic → tên function trong schema `api` (client đặt db.schema = 'api').
// Tên đã chốt bởi migration bước 3–4 (Physical §7.3); T197 đối chiếu từng tên với schema `api` trên stack local.
import type { AdminApi } from './AdminApi';

type RpcMethod = Exclude<
  keyof AdminApi,
  'inviteAccount' | 'resendInvitation' | 'linkInvitation' | 'uploadMedia' | 'getMediaUrl'
>;

export const RPC_NAMES: Readonly<Record<RpcMethod, string>> = {
  saveRouteDraft: 'save_route_draft', // C-01
  saveCheckpointDraft: 'save_checkpoint_draft', // C-02
  saveVisitPointDraft: 'save_visit_point_draft', // C-03
  registerMedia: 'register_media', // C-04
  publishUnit: 'publish_unit', // C-05
  discardDraft: 'discard_draft', // C-06
  discardUnpublished: 'discard_unpublished', // C-07
  restoreRevision: 'restore_revision', // C-08
  closeRoute: 'close_route', // C-09
  closeCheckpoint: 'close_checkpoint', // C-10
  closeRoutesListingCheckpoint: 'close_routes_listing_checkpoint', // C-11
  reopenRoute: 'reopen_route', // C-12
  reopenCheckpoint: 'reopen_checkpoint', // C-13
  archiveRoute: 'archive_route', // C-14
  archiveCheckpoint: 'archive_checkpoint', // C-15
  revokeVisitPoint: 'revoke_visit_point', // C-16
  recordReprint: 'record_reprint', // C-17
  changeAccountRole: 'change_account_role', // C-18
  setAccountStatus: 'set_account_status', // C-19
  getCurrentAdmin: 'get_current_admin', // Q-01
  listRoutes: 'list_routes', // Q-02
  getRouteEditor: 'get_route_editor', // Q-03
  listSelectableCheckpoints: 'list_selectable_checkpoints', // Q-04
  listCheckpoints: 'list_checkpoints', // Q-05
  getCheckpointEditor: 'get_checkpoint_editor', // Q-06
  getVisitPointEditor: 'get_visit_point_editor', // Q-07
  openPublicationReview: 'open_publication_review', // Q-08
  getOperationImpact: 'get_operation_impact', // Q-09
  getItemHistory: 'get_item_history', // Q-10
  listAuditLog: 'list_audit_log', // Q-11
  reportRpt01: 'report_rpt01', // Q-12
  reportRpt02: 'report_rpt02', // Q-13
  listAccounts: 'list_accounts', // Q-14
};

/** Edge Function quản lý tài khoản (auth-account-contract §2) */
export const ADMIN_ACCOUNTS_FUNCTION = 'admin-accounts';

/** camelCase → tham số `p_snake_case` ở cấp cao nhất; giá trị lồng (content…) giữ nguyên camelCase JSON. */
export function toRpcParams(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [`p_${key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`, value]),
  );
}
