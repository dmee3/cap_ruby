import React, { useEffect, useMemo, useState } from 'react'
import AlertBanner from '../../components/AlertBanner'
import EmptyState from '../../components/EmptyState'
import Pill, { PillTone } from '../../components/Pill'
import Skeleton from '../../components/Skeleton'
import SortableTh, { SortDir } from '../../components/SortableTh'
import Button from '../../components/Button'
import { dollars } from '../../../utilities/money'

type RosterRow = {
  id: number
  full_name: string
  email: string
  section: string | null
  ensemble: string | null
  role: string | null
  vet: boolean
  season_count: number
  has_schedule: boolean
}

type OffRosterRow = {
  id: number
  full_name: string
  email: string
  paid_all_time_cents: number
}

type Population = 'members' | 'staff'
type Status = 'loading' | 'ready' | 'error'

const ROLE_TONE: Record<string, PillTone> = {
  admin: 'danger',
  coordinator: 'neutral',
  staff: 'success',
  member: 'neutral',
}

// /admin/users. One table with a Members/Staff switch, replacing two
// side-by-side tables that had no states and no pagination.
const UserTable = ({ seasonYear }: { seasonYear: string }) => {
  const offRoster = new URLSearchParams(window.location.search).get('roster') === 'none'

  const [status, setStatus] = useState<Status>('loading')
  const [rows, setRows] = useState<RosterRow[]>([])
  const [stranded, setStranded] = useState<OffRosterRow[]>([])
  const [population, setPopulation] = useState<Population>('members')
  const [query, setQuery] = useState('')
  const [ensemble, setEnsemble] = useState('')
  const [sortKey, setSortKey] = useState<string>('section')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [dismissed, setDismissed] = useState(false)
  const [limit, setLimit] = useState(20)

  const load = () => {
    setStatus('loading')
    const url = offRoster ? '/api/admin/users?roster=none' : '/api/admin/users'
    fetch(url)
      .then(resp => (resp.ok ? resp.json() : Promise.reject(resp)))
      .then(data => {
        if (offRoster) setStranded(data)
        else setRows(data)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(load, [offRoster])

  const members = useMemo(() => rows.filter(r => r.role === 'member'), [rows])
  const staff = useMemo(() => rows.filter(r => r.role && r.role !== 'member'), [rows])
  const pool = population === 'members' ? members : staff

  // Ensemble belongs to the members view only — staff have no ensemble, so
  // applying it there filtered every row out while the select that would clear
  // it wasn't even rendered. Scoped rather than reset on switch, so flipping to
  // staff and back keeps the ensemble you had chosen.
  const activeEnsemble = population === 'members' ? ensemble : ''

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return pool.filter(r => {
      if (activeEnsemble && r.ensemble !== activeEnsemble) return false
      if (!q) return true
      return [r.full_name, r.email, r.section, r.ensemble, r.role]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q))
    })
  }, [pool, query, activeEnsemble])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const key = sortKey as keyof RosterRow
      const av = String(a[key] ?? '')
      const bv = String(b[key] ?? '')
      const primary = av.localeCompare(bv)
      return (primary !== 0 ? primary : a.full_name.localeCompare(b.full_name)) * dir
    })
  }, [filtered, sortKey, sortDir])

  const visible = sorted.slice(0, limit)
  const missingSchedule = members.filter(m => !m.has_schedule)
  const filtersDirty = query !== '' || activeEnsemble !== ''

  const clearFilters = () => {
    setQuery('')
    setEnsemble('')
  }

  if (offRoster) {
    return (
      <OffRosterView
        status={status}
        rows={stranded}
        seasonYear={seasonYear}
        onRetry={load}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="m-0">Roster</h1>
        <span className="text-body-sm text-secondary">
          {members.length} members · {staff.length} staff · {seasonYear} season
        </span>
        <a href="/admin/users?roster=none" className="text-body-sm font-medium text-accent-primary">
          See who&rsquo;s on no roster
        </a>
        <a
          href="/admin/users/new"
          className="ml-auto inline-flex h-9 items-center rounded-sm bg-accent-primary px-3.5 text-body-sm font-semibold text-on-brand no-underline"
        >
          Add person
        </a>
      </div>

      {!dismissed && missingSchedule.length > 0 && (
        <AlertBanner
          headline={`${missingSchedule.length} ${
            missingSchedule.length === 1 ? 'member has' : 'members have'
          } no payment schedule`}
          body="They're missing from the burndown and won't be flagged as behind."
          onDismiss={() => setDismissed(true)}
          actions={missingSchedule.slice(0, 5).map(m => ({
            label: m.full_name,
            meta: [m.ensemble, m.section].filter(Boolean).join(' / '),
            href: `/admin/users/${m.id}`,
          }))}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border-default bg-surface p-3">
        <div className="flex gap-1 rounded-sm bg-sunken p-1" role="group" aria-label="Population">
          {(['members', 'staff'] as Population[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPopulation(p)}
              aria-pressed={population === p}
              className={`h-8 rounded-sm px-3 text-body-sm font-semibold capitalize ${
                population === p ? 'bg-surface text-primary shadow-e1' : 'bg-transparent text-secondary'
              }`}
            >
              {p} · {p === 'members' ? members.length : staff.length}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label={population === 'members' ? 'Search name, section or ensemble' : 'Search name or role'}
          placeholder={population === 'members' ? 'Search name, section or ensemble' : 'Search name or role'}
          className="h-9 min-w-[200px] flex-1 rounded-sm border border-border-strong bg-surface px-2.5 text-body-sm"
        />
        {population === 'members' && (
          <select
            value={ensemble}
            onChange={e => setEnsemble(e.target.value)}
            aria-label="Filter by ensemble"
            className="h-9 rounded-sm border border-border-strong bg-surface px-2 text-body-sm"
          >
            <option value="">All ensembles</option>
            <option value="World">World</option>
            <option value="CC2">CC2</option>
          </select>
        )}
        <span className="text-body-sm text-secondary">
          {filtered.length} of {pool.length}
        </span>
        {filtersDirty && (
          <button type="button" onClick={clearFilters} className="text-body-sm text-accent-primary underline">
            Clear filters
          </button>
        )}
      </div>

      {/* overflow-hidden: the table header row and footer are full-bleed, so
          without it their square corners cover the card's radius. */}
      <div className="overflow-hidden rounded-md border border-border-default bg-surface">
        {status === 'loading' && <Skeleton rows={5} className="p-4" />}

        {status === 'error' && (
          <EmptyState
            tone="danger"
            title="Couldn't load the roster"
            body="Your filters are still set. Nothing was changed."
            action={<Button variant="secondary" onClick={load}>Try again</Button>}
          />
        )}

        {status === 'ready' && pool.length === 0 && (
          <EmptyState
            title={`No ${population} on the roster for ${seasonYear} yet`}
            body="Returning marchers keep their history, so search by name before creating a new account."
            action={
              <a
                href="/admin/users/new"
                className="inline-flex h-9 items-center rounded-sm bg-accent-primary px-3.5 text-body-sm font-semibold text-on-brand no-underline"
              >
                Add person
              </a>
            }
          />
        )}

        {status === 'ready' && pool.length > 0 && filtered.length === 0 && (
          <EmptyState
            title="No one matches those filters"
            action={
              <button type="button" onClick={clearFilters} className="text-body-sm text-accent-primary underline">
                Clear filters
              </button>
            }
          />
        )}

        {status === 'ready' && visible.length > 0 && (
          <>
            {/* Desktop table */}
            <table className="hidden w-full border-collapse md:table">
              <thead>
                <tr className="border-b border-border-default bg-sunken">
                  <SortableTh
                    sortKey="full_name"
                    label="Name"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={(k, d) => {
                      setSortKey(k)
                      setSortDir(d)
                    }}
                  />
                  {population === 'members' && (
                    <SortableTh
                      sortKey="section"
                      label="Section"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={(k, d) => {
                        setSortKey(k)
                        setSortDir(d)
                      }}
                    />
                  )}
                  <SortableTh
                    sortKey="role"
                    label="Role"
                    activeKey={sortKey}
                    activeDir={sortDir}
                    onSort={(k, d) => {
                      setSortKey(k)
                      setSortDir(d)
                    }}
                  />
                  <th className="px-4 py-2 text-right text-label text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(row => (
                  <tr key={row.id} className="border-b border-border-default last:border-0 hover:bg-sunken">
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={`/admin/users/${row.id}`} className="text-body-sm font-semibold text-accent-primary">
                          {row.full_name}
                        </a>
                        {!row.has_schedule && row.role === 'member' && (
                          <Pill tone="warning">No schedule</Pill>
                        )}
                      </div>
                      <div className="text-body-sm text-secondary">{row.email}</div>
                    </td>
                    {population === 'members' && (
                      <td className="px-4 py-2 text-body-sm text-primary">
                        <div>{row.ensemble}</div>
                        <div className="text-secondary">{row.section}</div>
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <Pill tone={ROLE_TONE[row.role ?? ''] ?? 'neutral'}>{row.role}</Pill>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a href={`/admin/users/${row.id}/edit`} className="text-body-sm font-medium text-accent-primary">
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="m-0 flex list-none flex-col gap-2 p-3 md:hidden">
              {visible.map(row => (
                <li key={row.id} className="rounded-md border border-border-default p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`/admin/users/${row.id}`} className="text-body font-semibold text-accent-primary">
                      {row.full_name}
                    </a>
                    <Pill tone={ROLE_TONE[row.role ?? ''] ?? 'neutral'} className="ml-auto">
                      {row.role}
                    </Pill>
                  </div>
                  {row.role === 'member' && (
                    <p className="m-0 mt-1 text-body-sm text-secondary">
                      {[row.ensemble, row.section].filter(Boolean).join(' / ')}
                      {row.vet ? ' · Vet' : ''}
                    </p>
                  )}
                  <p className="m-0 mt-1 text-body-sm text-secondary">{row.email}</p>
                  {!row.has_schedule && row.role === 'member' && (
                    <Pill tone="warning" className="mt-2">No schedule</Pill>
                  )}
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`/admin/users/${row.id}`}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-sm border border-border-strong text-body-sm font-semibold text-primary no-underline"
                    >
                      Open
                    </a>
                    <a
                      href={`/admin/users/${row.id}/edit`}
                      className="inline-flex h-11 flex-1 items-center justify-center rounded-sm border border-border-strong text-body-sm font-semibold text-primary no-underline"
                    >
                      Edit
                    </a>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-border-default px-4 py-2">
              <span className="text-body-sm text-secondary">
                Showing {visible.length} of {filtered.length}
              </span>
              {visible.length < filtered.length && (
                <Button variant="secondary" onClick={() => setLimit(l => l + 20)}>
                  Load 20 more
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// The one screen that deliberately ignores the season scope. These accounts
// have no seasons_users rows at all, which also means they cannot sign in.
const OffRosterView = ({
  status,
  rows,
  seasonYear,
  onRetry,
}: {
  status: Status
  rows: OffRosterRow[]
  seasonYear: string
  onRetry: () => void
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <a href="/admin/users" className="basis-full text-body-sm font-medium text-accent-primary">
        ‹ Back to the {seasonYear} roster
      </a>
      <h1 className="m-0">Off all rosters</h1>
      <span className="text-body-sm text-secondary">{rows.length} people</span>
    </div>

    <div className="rounded-md border border-border-default border-l-3 border-l-ocean bg-surface p-4">
      <p className="m-0 text-body-sm font-semibold text-primary">These accounts still exist</p>
      <p className="m-0 mt-1 text-body-sm text-secondary">
        Every season is off, so they don&rsquo;t appear on a roster, in the burndown or in triage,
        and they can&rsquo;t sign in until they&rsquo;re on a season. Their payment history is intact.
      </p>
    </div>

    <div className="overflow-hidden rounded-md border border-border-default bg-surface">
      {status === 'loading' && <Skeleton rows={3} className="p-4" />}
      {status === 'error' && (
        <EmptyState
          tone="danger"
          title="Couldn't load the list"
          action={<Button variant="secondary" onClick={onRetry}>Try again</Button>}
        />
      )}
      {status === 'ready' && rows.length === 0 && (
        <EmptyState title="Everyone is on a season" body="Nobody is sitting off every roster right now." />
      )}
      {status === 'ready' && rows.length > 0 && (
        <ul className="m-0 flex list-none flex-col p-0">
          {rows.map(row => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border-default px-4 py-3 last:border-0"
            >
              <div className="flex flex-col">
                <a href={`/admin/users/${row.id}`} className="text-body-sm font-semibold text-accent-primary">
                  {row.full_name}
                </a>
                <span className="text-body-sm text-secondary">{row.email}</span>
              </div>
              <span className="ml-auto font-mono text-body-sm text-primary">
                {dollars(row.paid_all_time_cents)} paid
              </span>
              <a href={`/admin/users/${row.id}/edit`} className="text-body-sm font-medium text-accent-primary">
                Put them on a season
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
)

export default UserTable
