import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Member360, { Member360Data } from './Member360'

const base: Member360Data = {
  season_label: '2026',
  identity: {
    id: 9,
    name: 'Nina Park',
    first_name: 'Nina',
    username: 'ninap',
    email: 'nina@example.com',
    phone: null,
    ensemble: 'World',
    section: 'Snare',
    role: 'Member',
    vet: true,
    member_type: 'Vet · 3rd season',
  },
  dues: { state: 'behind', paid: 240_000, total: 600_000, expected: 360_000, past_due: 120_000 },
  roles_by_season: [
    { year: '2026', ensemble: 'World', section: 'Snare', role: 'Member', current: true },
    { year: '2025', ensemble: 'CC2', section: 'Tenors', role: 'Member', current: false },
  ],
  schedule: {
    id: 3,
    total_cents: 600_000,
    entries: [
      {
        id: 1,
        pay_date: '2025-10-17',
        amount_cents: 300_000,
        covered: true,
        status: 'paid',
        status_label: 'Paid 10/18',
      },
      {
        id: 2,
        pay_date: '2026-02-06',
        amount_cents: 300_000,
        covered: false,
        status: 'due-next',
        status_label: 'Due in 5 days',
      },
    ],
  },
  schedule_setup_href: '/admin/payment_schedules/3/edit',
  payment_rows: [
    {
      id: 5,
      amount_cents: 240_000,
      date_paid: '2025-10-18',
      payment_type: 'Venmo',
      notes: null,
      deleted: false,
      edit_href: '/admin/payments/5/edit',
      restore_href: '/admin/payments/restore/5',
    },
  ],
  payments_summary: { count: 1, total_cents: 240_000 },
  conflict_rows: [],
  conflicts_count: 0,
  fundraiser: { raised_cents: 0, dates_covered: 0, dates_target: 496 },
}

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="tok">'
})

describe('Member360', () => {
  it('renders the header with identity and a past-due meter', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(screen.getByText('Nina Park')).toBeInTheDocument()
    expect(screen.getByText('@ninap')).toBeInTheDocument()
    expect(screen.getByText('$1,200 past due')).toBeInTheDocument()
  })

  it('stacks the year over its assignment, with the role only on the current season', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(screen.getByText('2026')).toBeInTheDocument()
    expect(screen.getByText('World / Snare · Member')).toBeInTheDocument()
    expect(screen.getByText('CC2 / Tenors')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('gives every schedule entry a derived status pill and a season-total footer', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(screen.getByText('Paid 10/18')).toBeInTheDocument()
    expect(screen.getByText('Due in 5 days')).toBeInTheDocument()
    expect(screen.getByText('Season total')).toBeInTheDocument()
    const edits = screen.getAllByRole('link', { name: 'Edit' }).map((a) => a.getAttribute('href'))
    expect(edits).toContain('/admin/payment_schedules/3/edit')
  })

  it('summarises payments in the card header and badges the type', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(screen.getByText('1 this season · $2,400')).toBeInTheDocument()
    expect(screen.getAllByText('$2,400').length).toBeGreaterThan(0)
    expect(screen.getByText('Venmo')).toBeInTheDocument()
    const edits = screen.getAllByRole('link', { name: 'Edit' }).map((a) => a.getAttribute('href'))
    expect(edits).toContain('/admin/payments/5/edit')
  })

  it('confirms in place before deleting a payment', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true } as Response))
    vi.stubGlobal('fetch', fetchMock)
    render(<Member360 data={base} csrfToken="tok" />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/admin/payments/5',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
    vi.unstubAllGlobals()
  })

  it('backs out of the delete confirm', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true } as Response))
    vi.stubGlobal('fetch', fetchMock)
    render(<Member360 data={base} csrfToken="tok" />)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(screen.getByRole('button', { name: 'No' }))

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('offers no delete on a machine-recorded payment', () => {
    render(
      <Member360
        data={{ ...base, payment_rows: [{ ...base.payment_rows[0], payment_type: 'Stripe' }] }}
        csrfToken="tok"
      />,
    )
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('puts the schedule amount in its own column, not beside the date', () => {
    const { container } = render(<Member360 data={base} csrfToken="tok" />)
    const row = container.querySelector('.grid-cols-\\[auto_1fr_auto\\]')
    expect(row).toBeInTheDocument()
    expect(row).toHaveTextContent('$3,000')
  })

  it('keeps a deleted payment’s note readable and offers Restore', () => {
    render(
      <Member360
        data={{
          ...base,
          payment_rows: [
            {
              ...base.payment_rows[0],
              deleted: true,
              notes: 'entered twice, this one voided',
            },
          ],
        }}
        csrfToken="tok"
      />,
    )
    const note = screen.getByText(/entered twice, this one voided/)
    expect(note.className).not.toMatch(/line-through/)
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()
  })

  it('shows the no-schedule alert with a set-up link', () => {
    render(
      <Member360
        data={{
          ...base,
          dues: { state: 'no_schedule', paid: 120_000, total: 0, expected: 0, past_due: 0 },
          schedule: { id: null, total_cents: 0, entries: [] },
        }}
        csrfToken="tok"
      />,
    )
    expect(screen.getByText('Nina has no payment schedule')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Set up schedule' })).not.toHaveLength(0)
  })

  it('offers the default-schedule CTA when there is no schedule', () => {
    render(
      <Member360
        data={{ ...base, schedule: { id: null, total_cents: 0, entries: [] }, schedule_setup_href: null }}
        csrfToken="tok"
      />,
    )
    expect(screen.getByText('No schedule yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use default schedule' })).toBeInTheDocument()
  })

  it('explains why conflicts are read-only in the empty state', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(
      screen.getByText(/Nina hasn't submitted any\. Members submit their own; coordinators can't add them here\./),
    ).toBeInTheDocument()
  })

  it('shows the fundraiser as its own figure, only when there is money raised', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(screen.queryByText('Calendar fundraiser')).not.toBeInTheDocument()

    render(
      <Member360
        data={{ ...base, fundraiser: { raised_cents: 5000, dates_covered: 10, dates_target: 496 } }}
        csrfToken="tok"
      />,
    )
    expect(screen.getByText('Calendar fundraiser')).toBeInTheDocument()
    expect(screen.getByText(/Tracked separately from dues/)).toBeInTheDocument()
  })

  it('renders conflicts read-only (no approve/deny controls)', () => {
    render(
      <Member360
        data={{
          ...base,
          conflicts_count: 1,
          conflict_rows: [
            {
              id: 1,
              date_range_label: 'Fri 3/20',
              time_range_label: '6:30–9:30 PM',
              status: 'Pending',
              relative_subline: 'Closing shift · submitted 2 days ago',
            },
          ],
        }}
        csrfToken="tok"
      />,
    )
    expect(screen.getByText(/Fri 3\/20/)).toBeInTheDocument()
    expect(screen.getByText('Closing shift · submitted 2 days ago')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve|deny/i })).not.toBeInTheDocument()
  })
})
