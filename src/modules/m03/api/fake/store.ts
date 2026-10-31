// Lõi adapter giả (tasks T043): store in-memory synthetic dùng cho test giai đoạn A và `npm run dev:fake`.
// Mỗi command đi qua `run`: kiểm role (admin-command §7) → lỗi tiêm → khóa tập → stale → thân command
// trong "transaction" (khôi phục state khi thất bại) → đúng một dòng audit, kể cả khi thất bại (BR-M03-F08).
import type {
  AccountStatus,
  AdminRole,
  AuditRow,
  CheckpointContent,
  CheckpointStatus,
  MediaType,
  MediaUsage,
  QrContent,
  QrStatus,
  RevisionStatus,
  RouteContent,
  RouteStatus,
  SpokenLanguage,
  SubjectType,
} from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import { createFixtureProviderUsers, createFixtureState } from './fixtures';

export type FakeAccount = {
  /** null khi còn `INVITATION_PENDING` (chưa nối danh tính provider) */
  userId: string | null;
  email: string;
  role: AdminRole;
  status: AccountStatus;
  concurrencyRevision: number;
  lastChangedByEmail: string;
  lastChangedAt: string;
};

/** Người dùng của auth provider giả (Supabase Auth) — không thuộc "database" của M03 */
export type FakeProviderUser = { userId: string; email: string; password: string };

/** Thư giả do provider gửi (thay Inbucket/Mailpit): link mời hoặc khôi phục */
export type FakeMail = { email: string; kind: 'invite' | 'recovery'; link: string };

export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT';

/** Người gọi một command: tài khoản active, hoặc danh tính provider (Edge `link`) */
export type FakeActor = { userId: string; email: string; role?: AdminRole };

export type FakeRoute = {
  routeId: string;
  name?: string;
  status: RouteStatus;
  concurrencyRevision: number;
  lastEditedByEmail: string;
  lastEditedAt: string;
};

export type FakeCheckpoint = {
  checkpointId: string;
  /** tên vi của bản nháp nếu có, ngược lại bản đã xuất bản (để hiển thị và ghi audit) */
  name?: string;
  status: CheckpointStatus;
  /** ghi chú nội bộ, lưu cùng form, không qua xuất bản (BR-M03-D11) */
  locationNote?: string;
  closureReason?: string;
  concurrencyRevision: number;
  lastEditedByEmail: string;
  lastEditedAt: string;
};

export type FakeQrCode = {
  qrIdentifier: string;
  /** không bao giờ đổi (BR-M03-E12) */
  checkpointId: string;
  status: QrStatus;
  /** thứ tự tạo trong điểm dừng, cho "Điểm tham quan chưa đặt tên {số}" */
  creationOrder: number;
  installationLabel?: string;
  concurrencyRevision: number;
  lastEditedByEmail: string;
  lastEditedAt: string;
};

export type FakeRevision = {
  revisionId: string;
  subjectType: SubjectType;
  subjectId: string;
  revisionNumber: number;
  status: RevisionStatus;
  content: RouteContent | CheckpointContent | QrContent;
  basedOnRevisionNumber?: number;
  lastEditedByEmail: string;
  lastEditedAt: string;
  publishedByEmail?: string;
  publishedAt?: string;
  selfPublished?: boolean;
  concurrencyRevision: number;
};

export type FakeMedia = {
  mediaId: string;
  ownerType: 'ROUTE' | 'CHECKPOINT';
  ownerId: string;
  usage: MediaUsage;
  type: MediaType;
  sourceRef: string;
  mimeType: string;
  fileSizeBytes: number;
  spokenLanguage?: SpokenLanguage;
  usageRightsConfirmed: boolean;
};

/** State "database" — được sao lưu và khôi phục khi command thất bại. Story sau bổ sung bảng của mình. */
export type FakeState = {
  /** khóa = email đã chuẩn hóa (BR-M03-K01) */
  accounts: Map<string, FakeAccount>;
  routes: Map<string, FakeRoute>;
  checkpoints: Map<string, FakeCheckpoint>;
  /** khóa = qrIdentifier */
  qrCodes: Map<string, FakeQrCode>;
  /** khóa = revisionId; một bảng cho tuyến, điểm dừng và QR (spec-M03 §6.3) */
  revisions: Map<string, FakeRevision>;
  media: Map<string, FakeMedia>;
};

/** Object Storage — không chung transaction với database (media-storage-contract §0) */
export type FakeStorageObject = { size: number; mimetype: string; blob: Blob };

export type FakeAuditRow = AuditRow & { subjectId?: string };

export type FailureKey = 'MSG-PUBLISH-FAILED' | 'MSG-CLOSE-FAILED' | 'MSG-GENERIC';

export type CommandSpec = {
  /** giá trị `audit_records.action` (admin-command §5) */
  action: string;
  /** B = cả hai role; R = chỉ REVIEWER; AUTH = mọi danh tính provider (Edge `link` của người được mời) */
  roles: 'B' | 'R' | 'AUTH';
  subject: { type: FakeAuditRow['subjectType']; id?: string; name?: string };
  /** khóa tập kết nối (research R-08) */
  lockKeys?: { key: string; itemName: string }[];
  expected?: { submitted: number | undefined; current: number; editorEmail: string; editedAt: string }[];
  reason?: string;
};

export type CommandContext = {
  actor: FakeActor;
  /** thân command cập nhật khi tạo mới, để dòng audit có id/tên */
  subjectId: string | undefined;
  subjectName: string | undefined;
  changeLines: string[];
  selfPublished?: boolean;
};

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export class FakeStore {
  state: FakeState;
  readonly storage = new Map<string, FakeStorageObject>();
  readonly audit: FakeAuditRow[] = [];
  currentUserId: string | null = null;
  /** Auth provider giả: người dùng, link mời/khôi phục còn hiệu lực, hộp thư */
  readonly auth = {
    users: new Map<string, FakeProviderUser>(),
    linkTokens: new Map<string, { email: string; kind: FakeMail['kind'] }>(),
    outbox: [] as FakeMail[],
  };
  private readonly authListeners = new Set<(event: AuthEvent) => void>();
  /** Test: identifier QR kế tiếp lấy từ đây trước khi sinh ngẫu nhiên (giả lập va chạm) */
  readonly queuedQrIdentifiers: string[] = [];
  private readonly failures = new Map<string, FailureKey>();
  private readonly locks = new Set<string>();
  private readonly clock: () => Date;

  constructor(state: FakeState = createFixtureState(), clock: () => Date = () => new Date()) {
    this.state = state;
    this.clock = clock;
    for (const user of createFixtureProviderUsers()) this.auth.users.set(user.email, user);
  }

  now(): string {
    return this.clock().toISOString();
  }

  /** Id opaque chữ-số (Physical PT-01: định dạng không có nghĩa) */
  newId(length = 20): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join('');
  }

  newUuid(): string {
    return crypto.randomUUID();
  }

  /** Đặt danh tính provider hiện tại (phiên); null = đã đăng xuất, token cũ không còn dùng được */
  signIn(userId: string | null): void {
    this.currentUserId = userId;
    for (const listener of this.authListeners) listener(userId ? 'SIGNED_IN' : 'SIGNED_OUT');
  }

  onAuthChange(listener: (event: AuthEvent) => void): () => void {
    this.authListeners.add(listener);
    return () => this.authListeners.delete(listener);
  }

  providerUser(userId: string | null): FakeProviderUser | undefined {
    if (!userId) return undefined;
    return [...this.auth.users.values()].find((user) => user.userId === userId);
  }

  /** Tài khoản `ACTIVE` của danh tính hiện tại; role/status không đọc từ token (BR-M03-K05) */
  currentAdmin(): FakeAccount | undefined {
    if (!this.currentUserId) return undefined;
    const account = [...this.state.accounts.values()].find((a) => a.userId === this.currentUserId);
    return account?.status === 'ACTIVE' ? account : undefined;
  }

  /** Test: command `action` kế tiếp thất bại với khóa đã chọn */
  failNext(action: string, messageKey: FailureKey = 'MSG-GENERIC'): void {
    this.failures.set(action, messageKey);
  }

  /** Test: giả lập một thao tác khác đang giữ khóa tập */
  holdLock(key: string): void {
    this.locks.add(key);
  }

  releaseLock(key: string): void {
    this.locks.delete(key);
  }

  run<T>(spec: CommandSpec, body: (context: CommandContext) => CommandResult<T>): CommandResult<T> {
    const actor = this.resolveActor(spec.roles);
    const context: CommandContext | undefined = actor && {
      actor,
      subjectId: spec.subject.id,
      subjectName: spec.subject.name,
      changeLines: [],
    };
    let result: CommandResult<T> | undefined;
    try {
      result = context ? this.evaluate(spec, context, body) : forbidden();
      return result;
    } finally {
      const succeeded = result?.ok === true;
      const subjectId = context?.subjectId ?? spec.subject.id;
      const subjectName = context?.subjectName ?? spec.subject.name;
      const row: FakeAuditRow = {
        auditId: this.newId(),
        action: spec.action,
        result: succeeded ? 'SUCCESS' : 'FAILURE',
        actorEmail: actor?.email ?? '',
        occurredAt: this.now(),
        subjectType: spec.subject.type,
        changeLines: succeeded ? (context?.changeLines ?? []) : [],
      };
      if (subjectId !== undefined) row.subjectId = subjectId;
      if (subjectName !== undefined) row.subjectName = subjectName;
      if (spec.reason !== undefined) row.reason = spec.reason;
      if (succeeded && context?.selfPublished !== undefined) row.selfPublished = context.selfPublished;
      this.audit.push(row);
    }
  }

  private resolveActor(roles: CommandSpec['roles']): FakeActor | undefined {
    if (roles !== 'AUTH') {
      const admin = this.currentAdmin();
      return admin?.userId ? { userId: admin.userId, email: admin.email, role: admin.role } : undefined;
    }
    const user = this.providerUser(this.currentUserId);
    return user && { userId: user.userId, email: user.email };
  }

  private evaluate<T>(
    spec: CommandSpec,
    context: CommandContext,
    body: (context: CommandContext) => CommandResult<T>,
  ): CommandResult<T> {
    if (spec.roles === 'R' && context.actor.role !== 'REVIEWER') return forbidden();

    const failure = this.failures.get(spec.action);
    if (failure) {
      this.failures.delete(spec.action);
      return { ok: false, reason: 'FAILED', messageKey: failure };
    }

    const busy = spec.lockKeys?.find((lock) => this.locks.has(lock.key));
    if (busy) return { ok: false, reason: 'BUSY', messageKey: 'MSG-ROUTE-BUSY', busy: { itemName: busy.itemName } };

    const stale = spec.expected?.find((e) => e.submitted !== e.current);
    if (stale) {
      return {
        ok: false,
        reason: 'STALE',
        messageKey: 'MSG-STALE',
        stale: { editorEmail: stale.editorEmail, editedAt: stale.editedAt },
      };
    }

    const backup = structuredClone(this.state);
    try {
      const result = body(context);
      if (!result.ok) this.state = backup;
      return result;
    } catch (error) {
      this.state = backup;
      throw error;
    }
  }
}

function forbidden(): CommandResult<never> {
  return { ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' };
}
