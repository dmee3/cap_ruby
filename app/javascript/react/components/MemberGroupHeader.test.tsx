import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemberGroupHeader from './MemberGroupHeader'

describe('MemberGroupHeader', () => {
  it('names the member, their section and the pending count', () => {
    render(
      <MemberGroupHeader
        member="Marcus Webb"
        initials="MW"
        ensemble="Battery"
        section="Snare"
        pendingCount={1}
      />
    )

    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.getByText('Battery · Snare')).toBeInTheDocument()
    expect(screen.getByText('1 pending')).toBeInTheDocument()
    expect(screen.getByText('MW')).toBeInTheDocument()
  })

  it('says so when nothing is pending', () => {
    render(<MemberGroupHeader member="Jordan Pike" pendingCount={0} />)

    expect(screen.getByText('Nothing pending')).toBeInTheDocument()
  })

  it('offers the bulk action only at two or more pending', async () => {
    const onApproveAll = vi.fn()
    const { rerender } = render(
      <MemberGroupHeader member="Nia Fletcher" pendingCount={1} onApproveAll={onApproveAll} />
    )
    expect(screen.queryByRole('button', { name: /approve all/i })).not.toBeInTheDocument()

    rerender(<MemberGroupHeader member="Nia Fletcher" pendingCount={2} onApproveAll={onApproveAll} />)
    const bulk = screen.getByRole('button', { name: 'Approve all 2' })

    await userEvent.click(bulk)
    expect(onApproveAll).toHaveBeenCalled()
  })

  it('flags a long wait', () => {
    render(<MemberGroupHeader member="Elena Sokol" pendingCount={1} waitingDays={40} />)

    expect(screen.getByText('Waiting 40 days')).toBeInTheDocument()
  })

  it('does not flag a short wait', () => {
    render(<MemberGroupHeader member="Elena Sokol" pendingCount={1} waitingDays={2} />)

    expect(screen.queryByText(/waiting/i)).not.toBeInTheDocument()
  })

  it('shows the bulk action instead of the staleness flag, never both', () => {
    render(
      <MemberGroupHeader
        member="Elena Sokol"
        pendingCount={3}
        waitingDays={40}
        onApproveAll={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Approve all 3' })).toBeInTheDocument()
    expect(screen.queryByText('Waiting 40 days')).not.toBeInTheDocument()
  })
})
