// Ảnh của Mila theo mode (specs/005 tasks T070; Asset spec §3 MA-11: avatar là đầu bong bóng AVATAR).
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ViewState } from '../../shared/mascot/types';
import { Mascot } from './Mascot';

const view = (mode: ViewState['mode'], pose: ViewState['pose']): ViewState => ({ mode, pose, animation: null, seq: 1, behaviorId: 'test' });

function renderMascot(v: ViewState) {
  return render(
    <Mascot view={v} bubble={null} language="vi" reducedMotion onTap={vi.fn()} onClose={vi.fn()} onCta={vi.fn()} onAssetError={vi.fn()} />,
  );
}

describe('Mascot — ảnh theo mode', () => {
  it('AVATAR (40 px): ảnh avatar đầu và vai, không phải ảnh toàn thân; data-mascot-pose giữ tư thế của luật', () => {
    const { container } = renderMascot(view('AVATAR', 'cheer'));
    expect(container.querySelector('img')?.getAttribute('src')).toMatch(/ma-11-avatar-96\.webp$/);
    expect(container.querySelector('[data-mascot-pose]')?.getAttribute('data-mascot-pose')).toBe('cheer');
  });

  it('DOCK: ảnh tư thế cỡ 240, không srcset', () => {
    const img = renderMascot(view('DOCK', 'map')).container.querySelector('img');
    expect(img?.getAttribute('src')).toMatch(/ma-02-map-240\.webp$/);
    expect(img?.getAttribute('srcset')).toBeNull();
  });

  it('CELEBRATE: srcset có cỡ 480 cho màn mật độ cao', () => {
    const img = renderMascot(view('CELEBRATE', 'cheer')).container.querySelector('img');
    expect(img?.getAttribute('srcset')).toMatch(/ma-08-cheer-240\.webp 1x, .*ma-08-cheer-480\.webp 2x/);
  });

  it('tư thế chưa có ảnh (đợt 2) → hình giữ chỗ', () => {
    const { container } = renderMascot(view('DOCK', 'think'));
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[data-mascot-placeholder]')).not.toBeNull();
  });
});
