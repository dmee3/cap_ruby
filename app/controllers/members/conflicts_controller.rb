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
      permitted = params.require(:conflict)
                        .permit(:reason, :start_date_date, :start_date_time, :end_date_date, :end_date_time)

      {
        start_date: combine_date_time(permitted[:start_date_date], permitted[:start_date_time]),
        end_date: combine_date_time(permitted[:end_date_date], permitted[:end_date_time]),
        reason: permitted[:reason],
        conflict_status: ConflictStatus.find_by_name('Pending'),
        season_id: current_season['id'],
        user_id: current_user.id
      }
    end

    # The form's native date + time inputs post separately; recombine them into
    # the single datetime the model stores. Returns nil (→ presence error) when
    # either half is blank or the pair doesn't parse.
    def combine_date_time(date_str, time_str)
      return nil if date_str.blank? || time_str.blank?

      Time.zone.parse("#{date_str} #{time_str}")
    rescue ArgumentError
      nil
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

    # ISO date/time strings ConflictForm's native inputs need to repopulate
    # after a failed submit. Falls back to the raw submitted params when the
    # value didn't parse into a Time (so a typo'd date isn't silently dropped).
    def conflict_form_defaults(conflict)
      submitted = params.fetch(:conflict, {})
      {
        startDate: conflict.start_date&.strftime('%Y-%m-%d') || submitted[:start_date_date],
        startTime: conflict.start_date&.strftime('%H:%M') || submitted[:start_date_time],
        endDate: conflict.end_date&.strftime('%Y-%m-%d') || submitted[:end_date_date],
        endTime: conflict.end_date&.strftime('%H:%M') || submitted[:end_date_time],
        reason: conflict.reason
      }
    end
    helper_method :conflict_row_data, :conflict_field_errors, :conflict_form_defaults
  end
end
