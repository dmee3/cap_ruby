import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TriageDashboard from './TriageDashboard'

const row = (id: number, member = 'Marcus Webb') => ({
  id,
  member,
  section: 'Snare',
  date_range_label: 'Fri 3/20',
  time_range_label: '6:30–9:30 PM',
  status: 'Pending',
  relative_subline: 'In 10 days · submitted 6 days ago',
  reason: 'Closing shift.',
})

const baseProps = {
  statuses: [
    { id: 1, name: 'Pending' },
    { id: 2, name: 'Approved' },
    { id: 3, name: 'Denied' },
  ],
  queuePath: '/coordinators/conflicts',
  newPath: '/coordinators/conflicts/new',
}

describe('TriageDashboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))
    )
    document.head.innerHTML = '<meta name="csrf-token" content="test-token">'
  })

  it('states the backlog and names the oldest', () => {
    render(
      <TriageDashboard
        {...baseProps}
        rows={[row(1)]}
        pendingCount={5}
        oldestMember="Elena Sokol"
        oldestWaitingDays={40}
      />
    )

    expect(screen.getByText('5 conflicts')).toBeInTheDocument()
    expect(screen.getByText(/Elena Sokol, waiting 40 days/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the queue' })).toHaveAttribute(
      'href',
      '/coordinators/conflicts'
    )
  })

  it('reads as a win when caught up', () => {
    render(<TriageDashboard {...baseProps} rows={[]} pendingCount={0} />)

    expect(screen.getByText('Nothing')).toBeInTheDocument()
    expect(screen.getByText(/You're caught up/)).toBeInTheDocument()
    expect(screen.getByText('No decisions to make')).toBeInTheDocument()
  })

  it('decides a conflict without leaving the dashboard', async () => {
    render(<TriageDashboard {...baseProps} rows={[row(7)]} pendingCount={1} />)

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/conflicts/7',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  it('removes a decided row', async () => {
    render(<TriageDashboard {...baseProps} rows={[row(7)]} pendingCount={1} />)

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(screen.getByText('No decisions to make')).toBeInTheDocument()
    })
  })

  // A failed decision must not look like a successful one.
  it('leaves the row in place when the save fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false })))
    render(<TriageDashboard {...baseProps} rows={[row(7)]} pendingCount={1} />)

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
    })
    expect(screen.queryByText('No decisions to make')).not.toBeInTheDocument()
  })

  it('links to the full queue when it holds more than it shows', () => {
    render(<TriageDashboard {...baseProps} rows={[row(1)]} pendingCount={5} />)

    expect(screen.getByRole('link', { name: 'See all 5' })).toBeInTheDocument()
  })
})
