# frozen_string_literal: true

module Members
  class ConflictsController < ApplicationController
    before_action :authenticate_user!

    def new
      @conflict = Conflict.new
      @existing_conflicts = member_conflicts
      if current_season.conflict_submission_open?
        render('members/conflicts/new')
      else
        render('members/conflicts/closed')
      end
    end

    def create
      unless current_season.conflict_submission_open?
        flash[:error] = 'Conflict submission is currently closed.'
        redirect_to(new_members_conflict_path)
        return
      end

      @conflict = Conflict.new(conflict_params)
      if @conflict.save
        flash[:success] = 'Conflict submitted for review.'
        ActivityLogger.log_conflict(@conflict, current_user)
        EmailService.send_conflict_submitted_email(@conflict, current_user, current_season['id'])
        redirect_to(root_url)
      else
        Rollbar.info('Conflict could not be submitted.', errors: @conflict.errors.full_messages)
        flash.now[:error] = @conflict.errors.full_messages.to_sentence
        @existing_conflicts = member_conflicts
        render('members/conflicts/new')
      end
    end

    private

    def member_conflicts
      current_user.conflicts.includes(:conflict_status).for_season(current_season['id']).order(:start_date)
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
end
