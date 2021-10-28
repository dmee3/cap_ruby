# frozen_string_literal: true

module Members
  class ConflictsController < ApplicationController
    before_action :authenticate_user!

    def new
      # Comment out to enable conflict submission
      # redirect_to(root_url)
      # return

      # Uncomment to enable conflict submission
      @conflict = Conflict.new
      render('members/conflicts/new')
    end

    def create
      @conflict = Conflict.new(conflict_params)
      if @conflict.save
        flash[:success] = 'Conflict submitted for review.'
        ActivityLogger.log_conflict(@conflict, current_user)
        EmailService.send_conflict_submitted_email(@conflict, current_user)
        redirect_to(root_url)
      else
        Rollbar.info('Conflict could not be submitted.', errors: @conflict.errors.full_messages)
        flash[:error] = 'Conflict could not be submitted.  Please contact a director for help.'
        redirect_to('/members/conflicts/new')
      end
    end

    private

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
end
