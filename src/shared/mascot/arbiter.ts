// Trọng tài ưu tiên của Mila (spec-Mascot BR-MAS-05…08, 17, 19; specs/005 research R-05). Hàm thuần: nhận bản nháp
// state đã sao chép và thời điểm, ghi kết quả vào bản nháp đó.
import {
  MASCOT_PROACTIVE_LIMIT,
  MASCOT_PROACTIVE_WINDOW_MS,
  MASCOT_QUEUE_TTL_MS,
  MASCOT_SAME_PRIORITY_MIN_MS,
  MASCOT_VIBRATION_MS,
} from './config';
import { MESSAGE_META, messageText } from './dialogue/catalog';
import type { Effect, Intent, MascotState, StepContext } from './types';

/** Thời gian đọc bong bóng không có nút: 3–7 giây (spec-Mascot §5.4). */
export function readingTimeMs(text: string): number {
  return Math.min(7_000, Math.max(3_000, 1_200 + 45 * text.length));
}

const isProactive = (intent: Intent) => intent.priority >= 5 && Boolean(intent.message);

/** Bỏ khung và bong bóng, hàng đợi, hẹn giờ giữ (P0 an toàn, đổi màn, lỗi). */
export function clearPresence(s: MascotState): void {
  s.view = null;
  s.bubble = null;
  s.hold = null;
  s.queued = null;
}

function enqueue(s: MascotState, intent: Intent, now: number): void {
  if (intent.priority > 4) return; // P5–P7 không xếp hàng
  if (s.queued && s.queued.intent.priority <= intent.priority) return;
  s.queued = { intent, at: now };
}

/** Thử đưa một ý định ra màn. Trả `false` khi bị bỏ hoặc xếp hàng. */
export function admit(s: MascotState, intent: Intent, ctx: StepContext, now: number, effects: Effect[], carried = false): boolean {
  if (s.failed || s.closed || !s.visible) return false;
  if (s.blockers.length > 0 && intent.priority > 1) return false;
  if (!carried && intent.once && s.once[intent.once]) return false;

  const meta = intent.message ? MESSAGE_META[intent.message.id] : undefined;
  if (!carried && intent.message && meta) {
    const last = s.lastShownAt[intent.message.id];
    if (last !== undefined && now - last < meta.cooldownMs) return false;
  }
  if (!carried && isProactive(intent)) {
    s.proactiveLog = s.proactiveLog.filter((at) => now - at < MASCOT_PROACTIVE_WINDOW_MS);
    if (s.proactiveLog.length >= MASCOT_PROACTIVE_LIMIT) return false;
  }
  if (!ctx.availableModes.includes(intent.mode)) {
    enqueue(s, intent, now);
    return false;
  }

  const current = s.bubble;
  if (current) {
    if (intent.priority > current.priority) {
      if (intent.message) enqueue(s, intent, now);
      return false;
    }
    if (intent.priority === current.priority && now - current.shownAt < MASCOT_SAME_PRIORITY_MIN_MS) {
      enqueue(s, intent, now);
      return false;
    }
  }

  apply(s, intent, ctx, now, effects);
  return true;
}

function apply(s: MascotState, intent: Intent, ctx: StepContext, now: number, effects: Effect[]): void {
  s.view = {
    mode: intent.mode,
    pose: intent.pose,
    animation: intent.animation ?? null,
    seq: (s.view?.seq ?? 0) + 1,
    behaviorId: intent.behaviorId,
  };
  s.hold =
    intent.holdMs !== undefined
      ? { until: now + intent.holdMs, ...(intent.then ? { then: intent.then } : {}), ...(intent.status ? { status: intent.status } : {}) }
      : null;
  if (intent.message) {
    const meta = MESSAGE_META[intent.message.id];
    const text = messageText(ctx.language, intent.message.id, intent.message.params);
    s.bubble = {
      messageId: intent.message.id,
      ...(intent.message.params ? { params: intent.message.params } : {}),
      priority: intent.priority,
      shownAt: now,
      expiresAt: meta.autoHide ? now + readingTimeMs(text) : null,
      ...(intent.then && intent.holdMs === undefined ? { then: intent.then } : {}),
      intent,
    };
    s.lastShownAt[intent.message.id] = now;
    if (isProactive(intent)) s.proactiveLog.push(now);
  } else if (s.bubble && intent.priority <= s.bubble.priority) {
    s.bubble = null;
  }
  if (intent.once) s.once[intent.once] = true;
  if (intent.vibrate && !ctx.reducedMotion) effects.push({ kind: 'vibrate', ms: MASCOT_VIBRATION_MS });
}

/** Đưa câu đang chờ ra nếu còn hạn; quá `MASCOT_QUEUE_TTL_MS` thì bỏ. */
export function pump(s: MascotState, ctx: StepContext, now: number, effects: Effect[]): void {
  const queued = s.queued;
  if (!queued) return;
  if (now - queued.at > MASCOT_QUEUE_TTL_MS) {
    s.queued = null;
    return;
  }
  if (s.bubble) return;
  s.queued = null;
  admit(s, queued.intent, ctx, now, effects, queued.carried === true);
  // Vẫn phải chờ (chưa có slot): giữ thời điểm xếp hàng gốc để TTL tính từ lần đầu
  const after = s.queued as MascotState['queued'];
  if (after?.intent === queued.intent) s.queued = queued;
}
