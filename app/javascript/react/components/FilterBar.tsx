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

export const isDirty = (f: PaymentFilters) =>
  f.q !== '' || f.typeId !== '' || f.startDate !== '' || f.endDate !== '' || f.scope !== 'active'

type PaymentTypeOption = { id: number; name: string }

type FilterBarProps = {
  filters: PaymentFilters
  onChange: (next: PaymentFilters) => void
  paymentTypes: PaymentTypeOption[]
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

const field =
  'h-[38px] rounded-sm border border-border-strong bg-surface px-2.5 text-body-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

// One boxed row of unlabelled controls — the placeholders carry the copy, so
// the bar reads as a toolbar rather than a form. Every control is a
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

  const scopeSet = filters.scope !== 'active'

  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 rounded-md border border-border-default bg-surface px-4 py-3.5 ${className}`.trim()}
    >
      <input
        type="search"
        value={filters.q}
        onChange={(e) => set('q', e.target.value)}
        placeholder="Search member name"
        aria-label="Search member name"
        className={`${field} min-w-[220px] flex-1`}
      />

      <select
        value={filters.typeId}
        onChange={(e) => set('typeId', e.target.value)}
        aria-label="Payment type"
        className={field}
      >
        <option value="">All types</option>
        {paymentTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <span className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => set('startDate', e.target.value)}
          aria-label="Paid on or after"
          className={`${field} font-mono`}
        />
        <span className="text-body-sm text-secondary">–</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => set('endDate', e.target.value)}
          aria-label="Paid on or before"
          className={`${field} font-mono`}
        />
      </span>

      <select
        value={filters.scope}
        onChange={(e) => set('scope', e.target.value as PaymentScope)}
        aria-label="Which payments to show"
        title="Deleted payments are excluded from every total on this page."
        className={
          scopeSet
            ? `${field} border-accent-primary font-semibold text-accent-primary`
            : field
        }
      >
        {(Object.keys(SCOPE_LABEL) as PaymentScope[]).map((s) => (
          <option key={s} value={s}>
            {SCOPE_LABEL[s]}
          </option>
        ))}
      </select>

      <span className="text-body-sm text-secondary">
        <span className="font-medium text-primary">
          {totalCount} {totalCount === 1 ? 'payment' : 'payments'} · {totalLabel}
        </span>
        {deletedCount > 0 && scopeSet && <> · {deletedCount} deleted</>}
      </span>

      {isDirty(filters) && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="text-body-sm font-medium text-accent-primary underline underline-offset-2"
        >
          Clear filters
        </button>
      )}

      <span className="basis-full text-caption text-secondary">
        Deleted payments are excluded from every total on this page.
      </span>
    </div>
  )
}

export default FilterBar
