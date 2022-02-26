# frozen_string_literal: true

module Members
  class CalendarsController < ApplicationController
    before_action :authenticate_user!

    def index
      @donations = Calendar::Donation.where(user_id: current_user, season_id: Season.last.id)
      @total = @donations.sum(&:donation_date)
    end
  end
end
