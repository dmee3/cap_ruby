import React from 'react'
import { dollars } from '../../utilities/money'
import { ordinal } from '../../utilities/ordinals'

type ReceiptProps = {
  dates: number[]
  totalCents: number
  donorName?: string | null
  cardBrand?: string | null
  cardLast4?: string | null
  email?: string | null
  chargedOn?: string | null
}

/**
 * What the donor just paid for: one row per sponsored date, a total row that
 * says *charged*, and the attribution underneath.
 *
 * No receipt number. The mockup carried one (`#CC-4192`) that had no source in
 * the app; the date plus the donor's email is what support actually needs, and
 * the Stripe payment-intent id is on the donation row for tracing.
 *
 * Deliberately plain: one row per line, no grid tricks, nothing wider than
 * 340px, because this same shape is the body of the performer's notification
 * email and has to survive in plain text.
 */
const Receipt = ({
  dates,
  totalCents,
  donorName,
  cardBrand,
  cardLast4,
  email,
  chargedOn,
}: ReceiptProps) => (
  <div className="overflow-hidden rounded-md border border-border-default bg-surface">
    <div className="flex items-baseline gap-3 border-b border-border-default px-[14px] py-3">
      <span className="card-title">Receipt</span>
      {chargedOn && (
        <span className="ml-auto font-mono text-caption text-secondary">{chargedOn}</span>
      )}
    </div>

    <div className="flex flex-col">
      {dates.map((date) => (
        <div
          key={date}
          className="flex items-center justify-between border-b border-border-default px-[14px] py-[9px]"
        >
          <span className="text-body-sm font-medium capitalize">The {ordinal(date)}</span>
          <span className="font-mono text-body-sm font-semibold">{dollars(date * 100)}</span>
        </div>
      ))}

      <div className="flex items-center justify-between bg-sunken px-[14px] py-2.5">
        <span className="text-[14px] font-bold leading-5">Total charged</span>
        <span className="font-mono text-[15px] font-bold leading-5">{dollars(totalCents)}</span>
      </div>
    </div>

    <div className="flex flex-wrap gap-x-6 gap-y-3 px-[14px] py-3">
      <span className="flex flex-col">
        <span className="card-title">From</span>
        {/* A blank name is a choice, not missing data. */}
        <span className="text-body-sm font-medium">{donorName || 'Anonymous'}</span>
      </span>

      {cardLast4 && (
        <span className="flex flex-col">
          <span className="card-title">Card</span>
          <span className="font-mono text-body-sm font-medium">
            {cardBrand ? `${cardBrand} ` : ''}•••• {cardLast4}
          </span>
        </span>
      )}

      {/* Omitted rather than faked when Stripe didn't give us an address. */}
      {email && (
        <span className="flex flex-col">
          <span className="card-title">Receipt sent to</span>
          <span className="text-body-sm font-medium">{email}</span>
        </span>
      )}
    </div>
  </div>
)

export default Receipt
