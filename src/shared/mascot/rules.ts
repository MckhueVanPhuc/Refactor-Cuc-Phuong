// Bảng luật của Mila: mỗi luật mang ID hành vi `MAS-B-*` của Behavior Matrix (docs/mascot) và dẫn tới BR-MAS của
// spec-Mascot. Luật an toàn (MAS-B-035, 045, 058, 082–084, hộp thoại) nằm trong machine.ts vì không phụ thuộc màn.
import {
  MASCOT_AMBIENT_GESTURE_MS,
  MASCOT_DIZZY_TAPS,
  MASCOT_DIZZY_WINDOW_MS,
  MASCOT_TAP_DEBOUNCE_MS,
  MASCOT_TRIP_START_DELAY_MS,
  MASCOT_VIBRATION_MS,
  MASCOT_WELCOME_BACK_MS,
  NATURE_REMINDERS_APPROVED,
} from './config';
import { blinkAsset } from './assets';
import type { MessageId } from './dialogue/catalog';
import type { MascotEvent } from './events';
import type { AnimationId, Intent, PoseId, Rule, RuleResult, RuleView } from './types';

type EventOf<T extends MascotEvent['type']> = Extract<MascotEvent, { type: T }>;

/** Luật cho một loại sự kiện, có kiểu đúng của sự kiện đó. */
function on<T extends MascotEvent['type']>(id: string, type: T, decide: (event: EventOf<T>, view: RuleView) => RuleResult | null): Rule {
  return { id, on: [type], decide: (event, view) => decide(event as EventOf<T>, view) };
}

/** Luật chạy khi hẹn giờ `name` tới hạn. */
function onTimer(id: string, name: string, decide: (view: RuleView) => RuleResult | null): Rule {
  return on(id, 'mascot.timer', (event, view) => (event.name === name ? decide(view) : null));
}

const isQrLinkPage = (path: string) => path.startsWith('/q/');

// —— US1: Làm quen với Mila (US-MAS-01) ——

/** MAS-B-003: Mila đứng ở hero danh mục (DOCK); cũng là đích cuối của lời giới thiệu. */
const CATALOG_DOCK: Intent = { behaviorId: 'MAS-B-003', priority: 7, mode: 'DOCK', pose: 'map', animation: 'shrink' };

/** MAS-B-001 → MAS-B-003 (v1.3): lớp phủ giới thiệu một câu, chờ du khách chạm, rồi Mila về DOCK ở hero. */
const INTRO: Intent = {
  behaviorId: 'MAS-B-001',
  priority: 6,
  mode: 'INTRO',
  pose: 'wave',
  animation: 'intro',
  message: { id: 'MSG-MAS-001' },
  once: 'INTRO',
  then: CATALOG_DOCK,
};

const US1: Rule[] = [
  // Chọn ngôn ngữ ở bước chọn ngôn ngữ: danh mục chưa kịp render, nên hiện sau 300 ms (Behavior Matrix MAS-B-001)
  on('MAS-B-001', 'm01.language.selected', (_event, { state }) =>
    isQrLinkPage(state.path) || state.once['INTRO'] ? null : { timers: { intro: 300 }, once: ['INTRO_REQUESTED'] },
  ),
  onTimer('MAS-B-001:show', 'intro', () => ({ intents: [INTRO] })),
  on('MAS-B-003', 'm01.catalog.loaded', (event) => (event.status === 'ready' ? { intents: [{ ...CATALOG_DOCK, animation: 'enter' }] } : null)),
  // Du khách quay lại: ngôn ngữ đã có từ trước (bước chọn ngôn ngữ không hiện trong lần tải này) — một lần mỗi lần tải trang
  on('MAS-B-004', 'm01.catalog.loaded', (event, { state }) =>
    event.status === 'ready' && !state.once['INTRO_REQUESTED'] && !state.once['WELCOME_BACK'] ? { timers: { welcome: 600 } } : null,
  ),
  onTimer('MAS-B-004:show', 'welcome', () => ({
    intents: [
      {
        behaviorId: 'MAS-B-004',
        priority: 6,
        mode: 'DOCK',
        pose: 'wave',
        animation: 'pop',
        message: { id: 'MSG-MAS-004' },
        once: 'WELCOME_BACK',
        // Nói xong (hoặc đóng sớm) thì về tư thế bản đồ của danh mục, không giữ tư thế vẫy tay
        then: { ...CATALOG_DOCK, animation: 'settle' },
      },
    ],
  })),
];

// —— US2: Mila ăn mừng tiến độ có thật (US-MAS-02) ——

const US2: Rule[] = [
  // MAS-B-050, 051, 055, 066: lượt ghé được ghi lần đầu, theo ba cấp ăn mừng (BR-MAS-23). Cấp 1 (điểm thường): nhún một
  // lần + 050. Cấp 2 (mốc, ưu tiên đầu tiên > nửa (n ≥ 4) > còn một điểm (n ≥ 3)): nhảy hai lần, lá rơi + câu của mốc.
  // Bong bóng này là lời xác nhận lượt ghé thay toast (BR-MAS-24). Mỗi lượt ghé chỉ một phản ứng (VISIT:<visitRef>), kể cả
  // khi trang nội dung mount lại từ router state (lùi/tiến, tải lại). Điểm cuối: hộp thoại cuối chuyến hiện ngay, Mila chỉ rung.
  on('MAS-B-050', 'm02.visit.recorded', (event, { state }) => {
    const once = `VISIT:${event.visitRef}`;
    if (state.once[once]) return null;
    if (event.isFinal) return { once: [once], effects: [{ kind: 'vibrate', ms: MASCOT_VIBRATION_MS }] };
    const milestone = { priority: 4, mode: 'AVATAR', pose: 'cheer', animation: 'milestone', vibrate: true, once } as const;
    if (event.k === 1) return { intents: [{ ...milestone, behaviorId: 'MAS-B-051', message: { id: 'MSG-MAS-051' } }] };
    if (event.n >= 4 && event.k === Math.ceil(event.n / 2)) {
      return { intents: [{ ...milestone, behaviorId: 'MAS-B-055', message: { id: 'MSG-MAS-055' } }] };
    }
    if (event.n >= 3 && event.k === event.n - 1) {
      return { intents: [{ ...milestone, behaviorId: 'MAS-B-066', message: { id: 'MSG-MAS-058' } }] };
    }
    const cheer = state.counters['cheer'] ?? 0;
    return {
      counters: { cheer: cheer + 1 },
      intents: [
        {
          ...milestone,
          behaviorId: 'MAS-B-050',
          pose: 'thumbsUp',
          animation: 'success',
          message: { id: 'MSG-MAS-050', params: { k: event.k, n: event.n, cheer } },
        },
      ],
    };
  }),
  // MAS-B-033: DOCK trên màn chuyến đi, tư thế theo tiến độ (State Machine §3.1)
  on('MAS-B-033', 'm02.trip.shown', (event) =>
    event.hasSession
      ? {
          // Tiến độ của màn cho câu chạm (MAS-B-036); bộ đếm `screen:` tự xóa khi đổi màn
          counters: { 'screen:k': event.k, 'screen:n': event.n, 'screen:final': event.finalVisited ? 1 : 0 },
          intents: [{ behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: event.finalVisited ? 'thumbsUp' : event.k > 0 ? 'map' : 'binoculars', animation: 'enter' }],
        }
      : null,
  ),
  // MAS-B-061: "Đi tiếp" ở câu hỏi cuối chuyến — câu nằm ở slot đang có (DOCK ở chuyến đi, AVATAR ở trang nội dung)
  on('MAS-B-061', 'm02.finalPrompt.continued', (_event, { ctx }) => ({
    intents: [{ behaviorId: 'MAS-B-061', priority: 5, mode: ctx.availableModes.includes('DOCK') ? 'DOCK' : 'AVATAR', pose: 'thumbsUp', animation: 'pop', message: { id: 'MSG-MAS-061' } }],
  })),
];

// —— US4: Kết thúc chuyến cùng Mila (US-MAS-08) ——

/** Lời "đã lưu trên máy" chờ sau phần ăn mừng; còn bong bóng thì thử lại sau 1 giây. */
const PENDING_NOTE_DELAY_MS = 4_000;
const PENDING_NOTE_RETRY_MS = 1_000;

/** MAS-B-063: hình tĩnh cạnh huy hiệu. Chuyến tự kết thúc (BO_DO) chỉ nghỉ, không mừng. */
const endDock = (status: 'HOAN_TAT' | 'BO_DO'): Intent => ({
  behaviorId: 'MAS-B-063',
  priority: 7,
  mode: 'DOCK',
  pose: status === 'HOAN_TAT' ? 'cheer' : 'rest',
});

const US4: Rule[] = [
  // MAS-B-062 / 064 → 063: vừa bấm Kết thúc trong lần tải trang này → ăn mừng một lần (cấp 3, BR-MAS-23), rồi về hình
  // tĩnh. Quét đủ mọi điểm của hành trình (k = n) → 064 / 063; kết thúc sớm → 062, mừng tích cực như nhau.
  // Mở lại hoặc tải lại màn kết quả: chỉ hình tĩnh (Q12). Đóng bong bóng sớm → về hình tĩnh ngay (đích `then` không lời).
  on('MAS-B-062', 'm02.trip.ended', (event) =>
    event.justEnded && event.status === 'HOAN_TAT'
      ? {
          intents: [
            {
              behaviorId: event.n > 0 && event.k >= event.n ? 'MAS-B-064' : 'MAS-B-062',
              priority: 4,
              mode: 'CELEBRATE',
              pose: 'cheer',
              animation: 'celebrate',
              message: event.n > 0 && event.k >= event.n ? { id: 'MSG-MAS-063', params: { n: event.n } } : { id: 'MSG-MAS-062', params: { k: event.k } },
              then: endDock(event.status),
            },
          ],
        }
      : { intents: [{ ...endDock(event.status), animation: 'enter' }] },
  ),
  // MAS-B-070: chuyến chờ gửi vì mất sóng → sau phần ăn mừng, một lần nói chuyến đã lưu trên máy (không nói "đã gửi").
  // MAS-B-071: chờ gửi rồi gửi xong khi màn đang mở → giơ ngón cái, không có câu. MAS-B-072 (CONFLICT): không luật nào —
  // màn chỉ đặt hình Mila cạnh thông báo, không câu, không nút (BR-M02-011).
  on('MAS-B-070', 'm02.sync.statusChanged', (event, { state }) => {
    if (event.status === 'PENDING') {
      return { counters: { syncPending: 1 }, timers: event.online || state.once['PENDING_NOTE'] ? {} : { pendingNote: PENDING_NOTE_DELAY_MS } };
    }
    const wasPending = Boolean(state.counters['syncPending']);
    const reset = { counters: { syncPending: null }, timers: { pendingNote: null } };
    if (event.status === 'SYNCED' && wasPending) {
      return { ...reset, intents: [{ behaviorId: 'MAS-B-071', priority: 7, mode: 'DOCK', pose: 'thumbsUp', animation: 'thumb' }] };
    }
    return reset;
  }),
  onTimer('MAS-B-070:show', 'pendingNote', ({ state }) =>
    state.bubble
      ? { timers: { pendingNote: PENDING_NOTE_RETRY_MS } }
      : {
          intents: [{ behaviorId: 'MAS-B-070', priority: 5, mode: 'DOCK', pose: 'backpack', animation: 'pack', message: { id: 'MSG-MAS-070' }, once: 'PENDING_NOTE' }],
        },
  ),
];

// —— v1.1: cử chỉ tự động (MAS-B-086, BR-MAS-21; research R-18) ——

type Gesture = { id: string; pose?: PoseId; animation: AnimationId };

/** Nhóm cử chỉ ngắn (Asset spec AN-AMBIENT). Cử chỉ đổi tư thế quay về tư thế ngữ cảnh khi hết. */
const GESTURES: readonly Gesture[] = [
  { id: 'look', pose: 'binoculars', animation: 'tilt' },
  { id: 'wave', pose: 'wave', animation: 'wave' },
  { id: 'hop', animation: 'hop' },
  { id: 'tilt', animation: 'tilt' },
  { id: 'pack', pose: 'backpack', animation: 'hop' },
  // AN-BLINK: chỉ khi tư thế hiện tại có ảnh mắt nhắm MA-20 (MAS-TC-122)
  { id: 'blink', animation: 'blink' },
];

const available = (gesture: Gesture, pose: PoseId) => gesture.id !== 'blink' || blinkAsset(pose) !== null;

/** Cử chỉ dùng được với tư thế đang đứng (research R-24). */
export function ambientGestures(pose: PoseId): readonly Gesture[] {
  return GESTURES.filter((gesture) => available(gesture, pose));
}

const AMBIENT: Rule[] = [
  // Lịch do máy trạng thái đặt khi Mila đứng chờ; tới hạn thì chọn một cử chỉ khác cử chỉ trước, không có chữ (P7, không
  // tính vào giới hạn câu chủ động vì không có lời)
  onTimer('MAS-B-086', 'ambient', ({ state, ctx }) => {
    const view = state.view;
    if (!view || view.mode !== 'DOCK' || state.bubble || state.hold) return null;
    const random = ctx.random ?? Math.random;
    const last = state.counters['ambient:last'];
    const choices = GESTURES.map((_, index) => index).filter((index) => index !== last && available(GESTURES[index]!, view.pose));
    const index = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))]!;
    const gesture = GESTURES[index]!;
    return {
      counters: { 'ambient:last': index },
      intents: [
        {
          behaviorId: 'MAS-B-086',
          priority: 7,
          mode: 'DOCK',
          pose: gesture.pose ?? view.pose,
          animation: gesture.animation,
          source: 'ambient',
          holdMs: MASCOT_AMBIENT_GESTURE_MS,
          then: { behaviorId: view.behaviorId, priority: 7, mode: 'DOCK', pose: view.pose, animation: 'settle' },
        },
      ],
    };
  }),
];

// —— US8 (v1.1): hỏi Mila theo ngữ cảnh, chạm nhiều lần, bắt đầu chuyến, chào lại, nhắc cất máy ——

type HelpLine = { behaviorId: string; id: MessageId; pose: PoseId; params?: { r: number } };

/** Câu hướng dẫn của màn đang mở, theo tình huống (spec-Mascot BR-MAS-12 v1.1). */
function helpLines(state: RuleView['state']): HelpLine[] {
  const path = state.path;
  if (path === '/trip') {
    if (state.counters['screen:scanner']) return [{ behaviorId: 'MAS-B-037', id: 'MSG-MAS-043', pose: 'binoculars' }];
    const k = state.counters['screen:k'] ?? 0;
    const n = state.counters['screen:n'] ?? 0;
    if (k > 0 && n - k >= 1 && !state.counters['screen:final']) return [{ behaviorId: 'MAS-B-036', id: 'MSG-MAS-033', pose: 'map', params: { r: n - k } }];
    return [{ behaviorId: 'MAS-B-032', id: 'MSG-MAS-032', pose: 'point' }];
  }
  if (path === '/trip/end') return [{ behaviorId: 'MAS-B-065', id: 'MSG-MAS-065', pose: 'thumbsUp' }];
  if (path.startsWith('/trip/qr/') || path.startsWith('/q/')) return [{ behaviorId: 'MAS-B-059', id: 'MSG-MAS-059', pose: 'point' }];
  // Các màn M01: danh mục, gợi ý, chi tiết tuyến, tài nguyên
  return [
    { behaviorId: 'MAS-B-009', id: 'MSG-MAS-009', pose: 'point' },
    { behaviorId: 'MAS-B-009', id: 'MSG-MAS-012', pose: 'point' },
  ];
}

/** Đích sau câu chạm ở DOCK: tư thế ngữ cảnh trước khi hỏi (không giữ tư thế chỉ tay). */
function backTo(state: RuleView['state']): Intent | undefined {
  const view = state.view;
  if (!view || view.mode !== 'DOCK') return undefined;
  const asked = state.bubble?.intent.requested ? state.bubble.intent.then : undefined;
  return asked ?? { behaviorId: view.behaviorId, priority: 7, mode: 'DOCK', pose: view.pose, animation: 'settle' };
}

const US8: Rule[] = [
  on('MAS-B-012', 'mascot.user.tapped', (_event, { state, now }) => {
    // MAS-B-089: chạm dồn tính một lần
    const lastTap = state.counters['tap:last'];
    if (lastTap !== undefined && now - lastTap < MASCOT_TAP_DEBOUNCE_MS) return null;
    // Cửa sổ đếm chạm cho phản ứng chóng mặt
    const start = state.counters['tap:start'];
    const fresh = start === undefined || now - start > MASCOT_DIZZY_WINDOW_MS;
    const count = (fresh ? 0 : (state.counters['tap:n'] ?? 0)) + 1;
    const counters = { 'tap:last': now, 'tap:start': fresh ? now : start, 'tap:n': count };
    const view = state.view;
    if (!view || (view.mode !== 'DOCK' && view.mode !== 'AVATAR')) return { counters };
    const then = backTo(state);
    // MAS-B-085: chóng mặt một lần mỗi lần tải trang (tạm dùng ảnh bối rối); không ngã
    if (count >= MASCOT_DIZZY_TAPS && !state.once['DIZZY']) {
      return {
        counters: { ...counters, 'tap:n': 0 },
        intents: [
          { behaviorId: 'MAS-B-085', priority: 3, mode: view.mode, pose: 'confused', animation: 'dizzy', message: { id: 'MSG-MAS-085' }, once: 'DIZZY', requested: true, ...(then ? { then } : {}) },
        ],
      };
    }
    const lines = helpLines(state);
    const index = lines.findIndex((line) => line.id === state.bubble?.messageId);
    // Đang hiện câu hướng dẫn của màn chỉ có một câu: không đổi gì, chữ không nháy lại (BR-MAS-22)
    if (index >= 0 && lines.length === 1) return { counters };
    const line = lines[index >= 0 ? (index + 1) % lines.length : 0]!;
    return {
      counters,
      intents: [
        {
          behaviorId: line.behaviorId,
          priority: 3,
          mode: view.mode,
          pose: line.pose,
          animation: 'hop',
          message: { id: line.id, ...(line.params ? { params: line.params } : {}) },
          requested: true,
          ...(then ? { then } : {}),
        },
      ],
    };
  }),
  // MAS-B-030: chuyến mới bắt đầu — sau câu gợi ý cố định của màn
  on('MAS-B-030', 'm02.trip.entered', (event, { state }) =>
    event.kind === 'STARTED' && !state.once['TRIP_START'] ? { timers: { tripStart: MASCOT_TRIP_START_DELAY_MS }, once: ['TRIP_START'] } : null,
  ),
  onTimer('MAS-B-030:show', 'tripStart', ({ state }) =>
    state.view?.mode === 'DOCK'
      ? {
          intents: [
            {
              behaviorId: 'MAS-B-030',
              priority: 6,
              mode: 'DOCK',
              pose: 'wave',
              animation: 'pop',
              message: { id: 'MSG-MAS-030' },
              then: { behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: state.view.pose, animation: 'settle' },
            },
          ],
        }
      : null,
  ),
  // MAS-B-034: mở lại app giữa chuyến sau ≥ 10 phút (không khi đang có thông báo tự kết thúc)
  on('MAS-B-034', 'app.visibility.changed', (event, { state, now }) =>
    event.visible &&
    state.hasSession &&
    state.path === '/trip' &&
    state.view?.mode === 'DOCK' &&
    state.hiddenAt !== null &&
    now - state.hiddenAt >= MASCOT_WELCOME_BACK_MS &&
    !state.blockers.includes('AUTO_END')
      ? {
          intents: [
            {
              behaviorId: 'MAS-B-034',
              priority: 6,
              mode: 'DOCK',
              pose: 'wave',
              animation: 'pop',
              message: { id: 'MSG-MAS-034' },
              then: { behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: state.view.pose, animation: 'settle' },
            },
          ],
        }
      : null,
  ),
  // MAS-B-056 (057 khi Ban Quản lý duyệt): quay về hành trình từ nội dung của lượt ghé mới → nhắc cất máy ngắm rừng
  on('MAS-B-056:back', 'm02.content.backPressed', (event) => (event.afterNewVisit ? { counters: { 'nature:pending': 1 } } : null)),
  on('MAS-B-056', 'm02.trip.shown', (event, { state }) => {
    if (!event.hasSession || !state.counters['nature:pending']) return null;
    const turn = state.counters['nature:turn'] ?? 0;
    const reminders: MessageId[] = ['MSG-MAS-057a', 'MSG-MAS-057b', 'MSG-MAS-057c', 'MSG-MAS-057d', 'MSG-MAS-057e'];
    const id: MessageId = NATURE_REMINDERS_APPROVED && turn % 2 === 1 ? reminders[Math.floor(turn / 2) % reminders.length]! : 'MSG-MAS-056';
    return {
      counters: { 'nature:pending': null, 'nature:turn': turn + 1 },
      intents: [
        {
          behaviorId: 'MAS-B-056',
          priority: 6,
          mode: 'DOCK',
          pose: 'backpack',
          animation: 'pop',
          message: { id },
          then: { behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: event.finalVisited ? 'thumbsUp' : event.k > 0 ? 'map' : 'binoculars', animation: 'settle' },
        },
      ],
    };
  }),
];

export const RULES: readonly Rule[] = [...US1, ...US2, ...US4, ...US8, ...AMBIENT];
