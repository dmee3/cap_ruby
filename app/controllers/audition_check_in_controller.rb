# frozen_string_literal: true

# Rebuilds the audition feedback sheet and docs from the check-in form, in a
# background job. Starting one is a POST that redirects back, so neither a
# crawler fetching the URL nor a refresh can start another.
class AuditionCheckInController < PublicController
  def show
    @run = AuditionCheckInRun.latest
  end

  def create
    if AuditionCheckIn::Sync.enabled? && !AuditionCheckInRun.in_progress
      run = AuditionCheckInRun.create!
      AuditionCheckInJob.perform_later(run.id)
    end

    redirect_to audition_check_in_path
  end
end
