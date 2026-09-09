import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PaymentsList from './PaymentsList'

const row = (over = {}) => ({
  id: 1,
  amount_cents: 25_000,
  date_paid: '2026-02-10',
  payment_type: { id: 3, name: 'Cash' },
  notes: 'Rehearsal weekend',
  user: { id: 9, name: 'Rae Quinn' },
  deleted: false,
  ...over,
})

const okResponse = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) } as Response)

const meta = { total_count: 1, total_cents: 25_000, deleted_count: 0, returned: 1, has_more: false }

const fetchCalls = () =>
  (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit?][]

beforeEach(() => {
  document.head.innerHTML = '<meta name="csrf-token" content="tok">'
  vi.stubGlobal(
    'fetch',
    vi.fn(() => okResponse({ payments: [row()], ...meta })),
  )
})

afterEach(() => vi.unstubAllGlobals())

const types = [
  { id: 3, name: 'Cash' },
  { id: 4, name: 'Venmo' },
]

describe('PaymentsList', () => {
  it('loads and renders a payment row', async () => {
    render(<PaymentsList paymentTypes={types} justCreatedId={null} />)
    expect((await screen.findAllByText('Rae Quinn'))[0]).toBeInTheDocument()
    expect(screen.getAllByText('$250.00')[0]).toBeInTheDocument()
  })

  it('refetches with sort params when a header is clicked', async () => {
    render(<PaymentsList paymentTypes={types} justCreatedId={null} />)
    await screen.findAllByText('Rae Quinn')

    await userEvent.click(screen.getByRole('button', { name: /Amount/ }))

    await waitFor(() => {
      const urls = fetchCalls().map((c) => c[0])
      expect(urls.some((u) => u.includes('sort=amount') && u.includes('dir=asc'))).toBe(true)
    })
  })

  it('refetches with the search param from the filter bar', async () => {
    render(<PaymentsList paymentTypes={types} justCreatedId={null} />)
    await screen.findAllByText('Rae Quinn')

    await userEvent.type(screen.getByPlaceholderText('e.g. Alvarez'), 'Quinn')

    await waitFor(() => {
      const urls = fetchCalls().map((c) => c[0])
      expect(urls.some((u) => u.includes('q=Quinn'))).toBe(true)
    })
  })

  it('shows the Undo bar and DELETEs the just-created payment', async () => {
    render(<PaymentsList paymentTypes={types} justCreatedId={42} />)
    await screen.findAllByText('Rae Quinn')

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))

    await waitFor(() => {
      expect(
        fetchCalls().some(([url, opts]) => url === '/admin/payments/42' && opts?.method === 'DELETE'),
      ).toBe(true)
    })
  })

  it('renders a deleted row with a Restore action', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      okResponse({ payments: [row({ deleted: true })], ...meta, deleted_count: 1 }),
    )
    render(<PaymentsList paymentTypes={types} justCreatedId={null} />)

    expect((await screen.findAllByText('Deleted'))[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Restore' })[0]).toBeInTheDocument()
  })

  it('shows the error state when the fetch fails', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ ok: false } as Response),
    )
    render(<PaymentsList paymentTypes={types} justCreatedId={null} />)
    expect(await screen.findByText("We couldn't load payments")).toBeInTheDocument()
  })

  it('shows a filtered-empty state when the list comes back empty', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      okResponse({ payments: [], total_count: 0, total_cents: 0, deleted_count: 0, returned: 0, has_more: false }),
    )
    render(<PaymentsList paymentTypes={types} justCreatedId={null} />)
    expect(await screen.findByText('No payments match these filters')).toBeInTheDocument()
  })
})
