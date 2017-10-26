class PaymentSchedule < ApplicationRecord
  belongs_to :user
  has_many :payment_schedule_entries
end
