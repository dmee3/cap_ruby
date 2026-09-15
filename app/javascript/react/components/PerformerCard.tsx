import React from 'react'
import ProgressMeter from './ProgressMeter'
import { dollars } from '../../utilities/money'

export type Performer = {
  token: string
  name: string
  initials: string
  ensemble: string | null
  section: string | null
  raised_cents: number
  goal_cents: number
  claimed_count: number
  total_dates: number
  complete: boolean
}

type PerformerCardProps = {
  performer: Performer
  compact?: boolean
}

// Avatar fills rotate so a list of cards doesn't read as one block of colour.
const AVATAR_FILLS = ['bg-ocean', 'bg-ocean-light']

const avatarFill = (performer: Performer): string => {
  if (performer.complete) return 'bg-moss-lightest text-moss-dark'

  const index = performer.token.charCodeAt(0) % AVATAR_FILLS.length
  return `${AVATAR_FILLS[index]} text-on-brand`
}

/**
 * One performer on the public picker.
 *
 * Three states, not two. A performer with progress shows how far along they
 * are; a brand new one says so rather than showing an empty bar and a $0; and
 * a finished calendar stops being tappable and reads as good news instead of a
 * dead end. That last state is also why completed performers stay in the list
 * rather than being filtered out.
 */
const PerformerCard = ({ performer, compact = false }: PerformerCardProps) => {
  const {
    token, name, initials, ensemble, section,
    raised_cents: raisedCents, goal_cents: goalCents,
    claimed_count: claimedCount, total_dates: totalDates, complete,
  } = performer

  const meta = [ensemble, section].filter(Boolean).join(' · ')
  const firstName = name.split(' ')[0]

  const status = () => {
    if (complete) {
      return (
        <span className="text-caption font-semibold text-success-fg">
          ✓ Calendar complete. All {totalDates} dates claimed.
        </span>
      )
    }

    return (
      <span className="text-caption font-medium text-secondary">
        <span className="font-mono font-bold text-primary">
          {dollars(raisedCents)} of {dollars(goalCents)}
        </span>
        {/* The count is kept even for someone just starting: the canvas swapped
            it for "just getting started" below some threshold it never
            defined, and an undefined threshold isn't buildable. */}
        {` · ${claimedCount} of ${totalDates} dates claimed`}
      </span>
    )
  }

  const body = (
    <>
      <span
        className={`flex flex-none items-center justify-center rounded-full font-bold ${
          compact ? 'h-11 w-11 text-[16px]' : 'h-[52px] w-[52px] text-[18px]'
        } ${avatarFill(performer)}`}
        aria-hidden="true"
      >
        {initials}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex flex-col gap-0.5">
          <span
            className={`font-bold ${compact ? 'text-[16px] leading-[21px]' : 'text-[18px] leading-6'} ${
              complete ? 'text-secondary' : 'text-primary'
            }`}
          >
            {name}
          </span>
          {meta && <span className="text-caption text-secondary">{meta}</span>}
        </span>

        <ProgressMeter raisedCents={raisedCents} goalCents={goalCents} compact={compact} />
        {status()}
      </span>
    </>
  )

  // A finished calendar is not a link: there is nothing left to sponsor.
  if (complete) {
    return (
      <div className={`card flex items-start gap-[14px] bg-sunken ${compact ? 'p-[14px]' : 'p-[18px]'}`}>
        {body}
      </div>
    )
  }

  return (
    <a
      href={`/fundraiser/${token}`}
      className={`card flex items-start gap-[14px] transition hover:border-[color:rgb(var(--accent-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        compact ? 'p-[14px]' : 'p-[18px]'
      }`}
    >
      {body}
    </a>
  )
}

export default PerformerCard
