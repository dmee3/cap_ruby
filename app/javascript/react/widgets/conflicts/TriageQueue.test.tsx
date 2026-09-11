import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TriageQueue, { TriageGroup } from './TriageQueue'

const group = (overrides: Partial<TriageGroup> = {}): TriageGroup => ({
  user_id: 1,
  member: 'Marcus Webb',
  initials: 'MW',
  ensemble: 'Battery',
  section: 'Snare',
  pending_count: 1,
  season_count: 1,
  waiting_days: 3,
  rows: [
    {
      id: 11,
      date_range_label: 'Fri 3/20',
      time_range_label: '6:30–9:30 PM',
      status: 'Pending',
      relative_subline: 'In 10 days · submitted 6 days ago',
      reason: 'Closing shift.',
    },
  ],
  ...overrides,
})

const baseProps = {
  basePath: '/admin/conflicts',
  onApprove: vi.fn(),
  onDeny: vi.fn(),
  onResolve: vi.fn(),
  onApproveAll: vi.fn(),
  onUndo: vi.fn(),
  onDecisionExpire: vi.fn(),
  decisions: {},
  visibleCount: 10,
  onShowMore: vi.fn(),
}

describe('TriageQueue', () => {
  it('groups rows under the member', () => {
    render(<TriageQueue {...baseProps} groups={[group()]} />)

    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.getByText(/Fri 3\/20/)).toBeInTheDocument()
  })

  // The old ConflictList returned null when empty — a blank screen with no
  // explanation. The clear queue is the state a coordinator should see most.
  it('says the queue is clear rather than rendering nothing', () => {
    const { container } = render(<TriageQueue {...baseProps} groups={[]} />)

    expect(screen.getByText('Nothing waiting on a decision')).toBeInTheDocument()
    expect(container).not.toBeEmptyDOMElement()
  })

  it('shows a loading state that keeps the grouped shape', () => {
    render(<TriageQueue {...baseProps} groups={[]} loading />)

    expect(screen.getByText('Loading conflicts…')).toBeInTheDocument()
  })

  it('takes the blame on a failed load and offers a retry', async () => {
    const onRetry = vi.fn()
    render(<TriageQueue {...baseProps} groups={[]} error="load" onRetry={onRetry} />)

    expect(screen.getByText("We couldn't load the queue")).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('links each row to the right namespace', () => {
    render(<TriageQueue {...baseProps} basePath="/coordinators/conflicts" groups={[group()]} />)

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/coordinators/conflicts/11/edit'
    )
  })

  it('swaps a deciding row for its confirmation', () => {
    render(
      <TriageQueue
        {...baseProps}
        groups={[group()]}
        decisions={{
          11: {
            outcome: 'Approved',
            member: 'Marcus Webb',
            dateLabel: 'Fri 3/20',
            saving: false,
            error: null,
          },
        }}
      />
    )

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('offers the bulk action when a member has two pending', async () => {
    const onApproveAll = vi.fn()
    const twoPending = group({
      pending_count: 2,
      rows: [
        { ...group().rows[0], id: 11 },
        { ...group().rows[0], id: 12 },
      ],
    })
    render(<TriageQueue {...baseProps} groups={[twoPending]} onApproveAll={onApproveAll} />)

    await userEvent.click(screen.getByRole('button', { name: 'Approve all 2' }))

    expect(onApproveAll).toHaveBeenCalled()
  })

  it('pages with the one app-wide load-more pattern', async () => {
    const onShowMore = vi.fn()
    const many = Array.from({ length: 12 }, (_, index) =>
      group({ user_id: index + 1, member: `Member ${index + 1}` })
    )
    render(<TriageQueue {...baseProps} groups={many} visibleCount={10} onShowMore={onShowMore} />)

    const pager = screen.getByRole('button', { name: /load 2 more/i })
    await userEvent.click(pager)

    expect(onShowMore).toHaveBeenCalled()
  })

  it('does not page a short queue', () => {
    render(<TriageQueue {...baseProps} groups={[group()]} />)

    expect(screen.queryByRole('button', { name: /load|showing all/i })).not.toBeInTheDocument()
  })
})
