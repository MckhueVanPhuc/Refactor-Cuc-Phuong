// Luật của Mila theo Behavior Matrix (specs/005 tasks T024, T031, T037, T043, T047, T052, T056, T063). Chạy bảng luật
// thật `RULES`; luật thăm dò (`probe`) chỉ dùng để kiểm ngữ cảnh chặn với một câu có thật.
import { describe, expect, it } from 'vitest';
import type { MascotEvent } from './events';
import { initialState, step, type MascotState, type Rule } from './machine';
import { RULES } from './rules';
import { CTX, rule, say } from './testing';

type Stamped = MascotEvent & { at: number };
const probe = rule('m02.scanner.cameraStarted', say({ priority: 4, mode: 'DOCK', message: { id: 'MSG-MAS-051' } }));

export function play(events: Stamped[], extra: Rule[] = [], ctx = CTX, start: MascotState = initialState()) {
  const rules = [...RULES, ...extra];
  const effects: unknown[] = [];
  const state = events.reduce((s, e) => {
    const r = step(s, e, ctx, rules);
    effects.push(...r.effects);
    return r.state;
  }, start);
  return { state, effects };
}

describe('US3 — Mila tránh đường (US-MAS-05)', () => {
  it('MAS-B-045: thông báo tạm đóng → SUPPRESSED, gỡ khung, xóa câu đang chờ', () => {
    const { state } = play(
      [
        { type: 'm02.scanner.cameraStarted', at: 0 },
        { type: 'm02.scan.resolved', display: 'CLOSED', hasSession: true, freeVisitor: false, visitCreated: false, inJourney: true, finalPromptNeeded: false, at: 100 },
        { type: 'm02.scanner.cameraStarted', at: 700 },
      ],
      [probe],
    );
    expect(state).toMatchObject({ status: 'SUPPRESSED', view: null, bubble: null, queued: null });
  });

  it('MAS-B-045: thông báo tạm đóng hiện ở màn (lưới an toàn `closedShown`) cũng gỡ Mila', () => {
    const { state } = play([{ type: 'm02.scanner.cameraStarted', at: 0 }, { type: 'm02.notice.closedShown', at: 100 }], [probe]);
    expect(state).toMatchObject({ status: 'SUPPRESSED', view: null });
  });

  it('sau tạm đóng, lần quét mới cho Mila trở lại', () => {
    const { state } = play(
      [
        { type: 'm02.notice.closedShown', at: 0 },
        { type: 'm02.scanner.detected', at: 100 },
        { type: 'm02.scanner.cameraStarted', at: 700 },
      ],
      [probe],
    );
    expect(state.bubble?.messageId).toBe('MSG-MAS-051');
  });

  it('MAS-B-058: media đang phát → không bong bóng; dừng phát → nói lại được', () => {
    const blocked = play([{ type: 'm02.media.playing', mediaType: 'AUDIO', at: 0 }, { type: 'm02.scanner.cameraStarted', at: 100 }], [probe]).state;
    expect(blocked.bubble).toBeNull();
    const after = play([{ type: 'm02.media.stopped', at: 200 }, { type: 'm02.scanner.cameraStarted', at: 900 }], [probe], CTX, blocked).state;
    expect(after.bubble?.messageId).toBe('MSG-MAS-051');
  });

  it('MAS-B-035: thông báo tự kết thúc chuyến → không bong bóng tới khi thông báo đóng', () => {
    const blocked = play([{ type: 'm02.notice.autoEndShown', at: 0 }, { type: 'm02.scanner.cameraStarted', at: 100 }], [probe]).state;
    expect(blocked.bubble).toBeNull();
    const after = play([{ type: 'm02.notice.autoEndHidden', at: 200 }, { type: 'm02.scanner.cameraStarted', at: 900 }], [probe], CTX, blocked).state;
    expect(after.bubble).not.toBeNull();
  });

  it('dialog khác chặn; dialog cuối chuyến không chặn', () => {
    expect(play([{ type: 'app.dialog.changed', open: true, kind: 'OTHER', at: 0 }, { type: 'm02.scanner.cameraStarted', at: 100 }], [probe]).state.bubble).toBeNull();
    expect(play([{ type: 'app.dialog.changed', open: true, kind: 'FINAL_PROMPT', at: 0 }, { type: 'm02.scanner.cameraStarted', at: 100 }], [probe]).state.bubble).not.toBeNull();
  });

  it('MAS-B-084: trang ẩn → bỏ bong bóng, dừng hẹn giờ', () => {
    const shown = play([{ type: 'm02.scanner.cameraStarted', at: 0 }], [probe]).state;
    const hidden = play([{ type: 'app.visibility.changed', visible: false, at: 100 }], [probe], CTX, shown).state;
    expect(hidden).toMatchObject({ bubble: null, timers: {} });
  });

  it('MAS-B-082: ảnh lỗi → HIDDEN tới khi tải lại trang', () => {
    const { state } = play([{ type: 'mascot.asset.failed', at: 0 }, { type: 'app.route.changed', path: '/', at: 100 }, { type: 'm02.scanner.cameraStarted', at: 200 }], [probe]);
    expect(state).toMatchObject({ status: 'HIDDEN', view: null, bubble: null });
  });

  it('MAS-B-083: đổi màn bỏ chặn media/dialog (màn mới không còn trình phát hay hộp thoại đó)', () => {
    const { state } = play(
      [
        { type: 'm02.media.playing', mediaType: 'VIDEO', at: 0 },
        { type: 'app.route.changed', path: '/trip', at: 100 },
        { type: 'mascot.slots.changed', at: 150 },
        { type: 'm02.scanner.cameraStarted', at: 200 },
      ],
      [probe],
    );
    expect(state.blockers).toEqual([]);
    expect(state.bubble).not.toBeNull();
  });
});

describe('US1 — Làm quen với Mila (US-MAS-01)', () => {
  const selected = (at: number): Stamped => ({ type: 'm01.language.selected', language: 'vi', at });
  const loaded = (at: number): Stamped => ({ type: 'm01.catalog.loaded', status: 'ready', count: 2, stale: false, slow: false, at });

  it('MAS-B-001→002→003: chọn ngôn ngữ lần đầu → sau 300 ms INTRO 001, rồi 002, rồi DOCK ở hero', () => {
    let { state } = play([{ type: 'app.route.changed', path: '/', at: 0 }, selected(1_000), loaded(1_050)]);
    expect(state.bubble).toBeNull();
    state = play([{ type: 'mascot.tick', at: 1_300 }], [], CTX, state).state;
    expect(state.view).toMatchObject({ mode: 'INTRO', pose: 'wave' });
    expect(state.bubble?.messageId).toBe('MSG-MAS-001');
    state = play([{ type: 'mascot.tick', at: state.bubble!.expiresAt! }], [], CTX, state).state;
    expect(state.bubble?.messageId).toBe('MSG-MAS-002');
    state = play([{ type: 'mascot.tick', at: state.bubble!.expiresAt! }], [], CTX, state).state;
    expect(state).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'map' } });
  });

  it('MAS-B-003: đóng bong bóng giới thiệu → về thẳng DOCK', () => {
    let { state } = play([{ type: 'app.route.changed', path: '/', at: 0 }, selected(1_000), { type: 'mascot.tick', at: 1_300 }]);
    state = play([{ type: 'mascot.user.closedBubble', at: 2_000 }], [], CTX, state).state;
    expect(state).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'map' } });
  });

  it('không giới thiệu trên trang mở từ mã QR (BR-M02-024; SC-MAS-010)', () => {
    const { state } = play([{ type: 'app.route.changed', path: '/q/Q1a', at: 0 }, selected(100), { type: 'mascot.tick', at: 400 }]);
    expect(state.bubble).toBeNull();
    expect(state.once['INTRO']).toBeUndefined();
  });

  it('MAS-B-004: ngôn ngữ có từ trước → chào mừng quay lại một lần, sau 600 ms; không có sau khi đã giới thiệu', () => {
    let { state } = play([{ type: 'app.route.changed', path: '/', at: 0 }, loaded(100)]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
    state = play([{ type: 'mascot.tick', at: 700 }], [], CTX, state).state;
    expect(state.bubble?.messageId).toBe('MSG-MAS-004');
    state = play([{ type: 'mascot.user.closedBubble', at: 800 }, { type: 'app.route.changed', path: '/recommend', at: 900 }, { type: 'app.route.changed', path: '/', at: 1_000 }, loaded(1_100), { type: 'mascot.tick', at: 1_800 }], [], CTX, state).state;
    expect(state.bubble).toBeNull();

    const afterIntro = play([{ type: 'app.route.changed', path: '/', at: 0 }, selected(100), loaded(150), { type: 'mascot.tick', at: 400 }, { type: 'mascot.user.closedBubble', at: 500 }, loaded(5_000), { type: 'mascot.tick', at: 5_700 }]).state;
    expect(afterIntro.bubble).toBeNull();
  });

  it('MAS-B-080: bong bóng giữ cùng câu khi đổi ngôn ngữ (chữ tính lúc render theo ngôn ngữ mới)', () => {
    const vi = play([{ type: 'app.route.changed', path: '/', at: 0 }, selected(0), { type: 'mascot.tick', at: 300 }]).state;
    const en = play([{ type: 'm01.language.changed', language: 'en', at: 400 }], [], { ...CTX, language: 'en' }, vi).state;
    expect(en.bubble?.messageId).toBe(vi.bubble?.messageId);
  });
});

describe('US2 — Mila ăn mừng tiến độ có thật (US-MAS-02)', () => {
  const content = (at: number): Stamped => ({ type: 'app.route.changed', path: '/trip/qr/Q1a', at });
  const visit = (k: number, n: number, at: number, isFinal = false): Stamped => ({
    type: 'm02.visit.recorded',
    sessionRef: 's1',
    visitRef: `s1:c${k}`,
    k,
    n,
    isFinal,
    at,
  });
  const shown = (k: number, finalVisited = false): Stamped => ({ type: 'm02.trip.shown', hasSession: true, k, n: 4, finalVisited, at: 10 });

  it('MAS-B-051: mã đầu tiên của phiên → AVATAR ăn mừng 051, rung một lần', () => {
    const { state, effects } = play([content(0), { type: 'mascot.slots.changed', at: 5 }, visit(1, 4, 10)]);
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'cheer', animation: 'hop' });
    expect(state.bubble?.messageId).toBe('MSG-MAS-051');
    expect(effects).toEqual([{ kind: 'vibrate', ms: 30 }]);
  });

  it('MAS-B-055: k = ⌈n/2⌉, n ≥ 4 → nửa số điểm (thay 050)', () => {
    const { state } = play([content(0), visit(2, 4, 10)]);
    expect(state.bubble?.messageId).toBe('MSG-MAS-055');
  });

  it('MAS-B-050: các lượt khác → "{cheer} {k}/{n}", câu cổ vũ xoay vòng tất định', () => {
    const first = play([content(0), visit(4, 6, 10)]).state;
    expect(first.bubble).toMatchObject({ messageId: 'MSG-MAS-050', params: { k: 4, n: 6, cheer: 0 } });
    const second = play([{ type: 'mascot.user.closedBubble', at: 20 }, { type: 'app.route.changed', path: '/trip/qr/Q4', at: 30 }, visit(5, 7, 40)], [], CTX, first).state;
    expect(second.bubble?.params).toMatchObject({ cheer: 1 });
  });

  it('MAS-B-053: cùng lượt ghé phát lại (lùi/tiến về trang nội dung) → không ăn mừng, không rung lần hai', () => {
    const first = play([content(0), visit(1, 4, 10), { type: 'mascot.user.closedBubble', at: 20 }]).state;
    const again = play([content(1_000), visit(1, 4, 1_100)], [], CTX, first);
    expect(again.state.bubble).toBeNull();
    expect(again.effects).toEqual([]);
  });

  it('điểm cuối: không bong bóng (dialog cuối chuyến hiện ngay), vẫn rung (BR-MAS-19)', () => {
    const { state, effects } = play([content(0), visit(2, 2, 10, true)]);
    expect(state.bubble).toBeNull();
    expect(effects).toEqual([{ kind: 'vibrate', ms: 30 }]);
  });

  it('giảm chuyển động → không rung', () => {
    expect(play([content(0), visit(1, 4, 10)], [], { ...CTX, reducedMotion: true }).effects).toEqual([]);
  });

  it('MAS-B-033: DOCK trên màn chuyến đi theo tiến độ', () => {
    const trip = { type: 'app.route.changed', path: '/trip', at: 0 } as const;
    expect(play([trip, shown(0)]).state.view).toMatchObject({ mode: 'DOCK', pose: 'binoculars' });
    expect(play([trip, shown(2)]).state.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
    expect(play([trip, shown(2, true)]).state.view).toMatchObject({ mode: 'DOCK', pose: 'thumbsUp' });
    expect(play([trip, { type: 'm02.trip.shown', hasSession: false, k: 0, n: 0, finalVisited: false, at: 10 }]).state.view).toBeNull();
  });

  it('MAS-B-061: chọn "Đi tiếp" → câu 061 ở slot đang có', () => {
    const onContent = play([content(0), { type: 'm02.finalPrompt.continued', at: 10 }]).state;
    expect(onContent.bubble?.messageId).toBe('MSG-MAS-061');
    const onTrip = play([{ type: 'app.route.changed', path: '/trip', at: 0 }, { type: 'm02.finalPrompt.continued', at: 10 }], [], { ...CTX, availableModes: ['DOCK'] }).state;
    expect(onTrip.view?.mode).toBe('DOCK');
  });

  it('khách tự do không bao giờ có tiến độ (BR-MAS-14): không có visit.recorded nên không có ăn mừng', () => {
    const { state } = play([{ type: 'app.route.changed', path: '/q/Q1a', at: 0 }, { type: 'm02.scan.resolved', display: 'LIVE', hasSession: false, freeVisitor: true, visitCreated: false, inJourney: false, finalPromptNeeded: false, at: 10 }]);
    expect(state.bubble).toBeNull();
  });
});

describe('US4 — Kết thúc chuyến cùng Mila (US-MAS-08)', () => {
  const end: Stamped = { type: 'app.route.changed', path: '/trip/end', at: 0 };
  const ended = (justEnded: boolean, status: 'HOAN_TAT' | 'BO_DO' = 'HOAN_TAT'): Stamped => ({ type: 'm02.trip.ended', status, k: 3, justEnded, at: 10 });
  const sync = (status: 'PENDING' | 'SYNCED' | 'CONFLICT', online: boolean, at: number): Stamped => ({ type: 'm02.sync.statusChanged', status, online, at });

  it('MAS-B-062: vừa kết thúc HOAN_TAT → ăn mừng một lần với {k} rồi về hình tĩnh cạnh huy hiệu (MAS-B-063)', () => {
    let { state } = play([end, ended(true)]);
    expect(state.view).toMatchObject({ mode: 'CELEBRATE', pose: 'cheer', animation: 'celebrate' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-062', params: { k: 3 } });
    state = play([{ type: 'mascot.tick', at: state.bubble!.expiresAt! }], [], CTX, state).state;
    expect(state).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'cheer', animation: null } });
  });

  it('chạm đóng khi đang ăn mừng → về hình tĩnh ngay', () => {
    const shown = play([end, ended(true)]).state;
    const after = play([{ type: 'mascot.user.closedBubble', at: 500 }], [], CTX, shown).state;
    expect(after).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'cheer' } });
  });

  it('MAS-B-063: mở lại màn kết quả → chỉ hình tĩnh; chuyến tự kết thúc (BO_DO) → không ăn mừng', () => {
    expect(play([end, ended(false)]).state).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'cheer' } });
    expect(play([end, ended(false, 'BO_DO')]).state).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'rest' } });
    expect(play([end, ended(true, 'BO_DO')]).state.bubble).toBeNull();
  });

  it('MAS-B-070: PENDING khi offline → sau phần ăn mừng nói chuyến đã lưu; không nói khi online', () => {
    let { state } = play([end, ended(true), sync('PENDING', false, 20)]);
    expect(state.timers).toHaveProperty('pendingNote');
    state = play([{ type: 'mascot.user.closedBubble', at: 1_000 }, { type: 'mascot.tick', at: 4_020 }], [], CTX, state).state;
    expect(state.bubble?.messageId).toBe('MSG-MAS-070');
    expect(play([end, ended(true), sync('PENDING', true, 20)]).state.timers).not.toHaveProperty('pendingNote');
  });

  it('MAS-B-071: PENDING → SYNCED khi màn đang mở → giơ ngón cái, không có câu "đã gửi"', () => {
    const { state } = play([end, ended(false), sync('PENDING', true, 20), sync('SYNCED', true, 900)]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'thumbsUp', animation: 'thumb' });
    expect(state.bubble).toBeNull();
  });

  it('SYNCED ngay từ đầu (không qua PENDING) → không giơ ngón cái', () => {
    const { state } = play([end, ended(false), sync('SYNCED', true, 20)]);
    expect(state.view).toMatchObject({ pose: 'cheer' });
  });

  it('MAS-B-072: CONFLICT → không có câu hay nút nào của Mila (BR-M02-011)', () => {
    const { state } = play([end, ended(false), sync('CONFLICT', true, 20)]);
    expect(state.bubble).toBeNull();
  });
});

describe('v1.1 — Cử chỉ tự động (MAS-B-086, BR-MAS-21)', () => {
  // Hàm ngẫu nhiên cố định: 0 → khoảng cách ngắn nhất (8 s), cử chỉ đầu danh sách
  const zero = { ...CTX, random: () => 0 };
  const catalog: Stamped[] = [
    { type: 'app.route.changed', path: '/', at: 0 },
    { type: 'm01.catalog.loaded', status: 'ready', count: 3, stale: false, slow: false, at: 10 },
  ];
  // Người dùng cũ: catalog.loaded → hẹn chào lại 600 ms; đóng bong bóng chào để Mila đứng yên ở DOCK
  const settled = () => {
    let s = play(catalog, [], zero).state;
    s = play([{ type: 'mascot.tick', at: 700 }], [], zero, s).state;
    return play([{ type: 'mascot.user.closedBubble', at: 800 }], [], zero, s).state;
  };

  it('DOCK đứng yên ở danh mục → hẹn cử chỉ sau 8–15 s; tới hạn: một cử chỉ ≤ 1,5 s rồi về tư thế cũ', () => {
    const s = settled();
    expect(s.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
    expect(s.timers['ambient']).toBe(800 + 8_000);
    const gesture = play([{ type: 'mascot.tick', at: 8_800 }], [], zero, s).state;
    expect(gesture.view).toMatchObject({ mode: 'DOCK', behaviorId: 'MAS-B-086' });
    expect(gesture.bubble).toBeNull();
    // Cử chỉ không có lời: không thêm vào giới hạn câu chủ động (mốc 700 là câu chào 004)
    expect(gesture.proactiveLog).toEqual(s.proactiveLog);
    expect(gesture.hold!.until - 8_800).toBeLessThanOrEqual(1_500);
    const back = play([{ type: 'mascot.tick', at: gesture.hold!.until }], [], zero, gesture).state;
    expect(back.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
    expect(back.timers['ambient']).toBe(gesture.hold!.until + 8_000);
  });

  it('khoảng cách lớn nhất 15 s; không lặp cùng cử chỉ hai lần liền', () => {
    const high = { ...CTX, random: () => 0.999 };
    let s = play(catalog, [], high).state;
    s = play([{ type: 'mascot.tick', at: 700 }, { type: 'mascot.user.closedBubble', at: 800 }], [], high, s).state;
    expect(s.timers['ambient']).toBeLessThanOrEqual(800 + 15_000);
    const first = play([{ type: 'mascot.tick', at: s.timers['ambient']! }], [], zero, s).state;
    const firstLook = `${first.view!.pose}/${first.view!.animation}`;
    let r = play([{ type: 'mascot.tick', at: first.hold!.until }], [], zero, first).state;
    r = play([{ type: 'mascot.tick', at: r.timers['ambient']! }], [], zero, r).state;
    expect(`${r.view!.pose}/${r.view!.animation}`).not.toBe(firstLook);
  });

  it('không cử chỉ khi: có bong bóng, công tắc tắt, scanner mở, trang đọc bài', () => {
    // Bong bóng đang hiện (chưa đóng câu chào) → không hẹn
    let s = play(catalog, [], zero).state;
    s = play([{ type: 'mascot.tick', at: 700 }], [], zero, s).state;
    expect(s.bubble).not.toBeNull();
    expect(s.timers['ambient']).toBeUndefined();
    // Công tắc tắt → hủy lịch; bật lại → hẹn lại
    const off = play([{ type: 'mascot.motion.changed', on: false, at: 900 }], [], zero, settled()).state;
    expect(off.timers['ambient']).toBeUndefined();
    expect(play([{ type: 'mascot.motion.changed', on: true, at: 1_000 }], [], zero, off).state.timers['ambient']).toBe(9_000);
    // Scanner mở trên màn chuyến đi: tới hạn không có cử chỉ
    const trip = play(
      [
        { type: 'app.route.changed', path: '/trip', at: 0 },
        { type: 'm02.trip.shown', hasSession: true, k: 0, n: 3, finalVisited: false, at: 10 },
      ],
      [],
      zero,
    ).state;
    expect(trip.timers['ambient']).toBe(10 + 8_000);
    const scanning = play([{ type: 'm02.scanner.opened', hasSession: true, k: 0, at: 20 }], [], zero, trip).state;
    expect(play([{ type: 'mascot.tick', at: 8_010 }], [], zero, scanning).state.view?.behaviorId).not.toBe('MAS-B-086');
    // Trang đọc bài: không hẹn
    const reading = play([{ type: 'app.route.changed', path: '/trip/qr/Q1a', at: 0 }], [], zero).state;
    expect(reading.timers['ambient']).toBeUndefined();
  });
});
