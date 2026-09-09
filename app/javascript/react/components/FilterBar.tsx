import React from 'react'

export type PaymentScope = 'active' | 'with_deleted' | 'deleted_only'

export type PaymentFilters = {
  q: string
  typeId: string
  startDate: string
  endDate: string
  scope: PaymentScope
}

export const EMPTY_FILTERS: PaymentFilters = {
  q: '',
  typeId: '',
  startDate: '',
  endDate: '',
  scope: 'active',
}

type PaymentTypeOption = { id: number; name: string }

type FilterBarProps = {
  filters: PaymentFilters
  onChange: (next: PaymentFilters) => void
  paymentTypes: PaymentTypeOption[]
  /** Live result summary. */
  totalCount: number
  totalLabel: string
  deletedCount: number
  className?: string
}

const SCOPE_LABEL: Record<PaymentScope, string> = {
  active: 'Active only',
  with_deleted: 'Active + deleted',
  deleted_only: 'Deleted only',
}

const isDirty = (f: PaymentFilters) =>
  f.q !== '' || f.typeId !== '' || f.startDate !== '' || f.endDate !== '' || f.scope !== 'active'

const field =
  'h-9 rounded-sm border border-border-strong bg-surface px-2 text-body-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

// For /admin/payments (reusable by any admin table). Every control is a
// server-side param; the controller allowlists them (no interpolation).
const FilterBar = ({
  filters,
  onChange,
  paymentTypes,
  totalCount,
  totalLabel,
  deletedCount,
  className = '',
}: FilterBarProps) => {
  const set = <K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className={`flex flex-col gap-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-caption text-secondary">Search member name</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="e.g. Alvarez"
            className={`${field} w-52`}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-secondary">Type</span>
          <select
            value={filters.typeId}
            onChange={(e) => set('typeId', e.target.value)}
            className={field}
          >
            <option value="">All types</option>
            {paymentTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-secondary">From</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-secondary">To</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => set('endDate', e.target.value)}
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-caption text-secondary">Show</span>
          <select
            value={filters.scope}
            onChange={(e) => set('scope', e.target.value as PaymentScope)}
            className={field}
          >
            {(Object.keys(SCOPE_LABEL) as PaymentScope[]).map((s) => (
              <option key={s} value={s}>
                {SCOPE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>

        {isDirty(filters) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="h-9 text-body-sm font-medium text-accent-primary underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-body-sm text-secondary">
        <span className="font-medium text-primary">
          {totalCount} {totalCount === 1 ? 'payment' : 'payments'} · {totalLabel}
        </span>
        {deletedCount > 0 && filters.scope !== 'active' && <span>· {deletedCount} deleted</span>}
        <span className="basis-full text-caption">
          Deleted payments are excluded from every total on this page.
        </span>
      </div>
    </div>
  )
}

export default FilterBar
