# frozen_string_literal: true

module Admin
  class CalendarsController < AdminController
    def index
      @total = donations.sum(&:donation_date)
      @donations_by_person = donations.group_by { |d| d.user.full_name }
      User.members_for_season(Season.last.id).map(&:full_name).each do |u|
        @donations_by_person[u] ||= []
      end
    end

    private

    def donations
      @donations ||= Calendar::Donation.where(season_id: Season.last.id)
    end
  end
end
