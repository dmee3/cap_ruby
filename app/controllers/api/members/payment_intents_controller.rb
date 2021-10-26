# frozen_string_literal: true

module Api
  module Members
    class PaymentIntentsController < Api::MembersController
      before_action :set_stripe_secret_key

      def create
        total = (params[:total].to_f * 100).to_i
        payment_intent = Stripe::PaymentIntent.create(
          amount: total,
          currency: 'usd',
          payment_method_types: ['card']
        )

        PaymentIntent.create(
          user: current_user,
          season_id: current_season['id'],
          stripe_pi_id: payment_intent['id'],
          amount: (params[:amount].to_f * 100).to_i
        )

        render json: { clientSecret: payment_intent['client_secret'] }
      end
    end
  end
end
