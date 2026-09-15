# frozen_string_literal: true

module Fundraiser
  # Every performer on the public picker, with the progress the page needs.
  #
  # Deliberately one query for the roster plus one grouped query for the
  # donation sums, rather than `Calendar::Fundraiser#total_donations` per
  # member. That method is `donations.sum(&:donation_date)` in Ruby, so it loads
  # every donation row for every performer — ~100 queries on the one page that
  # has to be fast on a phone over cell data.
  #
  # Units: `calendar_donations.donation_date` holds the bare day number, and the
  # donation for a date IS that number in dollars, so summing it gives dollars.
  # Everything leaves here in CENTS so the frontend's money helpers (which take
  # cents) are the only formatting path.
  class PerformerQuery
    def self.call(season_id:)
      new(season_id).call
    end

    def initialize(season_id)
      @season_id = season_id
    end

    def call
      return [] if @season_id.blank?

      members.map { |member| present(member) }
    end

    private

    def members
      User
        .members_for_season(@season_id)
        .includes(:seasons_users)
        .order(:first_name, :last_name)
    end

    # { user_id => dollars raised } for this season, in one grouped query.
    def raised_by_user
      @raised_by_user ||= Calendar::Donation
                          .where(season_id: @season_id)
                          .group(:user_id)
                          .sum(:donation_date)
    end

    # { user_id => how many of the 31 dates are claimed }, same trip shape.
    def claimed_count_by_user
      @claimed_count_by_user ||= Calendar::Donation
                                 .where(season_id: @season_id)
                                 .group(:user_id)
                                 .count
    end

    def present(member)
      raised_dollars = raised_by_user.fetch(member.id, 0)
      claimed = claimed_count_by_user.fetch(member.id, 0)

      {
        token: member.public_token,
        name: member.full_name,
        initials: member.initials,
        ensemble: DisplayLabels.ensemble(member.ensemble_for(@season_id)),
        section: DisplayLabels.section(member.section_for(@season_id)),
        raised_cents: raised_dollars * 100,
        goal_cents: Calendar::Fundraiser::TOTAL_MARCH_DATES * 100,
        claimed_count: claimed,
        total_dates: Fundraiser::TOTAL_DATES,
        complete: raised_dollars >= Calendar::Fundraiser::TOTAL_MARCH_DATES
      }
    end
  end
end
