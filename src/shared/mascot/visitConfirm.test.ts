// Mila xác nhận lượt ghé thay toast (specs/005 tasks T097; spec-Mascot v1.2 BR-MAS-24; research R-26).
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { markMascotFailed, markVisitConfirmed, resetVisitConfirmForTest, useMascotConfirms } from './visitConfirm';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  resetVisitConfirmForTest();
});

describe('useMascotConfirms', () => {
  it('cờ Mila tắt → toast ngay', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'off');
    expect(renderHook(() => useMascotConfirms('v1')).result.current).toBe('toast');
  });

  it('cờ bật: chờ (không toast) → Mila xác nhận trong 1 giây → mascot', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    vi.useFakeTimers();
    const { result } = renderHook(() => useMascotConfirms('v1'));
    expect(result.current).toBe('pending');
    act(() => markVisitConfirmed('v1'));
    expect(result.current).toBe('mascot');
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current).toBe('mascot');
  });

  it('quá 1 giây chưa có bong bóng → toast (và giữ toast dù bong bóng tới muộn)', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    vi.useFakeTimers();
    const { result } = renderHook(() => useMascotConfirms('v2'));
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe('toast');
    act(() => markVisitConfirmed('v2'));
    expect(result.current).toBe('toast');
  });

  it('Mila ẩn vì lỗi → toast ngay', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const { result } = renderHook(() => useMascotConfirms('v3'));
    act(() => markMascotFailed());
    expect(result.current).toBe('toast');
  });

  it('không lưu gì (BR-MAS-18)', () => {
    vi.stubEnv('VITE_FEATURE_MASCOT', 'on');
    const before = JSON.stringify({ ...localStorage });
    markVisitConfirmed('v4');
    expect(JSON.stringify({ ...localStorage })).toBe(before);
  });
});
