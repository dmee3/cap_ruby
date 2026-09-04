import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ConflictDateTimeField from './ConflictDateTimeField'

describe('ConflictDateTimeField', () => {
  it('renders a date box and a time box side by side', () => {
    const { container } = render(
      <ConflictDateTimeField label="Starts" name="conflict_start" id="start" />
    )
    expect(container.querySelector('.conflict-datetime-date')).not.toBeNull()
    expect(container.querySelector('.conflict-datetime-time')).not.toBeNull()
    expect(screen.getByText('Starts')).toBeInTheDocument()
  })

  it('prefills from default values (repopulation on validation failure)', () => {
    const { container } = render(
      <ConflictDateTimeField
        label="Ends"
        name="conflict_end"
        id="end"
        defaultDateValue="3/13/26"
        defaultTimeValue="9:30 PM"
      />
    )
    const dateInput = container.querySelector('.conflict-datetime-date') as HTMLInputElement
    const timeInput = container.querySelector('.conflict-datetime-time') as HTMLInputElement
    expect(dateInput.value).toBe('3/13/26')
    expect(timeInput.value).toBe('9:30 PM')
  })

  it('shows a danger border and helper text on error', () => {
    const { container } = render(
      <ConflictDateTimeField
        label="Starts"
        name="conflict_start"
        id="start"
        error="Start date must be in the future. That was 2 days ago."
      />
    )
    expect(container.querySelector('.conflict-datetime-date')?.className).toMatch(/border-danger-fg/)
    expect(screen.getByText(/must be in the future/)).toHaveClass('text-danger-fg')
  })

  it('carries the id used by ValidationSummaryCard anchor links', () => {
    const { container } = render(
      <ConflictDateTimeField label="Starts" name="conflict_start" id="start" />
    )
    expect(container.querySelector('#start')).not.toBeNull()
  })
})
