import React from 'react'
import Card from './Card'

// `fieldId` is the offending field's DOM id — used as a stable React key.
export type ValidationError = { fieldId: string; message: string }

type ValidationSummaryCardProps = {
  errors: ValidationError[]
  className?: string
}

const heading = (count: number) => {
  if (count === 1) return 'One thing to fix'
  if (count === 2) return 'Two things to fix'
  return `${count} things to fix`
}

// Appears above the form on a failed submit. Built on Card's `tone="danger"`
// (3px raspberry left accent) rather than reinventing that styling.
const ValidationSummaryCard = ({ errors, className = '' }: ValidationSummaryCardProps) => {
  if (errors.length === 0) return null

  return (
    <Card tone="danger" className={className}>
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-semibold text-danger-fg">{heading(errors.length)}</span>
        <ul className="flex flex-col gap-1.5">
          {errors.map((error) => (
            <li key={error.fieldId} className="text-body-sm text-danger-fg">
              {error.message}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

export default ValidationSummaryCard
