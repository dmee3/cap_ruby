# frozen_string_literal: true

module Api
  module Members
    class PaymentIntentsController < Api::MembersController
      before_action :set_stripe_secret_key

      def create
        amount_cents = (params[:amount].to_f * 100).round
        # The fee is computed server-side; any client-sent `total` is ignored.
        total_cents = StripeFees.total_cents(amount_cents)

        payment_intent = Stripe::PaymentIntent.create(
          amount: total_cents,
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            charge_type: 'dues_payment',
            user_id: current_user.id,
            user_name: current_user.full_name
          }
        )

        PaymentIntent.create(
          user: current_user,
          season_id: current_season['id'],
          stripe_pi_id: payment_intent['id'],
          amount: amount_cents
        )

        render json: { clientSecret: payment_intent['client_secret'] }
      end
    end
  end
end
