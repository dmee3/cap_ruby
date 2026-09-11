import React, { useEffect, useRef } from 'react'
import Button from './Button'
import StatusPill, { StatusValue } from './StatusPill'

export type ConflictPopoverData = {
  id: number
  member: string
  initials?: string
  ensemble?: string
  section?: string
  dateLabel: string
  relativeSubline?: string
  status: StatusValue | string
  reason?: string
}

type ConflictPopoverProps = {
  conflict: ConflictPopoverData
  onClose: () => void
  onApprove?: (id: number) => void
  onDeny?: (id: number) => void
  editHref?: string
  busy?: boolean
  className?: string
  style?: React.CSSProperties
}

// §4.29 — replaces the hand-built tooltip.
//
// The thing this replaces was a <div> imperatively prepended on mouseenter:
// mouse-only, month-view-only, invisible to a screen reader. The behaviour
// here IS the spec — click to open, Escape or outside click to close, focus
// lands on the primary action and returns to the trigger on close.
const ConflictPopover = ({
  conflict,
  onClose,
  onApprove,
  onDeny,
  editHref,
  busy = false,
  className = '',
  style,
}: ConflictPopoverProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = `conflict-popover-${conflict.id}-title`

  useEffect(() => {
    // Focus the action a coordinator most likely wants; fall back to Close on
    // a decided conflict, so focus never lands outside the dialog. Button is
    // not a forwardRef component, so the primary action is found in the DOM
    // rather than held by a ref that would silently never attach.
    const primary = containerRef.current?.querySelector<HTMLButtonElement>('[data-popover-primary]')
    ;(primary ?? closeRef.current)?.focus()
  }, [conflict.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [onClose])

  const isPending = conflict.status === 'Pending'
  const subtitle = [conflict.ensemble, conflict.section].filter(Boolean).join(' · ')

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      style={style}
      className={`w-[320px] overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-e3 ${className}`.trim()}
    >
      <div className="flex items-start gap-3 border-b border-border-subtle px-4 py-3.5">
        {conflict.initials && (
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ocean text-caption font-semibold text-on-brand">
            {conflict.initials}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span id={titleId} className="truncate text-body font-semibold text-primary">
            {conflict.member}
          </span>
          {subtitle && <span className="truncate text-caption text-secondary">{subtitle}</span>}
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close conflict details"
          className="flex-none rounded-sm p-1 text-secondary transition hover:bg-sunken hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-body font-semibold text-primary">{conflict.dateLabel}</span>
          <StatusPill status={conflict.status} />
        </div>
        {conflict.relativeSubline && (
          <span className="text-caption text-secondary">{conflict.relativeSubline}</span>
        )}
        {conflict.reason && (
          <div className="rounded-md border border-border-subtle bg-sunken px-3 py-2.5">
            <p className="whitespace-pre-line text-body-sm text-primary">{conflict.reason}</p>
          </div>
        )}
      </div>

      {(isPending || editHref) && (
        <div className="flex items-center gap-2 border-t border-border-subtle bg-sunken/50 px-4 py-3">
          {isPending && onApprove && (
            <Button
              data-popover-primary
              variant="success"
              size="md"
              fullWidthBelow={false}
              disabled={busy}
              onClick={() => onApprove(conflict.id)}
              className="flex-1"
            >
              Approve
            </Button>
          )}
          {isPending && onDeny && (
            <Button
              variant="danger"
              size="md"
              fullWidthBelow={false}
              disabled={busy}
              onClick={() => onDeny(conflict.id)}
              className="flex-1"
            >
              Deny
            </Button>
          )}
          {editHref && (
            <a
              href={editHref}
              className="inline-flex h-9 flex-none items-center rounded-sm border border-border-strong px-3 text-body-sm font-medium text-primary transition hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              Edit
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default ConflictPopover
