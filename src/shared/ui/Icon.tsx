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

export function hasIcon(name: string): boolean {
  return iconUrls.has(name);
}
