// Kiểu của engine Mila (specs/005 data-model §2). Chỉ UI state trong bộ nhớ; không lưu (BR-MAS-01).
import type { Language, MascotEvent, MascotEventType, StampedEvent } from './events';
import type { MessageId, MessageParams } from './dialogue/catalog';

export type Mode = 'INTRO' | 'DOCK' | 'AVATAR' | 'CELEBRATE';
export type PoseId =
  | 'wave'
  | 'map'
  | 'think'
  | 'backpack'
  | 'binoculars'
  | 'magnifier'
  | 'thumbsUp'
  | 'cheer'
  | 'confused'
  | 'rest'
  | 'avatar'
  | 'point'
  // Đợt 4 (spec-Mascot v1.4; specs/006 T042)
  | 'sorry'
  | 'amazed'
  | 'walk'
  | 'peek'
  | 'proud';
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
  | 'success'
  | 'milestone'
  | 'blink'
  | 'search'
  | 'pack'
  | 'thumb'
  | 'celebrate'
  | 'wave'
  | 'dizzy'
  /** Cử chỉ tự động 2–3 nhịp (BR-MAS-21 v1.5): nhún, nghiêng, vẫy, nhìn quanh */
  | 'gestureHop'
  | 'gestureTilt'
  | 'gestureWave'
  /** AN-WALK: hai bước tại chỗ, ≤ 1200ms (specs/006 T042) */
  | 'walk';
export type Status = 'HIDDEN' | 'INTRO' | 'IDLE' | 'SPEAKING' | 'BUSY' | 'CELEBRATING' | 'SUPPRESSED';
export type Blocker = 'DIALOG' | 'MEDIA' | 'AUTO_END';

/** Kết quả tra bảng luật (MAS-B-*). `priority` 0–7 theo BR-MAS-05. */
export type Intent = {
  behaviorId: string;
  priority: number;
  mode: Mode;
  pose: PoseId;
  animation?: AnimationId;
  /** Du khách chủ động hỏi (chạm Mila): không cooldown (BR-MAS-12, v1.1) */
  requested?: boolean;
  /** Câu nói mỗi lần mở màn (MSG-MAS-010, v1.5): không cooldown, không tính vào BR-MAS-07 */
  everyVisit?: boolean;
  /** Đổi tư thế/mode mà giữ bong bóng đang hiện (v1.5, DV-92: hết ăn mừng → DOCK, câu ăn mừng ở lại) */
  keepBubble?: boolean;
  message?: { id: MessageId; params?: MessageParams };
  /** Trạng thái hiển thị trong lúc giữ (`holdMs`): đang chờ hệ thống, đang ăn mừng */
  status?: 'BUSY' | 'CELEBRATING';
  holdMs?: number;
  /** Chạy tiếp khi bong bóng hoặc thời gian giữ kết thúc (ví dụ INTRO: MSG-MAS-001 → 002 → DOCK) */
  then?: Intent;
  vibrate?: boolean;
  /** Khóa "một lần" (BR-MAS-06): `FIRST_VISIT:<sessionRef>`, `VISIT:<visitRef>`… */
  once?: string;
  /**
   * Ý định không do chính thao tác của du khách: hướng dẫn theo hẹn giờ, lời nhắc (`timer`), cử chỉ tự động (`ambient`).
   * Bị bỏ nếu du khách vừa thao tác trong `MASCOT_INTERACTION_GRACE_MS` (BR-MAS-20 "đang thao tác"; research R-19).
   */
  source?: 'timer' | 'ambient';
  /** Slot ưu tiên khi màn có nhiều slot cùng mode (SCR-M01-003: `start-panel`, `package-panel`); không có thì slot đăng ký sau cùng */
  slot?: string;
};

export type ViewState = { mode: Mode; pose: PoseId; animation: AnimationId | null; seq: number; behaviorId: string; slot?: string };

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
  /** Lần chạm / cuộn / bấm phím gần nhất (BR-MAS-20) */
  lastActivityAt: number | null;
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
  /** Kết thúc bong bóng đang hiện nếu nó thuộc một trong các hành vi này (Exit Condition theo sự kiện, ví dụ MAS-B-020 khi gói xong) */
  end?: readonly string[];
};

export type RuleView = { state: MascotState; ctx: StepContext; now: number };

export type Rule = {
  id: string;
  on: readonly MascotEventType[];
  decide: (event: MascotEvent, view: RuleView) => RuleResult | null;
};

export type StepResult = { state: MascotState; effects: Effect[] };
export type { StampedEvent };
