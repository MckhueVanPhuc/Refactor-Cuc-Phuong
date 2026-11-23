// Lớp phủ giới thiệu (specs/005 tasks T102; spec-Mascot v1.3 US-MAS-01; research R-27).
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MascotIntro } from './MascotIntro';

const TEXT = 'Chào bạn! Mình là Mila, rái cá thám hiểm của Cúc Phương. Mình sẽ đồng hành cùng bạn trong suốt chuyến tham quan này. Cùng chọn một tuyến nhé!';

function setup(typing: boolean) {
  const onClose = vi.fn();
  document.body.innerHTML = '<div id="root"><h1 tabindex="-1">Danh mục tuyến</h1></div>';
  const utils = render(<MascotIntro text={TEXT} language="vi" typing={typing} reducedMotion={!typing} onClose={onClose} onAssetError={vi.fn()} />, {
    container: document.body.appendChild(document.createElement('div')),
  });
  return { ...utils, onClose };
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('MascotIntro', () => {
  it('hộp thoại modal tên Mila, câu đầy đủ, dòng "Chạm để bắt đầu"; focus vào; #root inert; không có nút', () => {
    const { getByRole } = setup(false);
    const dialog = getByRole('dialog', { name: 'Mila' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(dialog);
    expect(dialog.querySelector('[data-mascot-message="MSG-MAS-001"]')?.textContent).toBe(TEXT);
    expect(dialog.textContent).toContain('Chạm để bắt đầu');
    expect(dialog.querySelectorAll('button')).toHaveLength(0);
    expect(document.getElementById('root')!.hasAttribute('inert')).toBe(true);
  });

  it('chạm khi chữ đang hiện dần → hiện hết, chưa đóng; chạm lần nữa → đóng', () => {
    vi.useFakeTimers();
    const { getByRole, onClose } = setup(true);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    const dialog = getByRole('dialog');
    expect(dialog.querySelector('[data-mascot-typed]')).not.toBeNull();
    fireEvent.click(dialog);
    expect(dialog.querySelector('[data-mascot-typed]')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Enter / Space như chạm; Esc đóng ngay', () => {
    const { getByRole, onClose } = setup(false);
    fireEvent.keyDown(getByRole('dialog'), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('nút Back của điện thoại (popstate) đóng lớp phủ', () => {
    const { onClose } = setup(false);
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('đóng (unmount) → bỏ inert, focus về tiêu đề trang', () => {
    const { unmount } = setup(false);
    unmount();
    expect(document.getElementById('root')!.hasAttribute('inert')).toBe(false);
    expect(document.activeElement?.tagName).toBe('H1');
  });
});
