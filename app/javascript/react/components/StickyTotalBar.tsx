import React from 'react'
import { dollars } from '../../utilities/money'
import { dateList } from '../../utilities/ordinals'

type StickyTotalBarProps = {
  selected: number[]
  /** Button label, e.g. "Continue" or "Donate $32". */
  actionLabel: string
  onAction: () => void
  busy?: boolean
}

/**
 * The mobile counterpart to the desktop summary rail: the running total pinned
 * to the bottom of the viewport, because it's the only number a donor is
 * tracking while they tap around the grid.
 *
 * Sits below the scroll region as a flex sibling rather than `fixed`, so it
 * never covers the last row of tiles.
 */
const StickyTotalBar = ({
  selected,
  actionLabel,
  onAction,
  busy = false,
}: StickyTotalBarProps) => {
  const total = selected.reduce((sum, date) => sum + date, 0)
  const empty = selected.length === 0

  return (
    <div className="flex flex-none items-center gap-3 border-t border-border-default bg-surface px-[18px] pb-[18px] pt-3">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* The $0 is content, not a control, so it keeps a contrast-passing
            colour instead of the disabled grey the canvas drew (~2.6:1). */}
        <span
          className={`text-[24px] font-extrabold leading-[26px] tracking-tight ${
            empty ? 'text-secondary' : 'text-primary'
          }`}
        >
          {dollars(total * 100)}
        </span>
        <span className="truncate text-caption text-secondary">
          {empty ? 'no dates yet' : dateList(selected)}
        </span>
      </div>

      <button
        type="button"
        disabled={empty || busy}
        onClick={onAction}
        className="btn-primary btn-lg flex-none"
      >
        {actionLabel}
      </button>
    </div>
  )
}

export default StickyTotalBar
