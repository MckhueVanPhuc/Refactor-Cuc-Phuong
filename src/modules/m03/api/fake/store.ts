// Lõi adapter giả (tasks T043): store in-memory synthetic dùng cho test giai đoạn A và `npm run dev:fake`.
// Mỗi command đi qua `run`: kiểm role (admin-command §7) → lỗi tiêm → khóa tập → stale → thân command
// trong "transaction" (khôi phục state khi thất bại) → đúng một dòng audit, kể cả khi thất bại (BR-M03-F08).
import type {
  AccountStatus,
  AdminRole,
  AuditRow,
  CheckpointStatus,
  MediaType,
  MediaUsage,
  RouteStatus,
  SpokenLanguage,
} from '../../contracts/adminDtos';
import type { CommandResult } from '../../contracts/commandResult';
import { createFixtureState } from './fixtures';

export type FakeAccount = {
  userId: string;
  email: string;
  role: AdminRole;
  status: AccountStatus;
  concurrencyRevision: number;
};

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
  name?: string;
  status: CheckpointStatus;
  concurrencyRevision: number;
  lastEditedByEmail: string;
  lastEditedAt: string;
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
  accounts: Map<string, FakeAccount>;
  routes: Map<string, FakeRoute>;
  checkpoints: Map<string, FakeCheckpoint>;
  media: Map<string, FakeMedia>;
};

/** Object Storage — không chung transaction với database (media-storage-contract §0) */
export type FakeStorageObject = { size: number; mimetype: string; blob: Blob };

export type FakeAuditRow = AuditRow & { subjectId?: string };

export type FailureKey = 'MSG-PUBLISH-FAILED' | 'MSG-CLOSE-FAILED' | 'MSG-GENERIC';

export type CommandSpec = {
  /** giá trị `audit_records.action` (admin-command §5) */
  action: string;
  /** B = cả hai role; R = chỉ REVIEWER */
  roles: 'B' | 'R';
  subject: { type: FakeAuditRow['subjectType']; id?: string; name?: string };
  /** khóa tập kết nối (research R-08) */
  lockKeys?: { key: string; itemName: string }[];
  expected?: { submitted: number | undefined; current: number; editorEmail: string; editedAt: string }[];
  reason?: string;
};

export type CommandContext = {
  actor: FakeAccount;
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
  private readonly failures = new Map<string, FailureKey>();
  private readonly locks = new Set<string>();
  private readonly clock: () => Date;

  constructor(state: FakeState = createFixtureState(), clock: () => Date = () => new Date()) {
    this.state = state;
    this.clock = clock;
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

  signIn(userId: string | null): void {
    this.currentUserId = userId;
  }

  /** Tài khoản `ACTIVE` của danh tính hiện tại; role/status không đọc từ token (BR-M03-K05) */
  currentAdmin(): FakeAccount | undefined {
    const account = this.currentUserId ? this.state.accounts.get(this.currentUserId) : undefined;
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
    const actor = this.currentAdmin();
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
