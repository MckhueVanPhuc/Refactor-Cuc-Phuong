// Mila trong slot (specs/005 mascot-ui-contract §1, §3; design-system §9). Chỉ hiển thị: ảnh tư thế (hoặc hình giữ
// chỗ), bong bóng có đuôi chỉ về Mila, nút đóng, CTA. Không quyết định khi nào nói; không chiếm focus.
import type { CtaId, Language } from '../../shared/mascot/events';
import { poseAsset } from '../../shared/mascot/assets';
import { labelsFor } from '../../shared/mascot/dialogue/catalog';
import type { ViewState } from '../../shared/mascot/types';
import { TintIcon } from '../../shared/ui/Icon';
import styles from './Mascot.module.css';

export type BubbleView = { messageId: string; text: string; role?: 'status' | undefined; cta: readonly CtaId[] };

type Props = {
  view: ViewState;
  bubble: BubbleView | null;
  language: Language;
  reducedMotion: boolean;
  onTap: () => void;
  onClose: () => void;
  onCta: (cta: CtaId) => void;
  onAssetError: () => void;
};

const LEAVES = Array.from({ length: 12 }, (_, i) => i);

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

function Pose({ view, onAssetError }: { view: ViewState; onAssetError: () => void }) {
  // AVATAR (40 px) dùng ảnh đầu và vai MA-11 (Asset spec §3): ảnh toàn thân quá nhỏ để đọc ở cỡ này
  const asset = (view.mode === 'AVATAR' ? poseAsset('avatar') : null) ?? poseAsset(view.pose);
  const large = view.mode === 'INTRO' || view.mode === 'CELEBRATE';
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
      srcSet={large ? `${asset.src240} 1x, ${asset.src480} 2x` : undefined}
      alt=""
      decoding="async"
      onError={onAssetError}
    />
  );
}

export function Mascot({ view, bubble, language, reducedMotion, onTap, onClose, onCta, onAssetError }: Props) {
  const labels = labelsFor(language);
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
          <Pose view={view} onAssetError={onAssetError} />
        </button>
      ) : (
        <span className={styles.figure} aria-hidden="true">
          <Pose view={view} onAssetError={onAssetError} />
        </span>
      )}

      {bubble && (
        <div className={styles.bubble}>
          <p className={styles.text} lang={language} data-mascot-message={bubble.messageId} role={bubble.role}>
            {bubble.text}
          </p>
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

      {view.mode === 'CELEBRATE' && !reducedMotion && (
        <span className={styles.leaves} aria-hidden="true">
          {LEAVES.map((i) => (
            <TintIcon key={i} name="leaf" className={styles.leaf} />
          ))}
        </span>
      )}
    </div>
  );
}
