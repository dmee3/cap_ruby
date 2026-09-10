import React, { useEffect, useMemo, useRef, useState } from 'react'
import fuzzysort from 'fuzzysort'

export type ComboboxMember = {
  id: number
  name: string
  section: string
}

type MemberComboboxProps = {
  members: ComboboxMember[]
  /** Selected member id as a string, or '' for none. */
  value: string
  onChange: (id: string) => void
  id?: string
  /** Rails field name — rendered as a hidden input so a real form POST works. */
  name?: string
  error?: string
  placeholder?: string
}

const MAX_RESULTS = 8

// A real type-ahead over the season roster: an ARIA combobox backed by a
// hidden input, so the surrounding form still posts normally. fuzzysort
// matches across gaps — "esokol" finds "Elena Sokol", "vibes" finds whoever
// plays them — which a plain substring match wouldn't. It is NOT typo
// tolerant: characters still have to appear in order.
const MemberCombobox = ({
  members,
  value,
  onChange,
  id = 'member-combobox',
  name,
  error,
  placeholder = 'Search by name or section',
}: MemberComboboxProps) => {
  const selected = useMemo(
    () => members.find((m) => String(m.id) === value) ?? null,
    [members, value],
  )

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = `${id}-listbox`

  // Searching "Rae Quinn Front Ensemble / Snare" lets either half match.
  const haystack = useMemo(
    () => members.map((m) => ({ ...m, haystack: `${m.name} ${m.section}` })),
    [members],
  )

  const results = useMemo(() => {
    if (query.trim() === '') return members.slice(0, MAX_RESULTS)
    return fuzzysort
      .go(query, haystack, { key: 'haystack', limit: MAX_RESULTS, threshold: -10_000 })
      .map((r) => r.obj as ComboboxMember)
  }, [query, haystack, members])

  useEffect(() => setActive(0), [query])

  // Click-away closes without clearing the selection.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const pick = (m: ComboboxMember) => {
    onChange(String(m.id))
    setQuery('')
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i + delta + results.length) % Math.max(results.length, 1))
      return
    }
    if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault()
      pick(results[active])
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const field = error
    ? 'border-2 border-danger-fg px-[11px]'
    : 'border border-border-strong px-3'

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}

      <div
        className={`flex h-11 items-center gap-2 rounded-sm bg-surface ${field} focus-within:ring-2 focus-within:ring-offset-1`}
      >
        {selected && !open && (
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-body font-medium text-primary">{selected.name}</span>
            {selected.section && (
              <span className="truncate text-caption text-secondary">{selected.section}</span>
            )}
          </span>
        )}

        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${id}-opt-${results[active].id}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={selected && !open ? '' : placeholder}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`h-full min-w-0 flex-1 bg-transparent text-body text-primary outline-none placeholder:text-secondary ${
            selected && !open ? 'w-0 flex-none' : ''
          }`}
        />

        {selected && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
            }}
            aria-label="Clear selected member"
            className="shrink-0 text-body-sm text-secondary hover:text-primary"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-sm border border-border-default bg-surface shadow-e2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-body-sm text-secondary">
              No member matches “{query}”
            </li>
          ) : (
            results.map((m, i) => (
              <li
                key={m.id}
                id={`${id}-opt-${m.id}`}
                role="option"
                aria-selected={String(m.id) === value}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(m)
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-baseline gap-2 px-3 py-2.5 ${
                  i === active ? 'bg-sunken' : ''
                }`}
              >
                <span className="text-body-sm font-medium text-primary">{m.name}</span>
                {m.section && <span className="ml-auto text-caption text-secondary">{m.section}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export default MemberCombobox
