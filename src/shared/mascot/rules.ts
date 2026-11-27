// Bảng luật của Mila: mỗi luật mang ID hành vi `MAS-B-*` của Behavior Matrix (docs/mascot) và dẫn tới BR-MAS của
// spec-Mascot. Luật an toàn (MAS-B-035, 045, 058, 082–084, hộp thoại) nằm trong machine.ts vì không phụ thuộc màn.
import {
  MASCOT_AMBIENT_GESTURE_MS,
  MASCOT_CATALOG_HINT_MS,
  MASCOT_CELEBRATION_MS,
  MASCOT_DIZZY_TAPS,
  MASCOT_DIZZY_WINDOW_MS,
  MASCOT_LOOKUP_SLOW_MS,
  MASCOT_SCANNER_CAMERA_OFF_MS,
  MASCOT_SCANNER_HELP_MS,
  MASCOT_SCANNER_LOOK_MS,
  MASCOT_TAP_DEBOUNCE_MS,
  MASCOT_TRIP_START_DELAY_MS,
  MASCOT_WELCOME_BACK_MS,
  NATURE_REMINDERS_APPROVED,
} from './config';
import { blinkAsset } from './assets';
import { messageText, type MessageId } from './dialogue/catalog';
import type { BilingualName, MascotEvent } from './events';
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
  // khi trang nội dung mount lại từ router state (lùi/tiến, tải lại). v1.6 (D6): điểm cuối được xác nhận như mọi điểm; câu
  // hỏi kết thúc chuyến hiện khi du khách về màn chuyến đi (spec-M02 BR-M02-021 v3.4).
  on('MAS-B-050', 'm02.visit.recorded', (event, { state }) => {
    const once = `VISIT:${event.visitRef}`;
    if (state.once[once]) return null;
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
  on('MAS-B-033', 'm02.trip.shown', (event, { state }) =>
    event.hasSession
      ? {
          // Tiến độ của màn cho câu chạm (MAS-B-036); bộ đếm `screen:` tự xóa khi đổi màn
          counters: { 'screen:k': event.k, 'screen:n': event.n, 'screen:final': event.finalVisited ? 1 : 0 },
          // Vừa quay về sau lượt ghé mới: MAS-B-056 đặt tư thế (ngạc nhiên rồi sải bước) và tự về tư thế này sau đó (DV-05)
          intents: state.counters['nature:pending']
            ? []
            : [{ behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: event.finalVisited ? 'thumbsUp' : event.k > 0 ? 'map' : 'binoculars', animation: 'enter' }],
        }
      : null,
  ),
  // MAS-B-061: "Đi tiếp" ở câu hỏi kết thúc chuyến — v1.6: hộp thoại chỉ ở màn chuyến đi, nên câu luôn ở DOCK trên nút Quét
  // (ô này đăng ký lại ngay khi hộp thoại đóng; câu chờ ô theo hàng đợi slot)
  on('MAS-B-061', 'm02.finalPrompt.continued', () => ({
    intents: [{ behaviorId: 'MAS-B-061', priority: 5, mode: 'DOCK', pose: 'thumbsUp', animation: 'pop', message: { id: 'MSG-MAS-061' } }],
  })),
];

// —— US4: Kết thúc chuyến cùng Mila (US-MAS-08) ——

/** Lời "đã lưu trên máy" chờ sau phần ăn mừng; còn bong bóng thì thử lại sau 1 giây. */
const PENDING_NOTE_DELAY_MS = 4_000;
const PENDING_NOTE_RETRY_MS = 1_000;

/** MAS-B-063: Mila đứng trong thẻ "Hẹn gặp lại" (v1.5, phương án E). Chuyến tự kết thúc (BO_DO) chỉ nghỉ, không mừng. */
const endDock = (status: 'HOAN_TAT' | 'BO_DO'): Intent => ({
  behaviorId: 'MAS-B-063',
  priority: 7,
  mode: 'DOCK',
  // v1.4 (Behavior Matrix §3b): đứng tự hào trong thẻ "Hẹn gặp lại" sau chuyến hoàn tất
  pose: status === 'HOAN_TAT' ? 'proud' : 'rest',
});

const US4: Rule[] = [
  // MAS-B-062 / 064 → 063: vừa bấm Kết thúc trong lần tải trang này → ăn mừng một lần (cấp 3, BR-MAS-23), rồi về hình
  // tĩnh. Quét đủ mọi điểm của hành trình (k = n) → 064 / 063; kết thúc sớm → 062, mừng tích cực như nhau.
  // Mở lại hoặc tải lại màn kết quả: chỉ hình tĩnh (Q12). Đóng bong bóng sớm → về hình tĩnh ngay (đích `then` không lời).
  // v1.5 (DV-92): phần ăn mừng chỉ kéo dài `MASCOT_CELEBRATION_MS`; hết thì Mila về DOCK nhỏ trong thẻ "Hẹn gặp lại",
  // bong bóng ở lại đủ thời gian đọc (`keepBubble`).
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
              status: 'CELEBRATING',
              holdMs: MASCOT_CELEBRATION_MS,
              then: { ...endDock(event.status), animation: 'settle', keepBubble: true },
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

// —— US5: Mila giúp khi quét khó (US-MAS-03) ——
// Hình INLINE cạnh câu camera cố định (MAS-B-038) và cạnh thông báo `INVALID`, `CONNECTION_NEEDED` lần đầu (MAS-B-046, 047)
// do màn đặt bằng `MascotFigure`.

const SCANNER_SLOT = 'scanner-bottom';
/** Minh họa khi mở scanner hiện sau khi camera chạy chừng này (Behavior Matrix MAS-B-040) */
const SCANNER_INTRO_DELAY_MS = 600;
/** Minh họa không lời ở dải dưới (MAS-B-040, 041) hiện chừng này rồi tự ẩn */
const SCANNER_GLANCE_MS = 4_000;
const LOOK_GLANCE_MS = 3_000;
/** Mila "đang kiểm tra" tối đa bằng `LOOKUP_TIMEOUT_SECONDS` của spec-M02 §9 (8 s); kết quả về sớm hơn thì thôi ngay */
const LOOKUP_HOLD_MS = 8_000;
/** Ba mốc chờ của scanner, đếm từ lúc camera chạy hoặc từ lần thao tác cuối (State Machine §6.2; BR-MAS-09) */
const SCANNER_TIMERS: Record<string, number> = {
  scanLook: MASCOT_SCANNER_LOOK_MS,
  scanHelp: MASCOT_SCANNER_HELP_MS,
  scanOff: MASCOT_SCANNER_CAMERA_OFF_MS,
};
const CLEAR_SCANNER_TIMERS = { scanIntro: null, scanLook: null, scanHelp: null, scanOff: null, lookupSlow: null };
/** Mã lỗi ở lại màn, để đếm hai lần liên tiếp giống nhau (BR-MAS-10) */
const FAILURE_CODE = { INVALID: 1, CONNECTION_NEEDED: 2 } as const;

/** Mila về DOCK trên nút Quét với tư thế theo tiến độ (State Machine §3.1; giống MAS-B-033) */
function tripDock(state: RuleView['state'], animation: AnimationId = 'settle'): Intent {
  const k = state.counters['screen:k'] ?? 0;
  const pose: PoseId = state.counters['screen:final'] ? 'thumbsUp' : k > 0 ? 'map' : 'binoculars';
  return { behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose, animation };
}

const onTripWithSession = (state: RuleView['state']) => state.hasSession && state.path === '/trip';

/**
 * Câu nói điểm tiếp theo (MSG-MAS-030, 056 v1.7): chỉ khi có điểm tiếp theo và câu vừa giới hạn bong bóng ở cả hai
 * ngôn ngữ (đổi VI/EN không làm câu biến mất giữa chừng; spec-Mascot §5.6).
 */
function nextStopMessage(id: 'MSG-MAS-030' | 'MSG-MAS-056', next: BilingualName | null): NonNullable<Intent['message']> | null {
  if (!next) return null;
  const params = { next };
  return messageText('vi', id, params) && messageText('en', id, params) ? { id, params } : null;
}

const US5: Rule[] = [
  // MAS-B-040: lần mở đầu trong lần tải trang, chưa có lượt ghé hoặc khách tự do → chờ camera chạy rồi minh họa (v1.2)
  // Lớp scanner che DOCK: bong bóng đang hiện ở DOCK đóng (BR-MAS-20 "đang chờ quét": chỉ mốc chờ và kết quả quét)
  on('MAS-B-040', 'm02.scanner.opened', (event, { state }) => ({
    ...(state.bubble && state.view?.mode === 'DOCK' ? { end: [state.bubble.intent.behaviorId] } : {}),
    ...(!state.once['SCANNER_INTRO'] && (!event.hasSession || event.k === 0) ? { counters: { 'screen:scannerIntro': 1 } } : {}),
  })),
  on('MAS-B-041:armed', 'm02.scanner.cameraStarted', (_event, { state }) => {
    if (!state.counters['screen:scanner'] || state.counters['screen:scannerArmed']) return null;
    return {
      counters: { 'screen:scannerArmed': 1, 'screen:scannerIntro': null },
      timers: { ...SCANNER_TIMERS, ...(state.counters['screen:scannerIntro'] ? { scanIntro: SCANNER_INTRO_DELAY_MS } : {}) },
    };
  }),
  onTimer('MAS-B-040:show', 'scanIntro', () => ({
    intents: [
      { behaviorId: 'MAS-B-040', priority: 6, mode: 'AVATAR', pose: 'point', animation: 'tilt', holdMs: SCANNER_GLANCE_MS, once: 'SCANNER_INTRO', slot: SCANNER_SLOT },
    ],
  })),
  // Thao tác trong lúc quét: các mốc còn chờ đếm lại từ đầu (BR-MAS-09)
  on('MAS-B-041:activity', 'app.user.activity', (_event, { state }) => {
    const pending = Object.keys(SCANNER_TIMERS).filter((name) => state.timers[name] !== undefined);
    return pending.length > 0 ? { timers: Object.fromEntries(pending.map((name) => [name, SCANNER_TIMERS[name]!])) } : null;
  }),
  // MAS-B-041: 15 s → nhìn quanh, không chữ; chỉ khi chuyển động được phép
  onTimer('MAS-B-041', 'scanLook', ({ state }) =>
    state.motion
      ? { intents: [{ behaviorId: 'MAS-B-041', priority: 7, mode: 'AVATAR', pose: 'binoculars', animation: 'look', holdMs: LOOK_GLANCE_MS, source: 'timer', slot: SCANNER_SLOT }] }
      : null,
  ),
  // MAS-B-042: 30 s → hỏi giúp một lần mỗi lần mở
  onTimer('MAS-B-042', 'scanHelp', () => ({
    intents: [{ behaviorId: 'MAS-B-042', priority: 6, mode: 'AVATAR', pose: 'point', animation: 'pop', message: { id: 'MSG-MAS-042' }, source: 'timer', slot: SCANNER_SLOT }],
  })),
  // MAS-B-049: 90 s → gợi ý tắt camera ("Đóng camera" gọi đúng nút đóng của scanner; "Chưa" đóng bong bóng)
  onTimer('MAS-B-049', 'scanOff', () => ({
    intents: [{ behaviorId: 'MAS-B-049', priority: 6, mode: 'AVATAR', pose: 'rest', animation: 'pop', message: { id: 'MSG-MAS-049' }, source: 'timer', slot: SCANNER_SLOT }],
  })),
  // Đóng scanner: hủy các mốc; Mila về DOCK (trừ khi đang kiểm tra mã vừa đọc). Camera lỗi (MAS-B-038): hủy các mốc.
  on('MAS-B-041:closed', 'm02.scanner.closed', (_event, { state }) => ({
    // Hẹn "sóng hơi yếu" (lookupSlow) giữ nguyên: scanner đóng ngay sau khi đọc được mã, lúc tra cứu còn chạy
    timers: { scanIntro: null, scanLook: null, scanHelp: null, scanOff: null },
    counters: { 'screen:scannerArmed': null, 'screen:scannerIntro': null },
    ...(onTripWithSession(state) && state.hold?.status !== 'BUSY' ? { intents: [tripDock(state, 'enter')] } : {}),
  })),
  on('MAS-B-038', 'm02.scanner.cameraFailed', () => ({ timers: { scanIntro: null, scanLook: null, scanHelp: null, scanOff: null } })),
  // MAS-B-043 → 044: đọc được mã → Mila kiểm tra ở DOCK trong lúc tra cứu; quá 3 s → "sóng hơi yếu"
  on('MAS-B-043', 'm02.scanner.detected', (_event, { state }) => ({
    timers: { ...CLEAR_SCANNER_TIMERS, ...(onTripWithSession(state) ? { lookupSlow: MASCOT_LOOKUP_SLOW_MS } : {}) },
    ...(onTripWithSession(state)
      ? {
          intents: [
            { behaviorId: 'MAS-B-043', priority: 5, mode: 'DOCK', pose: 'magnifier', animation: 'search', status: 'BUSY', holdMs: LOOKUP_HOLD_MS, then: tripDock(state) },
          ],
        }
      : {}),
  })),
  onTimer('MAS-B-044', 'lookupSlow', ({ state }) =>
    state.hold?.status === 'BUSY'
      ? {
          intents: [
            {
              behaviorId: 'MAS-B-044',
              priority: 5,
              mode: 'DOCK',
              pose: 'magnifier',
              animation: 'search',
              message: { id: 'MSG-MAS-044' },
              status: 'BUSY',
              holdMs: LOOKUP_HOLD_MS - MASCOT_LOOKUP_SLOW_MS,
              then: tripDock(state),
            },
          ],
        }
      : null,
  ),
  // Kết quả quét ở lại màn: hết "đang kiểm tra"; MAS-B-046 / 048 khi cùng một lỗi lặp lại lần 2 liên tiếp (BR-MAS-10)
  on('MAS-B-046', 'm02.scan.resolved', (event, { state }) => {
    if (state.path !== '/trip') return null;
    const settle = { end: ['MAS-B-043', 'MAS-B-044'], timers: { lookupSlow: null } };
    const code = event.display === 'INVALID' || event.display === 'CONNECTION_NEEDED' ? FAILURE_CODE[event.display] : 0;
    const count = code && state.counters['screen:failCode'] === code ? (state.counters['screen:failCount'] ?? 0) + 1 : code ? 1 : 0;
    const counters = code ? { 'screen:failCode': code, 'screen:failCount': count } : { 'screen:failCode': null, 'screen:failCount': null };
    const back = onTripWithSession(state) ? tripDock(state) : undefined;
    const help: Intent | undefined =
      count === 2
        ? event.display === 'INVALID'
          ? { behaviorId: 'MAS-B-046', priority: 2, mode: 'DOCK', pose: 'confused', animation: 'tilt', message: { id: 'MSG-MAS-046' } }
          : { behaviorId: 'MAS-B-048', priority: 2, mode: 'DOCK', pose: 'point', animation: 'pop', message: { id: 'MSG-MAS-048' } }
        : undefined;
    const intents = [...(help ? [{ ...help, ...(back ? { then: back } : {}) }] : []), ...(back && state.hold?.status === 'BUSY' ? [back] : [])];
    return { ...settle, counters, ...(intents.length ? { intents } : {}) };
  }),
];

// —— US6: Bình tĩnh về mạng và dữ liệu (US-MAS-04) ——
// MAS-B-054 (nội dung từ bản đã tải khi nguồn lỗi): chỉ hình cạnh câu nguồn dự phòng cố định (v1.2), màn tự đặt.

/** Câu mạng nói sau khi trạng thái mạng giữ chừng này (Behavior Matrix MAS-B-074, 075) */
const NETWORK_NOTE_DELAY_MS = 1_000;
/** "Có sóng lại" chỉ khi đã nói "mất sóng" trong khoảng này (MAS-B-075) */
const BACK_ONLINE_WINDOW_MS = 30 * 60_000;

/**
 * Câu mạng chỉ ở màn chuyến đi có phiên, Mila ở DOCK, scanner đóng. Màn đọc nội dung chỉ nhận P0–P2 và câu hỏi giúp
 * (BR-MAS-20 "đang đọc"), nên không nói ở SCR-M02-002 dù Behavior Matrix liệt kê.
 */
const networkNoteAllowed = (state: RuleView['state']) => onTripWithSession(state) && state.view?.mode === 'DOCK' && !state.counters['screen:scanner'];

const US6: Rule[] = [
  on('MAS-B-074', 'app.network.changed', (event, { state, now }) => {
    if (!event.online) return networkNoteAllowed(state) ? { timers: { offlineNote: NETWORK_NOTE_DELAY_MS, onlineNote: null } } : null;
    const said = state.lastShownAt['MSG-MAS-074'];
    const recent = said !== undefined && now - said <= BACK_ONLINE_WINDOW_MS;
    return { timers: { offlineNote: null, ...(recent && networkNoteAllowed(state) ? { onlineNote: NETWORK_NOTE_DELAY_MS } : {}) } };
  }),
  // MAS-B-074: mất sóng giữa chuyến → trấn an một lần mỗi cooldown (10 phút, MESSAGE_META)
  onTimer('MAS-B-074:show', 'offlineNote', ({ state }) =>
    !state.online && networkNoteAllowed(state)
      ? { intents: [{ behaviorId: 'MAS-B-074', priority: 5, mode: 'DOCK', pose: 'backpack', animation: 'pop', message: { id: 'MSG-MAS-074' }, then: tripDock(state) }] }
      : null,
  ),
  // MAS-B-075: có sóng lại (không nói gì về đồng bộ)
  onTimer('MAS-B-075:show', 'onlineNote', ({ state }) =>
    state.online && networkNoteAllowed(state)
      ? { intents: [{ behaviorId: 'MAS-B-075', priority: 7, mode: 'DOCK', pose: 'thumbsUp', animation: 'pop', message: { id: 'MSG-MAS-075' }, then: tripDock(state) }] }
      : null,
  ),
  // MAS-B-052: có phiên, mã live không thuộc hành trình, không lượt ghé → nói rõ không tính vào hành trình (P2)
  on('MAS-B-052', 'm02.scan.resolved', (event) =>
    event.display === 'LIVE' && event.hasSession && !event.visitCreated && !event.inJourney
      ? { intents: [{ behaviorId: 'MAS-B-052', priority: 2, mode: 'AVATAR', pose: 'think', animation: 'pop', message: { id: 'MSG-MAS-052' } }] }
      : null,
  ),
];

// —— US7: Chuẩn bị cùng Mila (US-MAS-07) ——
// Hình minh họa INLINE (MAS-B-006, 007, 012, 013, 015, 016, 022, 023, 024, 025) do màn đặt bằng `MascotFigure` cạnh câu
// cố định; các luật dưới đây chỉ cho những dòng có lời.

/** Mila nói xong thì về tư thế bản đồ ở hero danh mục */
const CATALOG_SETTLE: Intent = { ...CATALOG_DOCK, animation: 'settle' };

/** MAS-B-088 (v1.5): Mila đứng cạnh tiêu đề màn Gợi ý tuyến (form, và trang kết quả khi có tuyến phù hợp). */
const RECOMMEND_DOCK: Intent = { behaviorId: 'MAS-B-088', priority: 7, mode: 'DOCK', pose: 'map' };
const RECOMMEND_SETTLE: Intent = { ...RECOMMEND_DOCK, animation: 'settle' };
const PACKAGE_SLOT = 'package-panel';
const START_SLOT = 'start-panel';
const SAFETY_TIMER = 'safety:';

const US7: Rule[] = [
  // MAS-B-005: danh mục còn tải sau 600 ms (màn phát `slow`) → câu chờ, không tự ẩn; tải xong hay lỗi → câu đóng
  on('MAS-B-005', 'm01.catalog.loaded', (event) =>
    event.status === 'loading'
      ? event.slow
        ? { intents: [{ behaviorId: 'MAS-B-005', priority: 7, mode: 'DOCK', pose: 'map', animation: 'search', message: { id: 'MSG-MAS-005' } }] }
        : null
      : { end: ['MAS-B-005'] },
  ),
  // MAS-B-008: 20 s không thao tác trên danh mục, một lần mỗi lần tải trang, chỉ khi chưa cuộn hay mở tuyến (§5.4, BR-MAS-09)
  on('MAS-B-008', 'm01.catalog.loaded', (event, { state }) =>
    event.status === 'ready' && !state.once['CATALOG_HINT'] && !state.counters['catalog:interacted'] ? { timers: { catalogHint: MASCOT_CATALOG_HINT_MS } } : null,
  ),
  // Chạm, phím: đếm lại từ đầu. Cuộn (màn phát `interacted`) hay mở một tuyến: thôi gợi ý; đang gợi ý thì bong bóng đóng.
  on('MAS-B-008:activity', 'app.user.activity', (_event, { state }) =>
    state.timers['catalogHint'] !== undefined ? { timers: { catalogHint: MASCOT_CATALOG_HINT_MS } } : null,
  ),
  on('MAS-B-008:scrolled', 'm01.catalog.interacted', () => ({ counters: { 'catalog:interacted': 1 }, timers: { catalogHint: null }, end: ['MAS-B-008'] })),
  on('MAS-B-008:opened', 'app.route.changed', (event) => (event.path.startsWith('/routes/') ? { counters: { 'catalog:interacted': 1 } } : null)),
  onTimer('MAS-B-008:show', 'catalogHint', ({ state }) => {
    if (state.path !== '/') return null;
    // Lớp phủ giới thiệu hay câu khác đang hiện: chờ thêm một lượt
    if (state.bubble || state.view?.mode === 'INTRO') return { timers: { catalogHint: MASCOT_CATALOG_HINT_MS } };
    return {
      intents: [
        {
          behaviorId: 'MAS-B-008',
          priority: 6,
          mode: 'DOCK',
          pose: 'point',
          animation: 'pop',
          message: { id: 'MSG-MAS-008' },
          once: 'CATALOG_HINT',
          source: 'timer',
          then: CATALOG_SETTLE,
        },
      ],
    };
  }),
  // MAS-B-088 + MAS-B-010 (v1.5): Mila đứng cạnh tiêu đề Gợi ý tuyến (DOCK) và mỗi lần mở form đều nói câu gợi ý sau
  // 400 ms; câu này không cooldown, không tính vào giới hạn câu chủ động (BR-MAS-07)
  on('MAS-B-010', 'm01.recommend.opened', () => ({ intents: [{ ...RECOMMEND_DOCK, animation: 'enter' }], timers: { recommendHint: 400 } })),
  onTimer('MAS-B-010:show', 'recommendHint', () => ({
    intents: [
      { behaviorId: 'MAS-B-010', priority: 6, mode: 'DOCK', pose: 'map', animation: 'pop', message: { id: 'MSG-MAS-010' }, everyVisit: true, then: RECOMMEND_SETTLE },
    ],
  })),
  // MAS-B-011: có kết quả gợi ý → Mila đứng cạnh tiêu đề kết quả (v1.5). Không có kết quả (MAS-B-012, 013): chỉ hình
  // cạnh câu cố định (v1.2), màn tự đặt; không DOCK để trên màn chỉ có một Mila (OD-MAS-22).
  on('MAS-B-011', 'm01.recommend.resolved', (event) =>
    event.count >= 1
      ? { intents: [{ behaviorId: 'MAS-B-011', priority: 4, mode: 'DOCK', pose: 'thumbsUp', animation: 'hop', message: { id: 'MSG-MAS-011' }, then: RECOMMEND_SETTLE }] }
      : null,
  ),
  // MAS-B-014: panel Bắt đầu hiện, tuyến có Cảnh báo an toàn → sau 500 ms nhắc đọc; v1.6 (D3): mỗi lần vào màn chi tiết,
  // không cooldown, không tính vào giới hạn câu chủ động. Mila ở slot của panel Bắt đầu, không bao giờ trong khối cảnh báo.
  // `screen:safety` cho câu chạm của màn (MAS-B-090) biết tuyến có cảnh báo.
  on('MAS-B-014', 'm01.routeDetail.startPanelVisible', (event) =>
    event.hasSafetyWarning ? { counters: { 'screen:safety': 1 }, timers: { [`${SAFETY_TIMER}${event.routeRef}`]: 500 } } : null,
  ),
  on('MAS-B-014:show', 'mascot.timer', (event) => {
    if (!event.name.startsWith(SAFETY_TIMER)) return null;
    return {
      intents: [
        {
          behaviorId: 'MAS-B-014',
          priority: 6,
          mode: 'AVATAR',
          pose: 'point',
          animation: 'pop',
          message: { id: 'MSG-MAS-014' },
          everyVisit: true,
          slot: START_SLOT,
        },
      ],
    };
  }),
  // MAS-B-020: bắt đầu tải gói → Mila xếp ba lô ở slot gói, câu ở lại tới khi có kết quả (không phần trăm)
  on('MAS-B-020', 'm01.package.downloadStarted', () => ({
    intents: [{ behaviorId: 'MAS-B-020', priority: 5, mode: 'AVATAR', pose: 'backpack', animation: 'pack', message: { id: 'MSG-MAS-020' }, slot: PACKAGE_SLOT }],
  })),
  // MAS-B-021: gói sẵn sàng. MAS-B-022, 024, 025: lỗi → chỉ hình cạnh câu lỗi cố định (v1.2). MAS-B-026: lỗi lần 2 liên tiếp
  // cùng tuyến khi tải mới và có mạng → câu trấn an.
  on('MAS-B-021', 'm01.package.resolved', (event, { state }) => {
    const failures = `package:failed:${event.routeRef}`;
    const end = ['MAS-B-020'];
    if (event.kind === 'ready') {
      return {
        end,
        counters: { [failures]: null },
        intents: [{ behaviorId: 'MAS-B-021', priority: 4, mode: 'AVATAR', pose: 'thumbsUp', animation: 'hop', message: { id: 'MSG-MAS-021' }, slot: PACKAGE_SLOT }],
      };
    }
    if (event.kind !== 'failed') return { end };
    const count = (state.counters[failures] ?? 0) + 1;
    const again = count >= 2 && !event.update && event.online;
    return {
      end,
      counters: { [failures]: count },
      ...(again
        ? { intents: [{ behaviorId: 'MAS-B-026', priority: 2, mode: 'AVATAR', pose: 'backpack', animation: 'pop', message: { id: 'MSG-MAS-026' }, slot: PACKAGE_SLOT }] }
        : {}),
    } satisfies RuleResult;
  }),
];

// —— v1.1: cử chỉ tự động (MAS-B-086, BR-MAS-21; research R-18) ——

type Gesture = { id: string; pose?: PoseId; animation: AnimationId };

/** Nhóm cử chỉ ngắn (Asset spec AN-AMBIENT). Cử chỉ đổi tư thế quay về tư thế ngữ cảnh khi hết. */
const GESTURES: readonly Gesture[] = [
  // v1.5 (BR-MAS-21): mỗi cử chỉ 2–3 nhịp, ≤ MASCOT_AMBIENT_GESTURE_MS
  { id: 'look', pose: 'binoculars', animation: 'gestureTilt' },
  { id: 'wave', pose: 'wave', animation: 'gestureWave' },
  { id: 'hop', animation: 'gestureHop' },
  { id: 'tilt', animation: 'gestureTilt' },
  { id: 'pack', pose: 'backpack', animation: 'gestureHop' },
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

type HelpLine = { behaviorId: string; id: MessageId; pose: PoseId; params?: { r: number }; slot?: string };

/** Câu hướng dẫn của màn đang mở, theo tình huống (spec-Mascot BR-MAS-12 v1.1). */
function helpLines(state: RuleView['state']): HelpLine[] {
  const path = state.path;
  if (path === '/trip') {
    if (state.counters['screen:scanner']) return [{ behaviorId: 'MAS-B-037', id: 'MSG-MAS-043', pose: 'binoculars' }];
    const k = state.counters['screen:k'] ?? 0;
    const n = state.counters['screen:n'] ?? 0;
    // v1.7: câu 033 không còn số điểm (thẻ tuyến đã hiện)
    if (k > 0 && n - k >= 1 && !state.counters['screen:final']) return [{ behaviorId: 'MAS-B-036', id: 'MSG-MAS-033', pose: 'map' }];
    return [{ behaviorId: 'MAS-B-032', id: 'MSG-MAS-032', pose: 'point' }];
  }
  if (path === '/trip/end') return [{ behaviorId: 'MAS-B-065', id: 'MSG-MAS-065', pose: 'thumbsUp' }];
  if (path.startsWith('/trip/qr/') || path.startsWith('/q/')) return [{ behaviorId: 'MAS-B-059', id: 'MSG-MAS-059', pose: 'point' }];
  // v1.6 (CHG-MASCOT-2026-11-25-06 D2): mỗi màn M01 có câu của chính nó (MAS-B-090); câu ở chỗ Mila của màn
  if (path === '/recommend') {
    return [
      { behaviorId: 'MAS-B-090', id: 'MSG-MAS-010', pose: 'map' },
      { behaviorId: 'MAS-B-090', id: 'MSG-MAS-015', pose: 'point' },
    ];
  }
  if (path === '/recommend/results') return [{ behaviorId: 'MAS-B-090', id: 'MSG-MAS-016', pose: 'point' }];
  if (path.startsWith('/routes/')) {
    // Chi tiết tuyến: Mila ở panel Bắt đầu, không bao giờ trong khối Cảnh báo an toàn hay ô Gói tải trước
    const id = state.counters['screen:safety'] ? 'MSG-MAS-017' : 'MSG-MAS-019';
    return [{ behaviorId: 'MAS-B-090', id, pose: 'point', slot: START_SLOT }];
  }
  if (path === '/offline') return [{ behaviorId: 'MAS-B-090', id: 'MSG-MAS-018', pose: 'backpack', slot: PACKAGE_SLOT }];
  // Danh mục tuyến
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

/** Mila ngạc nhiên trong lúc điểm vừa ghé được mở khóa (≈ nảy + vẽ đường mòn của specs/006 US2) rồi mới nói 056 */
const UNLOCK_AMAZED_MS = 900;

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
          ...(line.slot ? { slot: line.slot } : {}),
          ...(then ? { then } : {}),
        },
      ],
    };
  }),
  // MAS-B-030: chuyến mới bắt đầu — sau câu gợi ý cố định của màn
  on('MAS-B-030', 'm02.trip.entered', (event, { state }) =>
    event.kind === 'STARTED' && !state.once['TRIP_START'] ? { timers: { tripStart: MASCOT_TRIP_START_DELAY_MS }, once: ['TRIP_START'] } : null,
  ),
  onTimer('MAS-B-030:show', 'tripStart', ({ state }) => {
    // v1.7: câu nói điểm tiếp theo; không có điểm tiếp theo (hành trình rỗng) thì không nói
    const message = nextStopMessage('MSG-MAS-030', state.tripNext);
    // Du khách đã mở scanner (đúng điều câu này gợi ý): không nói sau lớp scanner
    return message && state.view?.mode === 'DOCK' && !state.counters['screen:scanner']
      ? {
          intents: [
            {
              behaviorId: 'MAS-B-030',
              priority: 6,
              mode: 'DOCK',
              pose: 'wave',
              animation: 'pop',
              message,
              then: { behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: state.view.pose, animation: 'settle' },
            },
          ],
        }
      : null;
  }),
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
    const reminder = NATURE_REMINDERS_APPROVED && turn % 2 === 1 ? reminders[Math.floor(turn / 2) % reminders.length]! : null;
    // v1.7: câu 056 nói điểm tiếp theo; không có điểm tiếp theo thì lượt này không có bong bóng (BR-MAS-13)
    const message = reminder ? { id: reminder } : nextStopMessage('MSG-MAS-056', event.next ?? null);
    const settle: Intent = { behaviorId: 'MAS-B-033', priority: 7, mode: 'DOCK', pose: event.finalVisited ? 'thumbsUp' : event.k > 0 ? 'map' : 'binoculars', animation: 'settle' };
    const speak: Intent | null = message && {
      behaviorId: 'MAS-B-056',
      priority: 6,
      mode: 'DOCK',
      // v1.4 (Behavior Matrix §3b): Mila sải bước "đi tham quan thôi"
      pose: 'walk',
      animation: 'walk',
      message,
      then: settle,
    };
    return {
      counters: { 'nature:pending': null, 'nature:turn': turn + 1 },
      // DV-05 (chủ dự án chọn 2026-11-24): trong lúc điểm vừa ghé được mở khóa trên hành trình, Mila ngạc nhiên thích thú
      // (`amazed`, không lời) rồi mới sải bước và nói 056
      intents: [{ behaviorId: 'MAS-B-056', priority: 6, mode: 'DOCK', pose: 'amazed', animation: 'pop', holdMs: UNLOCK_AMAZED_MS, then: speak ?? settle }],
    };
  }),
];

export const RULES: readonly Rule[] = [...US1, ...US2, ...US4, ...US5, ...US6, ...US7, ...US8, ...AMBIENT];
