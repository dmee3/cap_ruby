# frozen_string_literal: true

module Fundraiser
  # Which of a performer's 31 dates are already sponsored.
  #
  # Reads donations directly rather than going through
  # `Calendar::Fundraiser.find_or_create_incomplete_for_user`, which the old
  # `CalendarsController#index` used: that method CREATES a fundraiser row, so
  # every GET of the date picker wrote to the database. A crawler or a donor
  # who opened three performers left three empty fundraisers behind, which is
  # where the 52 empty rows in season 73 came from.
  #
  # Keying on donations also means the answer doesn't depend on which of a
  # performer's several fundraiser rows happens to be "current".
  class ClaimedDatesQuery
    def self.call(user_id:, season_id:)
      new(user_id, season_id).call
    end

    def initialize(user_id, season_id)
      @user_id = user_id
      @season_id = season_id
    end

    # Sorted, de-duplicated day numbers, clamped to the real 1..31 range so a
    # legacy row can't render a 32nd tile.
    def call
      return [] if @user_id.blank? || @season_id.blank?

      Calendar::Donation
        .where(user_id: @user_id, season_id: @season_id)
        .pluck(:donation_date)
        .compact
        .select { |date| date.between?(1, Fundraiser::TOTAL_DATES) }
        .uniq
        .sort
    end
  end
end
