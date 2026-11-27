// Luật của Mila theo Behavior Matrix (specs/005 tasks T024, T031, T037, T043, T047, T052, T056, T063). Chạy bảng luật
// thật `RULES`; luật thăm dò (`probe`) chỉ dùng để kiểm ngữ cảnh chặn với một câu có thật.
import { describe, expect, it } from 'vitest';
import type { MascotEvent } from './events';
import { initialState, step, type MascotState, type Rule } from './machine';
import { ambientGestures, RULES } from './rules';
import { messageText } from './dialogue/catalog';
import { CTX, rule, say } from './testing';

/** Điểm gợi ý kế tiếp mẫu cho câu 030/056 (v1.7) */
const NEXT = { vi: 'Khu hồ Mạc', en: 'Mac Lake' };

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

  it('MAS-B-001→003 (v1.3): chọn ngôn ngữ lần đầu → sau 300 ms lớp phủ INTRO một câu 001, không tự ẩn; chạm đóng → DOCK ở hero', () => {
    let { state } = play([{ type: 'app.route.changed', path: '/', at: 0 }, selected(1_000), loaded(1_050)]);
    expect(state.bubble).toBeNull();
    state = play([{ type: 'mascot.tick', at: 1_300 }], [], CTX, state).state;
    expect(state.view).toMatchObject({ mode: 'INTRO', pose: 'wave' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-001', expiresAt: null });
    // Không tự ẩn: một phút sau vẫn còn lớp phủ
    state = play([{ type: 'mascot.tick', at: 61_300 }], [], CTX, state).state;
    expect(state.bubble?.messageId).toBe('MSG-MAS-001');
    state = play([{ type: 'mascot.user.closedBubble', at: 62_000 }], [], CTX, state).state;
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
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'cheer', animation: 'milestone' });
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

  it('v1.6: điểm cuối được xác nhận như mọi điểm (câu hỏi kết thúc chuyến ở màn chuyến đi), có rung (BR-MAS-19)', () => {
    const { state, effects } = play([content(0), visit(2, 2, 10, true)]);
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-050', params: { k: 2, n: 2 } });
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
  const ended = (justEnded: boolean, status: 'HOAN_TAT' | 'BO_DO' = 'HOAN_TAT', n = 5): Stamped => ({ type: 'm02.trip.ended', status, k: 3, n, justEnded, at: 10 });
  const sync = (status: 'PENDING' | 'SYNCED' | 'CONFLICT', online: boolean, at: number): Stamped => ({ type: 'm02.sync.statusChanged', status, online, at });

  it('MAS-B-062 (v1.5, DV-92): ăn mừng ≤ 2,4 s với {k}, rồi Mila về DOCK nhỏ mà câu vẫn ở lại; hết thời gian đọc thì câu đóng', () => {
    let { state } = play([end, ended(true)]);
    expect(state.view).toMatchObject({ mode: 'CELEBRATE', pose: 'cheer', animation: 'celebrate' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-062', params: { k: 3 } });
    const expires = state.bubble!.expiresAt!;
    state = play([{ type: 'mascot.tick', at: state.hold!.until }], [], CTX, state).state;
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'proud', animation: 'settle' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-062' });
    state = play([{ type: 'mascot.tick', at: expires }], [], CTX, state).state;
    expect(state).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'proud' } });
  });

  it('chạm đóng khi đang ăn mừng → về hình tĩnh ngay', () => {
    const shown = play([end, ended(true)]).state;
    const after = play([{ type: 'mascot.user.closedBubble', at: 500 }], [], CTX, shown).state;
    expect(after).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'proud' } });
  });

  it('MAS-B-063: mở lại màn kết quả → chỉ hình tĩnh; chuyến tự kết thúc (BO_DO) → không ăn mừng', () => {
    expect(play([end, ended(false)]).state).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'proud' } });
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
    expect(state.view).toMatchObject({ pose: 'proud' });
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

  it('DOCK đứng yên ở danh mục → hẹn cử chỉ sau 4–7 s; tới hạn: một cử chỉ 2–3 nhịp ≤ 3 s rồi về tư thế cũ, thở nhẹ (v1.5)', () => {
    const s = settled();
    expect(s.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
    expect(s.timers['ambient']).toBe(800 + 4_000);
    const gesture = play([{ type: 'mascot.tick', at: 4_800 }], [], zero, s).state;
    expect(gesture.view).toMatchObject({ mode: 'DOCK', behaviorId: 'MAS-B-086' });
    expect(gesture.bubble).toBeNull();
    // Cử chỉ không có lời: không thêm vào giới hạn câu chủ động (mốc 700 là câu chào 004)
    expect(gesture.proactiveLog).toEqual(s.proactiveLog);
    expect(gesture.hold!.until - 4_800).toBeLessThanOrEqual(3_000);
    const back = play([{ type: 'mascot.tick', at: gesture.hold!.until }], [], zero, gesture).state;
    // Về tư thế ngữ cảnh với `settle`: CSS cho Mila thở nhẹ liên tục ở DOCK (Mascot.module.css)
    expect(back.view).toMatchObject({ mode: 'DOCK', pose: 'map', animation: 'settle' });
    expect(back.timers['ambient']).toBe(gesture.hold!.until + 4_000);
  });

  it('khoảng cách lớn nhất 7 s (v1.5); không lặp cùng cử chỉ hai lần liền', () => {
    const high = { ...CTX, random: () => 0.999 };
    let s = play(catalog, [], high).state;
    s = play([{ type: 'mascot.tick', at: 700 }, { type: 'mascot.user.closedBubble', at: 800 }], [], high, s).state;
    expect(s.timers['ambient']).toBeLessThanOrEqual(800 + 7_000);
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
    expect(play([{ type: 'mascot.motion.changed', on: true, at: 1_000 }], [], zero, off).state.timers['ambient']).toBe(5_000);
    // Scanner mở trên màn chuyến đi: tới hạn không có cử chỉ
    const trip = play(
      [
        { type: 'app.route.changed', path: '/trip', at: 0 },
        { type: 'm02.trip.shown', hasSession: true, k: 0, n: 3, finalVisited: false, at: 10 },
      ],
      [],
      zero,
    ).state;
    expect(trip.timers['ambient']).toBe(10 + 4_000);
    const scanning = play([{ type: 'm02.scanner.opened', hasSession: true, k: 0, at: 20 }], [], zero, trip).state;
    expect(play([{ type: 'mascot.tick', at: 4_010 }], [], zero, scanning).state.view?.behaviorId).not.toBe('MAS-B-086');
    // Trang đọc bài: không hẹn
    const reading = play([{ type: 'app.route.changed', path: '/trip/qr/Q1a', at: 0 }], [], zero).state;
    expect(reading.timers['ambient']).toBeUndefined();
  });
});

describe('US8 — Hỏi Mila theo ngữ cảnh (v1.1; BR-MAS-12, 22)', () => {
  const tap = (at: number): Stamped => ({ type: 'mascot.user.tapped', at });
  const catalogDock = () => {
    let s = play([{ type: 'app.route.changed', path: '/', at: 0 }, { type: 'm01.catalog.loaded', status: 'ready', count: 3, stale: false, slow: false, at: 10 }]).state;
    s = play([{ type: 'mascot.tick', at: 700 }], [], CTX, s).state;
    return play([{ type: 'mascot.user.closedBubble', at: 800 }], [], CTX, s).state;
  };
  const trip = (k: number, n = 3, finalVisited = false) =>
    play([
      { type: 'app.route.changed', path: '/trip', at: 0 },
      { type: 'm02.trip.shown', hasSession: true, k, n, finalVisited, at: 10 },
    ]).state;

  it('MAS-B-009 → 012: danh mục, chạm → câu 009 (P3, nhún, tư thế chỉ tay); chạm lần nữa khi còn hiện → 012; hết câu → về tư thế bản đồ', () => {
    let s = play([tap(1_000)], [], CTX, catalogDock()).state;
    expect(s.bubble).toMatchObject({ messageId: 'MSG-MAS-009', priority: 3 });
    expect(s.view).toMatchObject({ mode: 'DOCK', pose: 'point', animation: 'hop' });
    s = play([tap(1_600)], [], CTX, s).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-012');
    s = play([{ type: 'mascot.tick', at: s.bubble!.expiresAt! }], [], CTX, s).state;
    expect(s).toMatchObject({ bubble: null, view: { mode: 'DOCK', pose: 'map' } });
  });

  it('câu chạm không có cooldown và không tính vào giới hạn câu chủ động (BR-MAS-07)', () => {
    let s = play([tap(1_000)], [], CTX, catalogDock()).state;
    const log = s.proactiveLog;
    s = play([{ type: 'mascot.user.closedBubble', at: 1_500 }, tap(2_000)], [], CTX, s).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-009');
    expect(s.proactiveLog).toEqual(log);
  });

  it('MAS-B-090 (v1.6): mỗi màn M01 có câu chạm riêng; chi tiết tuyến nói ở panel Bắt đầu, tài nguyên ở ô gói', () => {
    const tapOn = (path: string, start: Stamped[] = []) => {
      const view: Stamped = { type: 'm01.recommend.opened', at: 10 };
      const s = play([{ type: 'app.route.changed', path, at: 0 }, ...(start.length ? start : [view]), { type: 'mascot.user.closedBubble', at: 900 }]).state;
      return play([tap(1_000)], [], CTX, s.view ? s : { ...s, view: { mode: 'AVATAR', pose: 'point', animation: null, seq: 1, behaviorId: 'T' } }).state;
    };
    let s = tapOn('/recommend');
    expect(s.bubble?.messageId).toBe('MSG-MAS-010');
    s = play([tap(1_600)], [], CTX, s).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-015');
    expect(tapOn('/recommend/results').bubble?.messageId).toBe('MSG-MAS-016');

    const safety: Stamped = { type: 'm01.routeDetail.startPanelVisible', routeRef: 'r1', hasSafetyWarning: true, at: 10 };
    const withWarning = tapOn('/routes/r1', [safety, { type: 'mascot.tick', at: 600 }]);
    expect(withWarning.bubble?.messageId).toBe('MSG-MAS-017');
    expect(withWarning.view).toMatchObject({ slot: 'start-panel' });
    const noWarning = tapOn('/routes/r2', [{ ...safety, routeRef: 'r2', hasSafetyWarning: false }]);
    expect(noWarning.bubble?.messageId).toBe('MSG-MAS-019');
    expect(noWarning.view).toMatchObject({ slot: 'start-panel' });

    const offline = tapOn('/offline', [{ type: 'mascot.tick', at: 20 }]);
    expect(offline.bubble?.messageId).toBe('MSG-MAS-018');
    expect(offline.view).toMatchObject({ slot: 'package-panel' });
  });

  it('v1.6: đổi màn chỉ mang theo lời xác nhận lượt quét — câu 011 của trang kết quả không chặn lời chào 010 của form', () => {
    let s = play([
      { type: 'app.route.changed', path: '/recommend/results', at: 0 },
      { type: 'm01.recommend.resolved', count: 2, at: 10 },
    ]).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-011');
    s = play([{ type: 'app.route.changed', path: '/recommend', at: 500 }, { type: 'm01.recommend.opened', at: 510 }, { type: 'mascot.tick', at: 1_000 }], [], CTX, s).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-010');
  });

  it('MAS-B-032 / 036 / 037: chuyến đi chưa quét → 032; giữa chặng → 033 (v1.7: không số điểm); quét đủ → 032; scanner mở → 043', () => {
    expect(play([tap(1_000)], [], CTX, trip(0)).state.bubble?.messageId).toBe('MSG-MAS-032');
    const midway = play([tap(1_000)], [], CTX, trip(1)).state.bubble;
    expect(midway?.messageId).toBe('MSG-MAS-033');
    expect(midway?.params).toBeUndefined();
    expect(messageText('vi', 'MSG-MAS-033')).toBe('Chạm điểm đã quét để đọc lại, hoặc quét tem QR ở điểm tiếp theo nhé.');
    expect(play([tap(1_000)], [], CTX, trip(3, 3, true)).state.bubble?.messageId).toBe('MSG-MAS-032');
    const scanning = play([{ type: 'm02.scanner.opened', hasSession: true, k: 1, at: 20 }], [], CTX, trip(1)).state;
    expect(play([tap(1_000)], [], CTX, scanning).state.bubble?.messageId).toBe('MSG-MAS-043');
  });

  it('MAS-B-059: trang nội dung, chạm Mila khi câu 051 đang hiện → 059 thay vào (P3 trên P4)', () => {
    const content = play([
      { type: 'app.route.changed', path: '/trip/qr/Q1a', at: 0 },
      { type: 'm02.visit.recorded', sessionRef: 's', visitRef: 'v1', k: 1, n: 3, isFinal: false, at: 10 },
    ]).state;
    expect(content.bubble?.messageId).toBe('MSG-MAS-051');
    expect(play([tap(2_000)], [], CTX, content).state.bubble?.messageId).toBe('MSG-MAS-059');
  });

  it('MAS-B-065: màn kết quả → 065; chạm lần nữa khi còn hiện (màn chỉ một câu) → không đổi, chữ không nháy lại', () => {
    const end = play([
      { type: 'app.route.changed', path: '/trip/end', at: 0 },
      { type: 'm02.trip.ended', status: 'HOAN_TAT', k: 2, n: 3, justEnded: false, at: 10 },
    ]).state;
    const shown = play([tap(1_000)], [], CTX, end).state;
    expect(shown.bubble?.messageId).toBe('MSG-MAS-065');
    const again = play([tap(1_700)], [], CTX, shown).state;
    expect(again.bubble).toEqual(shown.bubble);
    expect(again.view).toEqual(shown.view);
  });

  it('MAS-B-030: chuyến mới bắt đầu → sau 800 ms câu 030 nói điểm tiếp theo (v1.7)', () => {
    let s = play([
      { type: 'app.route.changed', path: '/trip', at: 0 },
      { type: 'm02.trip.shown', hasSession: true, k: 0, n: 3, finalVisited: false, next: NEXT, at: 10 },
      { type: 'm02.trip.entered', kind: 'STARTED', hasSession: true, k: 0, n: 3, next: NEXT, at: 10 },
    ]).state;
    expect(s.bubble).toBeNull();
    s = play([{ type: 'mascot.tick', at: 810 }], [], CTX, s).state;
    expect(s.bubble).toMatchObject({ messageId: 'MSG-MAS-030', params: { next: NEXT } });
    expect(messageText('vi', 'MSG-MAS-030', s.bubble!.params)).toBe('Điểm tiếp theo: Khu hồ Mạc. Tìm tem QR ở đó rồi bấm Quét QR nhé!');
    expect(messageText('en', 'MSG-MAS-030', s.bubble!.params)).toBe('Next stop: Mac Lake. Find its QR sign there and tap Scan QR!');
  });

  it('v1.7: không có điểm tiếp theo (hành trình rỗng) → không nói 030', () => {
    let s = play([
      { type: 'app.route.changed', path: '/trip', at: 0 },
      { type: 'm02.trip.shown', hasSession: true, k: 0, n: 0, finalVisited: false, next: null, at: 10 },
      { type: 'm02.trip.entered', kind: 'STARTED', hasSession: true, k: 0, n: 0, next: null, at: 10 },
    ]).state;
    s = play([{ type: 'mascot.tick', at: 810 }], [], CTX, s).state;
    expect(s.bubble).toBeNull();
  });

  it('v1.7: tên điểm dài → câu 030 chỉ còn câu đầu; câu đầu cũng quá 90 ký tự → không nói (spec-Mascot §5.6)', () => {
    const long = { vi: 'Đường mòn ven suối dẫn tới hang động cổ', en: 'Streamside trail to the ancient cave' };
    expect(messageText('vi', 'MSG-MAS-030', { next: long })).toBe(`Điểm tiếp theo: ${long.vi}.`);
    const tooLong = { vi: 'x'.repeat(80), en: 'y'.repeat(80) };
    expect(messageText('vi', 'MSG-MAS-030', { next: tooLong })).toBe('');
    let s = play([
      { type: 'app.route.changed', path: '/trip', at: 0 },
      { type: 'm02.trip.shown', hasSession: true, k: 0, n: 3, finalVisited: false, next: tooLong, at: 10 },
      { type: 'm02.trip.entered', kind: 'STARTED', hasSession: true, k: 0, n: 3, next: tooLong, at: 10 },
    ]).state;
    s = play([{ type: 'mascot.tick', at: 810 }], [], CTX, s).state;
    expect(s.bubble).toBeNull();
  });

  it('MAS-B-034: mở lại app giữa chuyến sau ≥ 10 phút → 034; dưới 10 phút → không', () => {
    const hidden = play([{ type: 'app.visibility.changed', visible: false, at: 100 }], [], CTX, trip(1)).state;
    expect(play([{ type: 'app.visibility.changed', visible: true, at: 100 + 10 * 60_000 }], [], CTX, hidden).state.bubble?.messageId).toBe('MSG-MAS-034');
    expect(play([{ type: 'app.visibility.changed', visible: true, at: 100 + 5 * 60_000 }], [], CTX, hidden).state.bubble).toBeNull();
  });

  it('MAS-B-056: quay về hành trình từ nội dung của lượt ghé mới → 056 một lần; không phải lượt ghé mới → không', () => {
    const back = (afterNewVisit: boolean, next: { vi: string; en: string } | null = NEXT) =>
      play([
        { type: 'app.route.changed', path: '/trip/qr/Q1a', at: 0 },
        { type: 'm02.content.backPressed', afterNewVisit, at: 5_000 },
        { type: 'app.route.changed', path: '/trip', at: 5_010 },
        { type: 'm02.trip.shown', hasSession: true, k: 1, n: 3, finalVisited: false, next, at: 5_020 },
      ]).state;
    // DV-05 (specs/006): trước tiên Mila ngạc nhiên (không lời) trong lúc điểm được mở khóa
    const first = back(true);
    expect(first.view).toMatchObject({ mode: 'DOCK', pose: 'amazed' });
    expect(first.bubble).toBeNull();
    // Hết lúc ngạc nhiên: sải bước và nói 056 (v1.4, Behavior Matrix §3b; specs/006 T041)
    const spoken = play([{ type: 'mascot.tick', at: first.hold!.until }], [], CTX, first).state;
    expect(spoken.bubble?.messageId).toBe('MSG-MAS-056');
    expect(messageText('vi', 'MSG-MAS-056', spoken.bubble!.params)).toBe('Điểm tiếp theo: Khu hồ Mạc. Tham quan xong thì đi tiếp và quét mã nhé!');
    expect(spoken.view).toMatchObject({ mode: 'DOCK', pose: 'walk', animation: 'walk' });
    expect(back(false).bubble).toBeNull();
    // v1.7: không có điểm tiếp theo → ngạc nhiên rồi về tư thế ngữ cảnh, không bong bóng (BR-MAS-13)
    const none = back(true, null);
    const settled = play([{ type: 'mascot.tick', at: none.hold!.until }], [], CTX, none).state;
    expect(settled.bubble).toBeNull();
    expect(settled.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
  });

  it('MAS-B-089: chạm dồn trong 400 ms tính một lần (không chạy lại animation)', () => {
    const first = play([tap(1_000)], [], CTX, catalogDock()).state;
    const again = play([tap(1_200)], [], CTX, first).state;
    expect(again.view).toEqual(first.view);
    expect(again.bubble).toEqual(first.bubble);
  });

  it('MAS-B-085: chạm 5 lần trong 3 giây → chóng mặt (ảnh bối rối, 085) một lần mỗi lần tải trang', () => {
    let s = catalogDock();
    s = play([tap(1_000), tap(1_500), tap(2_000), tap(2_500), tap(3_000)], [], CTX, s).state;
    expect(s.bubble?.messageId).toBe('MSG-MAS-085');
    expect(s.view).toMatchObject({ pose: 'confused', animation: 'dizzy' });
    s = play([{ type: 'mascot.user.closedBubble', at: 3_500 }, tap(4_000), tap(4_500), tap(5_000), tap(5_500), tap(6_000)], [], CTX, s).state;
    expect(s.bubble?.messageId).not.toBe('MSG-MAS-085');
  });
});


describe('v1.1/v1.2 — Ba cấp ăn mừng và câu xác nhận lượt ghé (BR-MAS-23, 24)', () => {
  const content: Stamped = { type: 'app.route.changed', path: '/trip/qr/Q1a', at: 0 };
  const visit = (k: number, n: number): Stamped => ({ type: 'm02.visit.recorded', sessionRef: 's', visitRef: `s:c${k}`, k, n, isFinal: false, at: 10 });
  const at = (k: number, n: number) => play([content, visit(k, n)]).state;

  it('cấp 1 — điểm thường: nhún một lần (success), câu 050 "Đã ghi nhận…", P4', () => {
    const s = at(4, 6);
    expect(s.view).toMatchObject({ mode: 'AVATAR', animation: 'success' });
    expect(s.bubble).toMatchObject({ messageId: 'MSG-MAS-050', priority: 4 });
  });

  it('cấp 2 — mốc: đầu tiên 051, nửa chặng 055 (n ≥ 4), còn một điểm 058 (n ≥ 3); nhảy hai lần + lá (milestone), P4', () => {
    expect(at(1, 4)).toMatchObject({ view: { animation: 'milestone' }, bubble: { messageId: 'MSG-MAS-051', priority: 4 } });
    expect(at(2, 4)).toMatchObject({ view: { animation: 'milestone' }, bubble: { messageId: 'MSG-MAS-055', priority: 4 } });
    expect(at(3, 4)).toMatchObject({ view: { animation: 'milestone' }, bubble: { messageId: 'MSG-MAS-058', priority: 4 } });
    expect(at(2, 3).bubble?.messageId).toBe('MSG-MAS-058');
  });

  it('thứ tự ưu tiên: đầu tiên thắng còn-một-điểm (n = 2, k = 1); n = 3, k = 2 → còn một điểm (không có mốc nửa khi n < 4)', () => {
    expect(at(1, 2).bubble?.messageId).toBe('MSG-MAS-051');
    expect(at(2, 3).bubble?.messageId).toBe('MSG-MAS-058');
  });

  it('cấp 3 — kết thúc chuyến: quét đủ mọi điểm → MAS-B-064 / 063; kết thúc sớm → 062', () => {
    const end: Stamped = { type: 'app.route.changed', path: '/trip/end', at: 0 };
    const full = play([end, { type: 'm02.trip.ended', status: 'HOAN_TAT', k: 3, n: 3, justEnded: true, at: 10 }]).state;
    expect(full.view).toMatchObject({ mode: 'CELEBRATE', behaviorId: 'MAS-B-064' });
    expect(full.bubble).toMatchObject({ messageId: 'MSG-MAS-063', params: { n: 3 } });
    const early = play([end, { type: 'm02.trip.ended', status: 'HOAN_TAT', k: 2, n: 3, justEnded: true, at: 10 }]).state;
    expect(early.bubble).toMatchObject({ messageId: 'MSG-MAS-062', params: { k: 2 } });
  });
});

describe('v1.1 — Cử chỉ tự động nhường du khách đang thao tác (BR-MAS-20, 21; Q25)', () => {
  const zero = { ...CTX, random: () => 0 };
  const catalog: Stamped[] = [
    { type: 'app.route.changed', path: '/', at: 0 },
    { type: 'm01.catalog.loaded', status: 'ready', count: 3, stale: false, slow: false, at: 10 },
    { type: 'mascot.tick', at: 700 },
    { type: 'mascot.user.closedBubble', at: 800 },
  ];

  it('cuộn danh mục ngay trước hạn cử chỉ → không cử chỉ; hẹn lại 4–7 s sau (v1.5)', () => {
    const s = play([...catalog, { type: 'app.user.activity', at: 4_000 }], [], zero).state;
    const due = s.timers['ambient']!;
    const skipped = play([{ type: 'mascot.tick', at: due }], [], zero, s).state;
    expect(skipped.view?.behaviorId).not.toBe('MAS-B-086');
    expect(skipped.timers['ambient']).toBe(due + 4_000);
  });

  it('trang đọc bài không có cử chỉ tự động', () => {
    const s = play([{ type: 'app.route.changed', path: '/trip/qr/Q1a', at: 0 }, { type: 'm02.scan.resolved', display: 'LIVE', hasSession: true, freeVisitor: false, visitCreated: false, inJourney: true, finalPromptNeeded: false, at: 10 }], [], zero).state;
    expect(s.timers['ambient']).toBeUndefined();
  });
});

describe('v1.1 — Chớp mắt (AN-BLINK, MAS-TC-122; research R-24)', () => {
  it('cử chỉ chớp mắt chỉ có khi tư thế hiện tại có ảnh mắt nhắm', () => {
    expect(ambientGestures('map').map((g) => g.id)).toContain('blink');
    expect(ambientGestures('rest').map((g) => g.id)).toContain('blink');
    expect(ambientGestures('cheer').map((g) => g.id)).not.toContain('blink');
    expect(ambientGestures('wave').map((g) => g.id)).not.toContain('blink');
  });

  it('chớp mắt ở danh mục: giữ nguyên tư thế, animation blink, không chữ; rồi về tư thế cũ', () => {
    const gestures = ambientGestures('map');
    const index = gestures.findIndex((g) => g.id === 'blink');
    // random chọn đúng vị trí của "blink" trong nhóm (không có cử chỉ trước)
    const pick = { ...CTX, random: () => (index + 0.5) / gestures.length };
    let s = play(
      [
        { type: 'app.route.changed', path: '/', at: 0 },
        { type: 'm01.catalog.loaded', status: 'ready', count: 3, stale: false, slow: false, at: 10 },
        { type: 'mascot.tick', at: 700 },
        { type: 'mascot.user.closedBubble', at: 800 },
      ],
      [],
      pick,
    ).state;
    s = play([{ type: 'mascot.tick', at: s.timers['ambient']! }], [], pick, s).state;
    expect(s.view).toMatchObject({ mode: 'DOCK', pose: 'map', animation: 'blink', behaviorId: 'MAS-B-086' });
    expect(s.bubble).toBeNull();
    const back = play([{ type: 'mascot.tick', at: s.hold!.until }], [], pick, s).state;
    expect(back.view).toMatchObject({ pose: 'map', animation: 'settle' });
  });
});

describe('US7 — Chuẩn bị cùng Mila (US-MAS-07; T056)', () => {
  const catalog = (status: 'ready' | 'unavailable' | 'loading', at: number, slow = false): Stamped => ({ type: 'm01.catalog.loaded', status, count: 3, stale: false, slow, at });
  /** Danh mục đã mở, câu chào lại 004 đã đóng: Mila đứng ở hero */
  const onCatalog = () =>
    play([{ type: 'app.route.changed', path: '/', at: 0 }, catalog('ready', 100), { type: 'mascot.tick', at: 700 }, { type: 'mascot.user.closedBubble', at: 800 }]).state;

  it('MAS-B-005: danh mục tải quá 600 ms → "đang mở bản đồ" ở DOCK, không tự ẩn; tải xong → bong bóng đóng, Mila về hero', () => {
    let { state } = play([{ type: 'app.route.changed', path: '/', at: 0 }, catalog('loading', 600, true)]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'map', animation: 'search' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-005', expiresAt: null });
    state = play([catalog('ready', 900)], [], CTX, state).state;
    expect(state.bubble?.messageId).not.toBe('MSG-MAS-005');
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
  });

  it('MAS-B-005: nguồn lỗi cũng đóng câu "đang mở bản đồ"', () => {
    const { state } = play([{ type: 'app.route.changed', path: '/', at: 0 }, catalog('loading', 600, true), catalog('unavailable', 2_000)]);
    expect(state.bubble).toBeNull();
  });

  it('MAS-B-008: 20 s không thao tác trên danh mục → gợi ý một lần, có nút "Gợi ý tuyến", không tự ẩn', () => {
    let state = onCatalog();
    state = play([{ type: 'mascot.tick', at: 20_099 }], [], CTX, state).state;
    expect(state.bubble).toBeNull();
    state = play([{ type: 'mascot.tick', at: 20_100 }], [], CTX, state).state;
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-008', expiresAt: null });
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'point' });
    // Bấm "Gợi ý tuyến" (host điều hướng) → bong bóng đóng; lần sau không gợi ý lại
    state = play([{ type: 'mascot.user.ctaPressed', cta: 'recommend', at: 21_000 }, catalog('ready', 30_000), { type: 'mascot.tick', at: 50_000 }], [], CTX, state).state;
    expect(state.bubble).toBeNull();
  });

  it('MAS-B-008: chạm hoặc bấm phím đếm lại từ đầu (BR-MAS-09)', () => {
    let state = play([{ type: 'app.user.activity', at: 10_000 }], [], CTX, onCatalog()).state;
    state = play([{ type: 'mascot.tick', at: 20_100 }], [], CTX, state).state;
    expect(state.bubble).toBeNull();
    state = play([{ type: 'mascot.tick', at: 30_000 }], [], CTX, state).state;
    expect(state.bubble?.messageId).toBe('MSG-MAS-008');
  });

  it('MAS-B-008: đã cuộn danh mục hoặc đã mở một tuyến → không gợi ý; cuộn khi đang gợi ý thì bong bóng đóng', () => {
    const scrolled = play([{ type: 'm01.catalog.interacted', at: 5_000 }, { type: 'mascot.tick', at: 20_100 }, { type: 'mascot.tick', at: 60_000 }], [], CTX, onCatalog()).state;
    expect(scrolled.bubble).toBeNull();

    const opened = play(
      [{ type: 'app.route.changed', path: '/routes/r1', at: 5_000 }, { type: 'app.route.changed', path: '/', at: 6_000 }, catalog('ready', 6_100), { type: 'mascot.tick', at: 30_000 }],
      [],
      CTX,
      onCatalog(),
    ).state;
    expect(opened.bubble).toBeNull();

    const shown = play([{ type: 'mascot.tick', at: 20_100 }], [], CTX, onCatalog()).state;
    expect(shown.bubble?.messageId).toBe('MSG-MAS-008');
    expect(play([{ type: 'm01.catalog.interacted', at: 21_000 }], [], CTX, shown).state.bubble).toBeNull();
  });

  it('MAS-B-088 + 010 (v1.5): mở Gợi ý tuyến → Mila đứng DOCK ngay, sau 400 ms câu 010; mở lại mỗi lần đều nói, × chỉ đóng câu', () => {
    let { state } = play([{ type: 'app.route.changed', path: '/recommend', at: 0 }, { type: 'm01.recommend.opened', at: 10 }, { type: 'mascot.tick', at: 409 }]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'map', behaviorId: 'MAS-B-088' });
    expect(state.bubble).toBeNull();
    state = play([{ type: 'mascot.tick', at: 410 }], [], CTX, state).state;
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
    expect(state.bubble?.messageId).toBe('MSG-MAS-010');
    // × đóng câu: Mila vẫn đứng ở DOCK (không biến mất, không để khoảng trống)
    const closed = play([{ type: 'mascot.user.closedBubble', at: 1_000 }], [], CTX, state).state;
    expect(closed.bubble).toBeNull();
    expect(closed.view).toMatchObject({ mode: 'DOCK', behaviorId: 'MAS-B-088' });
    // Mở lại nhiều lần trong 10 phút: mỗi lần đều nói (không cooldown, không tính vào BR-MAS-07)
    for (const at of [5_000, 10_000, 15_000, 20_000]) {
      state = play(
        [{ type: 'app.route.changed', path: '/', at }, { type: 'app.route.changed', path: '/recommend', at: at + 100 }, { type: 'm01.recommend.opened', at: at + 110 }, { type: 'mascot.tick', at: at + 600 }],
        [],
        CTX,
        state,
      ).state;
      expect(state.bubble?.messageId).toBe('MSG-MAS-010');
    }
  });

  it('MAS-B-011 (v1.5): có kết quả → câu 011 (P4) với Mila DOCK cạnh tiêu đề; không có kết quả → không câu, không DOCK (chỉ hình cạnh câu cố định)', () => {
    const results = play([{ type: 'app.route.changed', path: '/recommend/results', at: 0 }, { type: 'm01.recommend.resolved', count: 2, at: 10 }]).state;
    expect(results.view).toMatchObject({ mode: 'DOCK', pose: 'thumbsUp' });
    expect(results.bubble).toMatchObject({ messageId: 'MSG-MAS-011', priority: 4 });

    const empty = play([{ type: 'app.route.changed', path: '/recommend/results', at: 0 }, { type: 'm01.recommend.resolved', count: 0, at: 10 }, { type: 'm01.recommend.resolved', count: 0, at: 2_000 }]).state;
    expect(empty.bubble).toBeNull();
    expect(empty.view).toBeNull();
  });

  it('MAS-B-014 (v1.6): tuyến có cảnh báo an toàn → sau 500 ms nhắc ở slot panel Bắt đầu, mỗi lần vào màn', () => {
    const visible = (routeRef: string, hasSafetyWarning: boolean, at: number): Stamped => ({ type: 'm01.routeDetail.startPanelVisible', routeRef, hasSafetyWarning, at });
    let { state } = play([{ type: 'app.route.changed', path: '/routes/r1', at: 0 }, visible('r1', true, 100), { type: 'mascot.tick', at: 600 }]);
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'point', slot: 'start-panel' });
    expect(state.bubble?.messageId).toBe('MSG-MAS-014');
    // Quay lại cùng tuyến: nhắc lại (v1.6, D3); tuyến khác có cảnh báo: nhắc
    state = play(
      [{ type: 'app.route.changed', path: '/', at: 10_000 }, { type: 'app.route.changed', path: '/routes/r1', at: 11_000 }, visible('r1', true, 11_100), { type: 'mascot.tick', at: 11_600 }],
      [],
      CTX,
      state,
    ).state;
    expect(state.bubble?.messageId).toBe('MSG-MAS-014');
    state = play([{ type: 'app.route.changed', path: '/routes/r2', at: 20_000 }, visible('r2', true, 20_100), { type: 'mascot.tick', at: 20_600 }], [], CTX, state).state;
    expect(state.bubble?.messageId).toBe('MSG-MAS-014');

    const noWarning = play([{ type: 'app.route.changed', path: '/routes/r3', at: 0 }, visible('r3', false, 100), { type: 'mascot.tick', at: 600 }]).state;
    expect(noWarning.bubble).toBeNull();
  });

  describe('gói tải trước (MAS-B-020…026)', () => {
    type Resolved = Extract<MascotEvent, { type: 'm01.package.resolved' }>;
    const started = (at: number, update = false): Stamped => ({ type: 'm01.package.downloadStarted', routeRef: 'r1', update, at });
    const resolved = (at: number, over: Partial<Resolved> = {}): Stamped => {
      const event: Resolved = { type: 'm01.package.resolved', routeRef: 'r1', kind: 'failed', reason: 'download', update: false, online: true, ...over };
      if (event.kind !== 'failed') delete event.reason;
      return { ...event, at };
    };
    const onDetail = (events: Stamped[]) => play([{ type: 'app.route.changed', path: '/routes/r1', at: 0 }, ...events]).state;

    it('MAS-B-020 → 021: bắt đầu tải → "xếp vào ba lô" ở slot gói, không tự ẩn; xong → câu 021', () => {
      let state = onDetail([started(100)]);
      expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'backpack', animation: 'pack', slot: 'package-panel' });
      expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-020', expiresAt: null });
      state = play([resolved(5_000, { kind: 'ready' })], [], CTX, state).state;
      expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'thumbsUp', slot: 'package-panel' });
      expect(state.bubble?.messageId).toBe('MSG-MAS-021');
    });

    it('MAS-B-024/025 (v1.2): lỗi lần đầu → câu "đang tải" đóng, Mila rời slot; hình INLINE do màn đặt', () => {
      for (const reason of ['source', 'download', 'storage'] as const) {
        const state = onDetail([started(100), resolved(2_000, { reason })]);
        expect(state).toMatchObject({ bubble: null, view: null });
      }
    });

    it('MAS-B-026: lỗi lần 2 liên tiếp cùng tuyến khi có mạng → câu 026; offline, cập nhật hay lần 1 → không', () => {
      const twice = onDetail([started(100), resolved(2_000), started(3_000), resolved(4_000)]);
      expect(twice.view).toMatchObject({ mode: 'AVATAR', pose: 'backpack', slot: 'package-panel' });
      expect(twice.bubble).toMatchObject({ messageId: 'MSG-MAS-026', priority: 2 });

      expect(onDetail([started(100), resolved(2_000), started(3_000), resolved(4_000, { online: false })]).bubble).toBeNull();
      expect(onDetail([started(100, true), resolved(2_000, { update: true }), started(3_000, true), resolved(4_000, { update: true })]).bubble).toBeNull();
      // Thành công ở giữa → đếm lại từ đầu (câu 021 ở lại 15 s sau khi hiện, v1.5)
      expect(onDetail([started(100), resolved(2_000), started(3_000), resolved(4_000, { kind: 'ready' }), { type: 'mascot.tick', at: 20_000 }, started(21_000), resolved(22_000)]).bubble).toBeNull();
    });

    it('MAS-B-026: hai lần tải lỗi nhanh (trong 500 ms) vẫn là hai thao tác, không bị chống trùng', () => {
      expect(onDetail([started(100), resolved(150), started(300), resolved(350)]).bubble?.messageId).toBe('MSG-MAS-026');
    });

    it('thao tác bận (đang tải ở tab khác) → câu "đang tải" đóng', () => {
      expect(onDetail([started(100), resolved(200, { kind: 'busy' })]).bubble).toBeNull();
    });

    it('không câu nào của gói nói phần trăm (US-MAS-07 mục 1)', () => {
      for (const id of ['MSG-MAS-020', 'MSG-MAS-021', 'MSG-MAS-024', 'MSG-MAS-025', 'MSG-MAS-026'] as const) {
        for (const language of ['vi', 'en'] as const) expect(messageText(language, id)).not.toMatch(/%|phần trăm|percent/i);
      }
    });
  });
});

describe('US5 — Mila giúp khi quét khó (US-MAS-03; T047)', () => {
  type Resolved = Extract<MascotEvent, { type: 'm02.scan.resolved' }>;
  const shown = (k: number, at: number): Stamped => ({ type: 'm02.trip.shown', hasSession: true, k, n: 3, finalVisited: false, next: NEXT, at });
  const opened = (k: number, at: number, hasSession = true): Stamped => ({ type: 'm02.scanner.opened', hasSession, k, at });
  const started = (at: number): Stamped => ({ type: 'm02.scanner.cameraStarted', at });
  const resolved = (display: Resolved['display'], at: number): Stamped => ({
    type: 'm02.scan.resolved',
    display,
    hasSession: true,
    freeVisitor: false,
    visitCreated: false,
    inJourney: false,
    finalPromptNeeded: false,
    at,
  });
  /** Màn chuyến đi có phiên, k điểm đã quét; Mila đứng ở DOCK */
  const onTrip = (k = 1) => play([{ type: 'app.route.changed', path: '/trip', at: 0 }, shown(k, 10)]).state;
  const run = (state: MascotState, events: Stamped[], ctx = CTX) => play(events, [], ctx, state).state;

  it('MAS-B-040 (v1.2): mở scanner khi chưa có lượt ghé → 600 ms sau khi camera chạy, Mila minh họa ở dải dưới (không chữ), tự ẩn; một lần mỗi lần tải trang', () => {
    let state = run(onTrip(0), [opened(0, 1_000), started(1_200), { type: 'mascot.tick', at: 1_799 }]);
    expect(state.view?.mode).toBe('DOCK');
    state = run(state, [{ type: 'mascot.tick', at: 1_800 }]);
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'point', animation: 'tilt', slot: 'scanner-bottom' });
    expect(state.bubble).toBeNull();
    state = run(state, [{ type: 'mascot.tick', at: 6_000 }]);
    expect(state.view).toBeNull();
    // Đóng rồi mở lại: không minh họa nữa; Mila về DOCK
    state = run(state, [{ type: 'm02.scanner.closed', at: 7_000 }]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'binoculars' });
    state = run(state, [opened(0, 8_000), started(8_100), { type: 'mascot.tick', at: 8_800 }]);
    expect(state.view?.mode).toBe('DOCK');
  });

  it('mở scanner khi câu bắt đầu chuyến (030) còn hiện ở DOCK → câu đóng, minh họa 040 vẫn tới (BR-MAS-20)', () => {
    let state = play([{ type: 'app.route.changed', path: '/trip', at: 0 }, { type: 'm02.trip.entered', kind: 'STARTED', hasSession: true, k: 0, n: 3, next: NEXT, at: 5 }, shown(0, 10)]).state;
    state = run(state, [{ type: 'mascot.tick', at: 810 }]);
    expect(state.bubble?.messageId).toBe('MSG-MAS-030');
    state = run(state, [opened(0, 1_000), started(1_100), { type: 'mascot.tick', at: 1_700 }]);
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'point', slot: 'scanner-bottom' });
    expect(state.bubble).toBeNull();
  });

  it('câu bắt đầu chuyến (030) tới hạn khi scanner đang mở → không nói sau lớp scanner', () => {
    const state = run(play([{ type: 'app.route.changed', path: '/trip', at: 0 }, { type: 'm02.trip.entered', kind: 'STARTED', hasSession: true, k: 0, n: 3, at: 5 }, shown(0, 10)]).state, [
      opened(0, 300),
      { type: 'mascot.tick', at: 810 },
    ]);
    expect(state.bubble).toBeNull();
  });

  it('MAS-B-040: khách tự do cũng được minh họa; đã có lượt ghé thì không', () => {
    const free = run(play([{ type: 'app.route.changed', path: '/trip', at: 0 }]).state, [opened(0, 100, false), started(200), { type: 'mascot.tick', at: 800 }]);
    expect(free.view).toMatchObject({ mode: 'AVATAR', pose: 'point' });
    const visited = run(onTrip(1), [opened(1, 100), started(200), { type: 'mascot.tick', at: 800 }]);
    expect(visited.view?.mode).toBe('DOCK');
  });

  it('MAS-B-041, 042, 049: camera chạy mà chưa đọc được mã → 15 s nhìn quanh, 30 s hỏi giúp một lần, 90 s gợi ý tắt camera', () => {
    let state = run(onTrip(1), [opened(1, 0), started(0), { type: 'mascot.tick', at: 15_000 }]);
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'binoculars', animation: 'look', slot: 'scanner-bottom' });
    expect(state.bubble).toBeNull();
    state = run(state, [{ type: 'mascot.tick', at: 30_000 }]);
    expect(state.bubble?.messageId).toBe('MSG-MAS-042');
    expect(state.view).toMatchObject({ mode: 'AVATAR', slot: 'scanner-bottom' });
    state = run(state, [{ type: 'mascot.tick', at: 45_000 }, { type: 'mascot.tick', at: 90_000 }]);
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-049', expiresAt: null });
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'rest' });
    // "Chưa" đóng bong bóng; sau đó im lặng tới khi đóng scanner
    state = run(state, [{ type: 'mascot.user.ctaPressed', cta: 'notNow', at: 91_000 }, { type: 'mascot.tick', at: 300_000 }]);
    expect(state.bubble).toBeNull();
    expect(state.timers).toEqual({});
  });

  it('BR-MAS-09: thao tác trong lúc quét đếm lại các mốc; công tắc chuyển động tắt → không nhìn quanh', () => {
    let state = run(onTrip(1), [opened(1, 0), started(0), { type: 'app.user.activity', at: 10_000 }, { type: 'mascot.tick', at: 15_000 }]);
    expect(state.view?.mode).toBe('DOCK');
    state = run(state, [{ type: 'mascot.tick', at: 25_000 }]);
    expect(state.view).toMatchObject({ mode: 'AVATAR', animation: 'look' });

    const still = run(onTrip(1), [{ type: 'mascot.motion.changed', on: false, at: 1 }, opened(1, 2), started(3), { type: 'mascot.tick', at: 15_003 }]);
    expect(still.view?.mode).toBe('DOCK');
  });

  it('đóng scanner hay camera lỗi (MAS-B-038) → hủy các mốc 15/30/90 s', () => {
    expect(run(onTrip(1), [opened(1, 0), started(0), { type: 'm02.scanner.closed', at: 5_000 }]).timers).not.toHaveProperty('scanHelp');
    const failed = run(onTrip(1), [opened(1, 0), started(0), { type: 'm02.scanner.cameraFailed', at: 5_000 }, { type: 'mascot.tick', at: 30_000 }]);
    expect(failed.bubble).toBeNull();
  });

  it('MAS-B-043 → 044: đọc được mã → Mila kiểm tra ở DOCK (BUSY); quá 3 s → "sóng hơi yếu"; có kết quả → câu đóng, về tư thế hành trình', () => {
    let state = run(onTrip(1), [opened(1, 0), started(0), { type: 'm02.scanner.detected', at: 5_000 }, { type: 'm02.scanner.closed', at: 5_010 }]);
    expect(state.status).toBe('BUSY');
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'magnifier', animation: 'search' });
    state = run(state, [{ type: 'mascot.tick', at: 8_000 }]);
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-044', expiresAt: null });
    state = run(state, [resolved('CONNECTION_NEEDED', 9_000)]);
    expect(state.bubble).toBeNull();
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
    expect(state.status).toBe('IDLE');
  });

  it('MAS-B-046: hai lần liên tiếp mã không hợp lệ → câu 046; lần đầu chỉ là hình cạnh câu cố định', () => {
    let state = run(onTrip(1), [{ type: 'm02.scanner.detected', at: 1_000 }, resolved('INVALID', 1_100)]);
    expect(state.bubble).toBeNull();
    state = run(state, [{ type: 'm02.scanner.detected', at: 5_000 }, resolved('INVALID', 5_100)]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'confused' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-046', priority: 2, expiresAt: null });
    // Đóng → về tư thế hành trình
    state = run(state, [{ type: 'mascot.user.closedBubble', at: 6_000 }]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'map' });
  });

  it('MAS-B-047/048: hai lần liên tiếp cần kết nối → câu 048; kết quả khác ở giữa hay đổi màn → đếm lại', () => {
    const twice = run(onTrip(1), [resolved('CONNECTION_NEEDED', 1_000), resolved('CONNECTION_NEEDED', 3_000)]);
    expect(twice.bubble?.messageId).toBe('MSG-MAS-048');
    expect(twice.view).toMatchObject({ mode: 'DOCK', pose: 'point' });

    expect(run(onTrip(1), [resolved('CONNECTION_NEEDED', 1_000), resolved('INVALID', 3_000), resolved('CONNECTION_NEEDED', 5_000)]).bubble).toBeNull();
    const left = run(onTrip(1), [
      resolved('INVALID', 1_000),
      { type: 'app.route.changed', path: '/trip/end', at: 2_000 },
      { type: 'app.route.changed', path: '/trip', at: 3_000 },
      shown(1, 3_010),
      resolved('INVALID', 4_000),
    ]);
    expect(left.bubble).toBeNull();
  });
});

describe('US6 — Bình tĩnh về mạng và dữ liệu (US-MAS-04; T052)', () => {
  type Resolved = Extract<MascotEvent, { type: 'm02.scan.resolved' }>;
  const shown = (at: number): Stamped => ({ type: 'm02.trip.shown', hasSession: true, k: 1, n: 3, finalVisited: false, at });
  const network = (online: boolean, at: number): Stamped => ({ type: 'app.network.changed', online, at });
  const tick = (at: number): Stamped => ({ type: 'mascot.tick', at });
  const onTrip = () => play([{ type: 'app.route.changed', path: '/trip', at: 0 }, shown(10)]).state;
  const run = (state: MascotState, events: Stamped[]) => play(events, [], CTX, state).state;
  const content = (over: Partial<Resolved>): Stamped[] => [
    { type: 'app.route.changed', path: '/trip/qr/Q9', at: 0 },
    {
      type: 'm02.scan.resolved',
      display: 'LIVE',
      hasSession: true,
      freeVisitor: false,
      visitCreated: false,
      inJourney: false,
      finalPromptNeeded: false,
      ...over,
      at: 100,
    },
  ];

  it('MAS-B-074: mất sóng giữa chuyến → sau 1 s Mila trấn an ở DOCK; có sóng lại trước 1 s → không nói', () => {
    let state = run(onTrip(), [network(false, 1_000), tick(1_999)]);
    expect(state.bubble).toBeNull();
    state = run(state, [tick(2_000)]);
    expect(state.view).toMatchObject({ mode: 'DOCK', pose: 'backpack' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-074', priority: 5 });

    expect(run(onTrip(), [network(false, 1_000), network(true, 1_500), tick(2_000)]).bubble).toBeNull();
  });

  it('MAS-B-074: không phiên, scanner đang mở, hay đang đọc nội dung (BR-MAS-20) → không nói', () => {
    const free = play([{ type: 'app.route.changed', path: '/trip', at: 0 }, network(false, 1_000), tick(2_000)]).state;
    expect(free.bubble).toBeNull();
    const scanning = run(onTrip(), [{ type: 'm02.scanner.opened', hasSession: true, k: 1, at: 500 }, network(false, 1_000), tick(2_000)]);
    expect(scanning.bubble).toBeNull();
    const reading = run(onTrip(), [{ type: 'app.route.changed', path: '/trip/qr/Q1a', at: 500 }, network(false, 1_000), tick(2_000)]);
    expect(reading.bubble).toBeNull();
  });

  it('MAS-B-074: tối đa một lần mỗi 10 phút (cooldown)', () => {
    let state = run(onTrip(), [network(false, 1_000), tick(2_000), tick(20_000)]);
    state = run(state, [network(true, 30_000), tick(31_000), tick(60_000), network(false, 120_000), tick(121_000)]);
    expect(state.bubble?.messageId).not.toBe('MSG-MAS-074');
  });

  it('MAS-B-075: có sóng lại trong 30 phút sau 074 → "Có sóng lại rồi!"; không có 074 trước đó hay quá 30 phút → không', () => {
    const back = run(onTrip(), [network(false, 1_000), tick(2_000), tick(20_000), network(true, 60_000), tick(61_000)]);
    expect(back.bubble).toMatchObject({ messageId: 'MSG-MAS-075' });
    expect(back.view).toMatchObject({ mode: 'DOCK', pose: 'thumbsUp' });

    expect(run(onTrip(), [network(true, 1_000), tick(2_000)]).bubble).toBeNull();
    const late = run(onTrip(), [network(false, 1_000), tick(2_000), tick(20_000), network(true, 31 * 60_000), tick(31 * 60_000 + 1_000)]);
    expect(late.bubble).toBeNull();
  });

  it('MAS-B-052: có phiên, mã live ngoài hành trình, không lượt ghé → câu 052 ở AVATAR (P2)', () => {
    const state = play(content({})).state;
    expect(state.view).toMatchObject({ mode: 'AVATAR', pose: 'think' });
    expect(state.bubble).toMatchObject({ messageId: 'MSG-MAS-052', priority: 2 });
  });

  it('MAS-B-052: khách tự do, mã trong hành trình hay có lượt ghé mới → không; nội dung bản tải sẵn (054) chỉ là hình (v1.2)', () => {
    expect(play(content({ hasSession: false, freeVisitor: true })).state.bubble).toBeNull();
    expect(play(content({ inJourney: true })).state.bubble).toBeNull();
    expect(play(content({ display: 'PACKAGE', inJourney: true })).state.bubble).toBeNull();
  });
});
