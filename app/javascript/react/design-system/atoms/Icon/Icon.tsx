import React from 'react';
import cx from 'classnames';
import styles from './Icon.module.scss';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 'current' | 'gray' | 'white' | 'black';

export interface IconProps {
  children: React.ReactNode;
  size?: IconSize;
  color?: IconColor;
  className?: string;
}

const Icon: React.FC<IconProps> = ({
  children,
  size = 'md',
  color = 'current',
  className = '',
}) => {
  const sizeClass = `size${size.charAt(0).toUpperCase() + size.slice(1)}`;
  const colorClass = `color${color.charAt(0).toUpperCase() + color.slice(1)}`;

  const iconClasses = cx(
    styles.iconBase,
    styles[sizeClass],
    styles[colorClass],
    className
  );

  return (
    <span className={iconClasses}>
      {children}
    </span>
  );
};

export default Icon;
