// Tiện ích cho test engine: luật giả lập và ngữ cảnh mặc định. Không dùng trong mã chạy thật.
import type { MascotEvent, MascotEventType } from './events';
import type { Intent, Rule, RuleResult, StepContext } from './machine';

export const CTX: StepContext = { availableModes: ['DOCK', 'AVATAR', 'INTRO', 'CELEBRATE'], reducedMotion: false, language: 'vi' };

export const intent = (over: Partial<Intent> = {}): Intent => ({ behaviorId: 'TEST', priority: 6, mode: 'DOCK', pose: 'map', ...over });

/** Một luật: sự kiện `on` → kết quả cố định (hoặc hàm của sự kiện). */
export function rule(on: MascotEventType, result: RuleResult | ((event: MascotEvent) => RuleResult | null)): Rule {
  return { id: `TEST:${on}`, on: [on], decide: (event) => (typeof result === 'function' ? result(event) : result) };
}

export const say = (over: Partial<Intent>): RuleResult => ({ intents: [intent(over)] });
