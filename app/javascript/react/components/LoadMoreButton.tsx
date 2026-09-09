import React from 'react'

type LoadMoreButtonProps = {
  /** How many more rows one click would load — shown in the label. */
  increment: number
  /** Total rows behind the filter, for the "Showing all N" exhausted state. */
  totalCount: number
  hasMore: boolean
  loading?: boolean
  onClick: () => void
  className?: string
}

// The one app-wide pager (design-system §4.22) — replaces the four per-widget
// chevron counters on the old admin dashboard.
const LoadMoreButton = ({
  increment,
  totalCount,
  hasMore,
  loading = false,
  onClick,
  className = '',
}: LoadMoreButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!hasMore || loading}
    aria-busy={loading || undefined}
    className={[
      'w-full rounded-sm border border-border-strong bg-surface py-2 text-body-sm font-medium text-primary transition',
      'hover:enabled:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-60 disabled:pointer-events-none',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {hasMore ? `Load ${increment} more` : `Showing all ${totalCount}`}
  </button>
)

export default LoadMoreButton
