# frozen_string_literal: true

class StripeController < ApplicationController
  before_action :set_stripe_secret_key
  protect_from_forgery except: :webhook

  # rubocop:disable Lint/DuplicateBranch
  def webhook
    payload = request.body.read
    endpoint_secret = ENV['STRIPE_WEBHOOK_SECRET']
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']

    event = nil
    begin
      event = Stripe::Webhook.construct_event(payload, sig_header, endpoint_secret)
    rescue JSON::ParserError => e
      # Invalid payload
      Rollbar.error(e, user: current_user)
      status 400
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      Rollbar.error(e, user: current_user)
      status 400
      return
    end
    # rubocop:enable Lint/DuplicateBranch

    # Handle the event
    case event.type
    when 'payment_intent.succeeded'
      payment_intent = event.data.object
      process_payment_intent_success(payment_intent)
    else
      Rollbar.info("Unhandled event type: #{event.type}")
    end

    head 200
  end

  private

  def process_payment_intent_success(payment_intent)
    pi_id = payment_intent['id']
    intent_record = PaymentIntent.find_by_stripe_pi_id(pi_id)

    unless intent_record
      Rollbar.info("Unknown Stripe Payment Intent Succeeded: #{pi_id}")
      return
    end

    payment = Payment.create!(
      amount: intent_record.amount,
      user_id: intent_record.user_id,
      date_paid: Date.today,
      season_id: intent_record.season_id,
      notes: "Stripe: #{pi_id}",
      payment_type: PaymentType.stripe
    )
    user = User.find(intent_record.user_id)
    ActivityLogger.log_payment(payment, user)
    EmailService.send_payment_submitted_email(payment, user)
  end
end
