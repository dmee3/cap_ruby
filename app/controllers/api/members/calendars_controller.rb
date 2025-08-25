# frozen_string_literal: true

module Api
  module Members
    class CalendarsController < Api::MembersController
      def index
        total_donations = current_calendar.total_donations
        dates = current_calendar.donations.map do |d|
          { date: d.donation_date, donor: d.donor_name }
        end

        render json: { totalDonations: total_donations, dates: dates }
      end

      private

      def current_calendar
        return @current_calendar if defined?(@current_calendar)

        all_calendars = Calendar::Fundraiser.for_user(current_user.id).for_season(current_season['id'])
        @current_calendar = all_calendars.reject(&:completed?).last ||
                            Calendar::Fundraiser.create(user_id: current_user.id,
                                                        season_id: current_season['id'])
      end
    end
  end
end
