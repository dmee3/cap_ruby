import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ConflictContextRow from './ConflictContextRow'

describe('ConflictContextRow', () => {
  it('renders the date range, time range, and a status pill', () => {
    render(
      <ConflictContextRow
        dateRangeLabel="Fri 3/14"
        timeRangeLabel="6:30–9:30 PM"
        status="Pending"
        relativeSubline="In 4 days · submitted 3 days ago"
      />
    )
    expect(screen.getByText(/Fri 3\/14/)).toBeInTheDocument()
    expect(screen.getByText(/6:30–9:30 PM/)).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('In 4 days · submitted 3 days ago')).toBeInTheDocument()
  })

  it('supports a multi-day date range label with no time', () => {
    render(
      <ConflictContextRow
        dateRangeLabel="Sat 4/4 – Mon 4/6"
        status="Denied"
        relativeSubline="In 25 days · submitted 6 days ago"
      />
    )
    expect(screen.getByText(/Sat 4\/4 – Mon 4\/6/)).toBeInTheDocument()
    expect(screen.getByText('Denied')).toBeInTheDocument()
  })

  it('omits the reason line when the caller does not pass one', () => {
    const { container } = render(
      <ConflictContextRow dateRangeLabel="Sat 3/22" status="Pending" relativeSubline="In 12 days" />
    )
    expect(container.textContent).not.toMatch(/Family trip|shift/)
  })

  it('renders the reason line when the caller passes one (Denied / next-upcoming)', () => {
    render(
      <ConflictContextRow
        dateRangeLabel="Sat 4/4 – Mon 4/6"
        status="Denied"
        relativeSubline="In 25 days"
        reason="Family trip booked before the schedule came out."
      />
    )
    expect(screen.getByText('Family trip booked before the schedule came out.')).toBeInTheDocument()
  })

  it('renders an Edit link when the row is still editable', () => {
    render(
      <ConflictContextRow
        dateRangeLabel="Fri 3/20"
        status="Pending"
        relativeSubline="In 8 days"
        editable
        editPath="/members/conflicts/7/edit"
      />
    )
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/members/conflicts/7/edit')
  })

  it('renders a non-link Edit once the conflict has been decided', () => {
    render(
      <ConflictContextRow
        dateRangeLabel="Sat 3/21"
        status="Approved"
        relativeSubline="In 9 days"
        editable={false}
      />
    )
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('shows no Edit affordance at all when the screen does not offer editing', () => {
    render(<ConflictContextRow dateRangeLabel="Fri 3/20" status="Pending" relativeSubline="In 8 days" />)
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
  })

  it('covers all four status values via StatusPill', () => {
    const statuses = ['Pending', 'Approved', 'Denied', 'Resolved'] as const
    statuses.forEach((status) => {
      const { unmount } = render(
        <ConflictContextRow dateRangeLabel="Fri 3/14" status={status} relativeSubline="—" />
      )
      expect(screen.getByText(status)).toBeInTheDocument()
      unmount()
    })
  })
})
