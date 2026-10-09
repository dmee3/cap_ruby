import React, { useRef } from 'react'

export type SegmentOption<T extends string> = { value: T; label: React.ReactNode }

/**
 * `brand` — ocean fill on the chosen segment. For switching what the page
 *           shows (Queue / Calendar).
 * `quiet` — a raised segment on a sunken track. For a setting or filter inside
 *           a card (a role, a chart range, a population).
 */
type SegmentTone = 'brand' | 'quiet'

type SegmentedControlProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  /** Names the group for screen readers ("Conflict view", "Role for 2026"). */
  label: string
  tone?: SegmentTone
  /** Segments share the full width: always, or only below `sm`. */
  fill?: 'always' | 'below-sm'
  className?: string
}

const TRACK: Record<SegmentTone, string> = {
  brand: 'gap-0.5 rounded-md border border-border-strong bg-surface p-0.5',
  quiet: 'gap-1 rounded-sm bg-sunken p-1',
}

const SEGMENT: Record<SegmentTone, string> = {
  brand: 'h-9 px-4',
  quiet: 'h-8 px-3',
}

const SELECTED: Record<SegmentTone, string> = {
  brand: 'bg-ocean text-on-brand',
  quiet: 'bg-surface text-primary shadow-e1',
}

const UNSELECTED: Record<SegmentTone, string> = {
  brand: 'bg-transparent text-secondary hover:bg-sunken hover:text-primary',
  quiet: 'bg-transparent text-secondary hover:text-primary',
}

const NEXT_KEYS = ['ArrowRight', 'ArrowDown']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp']

// A radiogroup, so it follows the radio keyboard pattern: one tab stop on the
// chosen segment, arrow keys move the choice.
const SegmentedControl = <T extends string>({
  value,
  onChange,
  options,
  label,
  tone = 'quiet',
  fill,
  className = '',
}: SegmentedControlProps<T>) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const current = options.findIndex(option => option.value === value)

  const choose = (index: number) => {
    onChange(options[index].value)
    refs.current[index]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = options.length - 1
    const from = Math.max(current, 0)
    let to: number | null = null
    if (NEXT_KEYS.includes(event.key)) to = from === last ? 0 : from + 1
    else if (PREV_KEYS.includes(event.key)) to = from === 0 ? last : from - 1
    else if (event.key === 'Home') to = 0
    else if (event.key === 'End') to = last
    if (to === null) return
    event.preventDefault()
    choose(to)
  }

  const trackWidth = fill === 'below-sm' ? 'w-full sm:w-auto' : fill === 'always' ? 'w-full' : ''
  const segmentWidth = fill === 'below-sm' ? 'flex-1 sm:flex-none' : fill === 'always' ? 'flex-1' : ''

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`inline-flex flex-wrap ${TRACK[tone]} ${trackWidth} ${className}`.trim()}
    >
      {options.map((option, i) => {
        const selected = i === current
        return (
          <button
            key={option.value}
            ref={node => {
              refs.current[i] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            // Nothing chosen yet: the first segment takes the tab stop.
            tabIndex={selected || (current === -1 && i === 0) ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={[
              'rounded-sm text-body-sm font-semibold transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              SEGMENT[tone],
              segmentWidth,
              selected ? SELECTED[tone] : UNSELECTED[tone],
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
