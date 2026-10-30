import { useId, type ReactNode } from 'react';
import fieldStyles from './Field.module.css';
import styles from './Choice.module.css';

export type CheckboxProps = {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
  error?: ReactNode;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  /** Khóa trường (`targetFieldKey`) để panel lỗi focus được ô này */
  fieldKey?: string;
};

export function Checkbox({ label, checked, onChange, hint, error, fieldKey, ...inputProps }: CheckboxProps) {
  const id = useId();
  const invalid = error !== undefined && error !== null && error !== '';
  const describedBy = [hint ? `${id}-hint` : null, invalid ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={fieldStyles.field}>
      <label className={styles.option} htmlFor={id}>
        <input
          {...inputProps}
          id={id}
          data-field-key={fieldKey}
          type="checkbox"
          className={styles.input}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        />
        <span>{label}</span>
      </label>
      {hint ? (
        <p id={`${id}-hint`} className={`${fieldStyles.hint} ${styles.indented}`}>
          {hint}
        </p>
      ) : null}
      {invalid ? (
        <p id={`${id}-error`} className={`${fieldStyles.error} ${styles.indented}`}>
          Lỗi: {error}
        </p>
      ) : null}
    </div>
  );
}
