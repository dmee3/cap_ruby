import React, { forwardRef } from 'react';
import cx from 'classnames';
import styles from './Radio.module.scss';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelClassName?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(({
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
        type="radio"
        ref={ref}
        className={styles.input}
        {...props}
      />
      <span className={styles.radio} />
      <span className={cx(styles.label, labelClassName)}>
        {label}
      </span>
    </label>
  );
});

Radio.displayName = 'Radio';

export default Radio;
