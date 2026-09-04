import React from 'react'

export type PaymentMethod = 'Card' | 'Venmo' | 'Cash' | 'Check' | 'Other'

type PaymentRowVariant = 'paid' | 'upcoming' | 'past-due' | 'pending'

type PaymentRowProps = {
  variant: PaymentRowVariant
  /** Preformatted by the caller — M/D/YY, weekday added within 14 days. */
  date: string
  amountCents: number
  method?: PaymentMethod
  subline?: string
  /** Day-of-month number for upcoming schedule rows. */
  installmentChip?: string
  className?: string
}

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const METHOD_INITIALS: Record<PaymentMethod, string> = {
  Card: 'CD',
  Venmo: 'VE',
  Cash: 'CA',
  Check: 'CK',
  Other: 'OT',
}

const AMOUNT_TONE: Record<PaymentRowVariant, string> = {
  paid: 'text-success-fg',
  upcoming: 'text-secondary',
  'past-due': 'text-danger-fg',
  pending: 'text-warning-fg',
}

const BADGE_CLASSES: Record<PaymentRowVariant, string> = {
  paid: 'bg-success-bg text-success-fg',
  upcoming: 'bg-sunken text-secondary',
  'past-due': 'bg-danger-bg text-danger-fg',
  pending: 'bg-warning-bg text-warning-fg',
}

const Spinner = () => (
  <span
    className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
    aria-hidden="true"
  />
)

const PaymentRow = ({
  variant,
  date,
  amountCents,
  method,
  subline,
  installmentChip,
  className = '',
}: PaymentRowProps) => {
  const badgeContent =
    variant === 'pending' ? (
      <Spinner />
    ) : method ? (
      METHOD_INITIALS[method]
    ) : (
      installmentChip
    )

  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3',
        variant === 'past-due'
          ? 'border-l-[3px] border-l-danger-fg bg-danger-bg/40'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-caption font-semibold ${BADGE_CLASSES[variant]}`}
      >
        {badgeContent}
      </span>

      <span className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="text-body-sm font-semibold text-primary truncate">{date}</span>
        {subline && <span className="text-caption text-secondary truncate">{subline}</span>}
      </span>

      <span className={`font-mono tabular-nums text-body-sm font-semibold ${AMOUNT_TONE[variant]}`}>
        {money(amountCents)}
      </span>
    </div>
  )
}

export default PaymentRow
