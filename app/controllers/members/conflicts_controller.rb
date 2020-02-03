class Members::ConflictsController < ApplicationController
  before_action :logout_if_unauthorized

  def new
    # Comment out to enable conflict submission
    redirect_to(root_url)
    return

    # Uncomment to enable conflict submission
    # @conflict = Conflict.new
    # render('members/conflicts/new')
  end

  def create
    @conflict = Conflict.new(conflict_params)
    if @conflict.save
      flash[:success] = 'Conflict submitted for review.'
      ActivityLogger.log_conflict(@conflict, current_user)
      send_email
      redirect_to(root_url)
    else
      Rollbar.info('Conflict could not be submitted.', errors: @conflict.errors.full_messages)
      flash[:error] = 'Conflict could not be submitted.  Please contact a director for help.'
      redirect_to('/members/conflicts/new')
    end
  end

  private

  def send_email
    subject = "Conflict submitted by #{current_user.full_name}"
    text = <<~TEXT
      #{current_user.full_name} has submitted a conflict for #{@conflict.start_date}.\n\n
      Start: #{@conflict.start_date}\n
      End: #{@conflict.end_date}\n
      Reason: #{@conflict.reason}
    TEXT
    [ENV['EMAIL_DAN'], ENV['EMAIL_DONNIE'], ENV['EMAIL_EVAN'], ENV['EMAIL_JAMES']].each do |to|
      PostOffice.send_email(to, subject, text)
    end

  # Suppress all exceptions because it's just an email
  rescue StandardError => e
    Rollbar.error(e, user: current_user)
  end

  def conflict_params
    params.require(:conflict)
          .permit(:start_date, :end_date, :reason)
          .merge(
            conflict_status: ConflictStatus.find_by_name('Pending'),
            season_id: current_season['id'],
            user_id: current_user.id
          )
  end
end
