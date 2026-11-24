// Công tắc "Hiệu ứng chuyển động" (specs/006 T010; spec-Mascot v1.4 BR-MAS-21; design-system §9.5).
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotionSwitch } from './MotionSwitch';
import { getMotion, resetMotionForTest } from './store';

const noReduce = () => vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetMotionForTest();
});

describe('MotionSwitch', () => {
  it('role="switch", aria-checked theo trạng thái, nhãn và câu phụ mới; bấm thì đổi', () => {
    noReduce();
    const { getByRole } = render(<MotionSwitch language="vi" />);
    const control = getByRole('switch', { name: /Hiệu ứng chuyển động/ });
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.textContent).toContain('Tắt để Mila và hiệu ứng trang trí đứng yên.');
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(getMotion()).toBe(false);
  });

  it('tiếng Anh', () => {
    noReduce();
    const { getByRole } = render(<MotionSwitch language="en" />);
    expect(getByRole('switch', { name: /Motion effects/ }).textContent).toContain('Turn off to keep Mila and decorations still.');
  });

  it('thiết bị giảm chuyển động → bắt đầu ở tắt', () => {
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: media.includes('reduce'), media, addEventListener() {}, removeEventListener() {} }));
    const { getByRole } = render(<MotionSwitch language="vi" />);
    expect(getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  it('cờ Mila tắt → công tắc vẫn có (OD-MAS-21)', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    noReduce();
    const { getByRole } = render(<MotionSwitch language="vi" />);
    expect(getByRole('switch', { name: /Hiệu ứng chuyển động/ })).toBeTruthy();
  });
});
