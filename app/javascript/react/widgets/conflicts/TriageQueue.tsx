import React from 'react'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import MemberGroupHeader from '../../components/MemberGroupHeader'
import TriageRow, { TriageRowData } from '../../components/TriageRow'
import DecisionConfirm, { DecisionOutcome } from '../../components/DecisionConfirm'
import LoadMoreButton from '../../components/LoadMoreButton'

export type TriageGroup = {
  user_id: number
  member: string
  initials?: string
  ensemble?: string
  section?: string
  pending_count: number
  season_count: number
  waiting_days?: number | null
  rows: TriageRowData[]
}

export type PendingDecision = {
  outcome: DecisionOutcome
  member: string
  dateLabel: string
  saving: boolean
  error: string | null
}

type TriageQueueProps = {
  groups: TriageGroup[]
  basePath: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onApprove: (id: number) => void
  onDeny: (id: number) => void
  onResolve: (id: number) => void
  onApproveAll: (group: TriageGroup) => void
  onUndo: (id: number) => void
  onDecisionExpire: (id: number) => void
  /** Conflicts mid-decision, keyed by conflict id. */
  decisions: Record<number, PendingDecision>
  visibleCount: number
  onShowMore: () => void
  emptyAction?: React.ReactNode
}

const PAGE_SIZE = 10

// §4.26 + §4.27 assembled: the grouped triage queue.
//
// Groups arrive ordered by longest-waiting member (the server's rule) — the
// canvas sorted its mocks three different ways, so the ordering is pinned
// server-side rather than re-derived here.
const TriageQueue = ({
  groups,
  basePath,
  loading = false,
  error = null,
  onRetry,
  onApprove,
  onDeny,
  onResolve,
  onApproveAll,
  onUndo,
  onDecisionExpire,
  decisions,
  visibleCount,
  onShowMore,
  emptyAction,
}: TriageQueueProps) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading conflicts…</span>
        {[0, 1].map(key => (
          <div key={key} className="overflow-hidden rounded-md border border-border-default bg-surface">
            <div className="flex items-center gap-3 border-b border-border-subtle bg-sunken px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-border-subtle animate-pulse" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-36 rounded-sm bg-border-subtle animate-pulse" />
                <div className="h-2.5 w-24 rounded-sm bg-border-subtle animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col gap-2 px-4 py-3.5">
              <div className="h-3.5 w-56 rounded-sm bg-border-subtle animate-pulse" />
              <div className="h-2.5 w-44 rounded-sm bg-border-subtle animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-border-default bg-surface">
        <EmptyState
          tone="danger"
          title="We couldn't load the queue"
          body="That's on us, not your connection. Nothing was decided, so try again and the list will come back exactly as it was."
          action={
            onRetry && (
              <Button variant="primary" size="md" fullWidthBelow={false} onClick={onRetry}>
                Try again
              </Button>
            )
          }
        />
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-md border border-border-default bg-surface">
        <EmptyState
          title="Nothing waiting on a decision"
          body="The queue's clear. Check back in a few days to see if anything new comes in."
          action={emptyAction}
        />
      </div>
    )
  }

  const visible = groups.slice(0, visibleCount)

  return (
    <div className="flex flex-col gap-4">
      {visible.map(group => (
        <div
          key={group.user_id}
          className="rounded-md border border-border-default bg-surface"
        >
          <MemberGroupHeader
            member={group.member}
            initials={group.initials}
            ensemble={group.ensemble}
            section={group.section}
            pendingCount={group.pending_count}
            waitingDays={group.waiting_days}
            onApproveAll={group.pending_count >= 2 ? () => onApproveAll(group) : undefined}
          />
          <div className="divide-y divide-border-subtle">
            {group.rows.map(row => {
              const decision = decisions[row.id]
              if (decision) {
                return (
                  <DecisionConfirm
                    key={row.id}
                    outcome={decision.outcome}
                    member={decision.member}
                    dateLabel={decision.dateLabel}
                    saving={decision.saving}
                    error={decision.error}
                    onUndo={() => onUndo(row.id)}
                    onExpire={() => onDecisionExpire(row.id)}
                    onRetry={onRetry}
                  />
                )
              }

              return (
                <TriageRow
                  key={row.id}
                  row={row}
                  editHref={`${basePath}/${row.id}/edit`}
                  onApprove={onApprove}
                  onDeny={onDeny}
                  onResolve={onResolve}
                />
              )
            })}
          </div>
        </div>
      ))}

      {groups.length > PAGE_SIZE && (
        <LoadMoreButton
          increment={Math.min(PAGE_SIZE, groups.length - visibleCount)}
          totalCount={groups.length}
          hasMore={groups.length > visibleCount}
          onClick={onShowMore}
        />
      )}
    </div>
  )
}

export default TriageQueue
