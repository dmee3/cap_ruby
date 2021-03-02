class Admin::CalendarsController < ApplicationController
  before_action :logout_if_unauthorized
  before_action -> { redirect_if_not('admin') }

  def index
    @donations = Calendar::Donation.all.order(:created_at)
  end
end
