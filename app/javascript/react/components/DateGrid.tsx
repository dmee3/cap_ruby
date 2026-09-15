import React from 'react'
import DateTile, { DateTileState } from './DateTile'

export const TOTAL_DATES = 31

type DateGridProps = {
  claimed: number[]
  selected: number[]
  onToggle: (date: number) => void
  compact?: boolean
  /** The legend is desktop-only; there's no room for it on a phone. */
  showLegend?: boolean
}

const LEGEND = [
  { label: 'Open', swatch: 'bg-surface border border-border-strong' },
  { label: 'Yours', swatch: 'bg-[color:rgb(var(--accent-primary))]' },
  { label: 'Taken', swatch: 'bg-sunken border border-border-default' },
]

/**
 * The 31 sponsorable dates.
 *
 * Seven columns at every width, because that shape is what says "calendar" and
 * the fundraiser is named for it. But tile 1 is always top-left: there are no
 * leading blanks and no month name, because nothing in the data ties a donation
 * to a real weekday. The tiles are prices, not appointments, and nobody is
 * doing anything on the 17th.
 *
 * That also removes a real bug. The old grid hardcoded six leading blanks AND a
 * "March 2025" heading, set independently, so every date sat under the wrong
 * weekday in any other year.
 */
const DateGrid = ({
  claimed,
  selected,
  onToggle,
  compact = false,
  showLegend = false,
}: DateGridProps) => {
  const claimedSet = new Set(claimed)
  const selectedSet = new Set(selected)

  const stateFor = (date: number): DateTileState => {
    if (claimedSet.has(date)) return 'taken'
    return selectedSet.has(date) ? 'selected' : 'available'
  }

  return (
    <div className="flex flex-col gap-3">
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-[14px] gap-y-2 text-caption font-medium text-secondary">
          {LEGEND.map(({ label, swatch }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-[3px] ${swatch}`} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      )}

      <div
        className={`grid grid-cols-7 ${compact ? 'gap-[5px]' : 'gap-2'}`}
        role="group"
        aria-label="Pick the dates you want to sponsor"
      >
        {Array.from({ length: TOTAL_DATES }, (_, i) => i + 1).map((date) => (
          <DateTile
            key={date}
            date={date}
            state={stateFor(date)}
            onToggle={onToggle}
            compact={compact}
          />
        ))}
      </div>
    </div>
  )
}

export default DateGrid
