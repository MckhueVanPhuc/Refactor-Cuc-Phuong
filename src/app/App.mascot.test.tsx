// Gắn host Mila vào App theo công tắc (specs/005 tasks T021, T068; research R-13; Q17).
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MascotFigure, MascotSlot, type PoseId } from '../shared/mascot/index';
import { loadMascotHost } from './mascot/loadHost';

/** Mọi slot của contract UI §2 (cùng mode các màn khai báo) và mọi tư thế màn dùng cho hình INLINE */
const SLOTS = [
  ['catalog-hero', ['INTRO', 'DOCK']],
  ['recommend-head', ['AVATAR']],
  ['start-panel', ['AVATAR']],
  ['package-panel', ['AVATAR']],
  ['trip-dock', ['DOCK']],
  ['scanner-bottom', ['AVATAR']],
  ['content-toast', ['AVATAR']],
  ['end-hero', ['CELEBRATE', 'DOCK']],
] as const;
const FIGURES: readonly PoseId[] = ['rest', 'confused', 'think', 'backpack', 'cheer', 'map'];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('loadMascotHost', () => {
  it('công tắc tắt → không có host, không import() chunk mascot', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    expect(loadMascotHost()).toBeNull();
  });

  it('công tắc bật → component lazy', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    expect(loadMascotHost()).not.toBeNull();
  });

  it('Q17 / MAS-TC-045: công tắc tắt → không slot, không hình INLINE nào được render trên màn', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    const { container } = render(
      <>
        {SLOTS.map(([id, modes]) => (
          <MascotSlot key={id} id={id} modes={modes} />
        ))}
        {FIGURES.map((pose) => (
          <MascotFigure key={pose} pose={pose} />
        ))}
      </>,
    );
    expect(container.querySelectorAll('[data-mascot-slot], [data-mascot-figure]')).toHaveLength(0);
    expect(container.innerHTML).toBe('');
  });
});
