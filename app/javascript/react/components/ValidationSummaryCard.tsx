import React from 'react'
import Card from './Card'

// `fieldId` is the offending field's DOM id — used as a stable React key.
export type ValidationError = { fieldId: string; message: string }

type ValidationSummaryCardProps = {
  errors: ValidationError[]
  /** Leads the heading, e.g. "This payment wasn't saved." */
  lead?: string
  className?: string
}

// Spelled out through two, numeric beyond — past that the word is harder to
// scan than the digit (a Flow 3 decision, kept).
const countWord = (count: number) => (count === 1 ? 'One' : count === 2 ? 'Two' : String(count))

const heading = (count: number, lead?: string) => {
  const thing = count === 1 ? 'thing' : 'things'
  return lead
    ? `${lead} ${countWord(count)} ${thing} need fixing`
    : `${countWord(count)} ${thing} to fix`
}

// Appears above the form on a failed submit. Built on Card's `tone="danger"`
// (3px raspberry left accent) rather than reinventing that styling.
const ValidationSummaryCard = ({ errors, lead, className = '' }: ValidationSummaryCardProps) => {
  if (errors.length === 0) return null

  return (
    <Card tone="danger" borderTone className={`bg-danger-bg ${className}`.trim()}>
      <div className="flex flex-col gap-2">
        <span className="text-body font-bold text-danger-fg">{heading(errors.length, lead)}</span>
        <ul className="flex flex-col gap-1.5">
          {errors.map((error) => (
            <li key={error.fieldId} className="text-body-sm font-medium text-primary">
              · {error.message}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

export default ValidationSummaryCard
