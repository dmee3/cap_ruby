import React, { useEffect, useRef, useState } from 'react'
import Button from './Button'

export type DecisionOutcome = 'Approved' | 'Denied' | 'Resolved'

type DecisionConfirmProps = {
  outcome: DecisionOutcome
  member: string
  dateLabel: string
  onUndo: () => void
  /** Fires when the undo window closes, so the row can leave the queue. */
  onExpire?: () => void
  /** Undo window in ms. */
  duration?: number
  saving?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

const TONE: Record<DecisionOutcome, { border: string; badge: string; bar: string; glyph: string }> = {
  Approved: {
    border: 'border-moss',
    badge: 'bg-success-bg text-success-fg',
    bar: 'bg-moss',
    glyph: '✓',
  },
  Denied: {
    border: 'border-raspberry',
    badge: 'bg-danger-bg text-danger-fg',
    bar: 'bg-raspberry',
    glyph: '✕',
  },
  Resolved: {
    border: 'border-border-strong',
    badge: 'bg-neutral-bg text-neutral-fg',
    bar: 'bg-neutral-fg',
    glyph: '✓',
  },
}

const TICK_MS = 100

// §4.30 — the row becomes its own confirmation rather than firing a toast, so
// the confirmation stays where the eye already is.
//
// The undo window is a time limit on an action (WCAG 2.2.1): the bar carries it
// visually, the remaining seconds are announced sr-only so the limit is
// perceivable without it, and Undo stays keyboard-reachable throughout.
const DecisionConfirm = ({
  outcome,
  member,
  dateLabel,
  onUndo,
  onExpire,
  duration = 15000,
  saving = false,
  error = null,
  onRetry,
  className = '',
}: DecisionConfirmProps) => {
  const [remaining, setRemaining] = useState(duration)
  const expiredRef = useRef(false)
  const deadlineRef = useRef<number | null>(null)

  // onExpire is typically an inline arrow from the parent, so its identity
  // changes on every render of the list. Held in a ref, it can stay out of the
  // effect's deps — otherwise deciding one row restarts every other row's
  // countdown.
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (saving || error) return undefined

    // The deadline is set once and survives re-renders, so the bar keeps
    // draining from where it was rather than snapping back to full.
    if (deadlineRef.current === null) deadlineRef.current = Date.now() + duration

    const tick = () => {
      const left = Math.max(0, (deadlineRef.current ?? 0) - Date.now())
      setRemaining(left)
      if (left === 0 && !expiredRef.current) {
        expiredRef.current = true
        window.clearInterval(timer)
        onExpireRef.current?.()
      }
    }

    const timer = window.setInterval(tick, TICK_MS)
    tick()

    return () => window.clearInterval(timer)
  }, [duration, saving, error])

  if (saving) {
    return (
      <div
        className={`flex items-center gap-3 border border-border-subtle px-4 py-3.5 ${className}`.trim()}
        role="status"
      >
        <span
          className="h-4 w-4 flex-none animate-spin rounded-full border-2 border-accent-primary border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-body-sm font-medium text-secondary">Saving your decision…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex flex-col gap-2 border border-raspberry px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
        role="alert"
      >
        <div className="flex flex-col">
          <span className="text-body-sm font-semibold text-primary">{error}</span>
          <span className="text-caption text-secondary">
            The row is back to Pending exactly as it was.
          </span>
        </div>
        {onRetry && (
          <Button variant="primary" size="md" fullWidthBelow={false} onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  const tone = TONE[outcome]
  const secondsLeft = Math.ceil(remaining / 1000)
  const pct = Math.max(0, Math.min(100, (remaining / duration) * 100))

  return (
    <div className={`relative border ${tone.border} ${className}`.trim()} data-outcome={outcome}>
      <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-3">
        <span
          className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-caption font-bold ${tone.badge}`}
          aria-hidden="true"
        >
          {tone.glyph}
        </span>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-body-sm font-semibold text-primary">
            {outcome}. {member}&rsquo;s conflict is {outcome.toLowerCase()}.
          </span>
          <span className="text-caption text-secondary">{dateLabel}</span>
        </div>

        <div className="flex flex-none items-center gap-3">
          {/* The bar carries the countdown visually. The remaining time is
              still named for screen readers (WCAG 2.2.1 — a time limit must
              not be signalled by a visual cue alone), just not on screen. */}
          <span className="sr-only" role="timer">
            {secondsLeft} seconds left to undo
          </span>
          <Button variant="secondary" size="md" fullWidthBelow={false} onClick={onUndo}>
            Undo
          </Button>
        </div>
      </div>

      <div className="h-[3px] w-full bg-sunken" aria-hidden="true">
        <div className={`h-full ${tone.bar} transition-[width]`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default DecisionConfirm
