// Mila trong slot (specs/005 mascot-ui-contract §1, §3; design-system §9). Chỉ hiển thị: ảnh tư thế (hoặc hình giữ
// chỗ), bong bóng có đuôi chỉ về Mila, nút đóng, CTA. Không quyết định khi nào nói; không chiếm focus.
import { useEffect, useState } from 'react';
import type { CtaId, Language } from '../../shared/mascot/events';
import { blinkAsset, poseAsset, type PoseAsset } from '../../shared/mascot/assets';
import { MASCOT_BLINK_MS } from '../../shared/mascot/config';
import { labelsFor } from '../../shared/mascot/dialogue/catalog';
import type { ViewState } from '../../shared/mascot/types';
import { TintIcon } from '../../shared/ui/Icon';
import styles from './Mascot.module.css';
import { useTypewriter } from './useTypewriter';

export type BubbleView = { messageId: string; text: string; role?: 'status' | undefined; cta: readonly CtaId[] };

type Props = {
  view: ViewState;
  bubble: BubbleView | null;
  language: Language;
  reducedMotion: boolean;
  /** Chữ bong bóng hiện dần (chuyển động bật, không giảm chuyển động) — research R-20 */
  typing: boolean;
  onTap: () => void;
  onClose: () => void;
  onCta: (cta: CtaId) => void;
  onAssetError: () => void;
};

const LEAVES = Array.from({ length: 12 }, (_, i) => i);
/** Mốc cấp 2 (AN-MILESTONE): ít lá hơn (FX-01) */
const MILESTONE_LEAVES = LEAVES.slice(0, 6);

function ctaLabel(cta: CtaId, labels: ReturnType<typeof labelsFor>): string {
  switch (cta) {
    case 'recommend':
      return labels.ctaRecommend;
    case 'seeAll':
      return labels.ctaSeeAll;
    case 'closeCamera':
      return labels.ctaCloseCamera;
    case 'notNow':
      return labels.notNow;
  }
}

const srcSetOf = (asset: PoseAsset, smallOnly: boolean) =>
  !smallOnly && asset.src480 !== asset.src240 ? `${asset.src240} 1x, ${asset.src480} 2x` : undefined;

/**
 * Chớp mắt (AN-BLINK; research R-24): ảnh mắt nhắm MA-20 của tư thế DOCK được nạp sẵn khi tư thế hiện, để lần chớp
 * không phải chờ mạng; cử chỉ `blink` đổi sang nó `MASCOT_BLINK_MS` rồi về. Ảnh mắt nhắm hỏng → bỏ chớp, Mila vẫn ở.
 */
function useBlink(view: ViewState, still: boolean): { blink: PoseAsset | null; onBlinkError: () => void } {
  const asset = view.mode === 'DOCK' ? blinkAsset(view.pose) : null;
  const [closed, setClosed] = useState(view.animation === 'blink' && !still);
  useEffect(() => {
    if (!asset || still) return;
    const image = new Image();
    image.decoding = 'async';
    const srcSet = srcSetOf(asset, false);
    if (srcSet) image.srcset = srcSet;
    image.src = asset.src240;
  }, [asset, still]);
  useEffect(() => {
    if (!closed) return undefined;
    const id = window.setTimeout(() => setClosed(false), MASCOT_BLINK_MS);
    return () => window.clearTimeout(id);
  }, [closed]);
  return { blink: closed ? asset : null, onBlinkError: () => setClosed(false) };
}

function Pose({ view, still, onAssetError }: { view: ViewState; still: boolean; onAssetError: () => void }) {
  // AVATAR dùng ảnh đầu và vai MA-11 (Asset spec §3): ảnh toàn thân quá nhỏ để đọc ở cỡ này
  const pose = (view.mode === 'AVATAR' ? poseAsset('avatar') : null) ?? poseAsset(view.pose);
  // Ảnh lớn (480/192) không có trong precache: tải hỏng (thường do offline) thì lùi về ảnh nhỏ, không làm Mila biến mất
  const [smallOnly, setSmallOnly] = useState(false);
  const { blink, onBlinkError } = useBlink(view, still);
  const asset = blink ?? pose;
  if (!asset) {
    return (
      <span className={styles.placeholder} data-mascot-placeholder="">
        <TintIcon name="leaf" className={styles.placeholderLeaf} />
      </span>
    );
  }
  return (
    <img
      className={styles.image}
      src={asset.src240}
      srcSet={srcSetOf(asset, smallOnly)}
      alt=""
      decoding="async"
      data-mascot-blink={blink ? '' : undefined}
      onError={() => (blink ? onBlinkError() : smallOnly ? onAssetError() : setSmallOnly(true))}
    />
  );
}

export function Mascot({ view, bubble, language, reducedMotion, typing, onTap, onClose, onCta, onAssetError }: Props) {
  const labels = labelsFor(language);
  const typewriter = useTypewriter(bubble?.text ?? '', typing && bubble !== null);
  // Chạm để hỏi chỉ ở DOCK và AVATAR (BR-MAS-12); INTRO và CELEBRATE là trang trí
  const tappable = view.mode === 'DOCK' || view.mode === 'AVATAR';
  const primaryCta = bubble?.cta.find((cta) => cta !== 'notNow');

  return (
    <div
      key={view.seq}
      className={styles.mascot}
      data-mascot-mode={view.mode}
      data-mascot-pose={view.pose}
      data-mascot-animation={reducedMotion ? undefined : (view.animation ?? 'enter')}
    >
      {tappable ? (
        <button type="button" className={styles.figure} aria-label={labels.ask} onClick={onTap}>
          <Pose view={view} still={reducedMotion} onAssetError={onAssetError} />
        </button>
      ) : (
        <span className={styles.figure} aria-hidden="true">
          <Pose view={view} still={reducedMotion} onAssetError={onAssetError} />
        </span>
      )}

      {bubble && (
        <div className={styles.bubble}>
          {/* Tên chỉ để nhìn: nút Mila đã có tên "Hỏi Mila" */}
          <span className={styles.name} data-mascot-name="" aria-hidden="true">
            {labels.name}
          </span>
          {/* Đoạn gốc luôn giữ câu đầy đủ (trình đọc màn hình đọc một lần, bong bóng không đổi cỡ khi chữ hiện);
              lớp phủ hiện dần chỉ để nhìn. Chạm vào chữ → hiện hết */}
          <div className={styles.textWrap} onClick={typewriter.finish}>
            <p
              className={styles.text}
              lang={language}
              data-mascot-message={bubble.messageId}
              data-typing={typewriter.typing ? 'true' : undefined}
              role={bubble.role}
            >
              {bubble.text}
            </p>
            {typewriter.typing && (
              <span className={styles.typed} data-mascot-typed="" aria-hidden="true">
                {typewriter.shown}
              </span>
            )}
          </div>
          {bubble.cta.length > 0 && (
            <div className={styles.actions}>
              {primaryCta && (
                <button type="button" className={styles.primary} onClick={() => onCta(primaryCta)}>
                  {ctaLabel(primaryCta, labels)}
                </button>
              )}
              {bubble.cta.includes('notNow') && (
                <button type="button" className={styles.secondary} onClick={() => onCta('notNow')}>
                  {labels.notNow}
                </button>
              )}
            </div>
          )}
          <button type="button" className={styles.close} aria-label={labels.dismiss} onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      {(view.mode === 'CELEBRATE' || view.animation === 'milestone') && !reducedMotion && (
        <span className={styles.leaves} aria-hidden="true" data-mascot-leaves="">
          {(view.mode === 'CELEBRATE' ? LEAVES : MILESTONE_LEAVES).map((i) => (
            <TintIcon key={i} name="leaf" className={styles.leaf} />
          ))}
        </span>
      )}
    </div>
  );
}
