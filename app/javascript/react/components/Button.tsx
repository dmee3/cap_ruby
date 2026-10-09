import React from 'react'

type ButtonVariant = 'primary' | 'success' | 'danger' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Text colour for the unfilled variants (`secondary`, `ghost`, `link`) — a
 * "Delete" that sits beside "Edit" without being a filled danger button.
 * Filled variants ignore it.
 */
type ButtonTone = 'default' | 'accent' | 'danger' | 'muted'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  tone?: ButtonTone
  loading?: boolean
  /**
   * Shown beside the spinner while loading ("Processing…"). Without it the
   * spinner covers the label and the button holds its width.
   */
  loadingLabel?: React.ReactNode
  /** Defaults to `'sm'`, except for `link`, which stays inline. */
  fullWidthBelow?: 'sm' | false
  /** Renders an `<a>` that looks like the button — for navigation, not actions. */
  href?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ocean text-on-brand hover:bg-ocean-light active:bg-ocean-dark',
  success: 'bg-moss text-on-brand hover:bg-moss-light active:bg-moss-dark',
  danger: 'bg-raspberry text-on-brand hover:bg-raspberry-light active:bg-raspberry-dark',
  secondary: 'bg-surface border border-border-strong hover:bg-sunken',
  ghost: 'bg-transparent hover:bg-sunken',
  link: 'bg-transparent underline underline-offset-2 hover:opacity-80',
}

const TONE: Record<ButtonTone, string> = {
  default: 'text-primary',
  accent: 'text-accent-primary',
  danger: 'text-danger-fg',
  muted: 'text-secondary hover:text-primary',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-body-sm',
  md: 'h-9 px-3 text-body-sm',
  lg: 'h-11 px-4 text-body',
}

// A link sits in a line of text, so it takes the type size but no box.
const LINK_SIZE: Record<ButtonSize, string> = {
  sm: 'text-caption',
  md: 'text-body-sm',
  lg: 'text-body',
}

const FILLED: ButtonVariant[] = ['primary', 'success', 'danger']

const Spinner = ({ className = '' }: { className?: string }) => (
  <span
    className={`h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin motion-reduce:animate-none ${className}`.trim()}
    aria-hidden="true"
  />
)

const Button = ({
  variant = 'primary',
  size = 'md',
  tone,
  loading = false,
  loadingLabel,
  fullWidthBelow,
  disabled,
  href,
  className = '',
  children,
  ...rest
}: ButtonProps) => {
  const isLink = variant === 'link'
  const width = fullWidthBelow ?? (isLink ? false : 'sm')
  const toneClass = FILLED.includes(variant) ? '' : TONE[tone ?? (isLink ? 'accent' : 'default')]

  const classes = [
    'relative inline-flex items-center justify-center gap-2 rounded-sm font-medium transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:pointer-events-none',
    href && !isLink ? 'no-underline' : '',
    VARIANT[variant],
    toneClass,
    isLink ? LINK_SIZE[size] : SIZE[size],
    width === 'sm' ? 'w-full sm:w-auto' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(rest as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {loading && loadingLabel ? (
        <>
          <Spinner />
          <span className="inline-flex items-center gap-1.5">{loadingLabel}</span>
        </>
      ) : (
        <>
          {loading && <Spinner className="absolute" />}
          <span className={`inline-flex items-center gap-1.5 ${loading ? 'invisible' : ''}`.trim()}>
            {children}
          </span>
        </>
      )}
    </button>
  )
}

export default Button
