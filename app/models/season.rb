class Season < ApplicationRecord
  has_many :conflicts
  has_many :payment_schedules
  has_many :payments
  has_and_belongs_to_many :users
end
