# frozen_string_literal: true

module Members
  class ConflictsController < ApplicationController
    include ActionView::Helpers::DateHelper

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

    # Maps a list of conflicts to the row JSON MemberConflictList renders,
    # deciding once which rows include `reason` (Denied, or the single
    # next-upcoming Pending conflict) so both the submit-form context list
    # and the dashboard card (Members::DashboardController) show it the same way.
    def conflict_row_data(conflicts)
      conflicts = conflicts.to_a
      next_upcoming_id = conflicts.select { |c| c.status.name == 'Pending' && c.start_date.future? }
                                  .min_by(&:start_date)&.id

      conflicts.map do |c|
        {
          id: c.id,
          date_range_label: format_date_range(c),
          time_range_label: format_time_range(c),
          status: c.status.name,
          relative_subline: relative_subline_for(c),
          reason: c.status.name == 'Denied' || c.id == next_upcoming_id ? c.reason.to_s.truncate(80) : nil
        }.compact
      end
    end

    def format_date_range(conflict)
      start_label = conflict.start_date.strftime('%a %-m/%-d')
      return start_label if conflict.start_date.to_date == conflict.end_date.to_date

      "#{start_label} – #{conflict.end_date.strftime('%-m/%-d')}"
    end

    def format_time_range(conflict)
      return nil unless conflict.start_date.to_date == conflict.end_date.to_date

      "#{conflict.start_date.strftime('%-I:%M %p')}–#{conflict.end_date.strftime('%-I:%M %p')}"
    end

    def relative_subline_for(conflict)
      submitted = "submitted #{time_ago_in_words(conflict.created_at)} ago"
      return submitted if conflict.start_date.past?

      days = (conflict.start_date.to_date - Date.current).to_i
      when_label = days.zero? ? 'today' : "in #{days} #{'day'.pluralize(days)}"
      "#{when_label} · #{submitted}"
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
