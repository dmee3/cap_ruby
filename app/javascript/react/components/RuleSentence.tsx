import React from 'react'

// The stored enum values, paired with the only wording the UI ever shows.
// "Operators render as plain language only, never as eq or lt_eq."
export const OPERATORS = [
  { value: 'eq', label: 'is exactly' },
  { value: 'lt', label: 'is below' },
  { value: 'lt_eq', label: 'is at or below' },
  { value: 'gt', label: 'is above' },
  { value: 'gt_eq', label: 'is at or above' },
] as const

export type Operator = (typeof OPERATORS)[number]['value']

export const operatorLabel = (value: string) =>
  OPERATORS.find((o) => o.value === value)?.label ?? value

type Option = { id: number; name: string }

type RuleSentenceProps = {
  items: Option[]
  recipients: Option[]
  itemId: number | ''
  operator: Operator
  threshold: number | ''
  recipientId: number | ''
  onChange: (patch: Partial<{
    itemId: number | ''
    operator: Operator
    threshold: number | ''
    recipientId: number | ''
  }>) => void
  idPrefix?: string
}

const SLOT = [
  'h-8 rounded-sm border border-border-strong bg-surface px-2 text-body-sm font-semibold text-primary',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
].join(' ')

/**
 * §4.41. A low-stock alert reads as one sentence rather than four selects in a
 * grid, so a list of rules is a list of sentences:
 *
 *   When [Keyboard mallets] is [at or below] [8], email [Dana Reyes].
 *
 * The canvas draws every slot as a styled <span> with a chevron, and the
 * operator as a row of custom pill chips. Both ship as native controls here —
 * the same call §4.21 made for Flow 4's status scope. A native select is
 * keyboard- and screen-reader-accessible for free.
 */
const RuleSentence = ({
  items,
  recipients,
  itemId,
  operator,
  threshold,
  recipientId,
  onChange,
  idPrefix = 'rule',
}: RuleSentenceProps) => (
  <div className="flex flex-wrap items-center gap-2 text-body leading-8 text-primary">
    <span>When</span>

    <label className="sr-only" htmlFor={`${idPrefix}-item`}>
      Item
    </label>
    <select
      id={`${idPrefix}-item`}
      className={SLOT}
      value={itemId}
      onChange={(e) => onChange({ itemId: e.target.value === '' ? '' : Number(e.target.value) })}
    >
      <option value="">Pick an item</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
        </option>
      ))}
    </select>

    <label className="sr-only" htmlFor={`${idPrefix}-operator`}>
      Condition
    </label>
    <select
      id={`${idPrefix}-operator`}
      className={`${SLOT} border-accent-primary bg-sunken`}
      value={operator}
      onChange={(e) => onChange({ operator: e.target.value as Operator })}
    >
      {OPERATORS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <label className="sr-only" htmlFor={`${idPrefix}-threshold`}>
      Threshold
    </label>
    <input
      id={`${idPrefix}-threshold`}
      type="number"
      min={0}
      inputMode="numeric"
      className={`${SLOT} w-[64px] text-center font-mono`}
      value={threshold}
      onChange={(e) => onChange({ threshold: e.target.value === '' ? '' : Number(e.target.value) })}
    />

    <span>, email</span>

    <label className="sr-only" htmlFor={`${idPrefix}-recipient`}>
      Who to email
    </label>
    <select
      id={`${idPrefix}-recipient`}
      className={SLOT}
      value={recipientId}
      onChange={(e) => onChange({ recipientId: e.target.value === '' ? '' : Number(e.target.value) })}
    >
      <option value="">Pick someone</option>
      {recipients.map((person) => (
        <option key={person.id} value={person.id}>
          {person.name}
        </option>
      ))}
    </select>

    <span>.</span>
  </div>
)

/** The same sentence as read-only prose, for the rules list. */
export const RuleSentenceText = ({
  itemName,
  operator,
  threshold,
  recipientName,
}: {
  itemName: string
  operator: string
  threshold: number
  recipientName: string
}) => (
  <span className="text-body text-primary">
    When <strong className="font-bold">{itemName}</strong> is{' '}
    <strong className="font-bold">
      {operatorLabel(operator)} {threshold}
    </strong>
    , email <strong className="font-bold">{recipientName}</strong>.
  </span>
)

export default RuleSentence
