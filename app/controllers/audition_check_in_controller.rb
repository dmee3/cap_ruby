# frozen_string_literal: true

# Rebuilds the audition feedback sheet from the check-in form. The sync is a
# POST that redirects back, so neither a crawler fetching the URL nor a
# refresh of the results page can overwrite the sheet again.
class AuditionCheckInController < PublicController
  def show
    @report = AuditionCheckIn::Sync::Report.new(**flash[:check_in_report].symbolize_keys) if flash[:check_in_report]
    @error = flash[:check_in_error]
  end

  def create
    begin
      flash[:check_in_report] = AuditionCheckIn::Sync.call.to_h
    rescue AuditionCheckIn::Error => e
      flash[:check_in_error] = e.message
    rescue StandardError => e
      Rails.logger.error("[AUDITION CHECK-IN] #{e.class}: #{e.message}")
      Rollbar.error(e)
      flash[:check_in_error] = 'Something went wrong talking to Google Sheets, so the feedback tabs may be ' \
                               'half-written. Give it a minute and run it again.'
    end

    redirect_to audition_check_in_path
  end
end
