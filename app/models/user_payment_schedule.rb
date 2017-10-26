class UserPaymentSchedule < ApplicationRecord
  belongs_to :user
  belongs_to :payment_schedule
end
