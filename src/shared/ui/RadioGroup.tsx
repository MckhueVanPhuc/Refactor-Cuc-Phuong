import { useId, type ReactNode } from 'react';
import fieldStyles from './Field.module.css';
import styles from './Choice.module.css';

export type RadioOption<V extends string> = { value: V; label: ReactNode; hint?: ReactNode; disabled?: boolean };

export type RadioGroupProps<V extends string> = {
  legend: ReactNode;
  value: V | '';
  options: readonly RadioOption<V>[];
  onChange: (value: V) => void;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
};

export function RadioGroup<V extends string>({
  legend,
  value,
  options,
  onChange,
  hint,
  error,
  disabled,
}: RadioGroupProps<V>) {
  const id = useId();
  const invalid = error !== undefined && error !== null && error !== '';
  const describedBy = [hint ? `${id}-hint` : null, invalid ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      className={`${fieldStyles.field} ${styles.fieldset}`}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      disabled={disabled}
    >
      <legend className={`${fieldStyles.label} ${styles.legend}`}>{legend}</legend>
      {hint ? (
        <p id={`${id}-hint`} className={fieldStyles.hint}>
          {hint}
        </p>
      ) : null}
      <div className={styles.options}>
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <div key={option.value}>
              <label className={styles.option} htmlFor={optionId}>
                <input
                  id={optionId}
                  type="radio"
                  name={id}
                  className={styles.input}
                  value={option.value}
                  checked={value === option.value}
                  disabled={option.disabled}
                  onChange={() => onChange(option.value)}
                  aria-describedby={option.hint ? `${optionId}-hint` : undefined}
                />
                <span>{option.label}</span>
              </label>
              {option.hint ? (
                <p id={`${optionId}-hint`} className={`${fieldStyles.hint} ${styles.indented}`}>
                  {option.hint}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {invalid ? (
        <p id={`${id}-error`} className={fieldStyles.error}>
          Lỗi: {error}
        </p>
      ) : null}
    </fieldset>
  );
}
