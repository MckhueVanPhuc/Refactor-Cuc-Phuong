// Slot và hình tĩnh của Mila (specs/005 tasks T011; mascot-ui-contract §1).
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MascotFigure } from './MascotFigure';
import { MascotSlot } from './MascotSlot';
import { getSlots } from './slots';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('MascotSlot', () => {
  it('giữ chỗ theo mode cố định lớn nhất và đăng ký vào registry; gỡ khi unmount', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const onCta = vi.fn();
    const { container, unmount } = render(<MascotSlot id="trip-dock" modes={['DOCK']} onCta={onCta} />);
    const element = container.querySelector('[data-mascot-slot="trip-dock"]');
    expect(element).not.toBeNull();
    expect(element?.getAttribute('data-mascot-size')).toBe('md');
    expect(getSlots()).toEqual([expect.objectContaining({ id: 'trip-dock', modes: ['DOCK'], element, onCta })]);
    unmount();
    expect(getSlots()).toEqual([]);
  });

  it('INTRO không giữ chỗ riêng; AVATAR nhỏ; CELEBRATE lớn', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const { container } = render(
      <>
        <MascotSlot id="catalog-hero" modes={['INTRO', 'DOCK']} />
        <MascotSlot id="content-toast" modes={['AVATAR']} />
        <MascotSlot id="end-hero" modes={['CELEBRATE', 'DOCK']} />
      </>,
    );
    const size = (id: string) => container.querySelector(`[data-mascot-slot="${id}"]`)?.getAttribute('data-mascot-size');
    expect([size('catalog-hero'), size('content-toast'), size('end-hero')]).toEqual(['md', 'sm', 'xl']);
  });

  it('v1.1: cỡ DOCK theo slot (danh mục, chuyến đi, kết quả) qua data-mascot-dock', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const { container } = render(
      <>
        <MascotSlot id="catalog-hero" modes={['INTRO', 'DOCK']} size="catalog" />
        <MascotSlot id="trip-dock" modes={['DOCK']} size="trip" />
        <MascotSlot id="end-hero" modes={['CELEBRATE', 'DOCK']} size="end" />
        <MascotSlot id="content-toast" modes={['AVATAR']} />
      </>,
    );
    const dock = (id: string) => container.querySelector(`[data-mascot-slot="${id}"]`)?.getAttribute('data-mascot-dock');
    expect([dock('catalog-hero'), dock('trip-dock'), dock('end-hero'), dock('content-toast')]).toEqual(['catalog', 'trip', 'end', null]);
  });

  it('cờ tắt → không render, không đăng ký', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    const { container } = render(<MascotSlot id="trip-dock" modes={['DOCK']} />);
    expect(container.innerHTML).toBe('');
    expect(getSlots()).toEqual([]);
  });
});

describe('MascotFigure', () => {
  it('chưa có ảnh → hình giữ chỗ, ẩn khỏi trình đọc màn hình', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const { container } = render(<MascotFigure pose="confused" />);
    const figure = container.querySelector('[data-mascot-figure="confused"]');
    expect(figure).not.toBeNull();
    expect(figure?.getAttribute('aria-hidden')).toBe('true');
  });

  it('có ảnh → img alt rỗng; ảnh lỗi → không render', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    vi.resetModules();
    vi.doMock('./assets', () => ({ poseAsset: () => ({ src240: '/m-240.webp', src480: '/m-480.webp' }) }));
    const { MascotFigure: WithAsset } = await import('./MascotFigure');
    const { container } = render(<WithAsset pose="cheer" />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('alt')).toBe('');
    fireEvent.error(img!);
    expect(container.querySelector('[data-mascot-figure]')).toBeNull();
    vi.doUnmock('./assets');
  });

  it('cờ tắt → không render', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    const { container } = render(<MascotFigure pose="confused" />);
    expect(container.innerHTML).toBe('');
  });
});
