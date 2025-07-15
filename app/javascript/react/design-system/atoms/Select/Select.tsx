import React, { forwardRef } from 'react';
import cx from 'classnames';
import styles from './Select.module.scss';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

export type SelectVariant = 'default' | 'error' | 'success';
export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options?: SelectOption[];
  variant?: SelectVariant;
  selectSize?: SelectSize;
  className?: string;
  'aria-label'?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  variant = 'default',
  selectSize = 'md',
  className,
  ...props
}, ref) => {
  const variantClass = `variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  const sizeClass = `size${selectSize.charAt(0).toUpperCase() + selectSize.slice(1)}`;

  const selectWrapperClasses = cx(styles.selectWrapper, className);

  const selectClasses = cx(
    styles.select,
    styles[variantClass],
    styles[sizeClass]
  );

  return (
    <div className={selectWrapperClasses}>
      <select ref={ref} className={selectClasses} {...props}>
        {options?.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className={styles.iconContainer}>
        <ChevronDownIcon />
      </div>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
