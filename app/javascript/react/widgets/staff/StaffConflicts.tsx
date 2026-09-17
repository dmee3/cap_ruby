import React from 'react'
import EmptyState from '../../components/EmptyState'
import TriageRow, { TriageRowData } from '../../components/TriageRow'

export type StaffConflictRow = TriageRowData & {
  member: string
  section?: string
}

export type StaffConflictGroup = {
  date: string
  date_label: string
  out_count: number
  rows: StaffConflictRow[]
}

type StaffConflictsProps = {
  groups: StaffConflictGroup[]
  outCount: number
  windowLabel: string
}

const dateCount = (count: number) => `${count} ${count === 1 ? 'date' : 'dates'}`

// The read-only sibling of the coordinator triage dashboard: same hero and the
// same §4.19 row, grouped by the date an instructor is planning around rather
// than by the member. TriageRow renders no action cluster when it is handed no
// decision callbacks, which is the whole of the read-only treatment — a staff
// member sees where a conflict landed and nothing to change it with.
//
// No "All conflicts" link, though the canvas drew one: conflicts are routed
// under admin/coordinators/members only, and staff_nav is Home + Files. This
// card is the whole of a staff member's view of conflicts, so the window it
// shows is the window that exists.
const StaffConflicts = ({ groups, outCount, windowLabel }: StaffConflictsProps) => {
  const everyoneIn = outCount === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-2 border-l-[4px] border-l-accent-primary">
        <span className="text-label uppercase text-secondary">Next two weeks</span>
        <span className="text-h2 font-bold text-primary">
          {everyoneIn ? "Everyone's in" : `${outCount} ${outCount === 1 ? 'member' : 'members'} out`}
        </span>
        <span className="text-body-sm text-secondary">
          {everyoneIn
            ? 'Nobody’s out in the next two weeks. Full roster at every rehearsal.'
            : `Across ${dateCount(groups.length)}. Coordinators approve and deny; you see where things landed.`}
        </span>
      </div>

      <div className="bg-surface border border-border-default rounded-md overflow-hidden">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-border-default px-4 py-3.5">
          <span className="text-h3 text-primary">Who&rsquo;s out</span>
          <span className="text-body-sm text-secondary">{windowLabel}</span>
        </div>

        {everyoneIn ? (
          <EmptyState
            title={'Nobody’s out in the next two weeks.'}
            body="If someone submits a conflict, it shows up here as soon as they do, before a coordinator has decided on it."
          />
        ) : (
          groups.map(group => (
            <section key={group.date}>
              <div className="flex items-center gap-2.5 border-b border-border-default bg-sunken px-4 py-2">
                <span className="text-body-sm font-semibold text-primary">{group.date_label}</span>
                <span className="ml-auto text-caption text-secondary">{group.out_count} out</span>
              </div>
              <div className="divide-y divide-border-subtle">
                {group.rows.map(row => (
                  <TriageRow key={row.id} row={row} member={row.member} section={row.section} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

export default StaffConflicts
