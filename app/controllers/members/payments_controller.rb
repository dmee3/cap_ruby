# frozen_string_literal: true

module Members
  class PaymentsController < ApplicationController
    before_action :authenticate_user!

    def new
      set_stripe_public_key
      @dues = PaymentService.member_dues_summary(current_user, current_season['id'])
      next_installment = @dues[:remaining_installments]&.first
      @owed_cents = @dues[:past_due].to_i.positive? ? @dues[:past_due] : next_installment&.dig(:amount).to_i
      @owed_due_on = next_installment&.dig(:pay_date)
      @remaining_cents = [@dues[:total] - @dues[:paid], 0].max
      render('members/payments/new')
    end

    # Landing page after the Stripe redirect. Stripe sends ?payment_intent=...
    # &redirect_status=succeeded|failed|... — the Payment row itself is written
    # by the webhook, which may not have arrived yet.
    def post_processing
      @status = params[:redirect_status]
      @intent_record = PaymentIntent.find_by(stripe_pi_id: params[:payment_intent])
      @payment =
        if @status == 'succeeded' && params[:payment_intent].present?
          Payment.find_by('notes = ?', "Stripe: #{params[:payment_intent]}")
        end
      @dues = PaymentService.member_dues_summary(current_user, current_season['id'])
    end
  end
end
