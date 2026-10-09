import React, { useState } from 'react'
import EmptyState from './EmptyState'
import Button from './Button'

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
          <Button
            variant="secondary"
            fullWidthBelow={false}
            className="ml-auto shrink-0"
            onClick={() => setShown((n) => n + step)}
            disabled={!hasMore}
          >
            {hasMore ? `Load ${increment} more` : 'Load more'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default PaginatedList
