import React from 'react'

type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
  className?: string
}

// A switch, styled as one but still a real checkbox underneath: the input
// carries the state and keyboard behaviour, and the track/knob are painted
// from its :checked and :focus-visible states.
const Toggle = ({ checked, onChange, label, id, className = '' }: ToggleProps) => (
  <label className={`inline-flex cursor-pointer items-center gap-2 ${className}`.trim()}>
    <span className="relative inline-flex h-5 w-9 flex-none items-center">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        className="peer absolute h-full w-full cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className="h-5 w-9 rounded-full bg-border-strong transition-colors peer-checked:bg-ocean peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-e1 transition-transform peer-checked:translate-x-4"
      />
    </span>
    <span className="text-body-sm text-primary">{label}</span>
  </label>
)

export default Toggle
