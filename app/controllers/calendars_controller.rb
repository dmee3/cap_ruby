# frozen_string_literal: true

class CalendarsController < ApplicationController
  before_action :authenticate_user!, only: :download
  layout 'calendar'

  def index
    donations = Calendar::Donation.where(user_id: params[:user_id]).map(&:donation_date)
    render json: donations, status: 200
  end

  def new
    set_stripe_public_key
    @donation = Calendar::Donation.new
    @members = find_calendar_members.to_json
  end

  def download
    if current_user_role == 'member'
      img = Calendar::ImageService.generate_image(current_user.id)
      send_data img.to_datastream, type: 'image/png', disposition: 'inline'
    else
      redirect_to '/calendars/new'
    end
  end

  def create
    set_stripe_secret_key
    response = charge_card

    if response&.id
      dates = JSON.parse(donation_params[:dates])
      user_id = donation_params[:user_id]

      create_donations(response.id, dates)
      send_mail(user_id, dates, donation_params[:donor_name])

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
    nil
  end

  def find_calendar_members
    members = User
              .members_for_season(Season.last.id)
              .select(:id, :first_name, :last_name)
              .order(:first_name)

    # Filter people who quit
    members.reject do |u|
      [196, 202, 265, 277, 281, 282, 289].include?(u.id)
    end
  end

  def create_donations(charge_id, dates)
    dates.each do |date|
      Calendar::Donation.create(
        user_id: donation_params[:user_id],
        amount: donation_params[:amount],
        notes: "Stripe Payment - Charge ID: #{charge_id}",
        donation_date: date,
        donor_name: donation_params[:donor_name]
      )
    end
  end

  def send_mail(user_id, dates, donor_name)
    CalendarMailer.with(
      user_id: user_id,
      donation_dates: dates,
      donor_name: donor_name
    ).calendar_email.deliver_later
  end

  def donation_params
    params.require(:calendar_donation).permit(:user_id, :dates, :amount, :stripe_token, :donor_name)
  end
end
