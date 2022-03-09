# frozen_string_literal: true

module Admin
  class CalendarsController < AdminController
    def index
      @members = User.includes(calendar_fundraisers: :donations).members_for_season(current_season['id'])
      @completed_fundraisers = fundraisers.select(&:completed?).count
      @total = fundraisers.sum(&:total_donations)
    end

    private

    def fundraisers
      @fundraisers ||= Calendar::Fundraiser.includes(:donations).for_season(current_season['id'])
    end
  end
end
