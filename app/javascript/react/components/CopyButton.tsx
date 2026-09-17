import React, { useEffect, useRef, useState } from 'react'

type CopyButtonProps = {
  /** The text put on the clipboard. */
  value: string
  /** Names the thing being copied, for the accessible label ("Copy email"). */
  label: string
  className?: string
}

const CONFIRM_MS = 1600

const CopyIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
    <path
      d="M3 8.5l3.5 3.5L13 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Clipboard writes need a secure context, so this can reject on plain http or
// an older browser. A failure says so rather than showing a check for a copy
// that never happened.
const copy = (value: string) => {
  if (!navigator.clipboard?.writeText) return Promise.reject(new Error('unavailable'))
  return navigator.clipboard.writeText(value)
}

const CopyButton = ({ value, label, className = '' }: CopyButtonProps) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onClick = () => {
    copy(value)
      .then(() => setState('copied'))
      .catch(() => setState('failed'))
      .finally(() => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setState('idle'), CONFIRM_MS)
      })
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${value}`}
        title={label}
        className={[
          'inline-flex h-6 w-6 flex-none items-center justify-center rounded-sm',
          'text-secondary transition hover:bg-sunken hover:text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
      {/* Announced rather than drawn as a toast: the confirmation belongs beside
          the thing that was copied, and a row of these would stack toasts. */}
      <span aria-live="polite" className="text-caption text-secondary">
        {state === 'copied' && 'Copied'}
        {state === 'failed' && 'Press Ctrl+C'}
      </span>
    </span>
  )
}

export default CopyButton
