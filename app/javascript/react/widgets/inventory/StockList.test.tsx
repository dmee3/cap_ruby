import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import StockList from './StockList'
import { StockPayload } from './types'

const payload = (overrides: Partial<StockPayload> = {}): StockPayload => ({
  can_manage_alerts: true,
  last_change: { performed_on: '2026-03-07', user_name: 'Dana Reyes' },
  stats: { tracked: 3, under_alert: 1, out_of_stock: 1, no_alert: 1 },
  categories: [
    {
      id: 1,
      name: 'Sticks & Mallets',
      item_count: 2,
      items: [
        { id: 10, category_id: 1, name: 'Snare sticks', quantity: 42, status: 'ok', alert: null },
        {
          id: 11,
          category_id: 1,
          name: 'Keyboard mallets',
          quantity: 6,
          status: 'low',
          alert: { id: 5, operator: 'lt_eq', threshold: 8 },
        },
      ],
    },
    {
      id: 2,
      name: 'Uniforms',
      item_count: 1,
      items: [{ id: 12, category_id: 2, name: 'Gloves', quantity: 0, status: 'out', alert: null }],
    },
  ],
  ...overrides,
})

const mockFetch = (impl: (url: string, init?: RequestInit) => Promise<unknown>) => {
  vi.stubGlobal('fetch', vi.fn(impl as never))
}

const ok = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)

beforeEach(() => {
  document.body.innerHTML = '<meta name="csrf-token" content="test-token" />'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StockList', () => {
  it('groups items under their category with a count', async () => {
    mockFetch(() => ok(payload()))
    render(<StockList />)

    expect(await screen.findByText('Sticks & Mallets')).toBeInTheDocument()
    expect(screen.getByText('2 items')).toBeInTheDocument()
    expect(screen.getByText('Snare sticks')).toBeInTheDocument()
  })

  // Low is the item's own rule, printed where you act on it — not a universal
  // number the reader has to go look up.
  it('prints the threshold next to a low item', async () => {
    mockFetch(() => ok(payload()))
    render(<StockList />)

    expect(await screen.findByText(/at or below 8/)).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('says an item is out of stock in words, not only colour', async () => {
    mockFetch(() => ok(payload()))
    render(<StockList />)

    // Also a stat kicker, so scope to the row's own label.
    await screen.findByText('Gloves')
    const rowLabels = screen
      .getAllByText(/Out of stock/)
      .filter((el) => el.className.includes('text-danger-fg'))
    expect(rowLabels).toHaveLength(1)
  })

  it('sends the delta with the count it was based on', async () => {
    const calls: RequestInit[] = []
    mockFetch((url, init) => {
      if (init?.method === 'PUT') {
        calls.push(init)
        return ok({ quantity: 41 })
      }
      return ok(payload())
    })
    render(<StockList />)

    await screen.findByText('Snare sticks')
    await userEvent.click(screen.getByRole('button', { name: 'Remove one Snare sticks' }))
    await userEvent.click(screen.getByRole('button', { name: /^Save/ }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(JSON.parse(calls[0].body as string)).toEqual({
      item: { quantity: 41, previous_quantity: 42 },
    })
  })

  // Someone else's count landing mid-adjust must correct the row rather than
  // leave a number on screen that isn't in the database.
  it('resets the row to the real count when the write is refused', async () => {
    mockFetch((url, init) => {
      if (init?.method === 'PUT') {
        return Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({ errors: ["Someone else counted this. It's 38 now."], current_quantity: 38 }),
        } as Response)
      }
      return ok(payload())
    })
    render(<StockList />)

    await screen.findByText('Snare sticks')
    await userEvent.click(screen.getByRole('button', { name: 'Remove one Snare sticks' }))
    await userEvent.click(screen.getByRole('button', { name: /^Save/ }))

    expect(await screen.findByText('38')).toBeInTheDocument()
  })

  it('filters to what needs attention with a real checkbox', async () => {
    mockFetch(() => ok(payload()))
    render(<StockList />)

    await screen.findByText('Snare sticks')
    await userEvent.click(screen.getByRole('checkbox', { name: /Needs attention only/ }))

    expect(screen.queryByText('Snare sticks')).not.toBeInTheDocument()
    expect(screen.getByText('Keyboard mallets')).toBeInTheDocument()
    expect(screen.getByText('Gloves')).toBeInTheDocument()
  })

  it('offers a way back when the list will not load', async () => {
    mockFetch(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response))
    render(<StockList />)

    expect(await screen.findByText("We couldn't reach the inventory list.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('prompts for a first category when there are none', async () => {
    mockFetch(() =>
      ok(payload({ categories: [], stats: { tracked: 0, under_alert: 0, out_of_stock: 0, no_alert: 0 } })),
    )
    render(<StockList />)

    expect(await screen.findByText('No categories yet')).toBeInTheDocument()
  })

  it('names an empty category rather than leaving it blank', async () => {
    mockFetch(() =>
      ok(
        payload({
          categories: [{ id: 3, name: 'Hardware', item_count: 0, items: [] }],
        }),
      ),
    )
    render(<StockList />)

    expect(await screen.findByText('Nothing in Hardware yet')).toBeInTheDocument()
  })

  // A non-empty category can't be deleted, so the affordance only appears in
  // the one state the server accepts.
  describe('deleting a category', () => {
    const emptyOnly = () =>
      payload({ categories: [{ id: 3, name: 'Hardware', item_count: 0, items: [] }] })

    it('offers delete only on an empty category', async () => {
      mockFetch(() => ok(emptyOnly()))
      render(<StockList />)

      expect(await screen.findByRole('button', { name: 'Delete category' })).toBeInTheDocument()
    })

    it('does not offer it on a category holding items', async () => {
      mockFetch(() => ok(payload()))
      render(<StockList />)

      await screen.findByText('Snare sticks')
      expect(screen.queryByRole('button', { name: 'Delete category' })).not.toBeInTheDocument()
    })

    it('asks first', async () => {
      mockFetch(() => ok(emptyOnly()))
      render(<StockList />)

      await userEvent.click(await screen.findByRole('button', { name: 'Delete category' }))

      expect(screen.getByText(/It's empty, so nothing else goes with it/)).toBeInTheDocument()
    })
  })
})
