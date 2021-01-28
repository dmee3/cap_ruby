class CalendarsController < ApplicationController
  layout 'calendar'

  def index
    donations = Calendar::Donation.where(user_id: params[:user_id]).map(&:id)
    render json: donations, status: 200
  end

  def new
    set_stripe_public_key
    @donation = Calendar::Donation.new
    @members = User
      .with_role(:member)
      .for_season(Season.last.id)
      .select(:id, :first_name, :last_name)
      .order(:first_name)
      .to_json
  end

  def create
    set_stripe_secret_key
    response = charge_card

    if response&.id
      create_donations(response.id)
      render :success
    else
      render :error
    end
  end

  private

  def charge_card
    Stripe::Charge.create(
      amount: donation_params[:amount],
      currency: 'usd',
      description: 'CC21 Calendar',
      source: donation_params[:stripe_token]
    )
  rescue StandardError => e
    Rollbar.error(e)
    logger.error e
    nil
  end

  def create_donations(charge_id)
    dates = JSON.parse(donation_params[:dates])
    dates.each do |date|
      Calendar::Donation.create(
        user_id: donation_params[:user_id],
        amount: donation_params[:amount],
        notes: "Stripe Payment - Charge ID: #{charge_id}",
        donation_date: date,
        donor_name: nil
      )
    end
  end

  def donation_params
    params.require(:calendar_donation).permit(:user_id, :dates, :amount, :stripe_token, :name)
  end
end
