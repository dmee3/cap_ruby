import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConflictCalendarView, { CalendarConflict } from './ConflictCalendarView'

const conflict = (overrides: Partial<CalendarConflict> = {}): CalendarConflict => ({
  id: 11,
  title: 'Marcus Webb',
  ensemble: 'Battery',
  section: 'Snare',
  start: '2026-03-20T18:30:00',
  end: '2026-03-20T21:30:00',
  reason: 'Closing shift.',
  status: { id: 1, name: 'Pending' },
  ...overrides,
})

const baseProps = {
  basePath: '/admin/conflicts',
  onApprove: vi.fn(),
  onDeny: vi.fn(),
}

describe('ConflictCalendarView', () => {
  // The old calendar dropped denied and resolved with no legend and no way to
  // see them — the single most surprising behaviour on the screen.
  it('hides denied and resolved by default, but says so with a control', () => {
    render(
      <ConflictCalendarView
        {...baseProps}
        conflicts={[conflict(), conflict({ id: 12, status: { id: 3, name: 'Denied' } })]}
      />
    )

    expect(screen.getByLabelText('Show denied and resolved')).not.toBeChecked()
  })

  it('reveals them when asked', async () => {
    render(
      <ConflictCalendarView
        {...baseProps}
        conflicts={[conflict({ id: 12, status: { id: 3, name: 'Denied' } })]}
      />
    )

    expect(screen.getByText(/No conflicts are waiting or approved/)).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Show denied and resolved'))

    expect(screen.queryByText(/No conflicts are waiting or approved/)).not.toBeInTheDocument()
  })

  it('is a real checkbox, not a styled span', () => {
    render(<ConflictCalendarView {...baseProps} conflicts={[conflict()]} />)

    expect(screen.getByLabelText('Show denied and resolved')).toHaveAttribute('type', 'checkbox')
  })

  it('carries a legend for the status colours', () => {
    render(<ConflictCalendarView {...baseProps} conflicts={[conflict()]} />)

    const legend = screen.getAllByRole('listitem').map(node => node.textContent)
    expect(legend).toEqual(['Pending', 'Approved', 'Denied', 'Resolved'])
  })

  it('has an empty state of its own', () => {
    render(<ConflictCalendarView {...baseProps} conflicts={[]} />)

    expect(screen.getByText('Nothing on the calendar')).toBeInTheDocument()
  })

  it('takes the blame on a failed load', async () => {
    const onRetry = vi.fn()
    render(<ConflictCalendarView {...baseProps} conflicts={[]} error="load" onRetry={onRetry} />)

    expect(screen.getByText("We couldn't load the calendar")).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows a loading state', () => {
    render(<ConflictCalendarView {...baseProps} conflicts={[]} loading />)

    expect(screen.getByText('Loading calendar…')).toBeInTheDocument()
  })
})
