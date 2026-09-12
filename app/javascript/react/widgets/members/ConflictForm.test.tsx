import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ConflictForm from './ConflictForm'

const baseProps = {
  formAction: '/members/conflicts',
  authenticityToken: 'test-token',
  minDate: '2026-09-05',
  defaults: {},
  errors: [],
}

describe('ConflictForm', () => {
  it('renders a real form posting to the given action', () => {
    const { container } = render(<ConflictForm {...baseProps} />)
    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('action', '/members/conflicts')
    expect(container.querySelector('input[name="authenticity_token"]')).toHaveValue('test-token')
  })

  it('renders native date + time inputs for both boundaries', () => {
    const { container } = render(<ConflictForm {...baseProps} />)
    expect(container.querySelectorAll('input[type="date"]').length).toBe(2)
    expect(container.querySelectorAll('input[type="time"]').length).toBe(2)
  })

  it('names the four date/time inputs so Rails parses them flat under conflict[...]', () => {
    const { container } = render(<ConflictForm {...baseProps} />)
    ;['start_date_date', 'start_date_time', 'end_date_date', 'end_date_time'].forEach((key) => {
      expect(container.querySelector(`input[name="conflict[${key}]"]`)).not.toBeNull()
    })
  })

  it('shows a live character count on the reason field', () => {
    render(<ConflictForm {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/Work, travel, school, family/)
    expect(screen.getByText('0')).toBeInTheDocument()
    fireEvent.change(textarea, { target: { value: 'Family vacation' } })
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('repopulates all fields from defaults', () => {
    const { container } = render(
      <ConflictForm
        {...baseProps}
        defaults={{
          startDate: '2026-03-13',
          startTime: '18:30',
          endDate: '2026-03-13',
          endTime: '21:30',
          reason: 'Family vacation',
        }}
      />
    )
    const dates = container.querySelectorAll('input[type="date"]')
    expect((dates[0] as HTMLInputElement).value).toBe('2026-03-13')
    expect((dates[1] as HTMLInputElement).value).toBe('2026-03-13')
    expect(screen.getByDisplayValue('Family vacation')).toBeInTheDocument()
  })

  it('offers a cancel alongside submit', () => {
    render(<ConflictForm {...baseProps} cancelHref="/members" />)

    const cancel = screen.getByRole('link', { name: 'Cancel' })
    expect(cancel).toHaveAttribute('href', '/members')
  })

  it('omits cancel when there is nowhere to go back to', () => {
    render(<ConflictForm {...baseProps} />)

    expect(screen.queryByRole('link', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('shows the disclaimer unconditionally', () => {
    render(<ConflictForm {...baseProps} />)
    expect(screen.getByText("Sending this isn't approval")).toBeInTheDocument()
  })

  it('shows the validation summary when re-rendered with errors', () => {
    render(
      <ConflictForm
        {...baseProps}
        errors={[{ field: 'start_date', message: 'Start date must be in the future' }]}
      />
    )
    expect(screen.getByText('One thing to fix')).toBeInTheDocument()
    expect(screen.getAllByText('Start date must be in the future').length).toBeGreaterThan(0)
  })

  it('flags an advisory end-before-start error client-side once all four values are set', () => {
    render(
      <ConflictForm
        {...baseProps}
        defaults={{
          startDate: '2026-03-13',
          startTime: '21:00',
          endDate: '2026-03-13',
          endTime: '18:00',
        }}
      />
    )
    expect(screen.getAllByText(/must be on or after the start/).length).toBeGreaterThan(0)
  })

  it('does not flag end-before-start while the fields are still incomplete', () => {
    render(<ConflictForm {...baseProps} defaults={{ startDate: '2026-03-13', startTime: '21:00' }} />)
    expect(screen.queryByText(/must be on or after the start/)).not.toBeInTheDocument()
  })
})
