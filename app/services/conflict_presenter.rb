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
          reason: reason_for(conflict, next_upcoming_id)
        }.compact
      end
    end

    private

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
      start_label = conflict.start_date.strftime('%a %-m/%-d')
      return start_label if conflict.start_date.to_date == conflict.end_date.to_date

      "#{start_label} – #{conflict.end_date.strftime('%-m/%-d')}"
    end

    sig { params(conflict: Conflict).returns(T.nilable(String)) }
    def time_range_label(conflict)
      return nil unless conflict.start_date.to_date == conflict.end_date.to_date

      "#{conflict.start_date.strftime('%-I:%M %p')}–#{conflict.end_date.strftime('%-I:%M %p')}"
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
