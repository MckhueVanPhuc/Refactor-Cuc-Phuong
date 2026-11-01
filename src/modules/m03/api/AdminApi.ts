// Interface có kiểu của backend M03 cho UI (research R-05, R-06; admin-command-contract §5–§6).
// Command trả `CommandResult`; query trả dữ liệu. Lỗi transport (và FORBIDDEN của query) ném `AdminApiError`.
import type {
  AccountRow,
  AdminRole,
  ArchiveCheckpointInput,
  ArchiveRouteInput,
  AuditLogFilter,
  AuditLogPage,
  ChangeAccountRoleInput,
  CheckpointEditor,
  CheckpointListRow,
  CloseCheckpointData,
  CloseCheckpointInput,
  CloseRouteInput,
  CloseRoutesListingCheckpointData,
  CloseRoutesListingCheckpointInput,
  CurrentAdmin,
  DiscardDraftInput,
  DiscardUnpublishedInput,
  ItemHistory,
  ItemHistoryInput,
  OpenPublicationReviewInput,
  OperationImpact,
  OperationImpactInput,
  PublishUnitData,
  PublishUnitInput,
  RecordReprintInput,
  RegisterMediaData,
  RegisterMediaInput,
  ReopenCheckpointInput,
  ReopenRouteInput,
  ReportInput,
  RestoreRevisionData,
  RestoreRevisionInput,
  RevokeVisitPointInput,
  RouteEditor,
  RouteListFilter,
  RouteListRow,
  SaveCheckpointDraftData,
  SaveCheckpointDraftInput,
  SaveRouteDraftData,
  SaveRouteDraftInput,
  SaveVisitPointDraftData,
  SaveVisitPointDraftInput,
  SelectableCheckpoint,
  SetAccountStatusInput,
  StatusChangeData,
  VisitPointEditor,
} from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import type { PublicationReview } from '../contracts/publicationReview';
import type { Rpt01Output, Rpt02Output } from '../contracts/reportOutputs';

export type UploadMediaInput = {
  ownerType: 'ROUTE' | 'CHECKPOINT';
  ownerId: string;
  file: File;
  signal?: AbortSignal;
};

export interface AdminApi {
  // ---- Command (admin-command §5) ----
  /** C-01 */ saveRouteDraft(input: SaveRouteDraftInput): Promise<CommandResult<SaveRouteDraftData>>;
  /** C-02 */ saveCheckpointDraft(input: SaveCheckpointDraftInput): Promise<CommandResult<SaveCheckpointDraftData>>;
  /** C-03 */ saveVisitPointDraft(input: SaveVisitPointDraftInput): Promise<CommandResult<SaveVisitPointDraftData>>;
  /** C-04 */ registerMedia(input: RegisterMediaInput): Promise<CommandResult<RegisterMediaData>>;
  /** C-05 */ publishUnit(input: PublishUnitInput): Promise<CommandResult<PublishUnitData>>;
  /** C-06 */ discardDraft(input: DiscardDraftInput): Promise<CommandResult<null>>;
  /** C-07 */ discardUnpublished(input: DiscardUnpublishedInput): Promise<CommandResult<StatusChangeData>>;
  /** C-08 */ restoreRevision(input: RestoreRevisionInput): Promise<CommandResult<RestoreRevisionData>>;
  /** C-09 */ closeRoute(input: CloseRouteInput): Promise<CommandResult<StatusChangeData>>;
  /** C-10 */ closeCheckpoint(input: CloseCheckpointInput): Promise<CommandResult<CloseCheckpointData>>;
  /** C-11 */ closeRoutesListingCheckpoint(
    input: CloseRoutesListingCheckpointInput,
  ): Promise<CommandResult<CloseRoutesListingCheckpointData>>;
  /** C-12 */ reopenRoute(input: ReopenRouteInput): Promise<CommandResult<StatusChangeData>>;
  /** C-13 */ reopenCheckpoint(input: ReopenCheckpointInput): Promise<CommandResult<StatusChangeData>>;
  /** C-14 */ archiveRoute(input: ArchiveRouteInput): Promise<CommandResult<StatusChangeData>>;
  /** C-15 */ archiveCheckpoint(input: ArchiveCheckpointInput): Promise<CommandResult<StatusChangeData>>;
  /** C-16 */ revokeVisitPoint(input: RevokeVisitPointInput): Promise<CommandResult<StatusChangeData>>;
  /** C-17 */ recordReprint(input: RecordReprintInput): Promise<CommandResult<null>>;
  /** C-18 */ changeAccountRole(input: ChangeAccountRoleInput): Promise<CommandResult<StatusChangeData>>;
  /** C-19 */ setAccountStatus(input: SetAccountStatusInput): Promise<CommandResult<StatusChangeData>>;

  // ---- Edge `admin-accounts` (auth-account-contract §2.2–2.4) ----
  inviteAccount(input: { email: string; role: AdminRole }): Promise<CommandResult<null>>;
  resendInvitation(input: { email: string }): Promise<CommandResult<null>>;
  /** Nối danh tính người nhận lời mời với tài khoản `INVITATION_PENDING` (JWT của người nhận) */
  linkInvitation(): Promise<CommandResult<null>>;

  // ---- Query (admin-command §6) ----
  /** Q-01 — null khi danh tính không có tài khoản */ getCurrentAdmin(): Promise<CurrentAdmin | null>;
  /** Q-02 */ listRoutes(filter: RouteListFilter): Promise<RouteListRow[]>;
  /** Q-03 */ getRouteEditor(routeId: string): Promise<RouteEditor>;
  /** Q-04 */ listSelectableCheckpoints(search: string): Promise<SelectableCheckpoint[]>;
  /** Q-05 */ listCheckpoints(filter: { search?: string; status?: CheckpointListRow['status'] }): Promise<CheckpointListRow[]>;
  /** Q-06 */ getCheckpointEditor(checkpointId: string): Promise<CheckpointEditor>;
  /** Q-07 */ getVisitPointEditor(qrIdentifier: string): Promise<VisitPointEditor>;
  /** Q-08 */ openPublicationReview(input: OpenPublicationReviewInput): Promise<PublicationReview>;
  /** Q-09 */ getOperationImpact(input: OperationImpactInput): Promise<OperationImpact>;
  /** Q-10 */ getItemHistory(input: ItemHistoryInput): Promise<ItemHistory>;
  /** Q-11 */ listAuditLog(filter: AuditLogFilter): Promise<AuditLogPage>;
  /** Q-12 */ reportRpt01(input: ReportInput): Promise<Rpt01Output>;
  /** Q-13 */ reportRpt02(input: ReportInput): Promise<Rpt02Output>;
  /** Q-14 */ listAccounts(): Promise<AccountRow[]>;

  // ---- Storage (media-storage-contract §1 bước 2; R-12) ----
  /** Tải một tệp lên `uploads/{ownerType}/{ownerId}/{uploadKey}`, không ghi đè; trả objectPath */
  uploadMedia(input: UploadMediaInput): Promise<{ objectPath: string }>;
  /** URL đọc media cho admin (signed URL); không bao giờ là URL đã ký nằm sẵn trong contract */
  getMediaUrl(sourceRef: string): Promise<string>;
}
