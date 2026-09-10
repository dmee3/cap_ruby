// Two money formats, one rule.
//
// `dollars` — headline figures: stat metrics, table amounts, chart captions,
// list rows. The canvas never shows cents in these; a wall of ".00" is noise
// when you're scanning a column.
//
// `exact` — anywhere the cents are the point: an amount being entered or
// confirmed, a fee breakdown, a member's own payment history.

export const dollars = (cents: number): string =>
  `$${Math.round(cents / 100).toLocaleString('en-US')}`

export const exact = (cents: number): string =>
  `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

/** `+$600` / `-$600` — for deltas where the direction carries meaning. */
export const signedDollars = (cents: number): string =>
  `${cents < 0 ? '-' : '+'}${dollars(Math.abs(cents))}`
