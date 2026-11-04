// Câu hỏi kết thúc chuyến (tasks T073; E-SCR-M02-003-01…04; BR-M02-021; FR-M02-023): "Bạn đã quét điểm cuối. Kết thúc
// chuyến đi?" với [Kết thúc] / [Đi tiếp]. Dùng cho cả lúc lượt ghé điểm cuối vừa ghi lần đầu và lúc bấm Finish — Finish
// chỉ khả dụng sau khi điểm cuối đã quét, nên cùng một câu hỏi đúng cho cả hai. Màu theo bề mặt của FieldLayout.
import { useEffect, useRef } from 'react';
import { useM02Messages } from '../i18n/useM02Messages';
import styles from './FinalPrompt.module.css';

export function FinalPrompt({ onEnd, onContinue, busy = false }: { onEnd: () => void; onContinue: () => void; busy?: boolean }) {
  const messages = useM02Messages();
  const endButton = useRef<HTMLButtonElement>(null);
  // Đưa focus vào hộp thoại để bàn phím và trình đọc màn hình đi vào câu hỏi ngay
  useEffect(() => endButton.current?.focus(), []);
  // Esc = [Đi tiếp]: lựa chọn không đổi gì (WCAG 2.1.1)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onContinue();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onContinue]);

  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="m02-final-question">
        <p className={styles.question} id="m02-final-question">
          {messages.endPrompt.question}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.end} onClick={onEnd} disabled={busy} ref={endButton}>
            {messages.endPrompt.end}
          </button>
          <button type="button" className={styles.continue} onClick={onContinue} disabled={busy}>
            {messages.endPrompt.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
