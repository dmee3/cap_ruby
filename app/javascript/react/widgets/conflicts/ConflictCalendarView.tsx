import React, { useMemo, useState } from 'react'
import '@fullcalendar/react/dist/vdom' // solves problem with Vite
import FullCalendar from '@fullcalendar/react' // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import ConflictPopover, { ConflictPopoverData } from '../../components/ConflictPopover'
import Utilities from '../../../utilities/utilities'

export type CalendarConflict = {
  id: number
  title: string
  ensemble?: string
  section?: string
  start: string
  end: string
  reason?: string
  status: { id: number; name: string }
  created_at?: string
}

type ConflictCalendarViewProps = {
  conflicts: CalendarConflict[]
  basePath: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onApprove?: (id: number) => void
  onDeny?: (id: number) => void
}

// Status tokens, mirrored from the §4.8 pill vocabulary so a chip and a pill
// for the same status never disagree.
const CHIP: Record<string, { bg: string; border: string; text: string }> = {
  Pending: { bg: '#faf1dc', border: '#d8b45a', text: '#6f5716' },
  Approved: { bg: '#eef1e4', border: '#8b9556', text: '#4a5130' },
  Denied: { bg: '#fbe9ec', border: '#cc2f44', text: '#962231' },
  Resolved: { bg: '#eceef0', border: '#b9bec4', text: '#5b6166' },
}

const initialsFor = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')

const ConflictCalendarView = ({
  conflicts,
  basePath,
  loading = false,
  error = null,
  onRetry,
  onApprove,
  onDeny,
}: ConflictCalendarViewProps) => {
  // The old calendar dropped Denied and Resolved silently, with no legend and
  // no way to see them. Same default, but now it is a visible, reversible
  // control rather than a hidden filter.
  const [showDecided, setShowDecided] = useState(false)
  const [selected, setSelected] = useState<ConflictPopoverData | null>(null)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900

  const visible = useMemo(
    () =>
      conflicts.filter(
        conflict =>
          showDecided || (conflict.status.name !== 'Denied' && conflict.status.name !== 'Resolved')
      ),
    [conflicts, showDecided]
  )

  const events = useMemo(
    () =>
      visible.map(conflict => {
        const tone = CHIP[conflict.status.name] ?? CHIP.Resolved
        return {
          id: String(conflict.id),
          // The status is named in the title, not carried by colour alone.
          title: `${conflict.title} · ${conflict.status.name}`,
          start: conflict.start,
          end: conflict.end,
          backgroundColor: tone.bg,
          borderColor: tone.border,
          textColor: tone.text,
          extendedProps: { conflict },
        }
      }),
    [visible]
  )

  if (error) {
    return (
      <div className="rounded-md border border-border-default bg-surface">
        <EmptyState
          tone="danger"
          title="We couldn't load the calendar"
          body="That's on us, not your connection. Nothing was decided, so try again."
          action={
            onRetry && (
              <Button variant="primary" size="md" fullWidthBelow={false} onClick={onRetry}>
                Try again
              </Button>
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border-default bg-surface px-4 py-3">
        <label className="flex items-center gap-2 text-body-sm text-primary">
          <input
            type="checkbox"
            checked={showDecided}
            onChange={event => setShowDecided(event.target.checked)}
            className="h-4 w-4 rounded-sm border-border-strong"
          />
          Show denied and resolved
        </label>

        <ul className="ml-auto flex flex-wrap items-center gap-3">
          {Object.keys(CHIP).map(status => (
            <li key={status} className="flex items-center gap-1.5 text-caption text-secondary">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: CHIP[status].bg, border: `1px solid ${CHIP[status].border}` }}
              />
              {status}
            </li>
          ))}
        </ul>
      </div>

      {loading && (
        <div className="h-[420px] rounded-md border border-border-default bg-sunken animate-pulse" aria-busy="true">
          <span className="sr-only">Loading calendar…</span>
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="rounded-md border border-border-default bg-surface">
          <EmptyState
            title="Nothing on the calendar"
            body={
              showDecided
                ? 'No conflicts fall in this range.'
                : 'No conflicts are waiting or approved in this range. Turn on denied and resolved to see what already happened.'
            }
          />
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="rounded-md border border-border-default bg-surface p-2">
          <FullCalendar
            events={events}
            eventClick={info => {
              info.jsEvent.preventDefault()
              const conflict = info.event.extendedProps.conflict as CalendarConflict
              setSelected({
                id: conflict.id,
                member: conflict.title,
                initials: initialsFor(conflict.title),
                ensemble: conflict.ensemble,
                section: conflict.section,
                dateLabel: `${Utilities.displayDateTimeReadable(conflict.start)} – ${Utilities.displayDateTimeReadable(
                  conflict.end
                )}`,
                status: conflict.status.name,
                reason: conflict.reason,
              })
            }}
            headerToolbar={
              isMobile
                ? { start: 'title', center: '', end: 'prev,today,next' }
                : { start: 'title', center: '', end: 'dayGridMonth,listWeek prev,today,next' }
            }
            initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
            plugins={[dayGridPlugin, listPlugin]}
            themeSystem="standard"
            height="auto"
          />
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4 sm:absolute sm:inset-auto sm:right-4 sm:top-24">
          <ConflictPopover
            conflict={selected}
            onClose={() => setSelected(null)}
            onApprove={
              onApprove &&
              (id => {
                onApprove(id)
                setSelected(null)
              })
            }
            onDeny={
              onDeny &&
              (id => {
                onDeny(id)
                setSelected(null)
              })
            }
            editHref={`${basePath}/${selected.id}/edit`}
          />
        </div>
      )}
    </div>
  )
}

export default ConflictCalendarView
