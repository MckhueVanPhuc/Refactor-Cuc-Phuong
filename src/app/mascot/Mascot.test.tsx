// Component Mila (specs/005 tasks T070, T075; Asset spec §3 MA-11; design-system §9.2, §9.3; research R-20, R-21).
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ViewState } from '../../shared/mascot/types';
import { Mascot, type BubbleView } from './Mascot';

const view = (mode: ViewState['mode'], pose: ViewState['pose']): ViewState => ({ mode, pose, animation: null, seq: 1, behaviorId: 'test' });

type Options = { bubble?: BubbleView | null; typing?: boolean; onAssetError?: () => void };

function renderMascot(v: ViewState, { bubble = null, typing = false, onAssetError = vi.fn() }: Options = {}) {
  return render(
    <Mascot
      view={v}
      bubble={bubble}
      language="vi"
      reducedMotion={!typing}
      typing={typing}
      onTap={vi.fn()}
      onClose={vi.fn()}
      onCta={vi.fn()}
      onAssetError={onAssetError}
    />,
  );
}

const TEXT = 'Chào mừng bạn quay lại! Hôm nay mình đi tuyến nào đây?';
const bubble: BubbleView = { messageId: 'MSG-MAS-004', text: TEXT, cta: [] };

afterEach(() => {
  vi.useRealTimers();
});

describe('Mascot — ảnh theo mode', () => {
  it('AVATAR (56 px): ảnh avatar đầu và vai, không phải ảnh toàn thân; data-mascot-pose giữ tư thế của luật', () => {
    const { container } = renderMascot(view('AVATAR', 'cheer'));
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(/ma-11-avatar-96\.webp$/);
    expect(container.querySelector('[data-mascot-pose]')?.getAttribute('data-mascot-pose')).toBe('cheer');
  });

  it('DOCK (v1.1, 104–128 px): ảnh 240, srcset có 480 cho màn mật độ cao', () => {
    const img = renderMascot(view('DOCK', 'map')).container.querySelector('img');
    expect(img?.getAttribute('src')).toMatch(/ma-02-map-240\.webp$/);
    expect(img?.getAttribute('srcset')).toMatch(/ma-02-map-240\.webp 1x, .*ma-02-map-480\.webp 2x/);
  });

  it('CELEBRATE: srcset có cỡ 480 cho màn mật độ cao', () => {
    const img = renderMascot(view('CELEBRATE', 'cheer')).container.querySelector('img');
    expect(img?.getAttribute('srcset')).toMatch(/ma-08-cheer-240\.webp 1x, .*ma-08-cheer-480\.webp 2x/);
  });

  it('ảnh 480 không tải được (offline, ngoài precache) → lùi về 240; chỉ báo lỗi khi cả 240 cũng hỏng', () => {
    const onAssetError = vi.fn();
    const img = () => renderResult.container.querySelector('img')!;
    const renderResult = renderMascot(view('DOCK', 'map'), { onAssetError });
    fireEvent.error(img());
    expect(img().getAttribute('srcset')).toBeNull();
    expect(onAssetError).not.toHaveBeenCalled();
    fireEvent.error(img());
    expect(onAssetError).toHaveBeenCalledTimes(1);
  });

  it('tư thế không có ảnh → hình giữ chỗ (mọi tư thế hiện đã có ảnh; giả lập registry trống)', async () => {
    vi.resetModules();
    vi.doMock('../../shared/mascot/assets', () => ({ poseAsset: () => null }));
    const { Mascot: WithoutAssets } = await import('./Mascot');
    const { container } = render(
      <WithoutAssets
        view={view('DOCK', 'think')}
        bubble={null}
        language="vi"
        reducedMotion
        typing={false}
        onTap={vi.fn()}
        onClose={vi.fn()}
        onCta={vi.fn()}
        onAssetError={vi.fn()}
      />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-mascot-placeholder]')).not.toBeNull();
    vi.doUnmock('../../shared/mascot/assets');
  });
});

describe('Mascot — bong bóng "Giấy dã ngoại" (design-system §9.3)', () => {
  it('có dòng tên "Mila" chỉ để nhìn (aria-hidden) và nút "Đóng lời nhắn"', () => {
    const { container, getByRole } = renderMascot(view('DOCK', 'wave'), { bubble });
    const name = container.querySelector('[data-mascot-name]');
    expect(name?.textContent).toBe('Mila');
    expect(name?.getAttribute('aria-hidden')).toBe('true');
    expect(getByRole('button', { name: 'Đóng lời nhắn' })).toBeTruthy();
  });

  it('chữ hiện dần ~30 ký tự/giây; đoạn gốc luôn giữ câu đầy đủ cho trình đọc màn hình', () => {
    vi.useFakeTimers();
    const { container } = renderMascot(view('DOCK', 'wave'), { bubble, typing: true });
    const message = container.querySelector('[data-mascot-message]')!;
    const typed = () => container.querySelector('[data-mascot-typed]')?.textContent ?? null;
    expect(message.textContent).toBe(TEXT);
    expect(message.getAttribute('data-typing')).toBe('true');
    expect(container.querySelector('[data-mascot-typed]')?.getAttribute('aria-hidden')).toBe('true');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(typed()!.length).toBeGreaterThanOrEqual(13);
    expect(typed()!.length).toBeLessThanOrEqual(17);
    expect(TEXT.startsWith(typed()!)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(typed()).toBeNull();
    expect(message.hasAttribute('data-typing')).toBe(false);
    expect(message.textContent).toBe(TEXT);
  });

  it('chạm vào bong bóng khi đang hiện dần → hiện hết ngay', () => {
    vi.useFakeTimers();
    const { container } = renderMascot(view('DOCK', 'wave'), { bubble, typing: true });
    fireEvent.click(container.querySelector('[data-mascot-message]')!);
    expect(container.querySelector('[data-mascot-typed]')).toBeNull();
    expect(container.querySelector('[data-mascot-message]')!.hasAttribute('data-typing')).toBe(false);
  });

  it('không hiện dần (giảm chuyển động / công tắc tắt) → chữ hiện ngay, không lớp phủ', () => {
    const { container } = renderMascot(view('DOCK', 'wave'), { bubble, typing: false });
    expect(container.querySelector('[data-mascot-typed]')).toBeNull();
    expect(container.querySelector('[data-mascot-message]')!.hasAttribute('data-typing')).toBe(false);
  });
});
