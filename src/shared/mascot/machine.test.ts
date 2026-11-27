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
    const rules = [rule('m02.scanner.detected', say({ mode: 'DOCK', pose: 'magnifier', message: { id: 'MSG-MAS-042' } }))];
    const state = run([{ type: 'm02.scanner.detected', at: 1_000 }], rules);
    expect(state.status).toBe('SPEAKING');
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'magnifier' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-042', shownAt: 1_000 });
  });

  it('T5: bong bóng tự ẩn sau thời gian đọc; DOCK ở lại, AVATAR rời', () => {
    const dock = [rule('m02.scanner.detected', say({ mode: 'DOCK', message: { id: 'MSG-MAS-042' } }))];
    const shown = run([{ type: 'm02.scanner.detected', at: 0 }], dock);
    const due = nextDeadline(shown)!;
    expect(due).toBe(shown.bubble!.expiresAt);
    const after = step(shown, { type: 'mascot.tick', at: due }, CTX, dock).state;
    expect(after).toMatchObject({ status: 'IDLE', bubble: null, view: { mode: 'DOCK' } });

    const avatar = [rule('m02.scanner.detected', say({ mode: 'AVATAR', message: { id: 'MSG-MAS-042' } }))];
    const shownAvatar = run([{ type: 'm02.scanner.detected', at: 0 }], avatar);
    const gone = step(shownAvatar, { type: 'mascot.tick', at: nextDeadline(shownAvatar)! }, CTX, avatar).state;
    expect(gone).toMatchObject({ status: 'HIDDEN', view: null, bubble: null });
  });

  it('thời gian đọc: 15 giây cho mọi câu, mọi màn (spec-Mascot v1.5 §5.4; trước 3–7 giây theo độ dài)', () => {
    expect(readingTimeMs('ngắn')).toBe(15_000);
    expect(readingTimeMs('x'.repeat(60))).toBe(15_000);
    expect(readingTimeMs('x'.repeat(200))).toBe(15_000);
  });

  it('chữ hiện dần (v1.1, R-20): thời gian tự ẩn tính từ khi chữ hiện đủ; không hiện dần thì như cũ', () => {
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } }))];
    const text = 'Chưa quét được? Thử lại gần hơn và tránh chỗ chói nắng.';
    const typed = step(initialState(), { type: 'm02.scanner.detected', at: 0 }, { ...CTX, typing: true }, rules).state;
    expect(typed.bubble!.expiresAt).toBe(Math.ceil((text.length * 1000) / 30) + readingTimeMs(text));
    const instant = step(initialState(), { type: 'm02.scanner.detected', at: 0 }, CTX, rules).state;
    expect(instant.bubble!.expiresAt).toBe(readingTimeMs(text));
  });

  it('T9: thông báo tạm đóng → SUPPRESSED, xóa hàng đợi; câu sau bị bỏ tới khi đổi màn', () => {
    const rules = [
      rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } })),
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
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } }))];
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
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } }))];
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

  it('tín hiệu trạng thái không bị chống trùng: phát → dừng → phát trong 500 ms vẫn chặn', () => {
    const rules = [rule('m02.scanner.detected', say({ mode: 'DOCK', message: { id: 'MSG-MAS-042' } }))];
    const media = run(
      [
        { type: 'm02.media.playing', mediaType: 'AUDIO', at: 0 },
        { type: 'm02.media.stopped', at: 100 },
        { type: 'm02.media.playing', mediaType: 'AUDIO', at: 200 },
        { type: 'm02.scanner.detected', at: 900 },
      ],
      rules,
    );
    expect(media.blockers).toEqual(['MEDIA']);
    expect(media.bubble).toBeNull();
    const dialog = run(
      [
        { type: 'app.dialog.changed', open: true, kind: 'OTHER', at: 0 },
        { type: 'app.dialog.changed', open: false, kind: 'OTHER', at: 100 },
        { type: 'app.dialog.changed', open: true, kind: 'OTHER', at: 200 },
        { type: 'm02.scanner.detected', at: 900 },
      ],
      rules,
    );
    expect(dialog.blockers).toEqual(['DIALOG']);
    expect(dialog.bubble).toBeNull();
  });

  it('mở dialog khác hoặc ẩn trang khi đang nói → bỏ bong bóng', () => {
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } }))];
    const state = run([{ type: 'm02.scanner.detected', at: 0 }, { type: 'app.dialog.changed', open: true, kind: 'OTHER', at: 50 }], rules);
    expect(state.bubble).toBeNull();
  });

  it('đổi màn: hủy bong bóng P6, hẹn giờ, khung; giữ P4 vừa phát để màn mới hiện', () => {
    const rules = [
      rule('m02.scanner.detected', { intents: [{ behaviorId: 'T', priority: 6, mode: 'DOCK', pose: 'map', message: { id: 'MSG-MAS-042' } }], timers: { idle: 15_000 } }),
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

  it('slot của màn chưa đăng ký: ý định mọi mức chờ tối đa 4 giây, hiện khi slot có (cuộc đua render)', () => {
    const noSlot = { ...CTX, availableModes: [] as const };
    const rules = [
      rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } })),
      rule('m02.scanner.closed', say({ priority: 4, message: { id: 'MSG-MAS-051' } })),
      rule('m02.scanner.opened', say({ priority: 7, pose: 'binoculars' })),
    ];
    const p6 = step(initialState(), { type: 'm02.scanner.detected', at: 0 }, noSlot, rules).state;
    expect(p6.queued).toMatchObject({ reason: 'slot' });
    expect(step(p6, { type: 'mascot.slots.changed', at: 50 }, CTX, rules).state.bubble?.messageId).toBe('MSG-MAS-042');
    const p7 = step(initialState(), { type: 'm02.scanner.opened', hasSession: true, k: 0, at: 0 }, noSlot, rules).state;
    expect(step(p7, { type: 'mascot.slots.changed', at: 50 }, CTX, rules).state.view).toMatchObject({ pose: 'binoculars' });
    const p4 = step(initialState(), { type: 'm02.scanner.closed', at: 0 }, noSlot, rules).state;
    const late = step(p4, { type: 'mascot.slots.changed', at: 4_001 }, CTX, rules).state;
    expect(late).toMatchObject({ queued: null, bubble: null });
  });

  it('đổi màn nhanh A → B → A trong 500 ms: không bị coi là trùng; màn mới không chống trùng với lần trước ở màn đó', () => {
    const rules = [rule('m02.scanner.opened', say({ priority: 7, mode: 'DOCK', pose: 'map' }))];
    const opened = { type: 'm02.scanner.opened', hasSession: true, k: 1 } as const;
    let s = step(initialState(), { type: 'app.route.changed', path: '/trip', at: 0 }, CTX, rules).state;
    s = step(s, { ...opened, at: 10 }, CTX, rules).state;
    s = step(s, { type: 'app.route.changed', path: '/trip/qr/Q1a', at: 100 }, CTX, rules).state;
    s = step(s, { type: 'app.route.changed', path: '/trip', at: 300 }, CTX, rules).state;
    expect(s).toMatchObject({ path: '/trip', view: null });
    s = step(s, { ...opened, at: 320 }, CTX, rules).state;
    expect(s.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
  });

  it('câu mang sang đang chờ slot không đẩy mất tư thế DOCK của màn mới (quay lại chuyến đi ngay sau câu 051)', () => {
    const dockOnly = { ...CTX, availableModes: ['DOCK'] as const };
    const rules = [
      rule('m02.scanner.closed', say({ priority: 4, mode: 'AVATAR', message: { id: 'MSG-MAS-051' } })),
      rule('m02.scanner.opened', say({ priority: 7, mode: 'DOCK', pose: 'map' })),
    ];
    let s = step(initialState(), { type: 'm02.scanner.closed', at: 0 }, CTX, rules).state;
    s = step(s, { type: 'app.route.changed', path: '/trip', at: 300 }, { ...CTX, availableModes: [] }, rules).state;
    expect(s.queued).toMatchObject({ carried: true });
    s = step(s, { type: 'm02.scanner.opened', hasSession: true, k: 1, at: 320 }, { ...CTX, availableModes: [] }, rules).state;
    s = step(s, { type: 'mascot.slots.changed', at: 340 }, dockOnly, rules).state;
    expect(s.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
  });

  it('chỉ câu thành công P4 được mang sang màn mới; câu chạm (P3) của màn cũ bị bỏ (BR-MAS-20, rời màn)', () => {
    const rules = [rule('mascot.user.tapped', say({ priority: 3, requested: true, message: { id: 'MSG-MAS-032' } }))];
    let s = step(initialState(), { type: 'mascot.user.tapped', at: 0 }, CTX, rules).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-032');
    s = step(s, { type: 'app.route.changed', path: '/trip/qr/Q1a', at: 50 }, CTX, rules).state;
    expect(s).toMatchObject({ bubble: null, queued: null });
  });

  it('câu mang sang nhường chỗ hàng đợi cho câu của màn mới đang chờ slot (056 khi quay lại sau câu 051)', () => {
    const dockOnly = { ...CTX, availableModes: ['DOCK'] as const };
    const rules = [
      rule('m02.scanner.closed', say({ priority: 4, mode: 'AVATAR', message: { id: 'MSG-MAS-051' } })),
      rule('m02.scanner.opened', say({ priority: 6, mode: 'DOCK', message: { id: 'MSG-MAS-056' } })),
    ];
    let s = step(initialState(), { type: 'm02.scanner.closed', at: 0 }, CTX, rules).state;
    s = step(s, { type: 'app.route.changed', path: '/trip', at: 300 }, { ...CTX, availableModes: [] }, rules).state;
    s = step(s, { type: 'm02.scanner.opened', hasSession: true, k: 1, at: 320 }, { ...CTX, availableModes: [] }, rules).state;
    expect(s.queued).toMatchObject({ intent: { message: { id: 'MSG-MAS-056' } } });
    s = step(s, { type: 'mascot.slots.changed', at: 340 }, dockOnly, rules).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-056');
  });


  it('nối câu: `then` chạy khi bong bóng đầu hết', () => {
    const rules = [
      rule('m01.language.selected', {
        intents: [
          {
            behaviorId: 'MAS-B-001',
            priority: 6,
            mode: 'DOCK',
            pose: 'wave',
            message: { id: 'MSG-MAS-009' },
            then: { behaviorId: 'MAS-B-004', priority: 6, mode: 'DOCK', pose: 'map', message: { id: 'MSG-MAS-004' } },
          },
        ],
      }),
    ];
    const first = run([{ type: 'm01.language.selected', language: 'vi', at: 0 }], rules);
    expect(first.bubble?.messageId).toBe('MSG-MAS-009');
    const second = step(first, { type: 'mascot.tick', at: nextDeadline(first)! }, CTX, rules).state;
    expect(second.bubble?.messageId).toBe('MSG-MAS-004');
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
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } }))];
    const state = run([{ type: 'm02.scanner.detected', at: 0 }, { type: 'mascot.asset.failed', at: 10 }], rules);
    expect(state).toMatchObject({ status: 'HIDDEN', view: null, bubble: null });
  });

  it('thuần: cùng đầu vào → cùng đầu ra; không đọc đồng hồ hệ thống', () => {
    const spy = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('step không được đọc Date.now()');
    });
    const rules = [rule('m02.scanner.detected', say({ message: { id: 'MSG-MAS-042' } }))];
    const events = [{ type: 'm02.scanner.detected', at: 5 } as const, { type: 'mascot.tick', at: 10_000 } as const];
    expect(run(events, rules)).toEqual(run(events, rules));
    spy.mockRestore();
  });
});

describe('v1.1 — Ngữ cảnh "đang thao tác" (BR-MAS-20; research R-19; quickstart Q25)', () => {
  const timed = (source: 'timer' | 'ambient' | undefined): Rule[] => [
    rule('m02.scanner.opened', { timers: { help: 3_000 } }),
    rule('mascot.timer', (event) => (event.type === 'mascot.timer' && event.name === 'help' ? say({ ...(source ? { source } : {}), message: { id: 'MSG-MAS-032' }, priority: 3 }) : null)),
  ];
  const open = { type: 'm02.scanner.opened', hasSession: true, k: 0, at: 0 } as const;

  it('chạm / cuộn / phím trong 2 s trước hẹn giờ → ý định `timer` và `ambient` bị bỏ', () => {
    for (const source of ['timer', 'ambient'] as const) {
      const s = run([open, { type: 'app.user.activity', at: 1_500 }, { type: 'mascot.tick', at: 3_000 }], timed(source));
      expect(s.bubble).toBeNull();
      expect(s.lastActivityAt).toBe(1_500);
    }
  });

  it('quá 2 s sau thao tác → ý định `timer` chạy như thường', () => {
    const s = run([open, { type: 'app.user.activity', at: 900 }, { type: 'mascot.tick', at: 3_000 }], timed('timer'));
    expect(s.bubble?.messageId).toBe('MSG-MAS-032');
  });

  it('ý định không có `source` (kết quả trực tiếp của thao tác, sự kiện của màn) không bị bỏ', () => {
    const s = run([open, { type: 'app.user.activity', at: 2_900 }, { type: 'mascot.tick', at: 3_000 }], timed(undefined));
    expect(s.bubble?.messageId).toBe('MSG-MAS-032');
    const tapped = run(
      [{ type: 'app.user.activity', at: 0 }, { type: 'm02.scanner.opened', hasSession: true, k: 0, at: 10 }],
      [rule('m02.scanner.opened', say({ message: { id: 'MSG-MAS-043' }, priority: 3, requested: true }))],
    );
    expect(tapped.bubble?.messageId).toBe('MSG-MAS-043');
  });

  it('thao tác không chống trùng và không đổi gì khác (không đóng bong bóng đang hiện)', () => {
    const shown = run([open], [rule('m02.scanner.opened', say({ message: { id: 'MSG-MAS-043' }, priority: 3 }))]);
    const a = step(shown, { type: 'app.user.activity', at: 100 }, CTX, []).state;
    const b = step(a, { type: 'app.user.activity', at: 200 }, CTX, []).state;
    expect(b.lastActivityAt).toBe(200);
    expect(b.bubble?.messageId).toBe('MSG-MAS-043');
  });

  it('media bắt đầu → bong bóng đóng ngay (MAS-TC-115)', () => {
    const shown = run([open], [rule('m02.scanner.opened', say({ message: { id: 'MSG-MAS-043' }, priority: 3 }))]);
    const playing = step(shown, { type: 'm02.media.playing', mediaType: 'AUDIO', at: 50 }, CTX, []).state;
    expect(playing.bubble).toBeNull();
  });
});
