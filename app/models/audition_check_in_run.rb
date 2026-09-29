# frozen_string_literal: true

# == Schema Information
#
# Table name: audition_check_in_runs
#
#  id          :integer          not null, primary key
#  error       :text
#  finished_at :datetime
#  report      :json
#  started_at  :datetime
#  status      :string           default("queued"), not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
# One press of the audition check-in button: queued, then running in a
# background job, then succeeded with a report or failed with a reason.
class AuditionCheckInRun < ApplicationRecord
  STATUSES = %w[queued running succeeded failed].freeze

  # Past this, a run still marked in progress is assumed dead (a worker
  # restart mid-job), so it stops blocking the button.
  STALE_AFTER = 10.minutes

  validates :status, inclusion: { in: STATUSES }

  def self.latest
    order(:created_at).last
  end

  def self.in_progress
    where(status: %w[queued running]).where('created_at > ?', STALE_AFTER.ago).order(:created_at).last
  end

  def in_progress?
    status.in?(%w[queued running]) && created_at > STALE_AFTER.ago
  end

  def succeeded?
    status == 'succeeded'
  end

  def failed?
    status == 'failed' || (status.in?(%w[queued running]) && !in_progress?)
  end

  def sync_report
    AuditionCheckIn::Sync::Report.new(**report.symbolize_keys) if succeeded? && report
  end

  def error_message
    return error if status == 'failed'

    'It never finished — the background worker may have restarted. Nothing is running now; try again.' if failed?
  end
end
