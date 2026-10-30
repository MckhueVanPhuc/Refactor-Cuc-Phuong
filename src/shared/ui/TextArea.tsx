import type { ReactNode, Ref } from 'react';
import { countChars, FieldShell } from './Field';
import styles from './Field.module.css';

export type TextAreaProps = {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hint?: ReactNode;
  error?: ReactNode;
  maxChars?: number;
  rows?: number;
  name?: string;
  lang?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  textareaRef?: Ref<HTMLTextAreaElement>;
  /** Khóa trường (`targetFieldKey`) để panel lỗi focus được ô này */
  fieldKey?: string;
};

export function TextArea({
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  maxChars,
  rows = 4,
  textareaRef,
  fieldKey,
  ...textareaProps
}: TextAreaProps) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      counter={maxChars === undefined ? undefined : { length: countChars(value), max: maxChars }}
    >
      {({ controlId, describedBy, invalid }) => (
        <textarea
          {...textareaProps}
          ref={textareaRef}
          data-field-key={fieldKey}
          id={controlId}
          rows={rows}
          className={`${styles.control} ${styles.textarea}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        />
      )}
    </FieldShell>
  );
}
