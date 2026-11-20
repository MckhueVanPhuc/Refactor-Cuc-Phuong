// Trọng tài ưu tiên của Mila (specs/005 tasks T008; spec-Mascot BR-MAS-05…08; MAS-TC-002…006, 011).
import { describe, expect, it } from 'vitest';
import type { MascotEvent } from './events';
import { initialState, step, type MascotState, type Rule } from './machine';
import { CTX, rule, say } from './testing';

type Stamped = MascotEvent & { at: number };

function run(events: Stamped[], rules: Rule[], ctx = CTX, start: MascotState = initialState()) {
  const effects: unknown[] = [];
  const state = events.reduce((current, event) => {
    const result = step(current, event, ctx, rules);
    effects.push(...result.effects);
    return result.state;
  }, start);
  return { state, effects };
}

// Ba nguồn sự kiện riêng để mỗi luật phát một câu
const P6 = rule('m02.scanner.opened', say({ priority: 6, message: { id: 'MSG-MAS-030' } }));
const P6b = rule('m02.scanner.closed', say({ priority: 6, message: { id: 'MSG-MAS-032' } }));
const P2 = rule('m02.scanner.detected', say({ priority: 2, message: { id: 'MSG-MAS-046' } }));
const P4 = rule('m02.scanner.cameraStarted', say({ priority: 4, message: { id: 'MSG-MAS-051' } }));
const P4b = rule('m02.scanner.cameraFailed', say({ priority: 4, message: { id: 'MSG-MAS-062', params: { k: 2 } } }));
const opened = (at: number): Stamped => ({ type: 'm02.scanner.opened', hasSession: true, k: 0, at });

describe('ưu tiên và hàng đợi', () => {
  it('P cao ngắt P thấp ngay', () => {
    const { state } = run([opened(0), { type: 'm02.scanner.detected', at: 100 }], [P6, P2]);
    expect(state.bubble?.messageId).toBe('MSG-MAS-046');
  });

  it('P thấp hơn đang nói P cao: câu P4 chờ, câu P5–P7 bị bỏ', () => {
    const { state } = run([{ type: 'm02.scanner.detected', at: 0 }, { type: 'm02.scanner.cameraStarted', at: 100 }], [P2, P4]);
    expect(state.bubble?.messageId).toBe('MSG-MAS-046');
    expect(state.queued?.intent.message?.id).toBe('MSG-MAS-051');
    const dropped = run([{ type: 'm02.scanner.detected', at: 0 }, opened(100)], [P2, P6]).state;
    expect(dropped.queued).toBeNull();
  });

  it('cùng mức: câu cũ chưa đủ 1,5 s thì câu mới chờ; đủ thì thay', () => {
    const early = run([{ type: 'm02.scanner.cameraStarted', at: 0 }, { type: 'm02.scanner.cameraFailed', at: 1_000 }], [P4, P4b]).state;
    expect(early.bubble?.messageId).toBe('MSG-MAS-051');
    expect(early.queued?.intent.message?.id).toBe('MSG-MAS-062');
    const late = run([{ type: 'm02.scanner.cameraStarted', at: 0 }, { type: 'm02.scanner.cameraFailed', at: 1_600 }], [P4, P4b]).state;
    expect(late.bubble?.messageId).toBe('MSG-MAS-062');
  });

  it('câu chờ hiện khi câu trước hết, nếu chưa quá 4 giây', () => {
    const { state } = run([{ type: 'm02.scanner.cameraStarted', at: 0 }, { type: 'm02.scanner.cameraFailed', at: 1_000 }], [P4, P4b]);
    const shown = step(state, { type: 'mascot.user.closedBubble', at: 3_000 }, CTX, [P4, P4b]).state;
    expect(shown.bubble?.messageId).toBe('MSG-MAS-062');
    const expired = step(state, { type: 'mascot.user.closedBubble', at: 5_100 }, CTX, [P4, P4b]).state;
    expect(expired).toMatchObject({ bubble: null, queued: null });
  });
});

describe('lặp lại', () => {
  it('cùng câu trong cooldown bị bỏ (MSG-MAS-032: 10 s)', () => {
    const rules = [P6b];
    const first = run([{ type: 'm02.scanner.closed', at: 0 }, { type: 'mascot.user.closedBubble', at: 100 }], rules).state;
    const again = step(first, { type: 'm02.scanner.closed', at: 5_000 }, CTX, rules).state;
    expect(again.bubble).toBeNull();
    const later = step(first, { type: 'm02.scanner.closed', at: 10_100 }, CTX, rules).state;
    expect(later.bubble?.messageId).toBe('MSG-MAS-032');
  });

  it('sự kiện giống hệt trong 500 ms chỉ xử lý một lần', () => {
    let calls = 0;
    const counting = rule('m02.scanner.closed', () => {
      calls += 1;
      return null;
    });
    run([{ type: 'm02.scanner.closed', at: 0 }, { type: 'm02.scanner.closed', at: 300 }, { type: 'm02.scanner.closed', at: 900 }], [counting]);
    expect(calls).toBe(2);
  });

  it('khóa `once` chặn câu thứ hai cùng khóa', () => {
    const once = rule('m02.scanner.closed', say({ priority: 4, message: { id: 'MSG-MAS-051' }, once: 'FIRST_VISIT:s1' }));
    const first = run([{ type: 'm02.scanner.closed', at: 0 }, { type: 'mascot.user.closedBubble', at: 10 }], [once]).state;
    const again = step(first, { type: 'm02.scanner.closed', at: 2_000 }, CTX, [once]).state;
    expect(again.bubble).toBeNull();
  });

  it('tối đa 3 câu chủ động (P5–P7) trong 10 phút (BR-MAS-07)', () => {
    // Bốn câu khác nhau (mỗi câu có cooldown riêng), phát cách nhau 1 phút
    const ids = ['MSG-MAS-056', 'MSG-MAS-057a', 'MSG-MAS-057b', 'MSG-MAS-057c'] as const;
    const each = ids.map((id, i) => rule('m02.scanner.opened', (event) => (event.type === 'm02.scanner.opened' && event.k === i ? say({ priority: 6, message: { id } }) : null)));
    let state = initialState();
    ids.forEach((_, i) => {
      state = step(state, { type: 'm02.scanner.opened', hasSession: true, k: i, at: i * 60_000 }, CTX, each).state;
      state = step(state, { type: 'mascot.user.closedBubble', at: i * 60_000 + 10 }, CTX, each).state;
    });
    expect(state.proactiveLog).toHaveLength(3);
    expect(state.lastShownAt['MSG-MAS-057c']).toBeUndefined();
  });
});

describe('ngữ cảnh và hiệu ứng', () => {
  it('rung chỉ khi ý định yêu cầu và không giảm chuyển động (BR-MAS-19)', () => {
    const vibrate = rule('m02.scanner.cameraStarted', say({ priority: 4, message: { id: 'MSG-MAS-051' }, vibrate: true }));
    expect(run([{ type: 'm02.scanner.cameraStarted', at: 0 }], [vibrate]).effects).toEqual([{ kind: 'vibrate', ms: 30 }]);
    expect(run([{ type: 'm02.scanner.cameraStarted', at: 0 }], [vibrate], { ...CTX, reducedMotion: true }).effects).toEqual([]);
  });

  it('trang ẩn: chỉ P0 có hiệu lực', () => {
    const { state } = run([{ type: 'app.visibility.changed', visible: false, at: 0 }, { type: 'm02.scanner.detected', at: 600 }], [P2]);
    expect(state.bubble).toBeNull();
  });
});
