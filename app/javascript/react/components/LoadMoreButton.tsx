import React from 'react'
import Button from './Button'

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
  <Button
    variant="secondary"
    className={`w-full ${className}`.trim()}
    onClick={onClick}
    disabled={!hasMore}
    loading={loading}
  >
    {hasMore ? `Load ${increment} more` : `Showing all ${totalCount}`}
  </Button>
)

export default LoadMoreButton
