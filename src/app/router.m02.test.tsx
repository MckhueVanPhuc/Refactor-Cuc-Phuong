// Route M02 trong router của app (tasks M02 T024, T025; field-ui-flow-contract §1; BR-M02-024). Dùng module thật trên
// fake-indexeddb: chưa có LanguagePreference, nên route nào đi qua LanguageGate của M01 sẽ hiện bước chọn ngôn ngữ.
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppRouter } from './router';

function renderAt(path: string) {
  window.history.pushState(null, '', path);
  return render(<RouterProvider router={createAppRouter()} />);
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState(null, '', '/');
});

describe('route M02', () => {
  it.each([
    ['/trip', 'scanner'],
    ['/trip/qr/Q1a', 'reader'],
    ['/trip/end', 'reader'],
    ['/q/Q1a', 'reader'],
  ])('%s mở layout M02 (%s) với nút VI/EN của M01', async (path, surface) => {
    const { container } = renderAt(path);
    await screen.findByRole('main');
    expect(container.querySelector('[data-surface]')?.getAttribute('data-surface')).toBe(surface);
    expect(screen.getByRole('group')).toBeTruthy();
  });

  it('/q/… không đi qua LanguageGate: không hiện bước chọn ngôn ngữ (BR-M02-024)', async () => {
    renderAt('/q/Q1a');
    await screen.findByRole('main');
    expect(screen.queryByText('Chọn ngôn ngữ (Tiếng Việt / English)')).toBeNull();
  });

  it.each([
    ['vi-VN', 'vi'],
    ['en-US', 'en'],
  ])('chưa có preference, thiết bị %s → trang %s', async (device, lang) => {
    vi.stubGlobal('navigator', { ...navigator, language: device });
    renderAt('/q/Q1a');
    await screen.findByRole('main');
    expect(document.documentElement.lang).toBe(lang);
  });
});
