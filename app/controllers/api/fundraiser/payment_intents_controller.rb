# frozen_string_literal: true

module Api
  module Fundraiser
    class PaymentIntentsController < ApiController
      # An intent that hasn't been paid for yet. Anything further along is
      # finished business and its byline is already on the donation rows.
      UNPAID_STATUSES = %w[requires_payment_method requires_confirmation].freeze

      before_action :set_stripe_secret_key

      # The amount is derived from the dates, server-side. It used to be
      # `params[:total] * 100` straight from the browser and was never checked
      # against `dates` — so a crafted request could pay $1 while the webhook,
      # which reads `dates`, credited the performer $31. The dues endpoint
      # (Api::Members::PaymentIntentsController) already derives its own amount
      # for the same reason; this one was simply left behind.
      #
      # No fee is added. Sponsoring the 17th costs exactly $17: StripeFees is
      # for member dues, and a donor pays the bare sum of the dates they picked.
      def create
        return render_error('Pick at least one date.') if dates.empty?

        taken = already_claimed
        return render_claimed(taken) if taken.any?

        payment_intent = Stripe::PaymentIntent.create(
          amount: dates.sum * 100,
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            charge_type: 'calendar',
            dates: dates.join(','),
            donor_name: donor_name,
            member_id: performer.id
          }
        )

        render json: {
          clientSecret: payment_intent['client_secret'],
          paymentIntentId: payment_intent['id']
        }
      end

      # PATCH /api/fundraiser/payment_intents/:id
      #
      # The donor types their name after the Payment Element has already
      # mounted (the intent has to exist for the element to render), and the
      # webhook reads the name from the intent's metadata. So the name is
      # attached just before the card is confirmed, rather than at create time
      # when the field is still empty — otherwise every donation would be
      # recorded as anonymous.
      #
      # This endpoint is public, so it only ever writes `donor_name`, and only
      # on an intent that is still unpaid and belongs to this flow. It can't be
      # used to rewrite the dates, the amount, or a dues payment's metadata.
      def update
        intent = Stripe::PaymentIntent.retrieve(params[:id])
        return head(:not_found) unless intent[:metadata].to_h[:charge_type] == 'calendar'
        return head(:conflict) unless UNPAID_STATUSES.include?(intent[:status])

        Stripe::PaymentIntent.update(params[:id], metadata: { donor_name: donor_name })

        head :no_content
      rescue Stripe::StripeError => e
        # Not fatal: the donation still lands, just without the byline.
        Rollbar.warning(e, payment_intent: params[:id])
        head :no_content
      end

      private

      # Sanitized to the real 1..31 range and de-duplicated, so the charge can
      # never be computed from a date that doesn't exist or a repeat.
      def dates
        @dates ||= Array(params[:dates])
                   .map(&:to_i)
                   .select { |date| date.between?(1, ::Fundraiser::TOTAL_DATES) }
                   .uniq
                   .sort
      end

      def performer
        @performer ||= User.find_by!(public_token: params[:token])
      end

      # A blank name is a real choice — the donor stays anonymous — so it's
      # stored as nil rather than an empty string, and the receipt and the
      # performer's email both render "Anonymous".
      def donor_name
        params[:donor_name].presence
      end

      # Two relatives can pick the 17th at the same time. Re-checking here means
      # the collision fails before the card is charged, rather than leaving a
      # donation that has to be refunded.
      def already_claimed
        dates & ::Fundraiser::ClaimedDatesQuery.call(
          user_id: performer.id, season_id: ::Fundraiser.public_season&.id
        )
      end

      def render_error(message)
        render json: { error: message }, status: :unprocessable_entity
      end

      def render_claimed(taken)
        render json: {
          error: 'claimed',
          claimed_dates: taken,
          available_dates: dates - taken
        }, status: :conflict
      end
    end
  end
end
