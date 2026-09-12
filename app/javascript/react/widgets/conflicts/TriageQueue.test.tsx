import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TriageQueue, { TriageGroup } from './TriageQueue'

const group = (overrides: Partial<TriageGroup> = {}): TriageGroup => ({
  date: '2026-03-20',
  date_label: 'Friday, 3/20',
  pending_count: 1,
  rows: [
    {
      id: 11,
      member: 'Marcus Webb',
      section: 'Snare',
      initials: 'MW',
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
  onUndo: vi.fn(),
  onDecisionExpire: vi.fn(),
  decisions: {},
  visibleCount: 10,
  onShowMore: vi.fn(),
}

describe('TriageQueue', () => {
  it('groups rows under the date they fall on', () => {
    render(<TriageQueue {...baseProps} groups={[group()]} />)

    expect(screen.getByRole('heading', { name: 'Friday, 3/20' })).toBeInTheDocument()
    // The member moves onto the row, since the heading no longer names them.
    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
  })

  it('orders groups as the server sent them', () => {
    const groups = [
      group({ date: '2026-03-20', date_label: 'Friday, 3/20' }),
      group({ date: '2026-03-22', date_label: 'Sunday, 3/22', rows: [{ ...group().rows[0], id: 12 }] }),
    ]
    render(<TriageQueue {...baseProps} groups={groups} />)

    const headings = screen.getAllByRole('heading').map(node => node.textContent)
    expect(headings).toEqual(['Friday, 3/20', 'Sunday, 3/22'])
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

  // A decided row must not change shape — same rounded card, new border tone.
  it('keeps the row in its rounded card once decided', () => {
    const { container } = render(
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

    const card = container.querySelector('.rounded-md.border')
    expect(card).toBeTruthy()
    expect(card?.className).toContain('border-moss')
  })

  it('pages with the one app-wide load-more pattern', async () => {
    const onShowMore = vi.fn()
    const many = Array.from({ length: 12 }, (_, index) =>
      group({ date: `2026-03-${String(index + 1).padStart(2, '0')}`, date_label: `Day ${index + 1}` })
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
