import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TriageDashboard from './TriageDashboard'

const statuses = [
  { id: 1, name: 'Pending' },
  { id: 2, name: 'Approved' },
  { id: 3, name: 'Denied' },
]

const baseProps = {
  statuses,
  queuePath: '/coordinators/conflicts',
  newPath: '/coordinators/conflicts/new',
}

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

const stubFetch = (conflicts: unknown[] = [conflict]) => {
  const calls: { url: string; method: string }[] = []
  const impl = vi.fn((url: string, options?: { method?: string }) => {
    calls.push({ url, method: options?.method ?? 'GET' })
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ conflicts }) })
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

describe('TriageDashboard', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="csrf-token" content="test-token">'
  })

  afterEach(() => vi.unstubAllGlobals())

  it('states the backlog and names the oldest', async () => {
    stubFetch([])
    render(
      <TriageDashboard
        {...baseProps}
        pendingCount={5}
        oldestMember="Elena Sokol"
        oldestWaitingDays={40}
      />
    )

    expect(screen.getByText('5 conflicts')).toBeInTheDocument()
    expect(screen.getByText(/Elena Sokol, waiting 40 days/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the queue' })).toHaveAttribute(
      'href',
      '/coordinators/conflicts'
    )
  })

  it('reads as a win when caught up', async () => {
    stubFetch([])
    render(<TriageDashboard {...baseProps} pendingCount={0} />)

    expect(screen.getByText('Nothing')).toBeInTheDocument()
    expect(screen.getByText(/You're caught up/)).toBeInTheDocument()
    // btn-gray is the app's secondary button; btn-secondary doesn't exist as
    // a class, and rendered as plain text rather than a button.
    expect(screen.getByRole('link', { name: 'See all season' })).toHaveClass('btn-gray')
  })

  it('asks for every conflict in the season, unscoped', async () => {
    const calls = stubFetch([])
    render(<TriageDashboard {...baseProps} pendingCount={0} />)

    await waitFor(() => {
      expect(calls.some(call => call.url === '/api/conflicts')).toBe(true)
    })
  })

  it('shows every status on the calendar, not just pending and approved', async () => {
    stubFetch([])
    render(<TriageDashboard {...baseProps} pendingCount={0} />)

    // No conflicts fall in this range is the unscoped empty state; the
    // pending/approved-only one names denied and resolved as hidden.
    expect(await screen.findByText('No conflicts fall in this range.')).toBeInTheDocument()
  })

  it('decides a conflict from the calendar', async () => {
    const calls = stubFetch()
    render(<TriageDashboard {...baseProps} pendingCount={1} />)

    await userEvent.click(await findCalendarEvent())
    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(
        calls.some(call => call.method === 'PUT' && call.url === '/api/conflicts/11')
      ).toBe(true)
    })
  })

  it('refreshes the calendar after a decision', async () => {
    const calls = stubFetch()
    render(<TriageDashboard {...baseProps} pendingCount={1} />)

    const event = await findCalendarEvent()
    await userEvent.click(event)
    const approve = await screen.findByRole('button', { name: 'Approve' })

    const before = calls.filter(call => call.method === 'GET').length
    await userEvent.click(approve)

    await waitFor(() => {
      expect(calls.filter(call => call.method === 'GET').length).toBeGreaterThan(before)
    })
  })
})
