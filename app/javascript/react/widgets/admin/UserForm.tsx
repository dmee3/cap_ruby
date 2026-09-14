import React, { useEffect, useMemo, useState } from 'react'
import SeasonRoleBlock, { SeasonOption, SeasonRow } from '../../components/SeasonRoleBlock'
import SchedulePreviewPanel, { Forecast } from '../../components/SchedulePreviewPanel'
import Button from '../../components/Button'

export type UserFormData = {
  user: {
    id: number | null
    first_name: string | null
    last_name: string | null
    username: string | null
    email: string | null
    phone: string | null
    reset_sent_at: string | null
    seasons_users: SeasonRow[]
  }
  seasons: SeasonOption[]
  errors: { field: string; message: string }[]
  current_season_id: number | null
  sections: string[]
  ensembles: string[]
  roles: string[]
}

type UserFormProps = {
  data: UserFormData
  csrfToken: string
}

// /admin/users/new and /admin/users/:id/edit. One §4.32 block per season in
// place of the old table of selects that enabled and disabled each other.
const UserForm = ({ data, csrfToken }: UserFormProps) => {
  const isEdit = data.user.id !== null
  const [rows, setRows] = useState<Record<number, SeasonRow | null>>(() => {
    const seeded: Record<number, SeasonRow | null> = {}
    data.seasons.forEach(s => {
      seeded[s.id] = data.user.seasons_users.find(r => r.season_id === s.id) ?? null
    })
    return seeded
  })
  const [forecast, setForecast] = useState<Forecast | null>(null)

  // Which seasons were on when the form loaded — a season that was on and is
  // now off is staged for removal, not simply absent.
  const initiallyOn = useMemo(
    () => new Set(data.user.seasons_users.map(r => r.season_id)),
    [data.user.seasons_users]
  )

  const currentSeason = data.seasons.find(s => s.id === data.current_season_id) ?? null
  const currentRow = currentSeason ? rows[currentSeason.id] : null

  // The preview reads the default for the *current* season only — past seasons
  // create nothing on save.
  const ensemble = currentRow?.role === 'member' ? currentRow.ensemble : ''
  const section = currentRow?.role === 'member' ? currentRow.section : ''
  const waiting = !ensemble || !section

  useEffect(() => {
    if (!currentSeason || waiting) {
      setForecast(null)
      return
    }
    const params = new URLSearchParams({
      season_id: String(currentSeason.id),
      ensemble,
      section,
      vet: String(currentSeason.vet),
    })
    let cancelled = false
    fetch(`/api/admin/schedule-forecast?${params}`)
      .then(resp => (resp.ok ? resp.json() : Promise.reject(resp)))
      .then(json => {
        if (!cancelled) setForecast(json)
      })
      .catch(() => {
        if (!cancelled) setForecast(null)
      })
    return () => {
      cancelled = true
    }
  }, [currentSeason?.id, ensemble, section, waiting])

  // Seasons the person is on, oldest first, so the block can say "3rd season".
  const ordinals = useMemo(() => {
    const on = data.seasons
      .filter(s => rows[s.id])
      .sort((a, b) => Number(a.year) - Number(b.year))
    const map: Record<number, number> = {}
    on.forEach((s, i) => {
      map[s.id] = i + 1
    })
    return map
  }, [rows, data.seasons])

  const onCount = data.seasons.filter(s => rows[s.id]).length

  // Posted as its own form so it can't be confused with saving the record.
  const sendReset = () => {
    const form = document.createElement('form')
    form.method = 'post'
    form.action = `/admin/users/${data.user.id}/send-reset`
    const token = document.createElement('input')
    token.type = 'hidden'
    token.name = 'authenticity_token'
    token.value = csrfToken
    form.appendChild(token)
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <form action={isEdit ? `/admin/users/${data.user.id}` : '/admin/users'} method="post">
      {isEdit && <input type="hidden" name="_method" value="put" />}
      <input type="hidden" name="authenticity_token" value={csrfToken} />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          {data.errors.length > 0 && (
            <div className="rounded-md border border-raspberry bg-surface p-4" role="alert">
              <p className="m-0 text-body-sm font-bold text-danger-fg">
                {data.errors.length === 1
                  ? 'One thing to fix'
                  : `${data.errors.length} things to fix`}
              </p>
              <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                {data.errors.map(err => (
                  <li key={`${err.field}-${err.message}`} className="text-body-sm text-danger-fg">
                    {err.message}
                  </li>
                ))}
              </ul>
              <p className="m-0 mt-2 text-body-sm text-secondary">
                Everything else you typed is still here, including the season roles. Nothing was
                created and no email went out.
              </p>
            </div>
          )}

          {isEdit && (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/admin/users/${data.user.id}`}
                className="text-body-sm font-semibold text-accent-primary"
              >
                Open Member 360
              </a>
            </div>
          )}

          <section className="rounded-md border border-border-default bg-surface p-5">
            <h2 className="mt-0 mb-1 text-body font-bold">Basic info</h2>
            <p className="m-0 mb-4 text-body-sm text-secondary">
              They sign in with their username or email.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="user[first_name]" defaultValue={data.user.first_name} autoFocus />
              <Field label="Last name" name="user[last_name]" defaultValue={data.user.last_name} />
              <Field label="Username" name="user[username]" defaultValue={data.user.username} mono />
              <Field label="Email" name="user[email]" defaultValue={data.user.email} type="email" />
              <Field label="Phone" name="user[phone]" defaultValue={data.user.phone} optional />
              {!isEdit && (
                <Field
                  label="Temporary password"
                  name="user[password]"
                  type="password"
                  hint="At least 8 characters. Set only at creation — later changes go through a reset link."
                />
              )}
            </div>

            {isEdit && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-sm bg-sunken p-3">
                <div className="flex flex-col">
                  <span className="text-body-sm font-semibold text-primary">Password</span>
                  <span className="text-body-sm text-secondary">
                    Only they can set this.
                    {data.user.reset_sent_at
                      ? ` Last reset link sent ${formatDate(data.user.reset_sent_at)}.`
                      : ' No reset link has been sent from here.'}
                  </span>
                </div>
                {/* A real form post, not a link — it sends mail. */}
                <button
                  type="button"
                  onClick={sendReset}
                  className="ml-auto text-body-sm font-semibold text-accent-primary underline"
                >
                  Send reset link
                </button>
              </div>
            )}
          </section>

          <section className="rounded-md border border-border-default bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-baseline gap-2">
              <h2 className="m-0 text-body font-bold">Seasons and roles</h2>
              <span className="ml-auto text-body-sm text-secondary">
                {onCount} of {data.seasons.length} seasons on
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {data.seasons.map(season => (
                <SeasonRoleBlock
                  key={season.id}
                  season={season}
                  row={rows[season.id]}
                  ordinal={ordinals[season.id] ?? null}
                  roles={data.roles}
                  ensembles={data.ensembles}
                  sections={data.sections}
                  wasOn={initiallyOn.has(season.id)}
                  onChange={row => setRows(prev => ({ ...prev, [season.id]: row }))}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-88">
          <section className="rounded-md border border-border-default bg-surface p-5">
            <h2 className="mt-0 mb-1 text-body font-bold">What happens when you save</h2>
            <p className="m-0 mb-3 text-body-sm text-secondary">
              {currentSeason ? `${currentSeason.year} only. Past seasons create nothing.` : 'Fills in as you type.'}
            </p>
            <ol className="m-0 flex list-decimal flex-col gap-3 pl-5">
              <li className="text-body-sm text-primary">
                {isEdit ? 'Their details are updated.' : 'They get an account.'}
                {!isEdit && data.user.username && (
                  <span className="text-secondary"> They sign in as {data.user.username}.</span>
                )}
              </li>
              <li className="text-body-sm text-primary">
                {isEdit ? (
                  <span className="text-secondary">No email goes out. Welcome mail is creation-only.</span>
                ) : (
                  'A welcome email goes out, inviting them to set a password.'
                )}
              </li>
              <li className="text-body-sm text-primary">
                {currentRow?.role === 'member'
                  ? 'A payment schedule is created.'
                  : 'No payment schedule — only members get one.'}
              </li>
            </ol>
          </section>

          {currentRow?.role === 'member' && (
            <SchedulePreviewPanel forecast={forecast} waiting={waiting} />
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" size="lg">
              {isEdit ? 'Save changes' : 'Create person and send welcome'}
            </Button>
            <a
              href="/admin/users"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-border-strong bg-surface px-4 text-body font-semibold text-primary no-underline"
            >
              Cancel
            </a>
          </div>
        </aside>
      </div>

      {/* Hidden inputs carry the season rows in the nested-attributes shape.
          A row that was on and is now off posts _destroy so only that
          seasons_users row goes away — payments are untouched. */}
      {data.seasons.map(season => {
        const row = rows[season.id]
        const wasOn = initiallyOn.has(season.id)
        const existing = data.user.seasons_users.find(r => r.season_id === season.id)
        if (!row && !wasOn) return null

        return (
          <React.Fragment key={`fields-${season.id}`}>
            {existing?.id && (
              <input type="hidden" name="user[seasons_users_attributes][][id]" value={existing.id} />
            )}
            <input
              type="hidden"
              name="user[seasons_users_attributes][][season_id]"
              value={season.id}
            />
            {row ? (
              <>
                <input type="hidden" name="user[seasons_users_attributes][][role]" value={row.role} />
                <input type="hidden" name="user[seasons_users_attributes][][ensemble]" value={row.ensemble || ''} />
                <input type="hidden" name="user[seasons_users_attributes][][section]" value={row.section || ''} />
              </>
            ) : (
              <input type="hidden" name="user[seasons_users_attributes][][_destroy]" value="1" />
            )}
          </React.Fragment>
        )
      })}
    </form>
  )
}

type FieldProps = {
  label: string
  name: string
  defaultValue?: string | null
  type?: string
  hint?: string
  optional?: boolean
  mono?: boolean
  autoFocus?: boolean
}

const Field = ({ label, name, defaultValue, type = 'text', hint, optional, mono, autoFocus }: FieldProps) => (
  <label className="flex flex-col gap-1">
    <span className="text-body-sm font-semibold text-primary">
      {label}
      {optional && <span className="ml-1 font-normal text-secondary">(optional)</span>}
    </span>
    <input
      type={type}
      name={name}
      defaultValue={defaultValue ?? ''}
      autoFocus={autoFocus}
      className={`h-10 rounded-sm border border-border-strong bg-surface px-2 text-body-sm ${mono ? 'font-mono' : ''}`}
    />
    {hint && <span className="text-body-sm text-secondary">{hint}</span>}
  </label>
)

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}

export default UserForm
