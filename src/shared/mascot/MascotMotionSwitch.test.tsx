// Công tắc "Chuyển động của Mila" ở màn Tài nguyên (specs/005 tasks T103; spec-Mascot v1.3 BR-MAS-21; design-system §9.5).
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MascotMotionSwitch } from './MascotMotionSwitch';
import { getMotion, resetMotionForTest } from './motion';

const noReduce = () => vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetMotionForTest();
});

describe('MascotMotionSwitch', () => {
  it('role="switch", aria-checked theo trạng thái, nhãn và câu phụ; bấm thì đổi', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    noReduce();
    const { getByRole } = render(<MascotMotionSwitch language="vi" />);
    const control = getByRole('switch', { name: /Chuyển động của Mila/ });
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.textContent).toContain('Tắt để Mila đứng yên.');
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(getMotion()).toBe(false);
  });

  it('tiếng Anh', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    noReduce();
    const { getByRole } = render(<MascotMotionSwitch language="en" />);
    expect(getByRole('switch', { name: /Mila's motion/ }).textContent).toContain('Turn off to keep Mila still.');
  });

  it('thiết bị giảm chuyển động → bắt đầu ở tắt', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: media.includes('reduce'), media, addEventListener() {}, removeEventListener() {} }));
    const { getByRole } = render(<MascotMotionSwitch language="vi" />);
    expect(getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  it('cờ Mila tắt → không render', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    const { container } = render(<MascotMotionSwitch language="vi" />);
    expect(container.innerHTML).toBe('');
  });
});
