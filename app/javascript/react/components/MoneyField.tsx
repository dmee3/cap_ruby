import React, { useEffect, useRef, useState } from 'react'
import Field, { controlClass, useField } from './Field'
import { feeCents, totalCents } from '../../utilities/stripe_fees'
import { exact } from '../../utilities/money'

// ---- MoneyField ------------------------------------------------------------

type MoneyFieldProps = {
  /** Current value in integer cents, or null when the field is empty. */
  valueCents: number | null
  onChangeCents: (cents: number | null) => void
  /** Upper bound (remaining this season) — exceeding it shows the error state. */
  maxCents?: number
  /**
   * The field's own label, with its hint and error beneath. `""` gives the
   * bare `$` control, for a Field or table row that labels it instead.
   */
  label?: string
  /** Shown in success colour — "Covers your 3/14 installment in full." */
  helper?: string
  hint?: React.ReactNode
  /** Overrides `helper` and the built-in over-max message. */
  error?: string
  id?: string
  autoFocus?: boolean
  name?: string
  /** 40px instead of 44px, for table rows rather than standalone form fields. */
  compact?: boolean
}

const parseToCents = (raw: string): number | null => {
  const cleaned = raw.replace(/[^0-9.]/g, '')
  if (cleaned === '') return null
  const dollars = Number.parseFloat(cleaned)
  if (Number.isNaN(dollars)) return null
  return Math.round(dollars * 100)
}

type MoneyControlProps = Pick<
  MoneyFieldProps,
  'valueCents' | 'onChangeCents' | 'id' | 'autoFocus' | 'name' | 'compact'
> & { invalid?: boolean }

const MoneyControl = ({
  valueCents,
  onChangeCents,
  id,
  autoFocus = false,
  name,
  compact = false,
  invalid,
}: MoneyControlProps) => {
  const field = useField()
  const isInvalid = invalid ?? field?.invalid ?? false
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

  const handleChange = (raw: string) => {
    setText(raw)
    const cents = parseToCents(raw)
    lastEmitted.current = cents
    onChangeCents(cents)
  }

  return (
    <div
      className={`${controlClass({
        controlSize: compact ? 'sm' : 'md',
        invalid: isInvalid,
      })} flex items-stretch overflow-hidden !px-0 focus-within:ring-2 focus-within:ring-offset-1`}
    >
      <span className="flex items-center border-r border-border-default bg-sunken px-3 font-mono text-secondary">
        $
      </span>
      <input
        id={id ?? field?.id}
        name={name}
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={text}
        placeholder="0.00"
        aria-describedby={field?.describedBy}
        aria-invalid={isInvalid || undefined}
        onChange={(e) => handleChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 font-mono outline-none placeholder:text-border-strong"
      />
    </div>
  )
}

const MoneyField = ({ label = 'Amount', helper, hint, error, maxCents, ...control }: MoneyFieldProps) => {
  const overMax =
    maxCents != null && control.valueCents != null && control.valueCents > maxCents
  const shownError =
    error ??
    (overMax && maxCents != null
      ? `That's more than the ${exact(maxCents)} left this season.`
      : undefined)

  if (!label) return <MoneyControl {...control} invalid={Boolean(shownError) || undefined} />

  return (
    <Field
      label={label}
      id={control.id ?? 'money-field'}
      error={shownError}
      hint={helper ? <span className="text-success-fg">{helper}</span> : hint}
    >
      <MoneyControl {...control} />
    </Field>
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
      <Line label="Toward dues" value={has ? exact(amountCents as number) : dash} />
      <Line
        label="Card fee"
        value={has ? exact(feeCents(amountCents as number)) : dash}
        muted
      />
      <Line
        label="Total charged"
        value={has ? exact(totalCents(amountCents as number)) : dash}
        strong
      />
    </div>
  )
}
