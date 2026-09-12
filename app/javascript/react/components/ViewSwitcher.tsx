import React from 'react'

export type ViewOption = 'queue' | 'calendar'

type ViewSwitcherProps = {
  value: ViewOption
  onChange: (value: ViewOption) => void
  className?: string
}

const OPTIONS: { value: ViewOption; label: string }[] = [
  { value: 'queue', label: 'Queue' },
  { value: 'calendar', label: 'Calendar' },
]

// §4.28 — two options, never three.
//
// Built as a real radiogroup rather than two styled spans: the canvas draws
// clickable <span>s, which would have no keyboard path and no announced state.
const ViewSwitcher = ({ value, onChange, className = '' }: ViewSwitcherProps) => (
  <div
    role="radiogroup"
    aria-label="Conflict view"
    className={`inline-flex w-full gap-0.5 rounded-md border border-border-strong bg-surface p-0.5 sm:w-auto ${className}`.trim()}
  >
    {OPTIONS.map(option => {
      const selected = option.value === value
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          onClick={() => onChange(option.value)}
          className={`h-9 flex-1 rounded-sm px-4 text-body-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:flex-none ${
            selected
              ? 'bg-ocean text-on-brand'
              : 'bg-transparent text-secondary hover:bg-sunken hover:text-primary'
          }`}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

export default ViewSwitcher
