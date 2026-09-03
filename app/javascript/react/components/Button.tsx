import React from 'react'

type ButtonVariant = 'primary' | 'success' | 'danger' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidthBelow?: 'sm' | false
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ocean text-on-brand hover:enabled:bg-ocean-light active:enabled:bg-ocean-dark',
  success: 'bg-moss text-on-brand hover:enabled:bg-moss-light active:enabled:bg-moss-dark',
  danger: 'bg-raspberry text-on-brand hover:enabled:bg-raspberry-light active:enabled:bg-raspberry-dark',
  secondary: 'bg-surface text-primary border border-border-strong hover:enabled:bg-sunken',
  ghost: 'bg-transparent text-primary hover:enabled:bg-sunken',
  link: 'bg-transparent text-accent-primary hover:enabled:opacity-80 !px-0 !h-auto underline underline-offset-2',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-body-sm',
  md: 'h-9 px-3 text-body-sm',
  lg: 'h-11 px-4 text-body',
}

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidthBelow = 'sm',
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) => {
  const widthClass = fullWidthBelow === 'sm' ? 'w-full sm:w-auto' : ''
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'relative inline-flex items-center justify-center gap-2 rounded-sm font-medium transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:pointer-events-none',
        VARIANT[variant],
        SIZE[size],
        widthClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading && (
        <span
          className="absolute h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      )}
      <span className={loading ? 'invisible' : undefined}>{children}</span>
    </button>
  )
}

export default Button
