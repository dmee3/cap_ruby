import React, { useEffect, useRef, useState } from 'react'
import { feeCents, totalCents } from '../../utilities/stripe_fees'

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ---- MoneyField ------------------------------------------------------------

type MoneyFieldProps = {
  /** Current value in integer cents, or null when the field is empty. */
  valueCents: number | null
  onChangeCents: (cents: number | null) => void
  /** Upper bound (remaining this season) — exceeding it shows the error state. */
  maxCents?: number
  label?: string
  helper?: string
  /** Overrides `helper` and the built-in over-max message. */
  error?: string
  id?: string
  autoFocus?: boolean
  name?: string
}

const parseToCents = (raw: string): number | null => {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (cleaned === '') return null
  const dollars = Number.parseFloat(cleaned)
  if (Number.isNaN(dollars)) return null
  return Math.round(dollars * 100)
}

const MoneyField = ({
  valueCents,
  onChangeCents,
  maxCents,
  label = 'Amount',
  helper,
  error,
  id = 'money-field',
  autoFocus = false,
  name,
}: MoneyFieldProps) => {
  const [text, setText] = useState(
    valueCents == null ? '' : (valueCents / 100).toFixed(2)
  )
  // Track the cents value this field last emitted, so an external change to
  // `valueCents` (a quick-fill button, a reset) re-syncs the displayed text
  // without clobbering an in-progress edit like "12.".
  const lastEmitted = useRef(valueCents)

  useEffect(() => {
    if (valueCents !== lastEmitted.current) {
      setText(valueCents == null ? '' : (valueCents / 100).toFixed(2))
      lastEmitted.current = valueCents
    }
  }, [valueCents])

  const overMax =
    maxCents != null && valueCents != null && valueCents > maxCents
  const shownError =
    error ??
    (overMax && maxCents != null
      ? `That's more than the ${money(maxCents)} left this season.`
      : undefined)

  const handleChange = (raw: string) => {
    setText(raw)
    const cents = parseToCents(raw)
    lastEmitted.current = cents
    onChangeCents(cents)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-body-sm font-semibold text-primary">
          {label}
        </label>
      )}
      <div
        className={`flex items-stretch overflow-hidden rounded-sm border bg-surface ${
          shownError ? 'border-raspberry' : 'border-border-strong focus-within:border-[color:rgb(var(--focus-ring))] focus-within:ring-2 focus-within:ring-[color:rgb(var(--focus-ring))] focus-within:ring-offset-0'
        }`}
      >
        <span className="flex items-center border-r border-border-default bg-sunken px-3 font-mono text-secondary">
          $
        </span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoFocus={autoFocus}
          value={text}
          placeholder="0.00"
          onChange={(e) => handleChange(e.target.value)}
          className="h-12 flex-1 bg-transparent px-3 font-mono text-primary outline-none placeholder:text-border-strong"
        />
      </div>
      {shownError ? (
        <span className="text-caption text-danger-fg">{shownError}</span>
      ) : (
        helper && <span className="text-caption text-success-fg">{helper}</span>
      )}
    </div>
  )
}

export default MoneyField

// ---- FeeBreakdown --------------------------------------------------------

type FeeBreakdownProps = {
  amountCents: number | null
  className?: string
}

const Line = ({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string
  value: string
  strong?: boolean
  muted?: boolean
}) => (
  <div
    className={`flex justify-between ${
      strong
        ? 'border-t border-dashed border-border-strong pt-2 text-body font-semibold'
        : 'text-body-sm'
    } ${muted ? 'text-secondary' : ''}`}
  >
    <span>{label}</span>
    <span className="font-mono tabular-nums">{value}</span>
  </div>
)

export const FeeBreakdown = ({ amountCents, className = '' }: FeeBreakdownProps) => {
  const has = amountCents != null && amountCents > 0
  const dash = '–'
  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <Line label="Toward dues" value={has ? money(amountCents as number) : dash} />
      <Line
        label="Card fee (3% + 30¢)"
        value={has ? money(feeCents(amountCents as number)) : dash}
        muted
      />
      <Line
        label="Total charged"
        value={has ? money(totalCents(amountCents as number)) : dash}
        strong
      />
    </div>
  )
}
