// Máy trạng thái thuần của Mila (specs/005 tasks T010; State Machine §7; MAS-TC-012).
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MascotEvent } from './events';
import { initialState, nextDeadline, readingTimeMs, step, type MascotState, type Rule } from './machine';
import { CTX, rule, say } from './testing';

afterEach(() => {
  vi.restoreAllMocks();
});

function run(events: Array<MascotEvent & { at: number }>, rules: Rule[], ctx = CTX, start: MascotState = initialState()) {
  return events.reduce((state, event) => step(state, event, ctx, rules).state, start);
}

describe('step — chuyển trạng thái nền', () => {
  it('ban đầu HIDDEN, không có gì hiển thị', () => {
    expect(initialState()).toMatchObject({ status: 'HIDDEN', view: null, bubble: null });
  });

  it('T1/T4: sự kiện có luật → hiện ở mode của slot; có câu thì SPEAKING', () => {
    const rules = [rule('m02.scanner.detected', say({ mode: 'DOCK', pose: 'magnifier', message: { id: 'MSG-MAS-030' } }))];
    const state = run([{ type: 'm02.scanner.detected', at: 1_000 }], rules);
    expect(state.status).toBe('SPEAKING');
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'magnifier' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-030', shownAt: 1_000 });
  });

  it('T5: bong bóng tự ẩn sau thời gian đọc; DOCK ở lại, AVATAR rời', () => {
    const dock = [rule('m02.scanner.detected', say({ mode: 'DOCK', message: { id: 'MSG-MAS-030' } }))];
    const shown = run([{ type: 'm02.scanner.detected', at: 0 }], dock);
    const due = nextDeadline(shown)!;
    expect(due).toBe(shown.bubble!.expiresAt);
    const after = step(shown, { type: 'mascot.tick', at: due }, CTX, dock).state;
    expect(after).toMatchObject({ status: 'IDLE', bubble: null, view: { mode: 'DOCK' } });

    const avatar = [rule('m02.scanner.detected', say({ mode: 'AVATAR', message: { id: 'MSG-MAS-030' } }))];
    const shownAvatar = run([{ type: 'm02.scanner.detected', at: 0 }], avatar);
    const gone = step(shownAvatar, { type: 'mascot.tick', at: nextDeadline(shownAvatar)! }, CTX, avatar).state;
    expect(gone).toMatchObject({ status: 'HIDDEN', view: null, bubble: null });
  });

  it('thời gian đọc: 3–7 giây theo độ dài (spec-Mascot §5.4)', () => {
    expect(readingTimeMs('ngắn')).toBe(3_000);
    expect(readingTimeMs('x'.repeat(60))).toBe(3_900);
    expect(readingTimeMs('x'.repeat(200))).toBe(7_000);
  });

  it('T9: thông báo tạm đóng → SUPPRESSED, xóa hàng đợi; câu sau bị bỏ tới khi đổi màn', () => {
    const rules = [
      rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-030' } })),
      rule('m02.scanner.closed', say({ priority: 4, message: { id: 'MSG-MAS-050', params: { k: 1, n: 2 } } })),
    ];
    const suppressed = run(
      [
        { type: 'm02.scanner.detected', at: 0 },
        { type: 'm02.notice.closedShown', at: 100 },
        { type: 'm02.scanner.closed', at: 200 },
      ],
      rules,
    );
    expect(suppressed).toMatchObject({ status: 'SUPPRESSED', view: null, bubble: null, queued: null });
    const next = run([{ type: 'app.route.changed', path: '/trip', at: 300 }, { type: 'm02.scanner.closed', at: 800 }], rules, CTX, suppressed);
    expect(next.status).toBe('SPEAKING');
  });

  it('kết quả quét CLOSED cũng làm Mila rời màn (BR-MAS-03)', () => {
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-030' } }))];
    const state = run(
      [
        { type: 'm02.scanner.detected', at: 0 },
        { type: 'm02.scan.resolved', display: 'CLOSED', hasSession: true, freeVisitor: false, visitCreated: false, inJourney: true, finalPromptNeeded: false, at: 10 },
      ],
      rules,
    );
    expect(state).toMatchObject({ status: 'SUPPRESSED', view: null, bubble: null });
  });

  it('T10: dialog khác, media, trang ẩn → bỏ câu (trừ P0–P1); dialog cuối chuyến không chặn', () => {
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-030' } }))];
    for (const blocker of [
      { type: 'app.dialog.changed', open: true, kind: 'OTHER' } as const,
      { type: 'm02.media.playing', mediaType: 'AUDIO' } as const,
      { type: 'app.visibility.changed', visible: false } as const,
      { type: 'm02.notice.autoEndShown' } as const,
    ]) {
      const state = run([{ ...blocker, at: 0 }, { type: 'm02.scanner.detected', at: 600 }], rules);
      expect(state.bubble, blocker.type).toBeNull();
    }
    const finalPrompt = run([{ type: 'app.dialog.changed', open: true, kind: 'FINAL_PROMPT', at: 0 }, { type: 'm02.scanner.detected', at: 600 }], rules);
    expect(finalPrompt.bubble).not.toBeNull();
  });

  it('mở dialog khác hoặc ẩn trang khi đang nói → bỏ bong bóng', () => {
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-030' } }))];
    const state = run([{ type: 'm02.scanner.detected', at: 0 }, { type: 'app.dialog.changed', open: true, kind: 'OTHER', at: 50 }], rules);
    expect(state.bubble).toBeNull();
  });

  it('đổi màn: hủy bong bóng P6, hẹn giờ, khung; giữ P4 vừa phát để màn mới hiện', () => {
    const rules = [
      rule('m02.scanner.detected', { intents: [{ behaviorId: 'T', priority: 6, mode: 'DOCK', pose: 'map', message: { id: 'MSG-MAS-030' } }], timers: { idle: 15_000 } }),
      rule('m02.scanner.closed', say({ priority: 4, mode: 'AVATAR', message: { id: 'MSG-MAS-051' } })),
    ];
    const p6 = run([{ type: 'm02.scanner.detected', at: 0 }, { type: 'app.route.changed', path: '/', at: 500 }], rules);
    expect(p6).toMatchObject({ bubble: null, view: null, timers: {} });

    const p4 = run([{ type: 'm02.scanner.closed', at: 0 }, { type: 'app.route.changed', path: '/trip/qr/Q1', at: 300 }], rules);
    expect(p4.bubble).toBeNull();
    expect(p4.queued?.intent.message?.id).toBe('MSG-MAS-051');
    const shown = step(p4, { type: 'mascot.slots.changed', at: 400 }, CTX, rules).state;
    expect(shown.bubble?.messageId).toBe('MSG-MAS-051');
  });

  it('không có slot cho mode: P6 bị bỏ; P4 chờ tối đa 4 giây (BR-MAS-05)', () => {
    const noSlot = { ...CTX, availableModes: [] as const };
    const rules = [
      rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-030' } })),
      rule('m02.scanner.closed', say({ priority: 4, message: { id: 'MSG-MAS-051' } })),
    ];
    const p6 = step(initialState(), { type: 'm02.scanner.detected', at: 0 }, noSlot, rules).state;
    expect(p6.queued).toBeNull();
    const p4 = step(initialState(), { type: 'm02.scanner.closed', at: 0 }, noSlot, rules).state;
    expect(p4.queued).not.toBeNull();
    const late = step(p4, { type: 'mascot.slots.changed', at: 4_001 }, CTX, rules).state;
    expect(late).toMatchObject({ queued: null, bubble: null });
  });

  it('INTRO nối câu: `then` chạy khi bong bóng đầu hết', () => {
    const rules = [
      rule('m01.language.selected', {
        intents: [
          {
            behaviorId: 'MAS-B-001',
            priority: 6,
            mode: 'INTRO',
            pose: 'wave',
            message: { id: 'MSG-MAS-001' },
            then: { behaviorId: 'MAS-B-002', priority: 6, mode: 'INTRO', pose: 'map', message: { id: 'MSG-MAS-002' } },
          },
        ],
      }),
    ];
    const first = run([{ type: 'm01.language.selected', language: 'vi', at: 0 }], rules);
    expect(first.bubble?.messageId).toBe('MSG-MAS-001');
    const second = step(first, { type: 'mascot.tick', at: nextDeadline(first)! }, CTX, rules).state;
    expect(second.bubble?.messageId).toBe('MSG-MAS-002');
  });

  it('hẹn giờ của luật phát `mascot.timer` khi tới hạn', () => {
    const rules: Rule[] = [
      rule('m02.scanner.opened', { timers: { look: 15_000 } }),
      rule('mascot.timer', (event) => (event.type === 'mascot.timer' && event.name === 'look' ? say({ pose: 'binoculars', animation: 'look' }) : null)),
    ];
    const armed = run([{ type: 'm02.scanner.opened', hasSession: true, k: 0, at: 0 }], rules);
    expect(nextDeadline(armed)).toBe(15_000);
    const fired = step(armed, { type: 'mascot.tick', at: 15_000 }, CTX, rules).state;
    expect(fired.view).toMatchObject({ pose: 'binoculars', animation: 'look' });
    expect(fired.timers).toEqual({});
  });

  it('T14: lỗi ảnh → HIDDEN', () => {
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-030' } }))];
    const state = run([{ type: 'm02.scanner.detected', at: 0 }, { type: 'mascot.asset.failed', at: 10 }], rules);
    expect(state).toMatchObject({ status: 'HIDDEN', view: null, bubble: null });
  });

  it('thuần: cùng đầu vào → cùng đầu ra; không đọc đồng hồ hệ thống', () => {
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('step không được đọc Date.now()');
    });
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-030' } }))];
    const events = [{ type: 'm02.scanner.detected', at: 5 } as const, { type: 'mascot.tick', at: 10_000 } as const];
    expect(run(events, rules)).toEqual(run(events, rules));
    spy.mockRestore();
  });
});
