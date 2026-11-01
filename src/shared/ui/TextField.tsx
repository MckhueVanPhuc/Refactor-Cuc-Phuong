import type { ReactNode, Ref } from 'react';
import { countChars, FieldShell } from './Field';
import styles from './Field.module.css';

export type TextFieldProps = {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hint?: ReactNode;
  error?: ReactNode;
  maxChars?: number;
  type?: 'text' | 'email' | 'password' | 'search' | 'url' | 'number';
  name?: string;
  lang?: string;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Khóa trường (`targetFieldKey`) để panel lỗi focus được ô này */
  fieldKey?: string;
};

export function TextField({
  label,
  value,
  onChange,
  onBlur,
  hint,
  error,
  maxChars,
  type = 'text',
  inputRef,
  fieldKey,
  ...inputProps
}: TextFieldProps) {
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      counter={maxChars === undefined ? undefined : { length: countChars(value), max: maxChars }}
    >
      {({ controlId, describedBy, invalid }) => (
        <input
          {...inputProps}
          ref={inputRef}
          data-field-key={fieldKey}
          id={controlId}
          type={type}
          className={styles.control}
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
