# frozen_string_literal: true

module Fundraiser
  # One performer, shaped for the date-picking and checkout screens.
  #
  # Same key names as PerformerQuery rows, so the React components take one
  # `Performer` shape whether they came from the picker's bulk payload or from
  # a single performer's own page.
  class PerformerPresenter
    def self.call(user:, season_id:)
      new(user, season_id).call
    end

    def initialize(user, season_id)
      @user = user
      @season_id = season_id
    end

    def call
      {
        token: @user.public_token,
        name: @user.full_name,
        initials: @user.initials,
        ensemble: DisplayLabels.ensemble(@user.ensemble_for(@season_id)),
        section: DisplayLabels.section(@user.section_for(@season_id)),
        raised_cents: raised_dollars * 100,
        goal_cents: Fundraiser::COMPLETE_DOLLARS * 100,
        claimed_count: claimed_dates.length,
        total_dates: Fundraiser::TOTAL_DATES,
        complete: raised_dollars >= Fundraiser::COMPLETE_DOLLARS
      }
    end

    def claimed_dates
      @claimed_dates ||= ClaimedDatesQuery.call(user_id: @user.id, season_id: @season_id)
    end

    # `donation_date` holds the bare day number and the donation for a date IS
    # that number in dollars, so summing the claimed dates gives dollars raised.
    def raised_dollars
      @raised_dollars ||= claimed_dates.sum
    end

    def dates_left
      Fundraiser::TOTAL_DATES - claimed_dates.length
    end
  end
end
