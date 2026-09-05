import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ConflictDateTimeField from './ConflictDateTimeField'

const baseProps = {
  label: 'Starts' as const,
  namePrefix: 'conflict[start_date]',
  id: 'conflict-start-date',
  dateValue: '',
  timeValue: '',
  onDateChange: () => {},
  onTimeChange: () => {},
}

describe('ConflictDateTimeField', () => {
  it('renders native date and time inputs', () => {
    const { container } = render(<ConflictDateTimeField {...baseProps} />)
    expect(container.querySelector('input[type="date"]')).not.toBeNull()
    expect(container.querySelector('input[type="time"]')).not.toBeNull()
    expect(screen.getByText('Starts')).toBeInTheDocument()
  })

  it('posts the two halves under the namePrefix', () => {
    const { container } = render(<ConflictDateTimeField {...baseProps} />)
    expect(container.querySelector('input[name="conflict[start_date]_date"]')).not.toBeNull()
    expect(container.querySelector('input[name="conflict[start_date]_time"]')).not.toBeNull()
  })

  it('shows the current values (repopulation after a failed submit)', () => {
    const { container } = render(
      <ConflictDateTimeField {...baseProps} dateValue="2026-03-13" timeValue="21:30" />
    )
    expect((container.querySelector('input[type="date"]') as HTMLInputElement).value).toBe('2026-03-13')
    expect((container.querySelector('input[type="time"]') as HTMLInputElement).value).toBe('21:30')
  })

  it('calls onDateChange / onTimeChange as the user edits', () => {
    const onDateChange = vi.fn()
    const onTimeChange = vi.fn()
    const { container } = render(
      <ConflictDateTimeField {...baseProps} onDateChange={onDateChange} onTimeChange={onTimeChange} />
    )
    fireEvent.change(container.querySelector('input[type="date"]')!, { target: { value: '2026-03-13' } })
    fireEvent.change(container.querySelector('input[type="time"]')!, { target: { value: '18:30' } })
    expect(onDateChange).toHaveBeenCalledWith('2026-03-13')
    expect(onTimeChange).toHaveBeenCalledWith('18:30')
  })

  it('passes minDate to the native date picker', () => {
    const { container } = render(<ConflictDateTimeField {...baseProps} minDate="2026-09-05" />)
    expect(container.querySelector('input[type="date"]')).toHaveAttribute('min', '2026-09-05')
  })

  it('shows a danger border and helper text on error', () => {
    const { container } = render(
      <ConflictDateTimeField {...baseProps} error="Start date must be in the future. That was 2 days ago." />
    )
    expect(container.querySelector('input[type="date"]')?.className).toMatch(/border-danger-fg/)
    expect(screen.getByText(/must be in the future/)).toHaveClass('text-danger-fg')
  })
})
