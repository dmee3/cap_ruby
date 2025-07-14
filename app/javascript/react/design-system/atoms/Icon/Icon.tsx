import React from 'react'
import './Icon.scss'

export type IconSize = 'sm' | 'md' | 'lg' | 'xl'
export type IconColor = 'current' | 'gray' | 'white' | 'black'

export interface IconProps {
  children: React.ReactNode
  size?: IconSize
  color?: IconColor
  className?: string
}

const Icon: React.FC<IconProps> = ({
  children,
  size = 'md',
  color = 'current',
  className = '',
}) => {
  // Build CSS classes
  const iconClasses = [
    'icon-base',
    `icon-size--${size}`,
    `icon-color--${color}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <span className={iconClasses}>
      {children}
    </span>
  )
}

export default Icon
