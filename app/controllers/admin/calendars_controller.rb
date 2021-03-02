class Admin::CalendarsController < ApplicationController
  before_action :logout_if_unauthorized
  before_action -> { redirect_if_not('admin') }

  def index
    @total = donations.sum(&:donation_date)
    @donations_by_person = donations.group_by { |d| d.user.full_name }
  end

  private

  def donations
    @donations ||= Calendar::Donation.all
  end
end
