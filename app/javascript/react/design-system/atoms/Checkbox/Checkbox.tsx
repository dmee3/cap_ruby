import React, { forwardRef } from 'react';
import cx from 'classnames';
import styles from './Checkbox.module.scss';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  size = 'md',
  className,
  labelClassName,
  ...props
}, ref) => {
  const sizeClass = `size${size.charAt(0).toUpperCase() + size.slice(1)}`;

  return (
    <label className={cx(styles.wrapper, styles[sizeClass], className)}>
      <input
        type="checkbox"
        ref={ref}
        className={styles.input}
        {...props}
      />
      <span className={styles.checkbox}>
        <CheckIcon className={styles.checkIcon} />
      </span>
      <span className={cx(styles.label, labelClassName)}>
        {label}
      </span>
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
