import React from 'react'
import { ordinal } from '../../utilities/ordinals'

type DateChipProps = {
  date: number
  /** Omit to get the static variant, used where the edit path is a link. */
  onRemove?: (date: number) => void
}

/**
 * One picked date. The removable variant carries an ✕; the static one is used
 * on checkout, where "Change dates" is the way back.
 *
 * The amount is deliberately NOT repeated here: the tile a donor tapped
 * already showed it, and the total sits directly below the chips, so per-chip
 * amounts were the same number three times.
 */
const DateChip = ({ date, onRemove }: DateChipProps) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:rgb(var(--accent-primary))] bg-ocean-lightest/20 px-3 py-[7px] text-[14px] font-semibold leading-[18px] text-ocean-dark">
    <span>the {ordinal(date)}</span>

    {onRemove && (
      <button
        type="button"
        onClick={() => onRemove(date)}
        // "✕" alone tells a screen reader nothing about what it removes.
        aria-label={`Remove the ${ordinal(date)}`}
        className="cursor-pointer text-[color:rgb(var(--accent-primary))] transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      >
        ✕
      </button>
    )}
  </span>
)

export default DateChip
