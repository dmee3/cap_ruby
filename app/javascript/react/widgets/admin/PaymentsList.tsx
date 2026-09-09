import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FilterBar, { PaymentFilters, EMPTY_FILTERS } from '../../components/FilterBar'
import SortableTh, { SortDir } from '../../components/SortableTh'
import LoadMoreButton from '../../components/LoadMoreButton'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'
import { deletedRowClass, DeletedPill, RestoreAction } from '../../components/deletedRow'
import Utilities from '../../../utilities/utilities'

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
}

const PAGE = 20

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      })
    : '—'

const toParams = (filters: PaymentFilters, sort: string, dir: SortDir, offset: number) => {
  const p = new URLSearchParams({ sort, dir, limit: String(PAGE), offset: String(offset) })
  if (filters.q) p.set('q', filters.q)
  if (filters.typeId) p.set('type_id', filters.typeId)
  if (filters.startDate) p.set('start_date', filters.startDate)
  if (filters.endDate) p.set('end_date', filters.endDate)
  if (filters.scope !== 'active') p.set('scope', filters.scope)
  return p.toString()
}

const PaymentsList = ({ paymentTypes, justCreatedId }: PaymentsListProps) => {
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

  const restore = (id: number) => {
    setPendingRestore(id)
    fetch(`/admin/payments/restore/${id}`, {
      method: 'PUT',
      headers: { 'X-CSRF-Token': Utilities.getAuthToken() },
    })
      .then((r) => {
        if (!r.ok) throw r
        load(false)
      })
      .catch(() => setStatus('error'))
      .finally(() => setPendingRestore(null))
  }

  const undo = () => {
    if (justCreatedId == null) return
    setPendingRestore(justCreatedId)
    fetch(`/admin/payments/${justCreatedId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': Utilities.getAuthToken() },
    })
      .then((r) => {
        if (!r.ok) throw r
        setUndoDismissed(true)
        load(false)
      })
      .catch(() => setStatus('error'))
      .finally(() => setPendingRestore(null))
  }

  const totalLabel = useMemo(() => money(meta.total_cents), [meta.total_cents])

  return (
    <div className="flex flex-col gap-4">
      {justCreatedId != null && !undoDismissed && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border-default border-l-[3px] border-l-success-fg bg-surface p-3">
          <span className="text-body-sm text-primary">Payment recorded.</span>
          <button
            type="button"
            onClick={undo}
            disabled={pendingRestore === justCreatedId}
            className="text-body-sm font-semibold text-accent-primary disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      )}

      <FilterBar
        filters={filters}
        onChange={setFilters}
        paymentTypes={paymentTypes}
        totalCount={meta.total_count}
        totalLabel={totalLabel}
        deletedCount={meta.deleted_count}
      />

      {status === 'error' && (
        <EmptyState
          title="We couldn't load payments"
          body="Refresh, or try again in a minute."
        />
      )}

      {status === 'loading' && <Skeleton rows={6} />}

      {status === 'ready' && rows.length === 0 && (
        <EmptyState
          title="No payments match these filters"
          body="Clear a filter or widen the date range."
        />
      )}

      {status === 'ready' && rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-default">
                  <SortableTh sortKey="date_paid" label="Date" activeKey={sort} activeDir={dir} onSort={onSort} />
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
                  <th scope="col" className="px-4 py-2 text-label uppercase text-secondary">
                    Notes
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-label uppercase text-secondary">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border-default ${deletedRowClass(p.deleted)}`}
                  >
                    <td className="px-4 py-3 font-mono text-body-sm text-secondary">
                      {fmtDate(p.date_paid)}
                    </td>
                    <td className="px-4 py-3 text-body-sm">
                      <a href={`/admin/users/${p.user.id}`} className="font-semibold text-primary">
                        {p.user.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-secondary">
                      {p.deleted ? <DeletedPill /> : p.payment_type.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-body-sm font-semibold text-primary">
                      {money(p.amount_cents)}
                    </td>
                    <td className="max-w-[16rem] px-4 py-3 text-caption text-secondary">{p.notes}</td>
                    <td className="px-4 py-3 text-right">
                      {p.deleted && (
                        <RestoreAction onRestore={() => restore(p.id)} pending={pendingRestore === p.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map((p) => (
              <li
                key={p.id}
                className={`flex flex-col gap-1 rounded-md border border-border-default bg-surface p-3 ${deletedRowClass(
                  p.deleted,
                )}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <a href={`/admin/users/${p.user.id}`} className="text-body-sm font-semibold text-primary">
                    {p.user.name}
                  </a>
                  <span className="font-mono tabular-nums text-body-sm font-semibold text-primary">
                    {money(p.amount_cents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-caption text-secondary">
                  <span>
                    {fmtDate(p.date_paid)} · {p.deleted ? <DeletedPill /> : p.payment_type.name}
                  </span>
                  {p.deleted && (
                    <RestoreAction onRestore={() => restore(p.id)} pending={pendingRestore === p.id} />
                  )}
                </div>
                {p.notes && <p className="text-caption text-secondary">{p.notes}</p>}
              </li>
            ))}
          </ul>

          <LoadMoreButton
            increment={Math.min(PAGE, Math.max(meta.total_count - rows.length, 0))}
            totalCount={meta.total_count}
            hasMore={meta.has_more}
            onClick={() => load(true)}
          />
        </>
      )}
    </div>
  )
}

export default PaymentsList
