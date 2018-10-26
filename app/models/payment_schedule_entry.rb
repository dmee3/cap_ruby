class PaymentScheduleEntry < ApplicationRecord
  belongs_to :payment_schedule

  scope :past_entries, -> { where('pay_date < ?', Date.today) }
  scope :for_season, ->(season_id) { joins(:payment_schedule).where('payment_schedules.season_id = ?', season_id) }

  def user
    payment_schedule.user
  end
end
