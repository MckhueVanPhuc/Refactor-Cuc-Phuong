// Kiểu content của Revision và DTO cho command C-01…C-19, query Q-01…Q-14 (admin-command-contract §5–§6).
// Content theo S4 §4 / spec-M03 §6.1.1, §6.2.1, §6.2.2 (camelCase). Trường "Conditional" là tùy chọn ở bản nháp
// và chỉ bắt buộc khi xuất bản, nên ở đây là optional. Contract chỉ nêu nội dung trả về của query; tên trường
// của các dòng danh sách/editor là quyết định của plan cho contract nội bộ này.
import type { PublicationReview, PublicationUnitType } from './publicationReview';
import type { ReportInput, Rpt01Output, Rpt02Output } from './reportOutputs';
import type { ValidationIssue } from './validationIssue';

// ---------- Giá trị dùng chung ----------

export type Bilingual = { vi: string; en: string };
/** Song ngữ ở bản nháp: mỗi ngôn ngữ có thể chưa nhập */
export type DraftBilingual = { vi?: string; en?: string };

export type RouteStatus = 'NHAP' | 'HOAT_DONG' | 'TAM_DONG' | 'LUU_TRU';
export type CheckpointStatus = RouteStatus;
export type QrStatus = 'NHAP' | 'HOAT_DONG' | 'THU_HOI';
export type RevisionStatus = 'NHAP' | 'PHAT_HANH' | 'LUU_TRU' | 'DA_BO';
export type ConnectivityMode = 'ONLINE_AVAILABLE' | 'OFFLINE_REQUIRED';
export type Difficulty = 'NHE' | 'TRUNG_BINH' | 'KHO';
export type GroupTag = 'GROUP_CA_NHAN_NGUOI_LON' | 'GROUP_GIA_DINH_CO_TRE' | 'GROUP_CAN_DE_DANG';
export type ExperienceTag = 'INTEREST_THIEN_NHIEN_CHUP_ANH' | 'INTEREST_TIM_HIEU' | 'INTEREST_KHAM_PHA';
export type AdminRole = 'CONTENT_STAFF' | 'REVIEWER';
export type AccountStatus = 'INVITATION_PENDING' | 'ACTIVE' | 'DEACTIVATED';
export type SubjectType = 'ROUTE' | 'CHECKPOINT' | 'QRCODE';
export type MediaType = 'IMAGE' | 'AUDIO' | 'VIDEO';
export type MediaUsage = 'ROUTE_THUMBNAIL' | 'ROUTE_GALLERY' | 'ROUTE_MAP' | 'QR_MEDIA';
export type SpokenLanguage = 'vi' | 'en' | 'NONE';
export type ClosureSource = 'MANUAL' | 'AUTO_NO_ACTIVE_CHECKPOINT';
/** DateTime UTC, ISO 8601 */
export type UtcDateTime = string;

// ---------- Content của Revision ----------

export type RouteContent = {
  name?: DraftBilingual;
  shortDescription?: DraftBilingual;
  description?: DraftBilingual;
  startingPoint?: DraftBilingual;
  participationRequirements?: DraftBilingual;
  preparation?: DraftBilingual;
  bestTime?: DraftBilingual;
  safetyWarning?: DraftBilingual;
  noSafetyWarningConfirmed: boolean;
  distanceKm?: number;
  durationMin?: number;
  difficulty?: Difficulty;
  groupTags?: GroupTag[];
  experienceTags?: ExperienceTag[];
  thumbnailMediaId?: string;
  galleryItems?: { mediaId: string; caption?: DraftBilingual }[];
  routeMapMediaId?: string;
  routeMapCaption?: DraftBilingual;
  offlineRouteMapRequired: boolean;
  checkpointList?: { checkpointId: string }[];
  highlights?: DraftBilingual[];
};

export type CheckpointContent = {
  checkpointName?: DraftBilingual;
  connectivityMode?: ConnectivityMode;
  fieldVerificationConfirmed?: boolean;
  /** do M03 đặt khi tick khảo sát */
  fieldVerifiedByUserId?: string;
  fieldVerifiedAt?: UtcDateTime;
};

export type QrContent = {
  objectName?: DraftBilingual;
  introductionText?: DraftBilingual;
  mediaItems?: { mediaId: string }[];
};

export type RevisionSummary = {
  revisionNumber: number;
  status: RevisionStatus;
  basedOnRevisionNumber?: number;
  lastEditedByEmail: string;
  lastEditedAt: UtcDateTime;
  publishedByEmail?: string;
  publishedAt?: UtcDateTime;
  selfPublished?: boolean;
  concurrencyRevision: number;
};

export type EditorRevision<C> = RevisionSummary & { content: C };

export type MediaInfo = {
  mediaId: string;
  type: MediaType;
  usage: MediaUsage;
  sourceRef: string;
  mimeType: string;
  fileSizeBytes: number;
  usageRightsConfirmed: boolean;
  spokenLanguage?: SpokenLanguage;
};

export type Readiness = { ready: boolean; missing: string[] };

// ---------- Input chung của command ----------

/** Lý do / ghi chú: không rỗng sau trim, ≤ NOTE_MAX_CHARS */
export type Reason = string;

export type ExpectedRevisions = {
  /** concurrencyRevision của thực thể (Route/Checkpoint/QRCode) */
  entity?: number | undefined;
  /** concurrencyRevision của revision nháp đang sửa, nếu có */
  draft?: number | undefined;
};

// ---------- Command C-01…C-19 ----------

/** C-01 */
export type SaveRouteDraftInput = {
  routeId?: string;
  expected?: ExpectedRevisions;
  content: RouteContent;
  /** tick quyền sử dụng từng ảnh của tuyến, lưu cùng lần lưu (BR-M03-F11, C14) */
  mediaSettings?: { mediaId: string; usageRightsConfirmed: boolean }[];
};
export type SaveRouteDraftData = { routeId: string; revisionNumber: number; concurrencyRevision: number };

/** C-02 */
export type SaveCheckpointDraftInput = {
  checkpointId?: string;
  expected?: ExpectedRevisions;
  content: CheckpointContent;
  locationNote?: string;
};
export type SaveCheckpointDraftData = { checkpointId: string; revisionNumber: number; concurrencyRevision: number };

/** C-03 */
export type MediaSetting = { mediaId: string; usageRightsConfirmed: boolean; spokenLanguage?: SpokenLanguage };
export type SaveVisitPointDraftInput = {
  checkpointId: string;
  qrIdentifier?: string;
  expected?: ExpectedRevisions;
  content: QrContent;
  installationLabel?: string;
  mediaSettings: MediaSetting[];
};
export type SaveVisitPointDraftData = {
  qrIdentifier: string;
  revisionNumber: number;
  concurrencyRevision: number;
  created: boolean;
};

/** C-04 */
export type RegisterMediaInput = {
  ownerType: 'ROUTE' | 'CHECKPOINT';
  ownerId: string;
  usage: MediaUsage;
  type: MediaType;
  objectPath: string;
  spokenLanguage?: SpokenLanguage;
};
export type RegisterMediaData = { mediaId: string; sourceRef: string };

/** C-05 */
export type PublishUnitInput = {
  unitType: PublicationUnitType;
  subjectId: string;
  reviewedConcurrencyRevision: number;
  noSafetyWarningConfirmed?: boolean;
};
export type PublishUnitData = { publishedRevisionNumber: number; newJourneyVersions: { routeId: string; contentVersion: number }[] };

/** C-06 */
export type DiscardDraftInput = { subjectType: SubjectType; subjectId: string; expected: ExpectedRevisions };

/** C-07 — `reason` bắt buộc với tuyến và điểm dừng, tùy chọn với QR */
export type DiscardUnpublishedInput = {
  subjectType: SubjectType;
  subjectId: string;
  reason?: Reason;
  expected: ExpectedRevisions;
};

/** C-08 */
export type RestoreRevisionInput = { subjectType: SubjectType; subjectId: string; revisionNumber: number };
export type RestoreRevisionData = { revisionNumber: number; basedOnRevisionNumber: number };

/** C-09 */
export type CloseRouteInput = { routeId: string; reason: Reason; expected: ExpectedRevisions };
/** C-10 */
export type CloseCheckpointInput = { checkpointId: string; reason: Reason; expected: ExpectedRevisions };
export type CloseCheckpointData = { autoClosedRoutes: { routeId: string; routeName: string }[] };
/** C-11 */
export type CloseRoutesListingCheckpointInput = { checkpointId: string; reason: Reason };
export type CloseRoutesListingCheckpointData = { closedRoutes: { routeId: string; routeName: string }[] };
/** C-12 */
export type ReopenRouteInput = { routeId: string; safetyNote: Reason; expected: ExpectedRevisions };
/** C-13 */
export type ReopenCheckpointInput = { checkpointId: string; safetyNote: Reason; expected: ExpectedRevisions };
/** C-14 */
export type ArchiveRouteInput = { routeId: string; reason: Reason; expected: ExpectedRevisions };
/** C-15 */
export type ArchiveCheckpointInput = { checkpointId: string; reason: Reason; expected: ExpectedRevisions };
/** C-16 */
export type RevokeVisitPointInput = { qrIdentifier: string; reason: Reason; expected: ExpectedRevisions };
/** C-17 */
export type RecordReprintInput = { qrIdentifier: string };
/** C-18 */
export type ChangeAccountRoleInput = { email: string; role: AdminRole; expected: ExpectedRevisions };
/** C-19 */
export type SetAccountStatusInput = {
  email: string;
  status: Extract<AccountStatus, 'ACTIVE' | 'DEACTIVATED'>;
  expected: ExpectedRevisions;
};

/** Command chỉ đổi trạng thái: trả trạng thái và concurrencyRevision mới */
export type StatusChangeData = { status: string; concurrencyRevision: number };

// ---------- Query Q-01…Q-14 ----------

/** Q-01 — rỗng (null) khi danh tính không có tài khoản */
export type CurrentAdmin = { email: string; role: AdminRole; status: AccountStatus };

/** Q-02 */
export type RouteListFilter = { search?: string; status?: RouteStatus };
export type RouteListRow = {
  routeId: string;
  /** tên vi của bản nháp nếu có, ngược lại bản đã xuất bản; có thể chưa đặt */
  name?: string;
  status: RouteStatus;
  hasPendingDraft: boolean;
  lastEditedAt: UtcDateTime;
  lastEditedByEmail: string;
};

/** Q-03 */
export type RouteEditor = {
  routeId: string;
  status: RouteStatus;
  closureReason?: string;
  closureSource?: ClosureSource;
  concurrencyRevision: number;
  draft?: EditorRevision<RouteContent>;
  published?: EditorRevision<RouteContent>;
  media: MediaInfo[];
  /** tên/trạng thái của các điểm dừng trong danh sách, để hiển thị */
  checkpoints: { checkpointId: string; name: string; status: CheckpointStatus; connectivityMode?: ConnectivityMode }[];
  issues: ValidationIssue[];
};

/** Q-04 */
export type SelectableCheckpoint = {
  checkpointId: string;
  name: string;
  connectivityMode: ConnectivityMode;
  visitPointCount: number;
  otherRoutes: { routeId: string; routeName: string }[];
};

/** Q-05 */
export type CheckpointListRow = {
  checkpointId: string;
  name?: string;
  status: CheckpointStatus;
  connectivityMode?: ConnectivityMode;
  visitPointCount: number;
  routesUsing: { routeId: string; routeName: string }[];
  readiness: Readiness;
  hasPendingDraft: boolean;
};

/** Q-06 */
export type VisitPointListRow = {
  qrIdentifier: string;
  /** tên hoặc vắng — UI hiện "Điểm tham quan chưa đặt tên {số}" theo `creationOrder` */
  name?: string;
  creationOrder: number;
  status: QrStatus;
  readiness: Readiness;
};
export type CheckpointEditor = {
  checkpointId: string;
  status: CheckpointStatus;
  closureReason?: string;
  locationNote?: string;
  concurrencyRevision: number;
  draft?: EditorRevision<CheckpointContent>;
  published?: EditorRevision<CheckpointContent>;
  visitPoints: VisitPointListRow[];
  routesUsing: { routeId: string; routeName: string; routeStatus: RouteStatus }[];
  issues: ValidationIssue[];
};

/** Q-07 */
export type VisitPointEditor = {
  qrIdentifier: string;
  checkpointId: string;
  checkpointName?: string;
  checkpointMode?: ConnectivityMode;
  /** điểm dừng chưa xuất bản thì điểm tham quan đi cùng lần xuất bản đầu của điểm dừng (BR-M03-D05, E13) */
  checkpointStatus: CheckpointStatus;
  status: QrStatus;
  creationOrder: number;
  installationLabel?: string;
  concurrencyRevision: number;
  draft?: EditorRevision<QrContent>;
  published?: EditorRevision<QrContent>;
  media: MediaInfo[];
  readiness: Readiness;
  issues: ValidationIssue[];
};

/** Q-08 */
export type OpenPublicationReviewInput = { unitType: PublicationUnitType; subjectId: string };
export type { PublicationReview };

/** Q-09 */
export type OperationImpactInput = {
  operation: 'CLOSE_ROUTE' | 'CLOSE_CHECKPOINT' | 'REOPEN_ROUTE' | 'REOPEN_CHECKPOINT';
  subjectId: string;
};
export type OperationImpact = {
  affectedRoutes: { routeId: string; routeName: string }[];
  autoClosingRoutes: { routeId: string; routeName: string }[];
  /** chỉ khi mở lại: các điều cần xử lý trước (đã dùng tên hiển thị) */
  reopenBlockers: string[];
};

/** Q-10 */
export type ItemHistoryInput = { subjectType: SubjectType; subjectId: string };
export type AuditRow = {
  auditId: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  actorEmail: string;
  occurredAt: UtcDateTime;
  subjectType: SubjectType | 'ACCOUNT' | 'MEDIA';
  /** Q-11: id của mục, chỉ để dựng link "Mở mục liên quan" (SCR-M03-009 E-08); không bao giờ hiển thị */
  subjectId?: string;
  subjectName?: string;
  /** dòng "{nhãn trường}: {trước} → {sau}" đã render, không phải JSON thô (BR-M03-L10, L11) */
  changeLines: string[];
  reason?: string;
  selfPublished?: boolean;
};
export type ItemHistory = { publishedRevisions: RevisionSummary[]; auditRows: AuditRow[] };

/** Q-11 */
export type AuditLogFilter = {
  from?: UtcDateTime;
  to?: UtcDateTime;
  actorEmail?: string;
  subjectType?: SubjectType;
  page: number;
};
export type AuditLogPage = { rows: AuditRow[]; page: number; hasMore: boolean };

/** Q-12, Q-13 */
export type { ReportInput, Rpt01Output, Rpt02Output };

/** Q-14 */
export type AccountRow = { email: string; role: AdminRole; status: AccountStatus; concurrencyRevision: number };
