import type { ReactNode, Ref } from 'react';
import { FieldShell } from './Field';
import styles from './Field.module.css';

export type SelectOption<V extends string> = { value: V; label: string; disabled?: boolean };

export type SelectProps<V extends string> = {
  label: ReactNode;
  value: V | '';
  options: readonly SelectOption<V>[];
  onChange: (value: V) => void;
  /** Dòng đầu khi chưa chọn (giá trị rỗng); bỏ trống thì không có dòng này. */
  emptyLabel?: string;
  hint?: ReactNode;
  error?: ReactNode;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  selectRef?: Ref<HTMLSelectElement>;
  /** Khóa trường (`targetFieldKey`) để panel lỗi focus được ô này */
  fieldKey?: string;
};

export function Select<V extends string>({
  label,
  value,
  options,
  onChange,
  emptyLabel,
  hint,
  error,
  selectRef,
  fieldKey,
  ...selectProps
}: SelectProps<V>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ controlId, describedBy, invalid }) => (
        <select
          {...selectProps}
          ref={selectRef}
          data-field-key={fieldKey}
          id={controlId}
          className={styles.control}
          value={value}
          onChange={(event) => onChange(event.target.value as V)}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
        >
          {emptyLabel !== undefined ? (
            <option value="" disabled>
              {emptyLabel}
            </option>
          ) : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}
