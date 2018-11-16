class PaymentSchedule < ApplicationRecord
  belongs_to :user
  has_many :payment_schedule_entries, dependent: :destroy
  alias_attribute :entries, :payment_schedule_entries
  belongs_to :season

  accepts_nested_attributes_for :payment_schedule_entries, reject_if: proc { |attributes| attributes[:pay_date].nil? || attributes[:amount].nil? }

  scope :for_season, ->(season_id) { where(season_id: season_id) }

  def scheduled_to_date(day = Date.today)
    # Using ruby methods instead of AR query builder to save DB calls
    # if we've got the object loaded in memory
    past_entries = entries.select { |e| e.pay_date <= day }
    past_entries.sum(&:amount)
  end
end
