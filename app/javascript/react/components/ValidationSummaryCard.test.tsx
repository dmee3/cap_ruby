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

  it('renders errors as plain red text — no links', () => {
    const { container } = render(
      <ValidationSummaryCard errors={[{ fieldId: 'start', message: 'Start date must be in the future' }]} />
    )
    const item = screen.getByText('Start date must be in the future')
    expect(item.closest('a')).toBeNull()
    expect(item).toHaveClass('text-danger-fg')
    expect(container.querySelector('a')).toBeNull()
  })
})
