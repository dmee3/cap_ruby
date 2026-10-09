import React from 'react'
import { Select, TextInput } from './Field'
import Button from './Button'

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
      <TextInput
        controlSize="sm"
        type="search"
        value={filters.q}
        onChange={(e) => set('q', e.target.value)}
        placeholder="Search member name"
        aria-label="Search member name"
        className="min-w-[220px] flex-1"
      />

      <Select
        controlSize="sm"
        value={filters.typeId}
        onChange={(e) => set('typeId', e.target.value)}
        aria-label="Payment type"
      >
        <option value="">All types</option>
        {paymentTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>

      <span className="flex items-center gap-1.5">
        <TextInput
          controlSize="sm"
          mono
          type="date"
          value={filters.startDate}
          onChange={(e) => set('startDate', e.target.value)}
          aria-label="Paid on or after"
        />
        <span className="text-body-sm text-secondary">–</span>
        <TextInput
          controlSize="sm"
          mono
          type="date"
          value={filters.endDate}
          onChange={(e) => set('endDate', e.target.value)}
          aria-label="Paid on or before"
        />
      </span>

      <Select
        controlSize="sm"
        value={filters.scope}
        onChange={(e) => set('scope', e.target.value as PaymentScope)}
        aria-label="Which payments to show"
        title="Deleted payments are excluded."
        className={scopeSet ? '!border-accent-primary font-semibold !text-accent-primary' : ''}
      >
        {(Object.keys(SCOPE_LABEL) as PaymentScope[]).map((s) => (
          <option key={s} value={s}>
            {SCOPE_LABEL[s]}
          </option>
        ))}
      </Select>

      <span className="text-body-sm text-secondary">
        <span className="font-medium text-primary">
          {totalCount} {totalCount === 1 ? 'payment' : 'payments'} · {totalLabel}
        </span>
        {deletedCount > 0 && scopeSet && <> · {deletedCount} deleted</>}
      </span>

      {isDirty(filters) && (
        <Button variant="link" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear filters
        </Button>
      )}

      <span className="basis-full text-caption text-secondary">
        Deleted payments are excluded.
      </span>
    </div>
  )
}

export default FilterBar
