# frozen_string_literal: true

# == Schema Information
#
# Table name: calendar_donations
#
#  id                     :integer          not null, primary key
#  amount                 :integer
#  donation_date          :integer
#  donor_name             :string
#  notes                  :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  calendar_fundraiser_id :integer
#  season_id              :integer
#  user_id                :integer
#
# Indexes
#
#  index_calendar_donations_on_calendar_fundraiser_id  (calendar_fundraiser_id)
#  index_calendar_donations_on_season_id               (season_id)
#  index_calendar_donations_on_user_id                 (user_id)
#
# Foreign Keys
#
#  calendar_fundraiser_id  (calendar_fundraiser_id => calendar_fundraisers.id)
#  season_id               (season_id => seasons.id)
#
module Calendar
  class Donation < ApplicationRecord
    belongs_to :user
    belongs_to :fundraiser, foreign_key: 'calendar_fundraiser_id', class_name: 'Fundraiser'
    validates :amount, presence: true
  end
end
