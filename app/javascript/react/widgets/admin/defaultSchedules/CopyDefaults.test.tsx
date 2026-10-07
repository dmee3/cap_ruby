import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import CopyDefaults, { SourceSeason } from './CopyDefaults'
import { ALL, overview } from './fixtures'

const DATES_2026 = ['2025-10-17', '2025-11-14', '2025-12-12', '2026-01-09', '2026-02-06', '2026-03-06']

const source: SourceSeason = {
  id: 1,
  year: '2026',
  combinations: overview().combinations.map(c => ({
    slug: c.slug,
    label: c.label,
    entries: c.entries.map((e, i) => ({ ...e, pay_date: DATES_2026[i] })),
    total_cents: c.total_cents,
  })),
}

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="tok">'
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('CopyDefaults', () => {
  it('defaults to +52 weeks, which keeps every date on its weekday', () => {
    render(<CopyDefaults data={{ overview: overview(ALL), sources: [source] }} />)

    expect(screen.getByText('+52 weeks')).toBeInTheDocument()
    expect(screen.getByText(/Fri 10\/17\/25 becomes Fri 10\/16\/26/)).toBeInTheDocument()
    const dates = screen.getByRole('region', { name: 'Dates' })
    expect(within(dates).getByText('10/16/26 Fri')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create 8 defaults for 2027' })).toBeEnabled()
  })

  it('moves the preview a week at a time', async () => {
    render(<CopyDefaults data={{ overview: overview(ALL), sources: [source] }} />)

    await userEvent.click(screen.getByRole('button', { name: 'One week later' }))

    expect(screen.getByText('+53 weeks')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Dates' })).getByText('10/23/26 Fri')).toBeInTheDocument()
  })

  it('creates only the missing defaults when the season already has some', () => {
    render(<CopyDefaults data={{ overview: overview(['cc2-visual-vet', 'cc2-visual-rookie']), sources: [source] }} />)

    expect(screen.getByRole('button', { name: 'Create 2 defaults for 2027' })).toBeInTheDocument()
    expect(screen.getAllByText('Copied from 2026')).toHaveLength(2)
    expect(screen.getAllByText('Keeps 2027 version')).toHaveLength(6)
  })

  it('sends the chosen source and week shift, and shows a refusal inline', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ error: 'Nope.' }), { status: 422 }))
    render(<CopyDefaults data={{ overview: overview(ALL), sources: [source] }} />)

    await userEvent.click(screen.getByRole('button', { name: 'Create 8 defaults for 2027' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Nope.'))
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init!.body as string)).toEqual({ source_season_id: 1, shift_weeks: 52 })
  })
})
