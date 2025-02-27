# frozen_string_literal: true

class CalendarsController < ApplicationController
  # before_action :authenticate_user!, only: :download
  layout 'calendar'

  def index
    fundraiser = Calendar::Fundraiser.find_or_create_incomplete_for_user(params[:user_id])
    donations = fundraiser.donations.map(&:donation_date)
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

  def donation_params
    params.require(:calendar_donation).permit(:user_id, :dates, :amount, :stripe_token, :donor_name)
  end
end
