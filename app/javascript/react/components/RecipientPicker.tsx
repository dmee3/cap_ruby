import React from 'react'

export type Recipient = {
  id: number
  name: string
  initials: string
  detail: string | null
}

type RecipientPickerProps = {
  recipients: Recipient[]
  selected: number[]
  minimum: number
  onChange: (selected: number[]) => void
  /** Only after a failed submit — an untouched form shouldn't look rejected. */
  invalid?: boolean
  describedBy?: string
}

// Reads as progress toward the rule rather than as a rejection, which is why
// there is no standing warning next to it.
export const counterLabel = (picked: number, minimum: number) => {
  if (minimum === 0) return `${picked} picked`
  if (picked >= minimum) {
    return picked === minimum ? `${picked} of ${minimum} picked` : `${picked} picked · minimum met`
  }
  const remaining = minimum - picked
  const tail = remaining === 1 ? ' · one more' : ` · ${remaining} more`
  return `${picked} of ${minimum} picked${tail}`
}

const RecipientPicker = ({
  recipients,
  selected,
  minimum,
  onChange,
  invalid = false,
  describedBy
}: RecipientPickerProps) => {
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <span
          className={`text-body-sm font-semibold ${invalid ? 'text-danger-fg' : 'text-secondary'}`}
          aria-live="polite"
        >
          {counterLabel(selected.length, minimum)}
        </span>
      </div>

      <ul
        className={`flex flex-col gap-2 rounded-sm ${invalid ? 'ring-1 ring-danger-fg p-2' : ''}`}
        aria-describedby={describedBy}
      >
        {recipients.map(recipient => {
          const checked = selected.includes(recipient.id)
          return (
            <li key={recipient.id}>
              <label
                className={`flex min-h-[44px] cursor-pointer flex-row items-center gap-3 rounded-sm border p-2 transition ${
                  checked
                    ? 'border-[color:rgb(var(--accent-primary))] bg-sunken'
                    : 'border-border-default hover:bg-sunken'
                }`}
              >
                <input
                  type="checkbox"
                  name="recipients[]"
                  value={recipient.id}
                  checked={checked}
                  onChange={() => toggle(recipient.id)}
                  className="input-checkbox"
                />
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken text-caption font-bold text-secondary"
                  aria-hidden="true"
                >
                  {recipient.initials}
                </span>
                <span className="flex flex-col">
                  <span className="text-body-sm font-semibold text-primary">{recipient.name}</span>
                  {recipient.detail && (
                    <span className="text-caption text-secondary">{recipient.detail}</span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default RecipientPicker
