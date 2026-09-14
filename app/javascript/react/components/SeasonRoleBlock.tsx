import React from 'react'
import Pill from './Pill'
import Toggle from './Toggle'

export type SeasonRow = {
  id?: number | null
  season_id: number
  role: string
  ensemble: string
  section: string
}

export type SeasonOption = {
  id: number
  year: string
  current: boolean
  vet: boolean
}

type SeasonRoleBlockProps = {
  season: SeasonOption
  row: SeasonRow | null
  /** Ordinal of this season among the ones the person is on: 1st, 2nd, … */
  ordinal: number | null
  roles: string[]
  ensembles: string[]
  sections: string[]
  /** True once the person had this season on when the form loaded. */
  wasOn: boolean
  onChange: (row: SeasonRow | null) => void
}

// One season, one block (design system §4.32). The toggle answers "were they in
// the org", the role segment answers "as what", and the member subpanel appears
// only when the answer is Member.
//
// All copy here is name-free and neutral: there is no pronoun field on User, so
// the canvas's "Because he's a member" cannot be built as drawn.
const SeasonRoleBlock = ({
  season,
  row,
  ordinal,
  roles,
  ensembles,
  sections,
  wasOn,
  onChange,
}: SeasonRoleBlockProps) => {
  const on = row !== null
  const staged = wasOn && !on

  const handleToggle = (checked: boolean) => {
    // Turning a season on preselects Member, so a toggled-on season can never
    // be saved with no role at all.
    onChange(
      checked
        ? { season_id: season.id, role: 'member', ensemble: '', section: '' }
        : null
    )
  }

  const update = (patch: Partial<SeasonRow>) => {
    if (row === null) return
    const next = { ...row, ...patch }
    // Ensemble and section don't apply off the member role, and a disabled
    // select submits nothing — so blank them explicitly or the old values stay
    // in the database.
    if (next.role !== 'member') {
      next.ensemble = ''
      next.section = ''
    }
    onChange(next)
  }

  const border = staged
    ? 'border-warning-fg'
    : season.current && on
      ? 'border-ocean'
      : 'border-border-default'

  const seniority = [
    ordinal ? `${ordinal}${ordinalSuffix(ordinal)} season` : null,
    season.vet ? 'Vet' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={`overflow-hidden rounded-md border bg-surface ${border}`}
      data-testid={`season-block-${season.id}`}
    >
      {/* The 3px accent strip from the design system. Arbitrary value, not
          h-0.75 — that isn't in Tailwind's spacing scale, so it generated no
          CSS and the strip rendered at zero height. The parent's
          overflow-hidden clips it, so the strip needs no radius of its own to
          keep in sync with the card's. */}
      {(season.current || staged) && on !== staged && (
        <div className={`h-[3px] ${staged ? 'bg-warning-fg' : 'bg-ocean'}`} />
      )}
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-body font-bold text-primary">{season.year}</span>
              {season.current && !staged && <Pill tone="neutral">Current season</Pill>}
              {staged && <Pill tone="warning">Will be removed on save</Pill>}
            </div>
            {on && seniority && <span className="text-body-sm text-secondary">{seniority}</span>}
            {!on && !staged && (
              <span className="text-body-sm text-secondary">Off. They weren&rsquo;t in the org that season.</span>
            )}
          </div>
          <div className="ml-auto">
            {/* A ≥44px touch target: the label row is padded to reach it. */}
            <Toggle
              checked={on}
              onChange={handleToggle}
              label={on ? 'On the roster' : 'Off the roster'}
              id={`season-toggle-${season.id}`}
              className="min-h-11"
            />
          </div>
        </div>

        {on && row && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-label text-secondary">Role this season</span>
              <div
                className="flex flex-wrap gap-1 rounded-sm bg-sunken p-1"
                role="group"
                aria-label={`Role for ${season.year}`}
              >
                {roles.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => update({ role })}
                    aria-pressed={row.role === role}
                    className={`h-8 flex-1 rounded-sm px-3 text-body-sm font-semibold capitalize ${
                      row.role === role
                        ? 'bg-surface text-primary shadow-e1'
                        : 'bg-transparent text-secondary'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {row.role === 'member' ? (
              <div className="flex flex-col gap-2 rounded-sm border border-border-default bg-sunken p-3">
                <span className="text-label text-secondary">Because they&rsquo;re a member</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-body-sm font-semibold text-primary">Ensemble</span>
                    <select
                      value={row.ensemble || ''}
                      onChange={e => update({ ensemble: e.target.value })}
                      className="h-10 rounded-sm border border-border-strong bg-surface px-2 text-body-sm"
                    >
                      <option value="">Pick an ensemble</option>
                      {ensembles.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-body-sm font-semibold text-primary">Section</span>
                    <select
                      value={row.section || ''}
                      onChange={e => update({ section: e.target.value })}
                      className="h-10 rounded-sm border border-border-strong bg-surface px-2 text-body-sm"
                    >
                      <option value="">Pick a section</option>
                      {sections.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : (
              <p className="m-0 rounded-sm border border-dashed border-border-strong p-3 text-body-sm text-secondary">
                Ensemble and section don&rsquo;t apply to {row.role}. Switch the role to Member to set them.
              </p>
            )}
          </>
        )}

        {staged && (
          <div className="flex flex-col gap-2 rounded-sm bg-warning-bg p-3">
            <span className="text-body-sm text-warning-fg">
              Saving takes them off the {season.year} roster. Their account, payment history and other
              seasons all stay.
            </span>
            <button
              type="button"
              className="self-start text-body-sm font-semibold text-accent-primary underline"
              onClick={() => handleToggle(true)}
            >
              Keep them on the roster
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const ordinalSuffix = (n: number) => {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10] || 'th'
}

export default SeasonRoleBlock
