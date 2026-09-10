import React, { useCallback, useEffect, useRef, useState } from 'react'
import FilterBar, { PaymentFilters, EMPTY_FILTERS, isDirty } from '../../components/FilterBar'
import SortableTh, { SortDir } from '../../components/SortableTh'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import Pill, { PillTone } from '../../components/Pill'
import { DeletedPill, RestoreAction } from '../../components/deletedRow'
import Utilities from '../../../utilities/utilities'
import { dollars } from '../../../utilities/money'

type PaymentTypeOption = { id: number; name: string }

type PaymentRowData = {
  id: number
  amount_cents: number
  date_paid: string
  payment_type: { id: number; name: string }
  notes: string | null
  user: { id: number; name: string }
  deleted: boolean
}

type ApiResponse = {
  payments: PaymentRowData[]
  total_count: number
  total_cents: number
  deleted_count: number
  returned: number
  has_more: boolean
}

type PaymentsListProps = {
  paymentTypes: PaymentTypeOption[]
  /** Id of a payment created on the previous request — shows the Undo bar. */
  justCreatedId: number | null
  seasonLabel: string
}

const PAGE = 20

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      })
    : '—'

/** Stripe rows are machine-created; they have no manual edit/delete path. */
const isStripe = (name: string) => name === 'Stripe' || name.startsWith('Square')

const TYPE_TONE: Record<string, PillTone> = { Cash: 'success', Stripe: 'neutral' }
const typeTone = (name: string): PillTone => TYPE_TONE[name] ?? 'neutral'

const toParams = (filters: PaymentFilters, sort: string, dir: SortDir, offset: number) => {
  const p = new URLSearchParams({ sort, dir, limit: String(PAGE), offset: String(offset) })
  if (filters.q) p.set('q', filters.q)
  if (filters.typeId) p.set('type_id', filters.typeId)
  if (filters.startDate) p.set('start_date', filters.startDate)
  if (filters.endDate) p.set('end_date', filters.endDate)
  if (filters.scope !== 'active') p.set('scope', filters.scope)
  return p.toString()
}

/** Echoes the live filters back so an empty result explains itself. */
const emptyFilteredBody = (f: PaymentFilters, types: PaymentTypeOption[]) => {
  const bits: string[] = []
  if (f.startDate || f.endDate) {
    bits.push(`from ${f.startDate ? fmtDate(f.startDate) : 'the start'} – ${f.endDate ? fmtDate(f.endDate) : 'today'}`)
  }
  if (f.q) bits.push(`for “${f.q}”`)
  const type = types.find((t) => String(t.id) === f.typeId)
  if (type) bits.push(`as ${type.name}`)
  const what = bits.length > 0 ? `Nothing ${bits.join(' ')}.` : 'Nothing matches those filters.'
  return `${what} Widen the date range or clear the type filter.`
}

const PaymentsList = ({ paymentTypes, justCreatedId, seasonLabel }: PaymentsListProps) => {
  const [filters, setFilters] = useState<PaymentFilters>(EMPTY_FILTERS)
  const [sort, setSort] = useState('date_paid')
  const [dir, setDir] = useState<SortDir>('desc')
  const [rows, setRows] = useState<PaymentRowData[]>([])
  const [meta, setMeta] = useState<Omit<ApiResponse, 'payments'>>({
    total_count: 0,
    total_cents: 0,
    deleted_count: 0,
    returned: 0,
    has_more: false,
  })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [pendingRestore, setPendingRestore] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [undoDismissed, setUndoDismissed] = useState(false)
  const offsetRef = useRef(0)

  const load = useCallback(
    (append: boolean) => {
      const offset = append ? offsetRef.current : 0
      if (!append) setStatus('loading')
      fetch(`/admin/payments.json?${toParams(filters, sort, dir, offset)}`, {
        headers: { Accept: 'application/json' },
      })
        .then((r) => {
          if (!r.ok) throw r
          return r.json() as Promise<ApiResponse>
        })
        .then((data) => {
          offsetRef.current = offset + data.returned
          setRows((prev) => (append ? [...prev, ...data.payments] : data.payments))
          setMeta({
            total_count: data.total_count,
            total_cents: data.total_cents,
            deleted_count: data.deleted_count,
            returned: data.returned,
            has_more: data.has_more,
          })
          setStatus('ready')
        })
        .catch(() => setStatus('error'))
    },
    [filters, sort, dir],
  )

  useEffect(() => {
    load(false)
  }, [load])

  const onSort = (key: string, nextDir: SortDir) => {
    setSort(key)
    setDir(nextDir)
  }

  const mutate = (url: string, method: 'PUT' | 'DELETE', id: number, after: () => void) => {
    setPendingRestore(id)
    fetch(url, { method, headers: { 'X-CSRF-Token': Utilities.getAuthToken() } })
      .then((r) => {
        if (!r.ok) throw r
        after()
      })
      .catch(() => setStatus('error'))
      .finally(() => setPendingRestore(null))
  }

  const restore = (id: number) =>
    mutate(`/admin/payments/restore/${id}`, 'PUT', id, () => load(false))

  const destroy = (id: number) =>
    mutate(`/admin/payments/${id}`, 'DELETE', id, () => {
      setConfirmDelete(null)
      load(false)
    })

  const undo = () => {
    if (justCreatedId == null) return
    mutate(`/admin/payments/${justCreatedId}`, 'DELETE', justCreatedId, () => {
      setUndoDismissed(true)
      load(false)
    })
  }

  const showingAll = !meta.has_more
  const caption = `Showing ${rows.length} of ${meta.total_count} matching ${
    meta.total_count === 1 ? 'payment' : 'payments'
  }`

  const actionsFor = (p: PaymentRowData) => {
    if (p.deleted) {
      return <RestoreAction onRestore={() => restore(p.id)} pending={pendingRestore === p.id} />
    }
    if (isStripe(p.payment_type.name)) {
      return <span className="text-body-sm text-secondary">{p.payment_type.name}</span>
    }
    // Confirm in place rather than in a modal — the row stays visible, which
    // is the whole check you want before deleting a specific payment.
    if (confirmDelete === p.id) {
      return (
        <span className="flex items-baseline justify-end gap-2 text-body-sm">
          <span className="text-secondary">Delete?</span>
          <button
            type="button"
            onClick={() => destroy(p.id)}
            disabled={pendingRestore === p.id}
            className="font-semibold text-danger-fg underline disabled:opacity-50"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(null)}
            className="font-medium text-secondary underline"
          >
            No
          </button>
        </span>
      )
    }

    return (
      <span className="flex justify-end gap-2.5 text-body-sm font-medium">
        <a href={`/admin/payments/${p.id}/edit`} className="text-accent-primary underline">
          Edit
        </a>
        <button
          type="button"
          onClick={() => setConfirmDelete(p.id)}
          className="text-danger-fg underline"
        >
          Delete
        </button>
      </span>
    )
  }

  const body = () => {
    if (status === 'loading') {
      return (
        <tbody>
          {Array.from({ length: 4 }).map((_, i) => (
            <tr key={i} className="border-b border-border-default">
              <td colSpan={6} className="px-4 py-3.5">
                <span className="flex items-center gap-3" aria-hidden="true">
                  <span className="h-3.5 w-16 rounded-sm bg-sunken" />
                  <span className="h-3.5 flex-1 animate-pulse rounded-sm bg-sunken" />
                  <span className="h-3.5 w-12 rounded-sm bg-sunken" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      )
    }

    return (
      <tbody>
        {rows.map((p) => {
          const struck = p.deleted ? 'line-through' : ''
          return (
            <tr
              key={p.id}
              className={`border-b border-border-default ${p.deleted ? 'bg-sunken text-secondary' : ''}`}
            >
              <td className={`px-4 py-3 font-mono text-body-sm text-secondary ${struck}`}>
                {fmtDate(p.date_paid)}
              </td>
              <td className="px-4 py-3 text-body-sm">
                <span className="flex flex-col items-start gap-0.5">
                  <a
                    href={`/admin/users/${p.user.id}`}
                    className={`font-semibold text-accent-primary ${struck}`}
                  >
                    {p.user.name}
                  </a>
                  {p.deleted && <DeletedPill />}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={struck}>
                  <Pill tone={typeTone(p.payment_type.name)}>{p.payment_type.name}</Pill>
                </span>
              </td>
              <td
                className={`px-4 py-3 text-right font-mono text-body-sm font-semibold text-primary ${struck}`}
              >
                {dollars(p.amount_cents)}
              </td>
              <td className="px-4 py-3 text-body-sm text-secondary [text-wrap:pretty]">
                {p.notes || '–'}
              </td>
              <td className="px-4 py-3 text-right">{actionsFor(p)}</td>
            </tr>
          )
        })}
      </tbody>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {justCreatedId != null && !undoDismissed && (
        <div className="flex overflow-hidden rounded-md border border-border-default bg-surface">
          <span className="w-[3px] shrink-0 bg-success-fg" aria-hidden="true" />
          <div className="flex flex-1 items-start gap-3 px-4 py-3.5">
            <span className="flex-1 text-body-sm font-semibold text-primary">Payment recorded.</span>
            <button
              type="button"
              onClick={undo}
              disabled={pendingRestore === justCreatedId}
              className="text-body-sm font-semibold text-accent-primary underline underline-offset-2 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setUndoDismissed(true)}
              aria-label="Dismiss"
              className="text-body-sm text-secondary hover:text-primary"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        paymentTypes={paymentTypes}
        totalCount={meta.total_count}
        totalLabel={dollars(meta.total_cents)}
        deletedCount={meta.deleted_count}
      />

      <Card variant="list">
        {status === 'error' && (
          <EmptyState
            tone="danger"
            title="Couldn't load payments"
            body="Your filters are still set. Retrying keeps them."
            action={
              <button
                type="button"
                onClick={() => load(false)}
                className="h-[34px] rounded-sm border border-border-strong bg-surface px-3.5 text-body-sm font-semibold text-primary hover:border-accent-primary"
              >
                Try again
              </button>
            }
          />
        )}

        {status === 'ready' && rows.length === 0 && isDirty(filters) && (
          <EmptyState
            title="No payments match these filters"
            body={emptyFilteredBody(filters, paymentTypes)}
            action={
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="h-[34px] rounded-sm border border-border-strong bg-surface px-3.5 text-body-sm font-semibold text-primary hover:border-accent-primary"
              >
                Clear filters
              </button>
            }
          />
        )}

        {status === 'ready' && rows.length === 0 && !isDirty(filters) && (
          <EmptyState
            title="No payments recorded yet"
            body={`${seasonLabel} hasn't taken any money in. Stripe payments land here automatically; anything paid in person you enter yourself.`}
            action={
              <a
                href="/admin/payments/new"
                className="inline-flex h-9 items-center rounded-sm bg-accent-primary px-3.5 text-body-sm font-semibold text-on-brand no-underline"
              >
                Add manual payment
              </a>
            }
          />
        )}

        {(status === 'loading' || rows.length > 0) && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-[118px]" />
                  <col />
                  <col className="w-[110px]" />
                  <col className="w-[100px]" />
                  <col className="w-[1.5fr]" />
                  <col className="w-[118px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border-default bg-sunken">
                    <SortableTh sortKey="date_paid" label="Date paid" activeKey={sort} activeDir={dir} onSort={onSort} />
                    <SortableTh sortKey="member" label="Member" activeKey={sort} activeDir={dir} onSort={onSort} />
                    <SortableTh sortKey="type" label="Type" activeKey={sort} activeDir={dir} onSort={onSort} />
                    <SortableTh
                      sortKey="amount"
                      label="Amount"
                      activeKey={sort}
                      activeDir={dir}
                      onSort={onSort}
                      align="right"
                    />
                    <th scope="col" className="px-4 py-2.5 text-left text-label uppercase text-secondary">
                      Notes
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-label uppercase text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                {body()}
              </table>
            </div>

            {/* Tablet + mobile card list */}
            <ul className="flex flex-col lg:hidden">
              {rows.map((p) => (
                <li
                  key={p.id}
                  className={`flex flex-col gap-2.5 border-b border-border-default p-3.5 ${
                    p.deleted ? 'bg-sunken text-secondary' : ''
                  }`}
                >
                  <div className="flex items-baseline gap-3">
                    <a
                      href={`/admin/users/${p.user.id}`}
                      className={`flex-1 text-h3 text-accent-primary ${p.deleted ? 'line-through' : ''}`}
                    >
                      {p.user.name}
                    </a>
                    <span
                      className={`font-mono text-h3 text-primary ${p.deleted ? 'line-through' : ''}`}
                    >
                      {dollars(p.amount_cents)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={typeTone(p.payment_type.name)}>{p.payment_type.name}</Pill>
                    <span className="font-mono text-body-sm text-secondary">{fmtDate(p.date_paid)}</span>
                    {p.deleted && <DeletedPill />}
                  </div>
                  {p.notes && <p className="text-body-sm text-secondary">{p.notes}</p>}
                  <div className="flex gap-2 border-t border-border-default pt-2.5">
                    {p.deleted ? (
                      <button
                        type="button"
                        onClick={() => restore(p.id)}
                        disabled={pendingRestore === p.id}
                        className="h-11 flex-1 rounded-sm border border-border-strong text-body-sm font-semibold text-accent-primary disabled:opacity-50"
                      >
                        Restore
                      </button>
                    ) : isStripe(p.payment_type.name) ? (
                      <span className="text-body-sm text-secondary">
                        Recorded by {p.payment_type.name}
                      </span>
                    ) : confirmDelete === p.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => destroy(p.id)}
                          disabled={pendingRestore === p.id}
                          className="h-11 flex-1 rounded-sm border border-danger-fg text-body-sm font-semibold text-danger-fg disabled:opacity-50"
                        >
                          Delete for real
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="h-11 flex-1 rounded-sm border border-border-strong text-body-sm font-semibold text-secondary"
                        >
                          Keep it
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={`/admin/payments/${p.id}/edit`}
                          className="flex h-11 flex-1 items-center justify-center rounded-sm border border-border-strong text-body-sm font-semibold text-accent-primary no-underline"
                        >
                          Edit
                        </a>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(p.id)}
                          className="h-11 flex-1 rounded-sm border border-border-strong text-body-sm font-semibold text-danger-fg"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="text-body-sm text-secondary">{caption}</span>
              <button
                type="button"
                onClick={() => load(true)}
                disabled={showingAll}
                className="ml-auto h-[34px] shrink-0 rounded-sm border border-border-strong bg-surface px-3 text-body-sm font-semibold text-primary transition hover:enabled:border-accent-primary disabled:cursor-not-allowed disabled:text-secondary"
              >
                {showingAll ? 'Load more' : `Load ${Math.min(PAGE, meta.total_count - rows.length)} more`}
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

export default PaymentsList
