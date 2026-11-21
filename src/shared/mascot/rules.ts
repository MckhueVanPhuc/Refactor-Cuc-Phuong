// Bảng luật của Mila: mỗi luật mang ID hành vi `MAS-B-*` của Behavior Matrix (docs/mascot) và dẫn tới BR-MAS của
// spec-Mascot. Luật an toàn (MAS-B-035, 045, 058, 082–084, hộp thoại) nằm trong machine.ts vì không phụ thuộc màn.
import type { MascotEvent } from './events';
import type { Intent, Rule, RuleResult, RuleView } from './types';

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
    intents: [{ behaviorId: 'MAS-B-004', priority: 6, mode: 'DOCK', pose: 'wave', animation: 'pop', message: { id: 'MSG-MAS-004' }, once: 'WELCOME_BACK' }],
  })),
];

export const RULES: readonly Rule[] = [...US1];
