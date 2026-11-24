// specs/006 T046: confetti lá (contracts/motion-ui-contract.md §2).
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEAF_CONFETTI_MAX, LeafConfetti } from './LeafConfetti';
import { resetMotionForTest, setMotion } from './store';

const leaves = (container: HTMLElement) => container.querySelectorAll('[data-leaf-confetti] > span');

describe('LeafConfetti', () => {
  beforeEach(() => {
    resetMotionForTest();
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('ẩn với công nghệ hỗ trợ; số hạt bị chặn ở 40', () => {
    const { container } = render(<LeafConfetti count={100} />);
    expect(container.querySelector('[data-leaf-confetti]')?.getAttribute('aria-hidden')).toBe('true');
    expect(leaves(container)).toHaveLength(LEAF_CONFETTI_MAX);
  });

  it('không có trang trí (công tắc tắt) → không render', () => {
    setMotion(false);
    const { container } = render(<LeafConfetti count={10} />);
    expect(container.innerHTML).toBe('');
  });
});
