# frozen_string_literal: true

# == Schema Information
#
# Table name: payment_schedule_entries
#
#  id                  :integer          not null, primary key
#  amount              :integer
#  pay_date            :date
#  payment_schedule_id :integer
#
# Indexes
#
#  index_payment_schedule_entries_on_payment_schedule_id  (payment_schedule_id)
#
class PaymentScheduleEntry < ApplicationRecord
  belongs_to :payment_schedule
  alias_attribute :schedule, :payment_schedule

  scope :past_entries, -> { where('pay_date < ?', Date.today) }
  scope :for_season, lambda { |season_id|
                       joins(:payment_schedule).where(payment_schedule: { season_id: season_id })
                     }

  def user
    payment_schedule.user
  end
end
