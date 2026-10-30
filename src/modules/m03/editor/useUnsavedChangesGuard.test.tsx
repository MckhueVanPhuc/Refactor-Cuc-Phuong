import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import { UnsavedChangesDialog, useUnsavedChangesGuard } from './useUnsavedChangesGuard';

const coordinator = vi.hoisted(() => ({ registerUnsavedForm: vi.fn(), unregisterUnsavedForm: vi.fn() }));
vi.mock('../../../app/pwa/updateCoordinator', () => coordinator);

function Editor() {
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedChangesGuard('route-editor', dirty);
  return (
    <>
      <h1>Biên tập tuyến</h1>
      <button type="button" onClick={() => setDirty(true)}>
        Gõ
      </button>
      <button type="button" onClick={() => setDirty(false)}>
        Lưu
      </button>
      <Link to="/other">Sang trang khác</Link>
      <UnsavedChangesDialog guard={guard} />
    </>
  );
}

function renderEditor() {
  const router = createMemoryRouter(
    [
      { path: '/editor', element: <Editor /> },
      { path: '/other', element: <h1>Trang khác</h1> },
    ],
    { initialEntries: ['/editor'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('useUnsavedChangesGuard (research R-20, R-22; BR-M03-F11)', () => {
  afterEach(() => vi.clearAllMocks());

  it('không có thay đổi chưa lưu → điều hướng bình thường, không đăng ký form', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('link', { name: 'Sang trang khác' }));
    expect(await screen.findByRole('heading', { name: 'Trang khác' })).toBeTruthy();
    expect(coordinator.registerUnsavedForm).not.toHaveBeenCalled();
  });

  it('có thay đổi chưa lưu → chặn điều hướng, hộp thoại MSG-UNSAVED-CHANGES hai nút', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Gõ' }));
    await userEvent.click(screen.getByRole('link', { name: 'Sang trang khác' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Bạn có thay đổi chưa lưu. Rời trang sẽ mất các thay đổi này.',
    });
    expect(dialog.querySelectorAll('button')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Biên tập tuyến' })).toBeTruthy();
  });

  it('"Ở lại" giữ trang và form; "Rời đi" mới điều hướng', async () => {
    const router = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Gõ' }));
    await userEvent.click(screen.getByRole('link', { name: 'Sang trang khác' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Ở lại' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(router.state.location.pathname).toBe('/editor');

    await userEvent.click(screen.getByRole('link', { name: 'Sang trang khác' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Rời đi' }));
    expect(await screen.findByRole('heading', { name: 'Trang khác' })).toBeTruthy();
  });

  it('đóng tab khi còn thay đổi chưa lưu → beforeunload bị chặn; hết thay đổi thì không', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Gõ' }));
    const dirtyEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    const cleanEvent = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
  });

  it('đăng ký với update coordinator khi có thay đổi chưa lưu, gỡ khi hết (R-22)', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Gõ' }));
    expect(coordinator.registerUnsavedForm).toHaveBeenCalledWith('route-editor');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(coordinator.unregisterUnsavedForm).toHaveBeenCalledWith('route-editor');
  });
});
