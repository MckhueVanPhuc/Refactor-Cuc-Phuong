import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';

function renderDialog() {
  const onSafe = vi.fn();
  const onConfirm = vi.fn();
  render(
    <>
      <button type="button">Bên ngoài</button>
      <Dialog
        open
        title="Bỏ thay đổi chưa lưu?"
        safeLabel="Ở lại"
        confirmLabel="Bỏ thay đổi"
        onSafe={onSafe}
        onConfirm={onConfirm}
      >
        Các thay đổi chưa lưu sẽ mất.
      </Dialog>
    </>,
  );
  return { onSafe, onConfirm };
}

describe('Dialog', () => {
  it('có đúng hai nút, tên lấy từ tiêu đề, focus ban đầu ở nút an toàn', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog', { name: 'Bỏ thay đổi chưa lưu?' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(within(dialog).getAllByRole('button')).toHaveLength(2);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ở lại' }));
  });

  it('Esc gọi nút an toàn', async () => {
    const { onSafe, onConfirm } = renderDialog();
    await userEvent.keyboard('{Escape}');
    expect(onSafe).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Tab giữ focus trong dialog', async () => {
    renderDialog();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ở lại' }));
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
  });

  it('đóng thì không render gì', () => {
    render(
      <Dialog open={false} title="T" safeLabel="Ở lại" confirmLabel="Xóa" onSafe={() => {}} onConfirm={() => {}}>
        x
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Dialog — tín hiệu cho mascot Mila (specs/005 tasks T022; BR-MAS-08)', () => {
  it('mở và đóng phát app.dialog.changed (OTHER); hành vi hộp thoại không đổi', async () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const { subscribeMascotEvents } = await import('../mascot/events');
    const seen: Array<{ type: string; open?: boolean; kind?: string }> = [];
    const off = subscribeMascotEvents((event) => seen.push(event));
    const props = { title: 'Xóa gói?', safeLabel: 'Giữ lại', confirmLabel: 'Xóa', onSafe: () => {}, onConfirm: () => {} };
    const { rerender } = render(<Dialog open {...props} />);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    rerender(<Dialog open={false} {...props} />);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(seen.map(({ type, open, kind }) => ({ type, open, kind }))).toEqual([
      { type: 'app.dialog.changed', open: true, kind: 'OTHER' },
      { type: 'app.dialog.changed', open: false, kind: 'OTHER' },
    ]);
    off();
    vi.unstubAllEnvs();
  });
});
