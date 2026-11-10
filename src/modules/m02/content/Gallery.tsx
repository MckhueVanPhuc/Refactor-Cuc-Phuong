// Thư viện ảnh của một mã QR (E-SCR-M02-002-05): dải ảnh trượt ngang có điểm dừng theo từng ảnh, nút Ảnh trước / Ảnh
// tiếp và chấm vị trí khi có từ hai ảnh. Vuốt, cuộn và bàn phím (Tab tới nút) đều dùng được; chấm chỉ để nhìn. Ảnh giống
// nhau ở cả hai ngôn ngữ; ảnh lỗi vẫn giữ ô trung tính do nơi gọi truyền vào.
import { useId, useRef, useState, type ReactNode } from 'react';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './Gallery.module.css';

export function Gallery({ slides }: { slides: readonly { key: string; node: ReactNode }[] }) {
  const messages = useM02Messages();
  const titleId = useId();
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const many = slides.length > 1;

  /** Bước cuộn = bề ngang một ảnh + khoảng cách giữa hai ảnh. */
  function step(): number {
    const el = track.current;
    const first = el?.firstElementChild as HTMLElement | null | undefined;
    if (!el || !first) return 0;
    return first.offsetWidth + (Number.parseFloat(getComputedStyle(el).columnGap) || 0);
  }

  function go(direction: -1 | 1) {
    const el = track.current;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el?.scrollBy?.({ left: direction * step(), behavior: reduce ? 'auto' : 'smooth' });
  }

  function onScroll() {
    const el = track.current;
    const width = step();
    if (el && width > 0) setActive(Math.min(slides.length - 1, Math.round(el.scrollLeft / width)));
  }

  if (slides.length === 0) return null;
  return (
    <section className={styles.gallery} aria-labelledby={titleId}>
      <h2 className={styles.title} id={titleId}>
        <TintIcon name="image" />
        {messages.content.galleryTitle}
      </h2>
      <div className={styles.frame}>
        <ul className={styles.track} ref={track} onScroll={onScroll} data-count={slides.length}>
          {slides.map((slide) => (
            <li className={styles.slide} key={slide.key}>
              {slide.node}
            </li>
          ))}
        </ul>
        {many && (
          <>
            <button
              type="button"
              className={`${styles.nav} ${styles.prev}`}
              aria-label={messages.content.previousPhoto}
              disabled={active === 0}
              onClick={() => go(-1)}
            >
              <TintIcon name="chevron-left" />
            </button>
            <button
              type="button"
              className={`${styles.nav} ${styles.next}`}
              aria-label={messages.content.nextPhoto}
              disabled={active === slides.length - 1}
              onClick={() => go(1)}
            >
              <TintIcon name="chevron-right" />
            </button>
          </>
        )}
      </div>
      {many && (
        <div className={styles.dots} aria-hidden="true">
          {slides.map((slide, index) => (
            <span key={slide.key} className={styles.dot} data-active={index === active || undefined} />
          ))}
        </div>
      )}
    </section>
  );
}
