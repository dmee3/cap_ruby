import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import DefaultSchedulesOverview from './DefaultSchedulesOverview'
import { ALL, overview } from './fixtures'

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="tok">'
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DefaultSchedulesOverview', () => {
  it('summarises a fully set-up season and totals each combination', () => {
    render(<DefaultSchedulesOverview data={overview()} />)

    expect(screen.getByText('8 of 8 set up · cover all 42 members · $1,700 to $2,500 per member')).toBeInTheDocument()
    const [desktop] = screen.getAllByRole('table')
    expect(within(desktop).getAllByText('$2,300').length).toBeGreaterThan(0)
    expect(within(desktop).getByRole('link', { name: 'Edit World · Music · Vet' })).toHaveAttribute(
      'href',
      '/admin/season/default-schedules/world-music-vet'
    )
    // Nothing is missing, so copying would create nothing.
    expect(screen.queryByText(/Copy from 2026 season/)).not.toBeInTheDocument()
  })

  it('leads an empty season with the people affected and offers to copy last season', () => {
    render(<DefaultSchedulesOverview data={overview(ALL)} />)

    expect(screen.getByRole('heading', { name: '42 members have no payment schedule' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Copy from 2026 season' })).toHaveAttribute(
      'href',
      '/admin/season/default-schedules/copy'
    )
    expect(screen.getByRole('link', { name: 'Start blank' })).toHaveAttribute(
      'href',
      '/admin/season/default-schedules/world-music-vet'
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('keeps missing combinations in the grid and names them in a banner', () => {
    render(<DefaultSchedulesOverview data={overview(['cc2-visual-vet', 'cc2-visual-rookie'])} />)

    expect(screen.getByText('CC2 · Visual has no 2027 defaults')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Copy the 2 missing from 2026' })).toBeInTheDocument()
    const [desktop] = screen.getAllByRole('table')
    expect(within(desktop).getByRole('link', { name: 'Set up CC2 · Visual · Vet' })).toBeInTheDocument()
  })

  it('fills empty schedules only after a confirming second click', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ filled: 42, still_empty: 0 }), { status: 200 })
    )
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })

    render(<DefaultSchedulesOverview data={overview([], 42)} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fill empty schedules' }))
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Fill 42 schedules' }))

    await waitFor(() => expect(reload).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/default-schedules/apply-to-empty', expect.anything())
  })
})
