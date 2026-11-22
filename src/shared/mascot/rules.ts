// Bảng luật của Mila: mỗi luật mang ID hành vi `MAS-B-*` của Behavior Matrix (docs/mascot) và dẫn tới BR-MAS của
// spec-Mascot. Luật an toàn (MAS-B-035, 045, 058, 082–084, hộp thoại) nằm trong machine.ts vì không phụ thuộc màn.
import { MASCOT_AMBIENT_GESTURE_MS, MASCOT_VIBRATION_MS } from './config';
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

/** MAS-B-001 → MAS-B-002 → MAS-B-003: hai câu giới thiệu rồi thu về DOCK. */
const INTRO: Intent = {
  behaviorId: 'MAS-B-001',
  priority: 6,
  mode: 'INTRO',
  pose: 'wave',
  animation: 'intro',
  message: { id: 'MSG-MAS-001' },
  once: 'INTRO',
  then: { behaviorId: 'MAS-B-002', priority: 6, mode: 'INTRO', pose: 'map', animation: 'pop', message: { id: 'MSG-MAS-002' }, then: CATALOG_DOCK },
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
  // MAS-B-050, 051, 055: lượt ghé được ghi lần đầu. Mỗi lượt ghé chỉ một phản ứng (VISIT:<visitRef>), kể cả khi trang
  // nội dung mount lại từ router state (lùi/tiến, tải lại). Điểm cuối: hộp thoại cuối chuyến hiện ngay, Mila chỉ rung.
  on('MAS-B-050', 'm02.visit.recorded', (event, { state }) => {
    const once = `VISIT:${event.visitRef}`;
    if (state.once[once]) return null;
    if (event.isFinal) return { once: [once], effects: [{ kind: 'vibrate', ms: MASCOT_VIBRATION_MS }] };
    const base = { priority: 4, mode: 'AVATAR', pose: 'cheer', animation: 'hop', vibrate: true, once } as const;
    if (event.k === 1) return { intents: [{ ...base, behaviorId: 'MAS-B-051', message: { id: 'MSG-MAS-051' } }] };
    if (event.n >= 4 && event.k === Math.ceil(event.n / 2)) {
      return { intents: [{ ...base, behaviorId: 'MAS-B-055', priority: 5, message: { id: 'MSG-MAS-055' } }] };
    }
    const cheer = state.counters['cheer'] ?? 0;
    return {
      counters: { cheer: cheer + 1 },
      intents: [{ ...base, behaviorId: 'MAS-B-050', pose: 'thumbsUp', message: { id: 'MSG-MAS-050', params: { k: event.k, n: event.n, cheer } } }],
    };
  }),
  // MAS-B-033: DOCK trên màn chuyến đi, tư thế theo tiến độ (State Machine §3.1)
  on('MAS-B-033', 'm02.trip.shown', (event) =>
    event.hasSession
      ? { intents: [{ behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: event.finalVisited ? 'thumbsUp' : event.k > 0 ? 'map' : 'binoculars', animation: 'enter' }] }
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
  // MAS-B-062 → 063: vừa bấm Kết thúc trong lần tải trang này → ăn mừng một lần với số điểm đã quét, rồi về hình tĩnh.
  // Mở lại hoặc tải lại màn kết quả: chỉ hình tĩnh (Q12). Đóng bong bóng sớm → về hình tĩnh ngay (đích `then` không lời).
  on('MAS-B-062', 'm02.trip.ended', (event) =>
    event.justEnded && event.status === 'HOAN_TAT'
      ? {
          intents: [
            {
              behaviorId: 'MAS-B-062',
              priority: 4,
              mode: 'CELEBRATE',
              pose: 'cheer',
              animation: 'celebrate',
              message: { id: 'MSG-MAS-062', params: { k: event.k } },
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
];

const AMBIENT: Rule[] = [
  // Lịch do máy trạng thái đặt khi Mila đứng chờ; tới hạn thì chọn một cử chỉ khác cử chỉ trước, không có chữ (P7, không
  // tính vào giới hạn câu chủ động vì không có lời)
  onTimer('MAS-B-086', 'ambient', ({ state, ctx }) => {
    const view = state.view;
    if (!view || view.mode !== 'DOCK' || state.bubble || state.hold) return null;
    const random = ctx.random ?? Math.random;
    const last = state.counters['ambient:last'];
    const choices = GESTURES.map((_, index) => index).filter((index) => index !== last);
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
          holdMs: MASCOT_AMBIENT_GESTURE_MS,
          then: { behaviorId: view.behaviorId, priority: 7, mode: 'DOCK', pose: view.pose, animation: 'settle' },
        },
      ],
    };
  }),
];

export const RULES: readonly Rule[] = [...US1, ...US2, ...US4, ...AMBIENT];
