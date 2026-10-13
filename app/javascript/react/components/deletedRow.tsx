import React from 'react'
import Button from './Button'
import Pill from './Pill'

// The §4.23 soft-deleted-Payment treatment: a neutral "Deleted" pill and a
// single Restore action in place of the usual row actions. The tint is the
// row's — Tr / TableCard tone="deleted".

export const DeletedPill = ({ className = '' }: { className?: string }) => (
  <Pill tone="neutral" className={className}>
    Deleted
  </Pill>
)

type RestoreActionProps = {
  onRestore: () => void
  pending?: boolean
  className?: string
}

export const RestoreAction = ({ onRestore, pending = false, className = '' }: RestoreActionProps) => (
  <Button
    variant="ghost"
    tone="accent"
    size="sm"
    fullWidthBelow={false}
    onClick={onRestore}
    disabled={pending}
    aria-busy={pending || undefined}
    className={className}
  >
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3 8a5 5 0 105-5V1L4 4l4 3V5a3 3 0 11-3 3z"
        fill="currentColor"
      />
    </svg>
    Restore
  </Button>
)
