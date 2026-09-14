# frozen_string_literal: true

module Api
  module Fundraiser
    class PaymentIntentsController < ApiController
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

        render json: { clientSecret: payment_intent['client_secret'] }
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
