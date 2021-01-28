class CalendarsController < ApplicationController
  layout 'calendar'

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
    response = charge

    if response&.id
      render :success
    else
      render :error
    end
  end

  private

  def charge
    charge = Stripe::Charge.create(
      amount: donation_params[:amount],
      currency: 'usd',
      description: 'CC21 Calendar',
      source: donation_params[:stripe_token]
    )
    return charge
  rescue StandardError => e
    Rollbar.error(e)
    logger.error e
    nil
  end

  def donation_params
    params.require(:calendar_donation).permit(:user_id, :dates, :amount, :stripe_token)
  end
end
