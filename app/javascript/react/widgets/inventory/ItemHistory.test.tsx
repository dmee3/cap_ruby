import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ItemHistory, { ItemHistoryPayload } from './ItemHistory'

const payload = (overrides: Partial<ItemHistoryPayload> = {}): ItemHistoryPayload => ({
  item: { id: 1, category_id: 2, category_name: 'Sticks & Mallets', name: 'Snare sticks', quantity: 42 },
  alert: null,
  can_manage_alerts: true,
  entries: [
    { id: 3, change: 24, previous_quantity: 18, performed_on: '2026-03-07', user_name: 'Dana Reyes' },
    { id: 2, change: -6, previous_quantity: 24, performed_on: '2026-03-03', user_name: 'Marcus Webb' },
    { id: 1, change: 24, previous_quantity: 0, performed_on: '2026-02-14', user_name: 'Dana Reyes' },
  ],
  ...overrides,
})

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="t" />'
})

describe('ItemHistory', () => {
  it('leads with the item and what is on hand', () => {
    render(<ItemHistory payload={payload()} />)

    expect(screen.getByRole('heading', { name: 'Snare sticks' })).toBeInTheDocument()
    // 42 also ends the newest row's before→after run, so find the headline one.
    expect(screen.getByText('On hand').parentElement).toHaveTextContent('42')
  })

  // The four years of attribution the app stored and never showed.
  it('names everyone who changed the count', () => {
    render(<ItemHistory payload={payload()} />)

    expect(screen.getAllByText('Dana Reyes').length).toBeGreaterThan(0)
    expect(screen.getByText('Marcus Webb')).toBeInTheDocument()
    expect(screen.getByText(/3 changes/)).toBeInTheDocument()
  })

  it('describes the rule watching the item', () => {
    render(
      <ItemHistory
        payload={payload({
          alert: { id: 9, operator: 'lt_eq', threshold: 8, user_name: 'Dana Reyes' },
        })}
      />,
    )

    expect(screen.getByText(/is at or below 8/)).toBeInTheDocument()
  })

  it('says plainly when nothing is watching', () => {
    render(<ItemHistory payload={payload()} />)

    expect(screen.getByText(/No alert set/)).toBeInTheDocument()
  })

  // A quartermaster member sees the threshold but cannot reach that screen.
  it('withholds the alert links from someone who cannot manage them', () => {
    render(<ItemHistory payload={payload({ can_manage_alerts: false })} />)

    expect(screen.queryByRole('link', { name: /Tell us when to warn you/ })).not.toBeInTheDocument()
  })

  it('explains an empty trail rather than showing a bare list', () => {
    render(<ItemHistory payload={payload({ entries: [] })} />)

    expect(screen.getByText('Nothing has changed yet')).toBeInTheDocument()
  })

  it('says where the count started', () => {
    render(<ItemHistory payload={payload()} />)

    expect(screen.getByText(/started at 24 when Dana Reyes added it/)).toBeInTheDocument()
  })

  // Counting and destroying are different jobs, so delete asks first and sits
  // at the bottom of the item's own page rather than beside a stepper.
  describe('deleting', () => {
    it('asks before it deletes, and says the history survives', async () => {
      render(<ItemHistory payload={payload()} />)

      await userEvent.click(screen.getByRole('button', { name: /Delete Snare sticks/ }))

      expect(screen.getByText(/3 recorded changes stay/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete item' })).toBeInTheDocument()
    })

    it('backs out without calling anything', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)
      render(<ItemHistory payload={payload()} />)

      await userEvent.click(screen.getByRole('button', { name: /Delete Snare sticks/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Keep it' }))

      expect(fetchSpy).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: /Delete Snare sticks/ })).toBeInTheDocument()
      vi.unstubAllGlobals()
    })

    it('says so when the delete fails rather than looking like it worked', async () => {
      vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false } as Response)))
      render(<ItemHistory payload={payload()} />)

      await userEvent.click(screen.getByRole('button', { name: /Delete Snare sticks/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Delete item' }))

      expect(await screen.findByText(/Couldn't delete Snare sticks/)).toBeInTheDocument()
      vi.unstubAllGlobals()
    })
  })
})
