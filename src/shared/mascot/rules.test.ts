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
