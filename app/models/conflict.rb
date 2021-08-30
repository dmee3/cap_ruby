# frozen_string_literal: true

# == Schema Information
#
# Table name: conflicts
#
#  id         :integer          not null, primary key
#  deleted_at :datetime
#  end_date   :datetime
#  reason     :text
#  start_date :datetime
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  season_id  :integer
#  status_id  :integer
#  user_id    :integer
#
# Indexes
#
#  index_conflicts_on_season_id  (season_id)
#  index_conflicts_on_status_id  (status_id)
#  index_conflicts_on_user_id    (user_id)
#
class Conflict < ApplicationRecord
  acts_as_paranoid

  belongs_to :user
  belongs_to :conflict_status, foreign_key: :status_id
  alias_attribute :status, :conflict_status
  belongs_to :season

  validates :end_date, presence: true
  validates :reason, presence: true
  validates :season_id, presence: true
  validates :start_date, presence: true
  validates :status_id, presence: true
  validates :user_id, presence: true

  scope :for_season, ->(season_id) { where(season_id: season_id) }
  scope :future_conflicts, -> { where('end_date > ?', Date.yesterday) }
  scope :past_conflicts, -> { where('end_date < ?', Date.today) }
  scope :with_status, ->(status_id) { where(conflict_status: status_id) }
  scope :without_status, ->(status_id) { where.not(conflict_status: status_id) }
end
