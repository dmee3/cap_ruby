import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

export type ToastVariant = 'success' | 'error' | 'info' | 'neutral'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
  durationMs: number
}

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-moss text-on-brand',
  error: 'bg-raspberry text-on-brand',
  info: 'bg-ocean text-on-brand',
  neutral: 'bg-neutral-fg text-on-brand',
}

const DOT_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-white',
  error: 'bg-white',
  info: 'bg-white',
  neutral: 'bg-white',
}

const Toast = ({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) => {
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    if (paused) return undefined
    startedAt.current = Date.now() - elapsed
    const tick = window.setInterval(() => {
      const next = Date.now() - startedAt.current
      setElapsed(next)
      if (next >= item.durationMs) {
        window.clearInterval(tick)
        onDismiss(item.id)
      }
    }, 50)
    return () => window.clearInterval(tick)
  }, [paused, item.id, item.durationMs, onDismiss, elapsed])

  const remaining = Math.max(0, 1 - elapsed / item.durationMs)

  return (
    <div
      role="status"
      className={`overflow-hidden rounded-md shadow-e3 ${VARIANT_CLASSES[item.variant]}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[item.variant]}`} />
        <span className="flex-1 text-body-sm font-medium">{item.message}</span>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          aria-label="Dismiss"
          className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer text-lg leading-none"
        >
          &times;
        </button>
      </div>
      <div className="h-[3px] bg-white/25">
        <div className="h-full bg-white/80" style={{ width: `${remaining * 100}%` }} />
      </div>
    </div>
  )
}

const ToastHost = ({ register }: { register: (push: (t: Omit<ToastItem, 'id'>) => void) => void }) => {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  useEffect(() => {
    register((t) => {
      setItems((prev) => [...prev, { ...t, id: nextId.current++ }])
    })
  }, [register])

  const dismiss = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id))

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex w-full flex-col gap-2 p-2 md:w-96 md:p-4">
      {items.map((item) => (
        <Toast key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  )
}

let push: ((t: Omit<ToastItem, 'id'>) => void) | null = null
let mounted = false

const ensureHost = () => {
  if (mounted) return
  mounted = true
  const el = document.createElement('div')
  el.id = 'toast-root'
  document.body.appendChild(el)
  createRoot(el).render(<ToastHost register={(fn) => { push = fn }} />)
}

export const toast = (
  message: string,
  opts: { variant?: ToastVariant; durationMs?: number } = {}
) => {
  ensureHost()
  const payload = { message, variant: opts.variant ?? 'neutral', durationMs: opts.durationMs ?? 5000 }
  if (push) {
    push(payload)
  } else {
    // Host just mounted; flush on the next tick once register() has run.
    window.setTimeout(() => push?.(payload), 0)
  }
}

export default Toast
