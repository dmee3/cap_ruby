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

  class << self
    def future_conflicts_by_start_date(season_id, user_id = nil)
      conflicts = future_conflicts.for_season(season_id)
                                  .order(:start_date)
      conflicts = conflicts.where(user_id: user_id) if user_id.present?
      conflicts.group_by { |c| c.start_date.to_date }
    end

    def past_conflicts_by_start_date(season_id, user_id = nil)
      conflicts = past_conflicts.for_season(season_id)
                                .order(:start_date)
      conflicts = conflicts.where(user_id: user_id) if user_id.present?
      conflicts.group_by { |c| c.start_date.to_date }
    end

    def pending_conflicts(season_id, user_id = nil)
      conflicts = for_season(season_id).with_status(ConflictStatus.find_by_name('Pending'))
      user_id.present? ? conflicts.where(user_id: user_id) : conflicts
    end
  end
end
