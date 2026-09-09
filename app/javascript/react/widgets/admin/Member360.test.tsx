import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import Member360, { Member360Data } from './Member360'

const base: Member360Data = {
  season_label: '2026',
  identity: {
    id: 9,
    name: 'Nina Park',
    username: 'ninap',
    email: 'nina@example.com',
    phone: null,
    ensemble: 'World',
    section: 'Snare',
    role: 'member',
    vet: true,
  },
  dues: { state: 'behind', paid: 24_000, total: 60_000, expected: 36_000, past_due: 12_000 },
  roles_by_season: [
    { year: '2026', ensemble: 'World', section: 'Snare', current: true },
    { year: '2025', ensemble: 'CC2', section: 'Tenors', current: false },
  ],
  schedule: {
    id: 3,
    total_cents: 60_000,
    entries: [
      { id: 1, pay_date: '2025-10-17', amount_cents: 30_000, covered: true },
      { id: 2, pay_date: '2026-02-06', amount_cents: 30_000, covered: false },
    ],
  },
  payment_rows: [
    { id: 5, amount_cents: 24_000, date_paid: '2025-10-18', payment_type: 'Venmo', notes: null, deleted: false },
  ],
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
    expect(screen.getByText('$120.00 past due')).toBeInTheDocument()
  })

  it('lists roles by season with a Current pill on the active one', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(screen.getByText('2026 — World · Snare')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('marks covered schedule entries', () => {
    render(<Member360 data={base} csrfToken="tok" />)
    expect(screen.getByText('Covered')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit schedule' })).toHaveAttribute(
      'href',
      '/admin/payment_schedules/3/edit',
    )
  })

  it('shows the no-schedule alert only when there is no schedule', () => {
    const noSchedule: Member360Data = {
      ...base,
      dues: { state: 'no_schedule', paid: 12_000, total: 0, expected: 0, past_due: 0 },
      schedule: { id: null, total_cents: 0, entries: [] },
    }
    render(<Member360 data={noSchedule} csrfToken="tok" />)
    expect(screen.getByText('Nina Park has no payment schedule')).toBeInTheDocument()
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
          conflict_rows: [
            {
              id: 1,
              date_range_label: 'Sat 3/14',
              status: 'Pending',
              relative_subline: 'in 5 days · submitted 2 days ago',
            },
          ],
        }}
        csrfToken="tok"
      />,
    )
    expect(screen.getByText('Sat 3/14')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /approve|deny/i })).not.toBeInTheDocument()
  })
})
