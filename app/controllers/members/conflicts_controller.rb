# frozen_string_literal: true

module Members
  class ConflictsController < ApplicationController
    before_action :authenticate_user!

    def index
      render(locals: { conflicts: member_conflicts })
    end

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
        flash[:conflict_submitted] = true
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

    def conflict_row_data(conflicts)
      ConflictPresenter.rows_for(conflicts)
    end

    # Field-level errors for ConflictForm's ValidationSummaryCard: maps
    # ActiveModel's error objects to the {field, message} shape the widget
    # expects, keyed on the attribute so each merges with the right field.
    def conflict_field_errors(conflict)
      conflict.errors.map { |error| { field: error.attribute, message: error.full_message } }
    end

    # Preformatted date/time strings ConflictForm needs to repopulate its
    # (otherwise uncontrolled, flatpickr-bound) fields after a failed submit.
    def conflict_form_defaults(conflict)
      {
        startDate: conflict.start_date&.strftime('%-m/%-d/%y'),
        startTime: conflict.start_date&.strftime('%-I:%M %p'),
        endDate: conflict.end_date&.strftime('%-m/%-d/%y'),
        endTime: conflict.end_date&.strftime('%-I:%M %p'),
        reason: conflict.reason
      }
    end
    helper_method :conflict_row_data, :conflict_field_errors, :conflict_form_defaults
  end
end
