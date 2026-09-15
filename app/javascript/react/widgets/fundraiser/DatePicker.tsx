import React, { useState } from 'react'
import DateGrid from '../../components/DateGrid'
import DateChip from '../../components/DateChip'
import StickyTotalBar from '../../components/StickyTotalBar'
import ProgressMeter from '../../components/ProgressMeter'
import { dollars } from '../../../utilities/money'
import { Performer } from '../../components/PerformerCard'

type DatePickerProps = {
  performer: Performer
  claimedDates: number[]
  checkoutPath: string
}

/**
 * Pick the dates to sponsor.
 *
 * The total is the only number a donor is tracking, so it lives in the summary
 * rail on desktop and pinned to the bottom of the viewport on mobile. Mobile
 * gets no chip ✕ (the canvas drew none), so the instruction line says outright
 * that tapping a tile again removes it.
 */
const DatePicker = ({ performer, claimedDates, checkoutPath }: DatePickerProps) => {
  const [selected, setSelected] = useState<number[]>([])

  const toggle = (date: number) => {
    setSelected((current) =>
      current.includes(date) ? current.filter((d) => d !== date) : [...current, date],
    )
  }

  const totalDollars = selected.reduce((sum, date) => sum + date, 0)
  const datesLeft = performer.total_dates - claimedDates.length
  const firstName = performer.name.split(' ')[0]

  const goToCheckout = () => {
    const query = new URLSearchParams({ dates: [...selected].sort((a, b) => a - b).join(',') })
    window.location.href = `${checkoutPath}?${query}`
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-7">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Square-edged and tightly inset on mobile so the 7-column grid gets
            the width it needs: tiles land at ~48px at 390px, comfortably over
            the 44px touch floor, and stay over it down to 375px. (The page
            runs full-bleed, so there is no layout gutter to cancel here.) */}
        <div className="card flex flex-col gap-4 rounded-none px-3 sm:rounded-md sm:px-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="m-0 text-[18px] font-bold leading-6 text-primary">
              Tap a date, donate that many dollars
            </h2>
          </div>

          <DateGrid
            claimed={claimedDates}
            selected={selected}
            onToggle={toggle}
            showLegend
            compact={false}
          />

          <p className="m-0 text-body-sm text-secondary">
            Small dates are small donations, and they help just as much. Three early dates buy a
            pair of sticks, and we're grateful for every one. Tap a date again to take it off.
          </p>
        </div>
      </div>

      {/* Desktop summary rail. */}
      <div className="hidden w-[320px] flex-none flex-col gap-3 lg:flex">
        <div className="card flex flex-col gap-3.5">
          <span className="card-title">Your donation</span>

          {selected.length === 0 ? (
            <p className="m-0 text-body-sm text-secondary">
              Nothing picked yet. Pick a few small dates or one big one. Either way it goes
              straight to {firstName}, and they'll know it was you.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...selected]
                .sort((a, b) => a - b)
                .map((date) => (
                  <DateChip key={date} date={date} onRemove={toggle} />
                ))}
            </div>
          )}

          <div className="border-t border-border-default" />

          <div className="flex items-end justify-between">
            <span className="text-body font-semibold text-secondary">
              {selected.length} {selected.length === 1 ? 'date' : 'dates'}
            </span>
            <span className="text-[36px] font-extrabold leading-[38px] tracking-tight text-primary">
              {dollars(totalDollars * 100)}
            </span>
          </div>

          <button
            type="button"
            disabled={selected.length === 0}
            onClick={goToCheckout}
            className="btn-primary btn-lg h-[50px] w-full"
          >
            Continue to payment
          </button>

          <p className="m-0 text-caption text-secondary">
            You'll pay exactly {dollars(totalDollars * 100)}. No fees added.
          </p>
        </div>

        <div className="card flex flex-col gap-2">
          <span className="text-body font-semibold text-primary">{firstName}'s calendar</span>
          <ProgressMeter
            raisedCents={performer.raised_cents}
            goalCents={performer.goal_cents}
          />
          {selected.length > 0 && (
            <p className="m-0 text-body-sm text-secondary">
              Your {dollars(totalDollars * 100)} would take {firstName} to{' '}
              <span className="font-mono font-bold text-primary">
                {dollars(performer.raised_cents + totalDollars * 100)} of{' '}
                {dollars(performer.goal_cents)}
              </span>
              .
            </p>
          )}
          {selected.length === 0 && (
            <p className="m-0 text-body-sm text-secondary">
              {dollars(performer.raised_cents)} of {dollars(performer.goal_cents)} raised ·{' '}
              {datesLeft} {datesLeft === 1 ? 'date' : 'dates'} left
            </p>
          )}
        </div>
      </div>

      {/* Mobile: the total rides the bottom of the viewport instead. */}
      <div className="lg:hidden">
        <StickyTotalBar selected={selected} actionLabel="Continue" onAction={goToCheckout} />
      </div>
    </div>
  )
}

export default DatePicker
