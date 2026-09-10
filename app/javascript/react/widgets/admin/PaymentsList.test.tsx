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

const setup = (props = {}) =>
  render(
    <PaymentsList paymentTypes={types} justCreatedId={null} seasonLabel="2026 season" {...props} />,
  )

describe('PaymentsList', () => {
  it('loads and renders a payment row in whole dollars', async () => {
    setup()
    expect((await screen.findAllByText('Rae Quinn'))[0]).toBeInTheDocument()
    expect(screen.getAllByText('$250')[0]).toBeInTheDocument()
    expect(screen.queryByText('$250.00')).not.toBeInTheDocument()
  })

  it('refetches with sort params when a header is clicked', async () => {
    setup()
    await screen.findAllByText('Rae Quinn')

    await userEvent.click(screen.getByRole('button', { name: /Amount/ }))

    await waitFor(() => {
      const urls = fetchCalls().map((c) => c[0])
      expect(urls.some((u) => u.includes('sort=amount') && u.includes('dir=asc'))).toBe(true)
    })
  })

  it('refetches with the search param from the filter bar', async () => {
    setup()
    await screen.findAllByText('Rae Quinn')

    await userEvent.type(screen.getByPlaceholderText('Search member name'), 'Quinn')

    await waitFor(() => {
      const urls = fetchCalls().map((c) => c[0])
      expect(urls.some((u) => u.includes('q=Quinn'))).toBe(true)
    })
  })

  it('offers Edit and Delete on a manual payment', async () => {
    setup()
    await screen.findAllByText('Rae Quinn')

    expect(screen.getAllByRole('link', { name: 'Edit' })[0]).toHaveAttribute(
      'href',
      '/admin/payments/1/edit',
    )
    expect(screen.getAllByRole('button', { name: 'Delete' })[0]).toBeInTheDocument()
  })

  it('confirms before deleting, and only then fires the request', async () => {
    setup()
    await screen.findAllByText('Rae Quinn')

    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(
      fetchCalls().some(([, opts]) => opts?.method === 'DELETE'),
      'no request before confirming',
    ).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'Yes' }))
    await waitFor(() => {
      expect(
        fetchCalls().some(([url, opts]) => url === '/admin/payments/1' && opts?.method === 'DELETE'),
      ).toBe(true)
    })
  })

  it('backs out of the delete confirm without firing anything', async () => {
    setup()
    await screen.findAllByText('Rae Quinn')

    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    await userEvent.click(screen.getByRole('button', { name: 'No' }))

    expect(screen.getAllByRole('button', { name: 'Delete' })[0]).toBeInTheDocument()
    expect(fetchCalls().some(([, opts]) => opts?.method === 'DELETE')).toBe(false)
  })

  it('shows a non-interactive source label instead of Edit/Delete on Stripe rows', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      okResponse({ payments: [row({ payment_type: { id: 9, name: 'Stripe' } })], ...meta }),
    )
    setup()
    await screen.findAllByText('Rae Quinn')

    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('shows the Undo bar and DELETEs the just-created payment', async () => {
    setup({ justCreatedId: 42 })
    await screen.findAllByText('Rae Quinn')

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))

    await waitFor(() => {
      expect(
        fetchCalls().some(([url, opts]) => url === '/admin/payments/42' && opts?.method === 'DELETE'),
      ).toBe(true)
    })
  })

  it('renders a deleted row with a Restore action and keeps its notes readable', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      okResponse({ payments: [row({ deleted: true })], ...meta, deleted_count: 1 }),
    )
    setup()

    expect((await screen.findAllByText('Deleted'))[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Restore' })[0]).toBeInTheDocument()
    // the note is why the row is worth showing — it must not be struck out
    screen.getAllByText('Rehearsal weekend').forEach((note) => {
      expect(note.className).not.toMatch(/line-through/)
    })
  })

  it('shows a retryable error state', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ ok: false } as Response),
    )
    setup()
    expect(await screen.findByText("Couldn't load payments")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('distinguishes a filtered-empty result from an empty season', async () => {
    ;(fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(() =>
      okResponse({ payments: [], total_count: 0, total_cents: 0, deleted_count: 0, returned: 0, has_more: false }),
    )
    setup()

    // nothing filtered yet → the season is simply empty
    expect(await screen.findByText('No payments recorded yet')).toBeInTheDocument()
    expect(screen.getByText(/2026 season hasn't taken any money in/)).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText('Search member name'), 'zzz')

    expect(await screen.findByText('No payments match these filters')).toBeInTheDocument()
    // one in the filter bar, one in the empty state
    expect(screen.getAllByRole('button', { name: 'Clear filters' })).toHaveLength(2)
  })
})
