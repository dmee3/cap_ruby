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
    inventory_access: boolean
    whistleblower_recipient: boolean
    reset_sent_at: string | null
    initials: string | null
    summary: string[]
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
  // now off is staged for removal, not simply absent. A season they were
  // already removed from doesn't count: toggling it off again is a no-op, and
  // treating it as staged would offer to remove them twice.
  const initiallyOn = useMemo(
    () => new Set(data.user.seasons_users.filter(r => !r.removed).map(r => r.season_id)),
    [data.user.seasons_users]
  )

  // Seasons the person is on, oldest first, so the block can say "3rd season".
  const ordinals = useMemo(() => {
    const on = data.seasons
      .filter(s => rows[s.id] && rows[s.id]?.role !== 'removed')
      .sort((a, b) => Number(a.year) - Number(b.year))
    const map: Record<number, number> = {}
    on.forEach((s, i) => {
      map[s.id] = i + 1
    })
    return map
  }, [rows, data.seasons])

  const onCount = data.seasons.filter(s => rows[s.id] && rows[s.id]?.role !== 'removed').length

  // Both inventory gates admit admins and coordinators before they ever read
  // the flag, and they ask only about the CURRENT season — a role held in a
  // past season grants nothing today. Read off live row state, not the saved
  // record, so demoting someone to staff hands the decision back immediately
  // rather than after a save and a reload.
  const currentRole = data.current_season_id ? rows[data.current_season_id]?.role : null
  const inventoryGrantedByRole =
    currentRole === 'admin' || currentRole === 'coordinator' ? currentRole : null

  // Whistleblower reports are read by whoever the reporter picks, so the pool
  // is limited to people trusted with one of the senior roles. Unlike the
  // inventory grant this looks across every season, not the current one: the
  // point of naming a recipient is that they stay reachable after they rotate
  // off the role, and a report in flight shouldn't lose a reader at rollover.
  // Saved rows count alongside live ones: switching a season off stages it for
  // removal, and that shouldn't reach over and strip a stored recipient flag
  // before the save has even happened.
  const everHeldSeniorRole = [
    ...data.seasons.map(season => rows[season.id]?.role),
    ...data.user.seasons_users.map(r => r.role)
  ].some(role => role === 'admin' || role === 'coordinator')

  // Which seasons this save will actually create a payment schedule for.
  // ensure_payment_schedules_for_user walks EVERY member season, not just the
  // current one, and skips any that already has a schedule — so adding someone
  // to a past season on the edit screen does create one for that season.
  const schedulesToCreate = data.seasons.filter(season => {
    const row = rows[season.id]
    if (!row || row.role !== 'member') return false
    // Restoring someone keeps the schedule removal left behind, so nothing is
    // created here and the forecast would be a promise the save doesn't keep.
    if (data.user.seasons_users.find(r => r.season_id === season.id)?.removed) return false
    return !data.user.seasons_users.find(r => r.season_id === season.id)?.has_schedule
  })

  // Preview the season a schedule is actually being created for, NOT the
  // current season. On edit those differ: a 2026 member viewed during the 2027
  // season would otherwise read a 2027 forecast next to a panel promising a
  // 2026 schedule. Newest first, so a multi-season save previews the latest.
  const previewSeason = schedulesToCreate[0] ?? null
  const previewRow = previewSeason ? rows[previewSeason.id] : null
  const ensemble = previewRow?.ensemble ?? ''
  const section = previewRow?.section ?? ''
  const waiting = !ensemble || !section

  useEffect(() => {
    if (!previewSeason || waiting) {
      setForecast(null)
      return
    }
    const params = new URLSearchParams({
      season_id: String(previewSeason.id),
      ensemble,
      section,
      vet: String(previewSeason.vet),
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
  }, [previewSeason?.id, ensemble, section, waiting])


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

      {/* Same shape as AddPaymentForm: a grid with an explicit rail width
          rather than flex. `lg:w-88` generated no CSS at all (88 isn't in
          Tailwind's spacing scale, which jumps 80 -> 96), so the aside kept
          `w-full` and claimed the whole row, squeezing the form column down to
          its minimum. minmax(0,1fr) also lets the form column actually shrink
          instead of being held open by its content. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_352px]">
        <div className="flex flex-col gap-4">
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
            <section className="flex flex-wrap items-center gap-4 rounded-md border border-border-default bg-surface p-5">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-ocean text-body font-bold text-on-brand">
                {data.user.initials}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-h3 font-bold text-primary">
                  {[data.user.first_name, data.user.last_name].filter(Boolean).join(' ')}
                </span>
                {data.user.summary.length > 0 && (
                  <span className="text-body-sm text-secondary">{data.user.summary.join(' · ')}</span>
                )}
              </span>
              <a
                href={`/admin/users/${data.user.id}`}
                className="ml-auto inline-flex h-9 items-center rounded-sm border border-border-strong bg-surface px-3.5 text-body-sm font-semibold text-primary no-underline"
              >
                Open Member 360
              </a>
            </section>
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
                  hint="At least 8 characters. Set only at creation; later changes go through a reset link."
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

          {/* Neither of these is a role, and neither follows a season: both are
              grants that stay put while someone's role changes year to year. */}
          <section className="rounded-md border border-border-default bg-surface p-5">
            <h2 className="mt-0 mb-1 text-body font-bold">Access</h2>
            <p className="m-0 mb-4 text-body-sm text-secondary">
              Granted to the person, not to a role or a season.
            </p>
            <div className="flex flex-col gap-3">
              <Grant
                name="user[inventory_access]"
                label="Quartermaster"
                hint="Can open inventory and adjust counts, whatever their role is."
                defaultChecked={data.user.inventory_access}
                lockedReason={
                  inventoryGrantedByRole &&
                  `Not editable: their ${inventoryGrantedByRole} role this season already grants this. Change the role to Staff or Member to decide it here.`
                }
              />
              <Grant
                name="user[whistleblower_recipient]"
                label="Receives whistleblower reports"
                hint="Appears in the picker on the report form. Reports go to at least three people, so this needs at least three."
                defaultChecked={data.user.whistleblower_recipient}
                lockedReason={
                  everHeldSeniorRole
                    ? null
                    : 'Not editable: reports go to admins and coordinators. Give them one of those roles in any season to decide it here.'
                }
              />
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          {/* Three fixed steps that hold for any combination of seasons, rather
              than a sentence per toggle state. The schedule step names the
              seasons it will actually create one for, since that's the only
              part that varies in a way the admin can't see elsewhere. */}
          <section className="rounded-md border border-border-default bg-surface p-5">
            <h2 className="mt-0 mb-1 text-body font-bold">What happens when you save</h2>
            <ol className="m-0 flex list-decimal flex-col gap-3 pl-5">
              <li className="text-body-sm text-primary">
                {isEdit ? 'Their details and seasons are updated.' : 'They get an account.'}
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
                {schedulesToCreate.length > 0 ? (
                  `A payment schedule is created for ${listSeasons(schedulesToCreate)}.`
                ) : (
                  <span className="text-secondary">
                    No new payment schedules. Only member seasons get one, and existing
                    schedules are never replaced.
                  </span>
                )}
              </li>
            </ol>
          </section>

          {previewSeason && (
            <SchedulePreviewPanel
              forecast={forecast}
              waiting={waiting}
              seasonYear={previewSeason.year}
            />
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
          seasons_users row goes away; payments are untouched.

          INDEXED, not `[]`. With `[]` Rack starts a new hash only when it sees
          a REPEATED key, so a group that omits `id` (a new season) swallows the
          `id` of the NEXT group, and every row shifts by one. That silently
          retargeted an existing row at the wrong season and tried to create a
          duplicate for the old one. */}
      {data.seasons
        .filter(season => rows[season.id] || initiallyOn.has(season.id))
        .map((season, index) => {
          const row = rows[season.id]
          const existing = data.user.seasons_users.find(r => r.season_id === season.id)
          const field = (name: string) => `user[seasons_users_attributes][${index}][${name}]`

          return (
            <React.Fragment key={`fields-${season.id}`}>
              {existing?.id && <input type="hidden" name={field('id')} value={existing.id} />}
              <input type="hidden" name={field('season_id')} value={season.id} />
              {row ? (
                <>
                  <input type="hidden" name={field('role')} value={row.role} />
                  <input type="hidden" name={field('ensemble')} value={row.ensemble || ''} />
                  <input type="hidden" name={field('section')} value={row.section || ''} />
                </>
              ) : (
                <input type="hidden" name={field('_destroy')} value="1" />
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

type GrantProps = {
  name: string
  label: string
  hint: string
  defaultChecked: boolean
  // Why this grant isn't the admin's to set right now, if it isn't. A grant
  // locks either because the role already confers it or because the role can't
  // hold it; both read the same to the admin, so the reason is just a sentence.
  lockedReason?: string | null
}

const Grant = ({ name, label, hint, defaultChecked, lockedReason }: GrantProps) => {
  // Shown, not editable, and the stored value is posted back untouched. A
  // disabled checkbox posts nothing, so pairing one with the hidden 0 below
  // would revoke the grant on every save of a locked user.
  if (lockedReason) {
    return (
      <div className="flex flex-col gap-1.5 rounded-sm bg-sunken p-3">
        <span className="text-body-sm font-semibold text-primary">{label}</span>
        <input type="hidden" name={name} value={defaultChecked ? '1' : '0'} />
        <span className="text-body-sm text-secondary">{hint}</span>
        <span className="text-caption text-secondary">{lockedReason}</span>
      </div>
    )
  }

  return (
    <label className="flex cursor-pointer flex-row items-start gap-3 rounded-sm bg-sunken p-3">
      {/* An unchecked checkbox posts nothing, so the hidden 0 is what makes
          revoking a grant reach the server at all. */}
      <input type="hidden" name={name} value="0" />
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="input-checkbox mt-0.5"
      />
      <span className="flex flex-col">
        <span className="text-body-sm font-semibold text-primary">{label}</span>
        <span className="text-body-sm text-secondary">{hint}</span>
      </span>
    </label>
  )
}

// "2026", "2026 and 2027", "2025, 2026 and 2027"
const listSeasons = (seasons: SeasonOption[]) => {
  const years = seasons.map(s => s.year)
  if (years.length <= 1) return years.join('')
  return `${years.slice(0, -1).join(', ')} and ${years[years.length - 1]}`
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`
}

export default UserForm
