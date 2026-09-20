import React, { useEffect, useRef, useState } from 'react'
import Button from '../../components/Button'

export type DeleteUserData = {
  id: number
  full_name: string
  first_name: string
  deleted: boolean
  deleted_at: string | null
  roster_line: string
  removed: string[]
  stays: string[]
}

type DeleteUserPanelProps = {
  data: DeleteUserData
  csrfToken: string
}

// §4.34 destructive confirm, at the foot of /admin/users/:id/edit.
//
// Its own form, a sibling of the edit form rather than a child of it: forms
// can't nest, and a delete button inside the save form would post to whichever
// action the browser resolved first.
//
// §4.42 puts a delete where its constraint is visible and off the surface used
// for the routine job — hence the foot of the page, behind a disclosure, not a
// button next to Save.
const DeleteUserPanel = ({ data, csrfToken }: DeleteUserPanelProps) => {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)

  // Case- and whitespace-insensitive. The gate exists to make the admin stop
  // and read a name, not to test their typing.
  const matches = typed.trim().toLowerCase() === data.full_name.trim().toLowerCase()

  // Escape cancels, as it would for a dialog. Bound while the confirm is open
  // only, so it doesn't swallow Escape for the rest of the form.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      setTyped('')
      openerRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Focus the name field, never the destructive button — opening the confirm
  // and hitting Enter must not delete anyone.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (data.deleted) {
    return (
      <section className="mt-6 rounded-md border border-raspberry bg-surface p-5" role="status">
        <h2 className="mt-0 mb-1 text-body font-bold text-danger-fg">
          {data.first_name} is deleted
        </h2>
        <p className="m-0 mb-4 text-body-sm text-secondary">
          They can't sign in, and they're off every roster and report. Nothing was erased —
          restoring brings back their seasons, payment schedules, payments and conflicts as they
          were.
        </p>
        <form action={`/admin/users/${data.id}/restore`} method="post">
          <input type="hidden" name="authenticity_token" value={csrfToken} />
          <Button type="submit" variant="secondary">
            Restore {data.first_name}
          </Button>
        </form>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-md border border-border-default bg-surface p-5">
      <h2 className="mt-0 mb-1 text-body font-bold">Delete {data.first_name}</h2>
      <p className="m-0 text-body-sm text-secondary">
        {data.roster_line} Deleting is reversible, but it takes them off every screen until
        someone restores them. To take them off one season only, switch that season off above.
      </p>

      {!open && (
        <button
          ref={openerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 text-body-sm font-semibold text-danger-fg underline"
        >
          Delete this person
        </button>
      )}

      {open && (
        <div className="mt-4 border-t border-raspberry pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <List
              title={`What deleting ${data.first_name} removes`}
              items={data.removed}
              tone="danger"
            />
            <List title="What stays" items={data.stays} tone="muted" />
          </div>

          <label className="mt-4 flex flex-col gap-1">
            <span className="text-body-sm font-semibold text-primary">
              Type <span className="font-mono">{data.full_name}</span> to confirm
            </span>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              autoComplete="off"
              aria-describedby="delete-gate-hint"
              className="h-10 max-w-sm rounded-sm border border-border-strong bg-surface px-2 text-body-sm"
            />
            <span id="delete-gate-hint" className="text-body-sm text-secondary">
              {matches ? 'That matches. Delete is now enabled.' : 'Delete stays disabled until this matches.'}
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {/* The form wraps only the destructive button, so the name field
                above can't submit it by Enter while the gate is unmet. */}
            <form action={`/admin/users/${data.id}`} method="post">
              <input type="hidden" name="_method" value="delete" />
              <input type="hidden" name="authenticity_token" value={csrfToken} />
              <Button type="submit" variant="danger" disabled={!matches}>
                Delete {data.full_name}
              </Button>
            </form>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false)
                setTyped('')
                openerRef.current?.focus()
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

const List = ({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'danger' | 'muted'
}) => (
  <div>
    <h3
      className={`mt-0 mb-2 text-body-sm font-bold ${
        tone === 'danger' ? 'text-danger-fg' : 'text-primary'
      }`}
    >
      {title}
    </h3>
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {items.map(item => (
        <li key={item} className="flex gap-2 text-body-sm text-secondary">
          <span aria-hidden="true" className={tone === 'danger' ? 'text-danger-fg' : 'text-moss'}>
            {tone === 'danger' ? '×' : '✓'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default DeleteUserPanel
