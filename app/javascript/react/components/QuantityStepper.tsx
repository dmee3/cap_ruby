import React, { useEffect, useRef, useState } from 'react'

export type StepperState = 'idle' | 'adjusting' | 'recount' | 'committing' | 'failed'

type QuantityStepperProps = {
  /** The quantity currently on the shelf, as the server last reported it. */
  quantity: number
  /** Item name, used for the accessible names on both buttons. */
  itemName: string
  /** Called with the delta (never an absolute) once the person commits. */
  onCommit: (delta: number) => void
  onCancel?: () => void
  state?: StepperState
  /** Touch sizing: 44px targets rather than 36px. */
  touch?: boolean
  className?: string
}

// Auto-repeat while a button is held. 4/second after a short initial pause, so
// a single tap doesn't immediately become a run.
const REPEAT_MS = 250
const REPEAT_DELAY_MS = 500

// U+2212 MINUS SIGN, not a hyphen: it's the same width as the plus.
const MINUS = '−'

export const formatDelta = (delta: number) => (delta > 0 ? `+${delta}` : `${MINUS}${Math.abs(delta)}`)

/**
 * §4.40. The control the whole flow is built around: someone in a storage room
 * with one hand in a box, recording what changed.
 *
 * An adjustment is a DELTA, never an absolute. Even a typed recount is
 * converted to a delta before it's committed, so the history trail never has a
 * gap. The minus floors at zero — a count of things on a shelf has no negative.
 */
const QuantityStepper = ({
  quantity,
  itemName,
  onCommit,
  onCancel,
  state = 'idle',
  touch = false,
  className = '',
}: QuantityStepperProps) => {
  const [delta, setDelta] = useState(0)
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState('')
  const repeatRef = useRef<number | undefined>(undefined)
  const delayRef = useRef<number | undefined>(undefined)

  // A fresh server quantity means someone else's count landed, or ours did:
  // either way the pending delta no longer refers to the number on screen.
  useEffect(() => {
    setDelta(0)
    setTyping(false)
  }, [quantity])

  useEffect(() => () => stopRepeat(), [])

  const stopRepeat = () => {
    window.clearInterval(repeatRef.current)
    window.clearTimeout(delayRef.current)
    repeatRef.current = undefined
    delayRef.current = undefined
  }

  const busy = state === 'committing'
  const projected = quantity + delta
  const atFloor = projected <= 0

  const step = (by: number) => {
    setDelta((current) => {
      const next = current + by
      // Floor at zero: clamp the delta rather than the displayed number, so the
      // committed value and what's on screen can't disagree.
      return quantity + next < 0 ? -quantity : next
    })
  }

  const startRepeat = (by: number) => {
    if (busy) return
    step(by)
    delayRef.current = window.setTimeout(() => {
      repeatRef.current = window.setInterval(() => step(by), REPEAT_MS)
    }, REPEAT_DELAY_MS)
  }

  const commitTyped = () => {
    const total = Number.parseInt(typed, 10)
    if (Number.isNaN(total) || total < 0) return
    // The number they typed is what they see; the arithmetic is ours.
    onCommit(total - quantity)
    setTyping(false)
  }

  const reset = () => {
    setDelta(0)
    setTyping(false)
    onCancel?.()
  }

  const buttonSize = touch ? 'h-[44px] w-[44px]' : 'h-[36px] w-[36px]'
  const buttonBase = [
    'inline-flex items-center justify-center rounded-[9px] border transition',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:pointer-events-none',
    'border-border-strong bg-surface text-primary hover:enabled:bg-sunken',
    buttonSize,
  ].join(' ')

  if (typing) {
    return (
      <div className={`flex items-center gap-2 ${className}`.trim()}>
        <label className="sr-only" htmlFor={`recount-${itemName}`}>
          Recount {itemName}
        </label>
        <input
          id={`recount-${itemName}`}
          type="number"
          min={0}
          inputMode="numeric"
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTyped()
            if (e.key === 'Escape') reset()
          }}
          className={[
            'rounded-[9px] border border-accent-primary bg-surface px-2 text-center',
            'font-mono text-body font-bold text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            touch ? 'h-[44px] w-[96px]' : 'h-[36px] w-[88px]',
          ].join(' ')}
        />
        <button type="button" onClick={commitTyped} className="text-body-sm font-semibold text-accent-primary">
          Save
        </button>
        <button type="button" onClick={reset} className="text-body-sm text-secondary">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <div className={`flex items-center ${touch ? 'gap-[6px]' : 'gap-2'}`}>
        <button
          type="button"
          aria-label={`Remove one ${itemName}`}
          disabled={busy || atFloor}
          onMouseDown={() => startRepeat(-1)}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={() => startRepeat(-1)}
          onTouchEnd={stopRepeat}
          className={buttonBase}
        >
          <span aria-hidden="true" className={touch ? 'text-[20px] font-semibold' : 'text-[18px] font-semibold'}>
            {MINUS}
          </span>
        </button>

        <span
          // aria-live so a screen reader hears the count change as it's stepped.
          aria-live="polite"
          className={[
            'text-center font-mono font-bold tabular-nums',
            busy ? 'text-secondary' : 'text-primary',
            touch ? 'min-w-[44px] text-[22px] leading-[26px]' : 'min-w-[52px] text-[20px] leading-[24px]',
          ].join(' ')}
        >
          {projected}
        </span>

        <button
          type="button"
          aria-label={`Add one ${itemName}`}
          disabled={busy}
          onMouseDown={() => startRepeat(1)}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={() => startRepeat(1)}
          onTouchEnd={stopRepeat}
          className={buttonBase}
        >
          <span aria-hidden="true" className={touch ? 'text-[20px] font-semibold' : 'text-[18px] font-semibold'}>
            +
          </span>
        </button>

        {busy && (
          <span className="flex items-center gap-2 text-body-sm text-secondary">
            <span
              className="h-4 w-4 rounded-full border-2 border-border-default border-t-accent-primary animate-spin"
              aria-hidden="true"
            />
            Saving…
          </span>
        )}
      </div>

      {delta !== 0 && !busy && (
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              'rounded-full px-[10px] py-[3px] font-mono text-body-sm font-bold',
              delta > 0 ? 'bg-success-bg text-success-fg' : 'bg-danger-bg text-danger-fg',
            ].join(' ')}
          >
            {formatDelta(delta)}
          </span>
          <span className="text-body-sm text-secondary">
            {quantity} → <span className="font-mono font-bold text-primary">{projected}</span>
          </span>
          <button
            type="button"
            onClick={() => onCommit(delta)}
            className={[
              'inline-flex items-center justify-center rounded-sm bg-ocean px-[14px] font-bold text-on-brand',
              'text-body-sm transition hover:bg-ocean-light',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              touch ? 'h-[44px]' : 'h-[34px]',
            ].join(' ')}
          >
            Save {formatDelta(delta)}
          </button>
          <button
            type="button"
            onClick={reset}
            className={[
              'inline-flex items-center justify-center rounded-sm border border-border-strong px-[14px]',
              'text-body-sm text-primary transition hover:bg-sunken',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              touch ? 'h-[44px]' : 'h-[34px]',
            ].join(' ')}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setTyped(String(projected))
              setTyping(true)
            }}
            className="text-body-sm text-accent-primary underline underline-offset-2"
          >
            Type a total instead
          </button>
        </div>
      )}

      {delta === 0 && !busy && state !== 'failed' && (
        <button
          type="button"
          onClick={() => {
            setTyped(String(quantity))
            setTyping(true)
          }}
          className="self-start text-caption text-secondary underline underline-offset-2"
        >
          Type a total
        </button>
      )}
    </div>
  )
}

export default QuantityStepper
