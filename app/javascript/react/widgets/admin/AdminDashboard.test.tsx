import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import AdminDashboard from './AdminDashboard'

const base = {
  seasonLabel: '2026 season',
  stats: {
    expected_cents: 5_760_000,
    collected_cents: 5_132_000,
    behind_count: 3,
    member_count: 24,
    average_days_late: 9,
  },
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
    {
      id: 1,
      name: 'Rae Quinn',
      section: 'Battery / Snare',
      paid_cents: 20_000,
      season_total_cents: 60_000,
      past_due_cents: 10_000,
    },
  ],
  recentPayments: [
    {
      id: 7,
      name: 'Sam Reed',
      user_id: 2,
      amount_cents: 60_000,
      date_paid: '2026-01-12',
      payment_type: 'Venmo',
    },
  ],
  blankScheduleMembers: [
    { name: 'Marcus Vale', meta: 'New member · Battery / Snare', schedule_edit_path: '/admin/payment_schedules/9/edit' },
  ],
  conflictsToReview: [
    {
      id: 3,
      member: 'Nina Park',
      date_range_label: 'Sat 3/14',
      time_range_label: '6:30–9:30 PM',
      reason: 'closing shift',
      status: 'Pending' as const,
      relative_subline: 'in 5 days · submitted 2 days ago',
    },
  ],
}

describe('AdminDashboard', () => {
  it('titles the burndown card and names the sampling in a subtitle', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('Dues collected against plan')).toBeInTheDocument()
    expect(
      screen.getByText(/2026 season · every member’s own schedule, summed weekly · through/),
    ).toBeInTheDocument()
  })

  it('renders the four canvas stat blocks with their context lines', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('Expected by today')).toBeInTheDocument()
    expect(screen.getByText('Collected so far')).toBeInTheDocument()
    expect(screen.getByText('$6,280 short of the plan')).toBeInTheDocument()
    expect(screen.getByText('Members behind')).toBeInTheDocument()
    expect(screen.getByText('of 24')).toBeInTheDocument()
    expect(screen.getByText('Average days late')).toBeInTheDocument()
    // behind_count 3 → warning band
    expect(screen.getByText('3')).toHaveClass('text-warning-fg')
  })

  it('shows whole-dollar figures, never cents', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('$57,600')).toBeInTheDocument()
    expect(screen.queryByText(/\$57,600\.00/)).not.toBeInTheDocument()
  })

  it('renders the behind-payments table with paid, season total and past due', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('Behind on payments')).toBeInTheDocument()
    expect(screen.getByText('1 member')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View all members' })).toBeInTheDocument()

    const row = screen.getByRole('link', { name: /Rae Quinn/ })
    expect(row).toHaveAttribute('href', '/admin/users/1')
    expect(row).toHaveTextContent('$200')
    expect(row).toHaveTextContent('$600')
    expect(row).toHaveTextContent('$100')
    expect(screen.getByText('Battery / Snare')).toBeInTheDocument()
  })

  it('renders recent payments as name over method · date with a green +amount', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('Venmo · 1/12/26')).toBeInTheDocument()
    const amount = screen.getByText('+$600')
    expect(amount).toHaveClass('text-success-fg')
  })

  it('renders conflicts with the date right-aligned and no status pill', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('Nina Park')).toBeInTheDocument()
    expect(screen.getByText('Sat 3/14')).toBeInTheDocument()
    expect(screen.getByText('6:30–9:30 PM · closing shift')).toBeInTheDocument()
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
  })

  it('shows the blank-schedule alert with a split name/meta row, and dismisses it', async () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('1 member has no payment schedule')).toBeInTheDocument()
    expect(screen.getByText('New member · Battery / Snare')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up schedule' })).toHaveAttribute(
      'href',
      '/admin/payment_schedules/9/edit',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss ✕' }))
    expect(screen.queryByText('1 member has no payment schedule')).not.toBeInTheDocument()
  })

  it('switches the burndown range without refetching', async () => {
    render(<AdminDashboard {...base} />)
    const fullSeason = screen.getByRole('button', { name: 'Full season' })
    await userEvent.click(fullSeason)
    expect(fullSeason).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the caught-up empty state citing the member count', () => {
    render(
      <AdminDashboard
        {...base}
        stats={{ ...base.stats, behind_count: 0, average_days_late: null }}
        behindMembers={[]}
      />,
    )
    expect(screen.getByText("Everyone's caught up")).toBeInTheDocument()
    expect(
      screen.getByText('All 24 members have paid everything due so far this season.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Everyone current')).toBeInTheDocument()
  })
})
