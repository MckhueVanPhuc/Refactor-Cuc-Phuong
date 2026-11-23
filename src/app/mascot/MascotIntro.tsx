// Lớp phủ giới thiệu Mila (spec-Mascot v1.3 US-MAS-01; design-system §9.3b; specs/005 research R-27). Hiện một lần sau
// lần chọn ngôn ngữ đầu tiên: phủ cả màn, Mila và một bong bóng ở giữa, dòng "Chạm để bắt đầu". Chạm (hoặc Enter,
// Space): chữ đang hiện dần thì hiện hết, đã hiện hết thì đóng. Esc và nút Back của điện thoại đóng ngay. Không có nút
// "Bỏ qua" hay nút ×. Trong lúc mở, phần còn lại của app `inert`; đóng thì focus về tiêu đề trang.
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { Language } from '../../shared/mascot/events';
import { poseAsset } from '../../shared/mascot/assets';
import { labelsFor } from '../../shared/mascot/dialogue/catalog';
import styles from './MascotIntro.module.css';
import { useTypewriter } from './useTypewriter';

type Props = {
  text: string;
  language: Language;
  /** Chữ hiện dần (chuyển động bật, không giảm chuyển động) */
  typing: boolean;
  reducedMotion: boolean;
  onClose: () => void;
  onAssetError: () => void;
};

const APP_ROOT = 'root';

/** Khóa phần còn lại của app trong lúc lớp phủ mở; trả focus về tiêu đề trang khi đóng. */
function useModal(dialog: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = document.getElementById(APP_ROOT);
    root?.setAttribute('inert', '');
    dialog.current?.focus();
    return () => {
      root?.removeAttribute('inert');
      const heading = document.querySelector<HTMLElement>('main h1, h1');
      if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      heading?.focus();
    };
  }, [dialog]);
}

/**
 * Nút Back của điện thoại đóng lớp phủ thay vì rời màn: thêm một mục lịch sử cùng URL khi mở, nghe `popstate`. Đóng bằng
 * cách khác thì lùi lại mục đó (router thấy cùng vị trí, không điều hướng). Mục lịch sử được thêm ở lượt sau và hủy nếu
 * effect bị dọn ngay (StrictMode mount hai lần), nên không bao giờ có `history.back()` thừa.
 */
function useBackCloses(onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    let pushed = false;
    let popped = false;
    const push = window.setTimeout(() => {
      window.history.pushState(window.history.state, '', window.location.href);
      pushed = true;
    }, 0);
    const onPop = () => {
      popped = true;
      close.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.clearTimeout(push);
      window.removeEventListener('popstate', onPop);
      if (pushed && !popped) window.history.back();
    };
  }, []);
}

export function MascotIntro({ text, language, typing, reducedMotion, onClose, onAssetError }: Props) {
  const labels = labelsFor(language);
  const dialog = useRef<HTMLDivElement>(null);
  const typewriter = useTypewriter(text, typing);
  const asset = poseAsset('wave');
  // Ảnh lớn không có trong precache: hỏng (thường do offline) thì lùi về ảnh nhỏ, rồi mới coi là lỗi
  const [smallOnly, setSmallOnly] = useState(false);
  useModal(dialog);
  useBackCloses(onClose);

  const advance = () => {
    if (typewriter.typing) typewriter.finish();
    else onClose();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      advance();
    }
  };

  return (
    <div
      ref={dialog}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={labels.name}
      tabIndex={-1}
      data-mascot-intro=""
      data-mascot-animation={reducedMotion ? undefined : 'intro'}
      onClick={advance}
      onKeyDown={onKeyDown}
    >
      <div className={styles.stage}>
        <div className={styles.bubble}>
          <span className={styles.name} aria-hidden="true">
            {labels.name}
          </span>
          <div className={styles.textWrap}>
            <p className={styles.text} lang={language} data-mascot-message="MSG-MAS-001" data-typing={typewriter.typing ? 'true' : undefined}>
              {text}
            </p>
            {typewriter.typing && (
              <span className={styles.typed} data-mascot-typed="" aria-hidden="true">
                {typewriter.shown}
              </span>
            )}
          </div>
        </div>
        <span className={styles.figure} aria-hidden="true">
          {asset && (
            <img
              className={styles.image}
              src={asset.src240}
              srcSet={smallOnly || asset.src480 === asset.src240 ? undefined : `${asset.src240} 1x, ${asset.src480} 2x`}
              alt=""
              decoding="async"
              onError={() => (smallOnly ? onAssetError() : setSmallOnly(true))}
            />
          )}
        </span>
        <span className={styles.hint} data-mascot-intro-hint="">
          {labels.introHint}
        </span>
      </div>
    </div>
  );
}
