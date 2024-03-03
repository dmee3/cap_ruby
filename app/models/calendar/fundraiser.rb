# == Schema Information
#
# Table name: calendar_fundraisers
#
#  id         :integer          not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  season_id  :integer
#  user_id    :integer
#
# Indexes
#
#  index_calendar_fundraisers_on_season_id  (season_id)
#  index_calendar_fundraisers_on_user_id    (user_id)
#
# Foreign Keys
#
#  season_id  (season_id => seasons.id)
#  user_id    (user_id => users.id)
#
module Calendar
  class Fundraiser < ApplicationRecord
    TOTAL_MARCH_DATES = 496

    belongs_to :user
    belongs_to :season

    has_many :donations, foreign_key: 'calendar_fundraiser_id'

    scope :for_season, lambda { |sid|
      where(season_id: sid)
    }

    scope :complete_for_user, lambda { |uid|
      where(
        user_id: uid,
        season_id: Season.last.id
      ).select(&:completed?)
    }

    scope :for_user, lambda { |uid|
      where(user_id: uid)
    }

    scope :incomplete_for_user, lambda { |uid|
      where(
        user_id: uid,
        season_id: Season.last.id
      ).reject(&:completed?)
    }

    def self.find_or_create_incomplete_for_user(uid)
      latest = incomplete_for_user(uid)&.last
      return latest if latest.present?

      create(user_id: uid, season_id: Season.last.id)
    end

    def completed?
      total_donations == TOTAL_MARCH_DATES
    end

    def total_donations
      donations.sum(&:donation_date)
    end
  end
end
