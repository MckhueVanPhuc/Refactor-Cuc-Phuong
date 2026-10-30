import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AdminApiError } from '../api/errors';
import type { CommandResult } from '../contracts/commandResult';
import { useDraftForm } from './useDraftForm';

type Form = { name: { vi: string; en: string }; media: { mediaId: string; usageRightsConfirmed: boolean }[]; note: string };

const initial: Form = { name: { vi: 'Tuyến', en: '' }, media: [], note: '' };
const ok: CommandResult<{ revision: number }> = { ok: true, messageKey: 'MSG-SAVED', data: { revision: 2 } };

describe('useDraftForm (BR-M03-F11, L06; research R-20)', () => {
  it('theo dõi dirty so với bản đã lưu', () => {
    const { result } = renderHook(() => useDraftForm({ initial, save: vi.fn() }));
    expect(result.current.isDirty).toBe(false);
    act(() => result.current.update((form) => ({ ...form, note: 'Ghi chú' })));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.update((form) => ({ ...form, note: '' })));
    expect(result.current.isDirty).toBe(false);
  });

  it('không autosave: chỉ gọi save khi bấm Lưu, gửi toàn bộ state trong một lần', async () => {
    const save = vi.fn().mockResolvedValue(ok);
    const { result } = renderHook(() => useDraftForm({ initial, save }));
    act(() => result.current.update((form) => ({ ...form, name: { vi: 'Tuyến', en: 'Route' } })));
    act(() => result.current.update((form) => ({ ...form, media: [{ mediaId: 'm1', usageRightsConfirmed: true }] })));
    expect(save).not.toHaveBeenCalled();
    await act(() => result.current.saveDraft());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({
      name: { vi: 'Tuyến', en: 'Route' },
      media: [{ mediaId: 'm1', usageRightsConfirmed: true }],
      note: '',
    });
  });

  it('ok → outcome MSG-SAVED, hết dirty', async () => {
    const { result } = renderHook(() => useDraftForm({ initial, save: vi.fn().mockResolvedValue(ok) }));
    act(() => result.current.update((form) => ({ ...form, note: 'x' })));
    await act(() => result.current.saveDraft());
    expect(result.current.outcome).toEqual(ok);
    expect(result.current.isDirty).toBe(false);
  });

  it('STALE hoặc lỗi → state giữ nguyên, vẫn dirty, không có MSG-SAVED', async () => {
    const stale: CommandResult<{ revision: number }> = {
      ok: false,
      reason: 'STALE',
      messageKey: 'MSG-STALE',
      stale: { editorEmail: 'other@example.test', editedAt: '2026-10-30T03:00:00Z' },
    };
    const { result } = renderHook(() => useDraftForm({ initial, save: vi.fn().mockResolvedValue(stale) }));
    act(() => result.current.update((form) => ({ ...form, note: 'Đang gõ' })));
    await act(() => result.current.saveDraft());
    expect(result.current.state.note).toBe('Đang gõ');
    expect(result.current.isDirty).toBe(true);
    expect(result.current.outcome).toEqual(stale);
  });

  it('lỗi transport → transportError, state giữ nguyên', async () => {
    const save = vi.fn().mockRejectedValue(new AdminApiError('MSG-NETWORK-FAILED'));
    const { result } = renderHook(() => useDraftForm({ initial, save }));
    act(() => result.current.update((form) => ({ ...form, note: 'Đang gõ' })));
    await act(() => result.current.saveDraft());
    expect(result.current.transportError?.messageKey).toBe('MSG-NETWORK-FAILED');
    expect(result.current.state.note).toBe('Đang gõ');
    expect(result.current.outcome).toBeNull();
  });

  it('gõ tiếp trong lúc đang lưu: chữ mới vẫn còn và vẫn dirty sau khi lưu xong', async () => {
    let resolve: (value: CommandResult<{ revision: number }>) => void = () => {};
    const save = vi.fn(() => new Promise<CommandResult<{ revision: number }>>((r) => (resolve = r)));
    const { result } = renderHook(() => useDraftForm({ initial, save }));
    act(() => result.current.update((form) => ({ ...form, note: 'A' })));
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.saveDraft();
    });
    expect(result.current.saving).toBe(true);
    act(() => result.current.update((form) => ({ ...form, note: 'AB' })));
    await act(async () => {
      resolve(ok);
      await pending;
    });
    expect(result.current.state.note).toBe('AB');
    expect(result.current.isDirty).toBe(true);
  });

  it('reset nạp bản mới (Tải lại) và xóa kết quả cũ', async () => {
    const { result } = renderHook(() => useDraftForm({ initial, save: vi.fn().mockResolvedValue(ok) }));
    act(() => result.current.update((form) => ({ ...form, note: 'x' })));
    act(() => result.current.reset({ ...initial, note: 'Từ server' }));
    expect(result.current.state.note).toBe('Từ server');
    expect(result.current.isDirty).toBe(false);
    expect(result.current.outcome).toBeNull();
  });
});
