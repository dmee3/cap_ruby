import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TriageRow, { TriageRowData } from './TriageRow'

const pendingRow: TriageRowData = {
  id: 7,
  date_range_label: 'Fri 3/20',
  time_range_label: '6:30–9:30 PM',
  status: 'Pending',
  relative_subline: 'In 10 days · submitted 6 days ago',
  reason: 'Closing shift I could not get covered.',
}

describe('TriageRow', () => {
  it('renders the date, time and status', () => {
    render(<TriageRow row={pendingRow} />)

    expect(screen.getByText(/Fri 3\/20 · 6:30–9:30 PM/)).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('In 10 days · submitted 6 days ago')).toBeInTheDocument()
  })

  it('offers approve and deny on a pending row', async () => {
    const onApprove = vi.fn()
    const onDeny = vi.fn()
    render(<TriageRow row={pendingRow} onApprove={onApprove} onDeny={onDeny} />)

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onApprove).toHaveBeenCalledWith(7)

    await userEvent.click(screen.getByRole('button', { name: 'Deny' }))
    expect(onDeny).toHaveBeenCalledWith(7)
  })

  it('expands the reason in place rather than on hover', async () => {
    render(<TriageRow row={pendingRow} />)

    const disclosure = screen.getByRole('button', { name: 'Full reason' })
    expect(disclosure).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(disclosure)

    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide reason' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('collapses the reason again', async () => {
    render(<TriageRow row={pendingRow} />)

    await userEvent.click(screen.getByRole('button', { name: 'Full reason' }))
    await userEvent.click(screen.getByRole('button', { name: 'Hide reason' }))

    expect(screen.getByRole('button', { name: 'Full reason' })).toBeInTheDocument()
  })

  it('offers Mark resolved on an approved row, not Approve', () => {
    const onResolve = vi.fn()
    render(
      <TriageRow
        row={{ ...pendingRow, status: 'Approved' }}
        onApprove={vi.fn()}
        onDeny={vi.fn()}
        onResolve={onResolve}
      />
    )

    expect(screen.getByRole('button', { name: 'Mark resolved' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument()
  })

  it('offers Approve instead on a denied row', () => {
    render(<TriageRow row={{ ...pendingRow, status: 'Denied' }} onApprove={vi.fn()} onDeny={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Approve instead' })).toBeInTheDocument()
  })

  it('never offers a delete — the routes have none', () => {
    render(<TriageRow row={pendingRow} onApprove={vi.fn()} onDeny={vi.fn()} onResolve={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /delete|remove/i })).not.toBeInTheDocument()
  })

  it('carries Edit on every row when a path is given', () => {
    const { rerender } = render(<TriageRow row={pendingRow} editHref="/admin/conflicts/7/edit" />)
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/conflicts/7/edit')

    rerender(<TriageRow row={{ ...pendingRow, status: 'Denied' }} editHref="/admin/conflicts/7/edit" />)
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument()
  })

  it('shows the member when the row stands alone', () => {
    render(<TriageRow row={pendingRow} member="Marcus Webb" section="Snare" />)

    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.getByText(/Snare/)).toBeInTheDocument()
  })

  it('disables the decisions while a save is in flight', () => {
    render(<TriageRow row={pendingRow} onApprove={vi.fn()} onDeny={vi.fn()} busy />)

    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Deny' })).toBeDisabled()
  })

  it('omits the disclosure when there is no reason', () => {
    render(<TriageRow row={{ ...pendingRow, reason: '' }} />)

    expect(screen.queryByRole('button', { name: 'Full reason' })).not.toBeInTheDocument()
  })
})
