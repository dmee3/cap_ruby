import React, { useState } from 'react'
import EmptyState from './EmptyState'

type PaginatedListProps<T> = {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyFor: (item: T) => React.Key
  /** How many rows to show initially and to reveal per "load more". */
  pageSize?: number
  /** How many more one click reveals — the canvas pages 5-up but loads 10. */
  loadIncrement?: number
  emptyTitle: string
  emptyBody?: string
  emptyIcon?: React.ReactNode
  /**
   * Footer caption. Called with the visible and total counts so each list can
   * phrase it its own way ("Showing all 3", "5 of 68 this season").
   */
  caption?: (shown: number, total: number) => string
  /** Hide the load-more button and show the caption alone (conflicts list). */
  captionOnly?: boolean
  className?: string
}

// Client-side load-more over an already-loaded list — the dashboard hands the
// full (small) list down as JSON and this reveals it a page at a time. Rows run
// edge-to-edge inside a `Card variant="list"`, so the padding lives on the rows.
function PaginatedList<T>({
  items,
  renderItem,
  keyFor,
  pageSize = 5,
  loadIncrement,
  emptyTitle,
  emptyBody,
  emptyIcon,
  caption,
  captionOnly = false,
  className = '',
}: PaginatedListProps<T>) {
  const [shown, setShown] = useState(pageSize)

  if (items.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} icon={emptyIcon} className={className} />
  }

  const visible = items.slice(0, shown)
  const hasMore = shown < items.length
  const step = loadIncrement ?? pageSize
  const increment = Math.min(step, items.length - shown)

  return (
    <div className={className}>
      <ul className="flex flex-col">
        {visible.map((item) => (
          <li key={keyFor(item)} className="border-b border-border-default">
            {renderItem(item)}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-caption text-secondary">
          {caption ? caption(visible.length, items.length) : `Showing ${visible.length} of ${items.length}`}
        </span>
        {!captionOnly && (
          <button
            type="button"
            onClick={() => setShown((n) => n + step)}
            disabled={!hasMore}
            className="ml-auto h-8 shrink-0 rounded-sm border border-border-strong bg-surface px-3 text-body-sm font-semibold text-primary transition hover:enabled:border-accent-primary disabled:cursor-not-allowed disabled:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          >
            {hasMore ? `Load ${increment} more` : 'Load more'}
          </button>
        )}
      </div>
    </div>
  )
}

export default PaginatedList
