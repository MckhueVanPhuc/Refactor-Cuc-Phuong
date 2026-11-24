// Thẻ hiện dần khi cuộn (design-system §4.3.1 T2, §4.3.2; specs/006 R-08; data-model §4). Phần tử đã trong viewport lúc
// gắn thì hiện ngay (không làm chậm LCP); phần tử dưới màn đầu mang `data-reveal="hidden"` cho tới khi vào viewport, một
// lần mỗi lần tải trang. Chỉ đổi thuộc tính DOM (không render lại); CSS của từng thành phần quyết định hình (chỉ opacity,
// transform — không dịch bố cục) và chỉ ẩn khi `data-motion="full"`.
import { useCallback } from 'react';

const seen = new Set<string>();
let observer: IntersectionObserver | null = null;
const ids = new WeakMap<Element, string>();

function show(element: HTMLElement, id: string): void {
  seen.add(id);
  element.dataset['reveal'] = 'shown';
}

function sharedObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = ids.get(entry.target);
      if (id !== undefined) show(entry.target as HTMLElement, id);
      observer?.unobserve(entry.target);
    }
  });
  return observer;
}

/** Ref callback cho phần tử có id ổn định trong lần tải trang. */
export function useReveal(id: string): (element: HTMLElement | null) => void {
  return useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;
      const io = sharedObserver();
      const inView = typeof window === 'undefined' || element.getBoundingClientRect().top < window.innerHeight;
      if (seen.has(id) || !io || inView) {
        show(element, id);
        return;
      }
      element.dataset['reveal'] = 'hidden';
      ids.set(element, id);
      io.observe(element);
    },
    [id],
  );
}

/** Chỉ test dùng. */
export function resetRevealForTest(): void {
  seen.clear();
  observer?.disconnect();
  observer = null;
}
