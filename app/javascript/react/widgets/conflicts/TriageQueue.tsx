import React from 'react'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import TriageRow, { TriageRowData } from '../../components/TriageRow'
import DecisionConfirm, { DecisionOutcome } from '../../components/DecisionConfirm'
import LoadMoreButton from '../../components/LoadMoreButton'

export type TriageRowWithMember = TriageRowData & {
  member: string
  section?: string
  initials?: string
}

export type TriageGroup = {
  date: string
  date_label: string
  pending_count: number
  rows: TriageRowWithMember[]
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
  onUndo: (id: number) => void
  onDecisionExpire: (id: number) => void
  /** Conflicts mid-decision, keyed by conflict id. */
  decisions: Record<number, PendingDecision>
  visibleCount: number
  onShowMore: () => void
  emptyAction?: React.ReactNode
}

const PAGE_SIZE = 10

const OUTCOME_BORDER: Record<DecisionOutcome, string> = {
  Approved: 'border-moss',
  Denied: 'border-raspberry',
  Resolved: 'border-border-strong',
}

// The triage queue, grouped by the date each conflict falls on and worked
// through soonest first. The date is a plain heading above the day's rows
// rather than a bar inside a card, so nothing has to line its corners up with
// the card beneath it.
const TriageQueue = ({
  groups,
  basePath,
  loading = false,
  error = null,
  onRetry,
  onApprove,
  onDeny,
  onResolve,
  onUndo,
  onDecisionExpire,
  decisions,
  visibleCount,
  onShowMore,
  emptyAction,
}: TriageQueueProps) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-5" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading conflicts…</span>
        {[0, 1].map(key => (
          <div key={key} className="flex flex-col gap-2">
            <div className="h-3 w-28 rounded-sm bg-border-subtle animate-pulse" />
            <div className="rounded-md border border-border-default bg-surface px-4 py-3.5">
              <div className="flex flex-col gap-2">
                <div className="h-3.5 w-56 rounded-sm bg-border-subtle animate-pulse" />
                <div className="h-2.5 w-44 rounded-sm bg-border-subtle animate-pulse" />
              </div>
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
    <div className="flex flex-col gap-5">
      {visible.map(group => (
        <section key={group.date} className="flex flex-col gap-2">
          <h2 className="m-0 text-label uppercase tracking-wide text-secondary">
            {group.date_label}
          </h2>

          <div className="flex flex-col gap-2">
            {group.rows.map(row => {
              const decision = decisions[row.id]

              // Same rounded card either way, so a row doesn't change shape
              // the moment it's decided — only its border colour.
              const frame = decision
                ? OUTCOME_BORDER[decision.outcome]
                : 'border-border-default'

              return (
                <div
                  key={row.id}
                  className={`overflow-hidden rounded-md border bg-surface ${frame}`}
                >
                  {decision ? (
                    <DecisionConfirm
                      outcome={decision.outcome}
                      member={decision.member}
                      dateLabel={decision.dateLabel}
                      saving={decision.saving}
                      error={decision.error}
                      onUndo={() => onUndo(row.id)}
                      onExpire={() => onDecisionExpire(row.id)}
                      onRetry={onRetry}
                      className="border-0"
                    />
                  ) : (
                    <TriageRow
                      row={row}
                      member={row.member}
                      section={row.section}
                      editHref={`${basePath}/${row.id}/edit`}
                      onApprove={onApprove}
                      onDeny={onDeny}
                      onResolve={onResolve}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>
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
