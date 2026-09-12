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
  showDecided: false,
}

describe('ConflictCalendarView', () => {
  // Decided conflicts stay hidden unless the caller says otherwise; the switch
  // itself lives on the shared filter line, not in here.
  it('hides denied and resolved when told to', () => {
    render(
      <ConflictCalendarView
        {...baseProps}
        conflicts={[conflict({ id: 12, status: { id: 3, name: 'Denied' } })]}
      />
    )

    expect(screen.getByText(/No conflicts are waiting or approved/)).toBeInTheDocument()
  })

  it('shows them when the caller turns them on', () => {
    render(
      <ConflictCalendarView
        {...baseProps}
        showDecided
        conflicts={[conflict({ id: 12, status: { id: 3, name: 'Denied' } })]}
      />
    )

    expect(screen.queryByText(/No conflicts are waiting or approved/)).not.toBeInTheDocument()
  })

  it('owns no filter controls of its own', () => {
    render(<ConflictCalendarView {...baseProps} conflicts={[conflict()]} />)

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
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
