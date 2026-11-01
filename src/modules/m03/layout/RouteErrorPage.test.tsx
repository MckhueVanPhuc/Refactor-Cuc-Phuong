import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { isChunkLoadError, RouteErrorPage } from './RouteErrorPage';

function Boom({ error }: { error: Error }): never {
  throw error;
}

function renderError(error: Error) {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const router = createMemoryRouter([{ path: '/', element: <Boom error={error} />, errorElement: <RouteErrorPage /> }]);
  render(<RouterProvider router={router} />);
}

describe('RouteErrorPage (errorElement của /admin/*; T046)', () => {
  it('nhận diện lỗi tải chunk của các trình duyệt', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new Error('x is undefined'))).toBe(false);
  });

  it('chunk không tải được → MSG-NETWORK-FAILED (M03 chỉ online)', () => {
    renderError(new TypeError('Failed to fetch dynamically imported module: /assets/x.js'));
    expect(screen.getByRole('alert').textContent).toBe('Chưa kết nối được. Hãy kiểm tra mạng rồi thử lại.');
  });

  it('lỗi khác → MSG-GENERIC, không lộ chi tiết kỹ thuật', () => {
    renderError(new Error('Cannot read properties of undefined'));
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/^Có lỗi xảy ra/);
    expect(alert.textContent).not.toMatch(/undefined/);
  });
});
