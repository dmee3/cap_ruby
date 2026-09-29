# frozen_string_literal: true

# Runs the check-in sync off the request: with photos it can outlast
# Heroku's 30-second request limit.
#
# Every failure is caught and recorded on the run rather than raised,
# because a raised error is retried by Sidekiq, and a retry would quietly
# overwrite the sheet and docs again, maybe after staff had started on them.
class AuditionCheckInJob < ApplicationJob
  queue_as :default

  def perform(run_id)
    run = AuditionCheckInRun.find(run_id)
    run.update!(status: 'running', started_at: Time.current)

    report = AuditionCheckIn::Sync.call
    run.update!(status: 'succeeded', report: report.to_h, finished_at: Time.current)
  rescue AuditionCheckIn::Error => e
    run&.update!(status: 'failed', error: e.message, finished_at: Time.current)
  rescue StandardError => e
    Rails.logger.error("[AUDITION CHECK-IN] #{e.class}: #{e.message}")
    Rollbar.error(e)
    run&.update!(status: 'failed', finished_at: Time.current,
                 error: 'Something went wrong talking to Google, so the sheet and docs may be half-written. ' \
                        'Give it a minute and run it again.')
  end
end
