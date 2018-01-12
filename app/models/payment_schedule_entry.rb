class PaymentScheduleEntry < ApplicationRecord
  belongs_to :payment_schedule

  def user
    payment_schedule.user
  end

  def total_to_date
    payment_schedule.entries.where('pay_date <= ?', pay_date).sum(:amount)
  end
end
