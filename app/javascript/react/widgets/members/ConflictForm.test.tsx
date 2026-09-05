import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ConflictForm from './ConflictForm'

const baseProps = {
  formAction: '/members/conflicts',
  authenticityToken: 'test-token',
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

  it('shows a live character count on the reason field', () => {
    render(<ConflictForm {...baseProps} />)
    const textarea = screen.getByPlaceholderText(/Work, travel, school, family/)
    expect(screen.getByText('0')).toBeInTheDocument()
    fireEvent.change(textarea, { target: { value: 'Family vacation' } })
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('repopulates the reason field from defaults', () => {
    render(<ConflictForm {...baseProps} defaults={{ reason: 'Family vacation' }} />)
    expect(screen.getByDisplayValue('Family vacation')).toBeInTheDocument()
  })

  it('shows the disclaimer unconditionally', () => {
    render(<ConflictForm {...baseProps} />)
    expect(screen.getByText("Sending this isn't approval")).toBeInTheDocument()
  })

  it('does not show the reassurance line when there are no errors', () => {
    render(<ConflictForm {...baseProps} />)
    expect(screen.queryByText('Nothing you typed was lost.')).not.toBeInTheDocument()
  })

  it('shows the reassurance line and validation summary when re-rendered with errors', () => {
    render(
      <ConflictForm
        {...baseProps}
        errors={[{ field: 'start_date', message: 'Start date must be in the future' }]}
      />
    )
    expect(screen.getByText('Nothing you typed was lost.')).toBeInTheDocument()
    expect(screen.getByText('One thing to fix')).toBeInTheDocument()
    expect(screen.getAllByText('Start date must be in the future').length).toBeGreaterThan(0)
  })

  it('flags an advisory end-before-start error client-side when both dates are known', () => {
    render(
      <ConflictForm
        {...baseProps}
        defaults={{
          startDate: '3/13/26',
          startTime: '9:00 PM',
          endDate: '3/13/26',
          endTime: '6:00 PM',
        }}
      />
    )
    expect(screen.getAllByText(/must be on or after the start date/).length).toBeGreaterThan(0)
  })
})
