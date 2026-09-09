import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import AdminDashboard from './AdminDashboard'

const base = {
  stats: { expected_cents: 1_260_000, collected_cents: 980_000, behind_count: 3, average_days_late: 9 },
  burndown: {
    scheduled: [
      ['2026-01-04', 0],
      ['2026-01-11', 3000],
      ['2026-01-18', 5000],
    ] as [string, number][],
    actual: [
      ['2026-01-04', 0],
      ['2026-01-11', 2500],
    ] as [string, number][],
    today: '2026-01-14',
    currency: 'USD',
  },
  behindMembers: [
    { id: 1, name: 'Rae Quinn', paid_cents: 20_000, season_total_cents: 60_000, past_due_cents: 10_000 },
  ],
  recentPayments: [
    {
      id: 7,
      name: 'Sam Reed',
      user_id: 2,
      amount_cents: 12_300,
      date_paid: '2026-01-12',
      payment_type: 'Venmo',
    },
  ],
  blankScheduleMembers: [
    { name: 'Marcus Vale', section: 'Snare', schedule_edit_path: '/admin/payment_schedules/9/edit' },
  ],
  conflictsToReview: [
    {
      id: 3,
      member: 'Nina Park',
      date_range_label: 'Sat 3/14',
      status: 'Pending' as const,
      relative_subline: 'in 5 days · submitted 2 days ago',
    },
  ],
}

describe('AdminDashboard', () => {
  it('renders the four stat blocks with banded behind-count', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('Members behind')).toBeInTheDocument()
    // behind_count 3 → warning band
    expect(screen.getByText('3')).toHaveClass('text-warning-fg')
    expect(screen.getByText('9 days')).toBeInTheDocument()
  })

  it('shows the blank-schedule alert with a per-member link and dismisses it', async () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('1 member has no payment schedule')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up schedule' })).toHaveAttribute(
      'href',
      '/admin/payment_schedules/9/edit',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText('1 member has no payment schedule')).not.toBeInTheDocument()
  })

  it('lists behind members linking to their Member 360', () => {
    render(<AdminDashboard {...base} />)
    const link = screen.getByRole('link', { name: /Rae Quinn/ })
    expect(link).toHaveAttribute('href', '/admin/users/1')
    expect(screen.getByText('$100 past due')).toBeInTheDocument()
  })

  it('renders recent payments and conflicts-to-review', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText(/Sam Reed/)).toBeInTheDocument()
    expect(screen.getByText(/Nina Park · Sat 3\/14/)).toBeInTheDocument()
  })

  it('switches the burndown range without refetching', async () => {
    render(<AdminDashboard {...base} />)
    const fullSeason = screen.getByRole('button', { name: 'Full season' })
    await userEvent.click(fullSeason)
    expect(fullSeason).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the "everyone current" empty state when nothing is behind', () => {
    render(
      <AdminDashboard
        {...base}
        stats={{ ...base.stats, behind_count: 0, average_days_late: null }}
        behindMembers={[]}
      />,
    )
    expect(screen.getByText("Everyone's caught up")).toBeInTheDocument()
    expect(screen.getByText('Everyone current')).toBeInTheDocument()
  })
})
