// Tương phản của các cặp token màu mà màn M03 dùng (tasks T160; design-system §6; WCAG 2.1 AA 1.4.3, 1.4.11):
// chữ ≥ 4.5:1 trên mọi nền sáng của M03; chữ trắng trên nền accent (nút chính) ≥ 4.5:1; viền ô nhập ≥ 3:1.
// Đọc giá trị từ tokens.css nên token đổi mà hỏng tương phản thì test báo.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(join(process.cwd(), 'src', 'shared', 'ui', 'tokens.css'), 'utf8');

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\b`).exec(tokens);
  if (!match) throw new Error(`không tìm thấy token --${name}`);
  return match[1]!;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** Nền sáng của M03: trang, thẻ, nền phụ, dòng đang chọn */
const BACKGROUNDS = ['color-white', 'color-paper', 'color-m03-muted', 'color-m03-active'];
/** Màu chữ M03 dùng trên các nền đó */
const TEXT = ['color-ink', 'color-ink-secondary', 'color-m03-accent', 'color-error', 'color-warning', 'color-success', 'color-info'];

describe('tương phản token M03 (WCAG 2.1 AA)', () => {
  it.each(TEXT.flatMap((text) => BACKGROUNDS.map((background) => [text, background] as const)))('chữ %s trên %s ≥ 4.5:1', (text, background) => {
    expect(contrast(token(text), token(background))).toBeGreaterThanOrEqual(4.5);
  });

  it('chữ trắng trên nền accent (nút chính) ≥ 4.5:1', () => {
    expect(contrast(token('color-white'), token('color-m03-accent'))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(BACKGROUNDS)('viền ô nhập trên %s ≥ 3:1 (thành phần không phải chữ)', (background) => {
    expect(contrast(token('color-m03-control-border'), token(background))).toBeGreaterThanOrEqual(3);
  });
});
