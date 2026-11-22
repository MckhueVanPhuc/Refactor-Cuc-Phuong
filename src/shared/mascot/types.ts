// Kiểu của engine Mila (specs/005 data-model §2). Chỉ UI state trong bộ nhớ; không lưu (BR-MAS-01).
import type { Language, MascotEvent, MascotEventType, StampedEvent } from './events';
import type { MessageId, MessageParams } from './dialogue/catalog';

export type Mode = 'INTRO' | 'DOCK' | 'AVATAR' | 'CELEBRATE';
export type PoseId = 'wave' | 'map' | 'think' | 'backpack' | 'binoculars' | 'magnifier' | 'thumbsUp' | 'cheer' | 'confused' | 'rest' | 'avatar' | 'point';
export type AnimationId =
  | 'enter'
  | 'exit'
  | 'intro'
  | 'shrink'
  | 'pop'
  | 'settle'
  | 'breathe'
  | 'look'
  | 'tilt'
  | 'hop'
  | 'search'
  | 'pack'
  | 'thumb'
  | 'celebrate'
  | 'wave';
export type Status = 'HIDDEN' | 'INTRO' | 'IDLE' | 'SPEAKING' | 'BUSY' | 'CELEBRATING' | 'SUPPRESSED';
export type Blocker = 'DIALOG' | 'MEDIA' | 'AUTO_END';

/** Kết quả tra bảng luật (MAS-B-*). `priority` 0–7 theo BR-MAS-05. */
export type Intent = {
  behaviorId: string;
  priority: number;
  mode: Mode;
  pose: PoseId;
  animation?: AnimationId;
  message?: { id: MessageId; params?: MessageParams };
  /** Trạng thái hiển thị trong lúc giữ (`holdMs`): đang chờ hệ thống, đang ăn mừng */
  status?: 'BUSY' | 'CELEBRATING';
  holdMs?: number;
  /** Chạy tiếp khi bong bóng hoặc thời gian giữ kết thúc (ví dụ INTRO: MSG-MAS-001 → 002 → DOCK) */
  then?: Intent;
  vibrate?: boolean;
  /** Khóa "một lần" (BR-MAS-06): `FIRST_VISIT:<sessionRef>`, `VISIT:<visitRef>`… */
  once?: string;
};

export type ViewState = { mode: Mode; pose: PoseId; animation: AnimationId | null; seq: number; behaviorId: string };

export type BubbleState = {
  messageId: MessageId;
  params?: MessageParams;
  priority: number;
  shownAt: number;
  expiresAt: number | null;
  then?: Intent;
  /** Ý định gốc, để mang câu P4 vừa phát sang màn mới (State Machine §5.2 luật 6) */
  intent: Intent;
};

export type MascotState = {
  status: Status;
  view: ViewState | null;
  bubble: BubbleState | null;
  hold: { until: number; then?: Intent; status?: 'BUSY' | 'CELEBRATING' } | null;
  /** `carried`: câu mang sang từ màn trước, không kiểm lại một lần/cooldown */
  /** `reason`: `slot` = slot của màn chưa đăng ký (mọi mức chờ); `busy` = đang có bong bóng khác (chỉ P0–P4 chờ) */
  queued: { intent: Intent; at: number; carried?: boolean; reason?: 'slot' | 'busy' } | null;
  lastShownAt: Record<string, number>;
  proactiveLog: number[];
  lastEventAt: Record<string, number>;
  once: Record<string, true>;
  counters: Record<string, number>;
  /** Hạn của hẹn giờ do luật đặt (thời điểm tuyệt đối) */
  timers: Record<string, number>;
  blockers: Blocker[];
  closed: boolean;
  /** Lỗi ảnh hoặc lỗi bên trong: ẩn tới khi tải lại trang (BR-MAS-15, 16) */
  failed: boolean;
  visible: boolean;
  hiddenAt: number | null;
  online: boolean;
  /** Công tắc "Chuyển động" (v1.1): tắt thì không cử chỉ tự động (BR-MAS-21) */
  motion: boolean;
  hasSession: boolean;
  path: string;
};

/** Ngữ cảnh host đưa vào mỗi bước */
/** `typing`: chữ bong bóng hiện dần (chuyển động bật, không giảm chuyển động) — thời gian tự ẩn cộng thời gian gõ (R-20). */
/** `random`: hàm ngẫu nhiên được tiêm vào để reducer vẫn tất định (test truyền dãy cố định; R-18). */
export type StepContext = { availableModes: readonly Mode[]; reducedMotion: boolean; language: Language; typing?: boolean; random?: () => number };

export type Effect = { kind: 'vibrate'; ms: number };

export type RuleResult = {
  intents?: Intent[];
  /** Đặt (số) hoặc xóa (`null`) bộ đếm */
  counters?: Record<string, number | null>;
  /** Đặt hẹn giờ sau N ms, hoặc xóa (`null`) */
  timers?: Record<string, number | null>;
  /** Đánh dấu khóa "một lần" mà không cần nói */
  once?: string[];
  /** Hiệu ứng không kèm lời (ví dụ rung ở điểm cuối, BR-MAS-19); rung bị bỏ khi giảm chuyển động */
  effects?: Effect[];
};

export type RuleView = { state: MascotState; ctx: StepContext; now: number };

export type Rule = {
  id: string;
  on: readonly MascotEventType[];
  decide: (event: MascotEvent, view: RuleView) => RuleResult | null;
};

export type StepResult = { state: MascotState; effects: Effect[] };
export type { StampedEvent };
