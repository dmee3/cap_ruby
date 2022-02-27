# frozen_string_literal: true

class CalendarsController < ApplicationController
  before_action :authenticate_user!, only: :download
  layout 'calendar'

  def index
    donations = Calendar::Donation.where(
      user_id: params[:user_id], season_id: Season.last.id
    ).map(&:donation_date)
    render json: donations, status: 200
  end

  def members
    render json: find_calendar_members, status: 200
  end

  def new
    set_stripe_public_key
    @donation = Calendar::Donation.new
  end

  def confirm_payment
    render :success
  end

  private

  def find_calendar_members
    User
      .members_for_season(Season.last.id)
      .select(:id, :first_name, :last_name)
      .order(:first_name)

    # Filter people who quit
    # members.reject do |u|
    #   [196, 202, 265, 277, 281, 282, 289].include?(u.id)
    # end
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
