// Host của Mila (specs/005 research R-02, R-10…R-15; mascot-ui-contract §3). Gắn một lần trong App: nghe bus, chạy
// máy trạng thái thuần, render vào slot của màn đang mở bằng portal, thực thi hẹn giờ và rung. Không đọc/ghi dữ liệu
// nghiệp vụ (BR-MAS-01); mọi lỗi làm Mila ẩn, màn chạy như cũ (BR-MAS-16).
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveDisplayLanguage, useLanguagePreference } from '../../modules/m01/index';
import { MESSAGE_META, messageText } from '../../shared/mascot/dialogue/catalog';
import { subscribeMascotEvents, type CtaId, type MascotEvent, type StampedEvent } from '../../shared/mascot/events';
import { initialState, nextDeadline, step, type MascotState, type Mode, type Rule, type StepContext } from '../../shared/mascot/machine';
import { RULES } from '../../shared/mascot/rules';
import { useMotion } from '../../shared/mascot/motion';
import { useSlots, type SlotEntry } from '../../shared/mascot/slots';
import { markMascotFailed, markVisitConfirmed } from '../../shared/mascot/visitConfirm';
import { PATHS } from '../paths';
import { Mascot } from './Mascot';
import { MascotBoundary } from './MascotBoundary';
import { MascotIntro } from './MascotIntro';

type Props = {
  pathname: string;
  navigate: (path: string) => void;
  /** Chỉ test truyền bảng luật riêng */
  rules?: readonly Rule[];
};

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
/** Gộp thao tác liên tục (cuộn) thành tối đa một sự kiện mỗi khoảng này (research R-19). */
const ACTIVITY_COALESCE_MS = 250;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll'] as const;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION).matches);
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

const modesOf = (slots: readonly SlotEntry[]): Mode[] => [...new Set(slots.flatMap((slot) => slot.modes))];

/** Câu xác nhận lượt ghé thay toast (BR-MAS-24) */
const VISIT_CONFIRMS: ReadonlySet<string> = new Set(['MSG-MAS-050', 'MSG-MAS-051', 'MSG-MAS-055', 'MSG-MAS-058']);
const VISIT_ONCE = 'VISIT:';

function Host({ pathname, navigate, rules = RULES }: Props) {
  const slots = useSlots();
  const stored = useLanguagePreference();
  const language = resolveDisplayLanguage(stored, typeof navigator === 'undefined' ? undefined : navigator.language);
  const reducedMotion = useReducedMotion();

  const [state, setState] = useState<MascotState>(initialState);
  const stateRef = useRef(state);
  // Công tắc "Chuyển động" tắt có tác dụng như giảm chuyển động cho Mila: không animation, không lá rơi, chữ hiện ngay (BR-MAS-21)
  const motion = useMotion();
  const still = reducedMotion || !motion;
  const typing = !still;
  const ctxRef = useRef<StepContext>({ availableModes: modesOf(slots), reducedMotion, language, typing, random: Math.random });
  const broken = useRef(false);

  useLayoutEffect(() => {
    ctxRef.current = { availableModes: modesOf(slots), reducedMotion, language, typing, random: Math.random };
  }, [slots, reducedMotion, language, typing]);

  const dispatch = useCallback(
    (event: StampedEvent) => {
      if (broken.current) return;
      try {
        const { state: next, effects } = step(stateRef.current, event, ctxRef.current, rules);
        stateRef.current = next;
        setState(next);
        for (const effect of effects) {
          try {
            navigator.vibrate?.(effect.ms);
          } catch {
            // Trình duyệt không cho rung: coi như không hỗ trợ (research R-14)
          }
        }
      } catch {
        broken.current = true;
        const hidden = { ...initialState(), failed: true };
        stateRef.current = hidden;
        setState(hidden);
      }
    },
    [rules],
  );

  const send = useCallback((event: MascotEvent) => dispatch({ ...event, at: Date.now() } as StampedEvent), [dispatch]);

  useEffect(() => subscribeMascotEvents(dispatch), [dispatch]);
  useEffect(() => send({ type: 'app.route.changed', path: pathname }), [pathname, send]);
  useEffect(() => send({ type: 'mascot.slots.changed' }), [slots, send]);
  // Engine biết trạng thái công tắc ngay từ đầu (thiết bị giảm chuyển động → tắt) và mỗi lần đổi
  useEffect(() => send({ type: 'mascot.motion.changed', on: motion }), [motion, send]);

  useEffect(() => {
    const onVisibility = () => send({ type: 'app.visibility.changed', visible: document.visibilityState !== 'hidden' });
    const onOnline = () => send({ type: 'app.network.changed', online: true });
    const onOffline = () => send({ type: 'app.network.changed', online: false });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [send]);

  // "Đang thao tác" (BR-MAS-20; research R-19): chạm, phím, cuộn ở bất kỳ đâu (capture bắt cả vùng cuộn con), thụ động
  useEffect(() => {
    let last = Number.NEGATIVE_INFINITY;
    const onActivity = () => {
      const now = Date.now();
      if (now - last < ACTIVITY_COALESCE_MS) return;
      last = now;
      send({ type: 'app.user.activity' });
    };
    const options = { capture: true, passive: true } as const;
    for (const type of ACTIVITY_EVENTS) window.addEventListener(type, onActivity, options);
    return () => {
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, onActivity, options);
    };
  }, [send]);

  // Một hẹn giờ duy nhất tới hạn gần nhất (research R-11)
  useEffect(() => {
    const due = nextDeadline(state);
    if (due === null) return undefined;
    const id = window.setTimeout(() => send({ type: 'mascot.tick' }), Math.max(0, due - Date.now()));
    return () => window.clearTimeout(id);
  }, [state, send]);

  const view = state.view;
  const slot = view && !state.failed ? [...slots].reverse().find((entry) => entry.modes.includes(view.mode)) : undefined;

  // Lượt ghé chỉ coi là đã xác nhận khi bong bóng thật sự hiện trong slot của màn (không slot → toast dự phòng)
  const shownOnce = slot && state.bubble && VISIT_CONFIRMS.has(state.bubble.messageId) ? state.bubble.intent.once : undefined;
  const confirmedVisit = shownOnce?.startsWith(VISIT_ONCE) ? shownOnce.slice(VISIT_ONCE.length) : null;
  useEffect(() => {
    if (confirmedVisit) markVisitConfirmed(confirmedVisit);
  }, [confirmedVisit]);
  useEffect(() => {
    if (state.failed) markMascotFailed();
  }, [state.failed]);

  if (!view || !slot) return null;

  const bubble = state.bubble
    ? {
        messageId: state.bubble.messageId,
        text: messageText(language, state.bubble.messageId, state.bubble.params),
        role: MESSAGE_META[state.bubble.messageId].role,
        cta: MESSAGE_META[state.bubble.messageId].cta ?? [],
      }
    : null;

  // Lớp phủ giới thiệu (v1.3, research R-27): slot của danh mục khai báo INTRO để engine biết màn có chỗ, nhưng lớp phủ
  // phủ cả màn nên vẽ vào document.body
  if (view.mode === 'INTRO') {
    return bubble
      ? createPortal(
          <MascotIntro
            key={view.seq}
            text={bubble.text}
            language={language}
            typing={typing}
            reducedMotion={still}
            onClose={() => send({ type: 'mascot.user.closedBubble' })}
            onAssetError={() => send({ type: 'mascot.asset.failed' })}
          />,
          document.body,
        )
      : null;
  }

  const onCta = (cta: CtaId) => {
    if (cta === 'recommend') navigate(PATHS.recommend);
    else if (cta === 'seeAll') navigate(PATHS.catalog);
    else if (cta === 'closeCamera') slot.onCta?.(cta);
    send({ type: 'mascot.user.ctaPressed', cta });
  };

  return createPortal(
    <Mascot
      view={view}
      bubble={bubble}
      language={language}
      reducedMotion={still}
      typing={typing}
      onTap={() => send({ type: 'mascot.user.tapped' })}
      onClose={() => send({ type: 'mascot.user.closedBubble' })}
      onCta={onCta}
      onAssetError={() => send({ type: 'mascot.asset.failed' })}
    />,
    slot.element,
  );
}

export function MascotHost(props: Props) {
  return (
    <MascotBoundary>
      <Host {...props} />
    </MascotBoundary>
  );
}
