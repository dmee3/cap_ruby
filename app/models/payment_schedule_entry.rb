# frozen_string_literal: true

# == Schema Information
#
# Table name: payment_schedule_entries
#
#  id                  :integer          not null, primary key
#  amount              :integer
#  deleted_at          :datetime
#  pay_date            :date
#  payment_schedule_id :integer
#
# Indexes
#
#  index_payment_schedule_entries_on_deleted_at           (deleted_at)
#  index_payment_schedule_entries_on_payment_schedule_id  (payment_schedule_id)
#
class PaymentScheduleEntry < ApplicationRecord
  acts_as_paranoid

  # with_deleted: deleting a user soft-deletes the schedule and then its
  # entries, and the restore path reads each entry's schedule to put it back.
  belongs_to :payment_schedule, -> { with_deleted }
  alias schedule payment_schedule

  scope :past_entries, -> { where('pay_date <= ?', Date.today) }
  scope :for_season, lambda { |season_id|
                       joins(:payment_schedule).where(payment_schedule: { season_id: season_id })
                     }

  def user
    payment_schedule.user
  end
end
