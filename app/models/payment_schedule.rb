class PaymentSchedule < ApplicationRecord
  has_many :users, through: :user_payment_schedules
  has_many :payment_schedule_entries
end
