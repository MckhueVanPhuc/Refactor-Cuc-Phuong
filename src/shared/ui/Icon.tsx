import type { CSSProperties } from 'react';
import styles from './Icon.module.css';

// Icon chỉ lấy từ assets/icons/ (CLAUDE.md; design-system §7). Tên icon = tên file không có đuôi.
const files = import.meta.glob<string>('../../../assets/icons/*.{png,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const iconUrls: ReadonlyMap<string, string> = new Map(
  Object.entries(files).map(([path, url]) => [path.replace(/^.*\//, '').replace(/\.(png|svg)$/, ''), url]),
);

export type IconProps = {
  name: string;
  /** Chữ thay thế; dùng '' khi icon chỉ trang trí và đã có chữ đi kèm. */
  alt: string;
};

export function Icon({ name, alt }: IconProps) {
  const src = iconUrls.get(name);
  if (!src) throw new Error(`Không có icon "${name}" trong assets/icons/`);
  return <img className={styles.icon} src={src} alt={alt} aria-hidden={alt === '' || undefined} />;
}

/**
 * Icon SVG đơn sắc dùng làm mask: màu theo `currentColor` của chữ quanh nó, nên màu luôn lấy từ token (design-system
 * §7). Luôn là trang trí đi kèm chữ, ẩn khỏi trình đọc màn hình. Cỡ đặt qua `--icon-size` (mặc định --space-5).
 */
export function TintIcon({ name, className }: { name: string; className?: string | undefined }) {
  const src = iconUrls.get(name);
  if (!src) throw new Error(`Không có icon "${name}" trong assets/icons/`);
  const style = { '--icon-url': `url("${src}")` } as CSSProperties;
  return <span className={className ? `${styles.tint} ${className}` : styles.tint} style={style} aria-hidden="true" />;
}

export function hasIcon(name: string): boolean {
  return iconUrls.has(name);
}
