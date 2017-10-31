class PaymentSchedule < ApplicationRecord
  belongs_to :user
  has_many :payment_schedule_entries
  accepts_nested_attributes_for :payment_schedule_entries, reject_if: proc { |attributes| attributes[:pay_date].nil? || attributes[:amount].nil? }
end
