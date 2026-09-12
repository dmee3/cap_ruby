import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConflictPopover, { ConflictPopoverData } from './ConflictPopover'

const conflict: ConflictPopoverData = {
  id: 12,
  member: 'Marcus Webb',
  initials: 'MW',
  ensemble: 'Battery',
  section: 'Snare',
  dateLabel: 'Fri 3/20 · 6:30–9:30 PM',
  relativeSubline: 'In 10 days · submitted 6 days ago',
  status: 'Pending',
  reason: 'Closing shift I could not get covered.',
}

describe('ConflictPopover', () => {
  it('is a labelled dialog', () => {
    render(<ConflictPopover conflict={conflict} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Marcus Webb' })).toBeInTheDocument()
  })

  it('shows the conflict and its reason without a hover', () => {
    render(<ConflictPopover conflict={conflict} onClose={vi.fn()} />)

    expect(screen.getByText('Fri 3/20 · 6:30–9:30 PM')).toBeInTheDocument()
    expect(screen.getByText('Closing shift I could not get covered.')).toBeInTheDocument()
    expect(screen.getByText('Battery · Snare')).toBeInTheDocument()
  })

  // The spec's focus contract: focus lands on the primary action so a keyboard
  // user can decide immediately.
  it('moves focus to Approve on open', async () => {
    render(<ConflictPopover conflict={conflict} onClose={vi.fn()} onApprove={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve' })).toHaveFocus()
    })
  })

  it('falls back to Close when there is no decision to make', async () => {
    render(<ConflictPopover conflict={{ ...conflict, status: 'Approved' }} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close conflict details' })).toHaveFocus()
    })
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    render(<ConflictPopover conflict={conflict} onClose={onClose} onApprove={vi.fn()} />)

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalled()
  })

  it('closes on an outside click', async () => {
    const onClose = vi.fn()
    render(
      <div>
        <button type="button">outside</button>
        <ConflictPopover conflict={conflict} onClose={onClose} onApprove={vi.fn()} />
      </div>
    )

    await userEvent.click(screen.getByRole('button', { name: 'outside' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('stays open when clicked inside', async () => {
    const onClose = vi.fn()
    render(<ConflictPopover conflict={conflict} onClose={onClose} onApprove={vi.fn()} />)

    await userEvent.click(screen.getByText('Fri 3/20 · 6:30–9:30 PM'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('carries the same decisions as the queue row', async () => {
    const onApprove = vi.fn()
    const onDeny = vi.fn()
    render(
      <ConflictPopover conflict={conflict} onClose={vi.fn()} onApprove={onApprove} onDeny={onDeny} />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(onApprove).toHaveBeenCalledWith(12)

    await userEvent.click(screen.getByRole('button', { name: 'Deny' }))
    expect(onDeny).toHaveBeenCalledWith(12)
  })

  it('links to the edit screen when given a path', () => {
    render(<ConflictPopover conflict={conflict} onClose={vi.fn()} editHref="/admin/conflicts/12/edit" />)

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/admin/conflicts/12/edit')
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    render(<ConflictPopover conflict={conflict} onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close conflict details' }))

    expect(onClose).toHaveBeenCalled()
  })
})
