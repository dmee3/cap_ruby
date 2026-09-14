# frozen_string_literal: true

# The public calendar fundraiser: a donor, usually a relative arriving from a
# link someone shared, picks a performer, sponsors dates, and pays.
#
# The mechanic: the donation amount IS the date number. The 3rd is $3, the 17th
# is $17. There are 31 dates per performer, each claimable once, so a finished
# calendar is Calendar::Fundraiser::TOTAL_MARCH_DATES ($496).
#
# Unauthenticated throughout, so it inherits PublicController for the shell-free
# `public` layout. Donations themselves are written by the Stripe webhook
# (StripeController#process_calendar), never here.
class FundraiserController < PublicController
  before_action :set_performer, only: %i[show checkout]

  # GET /fundraiser — the performer picker.
  def index
    @performers = Fundraiser::PerformerQuery.call(season_id: public_season&.id)
    @season_label = season_label
  end

  # GET /fundraiser/:token — pick dates for one performer.
  # Also GET /f/:token, the short share link.
  def show
    set_stripe_public_key
    @claimed_dates = Fundraiser::ClaimedDatesQuery.call(
      user_id: @performer.id, season_id: public_season&.id
    )
    @season_label = season_label
  end

  # GET /fundraiser/:token/checkout
  def checkout
    set_stripe_public_key
    @claimed_dates = Fundraiser::ClaimedDatesQuery.call(
      user_id: @performer.id, season_id: public_season&.id
    )
    @season_label = season_label
  end

  # GET /fundraiser/thanks — where Stripe returns the donor.
  #
  # Reads the PaymentIntent rather than waiting on the webhook: the webhook is
  # a separate async request and the donor can easily land here first, so a
  # receipt built from the donation rows would sometimes have nothing to show.
  # Stripe's own data is authoritative for "what did I just pay", and the
  # webhook stays the durable writer of the donation.
  def thanks
    @receipt = Fundraiser::ReceiptQuery.call(
      payment_intent_id: params[:payment_intent],
      redirect_status: params[:redirect_status],
      season_id: public_season&.id
    )
  end

  private

  def set_performer
    @performer = User.find_by!(public_token: params[:token])
  rescue ActiveRecord::RecordNotFound
    # A stale or mistyped share link shouldn't look like a crash to someone who
    # was only trying to donate.
    redirect_to(fundraiser_path, alert: "We couldn't find that performer's calendar.")
  end
end
