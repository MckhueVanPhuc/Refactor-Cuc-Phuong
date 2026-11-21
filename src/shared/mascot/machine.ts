// Máy trạng thái thuần của Mila (State Machine §7; specs/005 research R-04). Cùng đầu vào → cùng đầu ra; không đọc
// đồng hồ hệ thống (thời điểm đi trong sự kiện), không DOM, không lưu trữ.
import { admit, clearPresence, pump } from './arbiter';
import { MASCOT_DEDUPE_MS, MASCOT_QUEUE_TTL_MS, MASCOT_SAME_PRIORITY_MIN_MS } from './config';
import type { MascotEventType } from './events';
import { RULES } from './rules';
import type { Blocker, Effect, Intent, MascotState, Rule, StampedEvent, Status, StepContext, StepResult } from './types';

export { readingTimeMs } from './arbiter';
export type { Effect, Intent, MascotState, Mode, PoseId, Rule, RuleResult, RuleView, StepContext, StepResult } from './types';

const INTERNAL: ReadonlySet<MascotEventType> = new Set(['mascot.tick', 'mascot.timer', 'mascot.slots.changed', 'mascot.asset.failed']);
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
    hasSession: false,
    path: '',
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
  const dedupe = !INTERNAL.has(event.type) && !STATE_SIGNALS.has(event.type);
  if (dedupe) {
    const { at: _at, ...payload } = event;
    const key = JSON.stringify(payload);
    const last = state.lastEventAt[key];
    if (last !== undefined && now - last < MASCOT_DEDUPE_MS) return { state, effects: [] };
  }

  const s: MascotState = structuredClone(state);
  const effects: Effect[] = [];
  let pumpQueue = true;

  if (dedupe) {
    for (const [key, at] of Object.entries(s.lastEventAt)) if (now - at > DEDUPE_KEEP_MS) delete s.lastEventAt[key];
    const { at: _at, ...payload } = event;
    s.lastEventAt[JSON.stringify(payload)] = now;
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
      const carry = bubble && bubble.priority <= 4 && now - bubble.shownAt < MASCOT_SAME_PRIORITY_MIN_MS ? bubble.intent : null;
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
    case 'mascot.user.closedBubble':
    case 'mascot.user.ctaPressed':
      endBubble(s, ctx, now, effects, true);
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
  s.status = deriveStatus(s);
  return { state: s, effects };
}
