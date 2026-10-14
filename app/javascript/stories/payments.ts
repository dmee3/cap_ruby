import { http, HttpResponse, delay } from 'msw'

export const paymentTypes = [
  { id: 1, name: 'Stripe' },
  { id: 2, name: 'Venmo' },
  { id: 3, name: 'Cash' },
  { id: 4, name: 'Check' },
  { id: 5, name: 'Other' },
]

const names = [
  'Jordan Pike', 'Marcus Webb', 'Priya Natarajan', 'Jordan Ellis', 'Sam Okafor',
  'Riley Chen', 'Theo Marsh', 'Rae Quinn', 'Nina Park', 'Leo Brandt',
]

type Payment = {
  id: number
  amount_cents: number
  date_paid: string
  payment_type: { id: number; name: string }
  notes: string | null
  user: { id: number; name: string }
  deleted: boolean
}

export const seedPayments = (count = 34): Payment[] =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date('2026-02-14T12:00:00')
    d.setDate(d.getDate() - i * 3)
    return {
      id: 100 + i,
      amount_cents: [20_000, 25_000, 35_000, 10_000][i % 4],
      date_paid: d.toISOString().slice(0, 10),
      payment_type: paymentTypes[i % 4 === 0 ? 0 : i % 3 === 0 ? 2 : 1],
      notes: i % 5 === 0 ? 'Paid at rehearsal' : null,
      user: { id: (i % names.length) + 1, name: names[i % names.length] },
      deleted: i === 4,
    }
  })

/** /admin/payments.json with filters, sorting, paging and soft delete, over an in-memory copy. */
export const paymentHandlers = (seed: Payment[] = seedPayments()) => {
  let payments = seed.map((p) => ({ ...p }))

  return [
    http.get('/admin/payments.json', async ({ request }) => {
      await delay(250)
      const p = new URL(request.url).searchParams
      const scope = p.get('scope') ?? 'active'
      const q = p.get('q')?.toLowerCase()
      const typeId = p.get('type_id')
      const start = p.get('start_date')
      const end = p.get('end_date')
      const sort = p.get('sort') ?? 'date_paid'
      const dir = p.get('dir') === 'asc' ? 1 : -1
      const limit = Number(p.get('limit') ?? 20)
      const offset = Number(p.get('offset') ?? 0)

      const matching = payments
        .filter((x) => (scope === 'deleted' ? x.deleted : scope === 'all' ? true : !x.deleted))
        .filter((x) => !q || x.user.name.toLowerCase().includes(q))
        .filter((x) => !typeId || String(x.payment_type.id) === typeId)
        .filter((x) => (!start || x.date_paid >= start) && (!end || x.date_paid <= end))
        .sort((a, b) => {
          const key = (x: Payment) => (sort === 'amount' ? x.amount_cents : sort === 'name' ? x.user.name : x.date_paid)
          return key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0
        })

      const page = matching.slice(offset, offset + limit)
      return HttpResponse.json({
        payments: page,
        total_count: matching.length,
        total_cents: matching.reduce((sum, x) => sum + x.amount_cents, 0),
        deleted_count: payments.filter((x) => x.deleted).length,
        returned: page.length,
        has_more: offset + page.length < matching.length,
      })
    }),
    http.delete('/admin/payments/:id', ({ params }) => {
      payments = payments.map((x) => (x.id === Number(params.id) ? { ...x, deleted: true } : x))
      return HttpResponse.json({})
    }),
    http.put('/admin/payments/restore/:id', ({ params }) => {
      payments = payments.map((x) => (x.id === Number(params.id) ? { ...x, deleted: false } : x))
      return HttpResponse.json({})
    }),
  ]
}
