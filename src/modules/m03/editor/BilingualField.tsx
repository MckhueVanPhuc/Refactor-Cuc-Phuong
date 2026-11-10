// Hai ô vi/en của một trường song ngữ, dùng chung cho editor tuyến, điểm dừng và điểm tham quan.
// Giữa hai ô là nút "→" dịch ô tiếng Việt sang ô tiếng Anh khi bấm (spec-AI_integration BR-AI-01…11; research R-08).
import { useId, useRef, type ReactNode } from 'react';
import { TextArea } from '../../../shared/ui/TextArea';
import { TextField } from '../../../shared/ui/TextField';
import { TranslateButton, TranslationStatusLine } from '../translation/TranslateButton';
import { useFieldTranslation } from '../translation/useFieldTranslation';
import { stripLineBreaks } from '../validation/common';
import layout from './EditorLayout.module.css';

export type BilingualValue = { vi: string; en: string };

const LANGUAGES = [
  { key: 'vi', name: 'tiếng Việt' },
  { key: 'en', name: 'tiếng Anh' },
] as const;

/**
 * Câu gợi ý (nếu có) đặt dưới nhãn của cả hai ô, cùng một câu của §5.5, để hai ô thẳng hàng (quyết định chủ dự án
 * 2026-11-10); form chỉ đọc thì không có nút dịch (BR-AI-07)
 */
export function BilingualField({
  fieldKey,
  label,
  value,
  onChange,
  maxChars,
  multiline = false,
  rows,
  hint,
  errorFor,
  readOnly,
}: {
  fieldKey: string;
  label: string;
  value: BilingualValue;
  onChange: (value: BilingualValue) => void;
  maxChars: number;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  errorFor: (fieldKey: string) => string | undefined;
  readOnly: boolean;
}) {
  // Kết quả dịch về bất đồng bộ: ghép với giá trị mới nhất, không với giá trị lúc bấm
  const valueRef = useRef(value);
  valueRef.current = value;
  const statusId = useId();
  const translation = useFieldTranslation({
    source: value.vi,
    setEnglish: (en) => onChange({ ...valueRef.current, en }),
    lineBreaks: multiline ? 'ALLOWED' : 'NOT_ALLOWED',
    enabled: !readOnly,
  });

  const field = (key: 'vi' | 'en', name: string) => {
    const common = {
      label: `${label} (${name})`,
      value: value[key],
      maxChars,
      error: errorFor(`${fieldKey}.${key}`),
      fieldKey: `${fieldKey}.${key}`,
      lang: key,
      disabled: readOnly,
      ...(hint ? { hint } : {}),
      ...(key === 'en' && translation.status !== 'idle' ? { extraDescribedBy: statusId } : {}),
    };
    const change = (text: string) => {
      if (key === 'en') translation.onEnglishTyped();
      onChange({ ...valueRef.current, [key]: multiline ? text : stripLineBreaks(text) });
    };
    return multiline ? (
      <TextArea key={key} {...common} rows={rows ?? 4} onChange={change} />
    ) : (
      <TextField key={key} {...common} onChange={change} />
    );
  };

  const [vi, en] = LANGUAGES;
  if (readOnly) {
    return (
      <div className={layout.pair}>
        {field(vi.key, vi.name)}
        {field(en.key, en.name)}
      </div>
    );
  }
  return (
    <div className={`${layout.pair} ${layout.pairTranslatable}`}>
      {field(vi.key, vi.name)}
      <div className={layout.pairAction}>
        <TranslateButton translation={translation} />
      </div>
      <div className={layout.pairColumn}>
        {field(en.key, en.name)}
        <TranslationStatusLine id={statusId} translation={translation} />
      </div>
    </div>
  );
}
