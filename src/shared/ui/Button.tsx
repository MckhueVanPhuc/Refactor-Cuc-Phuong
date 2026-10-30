import type { ButtonHTMLAttributes, Ref } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: ButtonVariant;
  buttonRef?: Ref<HTMLButtonElement>;
};

/** Nút nền: chính (nền accent) hoặc phụ (nền trắng, viền control) — design-system §5.3, §5.4. */
export function Button({ variant = 'secondary', type = 'button', buttonRef, ...props }: ButtonProps) {
  return <button {...props} ref={buttonRef} type={type} className={`${styles.button} ${styles[variant]}`} />;
}
