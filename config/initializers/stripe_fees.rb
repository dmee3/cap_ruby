# frozen_string_literal: true

# Single source of truth for the card-processing fee added to member dues
# payments. The member's full `amount` should land on their dues, so the fee is
# grossed up on top: total = amount / (1 - RATE) + FLAT.
#
# Mirrored in app/javascript/utilities/stripe_fees.ts — keep the two in sync.
module StripeFees
  RATE = 0.03        # processor markup (approximates Stripe's 2.9% + rounding headroom)
  FLAT_CENTS = 30    # per-transaction flat fee

  module_function

  # Total to charge the card, in integer cents, so that `amount_cents` nets to dues.
  def total_cents(amount_cents)
    ((amount_cents / (1 - RATE)) + FLAT_CENTS).round
  end

  # The fee portion, in integer cents.
  def fee_cents(amount_cents)
    total_cents(amount_cents) - amount_cents
  end
end
