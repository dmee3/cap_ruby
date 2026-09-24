import React, { useEffect, useMemo, useState } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import Skeleton from '../../components/Skeleton'
import StatBlock from '../../components/StatBlock'
import { toast } from '../../components/Toast'
import StockRow from './StockRow'
import { StockCategory, StockItem, StockPayload } from './types'

const csrf = () =>
  (document.getElementsByName('csrf-token')[0] as HTMLMetaElement | undefined)?.content ?? ''

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  'X-CSRF-TOKEN': csrf(),
})

type Status = 'loading' | 'ready' | 'error'

const StockList = () => {
  const [payload, setPayload] = useState<StockPayload | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [underAlertOnly, setUnderAlertOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  const load = () => {
    setStatus('loading')
    fetch('/api/inventory/categories', { headers: { Accept: 'application/json' } })
      .then((resp) => {
        if (!resp.ok) throw resp
        return resp.json()
      })
      .then((data: StockPayload) => {
        setPayload(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(load, [])

  const commit = (item: StockItem, delta: number) => {
    if (delta === 0) return
    setSavingId(item.id)

    fetch(`/api/inventory/categories/${item.category_id}/items/${item.id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      // The delta is what the person decided; previous_quantity is what they
      // decided it against, so the server can refuse a stale write instead of
      // overwriting someone else's count.
      body: JSON.stringify({
        item: { quantity: item.quantity + delta, previous_quantity: item.quantity },
      }),
    })
      .then(async (resp) => {
        const body = await resp.json().catch(() => ({}))
        if (!resp.ok) throw body

        setPayload((current) => current && patchItem(current, item.id, body.quantity))
        toast(`Saved. ${item.name}: ${body.quantity}, logged to you.`, { variant: 'success' })
      })
      .catch((body) => {
        const message = body?.errors?.[0] ?? `Didn't save. ${item.name} is still ${item.quantity}.`
        toast(message, { variant: 'error' })
        // A stale write comes back with the count someone else left, so the
        // row corrects itself rather than showing a number that isn't there.
        if (typeof body?.current_quantity === 'number') {
          setPayload((current) => current && patchItem(current, item.id, body.current_quantity))
        }
      })
      .finally(() => setSavingId(null))
  }

  const visible = useMemo(() => {
    if (!payload) return []
    const term = search.trim().toLowerCase()

    return payload.categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          if (underAlertOnly && item.status === 'ok') return false
          if (term && !item.name.toLowerCase().includes(term)) return false
          return true
        }),
      }))
      .filter((category) => !(underAlertOnly || term) || category.items.length > 0)
  }, [payload, underAlertOnly, search])

  if (status === 'loading') return <LoadingSkeleton />

  if (status === 'error') {
    return (
      <EmptyState
        tone="danger"
        title="We couldn't reach the inventory list."
        body="Nothing you counted was lost. Try again, and if it keeps failing tell an admin."
        action={<Button onClick={load}>Try again</Button>}
      />
    )
  }

  if (!payload || payload.categories.length === 0) {
    return (
      <EmptyState
        title="No categories yet"
        body="Start with one, like Sticks or Heads. You can add items to it right after, and rename it whenever."
        action={
          <Button onClick={() => (window.location.href = '/inventory/categories/new')}>
            Add your first category
          </Button>
        }
      />
    )
  }

  const { stats, last_change: lastChange } = payload
  const needsAttention = stats.under_alert + stats.out_of_stock

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body-sm text-secondary">
        {stats.tracked} items in {payload.categories.length} categories.
        {lastChange && ` Last change by ${lastChange.user_name}.`}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <StatBlock kicker="Items tracked" metric={String(stats.tracked)} />
        </Card>
        <Card>
          <StatBlock kicker="Under alert" metric={String(stats.under_alert)} threshold={stats.under_alert} />
        </Card>
        <Card>
          <StatBlock kicker="Out of stock" metric={String(stats.out_of_stock)} threshold={stats.out_of_stock} />
        </Card>
        <Card>
          <StatBlock kicker="No alert set" metric={String(stats.no_alert)} />
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border-default bg-surface p-3">
        <label className="sr-only" htmlFor="stock-search">
          Search items
        </label>
        <input
          id="stock-search"
          type="search"
          placeholder="Search items"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 min-w-[200px] flex-1 rounded-sm border border-border-strong bg-surface px-3 text-body-sm text-primary focus-visible:outline-none focus-visible:ring-2"
        />
        {/* A real checkbox, not the canvas's pill switch. */}
        <label className="flex min-h-[44px] items-center gap-2 text-body-sm text-primary">
          <input
            type="checkbox"
            checked={underAlertOnly}
            onChange={(e) => setUnderAlertOnly(e.target.checked)}
            className="h-4 w-4 rounded-sm border-border-strong text-ocean focus-visible:ring-2"
          />
          Needs attention only
        </label>
        {(underAlertOnly || search) && (
          <button
            type="button"
            onClick={() => {
              setUnderAlertOnly(false)
              setSearch('')
            }}
            className="text-body-sm text-accent-primary underline underline-offset-2"
          >
            Clear filter
          </button>
        )}
      </div>

      {underAlertOnly && (
        <p className="text-caption text-secondary">
          {needsAttention === 0
            ? 'Nothing is out of stock or under its alert.'
            : `${needsAttention} ${needsAttention === 1 ? 'item needs' : 'items need'} attention. ${stats.no_alert} items have no alert rule, so they can only show up here by hitting zero.`}
        </p>
      )}

      {visible.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          collapsed={!!collapsed[category.id]}
          canManageAlerts={payload.can_manage_alerts}
          savingId={savingId}
          onToggle={() =>
            setCollapsed((current) => ({ ...current, [category.id]: !current[category.id] }))
          }
          onCommit={commit}
          onDeleted={load}
        />
      ))}

      {visible.length === 0 && (
        <EmptyState title="Nothing matches" body="Try a different search, or clear the filter." />
      )}
    </div>
  )
}

const CategoryCard = ({
  category,
  collapsed,
  canManageAlerts,
  savingId,
  onToggle,
  onCommit,
  onDeleted,
}: {
  category: StockCategory
  collapsed: boolean
  canManageAlerts: boolean
  savingId: number | null
  onToggle: () => void
  onCommit: (item: StockItem, delta: number) => void
  onDeleted: () => void
}) => {
  const lows = category.items.filter((i) => i.status === 'low').length
  const outs = category.items.filter((i) => i.status === 'out').length

  return (
    <Card
      variant="list"
      title={category.name}
      count={`${category.item_count} ${category.item_count === 1 ? 'item' : 'items'}`}
      action={
        <div className="flex items-center gap-2">
          {outs > 0 && (
            <span className="rounded-full bg-danger-bg px-2 py-[2px] text-label text-danger-fg">
              {outs} out
            </span>
          )}
          {lows > 0 && (
            <span className="rounded-full bg-warning-bg px-2 py-[2px] text-label text-warning-fg">
              {lows} low
            </span>
          )}
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={onToggle}
            className="min-h-[44px] rounded-sm px-2 text-body-sm text-accent-primary focus-visible:outline-none focus-visible:ring-2"
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      }
    >
      {!collapsed &&
        (category.items.length === 0 ? (
          <EmptyState
            title={`Nothing in ${category.name} yet`}
            body="Add carriers, stands, or whatever lives on this shelf."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() =>
                    (window.location.href = `/inventory/categories/${category.id}/items/new`)
                  }
                >
                  Add an item
                </Button>
                {/* Only offered while the category is empty, which is the only
                    state the server will delete one in. */}
                <DeleteCategory category={category} onDeleted={onDeleted} />
              </div>
            }
          />
        ) : (
          <ul className="flex flex-col">
            {category.items.map((item) => (
              <StockRow
                key={item.id}
                item={item}
                saving={savingId === item.id}
                canManageAlerts={canManageAlerts}
                onCommit={onCommit}
              />
            ))}
          </ul>
        ))}
    </Card>
  )
}

const DeleteCategory = ({
  category,
  onDeleted,
}: {
  category: StockCategory
  onDeleted: () => void
}) => {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const remove = () => {
    setBusy(true)
    fetch(`/api/inventory/categories/${category.id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}))
          throw body
        }
        toast(`Deleted ${category.name}`, { variant: 'success' })
        onDeleted()
      })
      .catch((body) => {
        toast(body?.errors?.[0] ?? `Couldn't delete ${category.name}.`, { variant: 'error' })
        setBusy(false)
        setConfirming(false)
      })
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-[44px] px-2 text-body-sm text-danger-fg underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
      >
        Delete category
      </button>
    )
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-body-sm text-primary">
        Delete {category.name}? It's empty, so nothing else goes with it.
      </span>
      <button type="button" onClick={remove} disabled={busy} className="btn-red btn-sm disabled:opacity-40">
        {busy ? 'Deleting…' : 'Delete'}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="btn-gray btn-sm">
        Keep it
      </button>
    </span>
  )
}

// Keeps the category shape so the page doesn't jump when the data lands.
const LoadingSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} rows={1} className="h-[76px]" />
      ))}
    </div>
    {[0, 1].map((card) => (
      <Card key={card} variant="list" title=" ">
        <ul className="flex flex-col gap-3 p-4">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} rows={1} className="h-[44px]" />
          ))}
        </ul>
      </Card>
    ))}
  </div>
)

const patchItem = (payload: StockPayload, itemId: number, quantity: number): StockPayload => ({
  ...payload,
  categories: payload.categories.map((category) => ({
    ...category,
    items: category.items.map((item) =>
      item.id === itemId ? { ...item, quantity, status: restatus(item, quantity) } : item,
    ),
  })),
})

// The server owns this judgement, but re-deriving it locally keeps the row's
// colour honest until the next load rather than leaving a stale "out" pill on
// something that was just restocked.
const restatus = (item: StockItem, quantity: number): StockItem['status'] => {
  if (quantity === 0) return 'out'
  if (!item.alert) return 'ok'

  const { operator, threshold } = item.alert
  const hit =
    (operator === 'eq' && quantity === threshold) ||
    (operator === 'lt' && quantity < threshold) ||
    (operator === 'lt_eq' && quantity <= threshold) ||
    (operator === 'gt' && quantity > threshold) ||
    (operator === 'gt_eq' && quantity >= threshold)

  return hit ? 'low' : 'ok'
}

export default StockList
