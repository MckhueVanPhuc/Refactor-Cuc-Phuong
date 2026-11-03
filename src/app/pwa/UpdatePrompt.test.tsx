// Lời nhắc cập nhật ứng dụng (tasks M01 T093; constitution VI; research M01 R-14; copy SCR-M01-001).
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { writeLanguagePreference } from '../../modules/m01/storage/languageWriter';
import { createUpdateCoordinator } from './updateCoordinator';
import { UpdatePrompt } from './UpdatePrompt';

function setup(pathname = '/') {
  const coordinator = createUpdateCoordinator({ locks: undefined });
  const view = render(<UpdatePrompt coordinator={coordinator} pathname={pathname} />);
  return { coordinator, ...view };
}

describe('UpdatePrompt', () => {
  it('không có bản mới → không hiện', () => {
    setup();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('có bản mới trên route du khách → câu copy với Cập nhật và Để sau', async () => {
    await writeLanguagePreference('vi');
    const { coordinator } = setup('/routes/r1');
    act(() => coordinator.notifyUpdateAvailable(vi.fn()));
    expect(await screen.findByText('Đã có phiên bản mới của ứng dụng.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cập nhật' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Để sau' })).toBeTruthy();
  });

  it('màn /admin/* không có lời nhắc (BR-M03-L13)', () => {
    const { coordinator } = setup('/admin/routes');
    act(() => coordinator.notifyUpdateAvailable(vi.fn()));
    expect(screen.queryByText(/phiên bản mới|new version/)).toBeNull();
  });

  it('Cập nhật → coordinator áp bản mới', async () => {
    await writeLanguagePreference('en');
    const { coordinator } = setup();
    const apply = vi.fn();
    act(() => coordinator.notifyUpdateAvailable(apply));
    await userEvent.click(await screen.findByRole('button', { name: 'Update' }));
    expect(apply).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(screen.queryByText('A new version of the app is available.')).toBeNull());
  });

  it('Cập nhật khi đang có thao tác gói → hoãn, lời nhắc vẫn còn', async () => {
    await writeLanguagePreference('vi');
    const { coordinator } = setup();
    const apply = vi.fn();
    act(() => coordinator.notifyUpdateAvailable(apply));
    const release = coordinator.registerPackageOperation();
    await userEvent.click(await screen.findByRole('button', { name: 'Cập nhật' }));
    expect(apply).not.toHaveBeenCalled();
    expect(screen.getByText('Đã có phiên bản mới của ứng dụng.')).toBeTruthy();
    release();
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('Để sau → đóng lời nhắc, giữ bản đang chờ', async () => {
    await writeLanguagePreference('vi');
    const { coordinator } = setup();
    act(() => coordinator.notifyUpdateAvailable(vi.fn()));
    await userEvent.click(await screen.findByRole('button', { name: 'Để sau' }));
    expect(screen.queryByText('Đã có phiên bản mới của ứng dụng.')).toBeNull();
    expect(coordinator.isUpdateAvailable()).toBe(true);
  });
});
