# frozen_string_literal: true

class StripeController < ApplicationController
  before_action :set_stripe_secret_key
  protect_from_forgery except: :webhook

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
      head 400
      return
    end

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
    return unless payment_intent['metadata'].respond_to?(:charge_type)

    case payment_intent['metadata']&.charge_type
    when 'dues_payment'
      process_dues_payment(payment_intent)
    when 'calendar'
      process_calendar(payment_intent)
    end
  end

  def process_calendar(payment_intent)
    metadata = payment_intent['metadata']
    fundraiser = Calendar::Fundraiser.find_or_create_incomplete_for_user(metadata.member_id)
    metadata.dates.split(',').each do |date|
      Calendar::Donation.create(
        user_id: metadata.member_id,
        amount: date.to_i * 100,
        notes: "Stripe: #{payment_intent['id']}",
        donation_date: date.to_i,
        donor_name: metadata.donor_name,
        season_id: Season.last.id,
        calendar_fundraiser_id: fundraiser.id
      )
    end

    CalendarMailer.with(
      user_id: metadata.member_id,
      donation_dates: metadata.dates.split(',').map(&:to_i),
      donor_name: metadata.donor_name
    ).calendar_email.deliver_later
  end

  def process_dues_payment(payment_intent)
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
