class PaymentSchedule < ApplicationRecord
  belongs_to :user
  has_many :payment_schedule_entries, dependent: :destroy
  alias_attribute :entries, :payment_schedule_entries
  belongs_to :season

  accepts_nested_attributes_for :payment_schedule_entries, reject_if: proc { |attributes| attributes[:pay_date].nil? || attributes[:amount].nil? }

  scope :for_season, ->(season_id) { where(season_id: season_id) }
end
