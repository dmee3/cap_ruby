import React from 'react'
import DuesMeter, { DuesState } from './DuesMeter'
import Pill from './Pill'

type HeaderVariant = 'on-track' | 'past-due' | 'no-schedule'

type Member360HeaderProps = {
  name: string
  username: string
  email: string
  seasonLabel: string
  /** Pills shown under the name — section, member-type, role. */
  tags: string[]
  dues: {
    paidCents: number
    totalCents: number
    expectedCents: number
    pastDueCents: number
    state: DuesState
  }
  conflictsCount: number
  variant: HeaderVariant
  /** Where the no-schedule "Set up schedule" link points. */
  scheduleHref?: string
  className?: string
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

// The landing target of every money link on the admin side. §4.12.
const Member360Header = ({
  name,
  username,
  email,
  seasonLabel,
  tags,
  dues,
  conflictsCount,
  variant,
  scheduleHref = '#',
  className = '',
}: Member360HeaderProps) => (
  <div
    className={`grid grid-cols-1 gap-6 rounded-md border border-border-default bg-surface p-5 min-[900px]:grid-cols-[minmax(0,1fr)_320px] ${className}`.trim()}
  >
    <div className="flex flex-col gap-[7px]">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[17px] font-bold ${
            variant === 'no-schedule'
              ? 'border border-border-strong text-secondary'
              : 'bg-accent-primary text-on-brand'
          }`}
          aria-hidden="true"
        >
          {initials(name) || '—'}
        </span>
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="text-[22px] font-extrabold leading-[26px] tracking-tight text-primary">
            {name}
          </span>
          <span className="font-mono text-body-sm text-secondary">@{username}</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Pill key={tag} casing="sentence">
              {tag}
            </Pill>
          ))}
        </div>
      )}

      <span className="text-caption text-secondary">{email}</span>
    </div>

    <div className="flex flex-col gap-3 min-[900px]:border-l min-[900px]:border-border-default min-[900px]:pl-6">
      {variant === 'no-schedule' ? (
        <div className="flex flex-col gap-1">
          <span className="text-h3 text-primary">No schedule yet</span>
          <span className="text-body-sm text-secondary">
            $0 collected. The meter waits for a payment schedule rather than showing a full bar.
          </span>
          <a href={scheduleHref} className="mt-1 text-body-sm font-semibold text-accent-primary">
            Set up schedule
          </a>
        </div>
      ) : (
        <DuesMeter
          paidCents={dues.paidCents}
          totalCents={dues.totalCents}
          expectedCents={dues.expectedCents}
          committedCents={dues.pastDueCents}
          committedKind="past-due"
          state={dues.state}
          wholeDollars
        />
      )}

      <div className="flex flex-col gap-0.5 border-t border-border-default pt-3.5">
        <span className="text-label uppercase text-secondary">Conflicts</span>
        <span className="text-h3 font-bold text-primary">
          {conflictsCount === 0 ? 'None this season' : `${conflictsCount} this season`}
        </span>
      </div>
    </div>
  </div>
)

export default Member360Header
