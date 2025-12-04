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
  alias status conflict_status
  belongs_to :season

  validates :end_date, presence: true
  validates :reason, presence: true
  validates :season_id, presence: true
  validates :start_date, presence: true
  validates :status_id, presence: true
  validates :user_id, presence: true
  validate :future_dates_only, on: :create

  attr_accessor :skip_future_date_validation

  scope :for_season, ->(season_id) { where(season_id: season_id) }
  scope :future_conflicts, -> { where('end_date > ?', Date.yesterday) }
  scope :past_conflicts, -> { where('end_date < ?', Date.today) }
  scope :with_status, ->(status_id) { where(conflict_status: status_id) }
  scope :without_status, ->(status_id) { where.not(conflict_status: status_id) }

  private

  def future_dates_only
    return if skip_future_date_validation

    now = Time.current

    errors.add(:start_date, 'must be in the future') if start_date.present? && start_date <= now

    return unless end_date.present? && end_date < now

    errors.add(:end_date, 'must be in the future')
  end
end
