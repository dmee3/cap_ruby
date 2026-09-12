import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ValidationSummaryCard from './ValidationSummaryCard'

describe('ValidationSummaryCard', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<ValidationSummaryCard errors={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('singularizes the heading for one error', () => {
    render(<ValidationSummaryCard errors={[{ fieldId: 'reason', message: "Tell us what's going on" }]} />)
    expect(screen.getByText('One thing to fix')).toBeInTheDocument()
  })

  it('says "Two things to fix" for two errors', () => {
    render(
      <ValidationSummaryCard
        errors={[
          { fieldId: 'start', message: 'Start date must be in the future' },
          { fieldId: 'end', message: 'End date must be in the future' },
        ]}
      />
    )
    expect(screen.getByText('Two things to fix')).toBeInTheDocument()
  })

  it('does not hardcode "Three" — scales the count for 3+ errors', () => {
    render(
      <ValidationSummaryCard
        errors={[
          { fieldId: 'start', message: 'Start date must be in the future' },
          { fieldId: 'end', message: 'End date must be in the future' },
          { fieldId: 'reason', message: "Tell us what's going on" },
        ]}
      />
    )
    expect(screen.getByText('3 things to fix')).toBeInTheDocument()
  })

  it('renders errors as plain text — no links', () => {
    const { container } = render(
      <ValidationSummaryCard errors={[{ fieldId: 'start', message: 'Start date must be in the future' }]} />
    )
    const item = screen.getByText(/Start date must be in the future/)
    expect(item.closest('a')).toBeNull()
    // The heading carries the danger tone; the items stay readable primary ink.
    expect(container.querySelector('a')).toBeNull()
  })

  it('can lead the heading with a sentence about what failed', () => {
    render(
      <ValidationSummaryCard
        lead="This payment wasn't saved."
        errors={[
          { fieldId: 'user', message: 'Pick the member this payment is from.' },
          { fieldId: 'amount', message: 'Amount has to be more than $0.' },
        ]}
      />
    )
    expect(screen.getByText("This payment wasn't saved. Two things need fixing")).toBeInTheDocument()
  })
})
