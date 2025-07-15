import React from 'react';
import cx from 'classnames';
import styles from './Badge.module.scss';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
  removable?: boolean
  onRemove?: () => void
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  removable = false,
  onRemove,
}) => {
  const variantClass = `variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  const sizeClass = `size${size.charAt(0).toUpperCase() + size.slice(1)}`;

  const badgeClasses = cx(
    styles.badgeBase,
    styles[variantClass],
    styles[sizeClass],
    className
  );

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <span className={badgeClasses}>
      {children}
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className={styles.remove}
          aria-label="Remove badge"
        >
          <svg
            className={styles.removeIcon}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Badge;
