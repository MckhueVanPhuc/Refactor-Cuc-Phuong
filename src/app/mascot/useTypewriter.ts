// Chữ bong bóng hiện dần (spec-Mascot v1.1 §5.4 `MASCOT_TYPE_CPS`; design-system §9.3; specs/005 research R-20).
// Chỉ là lớp nhìn: đoạn chữ gốc luôn giữ câu đầy đủ cho trình đọc màn hình. Đếm theo thời gian thật đã trôi (không
// theo số lần hẹn giờ), nên máy chậm vẫn đúng nhịp.
import { useCallback, useEffect, useRef, useState } from 'react';
import { MASCOT_TYPE_CPS } from '../../shared/mascot/config';

type Progress = { text: string; count: number; done: boolean };

/** `typing`: đang hiện dần; `shown`: phần đã hiện; `finish`: hiện hết ngay (du khách chạm bong bóng). */
export function useTypewriter(text: string, enabled: boolean): { typing: boolean; shown: string; finish: () => void } {
  const [progress, setProgress] = useState<Progress>({ text, count: 0, done: !enabled });
  const timer = useRef<number | null>(null);
  // Câu mới: bắt đầu lại từ đầu ngay trong lần render này, không chờ effect
  const current = progress.text === text ? progress : { text, count: 0, done: !enabled };

  const stop = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (!enabled) return undefined;
    const start = Date.now();
    timer.current = window.setInterval(() => {
      const count = Math.floor(((Date.now() - start) * MASCOT_TYPE_CPS) / 1000);
      if (count >= text.length) {
        stop();
        setProgress({ text, count: text.length, done: true });
      } else {
        setProgress({ text, count, done: false });
      }
    }, 1000 / MASCOT_TYPE_CPS);
    return stop;
  }, [text, enabled]);

  const finish = useCallback(() => {
    stop();
    setProgress({ text, count: text.length, done: true });
  }, [text]);

  return { typing: enabled && !current.done, shown: text.slice(0, current.count), finish };
}
