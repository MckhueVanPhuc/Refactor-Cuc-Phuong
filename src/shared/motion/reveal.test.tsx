// specs/006 T033: thẻ hiện dần khi cuộn (data-model §4).
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRevealForTest, useReveal } from './reveal';

let callback: IntersectionObserverCallback = () => {};
const observed: Element[] = [];

class FakeObserver {
  constructor(cb: IntersectionObserverCallback) {
    callback = cb;
  }
  observe(element: Element) {
    observed.push(element);
  }
  unobserve() {}
  disconnect() {}
}

function Card({ id, top }: { id: string; top: number }) {
  const ref = useReveal(id);
  return (
    <div
      data-testid={id}
      ref={(element) => {
        if (element) element.getBoundingClientRect = () => ({ top }) as DOMRect;
        ref(element);
      }}
    />
  );
}

describe('useReveal', () => {
  beforeEach(() => {
    resetRevealForTest();
    observed.length = 0;
    vi.stubGlobal('IntersectionObserver', FakeObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('trong viewport lúc gắn → hiện ngay, không theo dõi', () => {
    const { getByTestId } = render(<Card id="a" top={10} />);
    expect(getByTestId('a').dataset['reveal']).toBe('shown');
    expect(observed).toHaveLength(0);
  });

  it('dưới màn đầu → ẩn rồi hiện khi vào viewport; gắn lại sau đó → hiện ngay (một lần mỗi lần tải trang)', () => {
    const { getByTestId, unmount } = render(<Card id="b" top={window.innerHeight + 200} />);
    const element = getByTestId('b');
    expect(element.dataset['reveal']).toBe('hidden');
    act(() => callback([{ isIntersecting: true, target: element } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(element.dataset['reveal']).toBe('shown');
    unmount();
    const again = render(<Card id="b" top={window.innerHeight + 200} />);
    expect(again.getByTestId('b').dataset['reveal']).toBe('shown');
  });

  it('không có IntersectionObserver → hiện ngay', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    resetRevealForTest();
    const { getByTestId } = render(<Card id="c" top={window.innerHeight + 200} />);
    expect(getByTestId('c').dataset['reveal']).toBe('shown');
  });
});
