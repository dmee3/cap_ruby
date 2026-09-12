import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConflictTriage from './ConflictTriage'

const statuses = [
  { id: 1, name: 'Pending' },
  { id: 2, name: 'Approved' },
  { id: 3, name: 'Denied' },
  { id: 4, name: 'Resolved' },
]

// Placed in the current month: FullCalendar opens on today, so an event in a
// different month simply isn't in the DOM to click.
const today = new Date()
const day = new Date(today.getFullYear(), today.getMonth(), 15)
const iso = (hours: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, 30)
    .toISOString()
    .slice(0, 19)

const conflict = {
  id: 11,
  title: 'Marcus Webb',
  ensemble: 'Battery',
  section: 'Snare',
  start: iso(18),
  end: iso(21),
  reason: 'Closing shift.',
  status: { id: 1, name: 'Pending' },
}

const group = {
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
}

const payload = { groups: [group], conflicts: [conflict], counts: { Pending: 1, All: 1 } }

// Each GET returns the queue payload; each PUT returns ok. Tracks calls so the
// tests can assert on refetches.
const stubFetch = () => {
  const calls: { url: string; method: string }[] = []
  const impl = vi.fn((url: string, options?: { method?: string }) => {
    calls.push({ url, method: options?.method ?? 'GET' })
    if (url.startsWith('/api/conflict_statuses')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(statuses) })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })
  })
  vi.stubGlobal('fetch', impl)
  return calls
}

const findCalendarEvent = async (): Promise<HTMLElement> => {
  let node: HTMLElement | null = null
  await waitFor(() => {
    node = document.querySelector<HTMLElement>('.fc-event')
    expect(node).toBeTruthy()
  })
  return node as unknown as HTMLElement
}

describe('ConflictTriage', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="csrf-token" content="test-token">'
    window.localStorage.clear()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('opens on the queue and asks only for what needs a decision', async () => {
    const calls = stubFetch()
    render(<ConflictTriage basePath="/admin/conflicts" />)

    await waitFor(() => {
      expect(calls.some(call => call.url.includes('status=Pending'))).toBe(true)
    })
  })

  it('shows no filter bar on the queue', async () => {
    stubFetch()
    render(<ConflictTriage basePath="/admin/conflicts" ensembles={['Battery']} />)

    await screen.findByText('Marcus Webb')

    expect(screen.queryByLabelText('Ensemble')).not.toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('shows the ensemble filter and the decided switch on the calendar', async () => {
    stubFetch()
    render(<ConflictTriage basePath="/admin/conflicts" ensembles={['Battery']} />)
    await screen.findByText('Marcus Webb')

    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }))

    expect(await screen.findByLabelText('Ensemble')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Show denied and resolved' })).toBeInTheDocument()
  })

  it('drops the pending-only scope when showing the calendar', async () => {
    const calls = stubFetch()
    render(<ConflictTriage basePath="/admin/conflicts" />)
    await screen.findByText('Marcus Webb')

    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }))

    await waitFor(() => {
      const gets = calls.filter(call => call.method === 'GET' && call.url.startsWith('/api/conflicts'))
      expect(gets[gets.length - 1].url).not.toContain('status=Pending')
    })
  })

  // Regression: decide() used to look the conflict up in the queue groups and
  // bail when it wasn't found. In calendar view the queue is empty, so
  // approving from the popover silently did nothing.
  it('saves a decision made from the calendar', async () => {
    const calls = stubFetch()
    render(<ConflictTriage basePath="/admin/conflicts" />)
    await screen.findByText('Marcus Webb')

    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }))
    await userEvent.click(await findCalendarEvent())

    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(calls.some(call => call.method === 'PUT' && call.url === '/api/conflicts/11')).toBe(true)
    })
  })

  // And the calendar has to refetch, or the event keeps its old colour.
  it('refreshes the calendar after a decision', async () => {
    const calls = stubFetch()
    render(<ConflictTriage basePath="/admin/conflicts" />)
    await screen.findByText('Marcus Webb')

    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }))
    const event = await findCalendarEvent()
    await userEvent.click(event)
    const approve = await screen.findByRole('button', { name: 'Approve' })

    // Counted here, after the view switch has settled, so the only GET that can
    // follow is the refetch the decision triggers.
    const before = calls.filter(call => call.method === 'GET').length
    await userEvent.click(approve)

    await waitFor(() => {
      expect(calls.filter(call => call.method === 'GET').length).toBeGreaterThan(before)
    })
  })

  it('remembers the chosen view', async () => {
    stubFetch()
    render(<ConflictTriage basePath="/admin/conflicts" />)
    await screen.findByText('Marcus Webb')

    await userEvent.click(screen.getByRole('radio', { name: 'Calendar' }))

    await waitFor(() => {
      expect(window.localStorage.getItem('capcity.conflicts.view')).toBe('calendar')
    })
  })
})
