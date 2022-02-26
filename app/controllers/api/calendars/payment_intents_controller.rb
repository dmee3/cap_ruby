# frozen_string_literal: true

module Api
  module Calendars
    class PaymentIntentsController < ApiController
      before_action :set_stripe_secret_key

      def create
        total = params[:total] * 100
        payment_intent = Stripe::PaymentIntent.create(
          amount: total,
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            charge_type: 'calendar',
            dates: params[:dates].map(&:to_s).join(","),
            donor_name: params[:donor_name],
            member_id: params[:member_id]
          }
        )

        render json: { clientSecret: payment_intent['client_secret'] }
      end
    end
  end
end
