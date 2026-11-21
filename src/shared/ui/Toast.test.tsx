// Toast dùng chung (design-system §5.3; người dùng duyệt 2026-11-21): 6 giây, nút đóng, tạm dừng khi hover/focus.
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast, TOAST_SHOWN_MS } from './Toast';

const LEAVE_MS = 200;

function show() {
  render(<Toast closeLabel="Đóng thông báo">Đã ghi nhận lượt quét.</Toast>);
  return screen.getByRole('status');
}

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Toast', () => {
  it('chỉ câu thông báo là vùng role="status"; có nút đóng với tên bằng chữ', () => {
    expect(show().textContent).toBe('Đã ghi nhận lượt quét.');
    expect(screen.getByRole('button', { name: 'Đóng thông báo' })).toBeTruthy();
  });

  it('tự đóng sau 6 giây', () => {
    show();
    advance(TOAST_SHOWN_MS - 1);
    expect(screen.queryByRole('status')).not.toBeNull();
    advance(1);
    advance(LEAVE_MS);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('nút đóng ẩn toast ngay', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Đóng thông báo' }));
    advance(LEAVE_MS);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('hover tạm dừng đếm; rời chuột thì đếm tiếp phần còn lại', () => {
    const toast = show().parentElement!;
    advance(4000);
    fireEvent.mouseEnter(toast);
    advance(60_000);
    expect(screen.queryByRole('status')).not.toBeNull();
    fireEvent.mouseLeave(toast);
    advance(1999);
    expect(screen.queryByRole('status')).not.toBeNull();
    advance(1);
    advance(LEAVE_MS);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('focus trong toast tạm dừng đếm', () => {
    show();
    act(() => screen.getByRole('button', { name: 'Đóng thông báo' }).focus());
    advance(60_000);
    expect(screen.queryByRole('status')).not.toBeNull();
    act(() => screen.getByRole('button', { name: 'Đóng thông báo' }).blur());
    advance(TOAST_SHOWN_MS);
    advance(LEAVE_MS);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
