// Metadata không phụ thuộc ngôn ngữ của từng câu (Dialogue Library §3; spec-Mascot §5.6) và hàm lấy chữ.
// Mức ưu tiên ở đây là mặc định của câu; luật có thể đặt mức riêng trong Intent.
import type { CtaId, Language } from '../events';
import { en } from './en';
import { vi, type MessageParams } from './vi';

export type MessageId = keyof typeof vi.messages;
export type { MessageParams };

export type MessageMeta = {
  priority: number;
  /** Không lặp lại câu này trong khoảng này (trong một lần tải trang). `Infinity` = một lần mỗi lần tải trang. */
  cooldownMs: number;
  /** `false`: bong bóng ở lại tới khi bấm nút, đóng, đổi màn hoặc luật thay (design-system §5.3) */
  autoHide: boolean;
  cta?: readonly CtaId[];
  /** Chỉ câu P2 có thông tin mới mang `role="status"` (Technical spec §7) */
  role?: 'status';
};

const MIN = 60_000;
const ONCE = Number.POSITIVE_INFINITY;

export const MESSAGE_META: Record<MessageId, MessageMeta> = {
  'MSG-MAS-001': { priority: 6, cooldownMs: ONCE, autoHide: true },
  'MSG-MAS-002': { priority: 6, cooldownMs: ONCE, autoHide: true },
  'MSG-MAS-004': { priority: 6, cooldownMs: ONCE, autoHide: true },
  'MSG-MAS-005': { priority: 7, cooldownMs: 0, autoHide: false },
  'MSG-MAS-008': { priority: 6, cooldownMs: ONCE, autoHide: false, cta: ['recommend'] },
  'MSG-MAS-009': { priority: 3, cooldownMs: 10_000, autoHide: true },
  'MSG-MAS-010': { priority: 6, cooldownMs: ONCE, autoHide: true },
  'MSG-MAS-011': { priority: 4, cooldownMs: 30_000, autoHide: true },
  'MSG-MAS-013': { priority: 2, cooldownMs: MIN, autoHide: false, cta: ['seeAll'], role: 'status' },
  'MSG-MAS-014': { priority: 6, cooldownMs: 0, autoHide: true },
  'MSG-MAS-020': { priority: 5, cooldownMs: 0, autoHide: false },
  'MSG-MAS-021': { priority: 4, cooldownMs: 0, autoHide: true },
  'MSG-MAS-024': { priority: 2, cooldownMs: 30_000, autoHide: true, role: 'status' },
  'MSG-MAS-025': { priority: 2, cooldownMs: 30_000, autoHide: false, role: 'status' },
  'MSG-MAS-026': { priority: 2, cooldownMs: 5 * MIN, autoHide: false, role: 'status' },
  'MSG-MAS-030': { priority: 6, cooldownMs: 0, autoHide: true },
  'MSG-MAS-032': { priority: 3, cooldownMs: 10_000, autoHide: true },
  'MSG-MAS-034': { priority: 6, cooldownMs: 30 * MIN, autoHide: true },
  'MSG-MAS-040': { priority: 6, cooldownMs: ONCE, autoHide: true },
  'MSG-MAS-042': { priority: 6, cooldownMs: 0, autoHide: true },
  'MSG-MAS-044': { priority: 5, cooldownMs: 0, autoHide: false },
  'MSG-MAS-046': { priority: 2, cooldownMs: 2 * MIN, autoHide: false, role: 'status' },
  'MSG-MAS-048': { priority: 2, cooldownMs: 2 * MIN, autoHide: false, role: 'status' },
  'MSG-MAS-049': { priority: 6, cooldownMs: 0, autoHide: false, cta: ['closeCamera', 'notNow'] },
  'MSG-MAS-050': { priority: 4, cooldownMs: 0, autoHide: true },
  'MSG-MAS-051': { priority: 4, cooldownMs: 0, autoHide: true },
  'MSG-MAS-052': { priority: 2, cooldownMs: MIN, autoHide: true, role: 'status' },
  'MSG-MAS-054': { priority: 5, cooldownMs: 5 * MIN, autoHide: true },
  'MSG-MAS-055': { priority: 5, cooldownMs: 0, autoHide: true },
  'MSG-MAS-056': { priority: 6, cooldownMs: 10 * MIN, autoHide: true },
  'MSG-MAS-057a': { priority: 6, cooldownMs: 10 * MIN, autoHide: true },
  'MSG-MAS-057b': { priority: 6, cooldownMs: 10 * MIN, autoHide: true },
  'MSG-MAS-057c': { priority: 6, cooldownMs: 10 * MIN, autoHide: true },
  'MSG-MAS-057d': { priority: 6, cooldownMs: 10 * MIN, autoHide: true },
  'MSG-MAS-057e': { priority: 6, cooldownMs: 10 * MIN, autoHide: true },
  'MSG-MAS-059': { priority: 3, cooldownMs: 10_000, autoHide: true },
  'MSG-MAS-061': { priority: 5, cooldownMs: 2 * MIN, autoHide: true },
  'MSG-MAS-062': { priority: 4, cooldownMs: 0, autoHide: true },
  'MSG-MAS-070': { priority: 5, cooldownMs: 0, autoHide: true },
  'MSG-MAS-074': { priority: 5, cooldownMs: 10 * MIN, autoHide: true },
  'MSG-MAS-075': { priority: 7, cooldownMs: 10 * MIN, autoHide: true },
};

export const MESSAGE_IDS = Object.keys(vi.messages) as MessageId[];

const DIALOGUE = { vi, en } as const;

export function messageText(language: Language, id: MessageId, params: MessageParams = {}): string {
  const text = DIALOGUE[language].messages[id];
  return typeof text === 'function' ? text(params) : text;
}

export function labelsFor(language: Language) {
  return DIALOGUE[language].labels;
}

export function cheersFor(language: Language): readonly string[] {
  return DIALOGUE[language].cheers;
}
