// Hộp thoại xác nhận kết thúc chuyến (spec-M02 v3.4 BR-M02-021, FR-M02-015; E-SCR-M02-001-19; CHG-MASCOT-2026-11-25-06
// D7–D9). Dùng cho nút "Kết thúc chuyến" (có ở mọi lúc trong chuyến) và cho câu hỏi tự mở khi du khách về màn chuyến đi
// sau lượt quét đầu tiên ở điểm cuối. Câu hỏi theo số điểm đã quét: đủ mọi điểm, hoặc còn {r} điểm chưa quét mã.
// Bảng nền đặc ở đáy màn trên lớp phủ tối, gắn vào <body> để không bị bề mặt kính hay transform của trang ảnh hưởng.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { emitMascotEvent, MascotFigure } from '../../../shared/mascot/index';
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './FinalPrompt.module.css';

export function FinalPrompt({
  k,
  n,
  onEnd,
  onContinue,
  busy = false,
}: {
  /** Số điểm của hành trình đã quét mã */
  k: number;
  /** Số điểm của hành trình */
  n: number;
  onEnd: () => void;
  onContinue: () => void;
  busy?: boolean;
}) {
  const messages = useM02Messages();
  const endButton = useRef<HTMLButtonElement>(null);
  const remaining = Math.max(n - k, 0);
  const question = remaining === 0 ? messages.endPrompt.allScanned({ n }) : messages.endPrompt.someLeft({ r: remaining });
  // Đưa focus vào hộp thoại để bàn phím và trình đọc màn hình đi vào câu hỏi ngay
  useEffect(() => endButton.current?.focus(), []);
  // Mila: hình trong hộp thoại (MAS-B-060); màn chuyến đi ẩn Mila đứng trong lúc hộp thoại mở — một Mila trên màn
  useEffect(() => {
    emitMascotEvent({ type: 'app.dialog.changed', open: true, kind: 'FINAL_PROMPT' });
    emitMascotEvent({ type: 'm02.finalPrompt.opened' });
    return () => emitMascotEvent({ type: 'app.dialog.changed', open: false, kind: 'FINAL_PROMPT' });
  }, []);
  // Esc = [Đi tiếp]: lựa chọn không đổi gì (WCAG 2.1.1)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onContinue();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onContinue]);

  return createPortal(
    <div className={styles.backdrop} data-final-prompt="">
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="m02-final-question">
        {/* Quét đủ mọi điểm: Mila mừng; còn điểm chưa quét: Mila hỏi lại nhẹ nhàng */}
        <MascotFigure pose={remaining === 0 ? 'cheer' : 'think'} />
        <p className={styles.question} id="m02-final-question">
          {question}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.end}
            onClick={() => {
              emitMascotEvent({ type: 'm02.finalPrompt.ended' });
              onEnd();
            }}
            disabled={busy}
            ref={endButton}
          >
            {messages.endPrompt.end}
          </button>
          <button
            type="button"
            className={styles.continue}
            onClick={() => {
              emitMascotEvent({ type: 'm02.finalPrompt.continued' });
              onContinue();
            }}
            disabled={busy}
          >
            {messages.endPrompt.continue}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
