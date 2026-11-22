// Công tắc "Chuyển động" ở thanh đầu trang (specs/005 tasks T082; design-system §9.5).
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MascotMotionToggle } from './MascotMotionToggle';
import { getMotion, resetMotionForTest } from './motion';

const noReduce = () => vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetMotionForTest();
});

describe('MascotMotionToggle', () => {
  it('nút có aria-pressed, tên truy cập và chữ bật/tắt; bấm thì đổi trạng thái', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    noReduce();
    const { getByRole } = render(<MascotMotionToggle language="vi" tone="onDark" />);
    const button = getByRole('button', { name: 'Chuyển động của Mila' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toContain('Chuyển động: bật');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toContain('Chuyển động: tắt');
    expect(getMotion()).toBe(false);
  });

  it("tiếng Anh: tên Mila's motion, chữ Motion: on", () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    noReduce();
    const { getByRole } = render(<MascotMotionToggle language="en" tone="onLight" />);
    expect(getByRole('button', { name: "Mila's motion" }).textContent).toContain('Motion: on');
  });

  it('cờ Mila tắt → không render', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    const { container } = render(<MascotMotionToggle language="vi" tone="onDark" />);
    expect(container.innerHTML).toBe('');
  });
});
