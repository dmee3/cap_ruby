import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import EditDefault from './EditDefault'
import { overview } from './fixtures'

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="tok">'
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('EditDefault', () => {
  it('lists the payments with a running total and says saving moves nobody', () => {
    render(<EditDefault data={{ overview: overview(), slug: 'world-music-vet' }} />)

    expect(screen.getByRole('heading', { level: 1, name: 'World · Music · Vet, 2027' })).toBeInTheDocument()
    expect(screen.getByText('Default for 11 members · last changed 9/28/26')).toBeInTheDocument()
    expect(screen.getByText('Saving changes the default only')).toBeInTheDocument()
    expect(screen.getByText('Total · 6 payments').parentElement).toHaveTextContent('$2,300')
  })

  it('adds a payment four weeks after the last, at the same amount, and totals it', async () => {
    render(<EditDefault data={{ overview: overview(), slug: 'world-music-vet' }} />)

    await userEvent.click(screen.getByRole('button', { name: '+ Add payment' }))

    expect(screen.getByLabelText('Due date for payment 7')).toHaveValue('2027-04-02')
    expect(screen.getByText('Total · 7 payments').parentElement).toHaveTextContent('$2,660')
  })

  it("sends cents and puts the server's per-row errors beside the right payment", async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ errors: [{ index: 4, message: 'Enter an amount over $0, or remove this payment.' }] }),
        { status: 422 }
      )
    )
    render(<EditDefault data={{ overview: overview(), slug: 'world-music-vet' }} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save default' }))

    await waitFor(() => expect(screen.getByText("This default wasn't saved. One thing needs fixing")).toBeInTheDocument())
    expect(screen.getByText(/Payment 5: Enter an amount over \$0/)).toBeInTheDocument()
    // And again under the row itself.
    expect(screen.getByText('Enter an amount over $0, or remove this payment.')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/admin/default-schedules/world-music-vet')
    expect(JSON.parse(init!.body as string).entries[1]).toEqual({ pay_date: '2026-11-13', amount_cents: 36_000 })
  })

  it('goes back to the overview once the default saves', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    render(<EditDefault data={{ overview: overview(), slug: 'world-music-vet' }} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save default' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/season/default-schedules'))
  })

  it('goes back to the overview once the default saves', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    render(<EditDefault data={{ overview: overview(), slug: 'world-music-vet' }} />)

    await userEvent.click(screen.getByRole('button', { name: 'Save default' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/admin/season/default-schedules'))
  })

  it('skips the "members keep their schedules" note for a default nobody is on', () => {
    const data = overview()
    data.combinations[0].member_count = 0
    render(<EditDefault data={{ overview: data, slug: 'world-music-vet' }} />)

    expect(screen.queryByText('Saving changes the default only')).not.toBeInTheDocument()
  })

  it('offers to add the first payment to a default that is not set up', () => {
    render(<EditDefault data={{ overview: overview(['cc2-visual-vet']), slug: 'cc2-visual-vet' }} />)

    expect(screen.getByText('No payments yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Add first payment' })).toBeInTheDocument()
    expect(screen.getByText('Default for 3 members · not set up yet')).toBeInTheDocument()
  })
})
