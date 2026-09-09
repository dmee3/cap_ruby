import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Member360Header from './Member360Header'

const base = {
  name: 'Nina Park',
  username: 'ninap',
  email: 'nina@example.com',
  seasonLabel: '2026',
  tags: ['Front Ensemble / Vibes', 'Vet · 3rd season', 'Section leader'],
  dues: {
    paidCents: 36_000,
    totalCents: 60_000,
    expectedCents: 36_000,
    pastDueCents: 0,
    state: 'on-track' as const,
  },
  conflictsCount: 2,
  variant: 'on-track' as const,
}

describe('Member360Header', () => {
  it('renders identity: name, @username, email, tags', () => {
    render(<Member360Header {...base} />)
    expect(screen.getByText('Nina Park')).toBeInTheDocument()
    expect(screen.getByText('@ninap')).toBeInTheDocument()
    expect(screen.getByText('nina@example.com')).toBeInTheDocument()
    expect(screen.getByText('Front Ensemble / Vibes')).toBeInTheDocument()
  })

  it('shows the dues meter and the conflicts count on the on-track variant', () => {
    render(<Member360Header {...base} />)
    expect(screen.getByText('Conflicts this season')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Expected by today: $360.00')).toBeInTheDocument()
  })

  it('keeps the "Expected by today" caption on the past-due variant', () => {
    render(
      <Member360Header
        {...base}
        variant="past-due"
        dues={{ ...base.dues, paidCents: 24_000, pastDueCents: 12_000, state: 'behind' }}
      />,
    )
    expect(screen.getByText('Expected by today: $360.00')).toBeInTheDocument()
    expect(screen.getByText('$120.00 past due')).toBeInTheDocument()
  })

  it('replaces the meter with a set-up link on the no-schedule variant', () => {
    render(<Member360Header {...base} variant="no-schedule" scheduleHref="/admin/payment_schedules/3/edit" />)
    expect(screen.getByText('No schedule yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up schedule' })).toHaveAttribute(
      'href',
      '/admin/payment_schedules/3/edit',
    )
  })

  it('shows "None" when there are no conflicts', () => {
    render(<Member360Header {...base} conflictsCount={0} />)
    expect(screen.getByText('None')).toBeInTheDocument()
  })
})
