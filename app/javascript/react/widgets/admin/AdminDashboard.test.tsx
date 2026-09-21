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
  },
  lastVenmo: {
    name: 'Jordan Pike',
    amount_cents: 40_000,
    date_paid: '2026-03-07',
    entered_days_ago: 3,
  },
  newVenmoPaymentPath: '/admin/payments/new?payment_type=Venmo',
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
  whistleblowerCoverage: { count: 6, threshold: 3, users_path: '/admin/users' },
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
    expect(screen.getByText('Last Venmo entered')).toBeInTheDocument()
    // behind_count 3 → warning band
    expect(screen.getByText('3')).toHaveClass('text-warning-fg')
  })

  it('names the surplus when ahead, so "ahead" never reads against the collected figure', () => {
    render(
      <AdminDashboard
        {...base}
        stats={{ ...base.stats, expected_cents: 5_000_000, collected_cents: 5_132_000 }}
      />,
    )
    expect(screen.getByText('$1,320 ahead of the plan')).toBeInTheDocument()
    expect(screen.queryByText('Ahead of the plan')).not.toBeInTheDocument()
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

  describe('whistleblower recipient coverage', () => {
    const withCount = (count: number) => ({
      ...base,
      whistleblowerCoverage: { ...base.whistleblowerCoverage, count },
    })

    it('stays quiet when more than the target can receive a report', () => {
      render(<AdminDashboard {...base} />)
      expect(screen.queryByText(/receive a whistleblower report/)).not.toBeInTheDocument()
    })

    it('warns at exactly the target, where losing one person drops coverage', () => {
      render(<AdminDashboard {...withCount(3)} />)
      expect(screen.getByText('3 people can receive a whistleblower report')).toBeInTheDocument()
      expect(
        screen.getByText(/losing one person drops coverage below the intended 3/),
      ).toBeInTheDocument()
    })

    it('names the lowered bar when the pool is under the target', () => {
      render(<AdminDashboard {...withCount(2)} />)
      expect(screen.getByText('2 people can receive a whistleblower report')).toBeInTheDocument()
      expect(screen.getByText(/the form can only ask for 2/)).toBeInTheDocument()
    })

    it('says reports cannot be submitted at all when nobody is flagged', () => {
      render(<AdminDashboard {...withCount(0)} />)
      expect(screen.getByText('Nobody can receive a whistleblower report')).toBeInTheDocument()
      expect(screen.getByText(/cannot be submitted/)).toBeInTheDocument()
    })

    it('dismisses on its own, leaving the blank-schedule alert up', async () => {
      render(<AdminDashboard {...withCount(2)} />)
      const [scheduleDismiss, recipientDismiss] = screen.getAllByRole('button', {
        name: 'Dismiss ✕',
      })
      expect(scheduleDismiss).toBeDefined()

      await userEvent.click(recipientDismiss)

      expect(screen.queryByText(/receive a whistleblower report/)).not.toBeInTheDocument()
      expect(screen.getByText('1 member has no payment schedule')).toBeInTheDocument()
    })
  })

  // A past season's chart is bounded by the season's end; without that the
  // x-axis ran months past the data and the plot overflowed its card.
  describe('a season that has already ended', () => {
    const past = {
      ...base,
      burndown: {
        ...base.burndown,
        today: '2026-09-17',
        as_of: '2026-01-18',
        after_cutoff: { cents: 331_500, count: 8, after: '2026-01-18' },
      },
    }

    it('dates the card subtitle and the marker to the season end', () => {
      render(<AdminDashboard {...past} />)
      expect(screen.getByText(/through Sun, 1\/18/)).toBeInTheDocument()
      expect(screen.getByText('Season end')).toBeInTheDocument()
    })

    it('accounts for payments that landed after the season', () => {
      render(<AdminDashboard {...past} />)
      expect(screen.getByText(/Collected after the season/)).toBeInTheDocument()
      expect(screen.getByText('$3,315')).toBeInTheDocument()
    })

    it('keeps the last-30-days range anchored to the season end, not today', async () => {
      const { container } = render(<AdminDashboard {...past} />)
      await userEvent.click(screen.getByRole('button', { name: 'Last 30 days' }))
      // Anchored to today the window would be empty and plot nothing.
      expect(container.querySelectorAll('polyline').length).toBeGreaterThan(0)
    })
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
        stats={{ ...base.stats, behind_count: 0 }}
        behindMembers={[]}
      />,
    )
    expect(screen.getByText("Everyone's caught up")).toBeInTheDocument()
    expect(
      screen.getByText('All 24 members have paid everything due so far this season.'),
    ).toBeInTheDocument()
  })

  it('bookmarks the last Venmo payment with the date, member and amount', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.getByText('Sat, 3/7/26')).toBeInTheDocument()
    expect(screen.getByText('Jordan Pike')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enter another Venmo payment' })).toHaveAttribute(
      'href',
      '/admin/payments/new?payment_type=Venmo',
    )
  })

  it('stays quiet about recency while entry is keeping up', () => {
    render(<AdminDashboard {...base} />)
    expect(screen.queryByText(/There may be a backlog in Venmo/)).not.toBeInTheDocument()
  })

  it('warns about a possible backlog once entry is over two weeks stale', () => {
    render(
      <AdminDashboard {...base} lastVenmo={{ ...base.lastVenmo, entered_days_ago: 26 }} />,
    )
    expect(
      screen.getByText('You keyed it in 26 days ago. There may be a backlog in Venmo.'),
    ).toBeInTheDocument()
  })

  it('offers a first entry when no Venmo payment has been recorded', () => {
    render(<AdminDashboard {...base} lastVenmo={null} />)
    expect(screen.getByText('No Venmo payments yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Enter a Venmo payment' })).toBeInTheDocument()
  })
})
