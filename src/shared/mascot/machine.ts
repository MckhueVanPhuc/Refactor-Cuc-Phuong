// Máy trạng thái thuần của Mila (State Machine §7; specs/005 research R-04). Cùng đầu vào → cùng đầu ra; không đọc
// đồng hồ hệ thống (thời điểm đi trong sự kiện), không DOM, không lưu trữ.
import { admit, clearPresence, pump } from './arbiter';
import {
  MASCOT_AMBIENT_MAX_MS,
  MASCOT_AMBIENT_MIN_MS,
  MASCOT_AMBIENT_PATHS,
  MASCOT_DEDUPE_MS,
  MASCOT_QUEUE_TTL_MS,
  MASCOT_SAME_PRIORITY_MIN_MS,
} from './config';
import type { MascotEventType } from './events';
import { RULES } from './rules';
import type { Blocker, Effect, Intent, MascotState, Rule, StampedEvent, Status, StepContext, StepResult } from './types';

export { readingTimeMs } from './arbiter';
export type { Effect, Intent, MascotState, Mode, PoseId, Rule, RuleResult, RuleView, StepContext, StepResult } from './types';

const INTERNAL: ReadonlySet<MascotEventType> = new Set([
  'mascot.tick',
  'mascot.timer',
  'mascot.slots.changed',
  'mascot.asset.failed',
  // Thao tác liên tục (cuộn) là trạng thái, không phải tín hiệu lặp
  'app.user.activity',
]);
/**
 * Tín hiệu trạng thái (đang có hộp thoại, đang phát, đang có thông báo tự kết thúc): engine áp chúng idempotent, nên
 * không chống trùng. Chống trùng ở đây sẽ nuốt lần "phát" thứ hai của chuỗi phát → dừng → phát trong 500 ms.
 */
const STATE_SIGNALS: ReadonlySet<MascotEventType> = new Set([
  'app.dialog.changed',
  'm02.media.playing',
  'm02.media.stopped',
  'm02.notice.autoEndShown',
  'm02.notice.autoEndHidden',
  'mascot.motion.changed',
  // Thao tác của du khách không phải tín hiệu lặp: chạm dồn đã có luật riêng (BR-MAS-22, MASCOT_TAP_DEBOUNCE_MS)
  'mascot.user.tapped',
  'mascot.user.closedBubble',
  'mascot.user.ctaPressed',
  // Mỗi lần tải gói do một lần bấm của du khách, phát một lần từ hàm async (không phải effect): hai lần lỗi nhanh liên
  // tiếp là hai thao tác thật, không phải tín hiệu lặp (MAS-B-026 đếm chúng)
  'm01.package.downloadStarted',
  'm01.package.resolved',
]);
const DEDUPE_KEEP_MS = 5_000;

export function initialState(): MascotState {
  return {
    status: 'HIDDEN',
    view: null,
    bubble: null,
    hold: null,
    queued: null,
    lastShownAt: {},
    proactiveLog: [],
    lastEventAt: {},
    once: {},
    counters: {},
    timers: {},
    blockers: [],
    closed: false,
    failed: false,
    visible: true,
    hiddenAt: null,
    online: true,
    motion: true,
    hasSession: false,
    path: '',
    lastActivityAt: null,
  };
}

/** Hạn gần nhất host cần gọi lại bằng `mascot.tick` (hoặc `null`). */
export function nextDeadline(s: MascotState): number | null {
  const candidates = [
    s.bubble?.expiresAt ?? null,
    s.hold?.until ?? null,
    s.queued ? s.queued.at + MASCOT_QUEUE_TTL_MS + 1 : null,
    ...Object.values(s.timers),
  ].filter((value): value is number => value !== null);
  return candidates.length ? Math.min(...candidates) : null;
}

function setBlocker(s: MascotState, blocker: Blocker, on: boolean): void {
  s.blockers = s.blockers.filter((b) => b !== blocker);
  if (on) {
    s.blockers.push(blocker);
    s.bubble = null;
    s.queued = null;
  }
}

function closeForSafety(s: MascotState): void {
  clearPresence(s);
  s.timers = {};
  s.closed = true;
}

/** Ý định cuối của chuỗi `then` không có câu (ví dụ INTRO → DOCK): đích khi du khách đóng sớm. */
function lastSilent(intent: Intent | undefined): Intent | undefined {
  let current = intent;
  while (current?.then) current = current.then;
  return current && !current.message ? current : undefined;
}

function endBubble(s: MascotState, ctx: StepContext, now: number, effects: Effect[], byUser: boolean): void {
  const bubble = s.bubble;
  if (!bubble) return;
  s.bubble = null;
  // Du khách đóng câu khi Mila đang ăn mừng: hiệu ứng kết thúc ngay, về đích sau phần ăn mừng (US-MAS-08 mục 2)
  if (byUser && s.hold?.status === 'CELEBRATING' && s.hold.then) {
    const then = s.hold.then;
    s.hold = null;
    admit(s, then, ctx, now, effects);
    return;
  }
  const next = byUser ? lastSilent(bubble.then) : bubble.then;
  if (next) {
    admit(s, next, ctx, now, effects);
    return;
  }
  // AVATAR và INTRO chỉ hiện cùng lời; DOCK ở lại
  if (s.view && (s.view.mode === 'AVATAR' || s.view.mode === 'INTRO') && !s.hold) s.view = null;
}

function deriveStatus(s: MascotState): Status {
  if (s.failed) return 'HIDDEN';
  if (s.closed) return 'SUPPRESSED';
  if (s.hold?.status && s.view) return s.hold.status;
  if (s.bubble) return 'SPEAKING';
  return s.view ? 'IDLE' : 'HIDDEN';
}

function applyRules(s: MascotState, event: StampedEvent, ctx: StepContext, rules: readonly Rule[], effects: Effect[]): void {
  const intents: Intent[] = [];
  for (const rule of rules) {
    if (!rule.on.includes(event.type)) continue;
    const result = rule.decide(event, { state: s, ctx, now: event.at });
    if (!result) continue;
    for (const [name, value] of Object.entries(result.counters ?? {})) {
      if (value === null) delete s.counters[name];
      else s.counters[name] = value;
    }
    for (const [name, delay] of Object.entries(result.timers ?? {})) {
      if (delay === null) delete s.timers[name];
      else s.timers[name] = event.at + delay;
    }
    for (const key of result.once ?? []) s.once[key] = true;
    for (const effect of result.effects ?? []) if (!(effect.kind === 'vibrate' && ctx.reducedMotion)) effects.push(effect);
    if (s.bubble && result.end?.includes(s.bubble.intent.behaviorId)) {
      s.hold = null;
      endBubble(s, ctx, event.at, effects, false);
    }
    intents.push(...(result.intents ?? []));
  }
  intents.sort((a, b) => a.priority - b.priority);
  for (const intent of intents) {
    if (intent.priority === 0) closeForSafety(s);
    else admit(s, intent, ctx, event.at, effects);
  }
}

export function step(state: MascotState, event: StampedEvent, ctx: StepContext, rules: readonly Rule[] = RULES): StepResult {
  const now = event.at;
  const { at: _at, ...payload } = event;
  const dedupeKey = INTERNAL.has(event.type) || STATE_SIGNALS.has(event.type) ? null : JSON.stringify(payload);
  // Đổi sang màn khác là trạng thái, không phải tín hiệu lặp: A → B → A trong 500 ms vẫn phải về A
  const newScreen = event.type === 'app.route.changed' && event.path !== state.path;
  if (dedupeKey !== null && !newScreen) {
    const last = state.lastEventAt[dedupeKey];
    if (last !== undefined && now - last < MASCOT_DEDUPE_MS) return { state, effects: [] };
  }

  const s: MascotState = structuredClone(state);
  const effects: Effect[] = [];
  let pumpQueue = true;

  if (dedupeKey !== null) {
    for (const [key, at] of Object.entries(s.lastEventAt)) if (now - at > DEDUPE_KEEP_MS) delete s.lastEventAt[key];
    // Màn mới bắt đầu với bảng chống trùng sạch: tín hiệu của màn không bị so với lần trước du khách ở màn đó
    if (newScreen) s.lastEventAt = {};
    s.lastEventAt[dedupeKey] = now;
  }
  if ('hasSession' in event) s.hasSession = event.hasSession;

  switch (event.type) {
    case 'app.visibility.changed':
      s.visible = event.visible;
      if (!event.visible) {
        s.bubble = null;
        s.queued = null;
        s.hold = null;
        s.timers = {};
        s.hiddenAt = now;
      }
      break;
    case 'app.dialog.changed':
      if (event.kind === 'OTHER') setBlocker(s, 'DIALOG', event.open);
      break;
    case 'm02.media.playing':
      setBlocker(s, 'MEDIA', true);
      break;
    case 'm02.media.stopped':
      setBlocker(s, 'MEDIA', false);
      break;
    case 'm02.notice.autoEndShown':
      setBlocker(s, 'AUTO_END', true);
      break;
    case 'm02.notice.autoEndHidden':
      setBlocker(s, 'AUTO_END', false);
      break;
    case 'm02.notice.closedShown':
      closeForSafety(s);
      break;
    case 'm02.scan.resolved':
      if (event.display === 'CLOSED') closeForSafety(s);
      else s.closed = false;
      break;
    case 'm02.scanner.detected':
      s.closed = false;
      break;
    case 'app.route.changed': {
      const bubble = s.bubble;
      // Câu thành công (P4) vừa phát ở màn cũ được mang sang màn mới (lượt ghé mới → điều hướng sang nội dung)
      // Chỉ câu thành công (P4) được mang sang (BR-MAS-20 "rời màn"); câu chạm hay lỗi của màn cũ không theo sang
      const carry = bubble && bubble.priority === 4 && now - bubble.shownAt < MASCOT_SAME_PRIORITY_MIN_MS ? bubble.intent : null;
      clearPresence(s);
      s.timers = {};
      s.closed = false;
      s.path = event.path;
      s.blockers = s.blockers.filter((b) => b === 'AUTO_END');
      for (const name of Object.keys(s.counters)) if (name.startsWith('screen:')) delete s.counters[name];
      if (carry) s.queued = { intent: carry, at: now, carried: true };
      // Slot của màn mới chưa đăng ký; câu mang sang chờ `mascot.slots.changed`
      pumpQueue = false;
      break;
    }
    case 'app.network.changed':
      s.online = event.online;
      break;
    case 'app.user.activity':
      s.lastActivityAt = now;
      break;
    case 'mascot.user.closedBubble':
    case 'mascot.user.ctaPressed':
      endBubble(s, ctx, now, effects, true);
      break;
    case 'mascot.motion.changed':
      s.motion = event.on;
      break;
    case 'm02.scanner.opened':
      s.counters['screen:scanner'] = 1;
      break;
    case 'm02.scanner.closed':
      delete s.counters['screen:scanner'];
      break;
    case 'mascot.asset.failed':
      clearPresence(s);
      s.failed = true;
      break;
    case 'mascot.tick': {
      if (s.bubble?.expiresAt != null && now >= s.bubble.expiresAt) endBubble(s, ctx, now, effects, false);
      if (s.hold && now >= s.hold.until) {
        const then = s.hold.then;
        s.hold = null;
        if (then) admit(s, then, ctx, now, effects);
        // AVATAR chỉ hiện cùng lời hoặc trong lúc giữ (minh họa ngắn MAS-B-040, nhìn quanh MAS-B-041): hết giữ thì ẩn
        else if (s.view?.mode === 'AVATAR' && !s.bubble) s.view = null;
      }
      const due = Object.entries(s.timers)
        .filter(([, deadline]) => deadline <= now)
        .map(([name]) => name);
      for (const name of due) delete s.timers[name];
      for (const name of due) applyRules(s, { type: 'mascot.timer', name, at: now }, ctx, rules, effects);
      break;
    }
    default:
      break;
  }

  applyRules(s, event, ctx, rules, effects);
  if (pumpQueue) pump(s, ctx, now, effects);
  scheduleAmbient(s, ctx, now);
  s.status = deriveStatus(s);
  return { state: s, effects };
}

/**
 * Lịch cử chỉ tự động (BR-MAS-21; research R-18): Mila đứng yên ở DOCK trên màn đứng chờ, không bong bóng, không giữ,
 * không ngữ cảnh chặn, công tắc bật → có một hẹn `ambient` trong 8–15 s; điều kiện hết → bỏ hẹn.
 */
function scheduleAmbient(s: MascotState, ctx: StepContext, now: number): void {
  const waiting =
    s.motion &&
    s.visible &&
    !s.failed &&
    !s.closed &&
    s.view?.mode === 'DOCK' &&
    !s.bubble &&
    !s.hold &&
    s.blockers.length === 0 &&
    !s.counters['screen:scanner'] &&
    MASCOT_AMBIENT_PATHS.includes(s.path);
  if (!waiting) {
    delete s.timers['ambient'];
    return;
  }
  if (s.timers['ambient'] !== undefined) return;
  const random = ctx.random ?? Math.random;
  s.timers['ambient'] = now + MASCOT_AMBIENT_MIN_MS + Math.floor(random() * (MASCOT_AMBIENT_MAX_MS - MASCOT_AMBIENT_MIN_MS));
}
