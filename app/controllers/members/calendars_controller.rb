class Members::CalendarsController < ApplicationController
  before_action :logout_if_unauthorized

  def index
    @donations = Calendar::Donation.where(user_id: current_user)
    @total = @donations.sum(&:donation_date)
  end
end
