# frozen_string_literal: true

module Fundraiser
  # What the confirmation page shows after Stripe sends the donor back.
  #
  # Reads the PaymentIntent, not the donation rows. The rows are written by
  # StripeController#process_calendar, which is a separate asynchronous request
  # that can easily arrive after the donor does, so a receipt built from the
  # rows would sometimes be empty on a successful payment. The intent carries
  # everything the receipt needs (amount, dates, donor name, card, email) and
  # Stripe is authoritative for "what did I just pay"; the webhook stays the
  # durable writer of the donation.
  #
  # Returns a status the view switches on:
  #   :succeeded — full receipt
  #   :pending   — the charge went through but we can't read it back yet;
  #                acknowledge it honestly rather than invent a receipt
  #   :failed    — nothing was charged
  class ReceiptQuery
    Result = Struct.new(
      :status, :performer, :dates, :total_cents, :donor_name, :card_brand,
      :card_last4, :email, :charged_on, keyword_init: true
    ) do
      def succeeded?
        status == :succeeded
      end

      def failed?
        status == :failed
      end

      def pending?
        status == :pending
      end

      # A blank name is a real state, not a missing value: the donor chose to
      # stay anonymous, and both the receipt and the performer's email should
      # say so plainly.
      def display_donor_name
        donor_name.presence || 'Anonymous'
      end
    end

    def self.call(payment_intent_id:, redirect_status:, season_id:)
      new(payment_intent_id, redirect_status, season_id).call
    end

    def initialize(payment_intent_id, redirect_status, season_id)
      @payment_intent_id = payment_intent_id
      @redirect_status = redirect_status
      @season_id = season_id
    end

    def call
      return Result.new(status: :failed) unless @redirect_status == 'succeeded'
      return Result.new(status: :pending) if @payment_intent_id.blank?

      intent = fetch_intent
      return Result.new(status: :pending) if intent.blank?

      build(intent)
    end

    private

    def fetch_intent
      Stripe::PaymentIntent.retrieve(
        { id: @payment_intent_id, expand: ['latest_charge'] }
      )
    rescue Stripe::StripeError => e
      # The charge itself already succeeded, so this is our problem to report,
      # not the donor's to worry about.
      Rollbar.error(e, payment_intent: @payment_intent_id)
      nil
    end

    def build(intent)
      metadata = intent[:metadata] || {}
      dates = parse_dates(metadata[:dates])
      return Result.new(status: :pending) if dates.empty?

      # `expand: ['latest_charge']` hands back a Stripe::Charge, which is a
      # StripeObject: it supports [] and method access but NOT dig, so chained
      # [] with safe navigation is what works against both a real charge and a
      # plain Hash in specs.
      charge = intent[:latest_charge]
      card = charge && charge[:payment_method_details] && charge[:payment_method_details][:card]

      Result.new(
        status: :succeeded,
        performer: performer_for(metadata[:member_id]),
        dates: dates,
        # Derived from the dates, the same way the charge itself is, so the
        # receipt can never disagree with what the dates add up to.
        total_cents: dates.sum * 100,
        donor_name: metadata[:donor_name],
        card_brand: card && card[:brand],
        card_last4: card && card[:last4],
        email: charge_email(charge) || intent[:receipt_email],
        charged_on: charge && Time.zone.at(charge[:created]).to_date
      )
    end

    # Stripe only has an email here if the Payment Element was configured to
    # collect one, so this is frequently nil (it is in sandbox by default) and
    # the receipt omits the line rather than inventing an address.
    def charge_email(charge)
      details = charge && charge[:billing_details]
      details && details[:email]
    end

    def parse_dates(raw)
      raw.to_s.split(',').map(&:to_i).select { |d| d.between?(1, Fundraiser::TOTAL_DATES) }.uniq.sort
    end

    def performer_for(member_id)
      return nil if member_id.blank?

      user = User.find_by(id: member_id)
      return nil if user.blank?

      {
        token: user.public_token,
        name: user.full_name,
        initials: user.initials,
        ensemble: DisplayLabels.ensemble(user.ensemble_for(@season_id)),
        section: DisplayLabels.section(user.section_for(@season_id)),
        raised_cents: raised_cents_for(user),
        goal_cents: Fundraiser::COMPLETE_DOLLARS * 100
      }
    end

    # Read after the fact, so this may or may not yet include the donation the
    # donor just made, depending on whether the webhook has landed. The share
    # card's "needs $X more" is therefore a floor, never an overstatement.
    def raised_cents_for(user)
      Calendar::Donation.where(user_id: user.id, season_id: @season_id).sum(:donation_date) * 100
    end
  end
end
