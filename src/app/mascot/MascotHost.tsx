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
import { useSlots, type SlotEntry } from '../../shared/mascot/slots';
import { PATHS } from '../paths';
import { Mascot } from './Mascot';
import { MascotBoundary } from './MascotBoundary';

type Props = {
  pathname: string;
  navigate: (path: string) => void;
  /** Chỉ test truyền bảng luật riêng */
  rules?: readonly Rule[];
};

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

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

function Host({ pathname, navigate, rules = RULES }: Props) {
  const slots = useSlots();
  const stored = useLanguagePreference();
  const language = resolveDisplayLanguage(stored, typeof navigator === 'undefined' ? undefined : navigator.language);
  const reducedMotion = useReducedMotion();

  const [state, setState] = useState<MascotState>(initialState);
  const stateRef = useRef(state);
  // Chữ hiện dần khi được phép chuyển động (R-20); công tắc "Chuyển động" (Phase 13) sẽ tắt thêm ở đây
  const typing = !reducedMotion;
  const ctxRef = useRef<StepContext>({ availableModes: modesOf(slots), reducedMotion, language, typing });
  const broken = useRef(false);

  useLayoutEffect(() => {
    ctxRef.current = { availableModes: modesOf(slots), reducedMotion, language, typing };
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

  // Một hẹn giờ duy nhất tới hạn gần nhất (research R-11)
  useEffect(() => {
    const due = nextDeadline(state);
    if (due === null) return undefined;
    const id = window.setTimeout(() => send({ type: 'mascot.tick' }), Math.max(0, due - Date.now()));
    return () => window.clearTimeout(id);
  }, [state, send]);

  const view = state.view;
  if (!view || state.failed) return null;
  const slot = [...slots].reverse().find((entry) => entry.modes.includes(view.mode));
  if (!slot) return null;

  const bubble = state.bubble
    ? {
        messageId: state.bubble.messageId,
        text: messageText(language, state.bubble.messageId, state.bubble.params),
        role: MESSAGE_META[state.bubble.messageId].role,
        cta: MESSAGE_META[state.bubble.messageId].cta ?? [],
      }
    : null;

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
      reducedMotion={reducedMotion}
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
