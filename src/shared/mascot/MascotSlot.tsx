// Chỗ đặt Mila trong layout của một màn (specs/005 mascot-ui-contract §1–§2). Chiếm chỗ thật nên Mila không bao giờ
// đè lên nút hay nội dung (BR-MAS-11; SC-MAS-002). Không chứa logic hành vi.
import { useEffect, useState } from 'react';
import type { CtaId } from './events';
import { isMascotEnabled } from './flag';
import styles from './MascotSlot.module.css';
import { registerSlot } from './slots';
import type { Mode } from './types';

type Props = {
  id: string;
  modes: readonly Mode[];
  /** Hành động của CTA thuộc màn (ví dụ "Đóng camera" gọi đúng nút đóng hiện có) */
  onCta?: (cta: CtaId) => void;
};

/** Mode cố định lớn nhất quyết định chỗ giữ sẵn; INTRO tràn trong khu vực hero, không giữ chỗ riêng. */
function reservedSize(modes: readonly Mode[]): 'lg' | 'md' | 'sm' | 'none' {
  if (modes.includes('CELEBRATE')) return 'lg';
  if (modes.includes('DOCK')) return 'md';
  if (modes.includes('AVATAR')) return 'sm';
  return 'none';
}

export function MascotSlot({ id, modes, onCta }: Props) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const enabled = isMascotEnabled();
  const modesKey = modes.join(',');

  useEffect(() => {
    if (!enabled || !element) return undefined;
    return registerSlot({ id, modes: modesKey.split(',') as Mode[], element, onCta });
  }, [enabled, element, id, modesKey, onCta]);

  if (!enabled) return null;
  return <div ref={setElement} className={styles.slot} data-mascot-slot={id} data-mascot-size={reservedSize(modes)} />;
}
