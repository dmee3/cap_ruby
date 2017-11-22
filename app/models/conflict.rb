class Conflict < ApplicationRecord
  acts_as_paranoid

  belongs_to :user
  belongs_to :conflict_status, foreign_key: :status_id
  alias_attribute :status, :conflict_status

  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :reason, presence: true
  validates :user_id, presence: true
  validates :status_id, presence: true
end
