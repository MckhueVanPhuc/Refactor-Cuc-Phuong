import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TextField } from './TextField';

describe('TextField', () => {
  it('nhãn luôn hiển thị và gắn với ô nhập', () => {
    render(<TextField label="Tên tiếng Việt" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Tên tiếng Việt').tagName).toBe('INPUT');
  });

  it('lỗi nằm dưới trường, có tiền tố chữ, gắn aria-describedby và aria-invalid', () => {
    render(<TextField label="Tên tiếng Việt" value="" onChange={() => {}} error="Nhập tên tiếng Việt." />);
    const input = screen.getByLabelText('Tên tiếng Việt');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const ids = (input.getAttribute('aria-describedby') ?? '').split(' ');
    const errorId = ids.find((id) => id.endsWith('-error'));
    expect(errorId).toBeDefined();
    expect(document.getElementById(errorId!)?.textContent).toBe('Lỗi: Nhập tên tiếng Việt.');
  });

  it('không có lỗi thì không đặt aria-invalid', () => {
    render(<TextField label="Tên" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Tên').getAttribute('aria-invalid')).toBeNull();
  });

  it('extraDescribedBy được nối vào aria-describedby, cạnh bộ đếm', () => {
    render(<TextField label="Tên" value="Cúc" onChange={() => {}} maxChars={80} extraDescribedBy="trang-thai-dich" />);
    const ids = (screen.getByLabelText('Tên').getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toContain('trang-thai-dich');
    expect(ids.some((id) => id.endsWith('-counter'))).toBe(true);
  });

  it('đếm ký tự khi có maxChars', () => {
    render(<TextField label="Tên" value="Cúc" onChange={() => {}} maxChars={80} />);
    expect(screen.getByText('3/80')).toBeTruthy();
  });
});
