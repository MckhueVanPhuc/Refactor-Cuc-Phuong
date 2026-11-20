// Thông báo tự kết thúc chuyến trước báo Mila im lặng (specs/005 tasks T030; MAS-B-035).
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { subscribeMascotEvents } from '../../../shared/mascot/events';

vi.mock('../session/autoEnd', () => ({ useAutoEndNotice: () => 'BO_DO' }));

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('FieldLayout — tín hiệu thông báo tự kết thúc', () => {
  it('có thông báo → autoEndShown; rời màn → autoEndHidden', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const seen: string[] = [];
    const off = subscribeMascotEvents((event) => seen.push(event.type));
    const { FieldLayout } = await import('./FieldLayout');
    const { unmount } = render(<FieldLayout surface="scanner" title="Chuyến đi" />);
    await flush();
    unmount();
    await flush();
    expect(seen).toEqual(['m02.notice.autoEndShown', 'm02.notice.autoEndHidden']);
    off();
  });
});
