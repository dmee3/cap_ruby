# frozen_string_literal: true
# typed: true

# Maps Conflict records to the row JSON MemberConflictList renders. Shared by
# Members::ConflictsController (submit-form context list) and
# Members::DashboardController ("Your conflicts" card) so both screens show
# the same rows the same way.
class ConflictPresenter
  extend T::Sig

  class << self
    extend T::Sig

    sig { params(conflicts: T::Enumerable[Conflict]).returns(T::Array[T::Hash[Symbol, T.untyped]]) }
    def rows_for(conflicts)
      conflicts = conflicts.to_a
      next_upcoming_id = next_upcoming_pending_id(conflicts)

      conflicts.map do |conflict|
        {
          id: conflict.id,
          date_range_label: date_range_label(conflict),
          time_range_label: time_range_label(conflict),
          status: conflict.status.name,
          relative_subline: relative_subline(conflict),
          reason: reason_for(conflict, next_upcoming_id),
          # Whether the member may still change it. Decided here, not in the
          # widget, so the row and the controller's lock agree on one rule.
          editable: conflict.status.name == 'Pending',
          edit_path: edit_path_for(conflict)
        }.compact
      end
    end

    private

    sig { params(conflict: Conflict).returns(T.nilable(String)) }
    def edit_path_for(conflict)
      return nil unless conflict.status.name == 'Pending'

      Rails.application.routes.url_helpers.edit_members_conflict_path(conflict)
    end

    sig { params(conflicts: T::Array[Conflict]).returns(T.nilable(Integer)) }
    def next_upcoming_pending_id(conflicts)
      conflicts.select { |c| c.status.name == 'Pending' && c.start_date.future? }
               .min_by(&:start_date)&.id
    end

    sig { params(conflict: Conflict, next_upcoming_id: T.nilable(Integer)).returns(T.nilable(String)) }
    def reason_for(conflict, next_upcoming_id)
      return nil unless conflict.status.name == 'Denied' || conflict.id == next_upcoming_id

      conflict.reason.to_s.truncate(80)
    end

    sig { params(conflict: Conflict).returns(String) }
    def date_range_label(conflict)
      return multi_day_label(conflict) unless single_day?(conflict)

      # Same rule Flow 2 uses for due dates: weekday inside 14 days, bare
      # M/D/YY beyond it.
      format = within_two_weeks?(conflict.start_date) ? '%a %-m/%-d' : '%-m/%-d/%y'
      conflict.start_date.strftime(format)
    end

    sig { params(conflict: Conflict).returns(String) }
    def multi_day_label(conflict)
      "#{conflict.start_date.strftime('%a %-m/%-d')} – #{conflict.end_date.strftime('%-m/%-d')}"
    end

    sig { params(conflict: Conflict).returns(T.nilable(String)) }
    def time_range_label(conflict)
      return nil unless single_day?(conflict)
      return 'all day' if all_day?(conflict)

      "#{conflict.start_date.strftime('%-I:%M %p')}–#{conflict.end_date.strftime('%-I:%M %p')}"
    end

    sig { params(conflict: Conflict).returns(T::Boolean) }
    def single_day?(conflict)
      conflict.start_date.to_date == conflict.end_date.to_date
    end

    sig { params(conflict: Conflict).returns(T::Boolean) }
    def all_day?(conflict)
      conflict.start_date.seconds_since_midnight.zero? &&
        conflict.end_date.seconds_since_midnight >= 86_340 # 23:59:00 or later
    end

    sig { params(time: T.any(Time, ActiveSupport::TimeWithZone)).returns(T::Boolean) }
    def within_two_weeks?(time)
      (time.to_date - Date.current).abs <= 14
    end

    sig { params(conflict: Conflict).returns(String) }
    def relative_subline(conflict)
      submitted = "submitted #{ActionController::Base.helpers.time_ago_in_words(conflict.created_at)} ago"
      return submitted if conflict.start_date.past?

      days = (conflict.start_date.to_date - Date.current).to_i
      when_label = days.zero? ? 'today' : "in #{days} #{'day'.pluralize(days)}"
      "#{when_label} · #{submitted}"
    end
  end
end
