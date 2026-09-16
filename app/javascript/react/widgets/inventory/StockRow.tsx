import React from 'react'
import QuantityStepper from '../../components/QuantityStepper'
import { operatorLabel } from '../../components/RuleSentence'
import { StockItem } from './types'

type StockRowProps = {
  item: StockItem
  saving: boolean
  canManageAlerts: boolean
  onCommit: (item: StockItem, delta: number) => void
}

// Never colour alone: each state carries a word. The tinted row and left rail
// are the glanceable layer on top of it.
const ROW_TONE: Record<StockItem['status'], string> = {
  ok: '',
  low: 'bg-warning-bg/40 border-l-[3px] border-l-warning-fg',
  out: 'bg-danger-bg/40 border-l-[3px] border-l-danger-fg',
}

const StockRow = ({ item, saving, canManageAlerts, onCommit }: StockRowProps) => {
  const alertText = item.alert
    ? `${operatorLabel(item.alert.operator).replace(/^is /, '')} ${item.alert.threshold}`
    : null

  return (
    <li
      className={[
        'flex flex-wrap items-center gap-3 border-b border-border-default px-4 py-3 last:border-b-0',
        ROW_TONE[item.status],
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="flex min-w-0 flex-1 basis-[160px] flex-col">
        <span className="truncate text-body font-semibold text-primary">{item.name}</span>
        <span className="flex items-center gap-2 text-caption text-secondary">
          {item.status === 'out' && <span className="font-semibold text-danger-fg">Out of stock</span>}
          {item.status === 'low' && <span className="font-semibold text-warning-fg">Low</span>}
          {alertText ? (
            <span>alert {alertText}</span>
          ) : (
            canManageAlerts && <span>No alert set</span>
          )}
        </span>
      </span>

      <QuantityStepper
        quantity={item.quantity}
        itemName={item.name}
        state={saving ? 'committing' : 'idle'}
        onCommit={(delta) => onCommit(item, delta)}
        className="basis-full sm:basis-auto"
      />

      {/* Rename, alerts, and delete land here as a row menu in a later phase;
          keeping counting and destroying on separate surfaces. */}
      <a
        href={`/inventory/categories/${item.category_id}/items/${item.id}`}
        aria-label={`History for ${item.name}`}
        className="inline-flex min-h-[44px] items-center rounded-sm px-2 text-body-sm text-accent-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
      >
        History
      </a>
    </li>
  )
}

export default StockRow
