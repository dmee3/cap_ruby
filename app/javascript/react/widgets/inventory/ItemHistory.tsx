import React, { useState } from 'react'
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
            No alert set.{' '}
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

      <DeleteItem item={item} entryCount={entries.length} />
    </div>
  )
}

// Deleting sits at the bottom of the item's own page, never beside a stepper:
// counting and destroying are different jobs and shouldn't share a surface.
const DeleteItem = ({
  item,
  entryCount,
}: {
  item: ItemHistoryPayload['item']
  entryCount: number
}) => {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = () => {
    setBusy(true)
    const token =
      (document.getElementsByName('csrf-token')[0] as HTMLMetaElement | undefined)?.content ?? ''

    fetch(`/api/inventory/categories/${item.category_id}/items/${item.id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-TOKEN': token },
    })
      .then((resp) => {
        if (!resp.ok) throw resp
        window.location.href = '/inventory/categories'
      })
      .catch(() => {
        setError(`Couldn't delete ${item.name}. Try again, and tell an admin if it keeps failing.`)
        setBusy(false)
      })
  }

  return (
    <div className="border-t border-border-default pt-4">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-[44px] text-body-sm font-semibold text-danger-fg underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
        >
          Delete {item.name}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-body text-primary">
            Delete {item.name}? It leaves the stock list.
            {entryCount > 0 &&
              ` Its ${entryCount} recorded ${entryCount === 1 ? 'change stays' : 'changes stay'}, and an admin can restore it.`}
          </p>
          {error && <p className="m-0 text-body-sm text-danger-fg">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="btn-red btn-lg disabled:opacity-40"
            >
              {busy ? 'Deleting…' : 'Delete item'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="btn-secondary btn-lg">
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemHistory
