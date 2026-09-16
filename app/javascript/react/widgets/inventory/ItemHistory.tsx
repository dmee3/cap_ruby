import React from 'react'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import AuditRow, { AuditEntry } from '../../components/AuditRow'
import { operatorLabel } from '../../components/RuleSentence'
import { historyDate } from '../../../utilities/history_dates'

export type ItemHistoryPayload = {
  item: {
    id: number
    category_id: number
    category_name: string
    name: string
    quantity: number
  }
  alert: { id: number; operator: string; threshold: number; user_name: string } | null
  entries: Array<{
    id: number
    change: number
    previous_quantity: number
    performed_on: string
    user_name: string
  }>
  can_manage_alerts: boolean
}

const toEntry = (row: ItemHistoryPayload['entries'][number]): AuditEntry => ({
  id: row.id,
  change: row.change,
  previousQuantity: row.previous_quantity,
  performedOn: row.performed_on,
  userName: row.user_name,
})

const ItemHistory = ({ payload }: { payload: ItemHistoryPayload }) => {
  const { item, alert, entries, can_manage_alerts: canManageAlerts } = payload
  const first = entries[entries.length - 1]

  return (
    <div className="flex flex-col gap-4">
      <nav className="text-body-sm text-secondary">
        <a href="/inventory/categories" className="text-accent-primary underline underline-offset-2">
          Stock
        </a>
        {' / '}
        {item.category_name}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="m-0 text-h1 text-primary">{item.name}</h1>
        <div className="flex gap-6">
          <span className="flex flex-col">
            <span className="text-label uppercase text-secondary">On hand</span>
            <span className="font-mono text-metric tabular-nums text-primary">{item.quantity}</span>
          </span>
        </div>
      </div>

      <Card variant="section" title="Alert">
        {alert ? (
          <p className="m-0 text-body text-primary">
            {item.name} is watched: when it {operatorLabel(alert.operator)} {alert.threshold},{' '}
            {alert.user_name} gets an email.{' '}
            {canManageAlerts && (
              <a href="/inventory/email_rules" className="text-accent-primary underline underline-offset-2">
                Edit alert
              </a>
            )}
          </p>
        ) : (
          <p className="m-0 text-body text-secondary">
            No alert set, so nothing warns you when this runs low.{' '}
            {canManageAlerts && (
              <a
                href="/inventory/email_rules/new"
                className="text-accent-primary underline underline-offset-2"
              >
                Tell us when to warn you
              </a>
            )}
          </p>
        )}
      </Card>

      <Card
        variant="list"
        title="Every change"
        count={
          entries.length === 0
            ? undefined
            : `${entries.length} ${entries.length === 1 ? 'change' : 'changes'} · newest first`
        }
      >
        {entries.length === 0 ? (
          <EmptyState
            title="Nothing has changed yet"
            body={`The next time someone counts ${item.name}, it shows up here with their name on it.`}
          />
        ) : (
          <ul className="flex flex-col">
            {entries.map((row) => (
              <AuditRow key={row.id} entry={toEntry(row)} />
            ))}
          </ul>
        )}
      </Card>

      {first && (
        <p className="text-caption text-secondary">
          This item started at {first.previous_quantity + first.change} when {first.user_name} added
          it on {historyDate(first.performed_on)}.
        </p>
      )}
    </div>
  )
}

export default ItemHistory
