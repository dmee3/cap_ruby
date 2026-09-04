// Card-processing fee for member dues payments. The member's full `amount`
// lands on their dues; the fee is grossed up on top.
//
// Mirrors config/initializers/stripe_fees.rb — keep the two in sync.

export const STRIPE_FEE_RATE = 0.03
export const STRIPE_FEE_FLAT_CENTS = 30

/** Total to charge the card, in integer cents, so `amountCents` nets to dues. */
export const totalCents = (amountCents: number): number =>
  Math.round(amountCents / (1 - STRIPE_FEE_RATE) + STRIPE_FEE_FLAT_CENTS)

/** The fee portion, in integer cents. */
export const feeCents = (amountCents: number): number =>
  totalCents(amountCents) - amountCents
