// Sự kiện của Mila (specs/005 contracts/mascot-event-contract.md; research R-03). Bus chỉ sống trong bộ nhớ trình duyệt:
// không lưu, không gửi đi (BR-MAS-01, 18). Điểm phát đặt SAU khi việc nghiệp vụ đã xong; không await.
import type { BilingualName } from './dialogue/vi';
import { isMascotEnabled } from './flag';

export type { BilingualName };

export type Language = 'vi' | 'en';

export type MascotEvent =
  // M01
  | { type: 'm01.language.selected'; language: Language }
  | { type: 'm01.language.changed'; language: Language }
  | { type: 'm01.catalog.loaded'; status: 'ready' | 'unavailable' | 'loading'; count: number; stale: boolean; slow: boolean }
  | { type: 'm01.catalog.interacted' }
  // fromResults: quay lại form từ trang kết quả ("Đổi tiêu chí", Back) — Mila không nói (spec-Mascot v1.11)
  | { type: 'm01.recommend.opened'; fromResults: boolean }
  | { type: 'm01.recommend.resolved'; count: number }
  | { type: 'm01.routeDetail.startPanelVisible'; routeRef: string; hasSafetyWarning: boolean }
  | { type: 'm01.package.downloadStarted'; routeRef: string; update: boolean }
  | {
      type: 'm01.package.resolved';
      routeRef: string;
      kind: 'ready' | 'deleted' | 'busy' | 'failed';
      reason?: 'source' | 'download' | 'storage';
      update: boolean;
      online: boolean;
    }
  // M02
  // `next`: tên điểm gợi ý kế tiếp (v1.7, CHG-MASCOT-2026-11-27-07); không có / `null` khi không có phiên hoặc đã quét hết
  | {
      type: 'm02.trip.entered';
      kind: 'STARTED' | 'RESTORED' | 'REJECTED' | 'FREE' | 'REPLACE_FAILED';
      hasSession: boolean;
      k: number;
      n: number;
      next?: BilingualName | null;
    }
  | { type: 'm02.trip.shown'; hasSession: boolean; k: number; n: number; finalVisited: boolean; next?: BilingualName | null }
  | { type: 'm02.content.backPressed'; afterNewVisit: boolean }
  | { type: 'm02.scanner.opened'; hasSession: boolean; k: number }
  | { type: 'm02.scanner.closed' }
  | { type: 'm02.scanner.cameraStarted' }
  | { type: 'm02.scanner.cameraFailed' }
  | { type: 'm02.scanner.detected' }
  | {
      type: 'm02.scan.resolved';
      display: 'LIVE' | 'PACKAGE' | 'CLOSED' | 'INVALID' | 'CONNECTION_NEEDED';
      hasSession: boolean;
      freeVisitor: boolean;
      visitCreated: boolean;
      inJourney: boolean;
      finalPromptNeeded: boolean;
    }
  | { type: 'm02.visit.recorded'; sessionRef: string; visitRef: string; k: number; n: number; isFinal: boolean }
  | { type: 'm02.media.playing'; mediaType: 'AUDIO' | 'VIDEO' }
  | { type: 'm02.media.stopped' }
  | { type: 'm02.notice.closedShown' }
  | { type: 'm02.notice.autoEndShown' }
  | { type: 'm02.notice.autoEndHidden' }
  | { type: 'm02.finalPrompt.opened' }
  | { type: 'm02.finalPrompt.continued' }
  | { type: 'm02.finalPrompt.ended' }
  | { type: 'm02.trip.ended'; status: 'HOAN_TAT' | 'BO_DO'; k: number; n: number; justEnded: boolean }
  | { type: 'm02.sync.statusChanged'; status: 'PENDING' | 'SYNCED' | 'CONFLICT'; online: boolean }
  // App
  | { type: 'app.dialog.changed'; open: boolean; kind: 'FINAL_PROMPT' | 'OTHER' }
  | { type: 'app.route.changed'; path: string }
  | { type: 'app.visibility.changed'; visible: boolean }
  | { type: 'app.network.changed'; online: boolean }
  /** Du khách chạm, cuộn hoặc bấm phím (host gộp 250 ms; research R-19). Không đi qua bus của module. */
  | { type: 'app.user.activity' }
  // Du khách thao tác với Mila
  | { type: 'mascot.user.tapped' }
  | { type: 'mascot.user.closedBubble' }
  | { type: 'mascot.user.ctaPressed'; cta: CtaId }
  // Nội bộ host/engine (không module nào phát)
  | { type: 'mascot.tick' }
  /** Công tắc "Chuyển động" ở thanh đầu trang (v1.1, BR-MAS-21) */
  | { type: 'mascot.motion.changed'; on: boolean }
  | { type: 'mascot.timer'; name: string }
  | { type: 'mascot.slots.changed' }
  | { type: 'mascot.asset.failed' };

export type MascotEventType = MascotEvent['type'];
export type StampedEvent = MascotEvent & { at: number };
export type CtaId = 'recommend' | 'seeAll' | 'closeCamera' | 'notNow';

type Listener = (event: StampedEvent) => void;
const listeners = new Set<Listener>();

// Host nạp lazy (chunk `mascot`), nên sự kiện có thể tới trước khi host đăng ký lần đầu (ví dụ chọn ngôn ngữ ngay khi
// trang vừa mở, hay mạng yếu). Giữ tạm tối đa PENDING_MAX sự kiện trong PENDING_MS rồi giao cho listener đầu tiên;
// thời điểm gốc `at` giữ nguyên nên engine vẫn tính giờ đúng. Sau lần đăng ký đầu, không có listener thì bỏ.
const PENDING_MS = 5_000;
const PENDING_MAX = 20;
let pending: StampedEvent[] = [];
let everSubscribed = false;

function deliver(listener: Listener, event: StampedEvent): void {
  try {
    listener(event);
  } catch {
    // Lỗi của Mila không được ảnh hưởng tới màn (BR-MAS-16)
  }
}

/** Phát một sự kiện cho Mila. Không throw, không trả promise; cờ tắt thì không làm gì. */
export function emitMascotEvent(event: MascotEvent): void {
  if (!isMascotEnabled()) return;
  const stamped = { ...event, at: Date.now() } as StampedEvent;
  if (listeners.size === 0) {
    if (everSubscribed) return;
    pending = [...pending.filter((e) => stamped.at - e.at <= PENDING_MS), stamped].slice(-PENDING_MAX);
    return;
  }
  queueMicrotask(() => {
    for (const listener of [...listeners]) deliver(listener, stamped);
  });
}

/** Chỉ host dùng. Trả hàm hủy đăng ký. Listener đầu tiên nhận các sự kiện đang giữ tạm. */
export function subscribeMascotEvents(listener: Listener): () => void {
  listeners.add(listener);
  if (!everSubscribed) {
    everSubscribed = true;
    const now = Date.now();
    const backlog = pending.filter((e) => now - e.at <= PENDING_MS);
    pending = [];
    if (backlog.length > 0) queueMicrotask(() => backlog.forEach((event) => deliver(listener, event)));
  }
  return () => {
    listeners.delete(listener);
  };
}

/** Chỉ dùng trong test: trả bus về trạng thái lúc vừa tải trang. */
export function resetMascotEventsForTest(): void {
  listeners.clear();
  pending = [];
  everSubscribed = false;
  holds.clear();
}

export type HoldKey = 'dialog' | 'media';
const holds = new Map<HoldKey, number>();

/**
 * Tín hiệu "đang có X" từ nhiều nguồn cùng lúc (nhiều hộp thoại, nhiều tệp đang phát). Chỉ phát `start` khi nguồn đầu
 * tiên giữ và `end` khi nguồn cuối cùng nhả, nên một nguồn kết thúc không gỡ trạng thái của nguồn khác còn mở
 * (BR-MAS-08). Trả hàm nhả; gọi nhiều lần chỉ tính một.
 */
export function holdMascotSignal(key: HoldKey, start: MascotEvent, end: MascotEvent): () => void {
  const count = holds.get(key) ?? 0;
  holds.set(key, count + 1);
  if (count === 0) emitMascotEvent(start);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const left = (holds.get(key) ?? 1) - 1;
    if (left > 0) {
      holds.set(key, left);
      return;
    }
    holds.delete(key);
    emitMascotEvent(end);
  };
}
