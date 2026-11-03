// Trạng thái dịch của một trường song ngữ (spec-AI_integration BR-AI-01…06, 09, 11; data-model §3; research R-09).
// Chỉ dịch khi admin bấm; kết quả ghi qua setEnglish (= onChange của form) nên form "chưa lưu" và mọi kiểm tra
// độ dài của M03 chạy như khi admin tự gõ (BR-AI-06). Không lưu gì về việc chữ có phải máy dịch (BR-AI-12).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslator } from '../api/AdminApiProvider';
import { stripLineBreaks } from '../validation/common';
import { translationRequest, type LineBreaks, type TranslationRequest } from './translationContract';

export type TranslationStatus = 'idle' | 'translating' | 'failed';

export type FieldTranslation = {
  status: TranslationStatus;
  /** Nút "→" bấm được: form sửa được, nguồn có chữ sau trim, không đang dịch (BR-AI-01, BR-AI-07) */
  canTranslate: boolean;
  translate(): void;
  /** "Thử lại" gửi lại đúng yêu cầu vừa lỗi (BR-AI-09) */
  retry(): void;
  /** Gọi khi admin gõ vào ô tiếng Anh: bỏ kết quả đang chờ và xóa thông báo lỗi (BR-AI-04, BR-AI-09) */
  onEnglishTyped(): void;
};

export function useFieldTranslation({
  source,
  setEnglish,
  lineBreaks,
  enabled,
}: {
  source: string;
  setEnglish: (value: string) => void;
  lineBreaks: LineBreaks;
  enabled: boolean;
}): FieldTranslation {
  const translator = useTranslator();
  const [status, setStatus] = useState<TranslationStatus>('idle');

  // Giá trị mới nhất cho callback bất đồng bộ
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const setEnglishRef = useRef(setEnglish);
  setEnglishRef.current = setEnglish;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Một lượt dịch: text đã gửi và việc admin đã gõ ô tiếng Anh từ lúc bấm (BR-AI-04)
  const inFlightRef = useRef(false);
  const typedSinceRequestRef = useRef(false);
  const lastRequestRef = useRef<TranslationRequest | null>(null);

  const send = useCallback(
    (request: TranslationRequest) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      typedSinceRequestRef.current = false;
      lastRequestRef.current = request;
      setStatus('translating');
      void translator
        .translate(request)
        .catch(() => ({ ok: false }) as const)
        .then((outcome) => {
          inFlightRef.current = false;
          if (!mountedRef.current) return;
          const stillCurrent = sourceRef.current.trim() === request.text && !typedSinceRequestRef.current;
          if (!stillCurrent) {
            setStatus('idle');
            return;
          }
          if (!outcome.ok) {
            setStatus('failed');
            return;
          }
          setEnglishRef.current(lineBreaks === 'NOT_ALLOWED' ? stripLineBreaks(outcome.text) : outcome.text);
          setStatus('idle');
        });
    },
    [translator, lineBreaks],
  );

  const canTranslate = enabled && source.trim() !== '' && status !== 'translating';

  const translate = useCallback(() => {
    if (!enabled || sourceRef.current.trim() === '') return;
    send(translationRequest(sourceRef.current, lineBreaks));
  }, [enabled, lineBreaks, send]);

  const retry = useCallback(() => {
    if (lastRequestRef.current && enabled) send(lastRequestRef.current);
  }, [enabled, send]);

  const onEnglishTyped = useCallback(() => {
    typedSinceRequestRef.current = true;
    setStatus((current) => (current === 'failed' ? 'idle' : current));
  }, []);

  return { status, canTranslate, translate, retry, onEnglishTyped };
}
