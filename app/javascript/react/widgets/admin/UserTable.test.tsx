import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import UserTable from './UserTable'

const rows = [
  {
    id: 1, full_name: 'Jordan Pike', email: 'jordan@example.com',
    section: 'Snare', ensemble: 'World', role: 'member',
    vet: true, season_count: 3, has_schedule: true,
  },
  {
    id: 2, full_name: 'Marcus Webb', email: 'marcus@example.com',
    section: 'Snare', ensemble: 'CC2', role: 'member',
    vet: false, season_count: 1, has_schedule: false,
  },
  {
    id: 3, full_name: 'Dana Reyes', email: 'dana@example.com',
    section: null, ensemble: null, role: 'admin',
    vet: true, season_count: 5, has_schedule: false,
  },
]

const mockFetch = (data: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(data) })

// jsdom has no viewport, so the desktop table AND the mobile card list both
// render — the md: split is CSS-only. Query with getAllBy* accordingly.
describe('UserTable', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/admin/users')
  })
  afterEach(() => vi.restoreAllMocks())

  it('splits members from staff and counts each', async () => {
    vi.stubGlobal('fetch', mockFetch(rows))
    render(<UserTable seasonYear="2026" />)

    await waitFor(() => expect(screen.getAllByText('Jordan Pike').length).toBeGreaterThan(0))
    expect(screen.getByText(/2 members · 1 staff/)).toBeTruthy()
    // An admin is staff, not a member, so they're behind the switch.
    expect(screen.queryByText('Dana Reyes')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /staff · 1/i }))
    expect(screen.getAllByText('Dana Reyes').length).toBeGreaterThan(0)
  })

  // A schedule row with no entries counts as missing, because that's what it
  // is to a member: no due dates and no total.
  it('alerts on members with no payment schedule', async () => {
    vi.stubGlobal('fetch', mockFetch(rows))
    render(<UserTable seasonYear="2026" />)

    await waitFor(() => expect(screen.getByText(/1 member has no payment schedule/i)).toBeTruthy())
    // Staff never get schedules, so Dana must not be counted.
    expect(screen.queryByText(/2 members have no payment schedule/i)).toBeNull()
  })

  it('filters by search and clears back', async () => {
    vi.stubGlobal('fetch', mockFetch(rows))
    render(<UserTable seasonYear="2026" />)
    await waitFor(() => expect(screen.getAllByText('Jordan Pike').length).toBeGreaterThan(0))

    fireEvent.change(screen.getByPlaceholderText(/search name/i), { target: { value: 'marcus' } })
    expect(screen.queryByText('Jordan Pike')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(screen.getAllByText('Jordan Pike').length).toBeGreaterThan(0)
  })

  // The ensemble filter only makes sense for members — staff have no ensemble,
  // so carrying it across the switch filtered every staff row out, and the
  // select that would clear it isn't rendered on the staff view.
  it('does not apply the ensemble filter to staff', async () => {
    vi.stubGlobal('fetch', mockFetch(rows))
    render(<UserTable seasonYear="2026" />)
    await waitFor(() => expect(screen.getAllByText('Jordan Pike').length).toBeGreaterThan(0))

    // Marcus is CC2, so filtering to World drops him from the table. He still
    // appears in the no-schedule alert above it, hence the row-count check
    // rather than a bare queryByText.
    fireEvent.change(screen.getByLabelText(/filter by ensemble/i), { target: { value: 'World' } })
    expect(screen.getByText('1 of 2')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /staff · 1/i }))

    expect(screen.getAllByText('Dana Reyes').length).toBeGreaterThan(0)
    // The staff view has no ensemble select, so a carried-over filter would be
    // unclearable — and "Clear filters" must not offer to clear nothing.
    expect(screen.queryByLabelText(/filter by ensemble/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /clear filters/i })).toBeNull()

    // Switching back restores the ensemble choice rather than silently losing it.
    fireEvent.click(screen.getByRole('button', { name: /members · 2/i }))
    expect(screen.getByText('1 of 2')).toBeTruthy()
  })

  it('keeps the filters and offers a retry when the load fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<UserTable seasonYear="2026" />)

    await waitFor(() => expect(screen.getByText(/couldn't load the roster/i)).toBeTruthy())
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy()
  })

  it('says the season is empty rather than rendering a blank table', async () => {
    vi.stubGlobal('fetch', mockFetch([]))
    render(<UserTable seasonYear="2026" />)

    await waitFor(() => expect(screen.getByText(/no members on the roster for 2026 yet/i)).toBeTruthy())
  })

  // The one screen that deliberately ignores the season scope.
  it('renders the off-all-rosters list and says they cannot sign in', async () => {
    window.history.replaceState({}, '', '/admin/users?roster=none')
    vi.stubGlobal(
      'fetch',
      mockFetch([{ id: 9, full_name: 'Theo Grant', email: 'theo@example.com', paid_all_time_cents: 120_000 }])
    )
    render(<UserTable seasonYear="2026" />)

    await waitFor(() => expect(screen.getByText('Theo Grant')).toBeTruthy())
    expect(screen.getByText(/\$1,200 paid/)).toBeTruthy()
    expect(screen.getByText(/sign in until/i)).toBeTruthy()
  })

  it('offers a copy button beside every email, named after the address', async () => {
    vi.stubGlobal('fetch', mockFetch(rows))
    render(<UserTable seasonYear="2026" />)

    await waitFor(() => expect(screen.getAllByText('Jordan Pike').length).toBeGreaterThan(0))

    expect(
      screen.getAllByRole('button', { name: 'Copy email: jordan@example.com' }).length
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: 'Copy email: marcus@example.com' }).length
    ).toBeGreaterThan(0)
  })
})
