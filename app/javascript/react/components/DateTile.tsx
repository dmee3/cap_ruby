import React from 'react'
import { ordinal } from '../../utilities/ordinals'

export type DateTileState = 'available' | 'selected' | 'taken'

type DateTileProps = {
  /** The day number, 1..31. It IS the donation amount in dollars. */
  date: number
  state: DateTileState
  onToggle?: (date: number) => void
  /** Tighter geometry for the phone layout. */
  compact?: boolean
}

// Static maps, so Tailwind's scanner sees every class it has to generate.
const STATE_CLASSES: Record<DateTileState, string> = {
  available:
    'bg-surface border-border-strong text-primary hover:border-[color:rgb(var(--accent-primary))] cursor-pointer',
  selected:
    'bg-[color:rgb(var(--accent-primary))] border-ocean-dark text-on-brand cursor-pointer',
  // Reads as absent rather than dimmed.
  taken: 'bg-sunken border-border-default text-secondary line-through cursor-default',
}

const SUB_CLASSES: Record<DateTileState, string> = {
  available: 'text-secondary',
  selected: 'text-[color:rgb(var(--color-ocean-lightest))]',
  taken: 'text-secondary',
}

/**
 * One sponsorable date. The tile is the price: the day number over what
 * sponsoring it costs, because the amount IS the number and a donor who
 * scrolled past the explainer still needs that to land.
 *
 * States never depend on color alone — `taken` carries a strikethrough and the
 * literal word, and `selected` carries a check glyph as real text.
 *
 * Focus is a ring OUTSIDE the tile (a page-colored spacer ring, then an ocean
 * ring) rather than a border swap, so the tile doesn't shift when focused.
 */
const DateTile = ({ date, state, onToggle, compact = false }: DateTileProps) => {
  const taken = state === 'taken'

  return (
    <button
      type="button"
      // A taken date isn't focusable: there is nothing to do with it.
      disabled={taken}
      aria-pressed={taken ? undefined : state === 'selected'}
      // Without this a screen reader reads the two stacked lines as "7 $7".
      aria-label={
        taken
          ? `The ${ordinal(date)} is already sponsored`
          : `Sponsor the ${ordinal(date)} for $${date}`
      }
      onClick={() => onToggle?.(date)}
      className={[
        'flex flex-col items-center justify-center border transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        compact ? 'min-h-[44px] gap-[1px] rounded-[9px] px-0 py-[6px]' : 'min-h-[64px] gap-[2px] rounded-sm px-0 py-[9px]',
        STATE_CLASSES[state],
      ].join(' ')}
    >
      <span
        className={
          compact
            ? 'text-[16px] font-bold leading-[18px]'
            : 'text-[22px] font-bold leading-[24px]'
        }
      >
        {date}
      </span>
      <span
        className={`font-mono text-[11px] font-medium leading-[12px] ${SUB_CLASSES[state]}`}
      >
        {taken ? 'taken' : `${state === 'selected' ? '✓ ' : ''}$${date}`}
      </span>
    </button>
  )
}

export default DateTile
